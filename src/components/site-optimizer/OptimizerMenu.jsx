import React from 'react';
import { UserCog, PencilRuler, Sparkles, Wand2, ShieldCheck, Rocket, Check, ChevronRight, Zap } from 'lucide-react';
import { OPTIMIZER_GROUPS, toolsForGroup } from '@/data/siteOptimizerTools';

const GROUP_ICONS = {
  flow: Zap,
  fit: UserCog,
  edit: PencilRuler,
  enhance: Sparkles,
  generate: Wand2,
  validate: ShieldCheck,
  upgrade: Rocket,
};

/**
 * The left menu — black, and read top down: the transformer, the tool and the
 * generator that make the page come first, then the tools that edit it, then the
 * ones that validate and launch it. Every section is numbered so the order is
 * on the screen, not in your head.
 */
export default function OptimizerMenu({ onSelect, appliedFixes = [] }) {
  return (
    <nav aria-label="Website technologies" className="space-y-5">
      {OPTIMIZER_GROUPS.map((group, index) => {
        const Icon = GROUP_ICONS[group.id] || Sparkles;
        const tools = toolsForGroup(group.id);
        return (
          <section key={group.id}>
            <h3 className="mb-1.5 flex items-center gap-2 px-2 text-[10px] font-black uppercase tracking-wider text-white/40">
              <Icon className="h-3.5 w-3.5 shrink-0 text-[#00a2ff]" aria-hidden="true" />
              <span className="text-white/25">{String(index + 1).padStart(2, '0')}</span>
              {group.label}
            </h3>
            <ul className="space-y-0.5">
              {tools.map(tool => (
                <li key={tool.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(tool)}
                    className="group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-white/10"
                  >
                    <span className="min-w-0 flex-1 truncate text-xs font-bold text-white/80 group-hover:text-white">{tool.label}</span>
                    {tool.kind === 'fix' && appliedFixes.includes(tool.fix) && (
                      <Check className="h-3 w-3 shrink-0 text-emerald-400" aria-label="Already applied" />
                    )}
                    <ChevronRight className="h-3 w-3 shrink-0 text-white/25 group-hover:text-[#00a2ff]" aria-hidden="true" />
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