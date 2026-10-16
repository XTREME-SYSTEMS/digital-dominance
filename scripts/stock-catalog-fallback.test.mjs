import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BUILTIN_STOCK_PREFIX, getBuiltinStockTemplates, getBuiltinStockTemplateById,
  getBuiltinStockPage, filterBuiltinStockTemplates, isStockBackendUnavailable
} from '../src/lib/stockCatalogFallback.js';

test('all 20 industries and 10 real designs are bundled', () => {
  const templates = getBuiltinStockTemplates();
  assert.equal(templates.length, 200);
  assert.equal(new Set(templates.map(t => t.slug)).size, 200);
  assert.equal(new Set(templates.map(t => t.niche)).size, 20);
  assert.equal(templates.filter(t => t.is_default).length, 20);
  assert.equal(templates.every(t => t.id.startsWith(BUILTIN_STOCK_PREFIX)), true);
});
test('all 200 previews are genuine full-page noindex HTML built from the canonical source', () => {
  for (const t of getBuiltinStockTemplates()) {
    assert.match(t.content, /<!doctype html>/i);
    assert.match(t.content, /<h1>/);
    assert.match(t.content, /<meta name="robots" content="noindex,nofollow">/);
    assert.match(t.content, /<section id="services"/);
    assert.match(t.content, /<section id="contact"/);
    assert.ok(t.preview_image_url.startsWith('https://'));
    assert.equal(getBuiltinStockTemplateById(t.id)?.slug, t.slug);
  }
});
test('pagination returns all 200 without missing or duplicate records', () => {
  const seen = new Set();
  let cursor;
  do {
    const page = getBuiltinStockPage({}, {limit: 23, cursor});
    for (const item of page.items) {
      assert.ok(!seen.has(item.id));
      seen.add(item.id);
    }
    cursor = page.next_cursor;
    if (!page.has_more) assert.equal(cursor, null);
  } while(cursor);
  assert.equal(seen.size, 200);
});
test('default homepage includes exactly one template per industry', () => {
  const page = getBuiltinStockPage({is_default: true}, {limit:20});
  assert.equal(page.items.length,20);
  assert.equal(page.has_more,false);
  assert.equal(new Set(page.items.map(t=>t.niche)).size,20);
});
test('industry, name, tagged version and sort filtering work', () => {
  const matches = filterBuiltinStockTemplates({niche:'Legal',name:{$regex:'Magazine',$options:'i'}});
  assert.equal(matches.length,1);
  assert.equal(matches[0].name,'Legal / Magazine Editorial');
  const more = filterBuiltinStockTemplates({niche:'Legal',sort_order:{$gt:4}});
  assert.equal(more.length,5);
  assert.equal(filterBuiltinStockTemplates({tags:{$all:['missing-version']}}).length,0);
});
test('missing backend page gets fallback, but auth failures stay visible', () => {
  assert.equal(isStockBackendUnavailable(new Error('The page could not be found')),true);
  assert.equal(isStockBackendUnavailable({status:404,message:'404'}),true);
  assert.equal(isStockBackendUnavailable({status:403,message:'Forbidden'}),false);
});
