import React, { useState } from 'react';
import { invokeLLM } from '@/lib/gateway';
import { FileSpreadsheet, FileText, Archive, Loader2, Sparkles, Database, ChevronDown } from 'lucide-react';

const FILES = [
  { name: 'AI Hub — Amazon for AI Master Intelligence', type: 'xlsx', sheets: 41, icon: FileSpreadsheet, desc: 'Source-truth, market taxonomy, product catalog, prompt loop, rights controls and deterministic validation plan', key: 'AI_HUB' },
  { name: 'XTREME AI Opportunity Ingestion Machine', type: 'xlsx', sheets: 26, icon: FileSpreadsheet, desc: 'Evidence-backed opportunity discovery, validation, monetization, and governed handoff', key: 'OPP_INGESTION' },
  { name: 'XTREME Google Ecosystem Integration Plan', type: 'docx', icon: FileText, desc: 'Workspace, Analytics, Search, Cloud & Autonomous Workflow Blueprint', key: 'GOOGLE_ECOSYSTEM' },
  { name: 'XTREME Universal Generator System Plan', type: 'docx', icon: FileText, desc: 'System Plan, Architecture & Autonomous Operating Strategy', key: 'UNIVERSAL_GEN_PLAN' },
  { name: 'XTREME Universal Generator Business Plan', type: 'docx', icon: FileText, desc: 'Business Plan & Enterprise Operating Strategy', key: 'UNIVERSAL_GEN_BIZ' },
  { name: 'XTREME Drive System Validation Scorecard', type: 'xlsx', sheets: 3, icon: FileSpreadsheet, desc: 'Validation score, 100 contract, folder manifest', key: 'DRIVE_SCORECARD' },
  { name: 'XTREME Universal Generator Package', type: 'zip', icon: Archive, desc: 'Complete generator package with templates, registries, and workspace', key: 'UNIVERSAL_PACKAGE' },
  { name: 'Market Intelligence Archive', type: 'zip', icon: Archive, desc: 'Market data and intelligence archive', key: 'MARKET_INTEL' },
];

export default function FileIntelligenceLibrary() {
  const [expanded, setExpanded] = useState(null);
  const [analyzing, setAnalyzing] = useState(null);
  const [analysis, setAnalysis] = useState({});

  const analyze = async (file) => {
    setAnalyzing(file.key);
    try {
      const res = await invokeLLM({
        prompt: `Analyze this business intelligence document: "${file.name}" — ${file.desc}. 

Based on the title and description, provide:
1. Key insights and frameworks contained
2. How it connects to an autonomous AI system pipeline
3. Actionable systems that can be built from it
4. Revenue opportunities it reveals

Return JSON: { "insights": [string], "systems": [string], "revenue_opportunities": [string], "pipeline_connections": [string] }`,
        response_json_schema: {
          type: 'object',
          properties: {
            insights: { type: 'array', items: { type: 'string' } },
            systems: { type: 'array', items: { type: 'string' } },
            revenue_opportunities: { type: 'array', items: { type: 'string' } },
            pipeline_connections: { type: 'array', items: { type: 'string' } },
          },
        },
      });
      setAnalysis((prev) => ({ ...prev, [file.key]: res }));
    } catch (e) {
      setAnalysis((prev) => ({ ...prev, [file.key]: { error: e.message } }));
    } finally {
      setAnalyzing(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <Database className="h-5 w-5 text-amber-500" />
        <h3 className="text-base font-black text-stone-900">File Intelligence Library</h3>
        <span className="text-xs text-stone-400">{FILES.length} intelligence documents dissected</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {FILES.map((f) => {
          const Icon = f.icon;
          const isExpanded = expanded === f.key;
          const hasAnalysis = analysis[f.key];
          return (
            <div key={f.key} className="rounded-xl border border-stone-200 bg-white overflow-hidden">
              <button onClick={() => setExpanded(isExpanded ? null : f.key)} className="w-full flex items-center gap-3 p-3 hover:bg-stone-50 text-left">
                <Icon className="h-5 w-5 text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-stone-900 truncate">{f.name}</p>
                  <p className="text-xs text-stone-400 truncate">{f.desc}</p>
                </div>
                <ChevronDown className={`h-4 w-4 text-stone-400 transition ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
              {isExpanded && (
                <div className="px-3 pb-3">
                  <div className="flex gap-2 mb-2 text-xs text-stone-500">
                    <span className="font-bold bg-stone-100 px-2 py-0.5 rounded">{f.type.toUpperCase()}</span>
                    {f.sheets && <span className="font-bold bg-stone-100 px-2 py-0.5 rounded">{f.sheets} sheets</span>}
                  </div>
                  {!hasAnalysis && (
                    <button onClick={() => analyze(f)} disabled={analyzing === f.key} className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-stone-950 hover:bg-amber-400 disabled:opacity-50">
                      {analyzing === f.key ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      {analyzing === f.key ? 'Analyzing...' : 'Dissect with AI'}
                    </button>
                  )}
                  {hasAnalysis && !hasAnalysis.error && (
                    <div className="space-y-2 text-xs">
                      {hasAnalysis.insights?.length > 0 && (
                        <div><p className="font-bold text-stone-600 mb-0.5">Key Insights:</p><ul className="list-disc list-inside text-stone-500 space-y-0.5">{hasAnalysis.insights.slice(0, 3).map((i, x) => <li key={x}>{i}</li>)}</ul></div>
                      )}
                      {hasAnalysis.systems?.length > 0 && (
                        <div><p className="font-bold text-stone-600 mb-0.5">Buildable Systems:</p><ul className="list-disc list-inside text-stone-500 space-y-0.5">{hasAnalysis.systems.slice(0, 3).map((i, x) => <li key={x}>{i}</li>)}</ul></div>
                      )}
                      {hasAnalysis.revenue_opportunities?.length > 0 && (
                        <div><p className="font-bold text-emerald-600 mb-0.5">Revenue Opportunities:</p><ul className="list-disc list-inside text-emerald-600 space-y-0.5">{hasAnalysis.revenue_opportunities.slice(0, 3).map((i, x) => <li key={x}>{i}</li>)}</ul></div>
                      )}
                    </div>
                  )}
                  {hasAnalysis?.error && <p className="text-xs text-red-500">Error: {hasAnalysis.error}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}