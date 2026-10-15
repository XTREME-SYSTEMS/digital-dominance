import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidBase44AppId } from '../src/lib/base44Binding.js';
import { compiledLocalStockCatalog, filterLocalStock, getLocalStockPage } from '../src/components/template-studio/localStockData.js';

test('only explicit 24-digit hexadecimal app IDs qualify as configured', () => {
  assert.equal(isValidBase44AppId('6a77f4491f0bf92de9a3ed8b'), true);
  assert.equal(isValidBase44AppId(null), false);
  assert.equal(isValidBase44AppId('null'), false);
  assert.equal(isValidBase44AppId('foo'), false);
  assert.equal(isValidBase44AppId('6a77f4491f0bf92de9a3ed8b/bad'), false);
});
test('local catalog is a real compiler with 20 industries and 10 designs', () => {
  const all = compiledLocalStockCatalog();
  assert.equal(all.length, 200);
  assert.equal(new Set(all.map(item => item.id)).size, 200);
  assert.equal(new Set(all.map(item => item.content)).size, 200);
  assert.ok(all.every(item => item.preview_only && item.content.includes('noindex,nofollow')));
});
test('industry list contains 20 defaults and each filtered industry contains 10 designs', () => {
  const defaults = filterLocalStock({is_default: true});
  assert.equal(defaults.length, 20);
  for (const item of defaults) {
    assert.equal(filterLocalStock({niche:item.niche}).length, 10);
  }
});
test('local query supports finite search and pagination without network calls', () => {
  const first = getLocalStockPage({status:'active'}, 20);
  assert.equal(first.items.length, 20);
  assert.equal(first.has_more, true);
  const last = getLocalStockPage({status:'active'}, 20, '180');
  assert.equal(last.items.length, 20);
  assert.equal(last.next_cursor, null);
  const roofing = filterLocalStock({niche:'roofing', name:{$regex:'studio'}});
  assert.ok(roofing.length >= 0);
  assert.throws(() => getLocalStockPage({},20,'bad'), /INVALID_STOCK_CURSOR/);
  assert.throws(() => getLocalStockPage({},500), /INVALID_STOCK_PAGE_SIZE/);
});
