import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { isEngineConfigured, runFullSiteTest, engineHealth, cleanStaleSessions } from '../../shared/cloudBrowserEngine.ts';

// ============================================================
// Parallel Test Swarm — tests hundreds of deployed sites in
// parallel batches using the cloud browser engine.
// Each batch creates N browser sessions, tests them, closes them,
// then moves to the next batch. This prevents Chromium EAGAIN
// while maximizing throughput.
// ============================================================

const DEFAULT_PARALLEL = 6;
const MAX_PARALLEL = 8;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const {
      urls,
      batch_id,
      mode = 'parallel',
      maxParallel = DEFAULT_PARALLEL,
      depth = 'full',
      autoHeal = false,
    } = body;

    const svc = base44.asServiceRole;
    const parallelSize = Math.min(Math.max(maxParallel || DEFAULT_PARALLEL, 1), MAX_PARALLEL);

    // Check engine health
    const engineReady = isEngineConfigured();
    let engineHealthy = false;
    if (engineReady) {
      try { engineHealthy = await engineHealth(); } catch { engineHealthy = false; }
    }

    // ── Gather URLs to test ──────────────────────────────────────────────
    let siteList: { url: string; site_id?: string; queue_id?: string }[] = [];

    if (batch_id) {
      // Test all sites in a MassLaunchBatch
      const batch = await svc.entities.MassLaunchBatch.filter({ batch_id }, { limit: 1 });
      const b = batch.items?.[0];
      if (!b) return Response.json({ error: 'Batch not found' }, { status: 404 });

      const queueItems = await svc.entities.WebsiteQueue.filter(
        { id: { $in: b.queue_item_ids }, status: { $in: ['live', 'monitoring'] } },
        { limit: 500 }
      );
      for (const item of (queueItems.items || [])) {
        const url = item.generated_url || (item.domain?.startsWith('http') ? item.domain : `https://${item.domain}`);
        if (url) siteList.push({ url, site_id: item.id, queue_id: item.id });
      }
    } else if (urls && Array.isArray(urls)) {
      siteList = urls.map((u) => typeof u === 'string' ? { url: u } : u);
    } else if (mode === 'all') {
      // Test all deployed sites
      const sites = await svc.entities.WebsiteQueue.filter(
        { status: { $in: ['live', 'monitoring'] } },
        { limit: 500, sort: '-deployed_at' }
      );
      for (const item of (sites.items || [])) {
        const url = item.generated_url || (item.domain?.startsWith('http') ? item.domain : `https://${item.domain}`);
        if (url) siteList.push({ url, site_id: item.id, queue_id: item.id });
      }
    } else {
      return Response.json({ error: 'Provide urls[], batch_id, or mode=all' }, { status: 400 });
    }

    if (siteList.length === 0) return Response.json({ error: 'No sites to test' }, { status: 400 });

    // ── Clean stale sessions before starting ────────────────────────────
    if (engineHealthy) {
      try { await cleanStaleSessions(); } catch {}
    }

    const startTime = Date.now();
    const results: any[] = [];
    let passed = 0, failed = 0, errors = 0;
    const receiptIds: string[] = [];

    // ── Process in parallel batches (swarm) ──────────────────────────────
    for (let i = 0; i < siteList.length; i += parallelSize) {
      const chunk = siteList.slice(i, i + parallelSize);
      const chunkResults = await Promise.allSettled(chunk.map(async (site) => {
        try {
          const result = await testSingleSite(base44, site.url, site.queue_id, engineHealthy);
          results.push(result);

          if (result.overall === 'passed') passed++;
          else if (result.overall === 'failed') failed++;

          // Create validation receipt
          if (site.queue_id) {
            try {
              const receipt = await svc.entities.SiteValidationReceipt.create({
                canonical_url: site.url,
                location_id: site.queue_id,
                validated_at: new Date().toISOString(),
                validator_version: '4.0-swarm',
                deployment_id: batch_id || 'swarm',
                dns_reachable: result.http?.ok || false,
                tls_valid: result.http?.ok || false,
                http_status: result.http?.status || 0,
                final_url: site.url,
                render_complete: result.tests?.buttons?.total > 0,
                correct_h1: result.tests?.seo?.h1_count > 0,
                correct_title: !!result.tests?.seo?.title,
                correct_description: !!result.tests?.seo?.meta_description,
                structured_data_valid: result.tests?.seo?.schema_found || false,
                estimate_cta_present: result.tests?.buttons?.clickable > 0,
                mobile_viewport_ok: result.tests?.responsive?.mobile === true,
                desktop_viewport_ok: result.tests?.responsive?.desktop === true,
                overall_pass: result.overall === 'passed',
                failure_reasons: result.recommendations || [],
              });
              receiptIds.push(receipt.id);
            } catch {}
          }

          // Auto-heal if enabled and site failed
          if (autoHeal && result.overall !== 'passed' && site.queue_id) {
            try {
              await base44.functions.invoke('optimizeSeo', {
                url: site.url,
                issues: result.recommendations || [],
              });
            } catch {}
          }

          return result;
        } catch (err) {
          errors++;
          results.push({ url: site.url, overall: 'error', error: err.message });
          return { url: site.url, error: err.message };
        }
      }));

      // Brief pause between batches to let Chromium processes exit
      if (engineHealthy && i + parallelSize < siteList.length) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    const elapsed = Date.now() - startTime;
    const avgTime = siteList.length > 0 ? Math.round(elapsed / siteList.length) : 0;

    // ── Update batch if applicable ────────────────────────────────────────
    if (batch_id) {
      try {
        const batch = await svc.entities.MassLaunchBatch.filter({ batch_id }, { limit: 1 });
        const b = batch.items?.[0];
        if (b) {
          await svc.entities.MassLaunchBatch.update(b.id, {
            sites_validated: (b.sites_validated || 0) + passed, // only independently passing sites
            current_step: `swarm_tested_${passed + failed}_of_${siteList.length}`,
            validation_receipt_ids: [...(b.validation_receipt_ids || []), ...receiptIds],
          });
        }
      } catch {}
    }

    return Response.json({
      mode: 'parallel_swarm',
      engine_healthy: engineHealthy,
      engine_used: engineHealthy,
      total_sites: siteList.length,
      passed,
      failed,
      errors,
      parallel_batch_size: parallelSize,
      elapsed_ms: elapsed,
      avg_ms_per_site: avgTime,
      sites_per_minute: elapsed > 0 ? Math.round((siteList.length / elapsed) * 60000) : 0,
      receipts_created: receiptIds.length,
      results: results.slice(0, 50),
      summary: `${passed}/${siteList.length} passed, ${failed} failed, ${errors} errors in ${Math.round(elapsed / 1000)}s (${Math.round((siteList.length / elapsed) * 60000)} sites/min)`,
    });
  } catch (error) {
    console.error('parallelTestSwarm error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function testSingleSite(base44, url, queueId, engineHealthy) {
  // Phase 1: HTTP liveness
  let httpOk = false;
  let httpStatus = 0;
  try {
    const resp = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(15000), redirect: 'follow' });
    httpStatus = resp.status;
    httpOk = resp.ok;
  } catch { /* failed */ }

  // Phase 2: Cloud browser full test
  let browserTests = null;
  let engineError = null;
  if (engineHealthy) {
    try {
      (globalThis as any).__base44 = base44;
      browserTests = await runFullSiteTest(url);
    } catch (e) {
      engineError = e.message?.slice(0, 200);
      browserTests = null;
    }
  }

  // Phase 3: Compile report
  const bt = browserTests?.tests || {};
  const report = {
    url,
    tested_at: new Date().toISOString(),
    engine_used: !!browserTests,
    engine_error: engineError,
    test_method: browserTests ? 'cloud_browser' : 'http_only',
    screenshot_uri: browserTests?.screenshot_uri || null,
    overall: !httpOk ? 'failed' : (browserTests?.overall || 'partial'),
    http: { status: httpStatus, ok: httpOk },
    tests: {
      buttons: bt.buttons || { passed: null, detail: 'Not tested', total: 0, clickable: 0, broken: 0 },
      links: bt.links || { passed: null, detail: 'Not tested', total: 0, valid: 0, broken: 0 },
      images: bt.images || { passed: null, detail: 'Not tested', total: 0, loaded: 0, broken: 0 },
      forms: bt.forms || { passed: null, detail: 'Not tested', total: 0, broken: 0 },
      interactions: bt.interactions || { passed: null, detail: 'Not tested', tested: 0, responded: 0, dead: 0 },
      console_errors: bt.console_errors || { passed: null, detail: 'Not tested', errors: 0 },
      performance: bt.performance || { passed: null, detail: 'Not tested', load_time_ms: 0, lcp_ms: 0, cls: 0 },
      responsive: bt.responsive || { passed: null, detail: 'Not tested', mobile: false, tablet: false, desktop: false },
      seo: bt.seo || { passed: null, detail: 'Not tested', title: '', h1_count: 0, schema_found: false },
    },
    recommendations: [],
  };

  if (!httpOk) report.recommendations.push('Site not responding');
  if (report.tests.buttons.broken > 0) report.recommendations.push(`${report.tests.buttons.broken} broken buttons`);
  if (report.tests.links.broken > 0) report.recommendations.push(`${report.tests.links.broken} broken links`);
  if (report.tests.images.broken > 0) report.recommendations.push(`${report.tests.images.broken} broken images`);
  if (report.tests.interactions.dead > 0) report.recommendations.push(`${report.tests.interactions.dead} dead buttons (no response on click)`);
  if (!report.tests.seo.schema_found) report.recommendations.push('No JSON-LD schema');
  if (report.tests.seo.h1_count === 0) report.recommendations.push('No H1 tag');

  return report;
}