import React from 'react';
import SafeImage from '@/components/ui/SafeImage';
import { ArrowRight } from 'lucide-react';
export default function StockTemplateCard({ template, onSelect }) {
  const category = (template.niche || 'default').includes('epoxy') ? 'contractor'
    : (template.niche || '').includes('med') ? 'health'
    : (template.niche || '').includes('legal') ? 'legal'
    : (template.niche || '').includes('real') ? 'realestate'
    : (template.niche || '').includes('auto') ? 'automotive' : 'default';
  return <button type="button" onClick={() => onSelect(template)}
    className="group overflow-hidden rounded-xl border border-border bg-card text-left text-card-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
    <div className="relative aspect-[4/3] overflow-hidden bg-[#e2e8ef]">
      {template.is_local_preview && template.content
        ? <iframe title={template.name + ' original live-rendered design thumbnail'} srcDoc={template.content}
            sandbox="" tabIndex={-1} aria-hidden="true" loading="lazy"
            className="pointer-events-none absolute inset-0 h-full w-full border-0" />
        : <SafeImage src={template.preview_image_url} alt={template.name + ' website preview'}
            category={category} className="block h-full w-full object-cover" />}
      <span className="pointer-events-none absolute bottom-3 right-3 rounded-lg bg-[#075a9a] px-3 py-1.5 text-xs font-bold text-white shadow-lg">Open full-page preview</span>
    </div>
    <div className="p-4">
      <p className="text-xs font-bold text-muted-foreground">{template.niche_label || template.niche} · {template.is_local_preview ? 'Original preview concept' : 'Original design'}</p>
      <h3 className="my-2 font-heading text-base font-bold">{template.name.split(' / ')[1] || template.name}</h3>
      <p className="text-sm text-muted-foreground">{template.description}</p>
      <span className="mt-4 flex items-center gap-2 text-sm font-bold">Explore this full website <ArrowRight className="h-4 w-4" /></span>
    </div>
  </button>;
}