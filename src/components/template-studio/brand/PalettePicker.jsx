import React from 'react';
import { Check } from 'lucide-react';
import { SERVICE_PALETTES } from '@/data/servicePalettes';

// The 20 most popular color palettes for service-industry websites.
export default function PalettePicker({ value, onSelect }) {
  return (
    <div className="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
      {SERVICE_PALETTES.map((p) => {
        const active = value === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id, p)}
            className={`rounded-xl border p-2 text-left transition ${
              active ? 'border-[#00a2ff] ring-2 ring-[#00a2ff]/25' : 'border-border hover:border-[#00a2ff]/50'
            }`}
          >
            <div className="h-10 w-full rounded-lg" style={{ background: p.gradient }} />
            <div className="mt-1.5 flex items-center gap-1">
              <span className="text-[11px] font-bold text-foreground">{p.name}</span>
              {active && <Check className="h-3 w-3 text-[#00a2ff]" />}
            </div>
            <p className="text-[9px] leading-tight text-muted-foreground">{p.best_for}</p>
          </button>
        );
      })}
    </div>
  );
}