import React, { useState } from 'react';
import { Brain, Sparkles, Loader2, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function StrategyStage({ data, onUpdate, onAdvance, allData }) {
  const [strategy, setStrategy] = useState(data?.strategy || '');
  const [differentiators, setDifferentiators] = useState(data?.differentiators || []);
  const [siteVariants, setSiteVariants] = useState(data?.siteVariants || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    const v = allData.vision;
    if (!v?.defined) { setError('Define a vision first.'); return; }
    setLoading(true); setError('');
    try {
      const res = await base44.functions.invoke('vercelAiGateway', {
        action: 'generateText',
        prompt: `Create a digital domination strategy for this vision:\n\nIndustry: ${v.industry}\nMarket: ${v.market}\nVision: ${v.vision}\nCompetitors: ${v.competitors || 'N/A'}\n\nReturn JSON with:\n- strategy: a detailed 4-6 paragraph strategy covering programmatic SEO, Google standards compliance, site differentiation approach, and launch sequencing\n- differentiators: an array of 5-7 specific ways each of the 350+ sites will be strategically different (content angle, location, service mix, design variant, CTA, pricing tier, trust signals)\n- site_variants: a one-line description of the variant strategy for mass deployment`,
        response_json_schema: {
          type: 'object',
          properties: {
            strategy: { type: 'string' },
            differentiators: { type: 'array', items: { type: 'string' } },
            site_variants: { type: 'string' },
          },
          required: ['strategy', 'differentiators', 'site_variants'],
        },
      });
      if (res.data?.parsed) {
        setStrategy(res.data.parsed.strategy || '');
        setDifferentiators(res.data.parsed.differentiators || []);
        setSiteVariants(res.data.parsed.site_variants || '');
      } else if (res.data?.text) {
        setStrategy(res.data.text);
      }
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const approve = () => {
    onUpdate({ strategy, differentiators, siteVariants, approved: true });
    onAdvance();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-bold text-stone-800">Domination Strategy</h2>
        </div>
        <button onClick={generate} disabled={loading}
          className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-stone-900 hover:bg-amber-400 disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {strategy ? 'Regenerate' : 'Generate Strategy'}
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center py-12 gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-sm text-stone-500">AI is crafting your domination strategy...</p>
        </div>
      )}

      {!loading && strategy && (
        <>
          <div>
            <label className="text-sm font-semibold text-stone-700 mb-1.5 block">Strategy (editable)</label>
            <textarea value={strategy} onChange={(e) => setStrategy(e.target.value)} rows={8}
              className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:border-amber-500 outline-none resize-none" />
          </div>

          {differentiators.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-stone-700 mb-1.5 block">Strategic Differentiators (how 350+ sites differ)</label>
              <div className="space-y-1.5">
                {differentiators.map((d, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-stone-700">{d}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {siteVariants && (
            <div>
              <label className="text-sm font-semibold text-stone-700 mb-1.5 block">Site Variant Strategy</label>
              <p className="text-sm text-stone-600 bg-stone-50 rounded-lg border border-stone-200 px-3 py-2.5">{siteVariants}</p>
            </div>
          )}

          <button onClick={approve}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-600">
            <Check className="h-4 w-4" /> Approve Strategy & Continue
          </button>
        </>
      )}

      {!loading && !strategy && (
        <div className="flex flex-col items-center py-12 gap-3 text-center">
          <Brain className="h-10 w-10 text-stone-300" />
          <p className="text-sm text-stone-500 max-w-md">Click "Generate Strategy" to have AI create a detailed domination plan from your vision — including how 350+ sites will be strategically different.</p>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
    </div>
  );
}