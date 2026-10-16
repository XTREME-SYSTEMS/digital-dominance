/**
 * Stock Studio's built-in source-of-truth fallback.
 * All 200 preview concepts come from the SAME checked-in compiler used by
 * stockTemplateFactory. Nothing is invented from generic placeholder cards.
 * Preview HTML is noindex and contains no operational lead destination.
 */
import { STOCK_INDUSTRIES, STOCK_VERSION } from '../../base44/shared/stockIndustries.js';
import { STOCK_DESIGNS } from '../../base44/shared/stockDesigns.js';
import { stockTemplateRecord } from '../../base44/shared/stockTemplateCompiler.js';

export const BUILTIN_STOCK_PREFIX = 'builtin-stock-';
let cache = null;

export function getBuiltinStockTemplates() {
  if (!cache) {
    cache = STOCK_INDUSTRIES.flatMap(industry =>
      STOCK_DESIGNS.map((design, index) => {
        const record = stockTemplateRecord(industry, design, index, STOCK_VERSION);
        return {
          ...record,
          id: BUILTIN_STOCK_PREFIX + record.slug,
          builtin_preview: true,
          preview_only: true
        };
      })
    );
  }
  return cache;
}

export function isBuiltinStockTemplate(template) {
  const id = typeof template === 'string' ? template : template?.id;
  return typeof id === 'string' && id.startsWith(BUILTIN_STOCK_PREFIX);
}

export function getBuiltinStockTemplateById(id) {
  return getBuiltinStockTemplates().find(t => t.id === id || t.slug === id) || null;
}

export function filterBuiltinStockTemplates(query = {}) {
  return getBuiltinStockTemplates().filter(template => {
    if (query.is_active !== undefined && query.is_active !== template.is_active) return false;
    if (query.status && query.status !== template.status) return false;
    if (query.is_default !== undefined && query.is_default !== template.is_default) return false;
    if (query.niche && query.niche !== template.niche) return false;
    if (query.slug && query.slug !== template.slug) return false;
    if (query.sort_order?.$gt !== undefined && !(template.sort_order > query.sort_order.$gt)) return false;
    if (query.tags?.$all && !query.tags.$all.every(tag => template.tags.includes(tag))) return false;
    if (query.name?.$regex) {
      try {
        const rx = new RegExp(query.name.$regex, query.name.$options || 'i');
        if (!rx.test(template.name)) return false;
      } catch {
        return false;
      }
    } else if (typeof query.name === 'string' && query.name !== template.name) return false;
    if (query.$or && Array.isArray(query.$or)) {
      const matches = query.$or.some(cond => filterBuiltinStockTemplates({ ...cond }).some(t => t.id === template.id));
      if (!matches) return false;
    }
    return true;
  });
}

export function getBuiltinStockPage(query = {}, options = {}) {
  const matched = filterBuiltinStockTemplates(query)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  const requested = Number(options.limit || 20);
  const limit = Math.min(100, Math.max(1, Number.isFinite(requested) ? requested : 20));
  const cursor = typeof options.cursor === 'string' && /^builtin:\d+$/.test(options.cursor)
    ? Number(options.cursor.slice('builtin:'.length)) : 0;
  const items = matched.slice(cursor, cursor + limit);
  const end = cursor + items.length;
  return {
    items,
    count: matched.length,
    has_more: end < matched.length,
    next_cursor: end < matched.length ? 'builtin:' + end : null,
    source: 'bundled-stock-preview',
  };
}

/** Only fall back for data unavailable; don't mask authorization denials. */
export function isStockBackendUnavailable(error) {
  const code = error?.status ?? error?.response?.status ?? error?.statusCode;
  if (code === 401 || code === 403) return false;
  if (code === 404 || code === 502 || code === 503 || code === 504) return true;
  return /the page could not be found|404|not found|network error|failed to fetch|network request failed|service unavailable|temporarily unavailable|connection refused/i
    .test(String(error?.message || error || ''));
}
