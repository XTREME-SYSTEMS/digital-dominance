import React, { useState } from 'react';
import { invokeLLM } from '@/lib/gateway';
import { Globe, Loader2, Sparkles, Layout, Palette } from 'lucide-react';

const CATEGORIES = [
  'SaaS Landing Page', 'E-commerce Store', 'Lead Gen Funnel', 'Portfolio Site',
  'Booking System', 'Membership Portal', 'Course Platform', 'Marketplace',
  'Directory Site', 'Blog/Magazine', 'Agency Website', 'Restaurant Site',
  'Real Estate Listings', 'SaaS Dashboard', 'Mobile App Landing', 'Event Page',
  'Non-profit Site', 'Healthcare Portal', 'Legal Services', 'Financial Dashboard',
];

const ACCENT_COLORS = [
  { name: 'Amber Gold', value: '#D4AF37' },
  { name: 'Electric Blue', value: '#3B82F6' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Rose', value: '#F43F5E' },
  { name: 'Violet', value: '#8B5CF6' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Lime', value: '#84CC16' },
];

export default function WebsiteGenerator({ vision, brand }) {
  const [loading, setLoading] = useState(null);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [accent, setAccent] = useState(ACCENT_COLORS[0].value);
  const [recommended, setRecommended] = useState(null);
  const [generated, setGenerated] = useState(null);
  const [error, setError] = useState(null);

  const recommendCategory = async () => {
    setLoading('recommend');
    try {
      const res = await invokeLLM({
        prompt: `Given this vision: "${vision}", recommend the best website category from this list: ${CATEGORIES.join(', ')}.
Also recommend the top 3 alternative categories. Return JSON: { "primary": string, "alternatives": [string], "reasoning": string }`,
        response_json_schema: {
          type: 'object',
          properties: { primary: { type: 'string' }, alternatives: { type: 'array', items: { type: 'string' } }, reasoning: { type: 'string' } },
        },
      });
      setRecommended(res);
      if (res.primary) setCategory(res.primary);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  };

  const generate = async () => {
    setLoading('generate');
    setError(null);
    try {
      const brandContext = brand ? `Brand: ${brand.name}, Colors: ${brand.colors?.map((c) => c.hex).join(', ')}` : '';
      const res = await invokeLLM({
        prompt: `Generate a complete, top-quality website specification for category "${category}".
Vision: "${vision}"
Accent color: ${accent}
${brandContext}

Include:
1. Site structure (all pages)
2. Hero section copy and layout
3. Navigation menu
4. Key sections per page
5. SEO meta tags (title, description, keywords)
6. Conversion elements (CTAs, forms)
7. Mobile responsiveness notes
8. Performance optimization notes

Return JSON: {
  "site_name": string, "pages": [ { "name": string, "sections": [string], "seo": { "title": string, "description": string } } ],
  "hero": { "headline": string, "subheadline": string, "cta": string },
  "nav": [string], "conversion_elements": [string], "performance_notes": [string]
}`,
        response_json_schema: {
          type: 'object',
          properties: {
            site_name: { type: 'string' },
            pages: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, sections: { type: 'array', items: { type: 'string' } }, seo: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' } } } } } },
            hero: { type: 'object', properties: { headline: { type: 'string' }, subheadline: { type: 'string' }, cta: { type: 'string' } } },
            nav: { type: 'array', items: { type: 'string' } },
            conversion_elements: { type: 'array', items: { type: 'string' } },
            performance_notes: { type: 'array', items: { type: 'string' } },
          },
        },
      });
      setGenerated(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Globe className="h-5 w-5 text-amber-500" />
        <h3 className="text-base font-black text-stone-900">Website Generator — Top Quality, Every Category</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-stone-500">CATEGORY</label>
          <div className="flex gap-2 mt-1">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 outline-none">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={recommendCategory} disabled={loading === 'recommend'} className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-bold hover:border-amber-500 disabled:opacity-50">
              {loading === 'recommend' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            </button>
          </div>
          {recommended && (
            <div className="mt-1 rounded bg-violet-50 border border-violet-200 p-2">
              <p className="text-xs font-bold text-violet-700">Recommended: {recommended.primary}</p>
              <p className="text-[10px] text-stone-500">{recommended.reasoning}</p>
            </div>
          )}
        </div>
        <div>
          <label className="text-xs font-bold text-stone-500 flex items-center gap-1"><Palette className="h-3 w-3" /> ACCENT COLOR</label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {ACCENT_COLORS.map((c) => (
              <button key={c.value} onClick={() => setAccent(c.value)} className={`h-8 w-8 rounded-lg border-2 transition ${accent === c.value ? 'border-stone-900 scale-110' : 'border-stone-200'}`} style={{ backgroundColor: c.value }} title={c.name} />
            ))}
          </div>
        </div>
      </div>

      <button onClick={generate} disabled={loading === 'generate' || !vision?.trim()} className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-stone-950 hover:bg-amber-400 disabled:opacity-50">
        {loading === 'generate' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layout className="h-4 w-4" />}
        {loading === 'generate' ? 'Generating...' : 'Generate Website Spec'}
      </button>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {generated && (
        <div className="space-y-2">
          <div className="rounded-lg border-2 p-3" style={{ borderColor: accent }}>
            <p className="text-lg font-black text-stone-900">{generated.site_name}</p>
            <p className="text-sm text-stone-600 font-bold">{generated.hero?.headline}</p>
            <p className="text-xs text-stone-500">{generated.hero?.subheadline}</p>
            <button className="mt-2 rounded-lg px-4 py-2 text-sm font-bold text-white" style={{ backgroundColor: accent }}>{generated.hero?.cta}</button>
          </div>
          {generated.pages?.length > 0 && (
            <div className="rounded-lg border border-stone-200 p-3">
              <p className="text-xs font-bold text-stone-500 mb-1">PAGES ({generated.pages.length})</p>
              <div className="grid grid-cols-2 gap-1">
                {generated.pages.map((p, i) => (
                  <div key={i} className="text-xs bg-stone-50 rounded p-2">
                    <p className="font-bold text-stone-700">{p.name}</p>
                    <p className="text-[10px] text-stone-400">{p.sections?.length} sections</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}