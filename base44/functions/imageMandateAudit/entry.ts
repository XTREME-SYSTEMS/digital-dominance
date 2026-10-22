import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { INDUSTRY_IMAGES, normalizeNiche } from '../../shared/industryImageRegistry.ts';
import { STOCK_INDUSTRIES } from '../../shared/stockIndustries.js';
import { STOCK_DESIGNS } from '../../shared/stockDesigns.js';

// ============================================================
// imageMandateAudit — the INDEPENDENT validator for industry imagery.
//
// It re-derives every expectation from the canonical registries and checks
// reality over HTTP. It trusts nothing the build code claims, repairs nothing,
// and fails closed: an unreachable, substituted or missing image is a FAIL.
//
// Checks
//   1. registry_liveness      every registry image is reachable
//   2. wizard_industry_imagery every wizard industry's own site image is reachable
//   3. image_uniqueness       no image is shared between two industries
//   4. no_substitution        no named industry falls back to generic imagery
//   5. wizard_grid_coverage   every industry x layout resolves to its own image
//   6. dead_url_regression    the 22 previously-dead URLs stay repaired
//
// Every check writes a ValidationReceipt, so every run is auditable.
//
// Invoke: base44.functions.invoke('imageMandateAudit', {})
// ============================================================

const RECEIPT_CHECK = 'industry_image_mandate';
const PREVIOUSLY_DEAD_SIGNATURE = 'images.unsplash.com/photo-1585421724267';

async function statusOf(url) {
  try {
    const head = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(10000) });
    if (head.status === 200) return 200;
    const get = await fetch(url, { signal: AbortSignal.timeout(10000) });
    return get.status;
  } catch (error) {
    return 0;
  }
}

async function statusesOf(urls) {
  const list = [];
  for (const url of urls) {
    if (list.indexOf(url) === -1) list.push(url);
  }
  const results = [];
  let index = 0;
  while (index < list.length) {
    const slice = list.slice(index, index + 6);
    const statuses = await Promise.all(slice.map(url => statusOf(url)));
    for (let i = 0; i < slice.length; i += 1) {
      results.push({ url: slice[i], status: statuses[i], ok: statuses[i] === 200 });
    }
    index += 6;
  }
  return results;
}

export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const svc = base44.asServiceRole;
    const runId = 'imat-' + Date.now();
    const checks: any[] = [];

    const record = async (check, status, expected, actual, evidence) => {
      checks.push({ check, status, actual });
      try {
        await svc.entities.ValidationReceipt.create({
          receipt_id: runId + '-' + check,
          work_packet_id: runId,
          check_name: RECEIPT_CHECK + ':' + check,
          status,
          expected: String(expected).slice(0, 2000),
          actual: String(actual).slice(0, 2000),
          evidence: String(evidence).slice(0, 5000),
          validator: 'imageMandateAudit v1',
          category: 'data_integrity',
          points_possible: 1,
          points_verified: status === 'PASS' ? 1 : 0,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('imageMandateAudit receipt write failed:', check, error && error.message);
      }
    };

    const registryEntries = Object.entries(INDUSTRY_IMAGES) as Array<[string, { url: string; label: string }]>;
    const industries = STOCK_INDUSTRIES as Array<{ key: string; label: string; image: string }>;
    const designs = STOCK_DESIGNS as Array<{ key: string; name: string }>;

    // ── 1. REGISTRY LIVENESS ─────────────────────────────────
    const registryResults = await statusesOf(registryEntries.map(entry => entry[1].url));
    const deadRegistry = registryResults.filter(r => !r.ok).map(r => r.status + ' ' + r.url);

    await record(
      'registry_liveness',
      deadRegistry.length === 0 ? 'PASS' : 'FAIL',
      'all ' + registryEntries.length + ' registry images reachable',
      registryResults.filter(r => r.ok).length + '/' + registryEntries.length + ' reachable',
      deadRegistry.length ? 'Unreachable:\n' + deadRegistry.join('\n') : 'Every registry image returned HTTP 200.',
    );

    // ── 2. WIZARD INDUSTRY IMAGERY ───────────────────────────
    const industryResults = await statusesOf(industries.map(industry => industry.image));
    const deadIndustries = industryResults.filter(r => !r.ok).map(r => r.status + ' ' + r.url);
    const unmapped = industries
      .filter(industry => !INDUSTRY_IMAGES[normalizeNiche(industry.label)])
      .map(industry => industry.key + ' (' + industry.label + ')');

    await record(
      'wizard_industry_imagery',
      deadIndustries.length === 0 && unmapped.length === 0 ? 'PASS' : 'FAIL',
      industries.length + ' wizard industries each have a reachable site image',
      industryResults.filter(r => r.ok).length + '/' + industries.length + ' reachable, ' + unmapped.length + ' unmapped',
      [
        deadIndustries.length ? 'Unreachable:\n' + deadIndustries.join('\n') : 'All wizard industry images returned HTTP 200.',
        unmapped.length ? 'Not in registry:\n' + unmapped.join('\n') : 'Every wizard industry maps to a registry entry.',
      ].join('\n'),
    );

    // ── 3. IMAGE UNIQUENESS ──────────────────────────────────
    const owners: Record<string, string[]> = {};
    const claim = (url, name) => {
      if (!url) return;
      if (!owners[url]) owners[url] = [];
      owners[url].push(name);
    };
    for (const entry of registryEntries) claim(entry[1].url, entry[0]);
    for (const industry of industries) claim(industry.image, industry.key);

    // An image may appear under two names for the SAME industry (a registry key
    // and its stock industry key). Only two DIFFERENT industries sharing a URL
    // is a failure, and the generic entry is exempt.
    const shared = Object.keys(owners)
      .filter(url => {
        if (owners[url].length < 2) return false;
        const keys = [];
        for (const name of owners[url]) {
          const key = normalizeNiche(name);
          if (keys.indexOf(key) === -1) keys.push(key);
        }
        return keys.length > 1 && keys.indexOf('default') === -1;
      })
      .map(url => owners[url].join(', ') + ' share ' + url);

    await record(
      'image_uniqueness',
      shared.length === 0 ? 'PASS' : 'FAIL',
      'no image is shared between two different industries',
      shared.length ? shared.length + ' shared image(s)' : 'every image is industry-specific',
      shared.length ? shared.join('\n') : 'No image URL is used by two different industries.',
    );

    // ── 4. NO GENERIC SUBSTITUTION ───────────────────────────
    const defaultUrl = INDUSTRY_IMAGES.default ? INDUSTRY_IMAGES.default.url : '';
    const substituted = registryEntries
      .filter(entry => entry[0] !== 'default' && entry[1].url === defaultUrl)
      .map(entry => entry[0]);

    await record(
      'no_substitution',
      substituted.length === 0 ? 'PASS' : 'FAIL',
      'no named industry falls back to generic imagery',
      substituted.length ? substituted.length + ' industries on generic imagery' : 'no substitutions',
      substituted.length ? 'Using the generic image: ' + substituted.join(', ') : 'Every named industry has its own photography.',
    );

    // ── 5. WIZARD GRID COVERAGE ──────────────────────────────
    // Mirrors the frontend resolution order: the template's own site image wins,
    // then the industry registry image. Nothing may fall back to generic.
    const unresolved: string[] = [];
    let resolved = 0;
    let genericFallbacks = 0;
    for (const industry of industries) {
      const key = normalizeNiche(industry.label);
      const registryUrl = key === 'default' ? '' : (INDUSTRY_IMAGES[key] ? INDUSTRY_IMAGES[key].url : '');
      for (const design of designs) {
        const preview = industry.image || registryUrl;
        if (!preview) {
          unresolved.push(industry.key + '/' + design.key);
        } else if (preview === defaultUrl) {
          genericFallbacks += 1;
          unresolved.push('generic:' + industry.key + '/' + design.key);
        } else {
          resolved += 1;
        }
      }
    }
    const combinations = industries.length * designs.length;

    await record(
      'wizard_grid_coverage',
      unresolved.length === 0 ? 'PASS' : 'FAIL',
      combinations + ' industry x layout combinations each resolve to their industry image',
      resolved + '/' + combinations + ' resolved, ' + genericFallbacks + ' generic',
      unresolved.length ? 'Unresolved: ' + unresolved.slice(0, 40).join(', ') : 'Every combination resolves to its own industry image.',
    );

    // ── 6. DEAD-URL REGRESSION ───────────────────────────────
    const reverted = registryEntries
      .filter(entry => entry[1].url.indexOf(PREVIOUSLY_DEAD_SIGNATURE) !== -1)
      .map(entry => entry[0]);

    await record(
      'dead_url_regression',
      reverted.length === 0 ? 'PASS' : 'FAIL',
      'the 22 previously-dead Unsplash URLs stay repaired',
      reverted.length ? reverted.length + ' reverted' : 'no reverted URLs',
      reverted.length ? 'Reverted: ' + reverted.join(', ') : 'No registry entry points at a previously-dead URL.',
    );

    const failed = checks.filter(c => c.status !== 'PASS');
    return Response.json({
      ok: true,
      runId,
      verdict: failed.length ? 'FAIL' : 'PASS',
      registrySize: registryEntries.length,
      industries: industries.length,
      designs: designs.length,
      combinations,
      failed: failed.map(c => ({ check: c.check, actual: c.actual })),
      checks,
      auditedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('imageMandateAudit error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}