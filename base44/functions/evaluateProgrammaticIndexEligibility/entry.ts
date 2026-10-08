import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";

function rowsOf(result: any) {
  return result?.items || result || [];
}

function normalized(value: string) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const REQUIRED_VALIDATION_CHECKS = [
  "route_integrity",
  "desktop_1440x1100",
  "mobile_390x844",
  "console_runtime_errors",
  "accessibility_smoke",
  "metadata_canonical",
  "robots_sitemap",
  "jsonld_parse",
];

const UNSUPPORTED_CLAIMS = [
  /top[- ]rated/i,
  /satisfaction guaranteed/i,
  /20\+ years/i,
  /fully licensed/i,
  /#1\b/i,
];

export default async function(req: Request): Promise<Response> {
  try {
    if (req.method !== "POST") return Response.json({ error: "POST required" }, { status: 405 });

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const pageId = String(body?.page_id || "").trim();
    if (!pageId) return Response.json({ error: "page_id required" }, { status: 400 });

    const svc = base44.asServiceRole;
    const page = await svc.entities.GeneratedPage.get(pageId);
    if (!page) return Response.json({ error: "GeneratedPage not found" }, { status: 404 });

    const reasons: string[] = [];
    const passed: string[] = [];

    // Demand/evidence gate. Verified opportunity evidence wins. Existing first-party
    // Search Console impressions for the exact route can also satisfy demand proof.
    let demandVerified = false;
    if (page.source_opportunity_id) {
      const opp = await svc.entities.Opportunity.get(page.source_opportunity_id);
      if (opp?.evidence_state === "verified" && Number(opp?.decision_score || 0) >= 60) {
        demandVerified = true;
        passed.push("verified_opportunity_evidence");
      } else {
        reasons.push("opportunity_evidence_not_verified");
      }
    }

    if (!demandVerified && page.canonical_path) {
      const seoRows = await svc.entities.SeoContent.filter({ route: page.canonical_path }, "-optimized_at", 1);
      const seo = rowsOf(seoRows)[0];
      const snapshot = seo?.performance_snapshot || {};
      const topQueries = Array.isArray(snapshot.top_queries) ? snapshot.top_queries : [];
      const pageKeyword = normalized(page.keyword);
      const matchingQuery = topQueries.find((q: any) => {
        const query = normalized(q?.query);
        return query && pageKeyword && (query.includes(pageKeyword) || pageKeyword.includes(query));
      });
      if (Number(snapshot.impressions || 0) > 0 && matchingQuery) {
        demandVerified = true;
        passed.push("first_party_gsc_query_evidence");
      }
    }
    if (!demandVerified && !reasons.includes("opportunity_evidence_not_verified")) {
      reasons.push("demand_evidence_missing");
    }

    // Local fulfillment/value gate.
    const looksLocal = Boolean(page.location_id) || /^\/[a-z]{2}\/[^/]+$/i.test(page.canonical_path || "");
    if (looksLocal) {
      let location: any = null;
      if (page.location_id) {
        const rows = await svc.entities.CanonicalLocationRegistry.filter({ location_id: page.location_id }, "-updated_date", 1);
        location = rowsOf(rows)[0] || null;
      }
      if (!location && page.canonical_path) {
        const rows = await svc.entities.CanonicalLocationRegistry.filter({ canonical_path: page.canonical_path }, "-updated_date", 1);
        location = rowsOf(rows)[0] || null;
      }

      if (!location) {
        reasons.push("location_registry_missing");
      } else {
        if (location.serviceability_status === "serviceable") passed.push("location_serviceable");
        else reasons.push("location_not_serviceable");

        if (location.validation_status === "passed") passed.push("location_validation_passed");
        else reasons.push("location_not_validated");

        if (Number(location.local_value_score || 0) >= 70) passed.push("local_value_score_passed");
        else reasons.push("local_value_score_below_70");

        if (String(location.lead_routing_destination || "").trim()) passed.push("lead_routing_verified");
        else reasons.push("lead_routing_missing");
      }
    }

    // Materially useful differentiated value gate.
    const contentText = [
      page.intro || "",
      page.content || "",
      JSON.stringify(page.sections || []),
      JSON.stringify(page.faq || []),
    ].join("\n");
    if (String(page.unique_value_summary || "").trim().length >= 80) passed.push("unique_value_documented");
    else reasons.push("unique_value_not_documented");

    if (contentText.replace(/<[^>]+>/g, " ").trim().length >= 800) passed.push("content_depth_passed");
    else reasons.push("content_depth_insufficient");

    const claims = [page.title, page.h1, page.meta_description, contentText].join("\n");
    if (UNSUPPORTED_CLAIMS.some((rx) => rx.test(claims))) reasons.push("unsupported_claim_detected");
    else passed.push("unsupported_claim_scan_passed");

    // Independent technical validation gate.
    const workPacketId = String(page.validation_work_packet_id || "").trim();
    if (!workPacketId) {
      reasons.push("validation_work_packet_missing");
    } else {
      const receipts = await svc.entities.ValidationReceipt.filter({ work_packet_id: workPacketId }, "-timestamp", 500);
      const receiptRows = rowsOf(receipts);
      for (const check of REQUIRED_VALIDATION_CHECKS) {
        const matching = receiptRows.filter((r: any) => r.check_name === check);
        if (matching.some((r: any) => r.status === "PASS")) passed.push("validation:" + check);
        else reasons.push("validation_missing_or_failed:" + check);
      }
      if (receiptRows.some((r: any) => ["FAIL","BLOCKED","MISSING_EVIDENCE"].includes(r.status))) {
        reasons.push("validation_receipt_blocker_present");
      }
    }

    const eligible = reasons.length === 0;
    const now = new Date().toISOString();

    await svc.entities.GeneratedPage.update(page.id, {
      status: eligible ? "validated" : "draft",
      robots_directive: eligible ? "index, follow" : "noindex, follow",
      index_eligible: eligible,
      sitemap_eligible: eligible,
      release_authorized: false,
      serviceability_verified: looksLocal ? passed.includes("location_serviceable") : true,
      local_value_score: Number(page.local_value_score || 0),
      eligibility_state: eligible ? "eligible" : "blocked",
      eligibility_reasons: eligible ? passed : reasons,
      eligibility_evaluated_at: now,
    });

    if (page.programmatic_job_id) {
      const jobs = await svc.entities.ProgrammaticSeoJob.filter({ job_id: page.programmatic_job_id }, "-started_at", 1);
      const job = rowsOf(jobs)[0];
      if (job) {
        await svc.entities.ProgrammaticSeoJob.update(job.id, {
          pages_eligible: eligible ? Math.max(Number(job.pages_eligible || 0), 1) : Number(job.pages_eligible || 0),
          production_publish_authorized: false,
          status: eligible ? "eligible" : "validation",
        });
      }
    }

    return Response.json({
      ok: true,
      page_id: page.id,
      eligible,
      status: eligible ? "validated" : "draft",
      robots_directive: eligible ? "index, follow" : "noindex, follow",
      sitemap_eligible: eligible,
      release_authorized: false,
      passed,
      blockers: reasons,
      note: eligible
        ? "Index eligibility earned, but publishing/release remains separately approval-gated."
        : "Candidate remains draft/noindex until every blocker is cleared."
    });
  } catch (error: any) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
