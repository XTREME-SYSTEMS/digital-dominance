import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// Offline source-invariant regression for an explicitly stage-gated launcher.
// This is NOT a functional or independent site validation.
const source = readFileSync(new URL('../base44/functions/bulkLaunchEngine/entry.ts', import.meta.url), 'utf8');
function occurrences(needle) { return source.split(needle).length - 1; }

test('both paths require an actual Vercel acceptance receipt', () => {
  assert.equal(occurrences('Missing Vercel acceptance receipt'), 2);
  assert.equal(occurrences('proof.success !== true'), 2);
  assert.equal(occurrences("typeof proof.deployment_id !== 'string'"), 2);
  assert.equal(occurrences("typeof proof.url !== 'string'"), 2);
});

test('no invented domain is used after failed deployment', () => {
  assert.ok(!source.includes('let deployUrl = site.site_url'));
  assert.ok(!source.includes('Vercel deploy may fail'));
  assert.ok(!source.includes('use the subdomain URL as fallback'));
});

test('neither launcher reports an unverified site live', () => {
  assert.equal(occurrences("status: 'live'"), 0);
  assert.equal(occurrences('deployed++'), 0);
  assert.equal(occurrences("status: 'deploying'"), 4);
  assert.equal(occurrences('awaiting_validation: accepted'), 2);
  assert.equal(occurrences('release_ready: false'), 2);
});

test('emitting a sync event never means GPT acknowledged it', () => {
  assert.equal(occurrences('gpt_synced: true'), 0);
  assert.equal(occurrences("status: 'synced'"), 0);
  assert.equal(occurrences('syncEventsEmitted++'), 2);
  assert.equal(occurrences('sync_events_emitted: syncEventsEmitted'), 2);
});

test('accepted deployment does not imply actual live deployment count', () => {
  assert.equal(occurrences('deployments_accepted: accepted'), 2);
  assert.equal(occurrences('let deployed = 0, accepted = 0'), 2);
  assert.equal(occurrences("status: 'awaiting_validation'"), 1);
});

console.log('Bulk-launch deployment truth source invariant tests complete.');
