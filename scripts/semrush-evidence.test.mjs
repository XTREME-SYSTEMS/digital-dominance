import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectPilot, planPilot, normalizeRows, providerPayload, rankingInputs, digest,
  OPERATIONS, LIMITS, PILOT_DOMAIN, PILOT_ID } from '../base44/shared/semrushEvidence.mjs';
import { fileLedger } from './semrush-pilot-ledger.mjs';

// Synthetic contract: these are NOT Semrush report names or published prices.
const now = 1790528400000;
function contract() { return { domain: PILOT_DOMAIN, database: 'us', expiresAt: now + 60000,
  schemaHash: 'a'.repeat(64), rateEvidenceHash: 'b'.repeat(64), availableUnits: 1000,
  requests: OPERATIONS.map(operation => ({ operation, report: 'fixture_' + operation,
    params: { limit: LIMITS[operation] }, limitParam: 'limit', maxUnits: 100 })) }; }
const rows = {
  competitors: [{ domain: 'example.com', overlap: 0.2 }],
  keywordGap: [{ keyword: 'epoxy flooring', competitor: 'example.com', competitorPosition: 3, targetPosition: null }],
  backlinks: [{ sourceUrl: 'https://example.com/article', targetUrl: 'https://epoxyquotenearme.com/', lost: false, nofollow: true }],
  rankings: [{ keyword: 'epoxy floor', position: 8, volume: 100, url: 'https://epoxyquotenearme.com/' }]
};
function runtime(overrides = {}) {
  let calls = 0, reserved = false;
  const config = { contract: contract(), now,
    executeReport: async () => { calls++; return { structuredContent: { ok: true } }; },
    decode: op => ({ status: 'OK', rows: rows[op] }),
    ledger: { reserve: async () => { if (reserved) throw Error('DUPLICATE'); reserved = true; }, finish: async () => {} },
    ...overrides };
  return { config, calls: () => calls };
}
test('one-domain preflight is blocked with explicit limits', () => {
  assert.equal(planPilot().status, 'BLOCKED');
  assert.equal(planPilot().maxCalls, 4);
  assert.throws(() => planPilot('example.com'), /DOMAIN_NOT_ALLOWED/);
});
test('missing contract never calls provider', async () => {
  const r = runtime({ contract: null });
  await assert.rejects(collectPilot(r.config), /UNVERIFIED_CONTRACT/); assert.equal(r.calls(), 0);
});
test('unknown, fractional, NaN, excessive rates and insufficient balance fail closed', async () => {
  for (const value of [null, NaN, 0, 0.5, 1001]) {
    const r = runtime(); r.config.contract.requests[0].maxUnits = value;
    await assert.rejects(collectPilot(r.config)); assert.equal(r.calls(), 0);
  }
  const r = runtime(); r.config.contract.availableUnits = 399;
  await assert.rejects(collectPilot(r.config), /UNIT_BUDGET_EXCEEDED/); assert.equal(r.calls(), 0);
});
test('stale contract and altered provider row cap are blocked', async () => {
  const r = runtime(); r.config.contract.expiresAt = now;
  await assert.rejects(collectPilot(r.config), /UNVERIFIED_CONTRACT/);
  r.config.contract = contract(); r.config.contract.requests[0].params.limit = 0;
  await assert.rejects(collectPilot(r.config), /INVALID_CONTRACT/); assert.equal(r.calls(), 0);
});
test('embedded no_api_units with isError false is recognized', async () => {
  let calls = 0;
  const r = runtime({ executeReport: async () => { calls++; return { isError: false,
    content: [{ type: 'text', text: '{"code":"no_api_units","retryable":false}' }] }; } });
  const result = await collectPilot(r.config);
  assert.equal(result.reason, 'NO_API_UNITS'); assert.equal(calls, 1);
  await assert.rejects(collectPilot(r.config), /DUPLICATE/); assert.equal(calls, 1);
});
test('provider errors, malformed data and exceptions never become empty evidence', async () => {
  for (const response of [{ isError: true }, {}, { structuredContent: { error: 'denied' } }]) {
    assert.throws(() => providerPayload(response));
  }
  const r = runtime({ executeReport: async () => { throw Error('secret provider error'); } });
  const result = await collectPilot(r.config);
  assert.equal(result.status, 'BLOCKED'); assert.ok(!JSON.stringify(result).includes('secret'));
});
test('four-operation collection yields replayable hash and ranking inputs', async () => {
  const r = runtime(); const result = await collectPilot(r.config);
  assert.equal(result.status, 'COLLECTED'); assert.equal(r.calls(), 4);
  assert.equal(result.hash, await digest(result.snapshot));
  const a = await rankingInputs(result.snapshot, result.hash, now);
  const b = await rankingInputs(result.snapshot, result.hash, now);
  assert.deepEqual(a, b); assert.equal(a.rankings[0].position, 8);
  assert.equal(a.keywordGap[0].absenceMeaning, 'not_observed_in_report_scope');
});
test('hash mismatch, stale snapshot and future timestamps are rejected', async () => {
  const { snapshot, hash } = await collectPilot(runtime().config);
  await assert.rejects(rankingInputs(snapshot, '0'.repeat(64), now));
  await assert.rejects(rankingInputs(snapshot, hash, now + 86400001));
  await assert.rejects(rankingInputs(snapshot, hash, now - 1));
});
test('sorting and duplicate removal are deterministic', () => {
  const a = rows.competitors[0], b = { domain: 'other.com', overlap: 0.5 };
  assert.deepEqual(normalizeRows('competitors', [b, a, a]), normalizeRows('competitors', [a, b]));
});
test('row overflow, malformed metrics and unrelated backlink targets are rejected', () => {
  assert.throws(() => normalizeRows('competitors', Array(4).fill(rows.competitors[0])));
  assert.throws(() => normalizeRows('rankings', [{ ...rows.rankings[0], position: NaN }]));
  assert.throws(() => normalizeRows('backlinks', [{ ...rows.backlinks[0], targetUrl: 'https://other.com/' }]));
  assert.throws(() => normalizeRows('backlinks', [{ ...rows.backlinks[0], sourceUrl: 'file:///etc/passwd' }]));
});
test('explicit no-data remains empty, not fabricated', async () => {
  const r = runtime({ decode: () => ({ status: 'OK', rows: [] }) });
  const result = await collectPilot(r.config);
  assert.equal(result.status, 'COLLECTED'); assert.deepEqual(result.snapshot.observations.rankings, []);
});
test('failed reservation prevents all provider calls', async () => {
  const r = runtime({ ledger: { reserve: async () => { throw Error('STORAGE_DOWN'); } } });
  await assert.rejects(collectPilot(r.config), /STORAGE_DOWN/); assert.equal(r.calls(), 0);
});
test('filesystem ledger blocks concurrent calls and restart replay', async () => {
  const root = await mkdtemp(join(tmpdir(), 'semrush-test-'));
  try {
    const r = runtime({ ledger: fileLedger(root) });
    const outcomes = await Promise.allSettled([collectPilot(r.config), collectPilot(r.config)]);
    assert.equal(outcomes.filter(x => x.status === 'fulfilled').length, 1); assert.equal(r.calls(), 4);
    const restart = runtime({ ledger: fileLedger(root) });
    await assert.rejects(collectPilot(restart.config), /EEXIST/); assert.equal(restart.calls(), 0);
    const receipt = JSON.parse(await readFile(join(root, PILOT_ID + '.receipt.json'), 'utf8'));
    assert.equal(receipt.status, 'COLLECTED');
  } finally { await rm(root, { recursive: true, force: true }); }
});
test('partial collection failure provides no consumable snapshot', async () => {
  const r = runtime({ decode: op => op === 'rankings' ? { status: 'ERROR' } : { status: 'OK', rows: rows[op] } });
  const result = await collectPilot(r.config);
  assert.equal(result.status, 'BLOCKED'); assert.equal(result.snapshot, undefined);
});
