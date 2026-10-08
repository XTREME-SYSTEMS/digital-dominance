import { createClientFromRequest } from "npm:@base44/sdk@0.8.48";
import {
  DDV3_PREVIEW_POLICY_VERSION,
  validateWebsitePreviewArtifact,
} from "../../shared/ddv3PreviewGuardrails.js";

export default async function(req: Request): Promise<Response> {
  try {
    if (req.method !== "POST") return Response.json({ error: "POST required" }, { status: 405 });

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const artifactId = String(body?.artifact_id || "").trim();
    if (!artifactId) return Response.json({ error: "artifact_id required" }, { status: 400 });

    const svc = base44.asServiceRole;
    const artifact = await svc.entities.WebsitePreviewArtifact.get(artifactId);
    if (!artifact) return Response.json({ error: "WebsitePreviewArtifact not found" }, { status: 404 });

    const plan = await svc.entities.WebsiteBuildPlan.get(artifact.build_plan_id);
    if (!plan) return Response.json({ error: "WebsiteBuildPlan not found" }, { status: 404 });

    const evidenceRows = await svc.entities.OpportunityEvidence.filter(
      { opportunity_id: artifact.opportunity_id },
      "-retrieved_at",
      500
    );

    const result = validateWebsitePreviewArtifact(artifact, plan, evidenceRows || [], {
      physicalLocationVerified: false,
    });

    const now = new Date().toISOString();
    const receipt = {
      validator: "validateWebsitePreviewV3",
      policy_version: DDV3_PREVIEW_POLICY_VERSION,
      validated_at: now,
      artifact_id: artifact.id,
      build_plan_id: plan.id,
      result,
      preview_only: true,
      is_public: false,
      release_authorized: false,
    };

    const nextArtifactStatus = result.valid ? "validated" : "blocked";
    const nextPlanStatus = result.valid ? "preview_ready" : "preview_failed";

    await svc.entities.WebsitePreviewArtifact.update(artifact.id, {
      status: nextArtifactStatus,
      validation_state: result.valid ? "passed" : "failed",
      validation_errors: result.errors,
      validation_warnings: result.warnings,
      validation_receipt: JSON.stringify(receipt).slice(0, 5000),
      validated_at: now,
      preview_only: true,
      is_public: false,
      robots_policy: "noindex",
    });

    await svc.entities.WebsiteBuildPlan.update(plan.id, {
      status: nextPlanStatus,
      preview_status: nextArtifactStatus,
      release_authorized: false,
    });

    await svc.entities.Opportunity.update(artifact.opportunity_id, {
      build_plan_status: nextPlanStatus,
      preview_status: nextArtifactStatus,
      updated_at: now,
    });

    return Response.json({
      ok: result.valid,
      artifact_id: artifact.id,
      build_plan_id: plan.id,
      artifact_status: nextArtifactStatus,
      build_plan_status: nextPlanStatus,
      validation: result,
      preview_only: true,
      is_public: false,
      release_authorized: false,
      next_action: result.valid ? "open_private_admin_preview" : "repair_preview_content",
    }, { status: result.valid ? 200 : 409 });
  } catch (error: any) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
