import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { waitUntil } from 'base44:runtime';

// ============================================================
// bulkLaunchEngine — Mass deploy hundreds/thousands of sites
// using Vercel subdomains + free Base44 URLs + GPT sync.
//
// Actions:
//   launch    — Create SiteBank entries + deploy to Vercel + sync to GPT
//   auto      — Find pending SiteBank entries and process them (for cron)
//   stats     — Bulk launch statistics
// ============================================================

const PARALLEL_BATCH = 10;

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'stats';

    // Auth: API key OR admin session
    const authHeader = req.headers.get('authorization') || '';
    const bearerKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const { secrets } = await import('base44:runtime');
    const syncKey = secrets.get('GPT_SYNC_API_KEY') || '';
    const isApiKey = syncKey && bearerKey === syncKey;

    let svc;
    if (isApiKey) {
      svc = base44.asServiceRole;
    } else {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (user.role !== 'admin') return Response.json({ error: 'Admin required' }, { status: 403 });
      svc = base44.asServiceRole;
    }

    // ── stats ──
    if (action === 'stats') {
      const allSites = await svc.entities.SiteBank.filter({ status: { $ne: 'archived' } }, { limit: 1000 });
      const items = Array.isArray(allSites) ? allSites : (allSites.items || []);
      const byStatus = {};
      const byNiche = {};
      for (const s of items) {
        byStatus[s.status] = (byStatus[s.status] || 0) + 1;
        byNiche[s.niche] = (byNiche[s.niche] || 0) + 1;
      }
      return Response.json({
        ok: true,
        stats: {
          total: items.length,
          by_status: byStatus,
          by_niche: byNiche,
          live: byStatus.live || 0,
          synced: byStatus.synced || 0,
          queued: byStatus.queued || 0,
        },
      });
    }

    // ── launch: Create SiteBank entries + deploy + sync ──
    if (action === 'launch') {
      const {
        niche,
        cities = [],
        templateId,
        templateName,
        domainBase = 'unlimitedwebsitesnearme.com',
        urlStrategy = 'city_subdomain',
        batchLabel,
        autoSync = true,
        maxParallel = PARALLEL_BATCH,
      } = body;

      if (!niche || !cities.length) {
        return Response.json({ error: 'niche and cities required' }, { status: 400 });
      }

      const nicheSlug = niche.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const batchId = `bulk-${nicheSlug}-${Date.now()}`;
      const batchSize = Math.min(Math.max(maxParallel || PARALLEL_BATCH, 1), 20);

      // Create SiteBank entries for all cities
      const siteEntries = cities.map((loc) => {
        const citySlug = loc.city.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const stateSlug = (loc.state || '').toLowerCase();
        const siteSlug = `${nicheSlug}-${citySlug}-${stateSlug}`;

        let domain;
        if (urlStrategy === 'city_subdomain') {
          domain = `${citySlug}.${domainBase}`;
        } else if (urlStrategy === 'niche_subdomain') {
          domain = `${nicheSlug}-${citySlug}.${domainBase}`;
        } else if (urlStrategy === 'state_subdomain') {
          domain = `${stateSlug}.${domainBase}`;
        } else {
          domain = `${citySlug}.${domainBase}`;
        }

        const siteName = `${niche} ${loc.city} ${loc.state || ''}`.trim();

        return {
          site_slug: siteSlug,
          site_name: siteName,
          template_id: templateId || '',
          template_name: templateName || niche,
          niche,
          target_city: loc.city,
          target_state: loc.state || '',
          domain,
          site_url: `https://${domain}`,
          status: 'queued',
          launch_batch_id: batchId,
          is_autonomous: true,
          seo_meta: {
            title: `${niche} in ${loc.city}, ${loc.state || ''} | Professional Services Near You`,
            description: `Top-rated ${niche} services in ${loc.city}, ${loc.state || ''}. Get a free quote today.`,
            keywords: [`${niche} ${loc.city}`, `${niche} near me`, `${niche} ${loc.state || ''}`],
            og_title: `${niche} ${loc.city} — Professional Services`,
          },
          tags: [niche, loc.city, loc.state, 'near me', 'local'].filter(Boolean),
        };
      });

      // Bulk create SiteBank entries
      const created = await svc.entities.SiteBank.bulkCreate(siteEntries);
      const siteRecords = created.records || created;
      const siteIds = siteRecords.map((s) => s.id);

      // Deploy in parallel batches
      let deployed = 0, accepted = 0, failed = 0, synced = 0, syncEventsEmitted = 0;
      const deployResults = [];

      for (let i = 0; i < siteRecords.length; i += batchSize) {
        const chunk = siteRecords.slice(i, i + batchSize);
        const results = await Promise.allSettled(chunk.map(async (site) => {
          try {
            await svc.entities.SiteBank.update(site.id, { status: 'deploying' });

            // Deployment acceptance is NOT evidence of a live, functional site.
            // No fallback to an invented hostname. Only a separately validated
            // READY deployment + browser/form receipt may transition to LIVE.
            const response = await base44.functions.invoke('publishTemplateLive', {
              templateId: site.template_id || templateId,
              appName: site.site_name,
              appSlug: site.site_slug,
              brand: { accent: '#126fc8' },
            });
            const proof = response?.data;
            if (!proof || proof.success !== true || typeof proof.deployment_id !== 'string' ||
                typeof proof.url !== 'string' || !/^https:\/\/[a-z0-9.-]+(?:\/|$)/i.test(proof.url)) {
              throw new Error(`Missing Vercel acceptance receipt for ${site.site_slug}`);
            }
            const deployUrl = proof.url;
            await svc.entities.SiteBank.update(site.id, {
              status: 'deploying',
              site_url: deployUrl,
            });
            accepted++;

            // Sync to GPT
            if (autoSync) {
              try {
                await base44.functions.invoke('gptSyncEngine', {
                  action: 'logEvent',
                  event_type: 'entity_create',
                  entity_name: 'SiteBank',
                  record_id: site.id,
                  data_summary: `Vercel deployment accepted for ${site.site_name} at ${deployUrl}; pending independent verification`,
                  source: 'bulkLaunchEngine',
                  direction: 'to_gpt',
                  status: 'pending',
                });
                // Event accepted is not GPT acknowledgement or LIVE status.
                syncEventsEmitted++;
              } catch (e) {
                console.error(`GPT sync failed for ${site.site_slug}: ${e.message}`);
              }
            }

            return { id: site.id, slug: site.site_slug, url: deployUrl, accepted: true, live: false, status: 'awaiting_validation' };
          } catch (err) {
            failed++;
            await svc.entities.SiteBank.update(site.id, {
              status: 'queued',
            }).catch(() => {});
            return { id: site.id, slug: site.site_slug, error: err.message, success: false };
          }
        }));

        for (const r of results) {
          if (r.status === 'fulfilled') deployResults.push(r.value);
        }
      }

      return Response.json({
        ok: true,
        batch_id: batchId,
        total_sites: siteIds.length,
        deployed, // Zero until an independent validator produces a live receipt.
        deployments_accepted: accepted,
        awaiting_validation: accepted,
        release_ready: false,
        failed,
        synced, // Zero until actual GPT acknowledgement.
        sync_events_emitted: syncEventsEmitted,
        results: deployResults.slice(0, 50),
      });
    }

    // ── auto: Process pending SiteBank entries (for cron) ──
    if (action === 'auto') {
      const pending = await svc.entities.SiteBank.filter(
        { status: 'queued', is_autonomous: true },
        { limit: 50, sort: '-created_date' }
      );
      const items = Array.isArray(pending) ? pending : (pending.items || []);

      if (items.length === 0) {
        return Response.json({ ok: true, message: 'No pending sites to process', processed: 0 });
      }

      let deployed = 0, accepted = 0, failed = 0, synced = 0, syncEventsEmitted = 0;

      for (let i = 0; i < items.length; i += PARALLEL_BATCH) {
        const chunk = items.slice(i, i + PARALLEL_BATCH);
        await Promise.allSettled(chunk.map(async (site) => {
          try {
            await svc.entities.SiteBank.update(site.id, { status: 'deploying' });

            const response = await base44.functions.invoke('publishTemplateLive', {
              templateId: site.template_id,
              appName: site.site_name,
              appSlug: site.site_slug,
              brand: { accent: '#126fc8' },
            });
            const proof = response?.data;
            if (!proof || proof.success !== true || typeof proof.deployment_id !== 'string' ||
                typeof proof.url !== 'string' || !/^https:\/\/[a-z0-9.-]+(?:\/|$)/i.test(proof.url)) {
              throw new Error(`Missing Vercel acceptance receipt for ${site.site_slug}`);
            }
            const deployUrl = proof.url;
            await svc.entities.SiteBank.update(site.id, {
              status: 'deploying',
              site_url: deployUrl,
            });
            accepted++;

            // Sync to GPT
            try {
              await base44.functions.invoke('gptSyncEngine', {
                action: 'logEvent',
                event_type: 'entity_create',
                entity_name: 'SiteBank',
                record_id: site.id,
                data_summary: `Vercel deployment accepted for ${site.site_name} at ${deployUrl}; pending independent verification`,
                source: 'bulkLaunchEngine',
                direction: 'to_gpt',
                status: 'pending',
              });
              // Event accepted is not GPT acknowledgement or LIVE status.
              syncEventsEmitted++;
            } catch (e) {
              console.error(`GPT sync failed: ${e.message}`);
            }
          } catch (err) {
            failed++;
            await svc.entities.SiteBank.update(site.id, { status: 'queued' }).catch(() => {});
          }
        }));
      }

      return Response.json({
        ok: true,
        processed: items.length,
        deployed, // Zero until independent validation.
        deployments_accepted: accepted,
        awaiting_validation: accepted,
        release_ready: false,
        failed,
        synced, // Zero until actual GPT acknowledgement.
        sync_events_emitted: syncEventsEmitted,
      });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('[bulkLaunchEngine] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}