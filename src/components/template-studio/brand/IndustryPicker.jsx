import React from 'react';
import { Check } from 'lucide-react';
import SafeImage from '@/components/ui/SafeImage';
import { HOMEPAGE_INDUSTRY_IMAGES } from '@/data/homeIndustryImages';

// The 20 most popular service industries, each mapped to the stock catalogue
// niche so the studio can filter designs and discovery by the same key.
export default function IndustryPicker({ value, onSelect }) {
  return (
    <div className="grid max-h-80 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4 lg:grid-cols-5">
      {HOMEPAGE_INDUSTRY_IMAGES.map((ind) => {
        const active = value === ind.niche;
        return (
          <button
            key={ind.id}
            onClick={() => onSelect(ind.niche, ind.label)}
            className={`group flex flex-col items-center gap-2 rounded-xl border p-2 text-center transition ${
              active ? 'border-[#00a2ff] bg-[#00a2ff]/5 ring-2 ring-[#00a2ff]/25' : 'border-border hover:border-[#00a2ff]/50'
            }`}
          >
            <div className="relative h-16 w-full overflow-hidden rounded-lg bg-muted">
              <SafeImage src={ind.image_url} alt={ind.alt_text} className="h-full w-full object-cover transition group-hover:scale-105" />
              {active && (
                <span className="absolute right-1 top-1 rounded-full bg-[#00a2ff] p-0.5">
                  <Check className="h-3 w-3 text-white" />
                </span>
              )}
            </div>
            <span className={`text-[11px] font-bold leading-tight ${active ? 'text-[#00a2ff]' : 'text-foreground'}`}>{ind.label}</span>
          </button>
        );
      })}
    </div>
  );
}