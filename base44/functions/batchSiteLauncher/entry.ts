import { createClientFromRequest } from 'npm:@base44/sdk@0.8.53';

// ═══════════════════════════════════════════════════════════════════════════
// batchSiteLauncher — Launch hundreds to thousands of websites in one call.
//
// Takes selected template IDs, a niche, keyword pattern, and a list of cities.
// Creates a WebsiteQueue entry for every template × city combination.
// Each entry is picked up by the autonomous build pipeline.
// ═══════════════════════════════════════════════════════════════════════════

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { template_ids, niche, keyword_pattern, cities } = body;

    if (!template_ids || !Array.isArray(template_ids) || template_ids.length === 0) {
      return Response.json({ error: 'template_ids required' }, { status: 400 });
    }
    if (!niche) return Response.json({ error: 'niche required' }, { status: 400 });
    if (!keyword_pattern) return Response.json({ error: 'keyword_pattern required' }, { status: 400 });

    const cityList = Array.isArray(cities) ? cities : (cities ? String(cities).split('\n').map((c: string) => c.trim()).filter(Boolean) : []);
    const targetCities = cityList.length > 0 ? cityList : [''];

    // Load the selected templates
    const tplPage = await base44.asServiceRole.entities.BrandTemplate.filter(
      { id: { $in: template_ids } },
      { limit: 500 }
    );
    const templates = tplPage.items || [];

    if (templates.length === 0) {
      return Response.json({ error: 'No templates found for the given IDs' }, { status: 404 });
    }

    // Create a WebsiteQueue entry for every template × city combination
    const queueEntries: any[] = [];
    for (const tpl of templates) {
      for (const city of targetCities) {
        const cityName = city || '';
        const stateMatch = cityName.match(/,\s*([A-Z]{2})\s*$/);
        const targetCity = stateMatch ? cityName.replace(/,\s*[A-Z]{2}\s*$/, '').trim() : cityName;
        const targetState = stateMatch ? stateMatch[1] : '';

        queueEntries.push({
          keyword: `${niche.replace(/_/g, ' ')} ${keyword_pattern.replace(/_/g, ' ')}${targetCity ? ' ' + targetCity : ''}`.trim(),
          niche,
          keyword_pattern,
          target_city: targetCity,
          target_state: targetState,
          domain: '',
          status: 'queued',
          priority: 'normal',
        });
      }
    }

    // Bulk create in batches of 100
    let queued = 0;
    const BATCH_SIZE = 100;
    for (let i = 0; i < queueEntries.length; i += BATCH_SIZE) {
      const batch = queueEntries.slice(i, i + BATCH_SIZE);
      try {
        await base44.asServiceRole.entities.WebsiteQueue.bulkCreate(batch);
        queued += batch.length;
      } catch (e) {
        console.error(`Batch ${i / BATCH_SIZE} failed:`, e.message);
      }
    }

    return Response.json({
      ok: true,
      queued,
      templates_used: templates.length,
      cities_targeted: targetCities.length,
      total_combinations: queueEntries.length,
    });
  } catch (e) {
    console.error('batchSiteLauncher error:', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}