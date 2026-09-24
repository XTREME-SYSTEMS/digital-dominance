import React, { useState } from 'react';
import { invokeLLM } from '@/lib/gateway';
import { Target, Loader2, Sparkles, TrendingUp, DollarSign, Users } from 'lucide-react';

export default function StrategyGenerator({ vision }) {
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState(null);
  const [error, setError] = useState(null);

  const generate = async () => {
    if (!vision?.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await invokeLLM({
        prompt: `You are an elite business strategist. Given this vision: "${vision}"

Generate a comprehensive enhanced strategy with:
1. Market analysis (target market size, segments, trends)
2. Revenue model (3 tiers: entry, growth, scale)
3. Competitive moat and differentiation
4. Go-to-market plan (90-day roadmap)
5. Customer acquisition channels (top 5 ranked by ROI)
6. Key metrics and KPIs to track
7. Risk assessment and mitigations
8. Technology stack recommendations
9. Team/agent requirements
10. Funding/monetization timeline

Return JSON: {
  "market_analysis": { "size": string, "segments": [string], "trends": [string] },
  "revenue_model": [ { "tier": string, "price": string, "features": [string] } ],
  "moat": string,
  "roadmap_90_day": [ { "phase": string, "actions": [string] } ],
  "acquisition_channels": [ { "channel": string, "roi_estimate": string } ],
  "kpis": [string],
  "risks": [ { "risk": string, "mitigation": string } ],
  "tech_stack": [string],
  "agent_requirements": [string],
  "monetization_timeline": string
}`,
        response_json_schema: {
          type: 'object',
          properties: {
            market_analysis: { type: 'object', properties: { size: { type: 'string' }, segments: { type: 'array', items: { type: 'string' } }, trends: { type: 'array', items: { type: 'string' } } } },
            revenue_model: { type: 'array', items: { type: 'object', properties: { tier: { type: 'string' }, price: { type: 'string' }, features: { type: 'array', items: { type: 'string' } } } } },
            moat: { type: 'string' },
            roadmap_90_day: { type: 'array', items: { type: 'object', properties: { phase: { type: 'string' }, actions: { type: 'array', items: { type: 'string' } } } } },
            acquisition_channels: { type: 'array', items: { type: 'object', properties: { channel: { type: 'string' }, roi_estimate: { type: 'string' } } } },
            kpis: { type: 'array', items: { type: 'string' } },
            risks: { type: 'array', items: { type: 'object', properties: { risk: { type: 'string' }, mitigation: { type: 'string' } } } },
            tech_stack: { type: 'array', items: { type: 'string' } },
            agent_requirements: { type: 'array', items: { type: 'string' } },
            monetization_timeline: { type: 'string' },
          },
        },
      });
      setStrategy(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-amber-500" />
          <h3 className="text-base font-black text-stone-900">Enhanced Strategy Generator</h3>
        </div>
        <button onClick={generate} disabled={loading || !vision?.trim()} className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-stone-950 hover:bg-amber-400 disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? 'Generating...' : 'Generate Strategy'}
        </button>
      </div>

      {!vision?.trim() && <p className="text-xs text-stone-400">Enter a vision above to generate a comprehensive strategy.</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {strategy && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <TrendingUp className="h-4 w-4 text-blue-500 mb-1" />
              <p className="text-xs font-bold text-stone-500">Market Size</p>
              <p className="text-sm font-bold text-stone-900">{strategy.market_analysis?.size || 'N/A'}</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <DollarSign className="h-4 w-4 text-emerald-500 mb-1" />
              <p className="text-xs font-bold text-stone-500">Revenue Tiers</p>
              <p className="text-sm font-bold text-stone-900">{strategy.revenue_model?.length || 0} tiers</p>
            </div>
            <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
              <Users className="h-4 w-4 text-violet-500 mb-1" />
              <p className="text-xs font-bold text-stone-500">Segments</p>
              <p className="text-sm font-bold text-stone-900">{strategy.market_analysis?.segments?.length || 0}</p>
            </div>
          </div>

          {strategy.revenue_model?.length > 0 && (
            <div className="rounded-lg border border-stone-200 p-3">
              <p className="text-xs font-bold text-stone-500 mb-2">REVENUE MODEL</p>
              <div className="space-y-1">
                {strategy.revenue_model.map((r, i) => (
                  <div key={i} className="flex items-center justify-between rounded bg-stone-50 px-2 py-1.5">
                    <span className="text-sm font-bold text-stone-900">{r.tier}</span>
                    <span className="text-sm font-bold text-amber-600">{r.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {strategy.roadmap_90_day?.length > 0 && (
            <div className="rounded-lg border border-stone-200 p-3">
              <p className="text-xs font-bold text-stone-500 mb-2">90-DAY ROADMAP</p>
              <div className="space-y-1.5">
                {strategy.roadmap_90_day.map((p, i) => (
                  <div key={i} className="text-xs">
                    <p className="font-bold text-stone-700">{p.phase}</p>
                    <ul className="list-disc list-inside text-stone-500 ml-2">{p.actions?.map((a, j) => <li key={j}>{a}</li>)}</ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {strategy.acquisition_channels?.length > 0 && (
            <div className="rounded-lg border border-stone-200 p-3">
              <p className="text-xs font-bold text-stone-500 mb-2">ACQUISITION CHANNELS (by ROI)</p>
              <div className="space-y-1">
                {strategy.acquisition_channels.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-stone-700">{c.channel}</span>
                    <span className="font-bold text-emerald-600">{c.roi_estimate}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {strategy.moat && (
            <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-3">
              <p className="text-xs font-bold text-amber-600 mb-1">COMPETITIVE MOAT</p>
              <p className="text-sm text-stone-700">{strategy.moat}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}