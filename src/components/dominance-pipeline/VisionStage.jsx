import React, { useState } from 'react';
import { Eye, Sparkles, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function VisionStage({ data, onUpdate, onAdvance }) {
  const [vision, setVision] = useState(data?.vision || '');
  const [industry, setIndustry] = useState(data?.industry || '');
  const [market, setMarket] = useState(data?.market || '');
  const [competitors, setCompetitors] = useState(data?.competitors || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const save = () => {
    onUpdate({ vision, industry, market, competitors, defined: true });
    onAdvance();
  };

  const autoGenerate = async () => {
    if (!industry) { setError('Enter an industry first.'); return; }
    setLoading(true); setError('');
    try {
      const res = await base44.functions.invoke('vercelAiGateway', {
        action: 'generateText',
        prompt: `Write a bold, specific digital domination vision statement for a company in the "${industry}" industry${market ? ` targeting "${market}"` : ''}. The vision should be 2-3 sentences, ambitious, and focused on total market dominance through programmatic websites and Google visibility. No fluff.`,
      });
      if (res.data?.text) setVision(res.data.text.trim());
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Eye className="h-5 w-5 text-amber-500" />
        <h2 className="text-lg font-bold text-stone-800">Define Your Domination Vision</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold text-stone-700 mb-1.5 block">Industry / Niche</label>
          <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Epoxy garage flooring, HVAC repair, Med Spa"
            className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:border-amber-500 outline-none" />
        </div>
        <div>
          <label className="text-sm font-semibold text-stone-700 mb-1.5 block">Target Market / Geography</label>
          <input value={market} onChange={(e) => setMarket(e.target.value)} placeholder="e.g. National USA, Florida, Southeast"
            className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:border-amber-500 outline-none" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-semibold text-stone-700">Vision Statement</label>
          <button onClick={autoGenerate} disabled={loading || !industry}
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 disabled:opacity-50">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            AI Generate
          </button>
        </div>
        <textarea value={vision} onChange={(e) => setVision(e.target.value)} rows={4}
          placeholder="Describe the end-state vision for market domination..."
          className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:border-amber-500 outline-none resize-none" />
      </div>

      <div>
        <label className="text-sm font-semibold text-stone-700 mb-1.5 block">Top Competitors (optional)</label>
        <input value={competitors} onChange={(e) => setCompetitors(e.target.value)} placeholder="e.g. GarageForce, ArmorPoxy, Pennylco"
          className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:border-amber-500 outline-none" />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <button onClick={save} disabled={!vision || !industry}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-stone-900 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed">
        <Eye className="h-4 w-4" /> Define Vision & Continue
      </button>
    </div>
  );
}