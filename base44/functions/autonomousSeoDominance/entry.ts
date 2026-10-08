import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { logStep } from '../../shared/sopLog.ts';
import { generateText } from '../../shared/aiGateway.ts';

// ═══════════════════════════════════════════════════════════════════════════
// autonomousSeoDominance
// DDV3 evidence-led SEO opportunity research engine.
//
// Pulls first-party Search Console evidence and identifies candidate queries.
 // It is deliberately non-publishing: candidate pages must pass DDV3 evidence,
 // preview, validation, approval, and release gates before indexing.
 // ═══════════════════════════════════════════════════════════════════════════

function slugify(s: string): string {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function pingIndexNow(urls: string[]): Promise<void> {
  if (urls.length === 0) return;
  try {
    await fetch('https://api.indexnow.org/IndexNow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: INDEXNOW_SITE,
        key: INDEXNOW_KEY,
        keyLocation: `https://${INDEXNOW_SITE}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      }),
    });
  } catch {}
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const maxNewPages = Math.min(body.max_new_pages || 5, 10);
    const now = new Date().toISOString();

    const report: any = {
      started_at: now,
      steps: [],
      opportunities_found: 0,
      pages_generated: 0,
      pages_reoptimized: 0,
      urls_submitted: 0,
      errors: [],
    };

    // ── STEP 1: Pull fresh Google Search Console data ──
    try {
      const scRes = await base44.functions.invoke('pullSearchConsoleData', {});
      const scData = scRes.data || scRes;
      report.steps.push({
        step: 'pull_search_console',
        ok: !scData.error,
        impressions: scData.totals?.impressions || 0,
        clicks: scData.totals?.clicks || 0,
        pages: scData.totals?.pages || 0,
      });
      if (scData.error) {
        report.errors.push(`Search Console pull failed: ${scData.error}`);
      }
    } catch (e: any) {
      report.steps.push({ step: 'pull_search_console', ok: false, error: e.message });
      report.errors.push(`Search Console pull error: ${e.message}`);
    }

    // ── STEP 2: Discover opportunity keywords from GSC data ──
    // Opportunity = query with impressions > 10 AND avg position > 10 (page 2+)
    // These are keywords Google already shows us for, but we're not on page 1.
    const seoContents = await svc.entities.SeoContent.list(200);
    const allQueries: any[] = [];

    for (const rec of seoContents) {
      const perf = rec.performance_snapshot || {};
      const topQueries = perf.top_queries || [];
      for (const q of topQueries) {
        if ((q.impressions || 0) >= 10 && (q.position || 100) > 10) {
          allQueries.push({
            query: q.query,
            impressions: q.impressions,
            clicks: q.clicks,
            position: q.position,
            route: rec.route,
            has_page: true,
          });
        }
      }
    }

    // Also use AI to discover NEW keyword opportunities we're not yet targeting
    let newKeywords: string[] = [];
    if (allQueries.length > 0 || seoContents.length > 0) {
      try {
        const existingKeywords = seoContents.map((r) => r.route).join(', ');
        const queryData = allQueries.slice(0, 15).map(q => `"${q.query}" (${q.impressions} impr, pos ${q.position?.toFixed(1)})`).join('\n');

        const { parsed: kwRes } = await generateText({
          prompt: `You are an aggressive SEO strategist for a garage floor coating company. Based on these Google Search Console queries where we appear on page 2+ (not page 1), and our existing pages, identify 5-10 NEW high-intent keyword opportunities we should create content pages for to capture more first-page rankings.

Current page-2+ queries (opportunities to improve):
${queryData || 'No GSC data yet — suggest foundational garage floor coating keywords.'}

Existing pages: ${existingKeywords || 'None yet'}

Return only JSON: { "keywords": ["keyword 1", "keyword 2", ...] }
Each keyword should be a specific long-tail phrase a homeowner would search (e.g. "polyaspartic vs epoxy garage floor", "garage floor coating for hot climates", "how long does epoxy garage floor last").`,
          response_json_schema: {
            type: 'object',
            properties: {
              keywords: { type: 'array', items: { type: 'string' } },
            },
          },
        });
        newKeywords = (kwRes as any)?.keywords || [];
      } catch (e: any) {
        report.errors.push(`Keyword discovery error: ${e.message}`);
      }
    }

    report.opportunities_found = allQueries.length + newKeywords.length;
    report.steps.push({
      step: 'discover_opportunities',
      ok: true,
      page2_plus_queries: allQueries.length,
      new_keyword_ideas: newKeywords.length,
    });

    // ── DDV3 SAFE MODE: recommendations only ──
    // This function no longer creates pages, rewrites content, or submits URLs.
    // It produces evidence-backed candidate work for governed downstream workflows.
    const existingPages = await svc.entities.GeneratedPage.list(500);
    const existingKeywordsSet = new Set(existingPages.map((p) => (p.keyword || "").toLowerCase()));
    const recommendedCandidates = newKeywords
      .filter((keyword) => keyword && !existingKeywordsSet.has(keyword.toLowerCase()))
      .slice(0, maxNewPages)
      .map((keyword) => ({
        keyword,
        source_class: "MODEL_ESTIMATE",
        evidence_state: "hypothesis",
        automation_eligibility: "research_only",
        recommended_next_action: "Record supporting evidence, then compileProgrammaticPageCandidate.",
      }));

    report.pages_generated = 0;
    report.pages_reoptimized = 0;
    report.urls_submitted = 0;
    report.steps.push({
      step: "candidate_recommendations",
      ok: true,
      mode: "research_only",
      candidates: recommendedCandidates.length,
      keywords: recommendedCandidates.map((g) => g.keyword),
    });
    report.completed_at = new Date().toISOString();

    await logStep(base44, {
      category: "seo",
      action: "DDV3 SEO opportunity research completed",
      detail: `Opportunities: ${report.opportunities_found}, Candidate topics: ${recommendedCandidates.length}, Pages generated: 0, URLs submitted: 0`,
      meta: JSON.stringify({ mode: "research_only", steps: report.steps.length, errors: report.errors.length }),
      source: "autonomousSeoDominance",
    });

    return Response.json({
      ok: true,
      ...report,
      mode: "research_only",
      candidates: recommendedCandidates,
      note: "No pages were created or modified and no URLs were submitted to indexers.",
    });
  } catch (error) {
    console.error('[autonomousSeoDominance] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}