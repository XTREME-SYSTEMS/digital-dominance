import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { GitBranch, AlertTriangle, CheckCircle2, Clock, ArrowRight, Loader2 } from 'lucide-react';

export default function GapAnalysis() {
  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.entities.OptimizationGap.filter({}, { sort: '-created_date', limit: 50 }).catch(() => ({ items: [] }));
      setGaps(res.items || []);
    } catch (e) { /* noop */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all' ? gaps : gaps.filter(g => g.priority === filter);
  const counts = {
    critical: gaps.filter(g => g.priority === 'critical').length,
    high: gaps.filter(g => g.priority === 'high').length,
    medium: gaps.filter(g => g.priority === 'medium').length,
    low: gaps.filter(g => g.priority === 'low').length,
    resolved: gaps.filter(g => g.status === 'resolved').length,
  };

  return (
    <div className="min-h-screen bg-[#050508] p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a1220] to-[#0d1a2e] p-6">
          <div className="flex items-center gap-3">
            <GitBranch className="h-8 w-8 text-[#00a2ff]" />
            <div>
              <h1 className="text-2xl font-extrabold text-white">Gap Analysis</h1>
              <p className="text-sm text-white/60">Identifies gaps between current state and 100% completion — with priority, effort, and recommended action.</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3">
              <p className="text-[10px] uppercase tracking-wider text-red-400">Critical</p>
              <p className="text-xl font-black text-white">{counts.critical}</p>
            </div>
            <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-3">
              <p className="text-[10px] uppercase tracking-wider text-orange-400">High</p>
              <p className="text-xl font-black text-white">{counts.high}</p>
            </div>
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
              <p className="text-[10px] uppercase tracking-wider text-amber-400">Medium</p>
              <p className="text-xl font-black text-white">{counts.medium}</p>
            </div>
            <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3">
              <p className="text-[10px] uppercase tracking-wider text-blue-400">Low</p>
              <p className="text-xl font-black text-white">{counts.low}</p>
            </div>
            <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3">
              <p className="text-[10px] uppercase tracking-wider text-green-400">Resolved</p>
              <p className="text-xl font-black text-white">{counts.resolved}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[{id:'all',label:'All'},{id:'critical',label:'Critical'},{id:'high',label:'High'},{id:'medium',label:'Medium'},{id:'low',label:'Low'}].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${filter === f.id ? 'bg-[#00a2ff] text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {loading && <div className="text-center text-white/40 py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>}
        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-white/60">No gaps detected — system is at 100% completion.</p>
          </div>
        )}
        {filtered.map(gap => (
          <div key={gap.id} className="rounded-xl border border-white/10 bg-[#0a1220] p-4 hover:border-green-400/50 transition-all duration-300">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className={`h-4 w-4 ${gap.priority === 'critical' ? 'text-red-400' : gap.priority === 'high' ? 'text-orange-400' : gap.priority === 'medium' ? 'text-amber-400' : 'text-blue-400'}`} />
                  <h3 className="text-sm font-bold text-white">{gap.title || gap.gap_area || 'Unnamed Gap'}</h3>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${gap.priority === 'critical' ? 'bg-red-500/20 text-red-400' : gap.priority === 'high' ? 'bg-orange-500/20 text-orange-400' : gap.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>{gap.priority}</span>
                  {gap.status === 'resolved' && <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-green-500/20 text-green-400">Resolved</span>}
                </div>
                <p className="text-xs text-white/60 mb-2">{gap.description || gap.recommended_action || ''}</p>
                <div className="flex flex-wrap items-center gap-3 text-[10px] text-white/40">
                  {gap.effort_estimate && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {gap.effort_estimate}</span>}
                  {gap.current_score !== undefined && <span>Score: {gap.current_score}/100</span>}
                  {gap.target_score !== undefined && <span>Target: {gap.target_score}/100</span>}
                </div>
              </div>
              {gap.recommended_action && (
                <div className="flex items-center gap-1 text-xs text-[#00a2ff] flex-shrink-0">
                  <ArrowRight className="h-3.5 w-3.5" /> Fix
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}