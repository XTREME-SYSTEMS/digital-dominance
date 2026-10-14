import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Site Launch Validator — deterministically validates every step of a site launch
// and returns a 0-100 Google compliance score with actionable recommendations.
// Can validate a single site or an entire batch.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { batchId, siteId, url } = body;
    const svc = base44.asServiceRole;

    let sites = [];
    let batch = null;

    if (batchId) {
      const b = await svc.entities.MassLaunchBatch.filter({ batch_id: batchId }, { limit: 1 });
      batch = b.items?.[0];
      if (!batch) return Response.json({ error: 'Batch not found' }, { status: 404 });
      const queueRes = await svc.entities.WebsiteQueue.filter(
        { id: { $in: batch.queue_item_ids } },
        { limit: 500 }
      );
      sites = queueRes.items || queueRes;
    } else if (siteId) {
      const s = await svc.entities.WebsiteQueue.filter({ id: siteId }, { limit: 1 });
      sites = s.items || s;
    } else if (url) {
      const s = await svc.entities.WebsiteQueue.filter({ generated_url: url }, { limit: 1 });
      sites = s.items || s;
    } else {
      return Response.json({ error: 'batchId, siteId, or url required' }, { status: 400 });
    }

    const results = [];
    let totalScore = 0;
    let passCount = 0;

    for (const site of sites) {
      const checks = await validateSite(base44, site, batch);
      results.push(checks);
      totalScore += checks.google_score;
      if (checks.overall_pass) passCount++;

      // Update site score
      await svc.entities.WebsiteQueue.update(site.id, {
        traffic_score: checks.google_score,
        seo_score: checks.seo_score,
        aeo_score: checks.aeo_score,
        last_audit_at: new Date().toISOString(),
      }).catch(() => {});
    }

    const avgScore = results.length > 0 ? Math.round(totalScore / results.length) : 0;
    const allPass = results.length > 0 && passCount === results.length;

    // Update batch if validating a batch
    if (batch) {
      await svc.entities.MassLaunchBatch.update(batch.id, {
        sites_validated: passCount,
        sites_scored: results.length,
        average_google_score: avgScore,
        status: allPass ? 'complete' : 'validating',
        current_step: `validated_${passCount}_${results.length}_avg_${avgScore}`,
      }).catch(() => {});
    }

    return Response.json({
      batch_id: batch?.batch_id || null,
      total_sites: results.length,
      passed: passCount,
      failed: results.length - passCount,
      average_google_score: avgScore,
      all_pass: allPass,
      target_score: 100,
      scoring_method: 'internal_preview_evidence_not_google_ranking',
      gap_to_100: Math.max(0, 100 - avgScore),
      sites: results.map((r) => ({
        site_id: r.site_id,
        url: r.url,
        city: r.city,
        state: r.state,
        google_score: r.google_score,
        overall_pass: r.overall_pass,
        gap: r.gap,
        recommendations: r.recommendations,
        checks: r.checks,
      })),
      message: allPass
        ? 'Preview proof and independently issued Guardian receipts verified for every site; this does not establish Google ranking.'
        : 'Preflight only. Missing live noindex, provider identity, or independent Guardian evidence. Do not publish or report search compliance.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function validateSite(base44, site, batch) {
  const svc = base44.asServiceRole;
  // Domain strings and generated URLs are claims, not proof of deployment.
  const url = typeof site.generated_url === 'string' ? site.generated_url : null;
  let receipt = null;
  try {
    const records = await svc.entities.SiteValidationReceipt.filter(
      { location_id: site.id }, { sort: '-validated_at', limit: 1 }
    );
    receipt = (records.items || records)[0] || null;
  } catch { /* Lack of a receipt is a failed evidence check. */ }

  let httpOk = false;
  let statusCode = 0;
  let latencyMs = 0;
  let noindexHeader = false;
  let noindexMeta = false;
  let approvedPreviewHost = false;
  let canonicalUrl = null;

  // A narrow *.vercel.app allowlist prevents arbitrary admin-supplied URLs
  // from reaching localhost, internal metadata endpoints or private networks.
  if (url) {
    try {
      const parsed = new URL(url);
      approvedPreviewHost = parsed.protocol === 'https:' &&
        parsed.hostname.endsWith('.vercel.app') &&
        !parsed.username && !parsed.password && !parsed.port &&
        parsed.pathname.startsWith('/canary/');
      if (approvedPreviewHost) {
        canonicalUrl = parsed.href;
        const start = Date.now();
        const response = await fetch(canonicalUrl, {
          method: 'GET',
          redirect: 'manual',
          signal: AbortSignal.timeout(12000),
        });
        latencyMs = Date.now() - start;
        statusCode = response.status;
        httpOk = statusCode === 200 && /text\/html/i.test(response.headers.get('content-type') || '');
        noindexHeader = /noindex/i.test(response.headers.get('x-robots-tag') || '');
        const declaredBytes = Number(response.headers.get('content-length') || 0);
        if (httpOk && (declaredBytes === 0 || declaredBytes <= 1024 * 1024)) {
          const html = (await response.text()).slice(0, 1024 * 1024);
          noindexMeta = /<meta\b[^>]*name\s*=\s*["']robots["'][^>]*content\s*=\s*["'][^"']*noindex/i.test(html);
        }
      }
    } catch { /* Errors, redirects, private hosts and invalid URLs fail closed. */ }
  }

  // Only a distinct Guardian source, matching this exact provider-backed
  // preview URL and deployment ID, may supply independent validation evidence.
  const guardianReceipt = Boolean(
    receipt && receipt.overall_pass === true &&
    /^guardian:/i.test(String(receipt.validator_version || '')) &&
    /^dpl_[A-Za-z0-9]+$/.test(String(receipt.deployment_id || '')) &&
    receipt.http_status === 200 && receipt.correct_robots === true &&
    canonicalUrl && receipt.canonical_url === canonicalUrl
  );

  const checks = {
    generated_preview_url: !!url,
    preview_host_allowlisted: approvedPreviewHost,
    actual_http_200: httpOk,
    actual_x_robots_noindex: noindexHeader,
    actual_meta_noindex: noindexMeta,
    guardian_receipt_matches_preview: guardianReceipt,
  };
  const score = Math.round(Object.values(checks).filter(Boolean).length / Object.keys(checks).length * 100);
  const overallPass = Object.values(checks).every(Boolean);
  const recommendations = [];
  if (!url) recommendations.push('A real generated preview URL is required, not a proposed domain');
  if (!approvedPreviewHost) recommendations.push('Validate only the isolated HTTPS Vercel /canary/ preview');
  if (!httpOk) recommendations.push('Verify the exact preview returns HTTP 200 without redirect or errors');
  if (!noindexHeader || !noindexMeta) recommendations.push('Require both HTTP X-Robots-Tag and HTML meta noindex');
  if (!guardianReceipt) recommendations.push('Attach an independent Guardian receipt with matching deployment ID, preview URL, HTTP 200 and robots verification');

  return {
    site_id: site.id,
    url,
    city: site.target_city,
    state: site.target_state,
    checks,
    seo_score: Number(site.seo_score) || 0,
    aeo_score: Number(site.aeo_score) || 0,
    geo_score: Number(site.traffic_score) || 0,
    http_ok: httpOk,
    http_status: statusCode,
    latency_ms: latencyMs,
    google_score: score, // Backward-compatible field; NOT a Google ranking/compliance score.
    scoring_method: 'internal_preview_evidence_not_google_ranking',
    gap: 100 - score,
    overall_pass: overallPass,
    recommendations,
  };
}
