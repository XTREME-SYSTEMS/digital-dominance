import React, { useMemo, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { Field, inputCls } from './wizardFields';
import SubIndustryPicker from './SubIndustryPicker';
import ServiceDiscovery from './ServiceDiscovery';
import { INDUSTRY_OPTIONS, OTHER_OPTION, industryOption, industryLabel } from '@/data/industryCatalog';

export default function IndustryServices({ value, set }) {
  const [draft, setDraft] = useState('');
  const [otherDraft, setOtherDraft] = useState(value.sub_industry_other || '');
  const industry = industryOption(value.industry);
  const custom = value.custom_services || [];
  const specialties = value.sub_industries || [];

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

  // Picking a specialty puts that specialty straight into the services list.
  const addSpecialty = name => set({
    sub_industries: specialties.includes(name) ? specialties : [...specialties, name],
    sub_industry: name,
    services: selected.includes(name) ? selected : [...selected, name],
  });

  const removeSpecialty = name => {
    const next = specialties.filter(item => item !== name);
    set({ sub_industries: next, sub_industry: next[0] || '', services: selected.filter(item => item !== name) });
  };

  const toggleSpecialty = option => (specialties.includes(option) ? removeSpecialty(option) : addSpecialty(option));

  const selectAllSpecialties = list => set({
    sub_industries: list,
    sub_industry: list[0] || '',
    services: [...selected, ...list.filter(option => !selected.includes(option))],
  });

  const commitOther = () => {
    const name = otherDraft.trim();
    if (!name) return;
    if (value.sub_industry_other && value.sub_industry_other !== name) removeSpecialty(value.sub_industry_other);
    set({ sub_industry_other: name });
    addSpecialty(name);
  };

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

  // Services the AI assist found and the owner accepted.
  const addDiscovered = names => set({
    custom_services: [...custom, ...names.filter(name => !custom.includes(name))],
    discovered_services: [...new Set([...(value.discovered_services || []), ...names])],
    services: [...selected, ...names.filter(name => !selected.includes(name))],
  });

  return (
    <div className="space-y-3">
      <Field label="Industry">
        <select
          className={inputCls}
          value={value.industry}
          onChange={e => set({ industry: e.target.value, sub_industry: '', sub_industry_other: '', sub_industries: [], services: [], custom_services: [] })}
        >
          <option value="">Choose an industry…</option>
          {INDUSTRY_OPTIONS.map(option => <option key={option.key} value={option.key}>{option.label}</option>)}
          <option value={OTHER_OPTION}>Other — type my own</option>
        </select>
      </Field>

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

      {value.industry && value.industry !== OTHER_OPTION && (
        <SubIndustryPicker
          options={subOptions}
          selected={specialties}
          onToggle={toggleSpecialty}
          onSelectAll={selectAllSpecialties}
          onOther={() => set({ sub_industry: OTHER_OPTION })}
        />
      )}

      {(value.sub_industry === OTHER_OPTION || value.sub_industry_other) && (
        <Field label="Your specialty">
          <input
            className={inputCls}
            value={otherDraft}
            onChange={e => setOtherDraft(e.target.value)}
            onBlur={commitOther}
            onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); commitOther(); } }}
            placeholder="Type the specialty we did not list"
          />
        </Field>
      )}

      <Field
        label={`Services — ${selected.length} of ${options.length} selected`}
        hint="These become the service sections and pages on your site. Specialties you pick are added here automatically."
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

        <div className="mt-2">
          <ServiceDiscovery
            industry={value.industry === OTHER_OPTION ? value.industry_other : (industryLabel(value.industry) || value.industry)}
            subIndustries={specialties}
            services={selected}
            onAdd={addDiscovered}
          />
        </div>
      </Field>
    </div>
  );
}