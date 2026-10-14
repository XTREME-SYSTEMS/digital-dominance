import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink } from 'lucide-react';
import useStockTemplates from '@/components/template-studio/useStockTemplates';
import StockPreviewDialog from '@/components/template-studio/StockPreviewDialog';
import SafeImage from '@/components/ui/SafeImage';

// Preserve the industry-image filters added on main while restoring premium full-page previews.
const CATEGORIES = [
  { id: 'all', label: 'All Styles', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80' },
  { id: 'contractor', label: 'Contractor', niches: ['epoxy','roofing','hvac','plumbing','electrical','remodeling','landscaping','garage'], image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80' },
  { id: 'health', label: 'Health & Wellness', niches: ['med_spa','dental','chiropractic','medical','wellness'], image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&q=80' },
  { id: 'legal', label: 'Legal', niches: ['legal','attorney','law'], image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&q=80' },
  { id: 'professional', label: 'Professional', niches: ['insurance','mortgage','accounting','consulting','financial'], image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3a?w=400&q=80' },
  { id: 'realestate', label: 'Real Estate', niches: ['real_estate','property','realtor'], image: 'https://images.unsplash.com/photo-1568605114987-395e3a5eb4c5?w=400&q=80' },
  { id: 'home', label: 'Home Services', niches: ['cleaning','pest_control','moving','painting'], image: 'https://images.unsplash.com/photo-1581578731548-c64695cccae9?w=400&q=80' },
  { id: 'automotive', label: 'Automotive', niches: ['auto_detailing','auto_repair','towing'], image: 'https://images.unsplash.com/photo-1492144534155-93156a5f2de7?w=400&q=80' },
];

const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const matchesCategory = (template, category) =>
  category.id === 'all' || (category.niches || []).some(niche => normalize(template.niche).includes(normalize(niche)));

export default function TemplatesShowcase({ onChoose, workspace = false }) {
  const [preview, setPreview] = useState(null);
  const [category, setCategory] = useState('all');
  // Latest main's is_default guard keeps this homepage an intentionally curated selection.
  const { items, isLoading, error } = useStockTemplates({ is_default: true }, 20);

  const featured = useMemo(() => {
    const selected = CATEGORIES.find(item => item.id === category) || CATEGORIES[0];
    const filtered = items.filter(template => matchesCategory(template, selected));
    if (category !== 'all') return filtered.slice(0, 6);
    const seen = new Set();
    const unique = [];
    for (const template of filtered) {
      const niche = normalize(template.niche || template.name);
      if (!seen.has(niche)) {
        seen.add(niche);
        unique.push(template);
      }
      if (unique.length === 6) break;
    }
    return unique;
  }, [items, category]);

  return (
    <section id="templates" className={workspace ? 'rounded-2xl border border-border bg-card p-5 sm:p-6' : 'bg-[#041a34] py-14 text-white md:py-20'}>
      <div className={workspace ? 'w-full' : 'mx-auto max-w-[1480px] px-4 md:px-10'}>
        <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[.20em] text-[#55ceff]">WEBSITE TEMPLATES</p>
            <h2 className="font-heading text-3xl font-black tracking-[-.04em] md:text-5xl">Explore Real Templates</h2>
            <p className={workspace ? 'mt-2 text-muted-foreground' : 'mt-2 max-w-3xl text-base text-slate-200/85 md:text-lg'}>
              Preview full-page website concepts, then choose the exact design you want to customize.
            </p>
          </div>
          <Link to={workspace ? '/admin/template-studio' : '/templates'} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#2c9eff] px-5 font-bold text-[#f0f8ff] transition hover:bg-[#0877ea]">
            View All Templates <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mb-8 flex flex-wrap gap-3" aria-label="Filter website templates by industry">
          {CATEGORIES.map(item => (
            <button key={item.id} type="button" aria-pressed={category === item.id}
              onClick={() => setCategory(item.id)}
              className={`group relative min-h-20 w-28 overflow-hidden rounded-xl border-2 text-left transition duration-200 hover:-translate-y-0.5 sm:w-36 ${category === item.id ? 'border-[#57cfff] shadow-[0_0_18px_rgba(20,156,255,.50)]' : 'border-[#93caed]/20 hover:border-[#57cfff]'}`}>
              <SafeImage src={item.image} alt={`${item.label} template category`} category={item.id}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#00152c] via-[#00152c]/25 to-transparent" />
              <span className="absolute bottom-0 left-0 right-0 p-2 text-center text-[11px] font-extrabold leading-tight text-white sm:text-xs">{item.label}</span>
            </button>
          ))}
        </div>

        {isLoading && <p role="status" className="mb-4 text-sm text-[#b5eaff]">Loading template previews…</p>}
        {error && <p role="alert" className="mb-5 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">Template previews are temporarily unavailable. Open the full catalog to try again.</p>}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map(template => (
            <button key={template.id} type="button" onClick={() => setPreview(template)}
              className="group overflow-hidden rounded-xl border border-[#7ed4ff]/25 bg-[#0b2b50] text-left shadow-[0_20px_40px_rgba(0,0,0,.20)] transition duration-200 hover:-translate-y-1 hover:border-[#6ecfff] hover:shadow-[0_22px_45px_rgba(0,145,255,.26)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6cd3ff]">
              <div className="flex h-7 items-center justify-between border-b border-white/10 bg-[#061429] px-3 text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-300">
                <span aria-hidden="true" className="text-[#66ceff]">● ● ●</span><span>{template.niche || 'Website'}</span>
              </div>
              <div className="relative aspect-[16/10] overflow-hidden bg-[#15375e]">
                <SafeImage src={template.preview_image_url} alt={`${template.name} website template preview`}
                  category={category === 'all' ? 'default' : category}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]" />
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
