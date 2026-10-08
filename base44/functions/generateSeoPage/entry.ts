import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { logStep } from "../../shared/sopLog.ts";
import { generateText } from "../../shared/aiGateway.ts";

function slugify(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Legacy AI content-draft generator.
// DDV3 rule: this function may create draft/noindex candidates only.
// It never publishes, enters a sitemap, or pings an indexer.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const keyword = (body.keyword || "").trim();
    const city = (body.city || "").trim();
    const intent = (body.intent || "").trim();
    if (!keyword) return Response.json({ error: "keyword is required" }, { status: 400 });

    const topic = city ? `${keyword} in ${city}` : keyword;
    const loc = city ? ` The page should be locally relevant to ${city}.` : "";

    const prompt = `You are an expert SEO content writer for EpoxyGarageFloorEstimate.com (Xtreme Polishing Systems), a garage floor coating company. Write a complete, original, helpful, SEO-optimized web page targeting the search query: "${topic}". Search intent: ${intent || "informational with commercial intent"}.${loc}

Requirements:
- Unique, factual, well-structured content. No fluff, no filler, no generic intros.
- A compelling keyword-rich title (under 60 characters) and meta description (under 155 characters).
- A clear H1 and an intro paragraph (2-3 sentences).
- 4 to 6 sections, each with an H2, 1-2 body paragraphs (as an array of strings), and optionally a bullet list (array of strings).
- 4 to 6 FAQ questions with concise factual answers (under 60 words each).
- A URL-friendly kebab-case slug (no leading slash).

Pricing facts (do not invent prices outside these ranges): epoxy garage floors cost $4-$12/sq ft installed; 2-car garage ~440 sq ft = $2,400-$5,300; 3-car garage ~660 sq ft = $3,600-$6,600; minimum project ~$1,800; lasts 10-20 years; installed in 1-2 days; full cure 24-72 hours.

Return only JSON matching the schema.`;

    const { parsed: res } = await generateText({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          slug: { type: "string" },
          title: { type: "string" },
          meta_description: { type: "string" },
          h1: { type: "string" },
          intro: { type: "string" },
          sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                h2: { type: "string" },
                body: { type: "array", items: { type: "string" } },
                list: { type: "array", items: { type: "string" } },
              },
            },
          },
          faq: {
            type: "array",
            items: {
              type: "object",
              properties: { q: { type: "string" }, a: { type: "string" } },
            },
          },
        },
        required: ["slug", "title", "h1", "intro", "sections", "faq"],
      },
    });

    const page = res.data || res;
    let slug = slugify(page.slug || slug);
    if (!slug) slug = slugify(keyword);

    // Ensure slug uniqueness across existing generated pages.
    const existing = await base44.asServiceRole.entities.GeneratedPage.filter({ slug });
    if (existing.length) slug = `${slug}-${Date.now().toString().slice(-5)}`;

    const created = await base44.asServiceRole.entities.GeneratedPage.create({
      slug,
      keyword: topic,
      title: (page.title || "").slice(0, 70),
      meta_description: (page.meta_description || "").slice(0, 160),
      h1: page.h1 || page.title || topic,
      intro: page.intro || "",
      sections: Array.isArray(page.sections) ? page.sections : [],
      faq: Array.isArray(page.faq) ? page.faq : [],
      status: "draft",
      robots_directive: "noindex, follow",
      index_eligible: false,
      sitemap_eligible: false,
      release_authorized: false,
      eligibility_state: "research_only",
      eligibility_reasons: ["Legacy AI draft generator. DDV3 evidence and independent validation required."],
    });

    await logStep(base44, { category: "content", action: "Generated DDV3 SEO draft candidate", detail: `${topic} → /${slug} (draft/noindex)`, source: "generateSeoPage" });

    return Response.json({
      ok: true,
      page: created,
      candidate_only: true,
      index_eligible: false,
      sitemap_eligible: false,
      release_authorized: false,
      note: "Draft/noindex only. Governed evidence and eligibility evaluation are required before release."
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}