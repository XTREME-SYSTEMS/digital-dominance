import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { isEngineConfigured, runFullSiteTest, engineHealth } from '../../shared/cloudBrowserEngine.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { url, mode, depth } = body;

    // Check engine health first
    const engineReady = isEngineConfigured();
    let engineHealthy = false;
    if (engineReady) {
      try { engineHealthy = await engineHealth(); } catch { engineHealthy = false; }
    }

    // Mode: 'all' = test all deployed sites
    if (mode === 'all') {
      const sites = await base44.asServiceRole.entities.DeploymentRecord.filter({ status: 'deployed' }, { limit: 500 }).catch(() => ({ items: [] }));
      const results = [];
      for (const site of sites.items || []) {
        const siteUrl = site.url || site.deployment_url;
        if (!siteUrl) continue;
        const result = await testSite(base44, siteUrl, site.id, depth || 'full', engineHealthy);
        results.push(result);
      }
      return Response.json({ mode: 'all', engine_healthy: engineHealthy, total: results.length, results });
    }

    if (!url) return Response.json({ error: 'url is required' }, { status: 400 });
    const result = await testSite(base44, url, null, depth || 'full', engineHealthy);
    return Response.json(result);
  } catch (error) {
    console.error('fullSiteTestAgent error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function testSite(base44, url, site_id, depth, engineHealthy) {
  // Phase 1: HTTP liveness
  let httpOk = false;
  let httpStatus = 0;
  try {
    const resp = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(15000), redirect: 'follow' });
    httpStatus = resp.status;
    httpOk = resp.ok;
  } catch (e) { /* failed */ }

  // Phase 2: Cloud browser full test (real button/form/image/link testing)
  let browserTests = null;
  if (engineHealthy) {
    try {
      // Store base44 client for screenshot upload
      (globalThis as any).__base44 = base44;
      browserTests = await runFullSiteTest(url);
    } catch (e) {
      browserTests = { overall: 'error', error: e.message, tests: {} };
    }
  }

  // Phase 3: Compile report
  const bt = browserTests?.tests || {};
  const report = {
    url,
    site_id,
    tested_at: new Date().toISOString(),
    engine_used: engineHealthy,
    screenshot_uri: browserTests?.screenshot_uri || null,
    overall: !httpOk ? 'failed' : (browserTests?.overall || 'partial'),
    http: { status: httpStatus, ok: httpOk },
    tests: {
      buttons: bt.buttons || { passed: null, detail: 'Not tested (cloud browser unavailable)', total: 0, clickable: 0, broken: 0 },
      forms: bt.forms || { passed: null, detail: 'Not tested', total: 0, broken: 0 },
      links: bt.links || { passed: null, detail: 'Not tested', total: 0, valid: 0, broken: 0 },
      images: bt.images || { passed: null, detail: 'Not tested', total: 0, loaded: 0, broken: 0 },
      console_errors: bt.console_errors || { passed: null, detail: 'Not tested', errors: 0 },
      performance: bt.performance || { passed: null, detail: 'Not tested', load_time_ms: 0, lcp_ms: 0, cls: 0 },
      responsive: bt.responsive || { passed: null, detail: 'Not tested', mobile: false, tablet: false, desktop: false },
      seo: bt.seo || { passed: null, detail: 'Not tested', title: '', h1_count: 0, schema_found: false },
    },
    summary: '',
    recommendations: [],
  };

  // Generate recommendations
  if (!httpOk) report.recommendations.push('Site is not responding to HTTP requests — check deployment status');
  if (report.tests.buttons.broken > 0) report.recommendations.push(`${report.tests.buttons.broken} broken/invisible buttons found — fix click handlers or visibility`);
  if (report.tests.forms.broken > 0) report.recommendations.push(`${report.tests.forms.broken} broken forms found — add action attributes or submit handlers`);
  if (report.tests.links.broken > 0) report.recommendations.push(`${report.tests.links.broken} broken links found — fix href attributes`);
  if (report.tests.images.broken > 0) report.recommendations.push(`${report.tests.images.broken} broken images found — fix src attributes`);
  if (report.tests.console_errors.errors > 0) report.recommendations.push(`${report.tests.console_errors.errors} console errors — fix JavaScript issues`);
  if (report.tests.performance.load_time_ms > 3000) report.recommendations.push(`Page load time ${report.tests.performance.load_time_ms}ms exceeds 3s — optimize performance`);
  if (report.tests.performance.lcp_ms > 2500) report.recommendations.push(`LCP ${report.tests.performance.lcp_ms}ms exceeds 2.5s — optimize largest contentful paint`);
  if (!report.tests.seo.schema_found) report.recommendations.push('No structured data (JSON-LD schema) found — add LocalBusiness/FAQ schema for Google');
  if (report.tests.seo.h1_count === 0) report.recommendations.push('No H1 tag found — add a primary heading for SEO');

  report.summary = report.overall === 'passed'
    ? 'All tests passed — every button, form, link, and image is functional'
    : report.overall === 'failed'
    ? 'Site test failed — see recommendations for fixes'
    : engineHealthy ? 'Test completed with issues' : 'Partial test — cloud browser engine unavailable, only HTTP liveness checked';

  return report;
}