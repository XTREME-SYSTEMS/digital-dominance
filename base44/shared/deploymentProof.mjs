// Conservative first-pass provider and HTTP proof. NOT Google or release certification.
export function parseDeploymentReceipt(result) {
  const r = result?.data ?? result;
  if (r?.success !== true || typeof r.deployment_id !== 'string' || !r.deployment_id.startsWith('dpl_'))
    return { ok: false, reason: 'PROVIDER_DEPLOYMENT_NOT_CONFIRMED' };
  try {
    const u = new URL(r.url);
    if (u.protocol !== 'https:' || !u.hostname.endsWith('.vercel.app') || u.username || u.password)
      return { ok: false, reason: 'UNTRUSTED_DEPLOYMENT_URL' };
    return { ok: true, url: u.toString(), deployment_id: r.deployment_id };
  } catch { return { ok: false, reason: 'INVALID_DEPLOYMENT_URL' }; }
}

export async function probeDeployment(url, fetchImpl = fetch) {
  const started = Date.now();
  const fail = (reason, http_status = 0) => ({
    ready: false, reason, http_status, final_url: url, response_latency_ms: Date.now() - started, html: ''
  });
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' || !u.hostname.endsWith('.vercel.app'))
      return fail('PROBE_URL_NOT_TRUSTED');
    const r = await fetchImpl(url, { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(10000) });
    const type = r.headers?.get?.('content-type') || '';
    if (r.status !== 200 || !/text\/html/i.test(type) || Number(r.headers?.get?.('content-length') || 0) > 2000000)
      return fail('HTTP_HTML_NOT_READY', r.status);
    const html = await r.text();
    if (!/<html\b/i.test(html) || !/<title\b[^>]*>[^<]+<\/title>/i.test(html))
      return fail('HTML_TITLE_NOT_VERIFIED', r.status);
    return {
      ready: true, reason: null, http_status: 200,
      final_url: r.url || url, response_latency_ms: Date.now() - started, html: html.slice(0, 200000)
    };
  } catch (e) { return fail('HTTP_PROBE_FAILED: ' + String(e?.message || e).slice(0, 100)); }
}

export function conservativeSitePrecheck(probe, site) {
  const html = probe?.html || '';
  const meta = [...html.matchAll(/<meta\b[^>]*>/gi)].map(x => x[0])
    .find(tag => /\bname\s*=\s*['"]robots['"]/i.test(tag)) || '';
  const noindex = /\bcontent\s*=\s*['"][^'"]*\bnoindex\b/i.test(meta);
  const title = /<title\b[^>]*>[^<]+<\/title>/i.test(html);
  const h1 = /<h1\b[^>]*>[^<]+<\/h1>/i.test(html);
  const city = !!site?.target_city && html.toLowerCase().includes(String(site.target_city).toLowerCase());
  const state = !!site?.target_state && html.toLowerCase().includes(String(site.target_state).toLowerCase());
  const reasons = ['INDEPENDENT_CONTENT_FACTS_CONVERSION_VISUAL_AND_SEO_REVIEW_REQUIRED'];
  if (!probe?.ready) reasons.push('PUBLIC_HTTP_200_HTML_NOT_VERIFIED');
  if (!noindex) reasons.push('DRAFT_NOINDEX_NOT_VERIFIED');
  if (!title || !h1 || !city || !state) reasons.push('RENDERED_MARKET_LAYOUT_NOT_VERIFIED');
  return {
    dns_reachable: probe?.ready === true,
    tls_valid: probe?.ready === true && String(probe.final_url || '').startsWith('https://'),
    http_status: probe?.http_status || 0, final_url: probe?.final_url || '',
    response_latency_ms: probe?.response_latency_ms || 0,
    render_complete: probe?.ready === true,
    correct_city: city, correct_state: state, correct_h1: h1, correct_title: title,
    correct_description: false, correct_canonical: false, correct_robots: noindex,
    correct_og_url: false, structured_data_valid: false, correct_business_facts: false,
    internal_nav_works: false, estimate_cta_present: false, visualizer_accessible: false,
    mobile_viewport_ok: false, desktop_viewport_ok: false, canonical_conflict: false,
    sitemap_member: false, registry_member: false,
    overall_pass: false, failure_reasons: reasons
  };
}
