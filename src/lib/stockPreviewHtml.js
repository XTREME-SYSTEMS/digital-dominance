import { getBuiltinStockTemplateById } from '@/lib/stockCatalogFallback';
import { base44 } from '@/api/base44Client';

/**
 * Every stock template record carries its own compiled page (`content`), so the
 * card can render THAT template instead of the shared industry photograph.
 * Records that were stored without content are loaded on demand.
 */
export function templateImageFallback(template) {
  return template?.preview_image_url || null;
}

export async function fetchTemplateHtml(template) {
  if (!template) return null;
  if (template.content) return template.content;
  const builtin = getBuiltinStockTemplateById(typeof template === 'string' ? template : template.id)
    || getBuiltinStockTemplateById(template.slug);
  if (builtin?.content) return builtin.content;
  if (template.id) {
    try {
      const record = await base44.entities.TemplateLibrary.get(template.id);
      return record?.content || null;
    } catch (error) {
      console.warn('Template page load failed:', error.message);
      return null;
    }
  }
  return null;
}