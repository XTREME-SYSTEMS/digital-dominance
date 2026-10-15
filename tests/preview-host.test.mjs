import test from 'node:test';
import assert from 'node:assert/strict';
import { isGeneratedVercelPreview } from '../src/lib/previewHost.js';

test('generated Vercel deployment URLs are previews, never indexable production', () => {
  assert.equal(isGeneratedVercelPreview('digital-dominance-mqr36bs25-strategic-minds-advisory.vercel.app'), true);
  assert.equal(isGeneratedVercelPreview('website-launch-engine-128umfg4m-strategic-minds-advisory.vercel.app'), true);
  assert.equal(isGeneratedVercelPreview('digital-dominance.vercel.app'), false);
  assert.equal(isGeneratedVercelPreview('digitaldominance.com'), false);
  assert.equal(isGeneratedVercelPreview(null), false);
});
