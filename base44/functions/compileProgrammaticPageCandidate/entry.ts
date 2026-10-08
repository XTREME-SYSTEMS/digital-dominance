import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";

function slugify(value: string) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

function rowsOf(result: any) {
  return result?.items || result || [];
}

const UNSUPPORTED_CLAIMS = [
  /top[- ]rated/i,
  /satisfaction guaranteed/i,
  /20\+ years/i,
  /fully licensed/i,
  /#1\b/i,
  /best in (the )?(city|area|state)/i,
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
    const domain = String(body?.domain || "").trim();
    const keyword = String(body?.keyword || "").trim();
    const title = String(body?.title || "").trim();
    const h1 = String(body?.h1 || title).trim();
    const metaDescription = String(body?.meta_description || "").trim();
    const uniqueValue = String(body?.unique_value_summary || "").trim();
    const canonicalPath = String(body?.canonical_path || "").trim();
    const city = String(body?.city || "").trim();
    const state = String(body?.state || "").trim();
    const opportunityId = String(body?.opportunity_id || "").trim();
    const validationWorkPacketId = String(body?.validation_work_packet_id || "").trim();

    if (!domain || !keyword || !title || !h1) {
      return Response.json({ error: "domain, keyword, title, and h1 are required" }, { status: 400 });
    }
    if (uniqueValue.length < 80) {
      return Response.json({
        error: "unique_value_summary must explain materially differentiated page value in at least 80 characters"
      }, { status: 400 });
    }

    const combinedClaims = [
      title,
      h1,
      metaDescription,
      String(body?.intro || ""),
      JSON.stringify(body?.sections || []),
    ].join("\n");
    const claimHit = UNSUPPORTED_CLAIMS.find((rx) => rx.test(combinedClaims));
    if (claimHit) {
      return Response.json({
        error: "Unsupported marketing claim detected. Provide verified proof or remove the claim before candidate creation.",
        code: "UNVERIFIED_CLAIM_BLOCKED"
      }, { status: 409 });
    }

    const svc = base44.asServiceRole;

    let location: any = null;
    const locationId = String(body?.location_id || "").trim();
    if (locationId || city || state || /^\/[a-z]{2}\/[^/]+$/i.test(canonicalPath)) {
      if (locationId) {
        const locRows = await svc.entities.CanonicalLocationRegistry.filter({ location_id: locationId }, "-updated_date", 1);
        location = rowsOf(locRows)[0] || null;
      } else if (canonicalPath) {
        const locRows = await svc.entities.CanonicalLocationRegistry.filter({ canonical_path: canonicalPath }, "-updated_date", 1);
        location = rowsOf(locRows)[0] || null;
      }

      if (!location) {
        return Response.json({
          error: "Location page candidate requires a matching CanonicalLocationRegistry record.",
          code: "LOCATION_NOT_VERIFIED"
        }, { status: 409 });
      }
      if (location.serviceability_status !== "serviceable") {
        return Response.json({
          error: "Location is not verified serviceable.",
          code: "LOCATION_NOT_SERVICEABLE"
        }, { status: 409 });
      }
    }

    let opportunity: any = null;
    if (opportunityId) {
      opportunity = await svc.entities.Opportunity.get(opportunityId);
      if (!opportunity) return Response.json({ error: "Opportunity not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    let job: any = null;
    const requestedJobId = String(body?.job_id || "").trim();

    if (requestedJobId) {
      const jobs = await svc.entities.ProgrammaticSeoJob.filter({ job_id: requestedJobId }, "-started_at", 1);
      job = rowsOf(jobs)[0] || null;
    }

    if (!job) {
      const jobId = "pseo_" + slugify(domain) + "_" + Date.now().toString(36);
      job = await svc.entities.ProgrammaticSeoJob.create({
        job_id: jobId,
        target_domain: domain,
        industry_id: String(body?.industry_id || "").trim(),
        source: body?.source || "keyword_research",
        keywords_identified: [{
          keyword,
          volume: Number(body?.volume) || 0,
          difficulty: Number(body?.difficulty) || 0,
          intent: String(body?.intent || "unknown"),
        }],
        execution_mode: "candidate_generation",
        candidates_created: 0,
        pages_generated: 0,
        pages_published: 0,
        pages_indexed: 0,
        pages_eligible: 0,
        production_publish_authorized: false,
        evidence_state: opportunity?.evidence_state || "unknown",
        validation_work_packet_id: validationWorkPacketId || "",
        status: "candidate_generation",
        started_at: now,
      });
    }

    const slug = slugify(body?.slug || keyword);
    const existing = await svc.entities.GeneratedPage.filter({ slug }, "-updated_date", 1);
    if (rowsOf(existing)[0]) {
      return Response.json({ error: "GeneratedPage slug already exists", slug }, { status: 409 });
    }

    const contentText = String(body?.content || "").slice(0, 30000);
    const sections = Array.isArray(body?.sections) ? body.sections.slice(0, 20) : [];
    const faq = Array.isArray(body?.faq) ? body.faq.slice(0, 20) : [];

    const page = await svc.entities.GeneratedPage.create({
      slug,
      keyword,
      title,
      h1,
      meta_description: metaDescription,
      description: String(body?.description || "").slice(0, 1000),
      intro: String(body?.intro || "").slice(0, 5000),
      content: contentText,
      sections,
      faq,
      seo_title: String(body?.seo_title || title).slice(0, 500),
      seo_description: String(body?.seo_description || metaDescription).slice(0, 500),
      status: "draft",
      canonical_path: canonicalPath || "/guides/" + slug,
      programmatic_job_id: job.job_id,
      location_id: location?.location_id || "",
      source_opportunity_id: opportunity?.id || "",
      source_evidence_state: opportunity?.evidence_state || "operator_brief",
      validation_work_packet_id: validationWorkPacketId,
      unique_value_summary: uniqueValue,
      robots_directive: "noindex, follow",
      index_eligible: false,
      sitemap_eligible: false,
      release_authorized: false,
      serviceability_verified: Boolean(location ? location.serviceability_status === "serviceable" : true),
      local_value_score: Number(location?.local_value_score || 0),
      eligibility_state: "candidate",
      eligibility_reasons: ["Candidate created in draft/noindex mode. Independent eligibility validation required."],
    });

    await svc.entities.ProgrammaticSeoJob.update(job.id, {
      candidates_created: Number(job.candidates_created || 0) + 1,
      pages_generated: Number(job.pages_generated || 0) + 1,
      pages_published: Number(job.pages_published || 0),
      production_publish_authorized: false,
      status: "validation",
    });

    return Response.json({
      ok: true,
      page_id: page.id,
      slug: page.slug,
      job_id: job.job_id,
      status: page.status,
      robots_directive: page.robots_directive,
      index_eligible: false,
      sitemap_eligible: false,
      release_authorized: false,
      note: "Candidate only. No publishing, sitemap inclusion, indexing request, or external distribution occurred."
    });
  } catch (error: any) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
