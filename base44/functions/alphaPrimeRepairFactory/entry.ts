import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

// ════════════════════════════════════════════════════════════════
// alphaPrimeRepairFactory
// Reads open OptimizationGaps and creates deterministic RepairJobs
// with exact root cause, implementation plan, and specialist assignment.
// ════════════════════════════════════════════════════════════════

const SPECIALIST_MAP: Record<string, string> = {
  source_truth: 'source_parity_specialist',
  public_website: 'frontend_qa',
  security: 'security_validator',
  seo: 'seo_specialist',
  search_google: 'google_data_specialist',
  performance: 'performance_specialist',
  funnel: 'software_engineer',
  data_quality: 'data_quality_validator',
  source_parity: 'source_parity_specialist',
  swarm: 'swarm_orchestrator',
  audit_system: 'audit_validator',
  connector: 'source_parity_specialist',
  cost: 'software_engineer',
  business_outcomes: 'software_engineer',
  deployment: 'source_parity_specialist',
};

const REPAIR_TEMPLATES: Record<string, any> = {
  'SRC-GSC-001': {
    root_cause: 'GSC property is UNKNOWN in CanonicalSiteRegistry — pullSearchConsoleData has not been run or returned 403',
    implementation_plan: '1. Invoke pullSearchConsoleData function to verify GSC property at runtime. 2. If 403, verify google_search_console connector is connected. 3. Update CanonicalSiteRegistry.google_search_console_property with verified property ID.',
    postcondition_validator: 'postconditionValidator',
    acceptance_test: 'CanonicalSiteRegistry.google_search_console_property is not UNKNOWN',
    risk: 'low',
    rollback: 'Revert CanonicalSiteRegistry.google_search_console_property to UNKNOWN',
  },
  'SRC-GA4-001': {
    root_cause: 'GA4 property ID is UNKNOWN in CanonicalSiteRegistry — googleAnalytics function has not been run',
    implementation_plan: '1. Invoke googleAnalytics function to discover GA4 property deterministically. 2. Update CanonicalSiteRegistry.ga4_property_id with discovered property ID.',
    postcondition_validator: 'postconditionValidator',
    acceptance_test: 'CanonicalSiteRegistry.ga4_property_id is not UNKNOWN',
    risk: 'low',
    rollback: 'Revert CanonicalSiteRegistry.ga4_property_id to UNKNOWN',
  },
  'SRC-REPO-001': {
    root_cause: 'GitHub repository is UNKNOWN in CanonicalSiteRegistry — GitHub connector not connected',
    implementation_plan: '1. Connect GitHub API connector via request_oauth_authorization. 2. Update CanonicalSiteRegistry.github_repository with repo URL. 3. Run githubSync to verify source parity.',
    postcondition_validator: 'postconditionValidator',
    acceptance_test: 'CanonicalSiteRegistry.github_repository is not UNKNOWN',
    risk: 'medium',
    rollback: 'Revert CanonicalSiteRegistry.github_repository to UNKNOWN',
    approval_required: true,
  },
  'SRC-LOCATIONS-001': {
    root_cause: 'CanonicalLocationRegistry count does not match CanonicalSiteRegistry.approved_location_count',
    implementation_plan: '1. Compare location registry count to approved_location_count. 2. If registry > approved, update approved_location_count. 3. If approved > registry, investigate missing locations.',
    postcondition_validator: 'postconditionValidator',
    acceptance_test: 'locationCount === approved_location_count',
    risk: 'low',
    rollback: 'Revert approved_location_count to previous value',
  },
  'PARITY-COUNT-001': {
    root_cause: 'WebsiteTemplate count does not match CanonicalLocationRegistry count — duplicate or missing templates',
    implementation_plan: '1. Identify duplicate templates by canonical_url. 2. Archive the duplicate (keep the canonical). 3. Re-count templates and verify parity.',
    postcondition_validator: 'postconditionValidator',
    acceptance_test: 'templateCount === locationCount === approvedCount',
    risk: 'medium',
    rollback: 'Unarchive the archived template',
    approval_required: true,
  },
  'SWARM-FALSE-GREEN-001': {
    root_cause: 'SwarmAudit records have status=fixed but fix_result contains failure indicators — swarmOrchestrator.autoFix marks failures as fixed',
    implementation_plan: '1. Revert false-green audits to status=open. 2. Verify swarmOrchestrator.autoFix fix is deployed (checks failure indicators before setting fixed). 3. If not deployed, deploy new build.',
    postcondition_validator: 'postconditionValidator',
    acceptance_test: 'Zero SwarmAudit with status=fixed and fix_result matching failure pattern',
    risk: 'low',
    rollback: 'Re-revert audits if needed',
  },
  'WEB-404-001': {
    root_cause: 'Unknown routes return HTTP 200 from the SPA host, creating a soft-404 signal even when PageNotFound renders.',
    implementation_plan: '1. Keep PageNotFound noindex as immediate mitigation. 2. Repair host/router behavior so missing routes return HTTP 404/410. 3. Re-fetch /nonexistent-route-xyz and require HTTP 404/410 before closure.',
    postcondition_validator: 'postconditionValidator',
    acceptance_test: 'HTTP GET /nonexistent-route-xyz returns 404 or 410',
    risk: 'medium',
    rollback: 'Restore prior hosting/router configuration',
    approval_required: true,
  },
  'SEO-ROBOTS-001': {
    root_cause: 'robots.txt contains redundant crawler groups or blocks public/workflow URLs that should expose index/noindex directives to crawlers.',
    implementation_plan: '1. Keep only intentional /admin, /api/, and /visualizer-test exclusions. 2. Keep one canonical sitemap directive. 3. Verify /download is crawlable and workflow pages can expose noindex.',
    postcondition_validator: 'postconditionValidator',
    acceptance_test: 'Robots has intentional blocks only and one canonical sitemap',
    risk: 'low',
    rollback: 'Restore previous robots.txt from checkpoint',
    approval_required: true,
  },
  'SEO-SITEMAP-001': {
    root_cause: 'Live sitemap is stale relative to CanonicalLocationRegistry and published GeneratedPage records.',
    implementation_plan: '1. Regenerate sitemap from CanonicalLocationRegistry plus published GeneratedPage rows. 2. Replace the stale static sitemap. 3. Verify every registry canonical URL is present.',
    postcondition_validator: 'postconditionValidator',
    acceptance_test: 'Zero CanonicalLocationRegistry URLs missing from live sitemap',
    risk: 'low',
    rollback: 'Restore previous sitemap.xml from checkpoint',
    approval_required: true,
  },
  'DEPLOY-LIVE-001': {
    root_cause: 'Live site serves preview canonical URL instead of production domain — new build not deployed',
    implementation_plan: '1. Verify index.html has correct canonical URL in source. 2. Deploy new build to push fix to live site. 3. Verify live site canonical after deployment.',
    postcondition_validator: 'postconditionValidator',
    acceptance_test: 'Live site canonical URL is https://epoxyquotenearme.com/',
    risk: 'medium',
    rollback: 'Rollback to previous deployment',
    approval_required: true,
  },
  'DEPLOY-ROBOTS-001': {
    root_cause: 'Live robots.txt references old domain — new build not deployed',
    implementation_plan: '1. Verify robots.txt source has no old-domain references. 2. Deploy new build. 3. Verify live robots.txt after deployment.',
    postcondition_validator: 'postconditionValidator',
    acceptance_test: 'Live robots.txt does not contain epoxygaragefloorestimate.com',
    risk: 'low',
    rollback: 'Rollback to previous deployment',
    approval_required: true,
  },
  'SEO-SITEMAP-CANONICAL-001': {
    root_cause: 'Sitemap contains full-state-name URLs instead of 2-letter code URLs — generateSitemap fix not deployed',
    implementation_plan: '1. Verify generateSitemap uses CanonicalLocationRegistry. 2. Deploy new build. 3. Verify live sitemap has only 2-letter state code URLs.',
    postcondition_validator: 'postconditionValidator',
    acceptance_test: 'Zero non-canonical state routes in sitemap',
    risk: 'low',
    rollback: 'Rollback to previous deployment',
    approval_required: true,
  },
  'DATA-LEAD-SQFT-001': {
    root_cause: 'Leads are missing square_footage data — estimate funnel not capturing or calculating sqft',
    implementation_plan: '1. Investigate estimate funnel sqft capture. 2. Backfill existing leads with sqft from RentCast or OSM. 3. Verify new leads have sqft populated.',
    postcondition_validator: 'postconditionValidator',
    acceptance_test: '>=80% of leads have square_footage > 0',
    risk: 'medium',
    rollback: 'No rollback needed — data backfill only',
  },
  'DATA-LEAD-ESTIMATE-001': {
    root_cause: 'Leads are missing estimate_mid data — estimate calculation not completing',
    implementation_plan: '1. Investigate estimate funnel completion. 2. Backfill existing leads with estimate data. 3. Verify new leads have estimate populated.',
    postcondition_validator: 'postconditionValidator',
    acceptance_test: '>=80% of leads have estimate_mid > 0',
    risk: 'medium',
    rollback: 'No rollback needed',
  },
  'COST-MODEL-001': {
    root_cause: 'AI model cost tracking is not implemented',
    implementation_plan: '1. Create cost tracking entity or field. 2. Instrument InvokeLLM and vercelAiGateway calls to log cost. 3. Aggregate cost per optimization cycle.',
    postcondition_validator: 'postconditionValidator',
    acceptance_test: 'Cost tracking system exists and records per-cycle cost',
    risk: 'low',
    rollback: 'Remove cost tracking instrumentation',
  },
};

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const svc = base44.asServiceRole;
    const now = new Date().toISOString();
    const body = await req.json().catch(() => ({}));
    const targetSystemId = body.system_id; // Optional: process gaps for a specific system

    // Read open gaps, sorted by priority score (descending)
    // If system_id provided, filter to that system only (no cross-system contamination)
    const gapFilter: any = { status: 'open' };
    if (targetSystemId) gapFilter.system_id = targetSystemId;
    const gaps = await svc.entities.OptimizationGap.filter(gapFilter, '-repair_priority_score', 200);

    // Read existing ACTIVE repair jobs to avoid duplicates
    // COMPOSITE IDEMPOTENCY: system_id + benchmark_id + failure_fingerprint
    // (not benchmark_id alone — different systems can have the same benchmark_id)
    const existingJobs = await svc.entities.RepairJob.filter({ status: ['queued', 'claimed', 'in_progress', 'blocked'] }, '-created_date', 500);

    // Build a composite dedupe key set: system_id + benchmark_id + failure_fingerprint
    const existingDedupeKeys = new Set<string>();
    // Also track per (system_id + benchmark_id) to handle failure evolution
    const existingBySystemBenchmark: Record<string, any[]> = {};

    for (const job of existingJobs) {
      const fp = job.failure_fingerprint || '';
      const dedupeKey = `${job.system_id}:${job.benchmark_id}:${fp}`;
      existingDedupeKeys.add(dedupeKey);
      const sbKey = `${job.system_id}:${job.benchmark_id}`;
      if (!existingBySystemBenchmark[sbKey]) existingBySystemBenchmark[sbKey] = [];
      existingBySystemBenchmark[sbKey].push(job);
    }

    let created = 0;
    let skipped = 0;
    let updated = 0;
    const repairJobs: any[] = [];

    for (const gap of gaps) {
      const gapSystemId = gap.system_id || 'epoxyquotenearme';
      const gapFingerprint = `${gap.benchmark_id}:${gap.actual?.slice(0, 100) || 'unknown'}`;
      const dedupeKey = `${gapSystemId}:${gap.benchmark_id}:${gapFingerprint}`;

      // ── COMPOSITE IDEMPOTENCY CHECK ──
      // Skip if an active repair already exists for this exact composite key
      if (existingDedupeKeys.has(dedupeKey)) {
        skipped++;
        continue;
      }

      // ── FAILURE EVOLUTION CHECK ──
      // Same system + same benchmark but DIFFERENT failure fingerprint
      // → evaluate whether existing repair can be updated or new repair is necessary
      const sbKey = `${gapSystemId}:${gap.benchmark_id}`;
      const existingForBenchmark = existingBySystemBenchmark[sbKey] || [];
      if (existingForBenchmark.length > 0) {
        // Check if any existing job has a DIFFERENT fingerprint
        const hasDifferentFingerprint = existingForBenchmark.some((j: any) =>
          (j.failure_fingerprint || '') !== gapFingerprint
        );

        if (hasDifferentFingerprint) {
          // Failure has evolved — the existing repair addresses a different root cause
          // Do NOT blindly merge. Create a new repair for the new failure signature.
          // The old repair will be superseded by canonicalizeRepairBacklog if needed.
          // Continue to create a new repair below.
        } else {
          // Same fingerprint — skip (already has an active repair)
          skipped++;
          continue;
        }
      }

      // Read the benchmark definition
      const benchmarks = await svc.entities.BenchmarkDefinition.filter({ benchmark_id: gap.benchmark_id, system_id: gapSystemId }, '-created_date', 1);
      const bench = benchmarks[0];
      if (!bench) {
        skipped++;
        continue;
      }

      const template = REPAIR_TEMPLATES[gap.benchmark_id] || {
        root_cause: `Benchmark ${gap.benchmark_id} failed: expected ${gap.target}, got ${gap.actual}`,
        implementation_plan: `Investigate and repair benchmark ${gap.benchmark_id}. Target: ${gap.target}. Actual: ${gap.actual}.`,
        postcondition_validator: 'postconditionValidator',
        acceptance_test: `Benchmark ${gap.benchmark_id} passes`,
        risk: gap.change_risk || 'low',
        rollback: 'Revert changes',
      };

      const specialist = SPECIALIST_MAP[bench.category] || 'software_engineer';
      const repairId = `repair-${gapSystemId}-${gap.benchmark_id}-${now.slice(0, 16).replace(/[-T:]/g, '')}`;

      const failureFingerprint = gapFingerprint;
      const job = await svc.entities.RepairJob.create({
        repair_id: repairId,
        system_id: gap.system_id || 'epoxyquotenearme',
        benchmark_id: gap.benchmark_id,
        failure_fingerprint: failureFingerprint,
        gap_id: gap.gap_id,
        root_cause: template.root_cause,
        affected_system: bench.category,
        affected_files: [],
        affected_entities: bench.applicable_entities || [],
        reproduction_steps: `Run benchmark ${gap.benchmark_id} — it will fail with actual=${gap.actual}`,
        expected_state: gap.target,
        observed_state: gap.actual,
        implementation_plan: template.implementation_plan,
        assigned_specialist: specialist,
        risk: template.risk,
        rollback: template.rollback,
        acceptance_test: template.acceptance_test,
        regression_test: `Verify ${gap.benchmark_id} passes after repair and does not regress`,
        postcondition_validator: template.postcondition_validator,
        status: template.approval_required ? 'blocked' : 'queued',
        implementer: specialist,
        validator: 'postconditionValidator',
        release_authority: 'alpha_prime_orchestrator',
        approval_required: template.approval_required || false,
        created_at: now,
        updated_at: now,
      });

      // Update gap status
      await svc.entities.OptimizationGap.update(gap.id, {
        status: 'in_repair',
        repair_job_id: repairId,
      });

      // Add to dedupe set so subsequent gaps in this batch don't create duplicates
      existingDedupeKeys.add(dedupeKey);
      const sbKeyNew = `${gapSystemId}:${gap.benchmark_id}`;
      if (!existingBySystemBenchmark[sbKeyNew]) existingBySystemBenchmark[sbKeyNew] = [];
      existingBySystemBenchmark[sbKeyNew].push({ repair_id: repairId, failure_fingerprint: failureFingerprint });

      repairJobs.push({ repair_id: repairId, system_id: gapSystemId, benchmark_id: gap.benchmark_id, specialist, approval_required: template.approval_required || false, failure_fingerprint: failureFingerprint });
      created++;
    }

    return Response.json({
      ok: true,
      repair_jobs_created: created,
      repair_jobs_skipped: skipped,
      repair_jobs_updated: updated,
      repair_jobs: repairJobs,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}