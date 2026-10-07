import { createClientFromRequest } from 'npm:@base44/sdk@0.8.53';
import { secrets } from 'base44:runtime';

// ═══════════════════════════════════════════════════════════════════════════
// aiSiteGenerator — Generate a complete website from a text prompt or industry.
//
// Uses the Vercel AI Gateway (independent billing, not Base44 credits).
// Returns a full template structure with sections, brand config, and content.
// ═══════════════════════════════════════════════════════════════════════════

const GATEWAY_BASE = 'https://ai-gateway.vercel.sh/v1';

const SECTION_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Site name / brand name' },
    brand_config: {
      type: 'object',
      properties: {
        primary_color: { type: 'string' },
        secondary_color: { type: 'string' },
        accent_color: { type: 'string' },
        font_heading: { type: 'string' },
        font_body: { type: 'string' },
        tagline: { type: 'string' },
      },
    },
    sections: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          section_type: { type: 'string', enum: ['hero', 'stats', 'showcase', 'testimonials', 'cta', 'problem_solution', 'gallery', 'color_charts'] },
          name: { type: 'string' },
          content: {
            type: 'object',
            properties: {
              headline: { type: 'string' },
              subheadline: { type: 'string' },
              cta_text: { type: 'string' },
              background_image: { type: 'string' },
              trust_badges: { type: 'array', items: { type: 'string' } },
              items: { type: 'array', items: { type: 'object', properties: { value: { type: 'string' }, label: { type: 'string' } } } },
              systems: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, price_tier: { type: 'string' }, image: { type: 'string' } } } },
              reviews: { type: 'array', items: { type: 'object', properties: { text: { type: 'string' }, name: { type: 'string' }, role: { type: 'string' } } } },
              problems: { type: 'array', items: { type: 'string' } },
              swatches: { type: 'array', items: { type: 'object', properties: { hex: { type: 'string' }, name: { type: 'string' } } } },
              images: { type: 'array', items: { type: 'object', properties: { url: { type: 'string' } } } },
              title: { type: 'string' },
            },
          },
          enabled: { type: 'boolean' },
        },
        required: ['section_type', 'name'],
      },
    },
  },
  required: ['name', 'sections'],
};

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const apiKey = secrets.get('VERCEL_AI_GATEWAY_API_KEY') || secrets.get('VERCEL_API_TOKEN');
    if (!apiKey) return Response.json({ error: 'VERCEL_AI_GATEWAY_API_KEY not set' }, { status: 500 });

    const body = await req.json();
    const { prompt, industry_id, brand_name } = body;

    // Load industry template if specified
    let industryContext = '';
    if (industry_id) {
      const indPage = await base44.asServiceRole.entities.UniversalIndustryTemplate.filter(
        { industry_id }, { limit: 1 }
      );
      const ind = indPage.items?.[0];
      if (ind) {
        industryContext = `\n\nIndustry: ${ind.name}\nParent: ${ind.parent_industry}\nTarget audience: ${ind.target_audience || 'general'}\nKeywords: ${(ind.niche_keywords || []).join(', ')}\nBrand colors: ${ind.brand_config?.primary_color || '#4f46e5'}, ${ind.brand_config?.secondary_color || '#3730a3'}\nFonts: ${ind.brand_config?.font_heading || 'Inter'}, ${ind.brand_config?.font_body || 'Inter'}`;
      }
    }

    const userPrompt = (prompt || `Generate a complete homepage for ${brand_name || 'a local contractor'}.`) + industryContext;
    if (!prompt && !industry_id) return Response.json({ error: 'prompt or industry_id required' }, { status: 400 });

    const systemPrompt = `You are an expert web designer. Generate a complete, beautiful website homepage as a JSON object.

The site must include these sections in order:
1. hero — headline, subheadline, CTA, trust badges, background image URL
2. stats — 4 stat items (value + label)
3. showcase — 3 service/product systems with names and price tiers
4. problem_solution — 2-3 common problems
5. testimonials — 2 customer reviews
6. gallery — 6 image placeholders
7. cta — final call to action

Use real, compelling copy. Choose colors that match the industry. Return ONLY the JSON object.`;

    // Call Vercel AI Gateway
    const response = await fetch(`${GATEWAY_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'anthropic/claude-opus-4.7',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_schema', json_schema: { name: 'website', schema: SECTION_SCHEMA } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return Response.json({ error: `AI Gateway error: ${response.status} ${errText.slice(0, 200)}` }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return Response.json({ error: 'AI returned no content' }, { status: 502 });

    // Parse the generated template
    let template;
    try {
      template = typeof content === 'string' ? JSON.parse(content) : content;
    } catch (e) {
      return Response.json({ error: 'AI returned invalid JSON' }, { status: 502 });
    }

    return Response.json({
      ok: true,
      template,
      model: data.model || 'anthropic/claude-opus-4.7',
    });
  } catch (e) {
    console.error('aiSiteGenerator error:', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}