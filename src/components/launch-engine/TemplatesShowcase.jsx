import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink } from 'lucide-react';
import useStockTemplates from '@/components/template-studio/useStockTemplates';
import StockPreviewDialog from '@/components/template-studio/StockPreviewDialog';
import SafeImage from '@/components/ui/SafeImage';

const FILTERS = [
  ['All Designs', 'all'],
  ['Legal', 'legal'],
  ['Real Estate', 'real_estate'],
  ['Roofing', 'roofing'],
  ['Med Spa', 'med_spa'],
  ['HVAC', 'hvac'],
  ['Dental', 'dental'],
];

const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export default function TemplatesShowcase({ onChoose, workspace = false }) {
  const [preview, setPreview] = useState(null);
  const [selected, setSelected] = useState('all');
  const { items, isLoading, error } = useStockTemplates({}, 24);

  const featured = useMemo(() => {
    const matched = selected === 'all' ? items : items.filter(template => normalize(template.niche).includes(normalize(selected)));
    if (selected !== 'all') return matched.slice(0, 6);
    const unique = [];
    const seen = new Set();
    for (const template of matched) {
      const niche = normalize(template.niche || template.category || template.name);
      if (!seen.has(niche)) {
        unique.push(template);
        seen.add(niche);
      }
      if (unique.length === 6) break;
    }
    return unique;
  }, [items, selected]);

  return (
    <section id="templates" className={workspace ? 'rounded-2xl border border-border bg-card p-5 sm:p-6' : 'bg-[#041a34] py-14 text-white md:py-20'}>
      <div className={workspace ? 'w-full' : 'mx-auto max-w-[1480px] px-4 md:px-10'}>
        <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[.20em] text-[#55ceff]">WEBSITE TEMPLATES</p>
            <h2 className={workspace ? 'font-heading text-3xl font-extrabold' : 'font-heading text-3xl font-black tracking-[-.04em] md:text-5xl'}>Explore Real Templates</h2>
            <p className={workspace ? 'mt-2 text-muted-foreground' : 'mt-2 max-w-3xl text-base text-slate-200/85 md:text-lg'}>
              Preview full-page website concepts, then choose the exact design you want to customize.
            </p>
          </div>
          <Link to={workspace ? '/admin/template-studio' : '/templates'} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#2c9eff] px-5 font-bold text-[#f0f8ff] transition hover:bg-[#0877ea]">
            View All Templates <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mb-7 flex flex-wrap gap-2" aria-label="Filter website templates by industry">
          {FILTERS.map(([label, key]) => (
            <button key={key} type="button" aria-pressed={selected === key} onClick={() => setSelected(key)}
              className={`min-h-11 rounded-full border px-4 text-sm font-bold transition ${selected === key ? 'border-[#50c8ff] bg-[#0877ea] text-white' : 'border-white/20 bg-white/5 text-slate-200 hover:border-[#50c8ff] hover:bg-white/10'}`}>
              {label}
            </button>
          ))}
        </div>

        {isLoading && <p role="status" className="mb-4 text-sm text-[#b5eaff]">Loading verified template previews…</p>}
        {error && <p role="alert" className="mb-5 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">Template previews are temporarily unavailable. The complete catalog can still be opened from the button above.</p>}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map(template => (
            <button key={template.id} type="button" onClick={() => setPreview(template)}
              className="group overflow-hidden rounded-xl border border-[#7ed4ff]/25 bg-[#0b2b50] text-left shadow-[0_20px_40px_rgba(0,0,0,.20)] transition duration-200 hover:-translate-y-1 hover:border-[#6ecfff] hover:shadow-[0_22px_45px_rgba(0,145,255,.26)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6cd3ff]">
              <div className="flex h-7 items-center justify-between border-b border-white/10 bg-[#061429] px-3 text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-300">
                <span aria-hidden="true" className="text-[#66ceff]">● ● ●</span>
                <span>{template.niche || template.category || 'Website'}</span>
              </div>
              <div className="relative aspect-[16/10] overflow-hidden bg-[#15375e]">
                <SafeImage src={template.preview_image_url} niche={template.niche} category={template.category}
                  alt={`${template.name} website template preview`} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#001024]/75 via-transparent to-transparent" aria-hidden="true" />
                <span className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg border border-white/70 bg-[#0479ec]/90 px-3 py-2 text-xs font-bold text-white">
                  View Full Preview <ExternalLink className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="px-4 py-4">
                <h3 className="line-clamp-1 text-lg font-extrabold tracking-tight text-white">{template.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-300">{template.description || 'Explore the layout and sections in a full-page preview.'}</p>
              </div>
            </button>
          ))}
        </div>

        {!isLoading && !error && !featured.length && (
          <div className="rounded-xl border border-dashed border-white/25 bg-white/[.04] px-5 py-10 text-center">
            <p className="text-lg font-semibold text-white">No verified templates in this selection yet.</p>
            <p className="mt-2 text-sm text-slate-300">Browse the full catalog or contact us about this industry.</p>
            <Link to="/templates" className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-[#0877ea] px-5 font-bold text-white">Open Template Catalog</Link>
          </div>
        )}
      </div>
      <StockPreviewDialog template={preview} onClose={() => setPreview(null)} onChoose={onChoose} />
    </section>
  );
}
