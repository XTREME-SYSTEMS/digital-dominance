import React from 'react';
import { ArrowRight } from 'lucide-react';
import StockDesignThumbnail from './StockDesignThumbnail';

export default function StockTemplateCard({ template, onSelect }) {
  const number = Number.isInteger(template.sort_order) ? template.sort_order + 1 : null;
  return (
    <button type="button" onClick={() => onSelect(template)}
      className="group w-full overflow-hidden rounded-xl border border-border bg-card text-left text-card-foreground shadow-sm transition hover:border-sky-400 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <StockDesignThumbnail template={template} />
      <div className="p-4">
        <p className="text-xs font-bold text-muted-foreground">{template.niche} · Website design</p>
        <h3 className="my-2 font-heading text-base font-bold">
          {number ? `Design ${number}` : 'View design'}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {template.name.split(' / ')[1] || ''}
          </span>
        </h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{template.description}</p>
        <span className="mt-4 flex items-center gap-2 text-sm font-bold">
          See the full website <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </button>
  );
}
