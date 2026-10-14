import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ArrowRight, ChevronRight } from 'lucide-react';
import useStockTemplates from '@/components/template-studio/useStockTemplates';
import StockTemplateCard from '@/components/template-studio/StockTemplateCard';
import StockPreviewDialog from '@/components/template-studio/StockPreviewDialog';
import { UNIVERSAL_CATEGORIES, CATEGORY_GROUPS } from '@/data/universalTemplateCategories';

export default function TemplatesShowcase({ onChoose, workspace = false }) {
  const [preview, setPreview] = useState(null);
  const [category, setCategory] = useState('all');
  const { items, isLoading, error } = useStockTemplates({ is_active: true }, 12);

  const filtered = useMemo(() => {
    if (category === 'all') return items;
    const cat = UNIVERSAL_CATEGORIES.find(c => c.id === category);
    if (!cat) return items;
    return items.filter(t => {
      const niche = (t.niche || '').toLowerCase();
      const tcat = (t.category || '').toLowerCase();
      return cat.niches.some(n => niche.includes(n.replace('_', ''))) || tcat === cat.id;
    });
  }, [items, category]);

  const grouped = useMemo(() => {
    return CATEGORY_GROUPS.map(group => ({
      ...group,
      categories: UNIVERSAL_CATEGORIES.filter(c => c.group === group.id),
    }));
  }, []);

  return (
    <section id="templates" className={workspace ? 'rounded-2xl border border-border bg-card p-5 sm:p-6' : 'bg-muted py-16 md:py-24 text-foreground'}>
      <div className={workspace ? 'w-full' : 'mx-auto max-w-7xl px-4 md:px-8'}>
        <div className="mb-8 text-center">
          <h2 className="font-heading text-3xl font-extrabold">Explore Real Templates</h2>
          <p className="mt-3 text-muted-foreground">Every style of website template — industry, platform, and AI automation. Click a category to filter.</p>
          <Link to={workspace ? '/admin/template-studio' : '/templates'} className="mt-4 inline-block font-bold underline">View all templates →</Link>
        </div>

        {/* Clean Clickable Category List — grouped, no images */}
        <div className="mb-10 space-y-6">
          {grouped.map(group => (
            <div key={group.id}>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{group.label}</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCategory('all')}
                  className={`flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-bold transition-all duration-200 ${category === 'all' ? 'border-green-500 bg-green-500/10 text-green-600' : 'border-gray-200 bg-white text-gray-700 hover:border-green-400 hover:text-green-600'}`}
                >
                  <span className="text-base">✦</span> All Categories
                </button>
                {group.categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-bold transition-all duration-200 ${category === cat.id ? 'border-green-500 bg-green-500/10 text-green-600 shadow-[0_0_12px_-2px_rgba(34,197,94,0.4)]' : 'border-gray-200 bg-white text-gray-700 hover:border-green-400 hover:text-green-600 hover:shadow-sm'}`}
                  >
                    <span className="text-base">{cat.icon}</span>
                    {cat.label}
                    {cat.layouts && <span className="ml-0.5 text-xs text-gray-400">{cat.layouts}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Template Cards */}
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