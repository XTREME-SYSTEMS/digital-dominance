import React, { useState } from 'react';
import { invokeLLM } from '@/lib/gateway';
import { Activity, Loader2, Sparkles, BarChart3, RefreshCw } from 'lucide-react';

export default function AutonomousAnalyzer({ vision }) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const analyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await invokeLLM({
        prompt: `Design an autonomous agent analysis and replication system for this vision: "${vision}".
The system should:
1. Persistently watch analytics
2. Constantly adjust based on what's working
3. When it finds what works, follow that groove and replicate it
4. Scale winning patterns

Return JSON: {
  "watch_metrics": [ { "metric": string, "source": string, "threshold": string } ],
  "adjustment_rules": [ { "trigger": string, "action": string, "expected_impact": string } ],
  "replication_strategy": { "what_to_replicate": [string], "how_to_replicate": [string], "scale_plan": string },
  "winning_pattern_detection": string,
  "autonomous_adjustments": [string],
  "persistence_schedule": string
}`,
        response_json_schema: {
          type: 'object',
          properties: {
            watch_metrics: { type: 'array', items: { type: 'object', properties: { metric: { type: 'string' }, source: { type: 'string' }, threshold: { type: 'string' } } } },
            adjustment_rules: { type: 'array', items: { type: 'object', properties: { trigger: { type: 'string' }, action: { type: 'string' }, expected_impact: { type: 'string' } } } },
            replication_strategy: { type: 'object', properties: { what_to_replicate: { type: 'array', items: { type: 'string' } }, how_to_replicate: { type: 'array', items: { type: 'string' } }, scale_plan: { type: 'string' } } },
            winning_pattern_detection: { type: 'string' },
            autonomous_adjustments: { type: 'array', items: { type: 'string' } },
            persistence_schedule: { type: 'string' },
          },
        },
      });
      setAnalysis(res);
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
          <Activity className="h-5 w-5 text-amber-500" />
          <h3 className="text-base font-black text-stone-900">Autonomous Agent Analyzer & Replicator</h3>
        </div>
        <button onClick={analyze} disabled={loading || !vision?.trim()} className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-stone-950 hover:bg-amber-400 disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? 'Analyzing...' : 'Analyze & Replicate'}
        </button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {analysis && (
        <div className="space-y-2">
          {analysis.watch_metrics?.length > 0 && (
            <div className="rounded-lg border border-stone-200 p-3">
              <p className="text-xs font-bold text-stone-500 mb-1 flex items-center gap-1"><BarChart3 className="h-3 w-3" /> PERSISTENTLY WATCHING</p>
              <div className="space-y-0.5">
                {analysis.watch_metrics.map((m, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-stone-50 rounded px-2 py-1">
                    <span className="font-bold text-stone-700">{m.metric}</span>
                    <span className="text-stone-400">{m.source} · {m.threshold}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.adjustment_rules?.length > 0 && (
            <div className="rounded-lg border border-stone-200 p-3">
              <p className="text-xs font-bold text-stone-500 mb-1 flex items-center gap-1"><RefreshCw className="h-3 w-3" /> AUTO-ADJUSTMENT RULES</p>
              <div className="space-y-0.5">
                {analysis.adjustment_rules.map((r, i) => (
                  <div key={i} className="text-xs bg-amber-50 rounded p-2">
                    <p className="font-bold text-stone-700">IF: {r.trigger}</p>
                    <p className="text-amber-600">THEN: {r.action}</p>
                    <p className="text-[10px] text-stone-400">Impact: {r.expected_impact}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.replication_strategy && (
            <div className="rounded-lg border-2 border-violet-300 bg-violet-50 p-3">
              <p className="text-xs font-bold text-violet-600 mb-1">REPLICATION STRATEGY</p>
              <p className="text-sm text-stone-700 font-bold">{analysis.winning_pattern_detection}</p>
              {analysis.replication_strategy.what_to_replicate?.length > 0 && (
                <div className="mt-1">
                  <p className="text-[10px] font-bold text-stone-500">REPLICATE:</p>
                  <div className="flex flex-wrap gap-1">{analysis.replication_strategy.what_to_replicate.map((w, i) => <span key={i} className="text-[10px] bg-white border border-stone-200 px-1.5 py-0.5 rounded">{w}</span>)}</div>
                </div>
              )}
              <p className="text-xs text-violet-700 font-bold mt-1">Scale: {analysis.replication_strategy.scale_plan}</p>
            </div>
          )}

          {analysis.persistence_schedule && (
            <div className="rounded-lg border border-stone-200 p-2 text-center">
              <p className="text-xs font-bold text-stone-500">PERSISTENCE: <span className="text-amber-600">{analysis.persistence_schedule}</span></p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}