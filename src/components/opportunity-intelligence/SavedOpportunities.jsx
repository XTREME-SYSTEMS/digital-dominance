import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bookmark, Trash2, Loader2, ChevronDown, ChevronUp, FileCode2, ShieldCheck } from 'lucide-react';

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

  const previewPlanMutation = useMutation({
    mutationFn: async (opp) => {
      const planRes = await base44.functions.invoke('planOpportunityWebsiteV3', { opportunity_id: opp.id });
      const plan = planRes.data || planRes;
      if (plan?.status === 'spec_ready' && plan?.build_plan_id) {
        const validationRes = await base44.functions.invoke('validateWebsiteBuildPlanV3', { build_plan_id: plan.build_plan_id });
        return { plan, validation: validationRes.data || validationRes };
      }
      return { plan };
    },
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
                {opp.build_plan_status && (
                  <p className="text-[10px] text-sky-700 mt-1 font-semibold">
                    Preview plan: {opp.build_plan_status}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => previewPlanMutation.mutate(opp)}
                  disabled={
                    previewPlanMutation.isPending ||
                    !['preview_candidate', 'release_candidate'].includes(opp.automation_eligibility || '')
                  }
                  title={
                    ['preview_candidate', 'release_candidate'].includes(opp.automation_eligibility || '')
                      ? 'Create and independently validate a preview-only build specification. This does not deploy or publish.'
                      : 'Needs DDV3 preview_candidate evidence before a website build plan can be prepared.'
                  }
                  className="inline-flex items-center gap-1 px-2 py-1 rounded border border-sky-200 text-[10px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 disabled:opacity-40"
                >
                  {previewPlanMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : opp.build_plan_status === 'validated_for_preview' ? <ShieldCheck className="h-3 w-3" /> : <FileCode2 className="h-3 w-3" />}
                  {opp.build_plan_status === 'validated_for_preview' ? 'Plan Ready' : 'Prepare Preview'}
                </button>
                <select
                  value={opp.status}
                  onChange={(e) => statusMutation.mutate({ id: opp.id, status: e.target.value })}
                  className="text-[10px] border border-stone-200 rounded px-1.5 py-1 bg-white"
                >
                  <option value="saved">Saved</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="validated" disabled={opp.evidence_state !== 'verified'}>Validated {opp.evidence_state !== 'verified' ? '(needs verified evidence)' : ''}</option>
                  <option
                    value="building"
                    disabled={!['validated_for_preview', 'preview_ready', 'release_review'].includes(opp.build_plan_status || '')}
                  >
                    Building {!['validated_for_preview', 'preview_ready', 'release_review'].includes(opp.build_plan_status || '') ? '(needs preview plan)' : ''}
                  </option>
                  <option value="launched" disabled={opp.build_plan_status !== 'release_review'}>
                    Launched {opp.build_plan_status !== 'release_review' ? '(needs release review)' : ''}
                  </option>
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