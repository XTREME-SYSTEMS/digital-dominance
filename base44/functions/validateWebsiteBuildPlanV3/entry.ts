import { createClientFromRequest } from "npm:@base44/sdk@0.8.48";
import {
  DDV3_BUILD_POLICY_VERSION,
  validatePreviewBuildPlan,
} from "../../shared/ddv3BuildGuardrails.js";

export default async function(req: Request): Promise<Response> {
  try {
    if (req.method !== "POST") return Response.json({ error: "POST required" }, { status: 405 });

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const buildPlanId = String(body?.build_plan_id || "").trim();
    if (!buildPlanId) return Response.json({ error: "build_plan_id required" }, { status: 400 });

    const svc = base44.asServiceRole;
    const plan = await svc.entities.WebsiteBuildPlan.get(buildPlanId);
    if (!plan) return Response.json({ error: "WebsiteBuildPlan not found" }, { status: 404 });

    const opportunity = await svc.entities.Opportunity.get(plan.opportunity_id);
    if (!opportunity) return Response.json({ error: "Opportunity not found" }, { status: 404 });

    const result = validatePreviewBuildPlan(plan, {
      opportunityEligibility: opportunity.automation_eligibility,
      evidenceCoveragePct: opportunity.evidence_coverage_pct,
      physicalLocationVerified: false,
    });

    const now = new Date().toISOString();
    const receipt = {
      validator: "validateWebsiteBuildPlanV3",
      policy_version: DDV3_BUILD_POLICY_VERSION,
      validated_at: now,
      opportunity_id: opportunity.id,
      build_plan_id: plan.id,
      opportunity_decision_score: Number(opportunity.decision_score || 0),
      opportunity_evidence_state: opportunity.evidence_state || "unknown",
      opportunity_evidence_coverage_pct: Number(opportunity.evidence_coverage_pct || 0),
      result,
      release_authorized: false,
    };

    const nextStatus = result.valid ? "validated_for_preview" : "blocked";
    await svc.entities.WebsiteBuildPlan.update(plan.id, {
      status: nextStatus,
      validation_state: result.valid ? "passed" : "failed",
      validation_errors: result.errors,
      validation_warnings: result.warnings,
      validation_receipt: JSON.stringify(receipt).slice(0, 5000),
      validated_at: now,
      release_authorized: false,
    });

    await svc.entities.Opportunity.update(opportunity.id, {
      build_plan_status: nextStatus,
      updated_at: now,
    });

    return Response.json({
      ok: result.valid,
      build_plan_id: plan.id,
      status: nextStatus,
      validation: result,
      release_authorized: false,
      next_action: result.valid ? "render_preview_then_run_independent_browser_and_policy_validation" : "repair_build_plan",
    }, { status: result.valid ? 200 : 409 });
  } catch (error: any) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
