import React from 'react';
import { UserCog, PencilRuler, Sparkles, Wand2, ShieldCheck, Rocket, Check, ChevronRight } from 'lucide-react';
import { OPTIMIZER_GROUPS, toolsForGroup } from '@/data/siteOptimizerTools';

const GROUP_ICONS = {
  fit: UserCog,
  edit: PencilRuler,
  enhance: Sparkles,
  generate: Wand2,
  validate: ShieldCheck,
  upgrade: Rocket,
};

/** The left menu: every technology, grouped by what it does to the website. */
export default function OptimizerMenu({ onSelect, appliedFixes = [] }) {
  return (
    <nav aria-label="Website technologies" className="space-y-4">
      {OPTIMIZER_GROUPS.map(group => {
        const Icon = GROUP_ICONS[group.id] || Sparkles;
        const tools = toolsForGroup(group.id);
        return (
          <section key={group.id}>
            <h3 className="mb-1.5 flex items-center gap-2 px-2 text-[10px] font-black uppercase tracking-wider text-gray-400">
              <Icon className="h-3.5 w-3.5 text-[#00a2ff]" aria-hidden="true" /> {group.label}
            </h3>
            <ul className="space-y-0.5">
              {tools.map(tool => (
                <li key={tool.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(tool)}
                    className="group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-[#00a2ff]/8"
                  >
                    <span className="min-w-0 flex-1 truncate text-xs font-bold text-gray-700 group-hover:text-[#0a1220]">{tool.label}</span>
                    {tool.kind === 'fix' && appliedFixes.includes(tool.fix) && (
                      <Check className="h-3 w-3 shrink-0 text-green-600" aria-label="Already applied" />
                    )}
                    <ChevronRight className="h-3 w-3 shrink-0 text-gray-300 group-hover:text-[#00a2ff]" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </nav>
  );
}