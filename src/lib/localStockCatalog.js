// Deterministic, preview-only fallback from the existing Universal/Stock Template Factory.
// No invented deployments, customer businesses, or public publication.
import { STOCK_INDUSTRIES, STOCK_VERSION } from '../../base44/shared/stockIndustries.js';
import { STOCK_DESIGNS } from '../../base44/shared/stockDesigns.js';
import { stockTemplateRecord } from '../../base44/shared/stockTemplateCompiler.js';
import { HOME_INDUSTRY_IMAGES } from '@/data/homeIndustryImages';

const KEY_ALIASES = { epoxy_flooring: 'epoxy', cleaning_services: 'cleaning' };
const toKey = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const normalizeNiche = value => toKey(KEY_ALIASES[value] || value);
export const LOCAL_STOCK_CATALOG = STOCK_INDUSTRIES.flatMap(industry => {
  const niche = KEY_ALIASES[industry.key] || industry.key;
  const image = HOME_INDUSTRY_IMAGES[niche];
  if (!image) throw new Error('Missing approved-source category asset for ' + industry.key);
  return STOCK_DESIGNS.map((design, index) => {
    const record = stockTemplateRecord({ ...industry, image }, design, index, STOCK_VERSION);
    return {
      ...record,
      id: 'local-' + record.slug,
      niche,
      niche_label: industry.label,
      is_local_preview: true,
      is_live: false,
      preview_image_url: image,
      source_name: 'Existing Stock Template Compiler',
    };
  });
});
export const LOCAL_STOCK_COUNT = LOCAL_STOCK_CATALOG.length;
export function localStockById(id) {
  if (!id) return null;
  return LOCAL_STOCK_CATALOG.find(item => item.id === id || item.slug === id) || null;
}
export function localStockForIndustry(industry) {
  const key = normalizeNiche(industry);
  return LOCAL_STOCK_CATALOG.filter(item =>
    normalizeNiche(item.niche) === key || normalizeNiche(item.niche_label) === key);
}
export function filterLocalStock(query = {}) {
  const name = query.name;
  const pattern = name?.$regex ? (() => {
    try { return new RegExp(name.$regex, name.$options || 'i'); } catch { return null; }
  })() : null;
  return LOCAL_STOCK_CATALOG.filter(item => {
    if (query.is_active !== undefined && Boolean(query.is_active) !== item.is_active) return false;
    if (query.status && query.status !== item.status) return false;
    if (query.is_default !== undefined && Boolean(query.is_default) !== item.is_default) return false;
    if (query.niche && normalizeNiche(query.niche) !== normalizeNiche(item.niche)
      && normalizeNiche(query.niche) !== normalizeNiche(item.niche_label)) return false;
    if (query.tags?.$all && !query.tags.$all.every(tag => item.tags.includes(tag))) return false;
    if (typeof name === 'string' && !item.name.toLowerCase().includes(name.toLowerCase())) return false;
    if (pattern && !pattern.test(item.name)) return false;
    return true;
  });
}