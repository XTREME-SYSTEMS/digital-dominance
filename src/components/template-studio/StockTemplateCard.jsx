import React from 'react';
import SafeImage from '@/components/ui/SafeImage';
import { ArrowRight } from 'lucide-react';

export default function StockTemplateCard({ template, onSelect }) {
  const category = template.category || template.niche || 'default';
  return (
    <button type="button" onClick={() => onSelect(template)} className="group overflow-hidden rounded-xl border border-border bg-card text-left text-card-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <SafeImage
        src={template.preview_image_url}
        alt={`${template.name}, imagery used in this exact template`}
        category={category}
        niche={template.niche}
        className="block aspect-[4/3] w-full"
      />
      <div className="p-4">
        <p className="text-xs font-bold text-muted-foreground">{template.niche || template.category} · Original design</p>
        <h3 className="my-2 font-heading text-base font-bold">{template.name.split(' / ')[1] || template.name}</h3>
        <p className="text-sm text-muted-foreground">{template.description}</p>
        <span className="mt-4 flex items-center gap-2 text-sm font-bold">Preview this template <ArrowRight className="h-4 w-4" /></span>
      </div>
    </button>
  );
}