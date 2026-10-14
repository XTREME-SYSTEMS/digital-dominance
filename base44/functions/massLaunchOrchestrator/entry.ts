import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// ============================================================
// Mass Launch Orchestrator v2 — God Mode Enhanced
// Runs the full pipeline per batch:
//  1. Industry skip trace (once per batch) — scans top 5 competitors
//  2. Benchmark enhancement (once per batch) — AI enhances content
//  3. Per-site content generation with services + competitor intel
//  4. Vercel deploy + Google sync + sitemap + indexing
//  5. Google 2026 Programmatic Standard scoring (deterministic)
//  6. God Mode optimization for scores < 90 (deterministic)
//  7. Auto-heal for scores < 70
// Processes in parallel batches (configurable via maxParallel).
// ============================================================

const DEFAULT_PARALLEL = 4;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    let {
      templateKey, templateName, designKey = 'signature',
      domainStrategy = 'nearme_subdomain',
      domainBase = 'epoxyquotenearme.com',
      provisionTarget = 'vercel',
      locations = [],
      contentOptimization = 'maximum',
      googleSyncEnabled = true,
      autoHealEnabled = true,
      services = [],
      maxParallel = DEFAULT_PARALLEL,
      urlStrategy = 'city_subdomain',
      contentAdjustment = 'unique_local',
      continueBatchId,
      targetId,
      mode,
    } = body;

    const svc = base44.asServiceRole;

    // Auto mode: find the most recent batch with pending sites and continue it
    if (mode === 'auto') {
      const activeBatches = await svc.entities.MassLaunchBatch.filter(
        { status: { $in: ['orchestrating', 'queued', 'validating'] } },
        { limit: 5, sort: '-created_at' }
      );
      const activeBatch = (activeBatches.items || [])[0];
      if (activeBatch) {
        // Continue this batch
        const pendingCheck = await svc.entities.WebsiteQueue.filter(
          { id: { $in: activeBatch.queue_item_ids }, status: 'queued' },
          { limit: 1 }
        );
        if ((pendingCheck.items || []).length > 0) {
          // Re-run with continueBatchId
          continueBatchId = activeBatch.batch_id;
          templateKey = activeBatch.template_key;
          templateName = activeBatch.template_name;
          domainBase = activeBatch.domain_base;
          domainStrategy = activeBatch.domain_strategy;
          googleSyncEnabled = activeBatch.google_sync_enabled;
          autoHealEnabled = activeBatch.auto_heal_enabled;
          contentOptimization = activeBatch.content_optimization;
        } else {
          return Response.json({
            batch_id: activeBatch.batch_id,
            status: 'awaiting_independent_validation',
            processed_this_run: 0,
            release_ready: false,
            message: 'No queued sites. Existing previews require independent HTTP, browser and lead tests.',
          });
        }
      } else {
        return Response.json({
          status: 'idle',
          processed_this_run: 0,
          message: 'No active batches found. Create a batch first via BulkLaunchBuilder or ProgrammaticTargeting.',
        });
      }
    }

    const now = new Date().toISOString();
    const batchSize = Math.min(Math.max(maxParallel || DEFAULT_PARALLEL, 1), 4);
    let batch;
    let skipTraceData = null;
    let benchmarkData = null;

    // ── Create or continue batch ──────────────────────────────────────────
    if (continueBatchId) {
      const existing = await svc.entities.MassLaunchBatch.filter({ batch_id: continueBatchId }, { limit: 1 });
      batch = existing.items?.[0];
      if (!batch) return Response.json({ error: 'Batch not found' }, { status: 404 });
    } else {
      if (!templateKey || !locations.length) {
        return Response.json({ error: 'templateKey and locations required' }, { status: 400 });
      }
      // The present WebsiteQueue schema supports only selected niches.
      // Never misclassify legal or other industries as epoxy.
      if (!['epoxy_garage', 'epoxy_flooring', 'garage_coating'].includes(templateKey)) {
        return Response.json({ error: 'Industry requires an explicit WebsiteQueue schema mapping' }, { status: 422 });
      }
      const batchId = `batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const states = [...new Set(locations.map((l) => l.state))];
      const counties = [...new Set(locations.map((l) => l.county).filter(Boolean))];

      const queueRecords = locations.map((loc) => {
        const citySlug = loc.city.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        let domain;
        if (urlStrategy === 'city_subdomain') {
          domain = `${citySlug}.${domainBase}`;
        } else if (urlStrategy === 'state_subdomain') {
          domain = `${loc.state.toLowerCase()}.${domainBase}`;
        } else if (urlStrategy === 'subfolder') {
          domain = `${domainBase}/${loc.state.toLowerCase()}/${citySlug}`;
        } else {
          domain = domainBase;
        }
        const keyword = `${templateKey.replace(/_/g, ' ')} ${loc.city} ${loc.state}`;
        return {
          keyword,
          niche: templateKey,
          keyword_pattern: 'near_me_city',
          target_city: loc.city,
          target_state: loc.state,
          domain,
          status: 'queued',
          priority: 'high',
          notes: `Batch ${batchId} | county: ${loc.county || ''} | template: ${templateName || templateKey} | services: ${services.length}`,
        };
      });

      const created = await svc.entities.WebsiteQueue.bulkCreate(queueRecords);
      const queueIds = (created.records || created).map((r) => r.id);

      batch = await svc.entities.MassLaunchBatch.create({
        batch_id: batchId,
        owner_id: user.id,
        template_key: templateKey,
        template_name: templateName || templateKey,
        domain_strategy: domainStrategy,
        domain_base: domainBase,
        provision_target: provisionTarget,
        selected_states: states,
        selected_counties: counties,
        selected_cities: locations,
        total_sites: locations.length,
        sites_queued: locations.length,
        queue_item_ids: queueIds,
        google_sync_enabled: googleSyncEnabled,
        auto_heal_enabled: autoHealEnabled,
        content_optimization: contentOptimization,
        status: 'orchestrating',
        current_step: 'skip_trace',
        created_at: now,
      });

      if (targetId) {
        try {
          const target = await svc.entities.ProgrammaticTarget.get(targetId);
          if (target) {
            await svc.entities.ProgrammaticTarget.update(targetId, {
              batch_ids: [...(target.batch_ids || []), batchId],
              status: 'active',
              last_launched_at: now,
            });
          }
        } catch {}
      }

      // ── Run skip trace + benchmark enhancement ONCE per batch ──────────
      try {
        const [skipRes, benchRes] = await Promise.allSettled([
          base44.functions.invoke('industrySkipTrace', { industry: templateName || templateKey, keyword: `${templateKey.replace(/_/g, ' ')} near me` }),
          base44.functions.invoke('benchmarkEnhancer', { industry: templateName || templateKey, brandConfig: {}, skipTraceData: null }),
        ]);
        if (skipRes.status === 'fulfilled') skipTraceData = skipRes.value?.data;
        if (benchRes.status === 'fulfilled') benchmarkData = benchRes.value?.data;
      } catch (e) {
        console.error('Skip trace/benchmark failed:', e.message);
      }

      await svc.entities.MassLaunchBatch.update(batch.id, { current_step: 'content_generation' });
    }

    // ── Process ALL pending sites in parallel batches (no slice limit) ────
    const pending = await svc.entities.WebsiteQueue.filter(
      { id: { $in: batch.queue_item_ids }, status: 'queued' },
      { limit: 500 }
    );
    const toProcess = pending.items || pending;

    let built = 0, deployed = 0, validated = 0, scored = 0, failed = 0, accepted = 0;
    const newReceiptIds = [];
    const scoreSum = { total: 0, count: 0 };

    for (let i = 0; i < toProcess.length; i += batchSize) {
      const chunk = toProcess.slice(i, i + batchSize);
      const results = await Promise.allSettled(chunk.map(async (site) => {
        try {
          await svc.entities.WebsiteQueue.update(site.id, { status: 'generating' });

          // 1) Generate content with services + competitor intel + benchmark
          const contentPrompt = buildEnhancedContentPrompt(site, batch, services, skipTraceData, benchmarkData, contentAdjustment);
          const llmRes = await base44.integrations.Core.InvokeLLM({
            prompt: contentPrompt,
            response_json_schema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                meta_description: { type: 'string' },
                h1: { type: 'string' },
                intro: { type: 'string' },
                services: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' } } } },
                faqs: { type: 'array', items: { type: 'object', properties: { q: { type: 'string' }, a: { type: 'string' } } } },
                local_content: { type: 'string' },
                structured_data: { type: 'object' },
                seo_score: { type: 'number' },
                aeo_score: { type: 'number' },
                geo_score: { type: 'number' },
                recommendations: { type: 'array', items: { type: 'string' } },
              },
            },
          });
          const content = llmRes || {};
          built++;

          // Acceptance from the site-specific Vercel PREVIEW adapter is not LIVE.
          await svc.entities.WebsiteQueue.update(site.id, { status: 'deploying' });
          const deployRes = await base44.functions.invoke('vercelDeploy', {
            mode: 'site_preview', siteId: site.id,
            city: site.target_city, state: site.target_state,
            templateKey: batch.template_key, designKey, content,
          });
          const proof = deployRes?.data || {};
          if (proof.success !== true || proof.preview_only !== true ||
              typeof proof.deployment_id !== 'string' || !proof.deployment_id.startsWith('dpl_') ||
              typeof proof.url !== 'string' || !/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(proof.url)) {
            throw new Error('Missing site-specific Vercel preview acceptance receipt');
          }
          accepted++;
          await svc.entities.WebsiteQueue.update(site.id, {
            status: 'deploying', generated_url: proof.url,
            notes: (site.notes || '').slice(0, 1500) +
              ' | PREVIEW_ONLY deployment=' + proof.deployment_id +
              ' | INDEPENDENT_VALIDATION_PENDING',
          });
          // The non-passing receipt preserves exact deployment identity.
          try {
            const pendingReceipt = await svc.entities.SiteValidationReceipt.create({
              canonical_url: proof.url, location_id: site.id,
              validated_at: new Date().toISOString(),
              validator_version: 'preview-accepted-1',
              deployment_id: proof.deployment_id, overall_pass: false,
              failure_reasons: ['Independent HTTP, visual, tenant and lead validation pending'],
            });
            newReceiptIds.push(pendingReceipt.id);
          } catch (receiptError) {
            console.error('Preview receipt persistence failed:', receiptError.message);
          }
          return {
            siteId: site.id, url: proof.url, deployment_id: proof.deployment_id,
            preview_accepted: true, release_ready: false, validated: false,
          };
        } catch (err) {
          failed++;
          await svc.entities.WebsiteQueue.update(site.id, {
            status: 'queued',
            notes: (site.notes || '') + ` | ERROR: ${err.message?.slice(0, 200)}`,
          }).catch(() => {});
          return { siteId: site.id, error: err.message };
        }
      }));

      await svc.entities.MassLaunchBatch.update(batch.id, {
        sites_built: (batch.sites_built || 0) + built,
        sites_deployed: (batch.sites_deployed || 0) + deployed,
        sites_validated: (batch.sites_validated || 0) + validated,
        sites_scored: (batch.sites_scored || 0) + scored,
        sites_failed: (batch.sites_failed || 0) + failed,
        validation_receipt_ids: [...(batch.validation_receipt_ids || []), ...newReceiptIds],
        current_step: `processed_${built}_of_${toProcess.length}`,
      });
    }

    // Only an independent validator may promote accepted previews.
    await svc.entities.MassLaunchBatch.update(batch.id, {
      sites_built: (batch.sites_built || 0) + built,
      sites_deployed: (batch.sites_deployed || 0),
      sites_validated: (batch.sites_validated || 0),
      sites_scored: (batch.sites_scored || 0),
      sites_failed: (batch.sites_failed || 0) + failed,
      status: 'validating',
      current_step: 'awaiting_independent_preview_validation',
    });
    return Response.json({
      batch_id: batch.batch_id, total_sites: batch.total_sites,
      processed_this_run: toProcess.length,
      built, accepted, deployed, validated, scored, failed,
      release_ready: false, test_swarm_triggered: false,
      google_sync_confirmed: false,
      status: 'awaiting_independent_validation',
      message: 'Accepted previews require independent QA. Zero sites were verified live.',
    });
  } catch (error) {
    console.error('massLaunchOrchestrator error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ── Enhanced content prompt with services + competitor intel ──────────────
function buildEnhancedContentPrompt(site, batch, services, skipTraceData, benchmarkData, contentAdjustment) {
  const opts = batch.content_optimization || 'maximum';
  const svcList = services.length > 0 ? services.join(', ') : 'all industry-standard services';
  const competitors = skipTraceData?.competitors?.slice(0, 3) || [];
  const competitorIntel = competitors.map((c, i) => `Competitor ${i + 1}: ${c.domain} — ${c.seo_strengths?.join(', ') || 'standard SEO'}`).join('\n');
  const benchmarkTips = benchmarkData?.enhanced?.enhanced_hero ? `Benchmark hero: "${benchmarkData.enhanced.enhanced_hero.headline}"` : '';

  return `Generate Google-compliant, people-first content for a ${batch.template_name || batch.template_key} website targeting ${site.target_city}, ${site.target_state}.
Domain: ${site.domain}
Keyword: ${site.keyword}

SELECTED SERVICES (include ALL of these with unique descriptions): ${svcList}

OPTIMIZATION LEVEL: ${opts} (SEO + AEO + GEO + structured data)

COMPETITOR INTELLIGENCE (from skip trace):
${competitorIntel || 'No competitor data available'}

BENCHMARK ENHANCEMENT:
${benchmarkTips || 'No benchmark data available'}

UNPUBLISHED DRAFT CONTENT RULES:
- This is a noindex preview, not an operating business or confirmed local office.
- Answer an original buyer question instead of swapping only place names.
- Do not invent licenses, testimonials, reviews, service coverage, addresses, prices, expert credentials or neighborhood facts.
- If source evidence is not provided, mark local business facts as requiring verification.
- Provide practical service explanations and authentic FAQs without claimed rankings.
Return JSON with title, meta_description, h1, intro, services[{name, description}], faqs[{q, a}], local_content, recommendations[].`;
}

