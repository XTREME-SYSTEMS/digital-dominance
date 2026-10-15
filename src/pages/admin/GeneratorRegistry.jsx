import React, { useState, useMemo } from 'react';
import { Shield, GitBranch, AlertTriangle, CheckCircle2, XCircle, HelpCircle, Layers } from 'lucide-react';
import { GENERATOR_REGISTRY, getGeneratorStats, getGeneratorsByClassification } from '@/lib/generatorRegistry';

const CLASSIFICATION_COLORS = {
  REUSE: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  CONNECT: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
  REPAIR: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  REFACTOR: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  MERGE: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
  'NEW-GAP': 'text-red-400 bg-red-500/10 border-red-500/30',
  QUARANTINE: 'text-red-500 bg-red-500/20 border-red-500/40',
};

const GATE_ICONS = {
  PASS: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  FAIL: <XCircle className="h-4 w-4 text-red-400" />,
  UNKNOWN: <HelpCircle className="h-4 w-4 text-slate-500" />,
  BLOCKED: <AlertTriangle className="h-4 w-4 text-amber-400" />,
};

export default function GeneratorRegistry() {
  const [filter, setFilter] = useState('ALL');
  const stats = useMemo(() => getGeneratorStats(), []);

  const filtered = useMemo(() => {
    if (filter === 'ALL') return GENERATOR_REGISTRY;
    return getGeneratorsByClassification(filter);
  }, [filter]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Layers className="h-7 w-7 text-sky-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Generator Registry</h1>
          <p className="text-sm text-slate-400">Authoritative classification of every generator in the system</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
          <div className="text-xs text-slate-400">Total Generators</div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="rounded-lg border border-emerald-700/50 bg-emerald-900/20 p-3">
          <div className="text-xs text-emerald-400">Reuse (Canonical)</div>
          <div className="text-2xl font-bold text-emerald-300">{stats.by_classification.REUSE || 0}</div>
        </div>
        <div className="rounded-lg border border-sky-700/50 bg-sky-900/20 p-3">
          <div className="text-xs text-sky-400">Connect</div>
          <div className="text-2xl font-bold text-sky-300">{stats.by_classification.CONNECT || 0}</div>
        </div>
        <div className="rounded-lg border border-amber-700/50 bg-amber-900/20 p-3">
          <div className="text-xs text-amber-400">Repair</div>
          <div className="text-2xl font-bold text-amber-300">{stats.by_classification.REPAIR || 0}</div>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
          <div className="text-xs text-slate-400">Routed Through Contract</div>
          <div className="text-2xl font-bold text-white">{stats.routed_through_universal_contract}</div>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
          <div className="text-xs text-slate-400">Not Routed</div>
          <div className="text-2xl font-bold text-slate-300">{stats.not_routed}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {['ALL', 'REUSE', 'CONNECT', 'REPAIR', 'REFACTOR', 'MERGE', 'NEW-GAP', 'QUARANTINE'].map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              filter === c
                ? 'border-sky-500 bg-sky-500/20 text-sky-300'
                : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
            }`}
          >
            {c === 'ALL' ? 'All' : c}
          </button>
        ))}
      </div>

      {/* Registry Table */}
      <div className="overflow-hidden rounded-xl border border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/80 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Generator</th>
                <th className="px-4 py-3 text-left font-semibold">Category</th>
                <th className="px-4 py-3 text-left font-semibold">Classification</th>
                <th className="px-4 py-3 text-center font-semibold">Gate</th>
                <th className="px-4 py-3 text-center font-semibold">Contract</th>
                <th className="px-4 py-3 text-left font-semibold">Source Path</th>
                <th className="px-4 py-3 text-left font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((g) => (
                <tr key={g.id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-medium text-white">{g.name}</td>
                  <td className="px-4 py-3 text-slate-400">{g.category}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded border px-2 py-0.5 text-xs font-semibold ${CLASSIFICATION_COLORS[g.classification]}`}>
                      {g.classification}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">{GATE_ICONS[g.quality_gate_status]}</td>
                  <td className="px-4 py-3 text-center">
                    {g.routes_through_universal_contract ? (
                      <Shield className="mx-auto h-4 w-4 text-emerald-400" />
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{g.source_path}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{g.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}