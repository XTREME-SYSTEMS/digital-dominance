import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { url, site_id, mode } = body;

    if (!url) return Response.json({ error: 'url is required' }, { status: 400 });

    const engineUrl = secrets.get('CLOUD_BROWSER_ENGINE_URL');
    const engineKey = secrets.get('ENGINE_API_KEY');

    // Step 1: Basic HTTP liveness check
    let httpStatus = 0;
    let httpOk = false;
    let httpError = null;
    try {
      const resp = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(15000),
        redirect: 'follow',
      });
      httpStatus = resp.status;
      httpOk = resp.ok;
    } catch (e) {
      httpError = e.message;
    }

    // Step 2: Cloud browser deep validation (if engine available)
    let browserResult = null;
    if (engineUrl && engineKey) {
      try {
        const browserResp = await fetch(`${engineUrl}/api/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${engineKey}`,
          },
          body: JSON.stringify({
            url,
            checks: ['load', 'buttons', 'forms', 'links', 'console_errors'],
            timeout_ms: 30000,
          }),
          signal: AbortSignal.timeout(35000),
        });
        if (browserResp.ok) {
          browserResult = await browserResp.json();
        } else {
          browserResult = { error: `Engine returned ${browserResp.status}`, status: 'engine_error' };
        }
      } catch (e) {
        browserResult = { error: e.message, status: 'engine_unreachable' };
      }
    }

    // Step 3: Compile validation report
    const checks = {
      http_liveness: {
        passed: httpOk,
        status: httpStatus,
        detail: httpError || (httpOk ? 'Site responds with valid HTTP status' : `HTTP ${httpStatus}`),
      },
      page_load: {
        passed: browserResult?.checks?.load?.passed ?? null,
        detail: browserResult?.checks?.load?.detail || 'Not browser-verified; HTTP liveness alone cannot establish page load correctness',
      },
      buttons_clickable: {
        passed: browserResult?.checks?.buttons?.passed ?? null,
        detail: browserResult?.checks?.buttons?.detail || 'Not checked (cloud browser unavailable)',
        count: browserResult?.checks?.buttons?.count || 0,
      },
      forms_functional: {
        passed: browserResult?.checks?.forms?.passed ?? null,
        detail: browserResult?.checks?.forms?.detail || 'Not checked (cloud browser unavailable)',
        count: browserResult?.checks?.forms?.count || 0,
      },
      links_valid: {
        passed: browserResult?.checks?.links?.passed ?? null,
        detail: browserResult?.checks?.links?.detail || 'Not checked (cloud browser unavailable)',
        broken: browserResult?.checks?.links?.broken || 0,
      },
      console_errors: {
        passed: browserResult?.checks?.console_errors?.passed ?? null,
        detail: browserResult?.checks?.console_errors?.detail || 'Not checked',
        errors: browserResult?.checks?.console_errors?.errors || 0,
      },
    };

    // FAIL-CLOSED: null/untested checks are NOT passing.
    // HTTP liveness alone cannot promote a site to 'passed'.
    // Any unverified check = BLOCKED (not 'partial', not 'passed').
    const allPassed = Object.values(checks).every(c => c.passed === true);
    const anyFailed = Object.values(checks).some(c => c.passed === false);
    const anyUnverified = Object.values(checks).some(c => c.passed === null || c.passed === undefined);
    const unverifiedChecks = Object.entries(checks)
      .filter(([, check]) => check.passed === null || check.passed === undefined)
      .map(([name]) => name);

    // Overall status: 'passed' ONLY if every check is true. Otherwise BLOCKED.
    const overall = allPassed ? 'passed' : 'blocked';
    const release_eligible = allPassed && !anyFailed && !anyUnverified;

    const report = {
      url,
      site_id,
      validated_at: new Date().toISOString(),
      overall_status: overall,
      release_eligible,
      checks,
      browser_used: Boolean(browserResult?.checks),
      unverified_checks: unverifiedChecks,
      verified_coverage: `${Object.values(checks).filter(check => check.passed === true).length}/${Object.keys(checks).length}`,
      summary: overall === 'passed'
        ? 'Every declared browser and HTTP check passed with evidence'
        : anyFailed
        ? 'Site validation FAILED — one or more checks returned false. NOT RELEASED.'
        : anyUnverified
        ? `Site validation BLOCKED — ${unverifiedChecks.length} check(s) unverified: ${unverifiedChecks.join(', ')}. HTTP liveness alone cannot establish page correctness. NOT RELEASED.`
        : 'Site validation incomplete — NOT RELEASED.',
    };

    // Save validation receipt if site_id provided
    if (site_id) {
      try {
        await base44.asServiceRole.entities.SiteValidationReceipt.create({
          site_id,
          url,
          validation_type: 'headless_full',
          status: overall,
          checks: JSON.stringify(checks),
          summary: report.summary,
          validated_at: report.validated_at,
        });
      } catch (e) { /* entity may not exist — non-fatal */ }
    }

    return Response.json(report);
  } catch (error) {
    console.error('headlessSiteValidator error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}