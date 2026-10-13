import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ArrowRight } from 'lucide-react';
import useStockTemplates from '@/components/template-studio/useStockTemplates';
import StockTemplateCard from '@/components/template-studio/StockTemplateCard';
import StockPreviewDialog from '@/components/template-studio/StockPreviewDialog';

const CATEGORIES = [
  { id: 'all', label: 'All Styles', image: 'https://images.unsplash.com/photo-1467232004584-a551f7af35c3?w=400&q=80' },
  { id: 'contractor', label: 'Contractor', niches: ['epoxy', 'roofing', 'hvac', 'plumbing', 'electrical', 'remodeling', 'landscaping', 'garage'], image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80' },
  { id: 'health', label: 'Health & Wellness', niches: ['med_spa', 'dental', 'chiropractic', 'medical', 'wellness'], image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&q=80' },
  { id: 'legal', label: 'Legal', niches: ['legal', 'attorney', 'law'], image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&q=80' },
  { id: 'professional', label: 'Professional', niches: ['insurance', 'mortgage', 'accounting', 'consulting', 'financial'], image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b67?w=400&q=80' },
  { id: 'realestate', label: 'Real Estate', niches: ['real_estate', 'property', 'realtor'], image: 'https://images.unsplash.com/photo-1564013799919-ab6000f00a91?w=400&q=80' },
  { id: 'home', label: 'Home Services', niches: ['cleaning', 'pest_control', 'moving', 'painting'], image: 'https://images.unsplash.com/photo-1521799267631-32f99f4c9746?w=400&q=80' },
  { id: 'automotive', label: 'Automotive', niches: ['auto_detailing', 'auto_repair', 'towing'], image: 'https://images.unsplash.com/photo-1486001178350-2a3ff6b37e2c?w=400&q=80' },
];

export default function TemplatesShowcase({ onChoose, workspace = false }) {
  const [preview, setPreview] = useState(null);
  const [category, setCategory] = useState('all');
  const { items, isLoading, error } = useStockTemplates({ is_default: true }, 12);

  const filtered = useMemo(() => {
    if (category === 'all') return items;
    const cat = CATEGORIES.find(c => c.id === category);
    if (!cat) return items;
    return items.filter(t => {
      const niche = (t.niche || '').toLowerCase();
      return cat.niches.some(n => niche.includes(n.replace('_', '')));
    });
  }, [items, category]);

  return (
    <section id="templates" className={workspace ? 'rounded-2xl border border-border bg-card p-5 sm:p-6' : 'bg-muted py-16 md:py-24 text-foreground'}>
      <div className={workspace ? 'w-full' : 'mx-auto max-w-7xl px-4 md:px-8'}>
        <div className="mb-8 text-center">
          <h2 className="font-heading text-3xl font-extrabold">Explore Real Templates</h2>
          <p className="mt-3 text-muted-foreground">The same 200 stock designs available in the studio. Filter by industry category to find your match.</p>
          <Link to={workspace ? '/admin/template-studio' : '/templates'} className="mt-4 inline-block font-bold underline">View all templates →</Link>
        </div>

        {/* Category Tabs with Images */}
        <div className="mb-8 flex flex-wrap justify-center gap-3">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${category === cat.id ? 'border-green-400 shadow-[0_0_16px_-2px_rgba(34,197,94,0.5)]' : 'border-gray-200 hover:border-green-400/50'}`}
            >
              <div className="h-16 w-24 sm:h-20 sm:w-32 overflow-hidden">
                <img src={cat.image} alt={cat.label} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-1.5 text-center">
                <span className="text-[10px] sm:text-xs font-bold text-white">{cat.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Template Cards with Industry Links */}
        {isLoading && <Loader2 className="mx-auto h-6 w-6 animate-spin" aria-label="Loading templates" />}
        {error && <p role="alert" className="text-destructive">Unable to load templates: {error.message}</p>}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(template => (
            <div key={template.id} className="space-y-2">
              <StockTemplateCard template={template} onSelect={setPreview} />
              <Link
                to={`/templates?industry=${encodeURIComponent(template.niche || '')}`}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-[#0a1220] hover:border-green-400 hover:text-green-600 transition-all duration-300 hover:shadow-[0_0_12px_-2px_rgba(34,197,94,0.4)]"
              >
                <span>View {template.niche || 'Industry'} Version</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
        {filtered.length === 0 && !isLoading && (
          <p className="text-center text-sm text-muted-foreground py-8">No templates in this category yet — check back soon.</p>
        )}
      </div>
      <StockPreviewDialog template={preview} onClose={() => setPreview(null)} onChoose={onChoose} />
    </section>
  );
}