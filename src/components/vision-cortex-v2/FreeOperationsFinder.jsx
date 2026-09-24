import React, { useState } from 'react';
import { invokeLLM } from '@/lib/gateway';
import { Gift, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

export default function FreeOperationsFinder({ vision }) {
  const [loading, setLoading] = useState(false);
  const [freeOps, setFreeOps] = useState(null);
  const [error, setError] = useState(null);

  const find = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await invokeLLM({
        prompt: `Find ALL free operations, tools, and resources for this vision: "${vision}".
For every category of the system, identify free alternatives that cost $0.
Include: free APIs, free tiers, open-source tools, free hosting, free LLMs, free databases, free automation, free design tools, free marketing channels.

Return JSON: {
  "categories": [ {
    "category": string,
    "free_tools": [ { "name": string, "what_it_does": string, "free_tier_limit": string, "url": string } ]
  } ],
  "total_monthly_savings": string,
  "zero_cost_stack": [string]
}`,
        response_json_schema: {
          type: 'object',
          properties: {
            categories: { type: 'array', items: { type: 'object', properties: {
              category: { type: 'string' },
              free_tools: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, what_it_does: { type: 'string' }, free_tier_limit: { type: 'string' }, url: { type: 'string' } } } },
            } } },
            total_monthly_savings: { type: 'string' },
            zero_cost_stack: { type: 'array', items: { type: 'string' } },
          },
        },
      });
      setFreeOps(res);
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
          <Gift className="h-5 w-5 text-emerald-500" />
          <h3 className="text-base font-black text-stone-900">Free Operations Finder — $0 Stack</h3>
        </div>
        <button onClick={find} disabled={loading || !vision?.trim()} className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? 'Finding Free Tools...' : 'Find Free Operations'}
        </button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {freeOps && (
        <div className="space-y-2">
          {freeOps.total_monthly_savings && (
            <div className="rounded-lg border-2 border-emerald-400 bg-emerald-50 p-3 text-center">
              <p className="text-xs font-bold text-emerald-600">TOTAL MONTHLY SAVINGS</p>
              <p className="text-2xl font-black text-emerald-700">{freeOps.total_monthly_savings}</p>
            </div>
          )}

          {freeOps.categories?.map((cat, i) => (
            <div key={i} className="rounded-lg border border-stone-200 p-2.5">
              <p className="text-xs font-bold text-stone-700 mb-1">{cat.category}</p>
              <div className="space-y-0.5">
                {cat.free_tools?.map((t, j) => (
                  <div key={j} className="flex items-center justify-between text-xs bg-stone-50 rounded px-2 py-1">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      <span className="font-bold text-stone-700">{t.name}</span>
                    </div>
                    <span className="text-[10px] text-stone-400">{t.free_tier_limit}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}