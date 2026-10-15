import test from 'node:test';
import assert from 'node:assert/strict';
import { createDraftLaunchPlan } from '../src/components/launch-engine/launchPlan.js';

const valid = { industry: 'roofing', template: { id: 'roofing-design-2' }, count: 10, locations: 'Florida, Texas' };

test('preserves industry, selected template, quantity and proposed markets', () => {
  const plan = createDraftLaunchPlan(valid);
  assert.equal(plan.industry, 'roofing');
  assert.equal(plan.template_id, 'roofing-design-2');
  assert.equal(plan.requested_site_count, 10);
  assert.deepEqual(plan.proposed_markets, ['Florida', 'Texas']);
});

test('treats market notes as unverified and does not simulate completed builds', () => {
  const plan = createDraftLaunchPlan(valid);
  assert.equal(plan.status, 'PENDING_MARKET_REVIEW');
  assert.equal(plan.markets_verified, false);
  assert.equal(plan.queued, false);
  assert.equal(plan.generated_site_count, 0);
  assert.equal(plan.release_mode, 'preview_only');
});

test('normalizes and de-duplicates proposed markets without inventing locations', () => {
  assert.deepEqual(
    createDraftLaunchPlan({ ...valid, locations: ' Florida, , Texas, Florida ' }).proposed_markets,
    ['Florida', 'Texas'],
  );
  assert.deepEqual(createDraftLaunchPlan({ ...valid, locations: '' }).proposed_markets, []);
});

test('rejects missing industry, missing template, or invalid quantities', () => {
  assert.throws(() => createDraftLaunchPlan({ ...valid, industry: '' }), /industry/);
  assert.throws(() => createDraftLaunchPlan({ ...valid, template: null }), /template/);
  for (const count of [0, -1, 350.5, 351, 'not-a-number']) {
    assert.throws(() => createDraftLaunchPlan({ ...valid, count }), /between 1 and 350/);
  }
});

test('rejects overlong market notes and never mutates operator input', () => {
  assert.throws(() => createDraftLaunchPlan({ ...valid, locations: 'x'.repeat(501) }), /500 characters/);
  assert.equal(valid.locations, 'Florida, Texas');
});
