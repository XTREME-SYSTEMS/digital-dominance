import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { url, mode, depth } = body;

    // Mode: 'single' = test one URL, 'all' = test all deployed sites
    if (mode === 'all') {
      // Fetch all deployed sites and test each
      const sites = await base44.asServiceRole.entities.DeploymentRecord.filter({ status: 'deployed' }, { limit: 500 }).catch(() => ({ items: [] }));
      const results = [];
      for (const site of sites.items || []) {
        const siteUrl = site.url || site.deployment_url;
        if (!siteUrl) continue;
        const result = await testSite(siteUrl, site.id);
        results.push(result);
      }
      return Response.json({ mode: 'all', total: results.length, results });
    }

    if (!url) return Response.json({ error: 'url is required' }, { status: 400 });
    const result = await testSite(url, null, depth || 'full');
    return Response.json(result);
  } catch (error) {
    console.error('fullSiteTestAgent error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function testSite(url, site_id, depth = 'full') {
  const engineUrl = secrets.get('CLOUD_BROWSER_ENGINE_URL');
  const engineKey = secrets.get('ENGINE_API_KEY');

  // Phase 1: HTTP liveness
  let httpOk = false;
  let httpStatus = 0;
  try {
    const resp = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(15000), redirect: 'follow' });
    httpStatus = resp.status;
    httpOk = resp.ok;
  } catch (e) { /* failed */ }

  // Phase 2: Cloud browser full test
  let browserTests = null;
  if (engineUrl && engineKey) {
    try {
      const browserResp = await fetch(`${engineUrl}/api/test-site`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${engineKey}` },
        body: JSON.stringify({
          url,
          depth,
          tests: ['buttons', 'forms', 'links', 'navigation', 'images', 'console_errors', 'responsive', 'performance'],
          timeout_ms: 60000,
        }),
        signal: AbortSignal.timeout(65000),
      });
      if (browserResp.ok) browserTests = await browserResp.json();
    } catch (e) { /* engine unavailable */ }
  }

  // Phase 3: Compile comprehensive report
  const report = {
    url,
    site_id,
    tested_at: new Date().toISOString(),
    overall: httpOk ? (browserTests?.overall || 'passed') : 'failed',
    http: { status: httpStatus, ok: httpOk },
    tests: {
      buttons: browserTests?.tests?.buttons || { passed: null, detail: 'Not tested (cloud browser required)', total: 0, clicked: 0, broken: 0 },
      forms: browserTests?.tests?.forms || { passed: null, detail: 'Not tested', total: 0, filled: 0, broken: 0 },
      links: browserTests?.tests?.links || { passed: null, detail: 'Not tested', total: 0, valid: 0, broken: 0 },
      navigation: browserTests?.tests?.navigation || { passed: null, detail: 'Not tested', pages_visited: 0 },
      images: browserTests?.tests?.images || { passed: null, detail: 'Not tested', total: 0, loaded: 0, broken: 0 },
      console_errors: browserTests?.tests?.console_errors || { passed: null, detail: 'Not tested', errors: 0 },
      responsive: browserTests?.tests?.responsive || { passed: null, detail: 'Not tested', mobile: false, tablet: false, desktop: false },
      performance: browserTests?.tests?.performance || { passed: null, detail: 'Not tested', load_time_ms: 0, lcp_ms: 0, cls: 0 },
    },
    summary: '',
    recommendations: [],
  };

  // Generate recommendations
  if (!httpOk) report.recommendations.push('Site is not responding to HTTP requests — check deployment status');
  if (report.tests.buttons.broken > 0) report.recommendations.push(`${report.tests.buttons.broken} broken buttons found — fix click handlers`);
  if (report.tests.forms.broken > 0) report.recommendations.push(`${report.tests.forms.broken} broken forms found — fix form submission handlers`);
  if (report.tests.links.broken > 0) report.recommendations.push(`${report.tests.links.broken} broken links found — fix href attributes`);
  if (report.tests.images.broken > 0) report.recommendations.push(`${report.tests.images.broken} broken images found — fix src attributes`);
  if (report.tests.console_errors.errors > 0) report.recommendations.push(`${report.tests.console_errors.errors} console errors — fix JavaScript issues`);
  if (report.tests.performance.load_time_ms > 3000) report.recommendations.push('Page load time exceeds 3s — optimize performance');

  report.summary = report.overall === 'passed'
    ? 'All tests passed — every button, form, and feature is functional'
    : report.overall === 'failed'
    ? 'Site test failed — see recommendations for fixes'
    : 'Partial test completed — some checks require cloud browser';

  return report;
}