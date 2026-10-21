import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// INDUSTRY DISCOVERY ENGINE
// Runs an exhaustive, web-grounded discovery pass for one industry and market:
// services, image prompts, products and tools, hooks, phrases and slogans,
// SEO/AEO/GEO targeting, trust signals, marketing recommendations,
// preferred layouts, font pairings and funnel placements.
// Results are stored on the BrandProfile so the studio can build from them.

export default async function (req: Request): Promise<Response> {
  let profileId = '';
  let svc: any = null;
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { industry, industry_label, city, state, business_name } = body;
    profileId = body.profile_id || '';
    if (!industry) return Response.json({ error: 'industry required' }, { status: 400 });

    svc = base44.asServiceRole;
    const market = [city, state].filter(Boolean).join(', ') || 'the United States';
    const label = industry_label || industry;
    const name = business_name || `a ${label} business`;

    if (profileId) {
      await svc.entities.BrandProfile.update(profileId, {
        discovery_status: 'running',
        discovery_error: '',
      }).catch(() => {});
    }

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a senior trade-industry research analyst and conversion strategist. Research the "${label}" industry serving ${market} and produce an exhaustive, practical discovery dossier for ${name}.

Ground the research in how real ${label} companies actually operate and market. Be specific and concrete, never generic. Return ONLY JSON matching the schema.

Cover all of the following:
1. services — every service a ${label} company in ${market} typically sells, each with a one-line description and the exact question a buyer asks before booking it.
2. image_prompts — 8 highly descriptive image-generation prompts (hero, about, gallery x3, before/after, team, equipment). Each must name the specific subject, materials, lighting, camera angle and mood for this trade. No generic stock-photo language.
3. products_and_tools — the materials, products, equipment and tools this trade actually uses on the job (name, what it is used for, common brands).
4. hooks — 10 psychologically catching opening lines that stop a scroll for this trade.
5. phrases_and_slogans — the words, phrases and slogans customers and competitors in this trade actually use.
6. seo_keywords — 15 high-intent search terms buyers use for this trade in ${market}.
7. aeo_questions — 12 real questions buyers ask, phrased the way they ask them.
8. geo_facts — 8 location and entity facts an AI answer engine needs to cite this business (service area, years, credentials, licensing).
9. trust_signals — how companies in this trade prove credibility (years in business, ratings, reviews, certifications, licenses, associations, awards, warranties).
10. marketing_recommendations — the top 20 website marketing recommendations for maximizing engagement in this trade, each focused on answering questions, solving problems, providing value and outranking competitors.
11. preferred_layouts — the 10 most common and best-performing website layouts for this trade, each with why it converts.
12. font_pairings — 20 headlining/body font pairings suited to this trade, each with the mood it sets.
13. funnel_placements — the 5 best funnel placements for this trade (where the offer sits on the page) with the offer to place there.
14. pages — the 5 to 7 pages a professional ${label} website needs, each with its purpose and its section list.`,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          services: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                buyer_question: { type: 'string' }
              }
            }
          },
          image_prompts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                slot: { type: 'string' },
                prompt: { type: 'string' }
              }
            }
          },
          products_and_tools: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                use: { type: 'string' },
                brand_examples: { type: 'string' }
              }
            }
          },
          hooks: { type: 'array', items: { type: 'string' } },
          phrases_and_slogans: { type: 'array', items: { type: 'string' } },
          seo_keywords: { type: 'array', items: { type: 'string' } },
          aeo_questions: { type: 'array', items: { type: 'string' } },
          geo_facts: { type: 'array', items: { type: 'string' } },
          trust_signals: { type: 'array', items: { type: 'string' } },
          marketing_recommendations: { type: 'array', items: { type: 'string' } },
          preferred_layouts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                why: { type: 'string' }
              }
            }
          },
          font_pairings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                heading: { type: 'string' },
                body: { type: 'string' },
                mood: { type: 'string' }
              }
            }
          },
          funnel_placements: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                placement: { type: 'string' },
                offer: { type: 'string' }
              }
            }
          },
          pages: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                purpose: { type: 'string' },
                sections: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      }
    });

    const discovery = { ...result, market, discovered_at: new Date().toISOString() };

    if (profileId) {
      await svc.entities.BrandProfile.update(profileId, {
        discovery,
        discovery_status: 'ready',
      }).catch((e: any) => console.error('discovery save failed:', e.message));
    }

    return Response.json({ discovery, discovery_status: 'ready' });
  } catch (error: any) {
    console.error('industryDiscovery error:', error.message);
    if (profileId && svc) {
      await svc.entities.BrandProfile.update(profileId, {
        discovery_status: 'failed',
        discovery_error: String(error.message || 'Discovery failed').slice(0, 500),
      }).catch(() => {});
    }
    return Response.json({ error: error.message || 'Discovery failed' }, { status: 500 });
  }
}