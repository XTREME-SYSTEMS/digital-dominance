import React from 'react';

export default function KpiCard({ icon: Icon, label, value, sublabel, color = 'text-amber-600', accent = 'bg-amber-50' }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${accent} grid place-items-center`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        {sublabel && (
          <span className="text-xs text-stone-400 font-medium">{sublabel}</span>
        )}
      </div>
      <p className="text-3xl font-black text-stone-900 leading-none">{value}</p>
      <p className="text-xs text-stone-500 mt-2 uppercase tracking-wide font-semibold">{label}</p>
    </div>
  );
}