import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";

function rowsOf(result: any) {
  return result?.items || result || [];
}

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
    const approvalId = String(body?.approval_id || "").trim();

    if (!pageId || !approvalId) {
      return Response.json({ error: "page_id and approval_id are required" }, { status: 400 });
    }

    const svc = base44.asServiceRole;
    const page = await svc.entities.GeneratedPage.get(pageId);
    if (!page) return Response.json({ error: "GeneratedPage not found" }, { status: 404 });

    if (
      page.status !== "validated" ||
      page.eligibility_state !== "eligible" ||
      page.index_eligible !== true ||
      page.sitemap_eligible !== true ||
      page.release_authorized === true
    ) {
      return Response.json({
        error: "Page is not in a releasable validated state.",
        code: "DDV3_PAGE_NOT_RELEASABLE",
      }, { status: 409 });
    }

    const approvals = await svc.entities.ApprovalRequest.filter({ approval_id: approvalId }, "-resolved_at", 5);
    const approval = rowsOf(approvals)[0];

    const expectedAction = "publish_programmatic_page:" + page.id;
    if (
      !approval ||
      approval.status !== "APPROVED" ||
      approval.action !== expectedAction ||
      approval.work_packet_id !== page.validation_work_packet_id
    ) {
      return Response.json({
        error: "Exact-scope approved release record required.",
        code: "DDV3_RELEASE_APPROVAL_REQUIRED",
      }, { status: 403 });
    }

    const now = new Date().toISOString();
    const released = await svc.entities.GeneratedPage.update(page.id, {
      status: "published",
      robots_directive: "index, follow",
      index_eligible: true,
      sitemap_eligible: true,
      release_authorized: true,
      published_at: now,
      eligibility_state: "eligible",
      eligibility_reasons: [
        ...(Array.isArray(page.eligibility_reasons) ? page.eligibility_reasons : []),
        "Exact-scope protected release approval verified: " + approval.approval_id,
      ],
    });

    if (page.programmatic_job_id) {
      const jobs = await svc.entities.ProgrammaticSeoJob.filter({ job_id: page.programmatic_job_id }, "-started_at", 1);
      const job = rowsOf(jobs)[0];
      if (job) {
        await svc.entities.ProgrammaticSeoJob.update(job.id, {
          pages_published: Number(job.pages_published || 0) + 1,
          production_publish_authorized: true,
          status: "publishing",
        });
      }
    }

    // Distribution functions independently re-check eligibility and release flags.
    let sitemap = { ok: false, skipped: true };
    let indexNow = { ok: false, skipped: true };
    try {
      const sitemapRes = await base44.functions.invoke("generateSitemap", {});
      sitemap = { ok: true, result: sitemapRes?.data || sitemapRes };
    } catch {}
    try {
      const site = "https://epoxyquotenearme.com";
      const url = site + "/" + String(released.slug || "").replace(/^\/+/, "");
      const pingRes = await base44.functions.invoke("pingIndexNow", { url });
      indexNow = { ok: true, result: pingRes?.data || pingRes };
    } catch {}

    return Response.json({
      ok: true,
      page_id: released.id,
      approval_id: approval.approval_id,
      status: released.status,
      release_authorized: released.release_authorized,
      published_at: released.published_at,
      sitemap,
      indexNow,
      note: "One exact validated page released under exact-scope approval.",
    });
  } catch (error: any) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
