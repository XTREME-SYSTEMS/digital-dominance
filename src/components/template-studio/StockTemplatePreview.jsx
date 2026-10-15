import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { Loader2 } from 'lucide-react';
import { STOCK_QUERY } from '@/components/template-studio/useStockTemplates';
import { localStockById, localStockForIndustry } from '@/lib/localStockCatalog';

export default function StockTemplatePreview({ template, industry, className = 'h-full w-full', overrideHtml, brand }) {
  const local = template?.content ? template :
    localStockById(typeof template === 'string' ? template : template?.id) ||
    (industry ? localStockForIndustry(industry)[0] : null);
  const shouldFetch = !overrideHtml && !local && Boolean(appParams.appBaseUrl);
  const { data, isLoading, error } = useQuery({
    queryKey: ['stock-preview', template?.id || template || '', industry || ''],
    enabled: shouldFetch, retry: 1,
    queryFn: async () => {
      if (template?.id) return base44.entities.TemplateLibrary.get(template.id);
      const query = { ...STOCK_QUERY, ...(industry ? { niche: industry } : {}) };
      if (typeof template === 'string' && template)
        query.$or = [{ slug: template }, { name: template }];
      else query.is_default = true;
      const page = await base44.entities.TemplateLibrary.filter(query, { limit: 1 });
      return page.items?.[0] || null;
    },
  });
  if (!overrideHtml && isLoading && shouldFetch)
    return <div className="flex h-full min-h-48 items-center justify-center bg-card"><Loader2 className="h-6 w-6 animate-spin" aria-label="Loading template" /></div>;
  const resolved = local || data;
  if (error && !resolved) return <p role="alert" className="p-6 text-destructive">Unable to load this template: {error.message}</p>;
  const source = overrideHtml || resolved?.content;
  if (!source) return <p className="p-6 text-muted-foreground">No website preview available for this design.</p>;
  const html = /^#[0-9a-f]{6}$/i.test(brand?.accent || '')
    ? source.replace(/--accent:#[0-9a-f]{3,6};/i, '--accent:' + brand.accent + ';')
    : source;
  return <iframe title={resolved?.name || 'Original website template preview'} className={className}
    srcDoc={html} sandbox="" referrerPolicy="no-referrer" loading="eager" />;
}