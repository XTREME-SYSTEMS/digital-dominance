import { STOCK_INDUSTRIES, STOCK_VERSION } from '../../../base44/shared/stockIndustries.js';
import { STOCK_DESIGNS } from '../../../base44/shared/stockDesigns.js';
import { stockTemplateRecord } from '../../../base44/shared/stockTemplateCompiler.js';
import { getHomepageImage } from '../../data/homeIndustryImages.js';

let cache;
export function compiledLocalStockCatalog() {
  if (!cache) {
    cache = STOCK_INDUSTRIES.flatMap(industry => {
      const reference = getHomepageImage(industry.key);
      if (!reference?.image_url?.startsWith('/images/'))
        throw new Error('Missing local image for stock industry: ' + industry.key);
      const previewIndustry = { ...industry, image: reference.image_url };
      return STOCK_DESIGNS.map((design, index) => ({
        ...stockTemplateRecord(previewIndustry, design, index, STOCK_VERSION),
        id: 'source-' + industry.key + '-' + design.key,
        preview_only: true,
        catalog_source: 'canonical_public_stock_compiler',
        source_version: STOCK_VERSION,
      }));
    });
  }
  return cache;
}

const norm = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export function filterLocalStock(query = {}) {
  return compiledLocalStockCatalog().filter(item => {
    if (query.is_default !== undefined && item.is_default !== query.is_default) return false;
    if (query.is_active !== undefined && item.is_active !== query.is_active) return false;
    if (query.status !== undefined && item.status !== query.status) return false;
    if (query.niche && norm(query.niche) !== norm(item.niche) &&
        norm(query.niche) !== norm(item.sections?.[0]?.config?.industry_key)) return false;
    if (query.tags?.$all?.some(tag => !item.tags.includes(tag))) return false;
    if (query.name?.$regex) {
      // The stock UI uses an escaped substring. No user-provided regular expression is executed.
      const search = String(query.name.$regex).replace(/\\(.)/g, '$1').toLowerCase();
      if (!item.name.toLowerCase().includes(search)) return false;
    }
    return true;
  });
}

export function getLocalStockPage(query = {}, limit = 20, cursor = null) {
  const matches = filterLocalStock(query);
  const start = cursor === null ? 0 : Number(cursor);
  if (!Number.isSafeInteger(start) || start < 0 || start > matches.length) {
    throw new Error('INVALID_STOCK_CURSOR');
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 200) {
    throw new Error('INVALID_STOCK_PAGE_SIZE');
  }
  const items = matches.slice(start, start + limit);
  const next = start + items.length;
  return { items, has_more: next < matches.length, next_cursor: next < matches.length ? String(next) : null };
}
