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

Using current market knowledge of this trade, identify services and niches they do NOT already offer that are worthwhile additions. Prioritise services that are growing in demand right now, higher-margin upgrades, and adjacent niches this trade can realistically deliver.

Rules:
- Return 8 to 12 items.
- Each "name" is a short service or niche name in Title Case, 2 to 5 words (for example "Concrete Polishing" or "Commercial Maintenance Plans"). Never a sentence, never a question.
- Each "why" is one short sentence under 110 characters saying why it is worth adding now.
- "type" is "service" for a standard service, "niche" for a new market segment.
- Do not repeat anything from the list they already offer.
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
              },
              required: ['name', 'why', 'type'],
            },
          },
        },
        required: ['services'],
      },
    });

    const raw = Array.isArray(result?.services) ? result.services : [];
    const seen = new Set(chosen.map(service => service.toLowerCase().trim()));
    const services = [];
    for (const item of raw) {
      const name = String(item?.name || '').trim().slice(0, 70);
      if (!name || seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      services.push({
        name,
        why: String(item?.why || '').trim().slice(0, 160),
        type: item?.type === 'niche' ? 'niche' : 'service',
      });
      if (services.length >= 12) break;
    }

    if (!services.length) {
      console.error('serviceDiscovery: no usable services returned for', industry);
      return Response.json({ ok: false, error: 'No services returned', services: [] }, { status: 200 });
    }

    return Response.json({ ok: true, industry, services });
  } catch (error: any) {
    console.error('serviceDiscovery error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}