import { compiledLocalStockCatalog } from './localStockData.js';

const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** Prefer the exact HTML already selected; never refetch it unnecessarily. */
export function findPreviewTemplate(template, industry = '') {
  if (template && typeof template === 'object' &&
      typeof template.content === 'string' && template.content.trim()) return template;

  const catalog = compiledLocalStockCatalog();
  if (template && typeof template === 'object' && template.id) {
    return catalog.find(item => item.id === template.id || item.slug === template.slug) || null;
  }
  if (typeof template === 'string' && template.trim()) {
    return catalog.find(item =>
      normalize(item.slug) === normalize(template) || normalize(item.name) === normalize(template)) || null;
  }
  if (industry) {
    return catalog.find(item => normalize(item.niche) === normalize(industry) && item.is_default) ||
      catalog.find(item => normalize(item.niche) === normalize(industry)) || null;
  }
  return null;
}
