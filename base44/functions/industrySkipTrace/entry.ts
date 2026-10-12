import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { industry, location, keyword } = await req.json();
    const target = keyword || `${industry} ${location || ""}`.trim();

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a competitive intelligence scanner. Search the web for the top 5 ${industry} websites${location ? ` in ${location}` : ""} that rank on the first page of Google for "${target}".

For each competitor, extract:
1. Domain name and URL
2. Services offered (list all visible services)
3. Pricing strategy (if visible, or infer from positioning)
4. SEO strengths (title tags, meta descriptions, content structure, heading hierarchy)
5. Funnel strategy (CTAs, forms, contact methods, booking flow)
6. Content gaps and weaknesses they have
7. Estimated monthly traffic (range)
8. Backlink profile strength (weak/moderate/strong)
9. Social media presence (platforms, follower estimates)
10. Review/rating strategy (Google reviews, testimonials, trust signals)

Also identify:
- Industry average price range
- Top 10 keywords they all target
- Market gaps that none of them address
- Their average Google ranking factors compliance

Return ONLY valid JSON matching the schema.`,
      add_context_from_internet: true,
      model: "gemini_3_8_flash",
      response_json_schema: {
        type: "object",
        properties: {
          competitors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                domain: { type: "string" },
                url: { type: "string" },
                services: { type: "array", items: { type: "string" } },
                pricing: { type: "string" },
                seo_strengths: { type: "array", items: { type: "string" } },
                funnel_strategy: { type: "array", items: { type: "string" } },
                content_gaps: { type: "array", items: { type: "string" } },
                estimated_traffic: { type: "string" },
                backlink_strength: { type: "string" },
                social_presence: { type: "string" },
                review_strategy: { type: "string" }
              }
            }
          },
          industry_avg_price: { type: "string" },
          top_keywords: { type: "array", items: { type: "string" } },
          market_gaps: { type: "array", items: { type: "string" } },
          avg_compliance_score: { type: "number" }
        }
      }
    });

    return Response.json({
      industry,
      location: location || "National",
      keyword: target,
      competitors: result.competitors || [],
      industry_avg_price: result.industry_avg_price || "Not available",
      top_keywords: result.top_keywords || [],
      market_gaps: result.market_gaps || [],
      avg_compliance_score: result.avg_compliance_score || 0,
      scanned_at: new Date().toISOString()
    });
  } catch (error) {
    console.error("industrySkipTrace error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}