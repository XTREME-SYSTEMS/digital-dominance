import React from 'react';
import { Check } from 'lucide-react';
import { ACCENT_COMBOS } from '@/data/accentCombos';

/** The ten trending accent combinations — pick one, the site follows. */
export default function AccentComboPicker({ value, onPick }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {ACCENT_COMBOS.map(combo => {
        const active = value === combo.accent;
        return (
          <button
            type="button"
            key={combo.id}
            onClick={() => onPick(combo)}
            aria-pressed={active}
            className={`flex items-center gap-2 rounded-xl border p-2 text-left transition ${active ? 'border-[#00a2ff] bg-[#00a2ff]/5' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <span className="h-8 w-8 shrink-0 rounded-lg ring-1 ring-black/10" style={{ background: combo.gradient }} />
            <span className={`min-w-0 flex-1 truncate text-[11px] font-bold ${active ? 'text-[#00a2ff]' : 'text-gray-700'}`}>{combo.name}</span>
            {active && <Check className="h-3.5 w-3.5 shrink-0 text-[#00a2ff]" />}
          </button>
        );
      })}
    </div>
  );
}