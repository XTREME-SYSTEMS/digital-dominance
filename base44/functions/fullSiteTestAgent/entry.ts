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

    // Mode: 'all' = test all deployed sites (parallel swarm)
    if (mode === 'all') {
      const sites = await base44.asServiceRole.entities.WebsiteQueue.filter(
        { status: { $in: ['live', 'monitoring'] } },
        { limit: 500, sort: '-deployed_at' }
      ).catch(() => ({ items: [] }));
      const siteUrls = (sites.items || []).map((s) => ({
        url: s.generated_url || (s.domain?.startsWith('http') ? s.domain : `https://${s.domain}`),
        site_id: s.id,
      })).filter((s) => s.url);

      // Delegate to parallelTestSwarm for parallel testing
      const swarmRes = await base44.functions.invoke('parallelTestSwarm', {
        urls: siteUrls,
        maxParallel: 6,
        depth: depth || 'full',
      });
      return Response.json(swarmRes.data || swarmRes);
    }

    // Mode: 'parallel' = test multiple URLs in parallel
    if (mode === 'parallel' && Array.isArray(body.urls)) {
      const swarmRes = await base44.functions.invoke('parallelTestSwarm', {
        urls: body.urls,
        maxParallel: body.maxParallel || 6,
        depth: depth || 'full',
      });
      return Response.json(swarmRes.data || swarmRes);
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
  let engineError = null;
  if (engineHealthy) {
    try {
      (globalThis as any).__base44 = base44;
      browserTests = await runFullSiteTest(url);
    } catch (e) {
      engineError = e.message;
      browserTests = null;
    }
  }

  // Phase 2b: HTTP fallback — parse HTML to check basic issues when browser unavailable
  let httpFallback = null;
  if (!browserTests && httpOk) {
    try {
      const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
      const html = await resp.text();
      httpFallback = analyzeHtml(html, url);
    } catch (e) { /* best effort */ }
  }

  // Phase 3: Compile report
  const bt = browserTests?.tests || {};
  const hf = httpFallback || {};
  const report = {
    url,
    site_id,
    tested_at: new Date().toISOString(),
    engine_used: !!browserTests,
    engine_error: engineError,
    test_method: browserTests ? 'cloud_browser' : httpFallback ? 'http_fallback' : 'http_only',
    screenshot_uri: browserTests?.screenshot_uri || null,
    overall: !httpOk ? 'failed' : (browserTests?.overall || (httpFallback ? 'partial' : 'partial')),
    http: { status: httpStatus, ok: httpOk },
    tests: {
      buttons: bt.buttons || { passed: null, detail: engineError ? `Browser engine error: ${engineError.slice(0, 100)}` : 'Not tested', total: 0, clickable: 0, broken: 0 },
      forms: bt.forms || { passed: null, detail: 'Not tested', total: 0, broken: 0 },
      interactions: bt.interactions || { passed: null, detail: 'Not tested (requires browser)', tested: 0, responded: 0, dead: 0 },
      links: bt.links || (hf.links ? { passed: hf.links.broken === 0, total: hf.links.total, valid: hf.links.valid, broken: hf.links.broken, detail: hf.links.detail } : { passed: null, detail: 'Not tested', total: 0, valid: 0, broken: 0 }),
      images: bt.images || (hf.images ? { passed: hf.images.broken === 0, total: hf.images.total, loaded: hf.images.total - hf.images.broken, broken: hf.images.broken, detail: hf.images.detail } : { passed: null, detail: 'Not tested', total: 0, loaded: 0, broken: 0 }),
      console_errors: bt.console_errors || { passed: null, detail: 'Not tested (requires browser)', errors: 0 },
      performance: bt.performance || { passed: null, detail: 'Not tested (requires browser)', load_time_ms: 0, lcp_ms: 0, cls: 0 },
      responsive: bt.responsive || { passed: null, detail: 'Not tested (requires browser)', mobile: false, tablet: false, desktop: false },
      seo: bt.seo || (hf.seo ? { passed: hf.seo.passed, title: hf.seo.title, meta_description: hf.seo.meta_description, h1_count: hf.seo.h1_count, schema_found: hf.seo.schema_found, detail: hf.seo.detail } : { passed: null, detail: 'Not tested', title: '', h1_count: 0, schema_found: false }),
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
  if (report.tests.interactions?.dead > 0) report.recommendations.push(`${report.tests.interactions.dead} buttons have no response on click — fix click handlers`);

  report.summary = report.overall === 'passed'
    ? 'All tests passed — every button, form, link, and image is functional'
    : report.overall === 'failed'
    ? 'Site test failed — see recommendations for fixes'
    : browserTests ? 'Test completed with issues' : engineError ? `Browser engine error — fell back to HTTP analysis: ${engineError.slice(0, 80)}` : 'Partial test — HTTP fallback used (browser engine unavailable)';

  return report;
}

// HTTP fallback: parse HTML to check basic SEO and content issues without a browser
function analyzeHtml(html, url) {
  const result = { links: { total: 0, valid: 0, broken: 0, detail: '' }, images: { total: 0, broken: 0, detail: '' }, seo: { passed: false, title: '', meta_description: '', h1_count: 0, schema_found: false, detail: '' } };

  // Links
  const linkMatches = html.match(/<a[^>]+href=["']([^"']+)["']/gi) || [];
  result.links.total = linkMatches.length;
  let badLinks = 0;
  for (const m of linkMatches) {
    const href = m.match(/href=["']([^"']+)["']/i)?.[1] || '';
    if (!href || href === '#' || href.startsWith('javascript:') || href === '') badLinks++;
  }
  result.links.broken = badLinks;
  result.links.valid = result.links.total - badLinks;
  result.links.detail = badLinks > 0 ? `${badLinks} links with bad/empty href` : 'All links have valid href attributes';

  // Images
  const imgMatches = html.match(/<img[^>]+src=["']([^"']+)["']/gi) || [];
  result.images.total = imgMatches.length;
  let badImgs = 0;
  for (const m of imgMatches) {
    const src = m.match(/src=["']([^"']+)["']/i)?.[1] || '';
    if (!src || src === '') badImgs++;
  }
  result.images.broken = badImgs;
  result.images.detail = badImgs > 0 ? `${badImgs} images with empty src` : 'All images have src attributes';

  // SEO
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  result.seo.title = titleMatch ? titleMatch[1].trim() : '';
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  result.seo.meta_description = descMatch ? descMatch[1] : '';
  result.seo.h1_count = (html.match(/<h1[\s>]/gi) || []).length;
  result.seo.schema_found = html.includes('application/ld+json');
  const issues = [];
  if (!result.seo.title) issues.push('missing title');
  if (!result.seo.meta_description) issues.push('missing meta description');
  if (result.seo.h1_count === 0) issues.push('no H1');
  if (result.seo.h1_count > 1) issues.push(`multiple H1s (${result.seo.h1_count})`);
  if (!result.seo.schema_found) issues.push('no JSON-LD schema');
  result.seo.passed = issues.length === 0;
  result.seo.detail = issues.length === 0 ? 'SEO basics look good' : `Issues: ${issues.join(', ')}`;

  return result;
}