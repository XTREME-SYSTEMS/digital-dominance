import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

// ─────────────────────────────────────────────────────────────────────────────
// siteBankOrchestrator — Deterministic, credit-free site launch automation.
//
// NO InvokeLLM, NO GenerateImage, NO external AI calls. Pure entity CRUD +
// deterministic string logic. Every action logs a SyncEvent to GPT (also just
// an entity write — no credits).
//
// Actions:
//   launchBatch    — Create N sites from active templates × locations, build
//                    backlink network, tag, and sync to GPT. All deterministic.
//   buildBacklinks — Rebuild the backlink network for a batch or all sites.
//   syncToGpt      — Log pending SyncEvents for unsynced sites.
//   getStats       — Total sites, live, synced, backlink count, by niche.
//   listSites      — Paginated list with filters.
//   addTags        — Add deterministic tags to a site.
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_DOMAIN_BASE = 'epoxyquotenearme.com';
const LINK_TYPES = ['footer', 'blog_roll', 'related_service', 'location_page', 'directory'];
const MAX_BACKLINKS_PER_SITE = 8;

// Deterministic SEO meta — no AI, just string templates
function buildSeoMeta(siteName, niche, city, state) {
  const cleanNiche = (niche || 'service').replace(/_/g, ' ');
  const cityStr = city ? `${city}, ${state || ''}`.trim() : '';
  const title = city
    ? `${siteName} | ${cleanNiche.charAt(0).toUpperCase() + cleanNiche.slice(1)} in ${city}, ${state || ''}`
    : `${siteName} | ${cleanNiche.charAt(0).toUpperCase() + cleanNiche.slice(1)}`;
  const description = city
    ? `Professional ${cleanNiche} services in ${city}, ${state}. Get a free estimate today. Trusted local ${cleanNiche} experts.`
    : `Professional ${cleanNiche} services. Get a free estimate today. Trusted local ${cleanNiche} experts.`;
  const keywords = [
    `${cleanNiche} ${city || ''}`.trim(),
    `${cleanNiche} near me`,
    `${cleanNiche} ${state || ''}`.trim(),
    `best ${cleanNiche} ${city || ''}`.trim(),
    `affordable ${cleanNiche}`,
    `${cleanNiche} cost`,
    `${cleanNiche} contractor`,
  ].filter(Boolean);
  return { title, description, keywords, og_title: title };
}

// Deterministic tags — no AI
function buildTags(niche, city, state, templateName) {
  const cleanNiche = (niche || '').replace(/_/g, '-').toLowerCase();
  const tags = [
    `niche:${cleanNiche}`,
    `template:${(templateName || '').toLowerCase().replace(/\s+/g, '-')}`,
  ];
  if (city) tags.push(`city:${city.toLowerCase().replace(/\s+/g, '-')}`);
  if (state) tags.push(`state:${state.toLowerCase()}`);
  tags.push('auto-launched', 'credit-free', 'deterministic');
  return tags;
}

// Deterministic slug
function buildSlug(niche, city, state, templateSlug) {
  const parts = [
    (niche || 'site').replace(/_/g, '-').toLowerCase(),
    city ? city.toLowerCase().replace(/\s+/g, '-') : null,
    state ? state.toLowerCase() : null,
    templateSlug ? templateSlug.toLowerCase() : null,
  ].filter(Boolean);
  return parts.join('-');
}

// Deterministic site name
function buildSiteName(niche, city, state) {
  const cleanNiche = (niche || 'service').replace(/_/g, ' ');
  const capNiche = cleanNiche.charAt(0).toUpperCase() + cleanNiche.slice(1);
  if (city) return `${capNiche} ${city}`;
  return `${capNiche} Pro`;
}

// Deterministic anchor text for backlinks
function buildAnchorText(fromSite, toSite) {
  const toNiche = (toSite.niche || '').replace(/_/g, ' ');
  const toCity = toSite.target_city || '';
  if (toCity) return `${toNiche.charAt(0).toUpperCase() + toNiche.slice(1)} in ${toCity}`;
  return `${toNiche.charAt(0).toUpperCase() + toNiche.slice(1)} experts`;
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    // Fail closed before granting the service role. The SiteBank administration
    // endpoint must never execute privileged CRUD for anonymous callers.
    // The former public entrypoint allowed launchBatch and buildBacklinks without
    // any session check. Scheduled service calls must use a separately reviewed,
    // scoped authentication path; do not reuse the GPT Sync superuser key here.
    const actor = await base44.auth.me().catch(() => null);
    if (!actor) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (actor.role !== 'admin') {
      return Response.json({ error: 'Administrator access required' }, { status: 403 });
    }

    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'getStats';

    // ── launchBatch: Create sites from templates × locations ──
    if (action === 'launchBatch') {
      const { template_ids, locations, domain_base, batch_id } = body;
      const domainBase = domain_base || DEFAULT_DOMAIN_BASE;
      const batchId = batch_id || `bank-${Date.now()}`;

      // Get templates — either specified IDs or all active ones
      let templates;
      if (template_ids && template_ids.length > 0) {
        templates = extractItems(await svc.entities.TemplateLibrary.filter(
          { _id: { $in: template_ids } },
          undefined,
          100
        ));
      } else {
        templates = extractItems(await svc.entities.TemplateLibrary.filter(
          { is_active: true, status: 'active' },
          'sort_order',
          100
        ));
      }

      if (!templates || templates.length === 0) {
        return Response.json({ error: 'No active templates found' }, { status: 400 });
      }

      // Default locations if none provided
      const locs = locations && locations.length > 0 ? locations : [
        { city: 'Miami', state: 'FL' },
        { city: 'Orlando', state: 'FL' },
        { city: 'Tampa', state: 'FL' },
        { city: 'Jacksonville', state: 'FL' },
        { city: 'Fort Lauderdale', state: 'FL' },
      ];

      // Build all site entries deterministically
      const sitesToCreate = [];
      for (const tpl of templates) {
        for (const loc of locs) {
          const slug = buildSlug(tpl.niche, loc.city, loc.state, tpl.slug);
          const siteName = buildSiteName(tpl.niche, loc.city, loc.state);
          const domain = `${slug}.${domainBase}`;
          const siteUrl = `https://${domain}`;
          const tags = buildTags(tpl.niche, loc.city, loc.state, tpl.name);
          const seoMeta = buildSeoMeta(siteName, tpl.niche, loc.city, loc.state);

          sitesToCreate.push({
            site_slug: slug,
            site_name: siteName,
            template_id: tpl.id,
            template_name: tpl.name,
            niche: tpl.niche || 'general',
            target_city: loc.city,
            target_state: loc.state,
            domain,
            site_url: siteUrl,
            tags,
            backlinks: [],
            inbound_link_count: 0,
            seo_meta: seoMeta,
            gpt_synced: false,
            launch_batch_id: batchId,
            status: 'queued',
            launched_at: new Date().toISOString(),
            is_autonomous: true,
          });
        }
      }

      // Check for existing slugs to avoid duplicates
      const slugs = sitesToCreate.map(s => s.site_slug);
      const existing = extractItems(await svc.entities.SiteBank.filter(
        { site_slug: { $in: slugs } },
        undefined,
        slugs.length
      ));
      const existingSlugs = new Set(existing.map(e => e.site_slug));
      const newSites = sitesToCreate.filter(s => !existingSlugs.has(s.site_slug));

      if (newSites.length === 0) {
        return Response.json({
          ok: true,
          message: 'All sites already exist in the bank',
          created: 0,
          batch_id: batchId,
        });
      }

      // Bulk create
      const created = await svc.entities.SiteBank.bulkCreate(newSites);

      // Build backlink network among the new sites
      const backlinkResult = await buildBacklinkNetwork(svc, created);

      // Sync to GPT (log SyncEvents — no AI, just entity writes)
      const syncResult = await syncSitesToGpt(svc, created);

      return Response.json({
        ok: true,
        batch_id: batchId,
        templates_used: templates.length,
        locations_used: locs.length,
        sites_created: created.length,
        sites_skipped_existing: sitesToCreate.length - newSites.length,
        backlinks_built: backlinkResult.backlinks_built,
        gpt_sync_events: syncResult.events_created,
        total_bank_sites: backlinkResult.total_bank_sites,
      });
    }

    // ── buildBacklinks: Rebuild the backlink network ──
    if (action === 'buildBacklinks') {
      const { batch_id, all } = body;
      let sites;
      if (batch_id) {
        sites = extractItems(await svc.entities.SiteBank.filter({ launch_batch_id: batch_id }, undefined, 500));
      } else if (all) {
        sites = extractItems(await svc.entities.SiteBank.filter({ status: { $ne: 'archived' } }, undefined, 1000));
      } else {
        return Response.json({ error: 'Provide batch_id or all=true' }, { status: 400 });
      }
      const result = await buildBacklinkNetwork(svc, sites);
      return Response.json({ ok: true, ...result });
    }

    // ── syncToGpt: Log pending SyncEvents for unsynced sites ──
    if (action === 'syncToGpt') {
      const { batch_id } = body;
      const filter: any = { gpt_synced: false };
      if (batch_id) filter.launch_batch_id = batch_id;
      const unsynced = extractItems(await svc.entities.SiteBank.filter(filter, undefined, 500));
      const result = await syncSitesToGpt(svc, unsynced);
      return Response.json({ ok: true, ...result });
    }

    // ── getStats: Bank statistics ──
    if (action === 'getStats') {
      const allSites = extractItems(await svc.entities.SiteBank.filter({ status: { $ne: 'archived' } }, undefined, 1000));
      const total = allSites.length;
      const live = allSites.filter(s => s.status === 'live' || s.status === 'synced').length;
      const synced = allSites.filter(s => s.gpt_synced).length;
      const totalBacklinks = allSites.reduce((sum, s) => sum + (s.backlinks?.length || 0), 0);

      // By niche
      const byNiche = {};
      for (const s of allSites) {
        const n = s.niche || 'general';
        if (!byNiche[n]) byNiche[n] = { count: 0, synced: 0, backlinks: 0 };
        byNiche[n].count++;
        if (s.gpt_synced) byNiche[n].synced++;
        byNiche[n].backlinks += s.backlinks?.length || 0;
      }

      // By state
      const byState = {};
      for (const s of allSites) {
        const st = s.target_state || 'unknown';
        if (!byState[st]) byState[st] = { count: 0, synced: 0 };
        byState[st].count++;
        if (s.gpt_synced) byState[st].synced++;
      }

      // Recent batches
      const batchMap = {};
      for (const s of allSites) {
        const b = s.launch_batch_id || 'unknown';
        if (!batchMap[b]) batchMap[b] = { count: 0, synced: 0 };
        batchMap[b].count++;
        if (s.gpt_synced) batchMap[b].synced++;
      }
      const batches = Object.entries(batchMap)
        .map(([id, v]) => ({ batch_id: id, ...v }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return Response.json({
        ok: true,
        stats: {
          total_sites: total,
          live_sites: live,
          synced_sites: synced,
          unsynced_sites: total - synced,
          total_backlinks: totalBacklinks,
          avg_backlinks_per_site: total > 0 ? Math.round(totalBacklinks / total * 10) / 10 : 0,
        },
        by_niche: byNiche,
        by_state: byState,
        recent_batches: batches,
      });
    }

    // ── listSites: Paginated list with filters ──
    if (action === 'listSites') {
      const { niche, state, status, synced, limit = 50, cursor } = body;
      const filter: any = {};
      if (niche) filter.niche = niche;
      if (state) filter.target_state = state;
      if (status) filter.status = status;
      if (synced === true) filter.gpt_synced = true;
      if (synced === false) filter.gpt_synced = false;

      const opts: any = { sort: '-launched_at', limit };
      if (cursor) opts.cursor = cursor;
      const result = await svc.entities.SiteBank.filter(filter, opts);
      const items = extractItems(result);
      return Response.json({
        ok: true,
        sites: items,
        next_cursor: result.next_cursor,
        has_more: result.has_more,
      });
    }

    // ── addTags: Add deterministic tags to a site ──
    if (action === 'addTags') {
      const { site_id, extra_tags } = body;
      if (!site_id) return Response.json({ error: 'site_id required' }, { status: 400 });
      const site = await svc.entities.SiteBank.get(site_id);
      const currentTags = site.tags || [];
      const newTags = [...new Set([...currentTags, ...(extra_tags || [])])];
      await svc.entities.SiteBank.update(site_id, { tags: newTags });
      return Response.json({ ok: true, site_id, tags: newTags });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('[siteBankOrchestrator] Error:', error.message);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── Extract items from filter result (handles both array and page object) ──
function extractItems(result) {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  return result.items || [];
}

// ── Build deterministic backlink network ──
async function buildBacklinkNetwork(svc, sites) {
  if (!sites || sites.length === 0) return { backlinks_built: 0, total_bank_sites: 0 };

  const allBankResult = await svc.entities.SiteBank.filter(
    { status: { $ne: 'archived' } },
    undefined,
    1000
  );
  const allBankSites = extractItems(allBankResult);

  // Build a map of all sites by slug for quick lookup
  const siteMap = new Map(allBankSites.map(s => [s.site_slug, s]));
  const updates = [];

  for (const site of sites) {
    // Find relevant sites to link to — same niche, different city, or same state
    const candidates = allBankSites.filter(s =>
      s.site_slug !== site.site_slug &&
      s.id !== site.id &&
      (
        s.niche === site.niche ||
        s.target_state === site.target_state ||
        s.niche === site.niche
      )
    );

    // Deterministically pick up to MAX_BACKLINKS_PER_SITE
    const selected = candidates
      .sort((a, b) => {
        // Prefer same niche, then same state
        const aScore = (a.niche === site.niche ? 2 : 0) + (a.target_state === site.target_state ? 1 : 0);
        const bScore = (b.niche === site.niche ? 2 : 0) + (b.target_state === site.target_state ? 1 : 0);
        return bScore - aScore;
      })
      .slice(0, MAX_BACKLINKS_PER_SITE);

    const backlinks = selected.map((target, i) => ({
      target_site_slug: target.site_slug,
      target_url: target.site_url,
      anchor_text: buildAnchorText(site, target),
      link_type: LINK_TYPES[i % LINK_TYPES.length],
    }));

    updates.push({
      id: site.id,
      backlinks,
    });
  }

  // Bulk update backlinks
  await svc.entities.SiteBank.bulkUpdate(updates);

  // Update inbound link counts (deterministic)
  const inboundCounts = new Map();
  for (const site of sites) {
    for (const bl of site.backlinks || []) {
      // We need to count from the updates we just set
    }
  }
  // Recalculate inbound for all bank sites
  const refreshedResult = await svc.entities.SiteBank.filter({ status: { $ne: 'archived' } }, undefined, 1000);
  const refreshedSites = extractItems(refreshedResult);
  const inboundMap = new Map();
  for (const s of refreshedSites) {
    for (const bl of s.backlinks || []) {
      inboundMap.set(bl.target_site_slug, (inboundMap.get(bl.target_site_slug) || 0) + 1);
    }
  }
  const inboundUpdates = [];
  for (const s of refreshedSites) {
    const count = inboundMap.get(s.site_slug) || 0;
    if (s.inbound_link_count !== count) {
      inboundUpdates.push({ id: s.id, inbound_link_count: count });
    }
  }
  if (inboundUpdates.length > 0) {
    await svc.entities.SiteBank.bulkUpdate(inboundUpdates);
  }

  const totalBacklinks = refreshedSites.reduce((sum, s) => sum + (s.backlinks?.length || 0), 0);
  return {
    backlinks_built: updates.reduce((sum, u) => sum + u.backlinks.length, 0),
    total_bank_sites: refreshedSites.length,
    total_backlinks: totalBacklinks,
  };
}

// ── Sync sites to GPT via SyncEvent (no AI — just entity writes) ──
async function syncSitesToGpt(svc, sites) {
  if (!sites || sites.length === 0) return { events_created: 0 };

  const events = sites.map(site => ({
    event_type: 'entity_create',
    entity_name: 'SiteBank',
    record_id: site.id,
    action: 'auto_launch',
    data_summary: `Auto-launched ${site.site_name} (${site.site_url}) — niche: ${site.niche}, location: ${site.target_city || ''}, ${site.target_state || ''}. Tags: ${(site.tags || []).join(', ')}. Backlinks: ${(site.backlinks || []).length}.`,
    source: 'sync_engine',
    direction: 'to_gpt',
    status: 'pending',
    gpt_context: `New site launched: ${site.site_name} at ${site.site_url}. Niche: ${site.niche}. Location: ${site.target_city}, ${site.target_state}. SEO title: ${site.seo_meta?.title || ''}. Keywords: ${(site.seo_meta?.keywords || []).join(', ')}. This site is part of the autonomous credit-free launch system.`,
  }));

  const createdEvents = await svc.entities.SyncEvent.bulkCreate(events);

  // Mark sites as GPT-synced but keep status as 'queued' so bulkLaunchEngine
  // can still pick them up for Vercel deployment. Status only changes to
  // 'live'/'synced' after actual Vercel deployment.
  const updates = sites.map((site, i) => ({
    id: site.id,
    gpt_synced: true,
    gpt_synced_at: new Date().toISOString(),
    sync_event_id: createdEvents[i]?.id || '',
  }));
  await svc.entities.SiteBank.bulkUpdate(updates);

  return { events_created: createdEvents.length };
}