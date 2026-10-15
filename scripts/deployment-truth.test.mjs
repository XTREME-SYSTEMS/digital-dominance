import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseDeploymentReceipt, probeDeployment, conservativeSitePrecheck } from '../base44/shared/deploymentProof.mjs';

const url = 'https://test-proof.vercel.app';
const provider = { data: { success: true, deployment_id: 'dpl_testABC', url } };
function fakeResponse(status, body, type = 'text/html') {
  return { status, url, headers: { get: key => key === 'content-type' ? type : null }, text: async () => body };
}
const draftHtml = '<!doctype html><html><head><title>Boca Raton FL Epoxy Service</title><meta name="robots" content="noindex"></head><body><h1>Boca Raton Epoxy</h1></body></html>';

test('provider errors and missing deployment IDs are not successes', () => {
  assert.equal(parseDeploymentReceipt(null).ok, false);
  assert.equal(parseDeploymentReceipt({ data: { success: false, url } }).ok, false);
  assert.equal(parseDeploymentReceipt({ data: { success: true, url } }).ok, false);
});
test('untrusted deployment hosts and HTTP are rejected', () => {
  assert.equal(parseDeploymentReceipt({ data: { ...provider.data, url: 'https://internal.local' } }).ok, false);
  assert.equal(parseDeploymentReceipt({ data: { ...provider.data, url: 'http://test-proof.vercel.app' } }).ok, false);
});
test('valid Vercel deployment receipt includes provider deployment ID', () => {
  const result = parseDeploymentReceipt(provider);
  assert.equal(result.ok, true);
  assert.equal(result.deployment_id, 'dpl_testABC');
});
test('reachable 200 HTML stays unvalidated without independent review', async () => {
  const p = await probeDeployment(url, async () => fakeResponse(200, draftHtml));
  assert.equal(p.ready, true);
  const v = conservativeSitePrecheck(p, { target_city: 'Boca Raton', target_state: 'FL' });
  assert.equal(v.correct_city, true);
  assert.equal(v.correct_robots, true);
  assert.equal(v.correct_business_facts, false);
  assert.equal(v.sitemap_member, false);
  assert.equal(v.overall_pass, false);
});
test('404, JSON, redirect and no-title HTML cannot prove readiness', async () => {
  const checks = [
    fakeResponse(404, 'not found'),
    fakeResponse(200, '{}', 'application/json'),
    fakeResponse(302, '', 'text/html'),
    fakeResponse(200, '<html><h1>hello</h1></html>')
  ];
  for (const response of checks) {
    const p = await probeDeployment(url, async () => response);
    assert.equal(p.ready, false);
  }
});
test('network failure fails closed', async () => {
  const p = await probeDeployment(url, async () => { throw new Error('offline'); });
  assert.equal(p.ready, false);
  assert.match(p.reason, /HTTP_PROBE_FAILED/);
});
test('orchestrator uses provider and HTTP proof before incrementing counters', () => {
  const src = readFileSync(new URL('../base44/functions/massLaunchOrchestrator/entry.ts', import.meta.url), 'utf8');
  const providerIndex = src.indexOf('parseDeploymentReceipt(deployRes)');
  const httpIndex = src.indexOf('probeDeployment(deployedUrl)');
  const countIndex = src.indexOf('deployed++;');
  assert.ok(providerIndex > 0 && httpIndex > providerIndex && countIndex > httpIndex);
  assert.match(src, /if \(!httpProof\.ready\)/);
  assert.doesNotMatch(src, /waitUntil\(runGoogleSyncAsync\(base44, deployedUrl\)\)/);
  assert.doesNotMatch(src, /function runValidation\(url, site, content\)/);
});
test('validator contains no hard-coded indexation assertions', () => {
  const src = readFileSync(new URL('../base44/functions/siteLaunchValidator/entry.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /indexed:\s*true/);
  assert.doesNotMatch(src, /sitemap_generated:\s*true/);
  assert.doesNotMatch(src, /queued:\s*site\.status !== 'queued' \|\| true/);
});
