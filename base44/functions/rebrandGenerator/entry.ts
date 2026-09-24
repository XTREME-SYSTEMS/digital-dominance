import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { invokeIndependentAi } from '../../shared/independentCore.ts';

// REBRAND GENERATOR
// Takes an ingested website template and rebrands/enhances/modernizes it
// for a new industry using benchmark intelligence.

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const svc = base44.asServiceRole;

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'list';

    // === REBRAND: Rebrand an ingested website for a new industry ===
    if (action === 'rebrand') {
      const { website_id, new_industry, new_company_name, new_color_scheme, new_domain } = body;
      if (!website_id) return Response.json({ error: 'website_id required' }, { status: 400 });

      const records = await svc.entities.IngestedWebsite.filter({ website_id }, '-created_date', 1);
      if (!records[0]) return Response.json({ error: 'Website not found' }, { status: 404 });
      const website = records[0];

      // Get benchmark companies for the target industry
      const benchmarks = await svc.entities.BenchmarkCompany.filter(
        { industry: new_industry },
        '-benchmark_score',
        5
      );
      const benchmarkIntel = benchmarks.map(b => ({
        name: b.company_name,
        marketing: (b.marketing_intelligence || '').slice(0, 2000),
        design: (b.design_intelligence || '').slice(0, 2000),
        funnel: (b.funnel_analysis || '').slice(0, 1500),
      }));

      await svc.entities.IngestedWebsite.update(website.id, { stage: 'rebranding' });

      // Use LLM to generate rebranded content
      const rebrandRes = await invokeIndependentAi(svc, {
        prompt: `You are a world-class website rebrand engine. Take this ingested website template and completely rebrand and enhance it for a new industry.

ORIGINAL TEMPLATE:
- Source: ${website.source_name}
- Industry: ${website.industry}
- Template type: ${website.template_type}
- Layout style: ${website.layout_style}
- Cleaned content: ${(website.cleaned_content || '').slice(0, 15000)}
- Parsed structure: ${(website.parsed_structure || '').slice(0, 10000)}
- Color palette: ${JSON.stringify(website.color_palette)}
- Rebrand recommendations: ${(website.organized_data || '').slice(0, 3000)}

REBRAND TARGET:
- New industry: ${new_industry || 'general contractor'}
- New company name: ${new_company_name || 'Auto-Generated Brand'}
- New color scheme: ${new_color_scheme || 'auto-select based on industry'}
- New domain: ${new_domain || 'auto'}

BENCHMARK INTELLIGENCE (top companies in this industry):
${JSON.stringify(benchmarkIntel)}

Generate a complete rebranded website specification that:
1. Adapts all content for the new industry
2. Modernizes the design using benchmark intelligence
3. Enhances conversion elements based on top funnel strategies
4. Optimizes SEO for the new industry
5. Updates all copy, headlines, CTAs
6. Applies the new color scheme and branding
7. Adds any missing modern elements (schema, core web vitals, mobile-first)

Return JSON with the complete rebranded website specification.`,
        response_json_schema: {
          type: 'object',
          properties: {
            rebranded_name: { type: 'string' },
            rebranded_industry: { type: 'string' },
            rebranded_content: { type: 'string', description: 'Full rebranded website content/specification' },
            color_scheme: { type: 'object', properties: {
              primary: { type: 'string' }, secondary: { type: 'string' }, accent: { type: 'string' }, background: { type: 'string' },
            } },
            hero_headline: { type: 'string' },
            hero_subheadline: { type: 'string' },
            primary_cta: { type: 'string' },
            sections: { type: 'array', items: { type: 'object', properties: {
              name: { type: 'string' }, content: { type: 'string' }, components: { type: 'array', items: { type: 'string' } },
            } } },
            seo_metadata: { type: 'object', properties: {
              title: { type: 'string' }, description: { type: 'string' }, keywords: { type: 'array', items: { type: 'string' } },
            } },
            conversion_enhancements: { type: 'array', items: { type: 'string' } },
            modernization_notes: { type: 'array', items: { type: 'string' } },
            benchmark_score: { type: 'integer' },
          },
        },
      });

      const rebrandConfig = JSON.stringify({
        new_industry,
        new_company_name,
        new_color_scheme,
        new_domain,
        benchmark_references: benchmarks.map(b => b.company_id),
      });

      await svc.entities.IngestedWebsite.update(website.id, {
        stage: 'rebranded',
        rebrand_config: rebrandConfig.slice(0, 10000),
        rebranded_content: JSON.stringify(rebrandRes).slice(0, 50000),
        benchmark_references: benchmarks.map(b => b.company_id),
        quality_score: rebrandRes.benchmark_score || website.quality_score,
      });

      return Response.json({ ok: true, website_id, rebrand: rebrandRes, benchmark_count: benchmarks.length });
    }

    // === ENHANCE: Modernize/enhance a template without changing industry ===
    if (action === 'enhance') {
      const { website_id } = body;
      if (!website_id) return Response.json({ error: 'website_id required' }, { status: 400 });

      const records = await svc.entities.IngestedWebsite.filter({ website_id }, '-created_date', 1);
      if (!records[0]) return Response.json({ error: 'Website not found' }, { status: 404 });
      const website = records[0];

      const enhanceRes = await invokeIndependentAi(svc, {
        prompt: `You are a website modernization engine. Enhance and modernize this website template to bring it to 2026 standards.

Template: ${website.source_name}
Industry: ${website.industry}
Content: ${(website.cleaned_content || '').slice(0, 20000)}
Structure: ${(website.parsed_structure || '').slice(0, 10000)}

Enhancements needed:
1. Modernize design patterns (glassmorphism, bold typography, micro-interactions)
2. Add modern conversion elements (sticky CTAs, exit intent, social proof)
3. Improve SEO (schema markup, core web vitals, semantic HTML)
4. Add mobile-first responsive considerations
5. Enhance accessibility (WCAG 2.1)
6. Add modern content patterns (video backgrounds, animated counters)

Return JSON with enhanced specification.`,
        response_json_schema: {
          type: 'object',
          properties: {
            enhanced_content: { type: 'string' },
            modernization_changes: { type: 'array', items: { type: 'string' } },
            new_design_score: { type: 'integer' },
            new_conversion_score: { type: 'integer' },
            new_seo_score: { type: 'integer' },
          },
        },
      });

      await svc.entities.IngestedWebsite.update(website.id, {
        rebranded_content: enhanceRes.enhanced_content || '',
        design_score: enhanceRes.new_design_score || website.design_score,
        conversion_score: enhanceRes.new_conversion_score || website.conversion_score,
        seo_score: enhanceRes.new_seo_score || website.seo_score,
        quality_score: Math.round(((enhanceRes.new_design_score + enhanceRes.new_conversion_score + enhanceRes.new_seo_score) / 3)),
      });

      return Response.json({ ok: true, website_id, enhancement: enhanceRes });
    }

    // === CLONE: Clone a template for a new industry (alias for rebrand) ===
    if (action === 'clone') {
      return Response.json({ ok: true, message: 'Use action:rebrand with website_id and new_industry' });
    }

    // === LIST: List rebranded-ready templates ===
    if (action === 'list') {
      const { stage = 'categorized', limit = 50 } = body;
      const records = await svc.entities.IngestedWebsite.filter({ stage }, '-quality_score', limit);
      return Response.json({ ok: true, count: records.length, templates: records });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}