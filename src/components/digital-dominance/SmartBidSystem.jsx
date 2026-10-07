import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { DollarSign, Loader2, FileText, TrendingUp, Calculator } from 'lucide-react';

export default function SmartBidSystem() {
  const [generating, setGenerating] = useState(false);
  const [bid, setBid] = useState(null);
  const [error, setError] = useState(null);
  const [project, setProject] = useState({
    project_type: 'garage_floor',
    square_footage: 500,
    condition: 'good',
    location: 'FL',
    timeline: 'flexible',
  });

  const PROJECT_TYPES = [
    { id: 'garage_floor', label: 'Garage Floor' },
    { id: 'commercial_floor', label: 'Commercial Floor' },
    { id: 'polished_concrete', label: 'Polished Concrete' },
    { id: 'decorative_concrete', label: 'Decorative Concrete' },
    { id: 'epoxy_countertops', label: 'Epoxy Countertops' },
    { id: 'pool_deck', label: 'Pool Deck' },
    { id: 'patio', label: 'Patio' },
    { id: 'driveway', label: 'Driveway' },
  ];

  const generate = async () => {
    setGenerating(true);
    setError(null);
    setBid(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a smart bid generator for the epoxy/concrete industry. Generate a professional, competitive bid based on:

Project: ${JSON.stringify(project)}

Use current market pricing intelligence. Provide:
1. Low, mid, and high bid ranges with breakdowns
2. Material costs estimate
3. Labor costs estimate
4. Prep work costs
5. Recommended bid price (competitive but profitable)
6. Margin analysis
7. Competitive positioning notes
8. Recommended package tiers to offer

Return structured JSON.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            bid_summary: { type: 'string' },
            low_bid: { type: 'number' },
            mid_bid: { type: 'number' },
            high_bid: { type: 'number' },
            recommended_bid: { type: 'number' },
            cost_breakdown: {
              type: 'object',
              properties: {
                materials: { type: 'number' },
                labor: { type: 'number' },
                prep_work: { type: 'number' },
                overhead: { type: 'number' },
                profit: { type: 'number' },
              },
            },
            margin_percent: { type: 'number' },
            competitive_notes: { type: 'string' },
            package_tiers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  price: { type: 'number' },
                  features: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
      });
      setBid(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Project Input */}
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-amber-600" />
            <h4 className="text-sm font-bold text-stone-900">Project Specs</h4>
          </div>
          <div>
            <label className="text-xs font-bold text-stone-500">PROJECT TYPE</label>
            <select value={project.project_type} onChange={(e) => setProject({ ...project, project_type: e.target.value })} className="w-full mt-1 rounded-lg border border-stone-200 px-3 py-2 text-sm">
              {PROJECT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-stone-500">SQ FT</label>
              <input type="number" value={project.square_footage} onChange={(e) => setProject({ ...project, square_footage: +e.target.value })} className="w-full mt-1 rounded-lg border border-stone-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-stone-500">STATE</label>
              <input value={project.location} onChange={(e) => setProject({ ...project, location: e.target.value })} className="w-full mt-1 rounded-lg border border-stone-200 px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-stone-500">CONDITION</label>
              <select value={project.condition} onChange={(e) => setProject({ ...project, condition: e.target.value })} className="w-full mt-1 rounded-lg border border-stone-200 px-3 py-2 text-sm">
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-stone-500">TIMELINE</label>
              <select value={project.timeline} onChange={(e) => setProject({ ...project, timeline: e.target.value })} className="w-full mt-1 rounded-lg border border-stone-200 px-3 py-2 text-sm">
                <option value="flexible">Flexible</option>
                <option value="2_weeks">2 Weeks</option>
                <option value="1_week">1 Week</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <button onClick={generate} disabled={generating} className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-stone-950 hover:bg-amber-400 disabled:opacity-50">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
            {generating ? 'Generating Bid...' : 'Generate Smart Bid'}
          </button>
        </div>

        {/* Bid Result */}
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>}
          {!bid && !error && (
            <div className="h-full grid place-items-center text-center">
              <div>
                <FileText className="h-12 w-12 text-stone-300 mx-auto mb-2" />
                <p className="text-sm text-stone-400">Enter project specs and generate a competitive bid</p>
              </div>
            </div>
          )}
          {bid && (
            <div className="space-y-3">
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs text-stone-500">Recommended Bid</p>
                <p className="text-3xl font-black text-amber-600">${bid.recommended_bid?.toLocaleString()}</p>
                <p className="text-xs text-stone-500 mt-1">Margin: {bid.margin_percent}%</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-stone-200 p-2">
                  <p className="text-[10px] text-stone-500">LOW</p>
                  <p className="text-sm font-bold text-stone-700">${bid.low_bid?.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-amber-300 p-2 bg-amber-50">
                  <p className="text-[10px] text-stone-500">MID</p>
                  <p className="text-sm font-bold text-amber-600">${bid.mid_bid?.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-stone-200 p-2">
                  <p className="text-[10px] text-stone-500">HIGH</p>
                  <p className="text-sm font-bold text-stone-700">${bid.high_bid?.toLocaleString()}</p>
                </div>
              </div>
              {bid.cost_breakdown && (
                <div className="rounded-lg border border-stone-200 p-3 space-y-1">
                  <p className="text-xs font-bold text-stone-700 mb-1">Cost Breakdown</p>
                  {Object.entries(bid.cost_breakdown).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="text-stone-500 capitalize">{k.replace(/_/g, ' ')}</span>
                      <span className="font-bold text-stone-700">${v?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
              {bid.competitive_notes && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <p className="text-xs font-bold text-blue-700 mb-1"><TrendingUp className="h-3 w-3 inline mr-1" />Competitive Notes</p>
                  <p className="text-xs text-stone-600">{bid.competitive_notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Package Tiers */}
      {bid?.package_tiers?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {bid.package_tiers.map((t, i) => (
            <div key={i} className="rounded-xl border border-stone-200 bg-white p-4">
              <h5 className="text-sm font-bold text-stone-900">{t.name}</h5>
              <p className="text-lg font-bold text-amber-600">${t.price?.toLocaleString()}</p>
              <ul className="mt-2 space-y-1">
                {t.features?.map((f, j) => <li key={j} className="text-[10px] text-stone-600">✓ {f}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}