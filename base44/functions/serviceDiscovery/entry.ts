import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

/**
 * serviceDiscovery — the wizard's service AI assist.
 *
 * Reads the services a business already chose and their industry, then finds
 * the newer services and niches that trade is moving into. The owner ticks what
 * applies; nothing is ever added to their site automatically.
 *
 * Public on purpose: the launch wizard is used by visitors who are not signed in.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const industry = String(body.industry || '').slice(0, 120);
    const subIndustries = Array.isArray(body.subIndustries) ? body.subIndustries.slice(0, 10).map(String) : [];
    const chosen = Array.isArray(body.services) ? body.services.slice(0, 40).map(String) : [];

    if (!industry) return Response.json({ error: 'industry is required' }, { status: 400 });

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a market analyst for local service businesses. The business is a "${industry}" company${subIndustries.length ? ` specialising in: ${subIndustries.join(', ')}` : ''}.

They already offer these services: ${chosen.length ? chosen.join(', ') : '(none chosen yet)'}.

Using current market knowledge of this trade, do two things.

1. List the standard services a customer in this trade expects to be offered. This is "core" and it is judged against what the trade normally provides, not against what this business offers.
2. Identify services and niches they do NOT already offer that are worthwhile additions: what is in high demand right now, higher-margin upgrades, and adjacent niches this trade can realistically deliver.

Rules:
- Return 8 to 12 items.
- Each "name" is a short service or niche name in Title Case, 2 to 5 words (for example "Concrete Polishing" or "Commercial Maintenance Plans"). Never a sentence, never a question.
- Each "why" is one short sentence under 110 characters saying why it is worth adding now.
- "type" is "service" for a standard service, "niche" for a new market segment.
- "demand" is "high" when customers are actively asking for it now, "growing" when it is up and coming in this trade, "standard" otherwise.
- "core" lists 5 to 8 standard services of the trade.
- Do not repeat anything from the list they already offer in the items.
- Do not invent certifications, licences or guarantees.`,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          services: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                why: { type: 'string' },
                type: { type: 'string' },
                demand: { type: 'string' },
              },
              required: ['name', 'why', 'type', 'demand'],
            },
          },
          core: { type: 'array', items: { type: 'string' } },
        },
        required: ['services', 'core'],
      },
    });

    const raw = Array.isArray(result?.services) ? result.services : [];
    const seen = new Set(chosen.map(service => service.toLowerCase().trim()));
    const DEMAND_RANK: Record<string, number> = { high: 0, growing: 1, standard: 2 };
    const services = [];
    for (const item of raw) {
      const name = String(item?.name || '').trim().slice(0, 70);
      if (!name || seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      const demand = ['high', 'growing', 'standard'].includes(String(item?.demand)) ? String(item.demand) : 'standard';
      services.push({
        name,
        why: String(item?.why || '').trim().slice(0, 160),
        type: item?.type === 'niche' ? 'niche' : 'service',
        demand,
      });
    }

    // Deterministic order: what customers want most right now first, then by name.
    const ranked = services
      .sort((a, b) => {
        const rank = (DEMAND_RANK[a.demand] ?? 9) - (DEMAND_RANK[b.demand] ?? 9);
        return rank !== 0 ? rank : a.name.localeCompare(b.name);
      })
      .slice(0, 12);

    // Standard services of the trade that this business does not offer yet.
    const coreList = Array.isArray(result?.core) ? result.core : [];
    const coreMissing = [];
    const coreSeen = new Set();
    for (const entry of coreList) {
      const name = String(entry || '').trim().slice(0, 70);
      const key = name.toLowerCase();
      if (!name || coreSeen.has(key) || seen.has(key)) continue;
      coreSeen.add(key);
      coreMissing.push(name);
      if (coreMissing.length >= 8) break;
    }

    if (!ranked.length && !coreMissing.length) {
      console.error('serviceDiscovery: no usable services returned for', industry);
      return Response.json({ ok: false, error: 'No services returned', services: [], core_missing: [] }, { status: 200 });
    }

    return Response.json({
      ok: true,
      industry,
      services: ranked,
      core_missing: coreMissing,
      coverage: {
        offered: seen.size - coreMissing.length,
        missing_core: coreMissing.length,
        high_demand: ranked.filter(item => item.demand === 'high').length,
        up_and_coming: ranked.filter(item => item.demand === 'growing').length,
      },
    });
  } catch (error: any) {
    console.error('serviceDiscovery error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}