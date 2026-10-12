import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { industry, skipTraceData, brandConfig, location } = await req.json();

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a digital dominance benchmark enhancer. Given competitor analysis for the ${industry} industry${location ? ` in ${location}` : ""}, generate enhanced content that outperforms ALL competitors in SEO, AEO, GEO, conversion, and competitive positioning.

Competitor data: ${JSON.stringify(skipTraceData?.competitors || [])}
Market gaps: ${JSON.stringify(skipTraceData?.market_gaps || [])}
Top keywords: ${JSON.stringify(skipTraceData?.top_keywords || [])}
Industry avg price: ${skipTraceData?.industry_avg_price || "Unknown"}
Brand config: ${JSON.stringify(brandConfig || {})}

Generate a complete enhancement package:

1. ENHANCED HERO: A hero headline + subheadline that beats every competitor's hero
2. ENHANCED SERVICES: 6-8 service descriptions with SEO keywords embedded naturally
3. AEO FAQ: 8 question-answer pairs competitors DON'T answer (for AI Overview capture)
4. GEO STRATEGY: Target cities + location page template for local dominance
5. PRICING STRATEGY: Competitive positioning with specific price points and value props
6. FUNNEL OPTIMIZATION: 5-8 specific funnel improvements to increase conversion
7. CONTENT CALENDAR: 30-day publishing schedule with topics and keywords
8. TRUST SIGNALS: Reviews, testimonials, certifications, and social proof strategy
9. SCHEMA RECOMMENDATIONS: Specific schema.org markup types to implement
10. INTERNAL LINKING: Hub-and-spoke internal linking strategy
11. COMPETITIVE ADVANTAGES: 5 specific advantages to highlight vs competitors
12. DIGITAL DOMINANCE VARIATIONS: 3 page variation strategies for A/B testing

Return ONLY valid JSON matching the schema.`,
      add_context_from_internet: true,
      model: "gemini_3_8_flash",
      response_json_schema: {
        type: "object",
        properties: {
          enhanced_hero: { type: "object", properties: { headline: { type: "string" }, subheadline: { type: "string" } } },
          enhanced_services: { type: "array", items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, seo_keywords: { type: "array", items: { type: "string" } } } } },
          aeo_faq: { type: "array", items: { type: "object", properties: { question: { type: "string" }, answer: { type: "string" } } } },
          geo_strategy: { type: "object", properties: { target_cities: { type: "array", items: { type: "string" } }, location_page_template: { type: "string" } } },
          pricing_strategy: { type: "object", properties: { position: { type: "string" }, price_points: { type: "array", items: { type: "string" } }, value_props: { type: "array", items: { type: "string" } } } },
          funnel_optimization: { type: "array", items: { type: "string" } },
          content_calendar: { type: "array", items: { type: "object", properties: { day: { type: "number" }, topic: { type: "string" }, keywords: { type: "array", items: { type: "string" } } } } },
          trust_signals: { type: "array", items: { type: "string" } },
          schema_recommendations: { type: "array", items: { type: "string" } },
          internal_linking: { type: "array", items: { type: "string" } },
          competitive_advantages: { type: "array", items: { type: "string" } },
          dominance_variations: { type: "array", items: { type: "object", properties: { name: { type: "string" }, strategy: { type: "string" }, target_metric: { type: "string" } } } }
        }
      }
    });

    return Response.json({
      industry,
      location: location || "National",
      enhanced: result,
      enhanced_at: new Date().toISOString()
    });
  } catch (error) {
    console.error("benchmarkEnhancer error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}