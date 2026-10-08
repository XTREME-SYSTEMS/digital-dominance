import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { logStep } from "../../shared/sopLog.ts";
import { generateText } from "../../shared/aiGateway.ts";

// Closed-loop SEO engine: reads competitor insights that have content_gaps
// filled in, uses AI to extract actionable topic keywords from those gaps,
// then auto-generates SEO pages for each missing topic. This closes the gap
// between "we know what competitors cover that we don't" and "we now cover it."
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    // 1. Gather all competitor insights that have content gaps documented.
    const insights = await base44.asServiceRole.entities.CompetitorInsight.list(200);
    const withGaps = insights.filter((i) => i.content_gaps && i.content_gaps.trim().length > 10);

    if (!withGaps.length) {
      return Response.json({ ok: true, generated: 0, note: "No content gaps found. Run the competitor scanner first." });
    }

    // 2. Collect existing generated page keywords to avoid duplicates.
    const existing = await base44.asServiceRole.entities.GeneratedPage.list(500);
    const existingKeywords = new Set(
      existing.map((g) => (g.keyword || g.slug || "").toLowerCase())
    );

    // 3. Ask AI to extract actionable topic keywords from the combined gaps.
    const gapText = withGaps
      .map((i) => `Competitor ${i.competitor_name}: ${i.content_gaps}`)
      .join("\n");

    const { parsed: res } = await generateText({
      prompt: `You are an SEO strategist for a garage floor coating company. Based on these content gaps identified in competitor analysis, extract 5-10 specific, high-intent topic keywords that we should create content pages for. Each keyword should be something a homeowner would search for (e.g. "polyaspartic vs epoxy durability", "garage floor coating for hot climates"). Return only the keywords as a JSON array of strings.

Content gaps:
${gapText}`,
      response_json_schema: {
        type: "object",
        properties: {
          keywords: { type: "array", items: { type: "string" } },
        },
      },
    });

    const keywords = (res as any)?.keywords || [];

    // 4. Filter out keywords we already have pages for.
    const newKeywords = keywords.filter(
      (k: string) => k && !existingKeywords.has(k.toLowerCase())
    );

    if (!newKeywords.length) {
      await logStep(base44, {
        category: "content",
        action: "Content gap auto-fill: no new topics needed",
        detail: `${keywords.length} topics found, all already covered`,
        source: "fillContentGaps",
      });
      return Response.json({ ok: true, generated: 0, found: keywords.length, note: "All identified topics already have pages." });
    }

    // 5. DDV3: return content-gap hypotheses only.
    // Creating/publishing pages from model-generated topic ideas is intentionally disabled.
    const candidates = newKeywords.slice(0, 10).map((keyword: string) => ({
      keyword,
      source_class: "MODEL_ESTIMATE",
      evidence_state: "hypothesis",
      automation_eligibility: "research_only",
    }));

    await logStep(base44, {
      category: "content",
      action: `Content gap research: ${candidates.length} candidate topics`,
      detail: `Topics: ${candidates.map((g) => g.keyword).join(", ")}`,
      meta: JSON.stringify({ found: keywords.length, candidates: candidates.length, pages_created: 0 }),
      source: "fillContentGaps",
    });

    return Response.json({
      ok: true,
      found: keywords.length,
      candidates: candidates.length,
      pages_created: 0,
      topics: candidates,
      mode: "research_only",
      note: "No GeneratedPage records were created. Candidate topics require evidence before page compilation.",
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}