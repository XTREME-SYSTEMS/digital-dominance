import test from 'node:test';
import assert from 'node:assert/strict';
import { findPreviewTemplate } from '../src/components/template-studio/previewSource.js';
import { compiledLocalStockCatalog } from '../src/components/template-studio/localStockData.js';

test('preview uses the exact selected HTML, even without a backend', () => {
  const selected = compiledLocalStockCatalog().find(item => item.id === 'source-epoxy_flooring-signature');
  assert.ok(selected?.content?.includes('<main'));
  assert.strictEqual(findPreviewTemplate(selected, 'Epoxy Flooring'), selected);
});

test('lookup by stable ID or slug reuses local design without a Base44 request', () => {
  const selected = compiledLocalStockCatalog().find(item => item.id === 'source-epoxy_flooring-signature');
  assert.equal(findPreviewTemplate({ id: selected.id })?.content, selected.content);
  assert.equal(findPreviewTemplate(selected.slug)?.id, selected.id);
});

test('industry default can be previewed safely when no template object is supplied', () => {
  const selected = findPreviewTemplate(null, 'Epoxy Flooring');
  assert.equal(selected?.id, 'source-epoxy_flooring-signature');
  assert.ok(selected?.content?.includes('noindex,nofollow'));
  assert.equal(findPreviewTemplate({id:'other-tenant-id'}), null);
});

test('all ten designs for one industry contain unique renderable HTML', () => {
  const templates = compiledLocalStockCatalog().filter(t => t.id.startsWith('source-epoxy_flooring-'));
  assert.equal(templates.length, 10);
  assert.equal(new Set(templates.map(t => t.content)).size, 10);
  assert.ok(templates.every(t => t.content.includes('<main')));
});
