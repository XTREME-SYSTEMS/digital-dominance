import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { hasRuntimeBase44AppId } from '@/lib/base44Binding';
import { Loader2 } from 'lucide-react';
import { STOCK_QUERY } from '@/components/template-studio/useStockTemplates';
import { findPreviewTemplate } from './previewSource.js';

/** Render existing source HTML directly before considering an API request. */
export default function StockTemplatePreview({ template, industry, className = 'h-full w-full', overrideHtml, brand }) {
  const local = findPreviewTemplate(template, industry);
  const inlineHtml = overrideHtml || local?.content;
  const shouldFetch = !inlineHtml && hasRuntimeBase44AppId && Boolean(template || industry);
  const { data, isLoading, error } = useQuery({
    queryKey: ['stock-preview', template?.id || template || '', industry || ''],
    enabled: shouldFetch,
    queryFn: async () => {
      if (template?.id) return base44.entities.TemplateLibrary.get(template.id);
      const query = { ...STOCK_QUERY, ...(industry ? { niche: industry } : {}) };
      if (typeof template === 'string' && template) {
        query.$or = [
          { slug: template },
          { name: template },
          { name: { $regex: template.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
        ];
      } else query.is_default = true;
      const page = await base44.entities.TemplateLibrary.filter(query, { limit: 1 });
      return page.items[0] || null;
    },
  });

  const source = inlineHtml || data?.content;
  if (!source && isLoading) {
    return <div className="flex h-full min-h-48 items-center justify-center bg-card">
      <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading website preview" />
    </div>;
  }
  if (!source && (error || !hasRuntimeBase44AppId)) {
    return <p role="alert" className="p-6 text-muted-foreground">
      This design isn't available to preview right now. Please choose another design.
    </p>;
  }
  if (!source) {
    return <p className="p-6 text-muted-foreground">No matching design. Choose a website from the gallery.</p>;
  }

  let html = source;
  if (brand?.colorScheme?.accent && /^#[0-9a-f]{6}$/i.test(brand.colorScheme.accent)) {
    html = html.replace(/--accent:#[0-9a-f]{3,6};/gi, `--accent:${brand.colorScheme.accent};`);
    if (/^#[0-9a-f]{6}$/i.test(brand.colorScheme.accentLight || '')) {
      html = html.replace(/--accent-light:#[0-9a-f]{3,6};/gi, `--accent-light:${brand.colorScheme.accentLight};`);
    }
  } else if (brand?.accent && /^#[0-9a-f]{6}$/i.test(brand.accent)) {
    html = html.replace(/--accent:#[0-9a-f]{3,6};/gi, `--accent:${brand.accent};`);
  }
  if (brand?.businessName) {
    const safeName = String(brand.businessName).replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[ch]));
    html = html.replace(/<h1[^>]*>.*?<\/h1>/i, `<h1>${safeName}</h1>`);
  }
  if (typeof brand?.logo?.url === 'string' && /^https:\/\//i.test(brand.logo.url)) {
    const safeLogo = brand.logo.url.replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[ch]));
    html = html.replace(/<img[^>]*class="[^"]*logo[^"]*"[^>]*>/i,
      `<img src="${safeLogo}" alt="Business logo" style="max-height:48px;object-fit:contain" />`);
  }

  return <iframe
    title={local?.name || data?.name || 'Full website design preview'}
    className={className}
    srcDoc={html}
    sandbox=""
    referrerPolicy="no-referrer"
  />;
}
