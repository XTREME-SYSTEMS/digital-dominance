import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditHomepageAssetIntegrity } from '../scripts/homepage-image-asset-integrity.mjs';
import { HOMEPAGE_INDUSTRY_IMAGES, getHomepageImage } from '../src/data/homeIndustryImages.js';
import { compiledLocalStockCatalog } from '../src/components/template-studio/localStockData.js';
import { STOCK_INDUSTRIES } from '../base44/shared/stockIndustries.js';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const text = relative => readFileSync(resolve(root,relative),'utf8');

test('all 20 homepage photographs are present, valid and SHA-256 identical to source provenance', () => {
  const result = auditHomepageAssetIntegrity();
  assert.equal(result.status,'TECHNICAL_ASSETS_PASS_SEMANTIC_REVIEW_PENDING',JSON.stringify(result.issues));
  assert.equal(result.verified_assets,20);
  assert.equal(result.issues.length,0);
  assert.equal(new Set(HOMEPAGE_INDUSTRY_IMAGES.map(x=>x.image_url)).size,20);
  assert.ok(HOMEPAGE_INDUSTRY_IMAGES.every(x=>x.semantic_status==='PENDING_INDEPENDENT_REVIEW'));
});

test('stock generator produces 200 preview-only concepts with locally hosted category images', () => {
  const items = compiledLocalStockCatalog();
  assert.equal(items.length,200);
  assert.equal(STOCK_INDUSTRIES.length,20);
  for (const item of items) {
    assert.match(item.preview_image_url,/^\/images\/(industries|home-industries)\/[a-z0-9_-]+\.jpg$/);
    assert.ok(item.content.includes(item.preview_image_url),'missing compiled photo '+item.name);
    assert.ok(item.content.includes('noindex,nofollow'));
    assert.equal(item.preview_only,true);
  }
});

test('stock alias categories have one fixed image rather than a remote fallback', () => {
  assert.equal(getHomepageImage('epoxy_flooring')?.id,'epoxy');
  assert.equal(getHomepageImage('cleaning_services')?.id,'cleaning');
  assert.equal(getHomepageImage('electrician')?.id,'electrical');
  assert.equal(getHomepageImage('unknown-category'),null);
});

test('homepage card, gallery filters and floating hero mockups contain local image URLs', () => {
  const hero=text('src/components/launch-engine/cinematicHero.css');
  const showcase=text('src/components/launch-engine/TemplatesShowcase.jsx');
  for (const url of [
    '/images/home-industries/real_estate.jpg',
    '/images/industries/roof_repair.jpg',
    '/images/industries/landscaping.jpg',
    '/images/industries/personal_injury.jpg',
    '/images/home-industries/med_spa.jpg',
  ]) assert.ok(hero.includes(url)||showcase.includes(url),'missing local photo '+url);
  assert.doesNotMatch(hero,/images\.unsplash\.com|media\.base44\.com/);
  assert.doesNotMatch(showcase,/images\.unsplash\.com|media\.base44\.com/);
});

test('self-certified category approval remains forbidden', () => {
  const approved=JSON.parse(text('docs/quality/approved-homepage-image-evidence.json'));
  assert.ok(Array.isArray(approved.approvals));
  assert.equal(approved.approvals.length,0);
});
