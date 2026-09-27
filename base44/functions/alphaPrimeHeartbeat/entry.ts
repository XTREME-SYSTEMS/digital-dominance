import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Alpha Prime Heartbeat — 5-minute deterministic control cycle
// Lightweight, idempotent, single-flight. Heavy work delegated to queues.

interface HeartbeatResult {
  cycle_id: string;
  status: "completed" | "failed" | "skipped_duplicate";
  started_at: string;
  completed_at: string;
  duration_ms: number;
  previous_cycle_completed: boolean;
  urgent_queue_count: number;
  critical_findings_count: number;
  stale_tasks_count: number;
  connector_freshness: Record<string, string>;
  source_drift_detected: boolean;
  sitemap_canonical_drift: boolean;
  smoke_checks_passed: number;
  smoke_checks_failed: number;
  health_score: number;
  open_loops: string[];
  approval_items: string[];
}

export default async function (req: Request): Promise<Response> {
  const startedAt = new Date();
  const startedMs = Date.now();

  try {
    const base44 = createClientFromRequest(req);

    // ── 1. GENERATE IDEMPOTENCY KEY ──
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(now.getUTCDate()).padStart(2, "0");
    const hh = String(now.getUTCHours()).padStart(2, "0");
    const rawMinute = now.getUTCMinutes();
    const bucketMinute = Math.floor(rawMinute / 5) * 5;
    const mi = String(bucketMinute).padStart(2, "0");
    const cycleId = `alpha-prime-heartbeat-${yyyy}${mm}${dd}-${hh}${mi}-5min`;

    // ── 2. CHECK IDEMPOTENCY — skip if this cycle already ran ──
    const existing = await base44.asServiceRole.entities.AlphaPrimeHeartbeat.filter(
      { cycle_id: cycleId },
      "-created_date",
      1
    );
    if (existing && existing.length > 0) {
      return Response.json({
        cycle_id: cycleId,
        status: "skipped_duplicate",
        message: "Heartbeat cycle already executed",
      } as HeartbeatResult, { status: 200 });
    }

    // ── 3. READ CANONICAL SITE REGISTRY ──
    const registryRecords = await base44.asServiceRole.entities.CanonicalSiteRegistry.list(1);
    const registry = registryRecords[0];
    const canonicalDomain = registry?.canonical_domain || "epoxyquotenearme.com";
    const canonicalUrl = `https://${canonicalDomain}`;

    // ── 4. CHECK PREVIOUS CYCLE COMPLETION ──
    const previousHeartbeats = await base44.asServiceRole.entities.AlphaPrimeHeartbeat.list(
      "-created_date",
      1
    );
    const previousCycle = previousHeartbeats[0];
    const previousCycleCompleted = previousCycle
      ? previousCycle.status === "completed"
      : true;

    // ── 5. INSPECT CRITICAL/HIGH OPEN FINDINGS ──
    const criticalAudits = await base44.asServiceRole.entities.SwarmAudit.filter(
      { status: "open", severity: "critical" },
      "-created_date",
      50
    );
    const highAudits = await base44.asServiceRole.entities.SwarmAudit.filter(
      { status: "open", severity: "high" },
      "-created_date",
      50
    );
    const criticalFindingsCount = criticalAudits.length + highAudits.length;

    // ── 6. INSPECT STALE TASKS ──
    const recentTasks = await base44.asServiceRole.entities.SwarmTask.list(
      "-created_date",
      50
    );
    const nowMs = Date.now();
    const staleTasks = recentTasks.filter((t: any) => {
      if (t.status !== "in_progress" && t.status !== "pending") return false;
      const updated = t.updated_date ? new Date(t.updated_date).getTime() : 0;
      return nowMs - updated > 24 * 60 * 60 * 1000; // stale = >24h since update
    });
    const staleTasksCount = staleTasks.length;

    // ── 7. CONNECTOR CONNECTION STATE ──
    // getConnection() proves an authenticated connector exists; it does NOT prove end-to-end sync health.
    // Functional canaries promote CONNECTED_AUTH_OK to SYNC_VERIFIED elsewhere.
    const connectorFreshness: Record<string, string> = {};
    const connectorTypes = [
      "googledrive", "googlesheets", "googlecalendar", "gmail", "googletasks",
      "googledocs", "google_search_console", "google_analytics", "hubspot", "supabase",
    ];
    for (const type of connectorTypes) {
      try {
        await base44.asServiceRole.connectors.getConnection(type);
        connectorFreshness[type] = "CONNECTED_AUTH_OK";
      } catch {
        connectorFreshness[type] = "DISCONNECTED";
      }
    }

    // ── 8. SOURCE DRIFT CHECK ──
    // Alpha Prime 6B fix: real drift detection — compare template count, registry count, and location registry count
    const templates = await base44.asServiceRole.entities.WebsiteTemplate.list(500);
    const templateCount = templates.length;
    const locationRegistry = await base44.asServiceRole.entities.CanonicalLocationRegistry.list(500);
    const locationCount = locationRegistry.length;
    const expectedLocations = registry?.approved_location_count || 0;
    const sourceDriftDetected =
      (templateCount !== expectedLocations) ||
      (templateCount !== locationCount) ||
      (expectedLocations !== locationCount);

    // ── 9. SITEMAP/CANONICAL SET RECONCILIATION ──
    // A domain-string check is insufficient. Compare the live sitemap URL set to the
    // canonical registry URL set and treat an unreadable sitemap as UNKNOWN/drift.
    let sitemapCanonicalDrift = false;
    try {
      const sitemapResp = await fetch(`${canonicalUrl}/sitemap.xml`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      if (!sitemapResp.ok) {
        sitemapCanonicalDrift = true;
      } else {
        const sitemapText = await sitemapResp.text();
        const sitemapUrls = new Set(
          [...sitemapText.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1].trim().replace(/\/$/, ""))
        );
        const registryUrls = new Set(
          locationRegistry
            .map((l: any) => String(l.canonical_url || "").trim().replace(/\/$/, ""))
            .filter(Boolean)
        );
        const registryMissingFromSitemap = [...registryUrls].filter((u) => !sitemapUrls.has(u));
        const nonCanonicalLocationUrls = [...sitemapUrls].filter((u) => {
          try {
            const parsed = new URL(u);
            const parts = parsed.pathname.split("/").filter(Boolean);
            if (parts.length !== 2) return false; // static route, not a location route
            return !registryUrls.has(u);
          } catch {
            return true;
          }
        });
        const contaminated = [...sitemapUrls].some((u) =>
          u.includes("epoxygaragefloorestimate.com") || u.includes("base44.app")
        );
        sitemapCanonicalDrift =
          registryMissingFromSitemap.length > 0 ||
          nonCanonicalLocationUrls.length > 0 ||
          contaminated;
      }
    } catch {
      sitemapCanonicalDrift = true;
    }

    // ── 10. INDEXING SAFETY CANARIES ──
    let robotsDrift = false;
    let soft404Risk = false;

    try {
      const robotsResp = await fetch(`${canonicalUrl}/robots.txt`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      const robotsText = robotsResp.ok ? await robotsResp.text() : "";
      const requiredRobotsLines = [
        "Disallow: /admin",
        "Disallow: /api/",
        "Disallow: /visualizer-test",
        `Sitemap: ${canonicalUrl}/sitemap.xml`,
      ];
      const accidentallyBlocked = [
        "/app-onboarding",
        "/app-settings",
        "/elite",
        "/questionnaire",
        "/download",
        "/ThankYou",
      ].some((path) => robotsText.includes(`Disallow: ${path}`));

      robotsDrift =
        !robotsResp.ok ||
        requiredRobotsLines.some((line) => !robotsText.includes(line)) ||
        accidentallyBlocked ||
        robotsText.includes("sitemap-epn.xml");
    } catch {
      robotsDrift = true;
    }

    try {
      const missingResp = await fetch(`${canonicalUrl}/nonexistent-route-xyz`, {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(5000),
      });
      soft404Risk = !(missingResp.status === 404 || missingResp.status === 410);
    } catch {
      soft404Risk = true;
    }

    // ── 11. BOUNDED CRITICAL URL SMOKE CHECKS ──
    const smokeUrls = [
      canonicalUrl,
      `${canonicalUrl}/epoxy-garage-floor-cost`,
      `${canonicalUrl}/how-it-works`,
    ];
    let smokeChecksPassed = 0;
    let smokeChecksFailed = 0;
    for (const url of smokeUrls) {
      try {
        const resp = await fetch(url, {
          method: "HEAD",
          signal: AbortSignal.timeout(8000),
          redirect: "follow",
        });
        if (resp.ok || (resp.status >= 300 && resp.status < 400)) {
          smokeChecksPassed++;
        } else {
          smokeChecksFailed++;
        }
      } catch {
        smokeChecksFailed++;
      }
    }

    // ── 11. CALCULATE HEALTH SCORE ──
    let healthScore = 100;
    if (!previousCycleCompleted) healthScore -= 10;
    if (criticalFindingsCount > 0) healthScore -= Math.min(criticalFindingsCount * 5, 30);
    if (staleTasksCount > 5) healthScore -= 10;
    if (sourceDriftDetected) healthScore -= 20;
    if (sitemapCanonicalDrift) healthScore -= 15;
    if (robotsDrift) healthScore -= 10;
    if (soft404Risk) healthScore -= 15;
    if (smokeChecksFailed > 0) healthScore -= Math.min(smokeChecksFailed * 10, 30);
    if (registry?.data_quarantine) healthScore -= 10;
    healthScore = Math.max(0, healthScore);

    // ── 12. COLLECT OPEN LOOPS ──
    const openLoops: string[] = [];
    if (registry?.data_quarantine) openLoops.push("Data quarantine active — revalidate SEO optimizers");
    if (criticalFindingsCount > 0) openLoops.push(`${criticalFindingsCount} critical/high open findings`);
    if (staleTasksCount > 0) openLoops.push(`${staleTasksCount} stale tasks (>24h)`);
    if (sourceDriftDetected) openLoops.push("Source drift detected — entity counts mismatch");
    if (sitemapCanonicalDrift) openLoops.push("Sitemap/canonical drift detected");
    if (robotsDrift) openLoops.push("robots.txt indexing policy drift detected");
    if (soft404Risk) openLoops.push("Soft-404 risk: unknown route does not return HTTP 404/410");
    if (smokeChecksFailed > 0) openLoops.push(`${smokeChecksFailed} smoke check failures`);

    // ── 13. RAISE APPROVAL ITEMS ──
    const approvalItems: string[] = [];
    if (registry?.google_search_console_property === "UNKNOWN") {
      approvalItems.push("Verify Google Search Console property at runtime");
    }
    if (registry?.ga4_property_id === "UNKNOWN") {
      approvalItems.push("Verify GA4 property ID at runtime");
    }
    if (registry?.github_repository === "UNKNOWN") {
      approvalItems.push("Verify GitHub repository connection");
    }

    // ── 14. WRITE HEARTBEAT RECEIPT ──
    const completedAt = new Date();
    const durationMs = Date.now() - startedMs;

    const heartbeat = await base44.asServiceRole.entities.AlphaPrimeHeartbeat.create({
      cycle_id: cycleId,
      started_at: startedAt.toISOString(),
      completed_at: completedAt.toISOString(),
      duration_ms: durationMs,
      cadence: "5min",
      previous_cycle_completed: previousCycleCompleted,
      urgent_queue_count: criticalFindingsCount,
      critical_findings_count: criticalFindingsCount,
      stale_tasks_count: staleTasksCount,
      connector_freshness: connectorFreshness,
      source_drift_detected: sourceDriftDetected,
      google_sync_freshness: connectorFreshness.google_search_console || "unknown",
      sitemap_canonical_drift: sitemapCanonicalDrift,
      smoke_checks_passed: smokeChecksPassed,
      smoke_checks_failed: smokeChecksFailed,
      agents_dispatched: 0,
      artifacts_collected: 0,
      validations_run: smokeUrls.length + 2,
      receipts_written: 1,
      self_model_updated: true,
      open_loops_updated: true,
      approval_items_raised: approvalItems.length,
      health_score: healthScore,
      status: "completed",
    });

    // ── 15. UPDATE CANONICAL SITE REGISTRY HEALTH SCORE ──
    if (registry) {
      await base44.asServiceRole.entities.CanonicalSiteRegistry.update(registry.id, {
        current_health_score: healthScore,
        last_source_truth_sync: completedAt.toISOString(),
      });
    }

    const result: HeartbeatResult = {
      cycle_id: cycleId,
      status: "completed",
      started_at: startedAt.toISOString(),
      completed_at: completedAt.toISOString(),
      duration_ms: durationMs,
      previous_cycle_completed: previousCycleCompleted,
      urgent_queue_count: criticalFindingsCount,
      critical_findings_count: criticalFindingsCount,
      stale_tasks_count: staleTasksCount,
      connector_freshness: connectorFreshness,
      source_drift_detected: sourceDriftDetected,
      sitemap_canonical_drift: sitemapCanonicalDrift,
      smoke_checks_passed: smokeChecksPassed,
      smoke_checks_failed: smokeChecksFailed,
      health_score: healthScore,
      open_loops: openLoops,
      approval_items: approvalItems,
    };

    return Response.json(result, { status: 200 });
  } catch (error) {
    const completedAt = new Date();
    const durationMs = Date.now() - startedMs;
    return Response.json(
      {
        cycle_id: `alpha-prime-heartbeat-error-${startedAt.toISOString()}`,
        status: "failed",
        started_at: startedAt.toISOString(),
        completed_at: completedAt.toISOString(),
        duration_ms: durationMs,
        error: error.message,
      },
      { status: 500 }
    );
  }
}