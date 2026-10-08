import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";

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

    if (
      page.status !== "validated" ||
      page.eligibility_state !== "eligible" ||
      page.index_eligible !== true ||
      page.sitemap_eligible !== true ||
      !page.validation_work_packet_id
    ) {
      return Response.json({
        error: "Page is not ready to request release approval.",
        code: "DDV3_PAGE_NOT_ELIGIBLE",
      }, { status: 409 });
    }

    const approvalId = "pseo_release_" + page.id;
    const action = "publish_programmatic_page:" + page.id;
    const existing = await svc.entities.ApprovalRequest.filter({ approval_id: approvalId }, "-requested_at", 1);
    const current = (existing?.items || existing || [])[0];

    if (current && current.status === "PENDING") {
      return Response.json({
        ok: true,
        approval_id: current.approval_id,
        status: current.status,
        idempotent: true,
        action: current.action,
      });
    }

    const approval = await svc.entities.ApprovalRequest.create({
      approval_id: approvalId,
      session_id: page.programmatic_job_id || page.id,
      work_packet_id: page.validation_work_packet_id,
      action,
      reason: "Publish one exact DDV3 programmatic page after evidence and independent validation passed.",
      risk_class: "PROTECTED",
      status: "PENDING",
      requested_at: new Date().toISOString(),
      notes: JSON.stringify({
        page_id: page.id,
        slug: page.slug,
        canonical_path: page.canonical_path,
        robots_directive: page.robots_directive,
        index_eligible: page.index_eligible,
        sitemap_eligible: page.sitemap_eligible,
      }).slice(0, 2000),
    });

    return Response.json({
      ok: true,
      approval_id: approval.approval_id,
      status: approval.status,
      action: approval.action,
      page_id: page.id,
      note: "Approval request created. No publishing or indexing occurred.",
    });
  } catch (error: any) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
