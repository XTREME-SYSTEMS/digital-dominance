import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bookmark, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_COLORS = {
  saved: 'bg-stone-100 text-stone-600',
  reviewing: 'bg-blue-100 text-blue-600',
  validated: 'bg-violet-100 text-violet-600',
  building: 'bg-amber-100 text-amber-600',
  launched: 'bg-green-100 text-green-600',
  archived: 'bg-stone-100 text-stone-400',
};

export default function SavedOpportunities() {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);

  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ['savedOpportunities'],
    queryFn: async () => {
      const res = await base44.entities.Opportunity.list('-created_date', 50);
      return res;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => base44.entities.Opportunity.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savedOpportunities'] }),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }) => base44.entities.Opportunity.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savedOpportunities'] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-stone-400" />
      </div>
    );
  }

  if (opportunities.length === 0) return null;

  const visible = expanded ? opportunities : opportunities.slice(0, 4);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-stone-900 grid place-items-center">
            <Bookmark className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-stone-900">Saved Opportunities</h2>
            <p className="text-xs text-stone-500">{opportunities.length} saved — track from problem to launched app</p>
          </div>
        </div>
        {opportunities.length > 4 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700"
          >
            {expanded ? <>Collapse <ChevronUp className="h-3.5 w-3.5" /></> : <>Show all <ChevronDown className="h-3.5 w-3.5" /></>}
          </button>
        )}
      </div>

      <div className="divide-y divide-stone-100">
        {visible.map((opp) => (
          <div key={opp.id} className="px-5 py-3 hover:bg-stone-50 transition">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-sm font-bold text-stone-900">{opp.title}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[opp.status] || STATUS_COLORS.saved}`}>
                    {opp.status}
                  </span>
                  {opp.scanner_label && (
                    <span className="text-[10px] text-stone-400 font-mono">{opp.scanner_label}</span>
                  )}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700">
                    V3 {Math.round(opp.decision_score || 0)}/100
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">
                    {opp.evidence_state || 'hypothesis'}
                  </span>
                </div>
                {opp.problem && <p className="text-xs text-stone-500 line-clamp-1">{opp.problem}</p>}
                {opp.app_idea && <p className="text-xs text-amber-600 line-clamp-1 mt-0.5">💡 {opp.app_idea}</p>}
                <p className="text-[10px] text-stone-400 mt-1">
                  Evidence: {opp.evidence_count || 0} records · {Math.round(opp.evidence_coverage_pct || 0)}% coverage
                  {Number(opp.hypothesis_score || opp.score) > 0 ? ` · AI hypothesis ${opp.hypothesis_score || opp.score}/10` : ''}
                  {' · '}{opp.automation_eligibility || 'research_only'}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <select
                  value={opp.status}
                  onChange={(e) => statusMutation.mutate({ id: opp.id, status: e.target.value })}
                  className="text-[10px] border border-stone-200 rounded px-1.5 py-1 bg-white"
                >
                  <option value="saved">Saved</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="validated" disabled={opp.evidence_state !== 'verified'}>Validated {opp.evidence_state !== 'verified' ? '(needs verified evidence)' : ''}</option>
                  <option value="building">Building</option>
                  <option value="launched">Launched</option>
                  <option value="archived">Archived</option>
                </select>
                <button
                  onClick={() => deleteMutation.mutate(opp.id)}
                  className="text-stone-300 hover:text-red-500 transition p-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}