import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { generateTemplateHtml } from '../../shared/visualTemplateEngine.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Fetch ALL active templates
    const { items } = await base44.asServiceRole.entities.TemplateLibrary.filter(
      { is_active: true, status: 'active' },
      { sort: 'sort_order', limit: 500, fields: ['id', 'name', 'niche'] }
    );

    // Generate v2 styled HTML for each template
    const updates = items.map(t => ({
      id: t.id,
      content: generateTemplateHtml(t.niche, t.name),
    }));

    // Bulk update in batches of 200 (SDK limit)
    const batchSize = 200;
    let updated = 0;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      await base44.asServiceRole.entities.TemplateLibrary.bulkUpdate(batch);
      updated += batch.length;
    }

    return Response.json({
      success: true,
      total: items.length,
      updated,
      sample_length: updates[0]?.content?.length || 0,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}