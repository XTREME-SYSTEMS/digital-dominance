import test from 'node:test';
import assert from 'node:assert/strict';
import { generateSyntheticPreviewSite } from '../scripts/synthetic-preview-site.mjs';

test('one actual roofing template is compiled and explicitly synthetic',()=>{
  const sample=generateSyntheticPreviewSite();
  assert.equal(sample.template_id,'source-roofing-signature');
  assert.equal(sample.preview_only,true);
  assert.equal(sample.generated,false);
  assert.equal(sample.published,false);
  assert.equal(sample.customer_data,false);
  assert.match(sample.html,/noindex,nofollow/);
  assert.match(sample.html,/NOT A REAL BUSINESS/);
  assert.match(sample.html,/<h1>/);
  assert.match(sample.html,/id="services"/);
  assert.match(sample.html,/id="contact"/);
  assert.doesNotMatch(sample.html,/<form\b/);
});
test('denies arbitrary industries, designs or expansion before canary approval',()=>{
  assert.throws(()=>generateSyntheticPreviewSite('legal','signature'),/SYNTHETIC_CANARY_SCOPE_DENIED/);
  assert.throws(()=>generateSyntheticPreviewSite('roofing','immersive'),/SYNTHETIC_CANARY_SCOPE_DENIED/);
});
