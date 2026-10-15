import React, { useState, useMemo } from 'react';
import { Shield, GitBranch, AlertTriangle, CheckCircle2, XCircle, HelpCircle, Layers } from 'lucide-react';
import { GENERATOR_REGISTRY, getGeneratorStats, getGeneratorsByClassification } from '@/lib/generatorRegistry';

const CLASSIFICATION_COLORS = {
  REUSE: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  CONNECT: 'text-sky-700 bg-sky-50 border-sky-200',
  REPAIR: 'text-amber-700 bg-amber-50 border-amber-200',
  REFACTOR: 'text-purple-700 bg-purple-50 border-purple-200',
  MERGE: 'text-pink-700 bg-pink-50 border-pink-200',
  'NEW-GAP': 'text-red-700 bg-red-50 border-red-200',
  QUARANTINE: 'text-red-800 bg-red-100 border-red-300',
};

const GATE_ICONS = {
  PASS: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
  FAIL: <XCircle className="h-4 w-4 text-red-500" />,
  UNKNOWN: <HelpCircle className="h-4 w-4 text-slate-400" />,
  BLOCKED: <AlertTriangle className="h-4 w-4 text-amber-500" />,
};

export default function GeneratorRegistry() {
  const [filter, setFilter] = useState('ALL');
  const stats = useMemo(() => getGeneratorStats(), []);

  const filtered = useMemo(() => {
    if (filter === 'ALL') return GENERATOR_REGISTRY;
    return getGeneratorsByClassification(filter);
  }, [filter]);

  return (
    <div className="space-y-6 p-6 bg-white text-slate-900 min-h-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Layers className="h-7 w-7 text-sky-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Generator Registry</h1>
          <p className="text-sm text-slate-500">Authoritative classification of every generator in the system</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="text-xs text-slate-500">Total Generators</div>
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 shadow-sm">
          <div className="text-xs text-emerald-700">Reuse (Canonical)</div>
          <div className="text-2xl font-bold text-emerald-800">{stats.by_classification.REUSE || 0}</div>
        </div>
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 shadow-sm">
          <div className="text-xs text-sky-700">Connect</div>
          <div className="text-2xl font-bold text-sky-800">{stats.by_classification.CONNECT || 0}</div>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 shadow-sm">
          <div className="text-xs text-amber-700">Repair</div>
          <div className="text-2xl font-bold text-amber-800">{stats.by_classification.REPAIR || 0}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="text-xs text-slate-500">Routed Through Contract</div>
          <div className="text-2xl font-bold text-slate-900">{stats.routed_through_universal_contract}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="text-xs text-slate-500">Not Routed</div>
          <div className="text-2xl font-bold text-slate-600">{stats.not_routed}</div>
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
                ? 'border-sky-500 bg-sky-50 text-sky-700'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
            }`}
          >
            {c === 'ALL' ? 'All' : c}
          </button>
        ))}
      </div>

      {/* Registry Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
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
            <tbody className="divide-y divide-slate-100">
              {filtered.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{g.name}</td>
                  <td className="px-4 py-3 text-slate-600">{g.category}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded border px-2 py-0.5 text-xs font-semibold ${CLASSIFICATION_COLORS[g.classification]}`}>
                      {g.classification}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">{GATE_ICONS[g.quality_gate_status]}</td>
                  <td className="px-4 py-3 text-center">
                    {g.routes_through_universal_contract ? (
                      <Shield className="mx-auto h-4 w-4 text-emerald-600" />
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{g.source_path}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{g.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}