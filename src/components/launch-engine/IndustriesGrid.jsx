import React, { useMemo } from 'react';
import { ArrowUpRight } from 'lucide-react';
import useStockTemplates from '@/components/template-studio/useStockTemplates';
import SafeImage from '@/components/ui/SafeImage';
import { HOMEPAGE_INDUSTRY_IMAGES } from '@/data/homeIndustryImages';

// Canonical 20-industry visual directory sourced from the versioned registry.
// These are browse categories, not claims of live templates.
// Image URLs come from homeIndustryImages.js — the single source of truth.
// SafeImage must NOT substitute unrelated fallbacks for these categories.

const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export default function IndustriesGrid({ onSelect, workspace = false }) {
  const { items: stockIndustries, error } = useStockTemplates({ is_default: true }, 20);

  const industries = useMemo(() => HOMEPAGE_INDUSTRY_IMAGES.map((cat) => {
    const stock = stockIndustries.find(item => normalize(item.niche) === normalize(cat.niche) || normalize(item.niche) === normalize(cat.label));
    return {
      id: stock?.id || cat.id,
      label: cat.label,
      niche: stock?.niche || cat.niche,
      image: cat.image_url,
      alt_text: cat.alt_text,
      verifiedTemplate: Boolean(stock?.id),
    };
  }), [stockIndustries]);

  return (
    <section id="industries" className={workspace ? 'rounded-2xl border border-border bg-card p-5 sm:p-6' : 'bg-white py-12 md:py-16'}>
      <div className={workspace ? 'w-full' : 'mx-auto max-w-[1480px] px-4 md:px-10'}>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[.20em] text-[#0877ea]">OUR SOLUTIONS</p>
            <h2 className="font-heading text-3xl font-black tracking-[-.04em] text-[#091a31] md:text-5xl">Top 20 Industries</h2>
            <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">Premium website concepts for the businesses that power the economy. Select an industry to explore its designs.</p>
          </div>
          <a href="#templates" className="inline-flex min-h-11 items-center gap-2 border-b-2 border-[#008bff] font-bold text-[#035fbe] hover:text-[#003d92]">
            Explore Templates <ArrowUpRight className="h-5 w-5" />
          </a>
        </div>
        {error && <p className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="status">Live template availability could not be checked. Industry imagery remains browsable, and the studio will confirm available designs.</p>}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {industries.map(ind => (
            <button
              key={ind.id}
              type="button"
              onClick={() => onSelect?.(ind.niche)}
              aria-label={`Explore ${ind.label} website designs`}
              className="group relative aspect-[5/3] min-h-[100px] sm:min-h-[120px] min-w-0 w-full overflow-hidden rounded-xl border border-slate-200 bg-[#061932] text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#20b8ff] hover:shadow-[0_12px_24px_rgba(3,80,160,.20)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#3dc7ff]"
            >
              <SafeImage src={ind.image} alt={ind.alt_text || `${ind.label} industry concept photography`} niche={ind.niche} failClosed className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              <span className="absolute inset-0 bg-gradient-to-t from-[#00152a]/95 via-[#001c38]/10 to-transparent" aria-hidden="true" />
              <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-3 text-white">
                <span className="min-w-0 break-words text-[15px] font-extrabold leading-tight md:text-[17px]">{ind.label}</span>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/65 bg-[#071e3d]/45 text-white group-hover:bg-[#0877ea]" aria-hidden="true"><ArrowUpRight className="h-4 w-4" /></span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}