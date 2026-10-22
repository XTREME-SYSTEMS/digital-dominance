import React from 'react';
import { Check } from 'lucide-react';
import { OTHER_OPTION } from '@/data/industryCatalog';

/**
 * Specialties inside the chosen industry. Pick as many as the business works
 * in — each one you pick is added to the services list straight away.
 */
export default function SubIndustryPicker({ options, selected, onToggle, onSelectAll, onOther }) {
  const allPicked = options.length > 0 && options.every(option => selected.includes(option));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
          Specialties — {selected.length} of {options.length} picked
        </span>
        <button
          type="button"
          onClick={() => onSelectAll(allPicked ? [] : options)}
          disabled={options.length === 0}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-[11px] font-bold text-gray-700 transition hover:border-[#00a2ff] hover:text-[#00a2ff] disabled:opacity-40"
        >
          {allPicked ? 'Clear all' : 'Select all'}
        </button>
      </div>

      <div className="grid max-h-40 gap-1.5 overflow-y-auto sm:grid-cols-2">
        {options.map(option => {
          const isSelected = selected.includes(option);
          return (
            <button
              type="button"
              key={option}
              onClick={() => onToggle(option)}
              aria-pressed={isSelected}
              className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs font-semibold transition ${isSelected ? 'border-[#00a2ff] bg-[#00a2ff]/5 text-[#00a2ff]' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
            >
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${isSelected ? 'border-[#00a2ff] bg-[#00a2ff] text-white' : 'border-gray-300'}`}>
                {isSelected && <Check className="h-3 w-3" />}
              </span>
              <span className="min-w-0 flex-1 truncate">{option}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onOther}
        className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold transition ${selected.includes(OTHER_OPTION) ? 'border-[#00a2ff] text-[#00a2ff]' : 'border-gray-200 text-gray-700 hover:border-[#00a2ff] hover:text-[#00a2ff]'}`}
      >
        + Add a specialty we did not list
      </button>
      <p className="text-[11px] text-gray-400">Picking a specialty adds it to your services automatically.</p>
    </div>
  );
}