import React, { useState } from "react";
import { Crown, Check, Rocket } from "lucide-react";
import { Link } from "react-router-dom";
import IndustryPicker from "@/components/site-builder/IndustryPicker";
import BrandingStudio from "@/components/site-builder/BrandingStudio";
import ContentStudio from "@/components/site-builder/ContentStudio";
import UrlFinder from "@/components/site-builder/UrlFinder";
import PipelineLauncher from "@/components/site-builder/PipelineLauncher";

const STEPS = [
  { id: 1, label: "Industry", icon: Crown },
  { id: 2, label: "Branding", icon: Crown },
  { id: 3, label: "Content", icon: Crown },
  { id: 4, label: "URL", icon: Crown },
  { id: 5, label: "Preview Build", icon: Crown },
];

export default function UniversalSiteBuilder() {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    industry: null,
    businessName: "",
    accentColor: "#D4AF37",
    accentName: "Amber Gold",
    logoUrl: null,
    city: "",
    state: "",
    domain: null,
    content: null,
  });

  const update = (partial) => setConfig((prev) => ({ ...prev, ...partial }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-stone-950 p-6 flex items-center gap-5">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center shadow-lg shrink-0">
          <Crown className="h-8 w-8 text-stone-950" />
        </div>
        <div>
          <div className="text-[10px] font-bold tracking-[0.2em] text-amber-500 uppercase">Universal Site Builder</div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">Governed Website Preview Factory</h1>
          <p className="text-sm text-stone-400 mt-1">
            Pick an industry → customize branding → generate content → evaluate a URL → compile a branch-safe preview BuildPacket
          </p>
        </div>
        <Link to="/admin/dominance-sandbox" className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 text-sm font-semibold hover:bg-amber-500/30 transition-colors shrink-0">
          <Rocket className="h-4 w-4" /> Dominance Sandbox
        </Link>
      </div>

      {/* Step Progress */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const isActive = step === s.id;
          const isDone = step > s.id;
          return (
            <React.Fragment key={s.id}>
              <button
                onClick={() => {
                  // Allow jumping back to completed steps, or forward if prerequisites met
                  if (s.id < step) setStep(s.id);
                  else if (s.id === step + 1 && canAdvance(step, config)) setStep(s.id);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition ${
                  isActive
                    ? "border-amber-500 bg-amber-50"
                    : isDone
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-stone-200 bg-white"
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  isActive ? "bg-amber-500 text-stone-950" : isDone ? "bg-emerald-500 text-white" : "bg-stone-200 text-stone-500"
                }`}>
                  {isDone ? <Check className="h-4 w-4" /> : s.id}
                </div>
                <span className={`text-sm font-bold ${isActive ? "text-amber-700" : isDone ? "text-emerald-700" : "text-stone-500"}`}>
                  {s.label}
                </span>
              </button>
              {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 ${isDone ? "bg-emerald-300" : "bg-stone-200"}`} />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content */}
      {step === 1 && <IndustryPicker config={config} update={update} onNext={() => setStep(2)} />}
      {step === 2 && <BrandingStudio config={config} update={update} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
      {step === 3 && <ContentStudio config={config} update={update} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
      {step === 4 && <UrlFinder config={config} update={update} onNext={() => setStep(5)} onBack={() => setStep(3)} />}
      {step === 5 && <PipelineLauncher config={config} update={update} onBack={() => setStep(4)} />}
    </div>
  );
}

function canAdvance(currentStep, config) {
  if (currentStep === 1) return !!config.industry && !!config.businessName.trim();
  if (currentStep === 2) return !!config.accentColor;
  if (currentStep === 3) return !!config.content;
  if (currentStep === 4) return !!config.domain;
  return true;
}