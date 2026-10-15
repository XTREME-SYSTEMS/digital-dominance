import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { mode, entities, maxRecords } = body;

    if (!entities || !Array.isArray(entities)) {
      return Response.json({ error: 'entities array required' }, { status: 400 });
    }

    const cap = typeof maxRecords === 'number' ? maxRecords : 50000;

    if (mode === 'counts') {
      const counts = {};
      for (let i = 0; i < entities.length; i += 6) {
        const batch = entities.slice(i, i + 6);
        await Promise.allSettled(batch.map(async (name) => {
          try {
            if (name === 'User') {
              counts[name] = -2;
            } else {
              counts[name] = await base44.asServiceRole.entities[name].count({});
            }
          } catch (e) {
            counts[name] = -1;
          }
        }));
      }
      return Response.json({ counts });
    }

    // mode === 'export' (default)
    const results = {};
    const errors = {};

    for (let i = 0; i < entities.length; i += 6) {
      const batch = entities.slice(i, i + 6);
      await Promise.allSettled(batch.map(async (name) => {
        try {
          if (name === 'User') {
            const records = await base44.asServiceRole.entities.User.list({ sort: '-created_date', limit: 500 });
            results[name] = Array.isArray(records) ? records : (records.items || []);
          } else {
            const allRecords = [];
            let cursor = undefined;
            let hasMore = true;
            let pages = 0;
            while (hasMore && pages < 200 && allRecords.length < cap) {
              const opts = { sort: '-created_date', limit: 500 };
              if (cursor) opts.cursor = cursor;
              const page = await base44.asServiceRole.entities[name].filter({}, opts);
              allRecords.push(...page.items);
              hasMore = page.has_more;
              cursor = page.next_cursor;
              pages++;
            }
            results[name] = allRecords;
          }
        } catch (e) {
          errors[name] = e.message;
        }
      }));
    }

    return Response.json({ data: results, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}