import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { patchCore } from '../../shared/aiGateway.ts';
import { browseStealth } from '../../shared/cloudBrowser.ts';

// TOP SITES BENCHMARK SCANNER
// Uses cloud browser to find and benchmark the top 20 website templates,
// graphics, creators, and marketing companies globally.
// Ingests their intelligence for the autonomous dominance system.

const TOP_SITE_CATEGORIES = [
  'best website templates 2026',
  'top website design agencies 2026',
  'best marketing companies 2026',
  'top website graphics and design 2026',
  'best funnel builders 2026',
  'top social media marketing agencies 2026',
  'best SEO companies 2026',
  'top branding agencies 2026',
];

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    const svc = base44.asServiceRole;
    patchCore(base44);
    patchCore(svc);

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'status';

    // === SCAN: Use cloud browser to scan top sites in a category ===
    if (action === 'scan') {
      const { category, max_results = 20 } = body;
      const searchQuery = category || 'best website templates 2026';

      // Use LLM with web search to find top sites
      const searchRes = await svc.integrations.Core.InvokeLLM({
        prompt: `Search the web and find the top ${max_results} results for: "${searchQuery}".

For each result, provide:
1. Company/site name
2. URL
3. What they do (1-2 sentences)
4. Why they are top-ranked (their key differentiator)
5. Category (marketing_agency, web_design, saas, ecommerce, media, social_media, seo, content, funnel, branding)

Return a JSON array of objects with: company_name, url, description, differentiator, category`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  company_name: { type: 'string' },
                  url: { type: 'string' },
                  description: { type: 'string' },
                  differentiator: { type: 'string' },
                  category: { type: 'string' },
                },
              },
            },
          },
        },
      });

      const results = searchRes.results || [];
      const ingested = [];

      // Ingest each found site's intelligence
      for (const site of results.slice(0, max_results)) {
        try {
          const company_id = `BC-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

          // Try to browse the site for deeper intelligence
          let pageContent = '';
          try {
            const browseResult = await browseStealth(site.url, { maxChars: 20000, retries: 2 });
            pageContent = browseResult.text || '';
          } catch (e: any) {
            // Continue even if browse fails
          }

          // Use LLM to extract marketing and design intelligence
          const intelRes = await svc.integrations.Core.InvokeLLM({
            prompt: `Analyze this top company's website and extract marketing and design intelligence.

Company: ${site.company_name}
URL: ${site.url}
Description: ${site.description}
Differentiator: ${site.differentiator}
Page content: ${pageContent.slice(0, 15000)}

Extract:
1. Marketing intelligence: their core strategies, positioning, target audience, value proposition
2. Design intelligence: design patterns, color theory, typography, layout approach
3. Funnel analysis: their conversion funnel structure, CTAs, lead capture methods
4. Social media strategy: platforms used, content types, engagement tactics
5. Revenue model: how they make money, pricing approach
6. Growth tactics: their growth strategies, customer acquisition methods
7. Content strategy: their content marketing approach
8. Overall benchmark score (0-100)

Return JSON with all fields.`,
            response_json_schema: {
              type: 'object',
              properties: {
                marketing_intelligence: { type: 'string' },
                design_intelligence: { type: 'string' },
                funnel_analysis: { type: 'string' },
                social_media_strategy: { type: 'string' },
                revenue_model: { type: 'string' },
                growth_tactics: { type: 'string' },
                content_strategy: { type: 'string' },
                benchmark_score: { type: 'integer' },
              },
            },
          });

          const record = await svc.entities.BenchmarkCompany.create({
            owner_id: user.id,
            company_id,
            company_name: site.company_name,
            url: site.url,
            industry: site.category || 'general',
            category: site.category || 'custom',
            marketing_intelligence: intelRes.marketing_intelligence || '',
            design_intelligence: intelRes.design_intelligence || '',
            funnel_analysis: intelRes.funnel_analysis || '',
            social_media_strategy: intelRes.social_media_strategy || '',
            revenue_model: intelRes.revenue_model || '',
            growth_tactics: intelRes.growth_tactics || '',
            content_strategy: intelRes.content_strategy || '',
            benchmark_score: intelRes.benchmark_score || 75,
            ingested_content: pageContent.slice(0, 30000),
            is_top_20: true,
            tags: [searchQuery, 'top-20', 'benchmark'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          ingested.push({ company_name: site.company_name, company_id, benchmark_score: intelRes.benchmark_score || 75 });
        } catch (e: any) {
          // Continue with next site
        }
      }

      return Response.json({ ok: true, category: searchQuery, scanned: results.length, ingested: ingested.length, companies: ingested });
    }

    // === SCAN ALL: Scan all top categories ===
    if (action === 'scan_all') {
      const allResults = [];
      for (const cat of TOP_SITE_CATEGORIES) {
        try {
          const searchRes = await svc.integrations.Core.InvokeLLM({
            prompt: `Search the web and find the top 20 results for: "${cat}". Return JSON with results array of {company_name, url, description, differentiator, category}.`,
            add_context_from_internet: true,
            response_json_schema: {
              type: 'object',
              properties: {
                results: { type: 'array', items: { type: 'object', properties: {
                  company_name: { type: 'string' }, url: { type: 'string' }, description: { type: 'string' }, differentiator: { type: 'string' }, category: { type: 'string' },
                } } },
              },
            },
          });
          allResults.push({ category: cat, count: (searchRes.results || []).length });
        } catch (e: any) {
          allResults.push({ category: cat, error: e.message });
        }
      }
      return Response.json({ ok: true, categories_scanned: allResults.length, results: allResults, message: 'Use action:scan per category for full ingestion' });
    }

    // === INGEST URL: Ingest intelligence from a specific URL ===
    if (action === 'ingest_url') {
      const { url, company_name, category } = body;
      if (!url) return Response.json({ error: 'url required' }, { status: 400 });

      let pageContent = '';
      try {
        const browseResult = await browseStealth(url, { maxChars: 30000, retries: 3 });
        pageContent = browseResult.text || '';
      } catch (e: any) {
        return Response.json({ error: `Failed to browse URL: ${e.message}` }, { status: 500 });
      }

      const intelRes = await svc.integrations.Core.InvokeLLM({
        prompt: `Deeply analyze this website and extract all marketing, design, and business intelligence.

URL: ${url}
Content: ${pageContent.slice(0, 20000)}

Extract comprehensive intelligence across all dimensions: marketing strategies, design patterns, funnel structure, social media, revenue model, growth tactics, content strategy. Score 0-100.`,
        response_json_schema: {
          type: 'object',
          properties: {
            marketing_intelligence: { type: 'string' },
            design_intelligence: { type: 'string' },
            funnel_analysis: { type: 'string' },
            social_media_strategy: { type: 'string' },
            revenue_model: { type: 'string' },
            growth_tactics: { type: 'string' },
            content_strategy: { type: 'string' },
            benchmark_score: { type: 'integer' },
          },
        },
      });

      const company_id = `BC-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const record = await svc.entities.BenchmarkCompany.create({
        owner_id: user.id,
        company_id,
        company_name: company_name || url,
        url,
        industry: category || 'general',
        category: category || 'custom',
        marketing_intelligence: intelRes.marketing_intelligence || '',
        design_intelligence: intelRes.design_intelligence || '',
        funnel_analysis: intelRes.funnel_analysis || '',
        social_media_strategy: intelRes.social_media_strategy || '',
        revenue_model: intelRes.revenue_model || '',
        growth_tactics: intelRes.growth_tactics || '',
        content_strategy: intelRes.content_strategy || '',
        benchmark_score: intelRes.benchmark_score || 75,
        ingested_content: pageContent.slice(0, 30000),
        is_top_20: false,
        tags: ['manual-ingest'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      return Response.json({ ok: true, company_id, benchmark_score: intelRes.benchmark_score || 75 });
    }

    // === LIST: List benchmark companies ===
    if (action === 'list') {
      const { category, is_top_20, limit = 50 } = body;
      const filter: any = {};
      if (category) filter.category = category;
      if (is_top_20 !== undefined) filter.is_top_20 = is_top_20;
      const records = await svc.entities.BenchmarkCompany.filter(filter, '-benchmark_score', limit);
      return Response.json({ ok: true, count: records.length, companies: records });
    }

    // === STATUS: Get scanner status ===
    if (action === 'status') {
      const all = await svc.entities.BenchmarkCompany.filter({}, '-created_date', 500);
      const byCategory = {};
      for (const c of all) {
        const cat = c.category || 'unknown';
        byCategory[cat] = (byCategory[cat] || 0) + 1;
      }
      return Response.json({
        ok: true,
        total_companies: all.length,
        top_20_count: all.filter(c => c.is_top_20).length,
        avg_benchmark_score: all.length > 0 ? Math.round(all.reduce((s, c) => s + (c.benchmark_score || 0), 0) / all.length) : 0,
        by_category: byCategory,
        categories_available: TOP_SITE_CATEGORIES,
      });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}