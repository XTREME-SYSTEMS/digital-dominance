import test from 'node:test';
import assert from 'node:assert/strict';
import { transformIndexHtmlForEnvironment } from '../scripts/preview-index-html.mjs';

const html='<html><head><meta name="robots" content="index, follow, max-image-preview:large" /></head></html>';
test('Vercel preview HTML is nonindexable before JS runs',()=>{
  const result=transformIndexHtmlForEnvironment(html,'preview');
  assert.match(result,/name="robots" content="noindex, nofollow, noarchive"/);
  assert.doesNotMatch(result,/content="index, follow/);
});
test('production and local index rules remain unchanged',()=>{
  assert.equal(transformIndexHtmlForEnvironment(html,'production'),html);
  assert.equal(transformIndexHtmlForEnvironment(html,undefined),html);
});
test('preview fails closed without the robots meta element',()=>{
  assert.throws(()=>transformIndexHtmlForEnvironment('<html></html>','preview'),/PREVIEW_ROBOTS_META_MISSING/);
});
