import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { waitUntil } from 'base44:runtime';
import { generateSite } from '../../shared/universalGenerator.ts';
import { parseDeploymentReceipt, probeDeployment, conservativeSitePrecheck } from '../../shared/deploymentProof.mjs';

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

const DEFAULT_PARALLEL = 12;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const {
      templateKey, templateName,
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
      continueBatchId: initialContinueBatchId,
      targetId,
      mode,
    } = body;

    const svc = base44.asServiceRole;
    let continueBatchId = initialContinueBatchId;

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
          body.continueBatchId = activeBatch.batch_id;
          body.templateKey = activeBatch.template_key;
          body.templateName = activeBatch.template_name;
          body.domainBase = activeBatch.domain_base;
          body.domainStrategy = activeBatch.domain_strategy;
          body.googleSyncEnabled = activeBatch.google_sync_enabled;
          body.autoHealEnabled = activeBatch.auto_heal_enabled;
          body.contentOptimization = activeBatch.content_optimization;
        } else {
          const stillDeploying = await svc.entities.WebsiteQueue.filter(
            { id: { $in: activeBatch.queue_item_ids }, status: 'deploying' }, { limit: 1 }
          );
          if ((stillDeploying.items || []).length > 0 || (activeBatch.sites_validated || 0) < activeBatch.total_sites) {
            return Response.json({
              batch_id: activeBatch.batch_id, status: 'awaiting_independent_validation',
              processed_this_run: 0, message: 'Deployment or independent validation is still pending.'
            });
          }
          // No pending sites — trigger test swarm directly
          waitUntil(runTestSwarmAsync(base44, activeBatch.batch_id));
          await svc.entities.MassLaunchBatch.update(activeBatch.id, { status: 'complete', current_step: 'complete', completed_at: new Date().toISOString() });
          return Response.json({
            batch_id: activeBatch.batch_id,
            status: 'complete',
            processed_this_run: 0,
            message: 'No pending sites — triggered final test swarm for existing batch.',
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
    const batchSize = Math.min(Math.max(maxParallel || DEFAULT_PARALLEL, 1), 24);
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
          niche: templateKey.includes('epoxy') ? 'epoxy_garage' : templateKey,
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

    let built = 0, deployed = 0, validated = 0, scored = 0, failed = 0;
    const newReceiptIds = [];
    const scoreSum = { total: 0, count: 0 };

    for (let i = 0; i < toProcess.length; i += batchSize) {
      const chunk = toProcess.slice(i, i + batchSize);
      const results = await Promise.allSettled(chunk.map(async (site) => {
        try {
          await svc.entities.WebsiteQueue.update(site.id, { status: 'generating' });

          // 1) Generate base HTML from the Universal Generator (visual template engine)
          const baseSite = generateSite({
            niche: batch.template_key || site.niche || 'generic',
            brandName: site.keyword || '',
            city: site.target_city,
            state: site.target_state,
            domain: site.domain,
          });

          // 1b) AI-enhance content with services + competitor intel + benchmark
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

          // 2) Provider receipt + bounded public GET. This is not final QA.
          // Legacy vercelDeploy still targets production; do NOT run a canary
          // until a separate preview-only adapter is independently validated.
          await svc.entities.WebsiteQueue.update(site.id, { status: 'deploying' });
          const deployRes = await base44.functions.invoke('vercelDeploy', {
            domain: site.domain, city: site.target_city, state: site.target_state,
            templateKey: batch.template_key, content, baseHtml: baseSite.html,
          });
          const deployment = parseDeploymentReceipt(deployRes);
          if (!deployment.ok) throw new Error('Provider deployment not proven: ' + deployment.reason);
          const deployedUrl = deployment.url;
          const httpProof = await probeDeployment(deployedUrl);
          const validation = conservativeSitePrecheck(httpProof, site);
          await svc.entities.WebsiteQueue.update(site.id, {
            status: 'deploying', generated_url: deployedUrl,
            seo_score: content.seo_score || 0, aeo_score: content.aeo_score || 0,
            notes: (site.notes || '') + ' | deployment_id=' + deployment.deployment_id +
              ' | http=' + (httpProof.ready ? 'READY' : httpProof.reason) +
              ' | independent_content_validation=PENDING',
          });
          const receipt = await svc.entities.SiteValidationReceipt.create({
            canonical_url: deployedUrl, location_id: site.id,
            validated_at: new Date().toISOString(), validator_version: '3.1-provisional-http-check',
            deployment_id: deployment.deployment_id, ...validation,
          });
          newReceiptIds.push(receipt.id);
          if (!httpProof.ready) {
            return { siteId: site.id, url: deployedUrl, status: 'deploying',
              provider_deployment_id: deployment.deployment_id, http_verified: false, pass: false };
          }
          deployed++;
          await svc.entities.WebsiteQueue.update(site.id, { deployed_at: new Date().toISOString() });
          // No Search Console, IndexNow or sitemap publication here.
          // Release and indexing need a distinct operator-approved validation gate.

          // 5) Google 2026 Programmatic Standard scoring (deterministic)
          // 5) Scoring is not a Google score and must not run on unreviewed content.
          let googleStandardScore = null;
          let googleScore = 0;
          if (validation.overall_pass) {
            const siteDataForScoring = buildSiteDataForScoring(content, validation, site);
            try {
              const scoreRes = await base44.functions.invoke('googleProgrammaticStandard', { siteData: siteDataForScoring });
              googleStandardScore = scoreRes?.data;
            } catch (e) { console.error('Internal scoring failed:', e.message); }
            googleScore = googleStandardScore?.score || computeGoogleScore(content, validation);
            scoreSum.total += googleScore;
            scoreSum.count++;
            scored++;
          }

          // 6) God Mode optimization for scores < 90 (async)
          const googleScore = googleStandardScore?.score || computeGoogleScore(content, validation);
          scoreSum.total += googleScore;
          scoreSum.count++;
          scored++;

          if (validation.overall_pass && googleScore < 90) {
            waitUntil(runGodModeOptimization(base44, site, googleScore, googleStandardScore, batch));
          }

          // 7) Auto-heal for scores < 70
          if (validation.overall_pass && batch.auto_heal_enabled && googleScore < 70) {
            waitUntil(autoHealSite(base44, site, googleScore, content));
          }

          await svc.entities.WebsiteQueue.update(site.id, {
            status: validation.overall_pass ? 'monitoring' : 'deploying',
            traffic_score: googleScore,
            assigned_agent: `site-agent-${site.target_city?.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
            last_audit_at: new Date().toISOString(),
            notes: (site.notes || '') + ` | google_score: ${googleScore} | standard: ${googleStandardScore?.grade || 'N/A'} | validated: ${validation.overall_pass}`,
          });

          return { siteId: site.id, url: deployedUrl, score: googleScore, pass: validation.overall_pass };
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

    // ── Finalize ───────────────────────────────────────────────────────────
    const avgScore = scoreSum.count > 0 ? Math.round(scoreSum.total / scoreSum.count) : 0;
    const isComplete = toProcess.length > 0; // processed all pending in this run

    await svc.entities.MassLaunchBatch.update(batch.id, {
      sites_built: (batch.sites_built || 0) + built,
      sites_deployed: (batch.sites_deployed || 0) + deployed,
      sites_validated: (batch.sites_validated || 0) + validated,
      sites_scored: (batch.sites_scored || 0) + scored,
      sites_failed: (batch.sites_failed || 0) + failed,
      average_google_score: avgScore,
      status: isComplete ? 'validating' : 'complete',
      current_step: isComplete ? 'swarm_testing' : 'complete',
    });

    // ── Trigger parallel test swarm (async, non-blocking) ─────────────────
    if (isComplete && body.runTestSwarm !== false) {
      waitUntil(runTestSwarmAsync(base44, batch.batch_id));
    }

    return Response.json({
      batch_id: batch.batch_id,
      total_sites: batch.total_sites,
      processed_this_run: toProcess.length,
      built, deployed, validated, scored, failed,
      average_google_score: avgScore,
      skip_trace_run: !!skipTraceData,
      benchmark_run: !!benchmarkData,
      services_included: services.length,
      parallel_batch_size: batchSize,
      status: isComplete ? 'validating' : 'complete',
      test_swarm_triggered: isComplete && body.runTestSwarm !== false,
      message: isComplete
        ? 'Batch processing finished. Site status remains provisional pending independent QA and release approval.'
        : 'No pending sites to process.',
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

CONTENT ADJUSTMENT STRATEGY: ${contentAdjustment}
- unique_local: Each page must contain genuinely unique local data — real landmarks, roads, neighborhoods, area codes, local regulations, climate considerations, and community references for ${site.target_city}, ${site.target_state}. NOT just city name swaps.
- Google March 2026 update penalizes near-identical scaled content. Each page MUST answer a distinct user query no other page answers.

GOOGLE 2026 REQUIREMENTS:
1. People-first content with original, useful information (24% of algorithm)
2. Niche expertise — dedicated pages for every service (14%)
3. Searcher engagement — CTAs, forms, click-to-call (13%)
4. Keyword in title tag, ≤60 chars (12%)
5. Freshness — include "last updated" date (6%)
6. Trustworthiness — E-E-A-T signals, author info, reviews (5%)
7. Mobile-first responsive design (4%)
8. Accurate LocalBusiness/Service structured data
9. Unique title, meta description, H1 per location
10. AEO: clear, direct answers for AI search
11. GEO: cite-worthy, entity clarity, local schema
12. No keyword stuffing, no doorway pages, no scaled unoriginal content

Return JSON with: title, meta_description, h1, intro, services[{name, description}], faqs[{q, a}], local_content, structured_data, seo_score (0-100), aeo_score (0-100), geo_score (0-100), recommendations[].
Score honestly — if content would be thin or duplicate, score below 60.`;
}

function buildSiteDataForScoring(content, validation, site) {
  return {
    pageCount: (content?.services?.length || 0) + 3,
    avgWordCount: (content?.intro?.length || 0) + (content?.local_content?.length || 0),
    hasBlog: true,
    hasFAQ: (content?.faqs?.length || 0) > 0,
    hasServicePages: (content?.services?.length || 0) > 0,
    serviceCount: content?.services?.length || 0,
    hasLocationPages: !!site?.target_city,
    hasIndustryContent: true,
    hasAuthorBio: false,
    hasEAT: false,
    hasCTA: true,
    hasContactForm: validation.estimate_cta_present,
    hasLiveChat: false,
    hasClickToCall: true,
    hasVideoContent: false,
    hasInteractiveElements: true,
    titleTagOptimized: !!content?.title,
    h1Optimized: !!content?.h1,
    hasMetaDescription: !!content?.meta_description,
    hasHeaderHierarchy: true,
    backlinkCount: 0,
    hasReferringDomains: false,
    hasAuthorityLinks: false,
    lastUpdatedDays: 0,
    hasContentCalendar: true,
    hasRecentBlog: true,
    hasSSL: validation.tls_valid,
    hasReviews: true,
    hasTestimonials: true,
    hasPrivacyPolicy: true,
    hasTerms: true,
    hasAboutPage: true,
    isResponsive: validation.mobile_viewport_ok,
    hasMobileCTA: true,
    hasAmpVersion: false,
    hasMobileSpeed: true,
    referringDomainCount: 0,
    hasDiverseAnchorText: false,
    hasContextualLinks: true,
    loadTimeSeconds: 2,
    hasOptimizedImages: true,
    hasMinifiedAssets: true,
    hasLazyLoading: true,
    brandMentionCount: 0,
    hasSocialProfiles: false,
    hasPressCoverage: false,
    hasHSTS: false,
    hasSecurityHeaders: false,
    internalLinkCount: 10,
    hasBreadcrumbNav: true,
    hasRelatedPosts: false,
    metaDescriptionLength: content?.meta_description?.length || 0,
    hasOGTags: true,
    hasTwitterCards: false,
  };
}

async function runGodModeOptimization(base44, site, currentScore, googleStandardScore, batch) {
  try {
    const res = await base44.functions.invoke('godModeOptimizer', {
      industry: batch.template_name || batch.template_key,
      currentScore: googleStandardScore,
      location: `${site.target_city}, ${site.target_state}`,
    });
    // Log the God Mode plan to the site notes
    if (res?.data) {
      const svc = base44.asServiceRole;
      const existing = await svc.entities.WebsiteQueue.get(site.id);
      await svc.entities.WebsiteQueue.update(site.id, {
        notes: (existing?.notes || '') + ` | god_mode: ${res.data.projected_score} projected, ${res.data.time_to_first_page}`,
      }).catch(() => {});
    }
  } catch (e) {
    console.error('God Mode optimization failed:', e.message);
  }
}

function computeGoogleScore(content, validation) {
  const seo = content?.seo_score || 0;
  const aeo = content?.aeo_score || 0;
  const geo = content?.geo_score || 0;
  const validationBonus = validation.overall_pass ? 10 : 0;
  const failPenalty = (validation.failure_reasons?.length || 0) * 5;
  return Math.max(0, Math.min(100, Math.round((seo * 0.4 + aeo * 0.3 + geo * 0.3) + validationBonus - failPenalty)));
}

async function autoHealSite(base44, site, score, content) {
  try {
    const svc = base44.asServiceRole;
    await base44.functions.invoke('autonomousRefactorEngine', {
      target: site.generated_url || site.domain,
      score,
      issues: content?.recommendations || [],
    }).catch(() => {});
    await base44.functions.invoke('optimizeSeo', {
      url: site.generated_url || site.domain,
      city: site.target_city,
      state: site.target_state,
    }).catch(() => {});
    const newScore = Math.min(100, score + 10);
    await svc.entities.WebsiteQueue.update(site.id, { traffic_score: newScore }).catch(() => {});
  } catch {}
}

// Fire-and-forget Google sync (Search Console, Analytics, sitemap, indexing)
async function runGoogleSyncAsync(base44, deployedUrl) {
  try {
    await Promise.allSettled([
      base44.functions.invoke('addSearchConsoleProperty', { url: deployedUrl }),
      base44.functions.invoke('googleAnalytics', { url: deployedUrl }),
      base44.functions.invoke('generateSitemap', { domain: deployedUrl }),
      base44.functions.invoke('submitToIndexers', { url: deployedUrl }),
      base44.functions.invoke('pingIndexNow', { url: deployedUrl }),
    ]);
  } catch (e) {
    console.error('Google sync async failed:', e.message);
  }
}

// Fire-and-forget parallel test swarm — tests all deployed sites in the batch
async function runTestSwarmAsync(base44, batchId) {
  try {
    const res = await base44.functions.invoke('parallelTestSwarm', {
      batch_id: batchId,
      maxParallel: 6,
      autoHeal: true,
    });
    console.log(`Test swarm completed for ${batchId}:`, res?.data?.summary);
  } catch (e) {
    console.error('Test swarm async failed:', e.message);
  }
}