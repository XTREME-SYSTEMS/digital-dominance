import React, { useMemo, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { Field, inputCls } from './wizardFields';
import { INDUSTRY_OPTIONS, OTHER_OPTION, industryOption } from '@/data/industryCatalog';

export default function IndustryServices({ value, set }) {
  const [draft, setDraft] = useState('');
  const industry = industryOption(value.industry);
  const custom = value.custom_services || [];

  const options = useMemo(() => {
    const listed = value.industry === OTHER_OPTION ? [] : (industry?.services || []);
    return [...listed, ...custom];
  }, [industry, value.industry, custom]);

  const selected = value.services || [];
  const allSelected = options.length > 0 && options.every(service => selected.includes(service));
  const subOptions = value.industry === OTHER_OPTION ? [] : (industry?.sub_industries || []);

  const toggle = service => set({
    services: selected.includes(service) ? selected.filter(item => item !== service) : [...selected, service],
  });

  const addDraft = () => {
    const name = draft.trim();
    if (!name || options.includes(name)) return;
    set({ custom_services: [...custom, name], services: [...selected, name] });
    setDraft('');
  };

  const dropCustom = name => set({
    custom_services: custom.filter(item => item !== name),
    services: selected.filter(item => item !== name),
  });

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Industry">
          <select
            className={inputCls}
            value={value.industry}
            onChange={e => set({ industry: e.target.value, sub_industry: '', sub_industry_other: '', services: [], custom_services: [] })}
          >
            <option value="">Choose an industry…</option>
            {INDUSTRY_OPTIONS.map(option => <option key={option.key} value={option.key}>{option.label}</option>)}
            <option value={OTHER_OPTION}>Other — type my own</option>
          </select>
        </Field>

        <Field label="Sub-industry / specialty">
          <select
            className={inputCls}
            value={value.sub_industry}
            onChange={e => set({ sub_industry: e.target.value })}
          >
            <option value="">Choose a specialty…</option>
            {subOptions.map(option => <option key={option} value={option}>{option}</option>)}
            <option value={OTHER_OPTION}>Other — type my own</option>
          </select>
        </Field>
      </div>

      {value.industry === OTHER_OPTION && (
        <Field label="Your industry">
          <input
            className={inputCls}
            value={value.industry_other}
            onChange={e => set({ industry_other: e.target.value })}
            placeholder="Type the industry we did not list"
          />
        </Field>
      )}

      {value.sub_industry === OTHER_OPTION && (
        <Field label="Your specialty">
          <input
            className={inputCls}
            value={value.sub_industry_other}
            onChange={e => set({ sub_industry_other: e.target.value })}
            placeholder="Type the specialty we did not list"
          />
        </Field>
      )}

      <Field
        label={`Services — ${selected.length} of ${options.length} selected`}
        hint="These become the service sections and pages on your site. Add anything we did not list."
      >
        <div className="mb-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => set({ services: allSelected ? [] : options })}
            disabled={options.length === 0}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-[11px] font-bold text-gray-700 transition hover:border-[#00a2ff] hover:text-[#00a2ff] disabled:opacity-40"
          >
            {allSelected ? 'Clear all' : 'Select all'}
          </button>
          {options.length === 0 && <span className="text-[11px] text-gray-400">Pick an industry to see its traditional services.</span>}
        </div>

        <div className="grid max-h-56 gap-1.5 overflow-y-auto sm:grid-cols-2">
          {options.map(service => {
            const isSelected = selected.includes(service);
            const isCustom = custom.includes(service);
            return (
              <button
                type="button"
                key={service}
                onClick={() => toggle(service)}
                aria-pressed={isSelected}
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs font-semibold transition ${isSelected ? 'border-[#00a2ff] bg-[#00a2ff]/5 text-[#00a2ff]' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
              >
                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${isSelected ? 'border-[#00a2ff] bg-[#00a2ff] text-white' : 'border-gray-300'}`}>
                  {isSelected && <Check className="h-3 w-3" />}
                </span>
                <span className="min-w-0 flex-1 truncate">{service}</span>
                {isCustom && (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Remove ${service}`}
                    onClick={event => { event.stopPropagation(); dropCustom(service); }}
                    onKeyDown={event => { if (event.key === 'Enter') { event.stopPropagation(); dropCustom(service); } }}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex gap-2">
          <input
            className={inputCls}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addDraft(); } }}
            placeholder="Add a service we did not list"
          />
          <button
            type="button"
            onClick={addDraft}
            disabled={!draft.trim()}
            className="flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 transition hover:border-[#00a2ff] hover:text-[#00a2ff] disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </Field>
    </div>
  );
}