import test from 'node:test';
import assert from 'node:assert/strict';
import { createEpoxyLeadDraft, compilePreviewSitePack, EP0XY_MARKETS } from './universal-epoxy-lead-sitepack.mjs';

const params = {
  sourceSha: 'a'.repeat(40),
  templateId: 'premium-instant-estimate',
  brandName: 'Synthetic Epoxy Preview',
  legalBusinessName: 'Synthetic Test Business',
  contactPhone: '000-000-0000',
  referenceUrl: 'https://website-launch-engine-xps.vercel.app/',
};
const validation = (city) => ({
  city, verified_service_area: true,
  verification_source: 'synthetic-fixture-no-real-world-claim',
  unique_value: 'Synthetic local value placeholder for isolated test only',
  content_review_approved: true,
});
test('draft has 10 research candidates and cannot publish', () => {
  const draft = createEpoxyLeadDraft(params);
  assert.equal(draft.locations.length, 10);
  assert.equal(draft.status, 'pending_research_and_approval');
  assert.equal(draft.provisioning.mode, 'preview');
  assert.equal(draft.provisioning.production_publish, false);
  assert.equal(draft.locations.every(x => x.verified_service_area === false), true);
  assert.equal(Object.isFrozen(draft), true);
});
test('source SHA and necessary identity are required', () => {
  assert.throws(() => createEpoxyLeadDraft({ ...params, sourceSha: 'abc' }), /SHA/);
  assert.throws(() => createEpoxyLeadDraft({ ...params, templateId: '' }), /nonempty/);
});
test('missing market research fails closed', () => {
  const draft = createEpoxyLeadDraft(params);
  assert.throws(() => compilePreviewSitePack(draft, []), /Ten independent/);
  assert.throws(() => compilePreviewSitePack(draft, EP0XY_MARKETS.map(city => ({
    ...validation(city), verified_service_area: false,
  }))), /independently verified/);
  assert.throws(() => compilePreviewSitePack(draft, EP0XY_MARKETS.map(city => ({
    ...validation(city), content_review_approved: false,
  }))), /approved/);
});
test('valid synthetic fixture only compiles an inert preview specification', () => {
  const draft = createEpoxyLeadDraft(params);
  const spec = compilePreviewSitePack(draft, EP0XY_MARKETS.map(validation));
  assert.equal(spec.locations.length, 10);
  assert.match(spec.manifest_sha256, /^[a-f0-9]{64}$/);
  assert.equal(spec.status, 'preview_spec_ready_not_deployed');
  assert.equal(spec.provisioning.noindex_until_validated, true);
  assert.equal(spec.provisioning.customer_outbound, false);
  assert.equal(Object.isFrozen(spec), true);
});
test('duplicates and modified publish settings are rejected', () => {
  const draft = createEpoxyLeadDraft(params);
  assert.throws(() => compilePreviewSitePack(draft, [
    validation(EP0XY_MARKETS[0]), ...EP0XY_MARKETS.slice(0, 9).map(validation),
  ]), /duplicate city/);
  assert.throws(() => compilePreviewSitePack({
    ...draft, provisioning: { ...draft.provisioning, production_publish: true },
  }, EP0XY_MARKETS.map(validation)), /Unsafe provisioning/);
});
