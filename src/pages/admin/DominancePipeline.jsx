import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Crown, Eye, Brain, Code2, Globe, Rocket, Check, ChevronRight, Rocket as RocketIcon } from 'lucide-react';
import VisionStage from '@/components/dominance-pipeline/VisionStage';
import StrategyStage from '@/components/dominance-pipeline/StrategyStage';
import BuildStage from '@/components/dominance-pipeline/BuildStage';
import ProvisionStage from '@/components/dominance-pipeline/ProvisionStage';
import LaunchStage from '@/components/dominance-pipeline/LaunchStage';

const STAGES = [
  { id: 0, key: 'vision', label: 'Vision', icon: Eye, desc: 'Define the domination vision' },
  { id: 1, key: 'strategy', label: 'Strategy', icon: Brain, desc: 'AI-generated strategic plan' },
  { id: 2, key: 'build', label: 'Programmatic Build', icon: Code2, desc: 'Google-standard website template' },
  { id: 3, key: 'provision', label: 'Google Provisioning', icon: Globe, desc: 'Analytics, Search Console, indexing' },
  { id: 4, key: 'launch', label: 'Mass Launch', icon: Rocket, desc: '350+ strategically different sites' },
];

export default function DominancePipeline() {
  const location = useLocation();
  const launchSelection = location.state?.fromLaunchEngine ? location.state : null;
  const [stage, setStage] = useState(launchSelection ? 2 : 0);
  const [data, setData] = useState({
    vision: null,
    strategy: null,
    build: launchSelection ? {
      industry: launchSelection.industry,
      template: launchSelection.template,
      locationCount: launchSelection.locationCount,
      markets: launchSelection.locations || "Nationwide",
      source: "launch-engine",
    } : null,
    provision: null,
    launch: null,
  });

  const update = (key, value) => setData((prev) => ({ ...prev, [key]: value }));
  const advance = () => setStage((s) => Math.min(s + 1, STAGES.length - 1));
  const goBack = () => setStage((s) => Math.max(s - 1, 0));

  const Current = {
    vision: VisionStage,
    strategy: StrategyStage,
    build: BuildStage,
    provision: ProvisionStage,
    launch: LaunchStage,
  }[STAGES[stage].key];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-stone-950 via-amber-950 to-stone-900 p-6 text-white border border-amber-500/30">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 grid place-items-center">
            <Crown className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-extrabold tracking-tight">Digital Domination Pipeline</h1>
            <p className="text-stone-400 text-sm">Vision → Strategy → Programmatic Build → Google Provisioning → 350+ Site Launch</p>
          </div>
          {launchSelection && (
            <div className="flex items-center gap-2 rounded-xl bg-[#00a2ff]/15 border border-[#00a2ff]/30 px-3 py-2">
              <RocketIcon className="h-4 w-4 text-[#00a2ff]" />
              <div className="text-xs">
                <p className="font-bold text-[#00a2ff]">From Launch Engine</p>
                <p className="text-white/70">{launchSelection.industry} · {launchSelection.template} · {launchSelection.locationCount} sites</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {STAGES.map((s, i) => {
          const Icon = s.icon;
          const done = i < stage;
          const active = i === stage;
          return (
            <React.Fragment key={s.id}>
              <button
                onClick={() => setStage(i)}
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-all shrink-0 ${
                  active
                    ? 'border-amber-500 bg-amber-50'
                    : done
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
                  active ? 'bg-amber-500 text-white' : done ? 'bg-emerald-500 text-white' : 'bg-stone-100 text-stone-400'
                }`}>
                  {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <div className="text-left hidden sm:block">
                  <p className={`text-xs font-bold ${active ? 'text-amber-700' : done ? 'text-emerald-700' : 'text-stone-500'}`}>
                    Step {i + 1}
                  </p>
                  <p className={`text-sm font-semibold ${active ? 'text-stone-900' : 'text-stone-600'}`}>{s.label}</p>
                </div>
              </button>
              {i < STAGES.length - 1 && (
                <ChevronRight className="h-4 w-4 text-stone-300 shrink-0 hidden sm:block" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Stage description */}
      <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5">
        <p className="text-sm text-stone-600">
          <span className="font-bold text-stone-800">{STAGES[stage].label}:</span> {STAGES[stage].desc}
        </p>
      </div>

      {/* Current stage */}
      <Current data={data[STAGES[stage].key]} onUpdate={(v) => update(STAGES[stage].key, v)} onAdvance={advance} onBack={goBack} allData={data} />

      {/* Nav buttons */}
      <div className="flex justify-between pt-2">
        <button
          onClick={goBack}
          disabled={stage === 0}
          className="rounded-xl border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Back
        </button>
        {stage < STAGES.length - 1 && (
          <button
            onClick={advance}
            className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-stone-900 hover:bg-amber-400"
          >
            Next: {STAGES[stage + 1].label} →
          </button>
        )}
      </div>
    </div>
  );
}