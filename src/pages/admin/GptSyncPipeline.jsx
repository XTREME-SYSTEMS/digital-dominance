import React, { useState } from "react";
import { Sparkles, ChevronDown, Code2, Zap, Layers, Globe, Rocket, Send, Wand2 } from "lucide-react";
import PipelineRunner from "@/components/gpt-pipeline/PipelineRunner";
import SelfBuilderRunner from "@/components/gpt-pipeline/SelfBuilderRunner";
import JsonConfigPanel from "@/components/gpt-pipeline/JsonConfigPanel";
import SuperAgentsSection from "@/components/gpt-pipeline/SuperAgentsSection";
import IndustryTemplateGrid from "@/components/gpt-pipeline/IndustryTemplateGrid";
import DominanceSelector from "@/components/gpt-pipeline/DominanceSelector";
import ProvisioningDashboard from "@/components/gpt-pipeline/ProvisioningDashboard";
import IdeaFeed from "@/components/gpt-pipeline/IdeaFeed";

const QUICK_IDEAS = [
  "Build a website for a roofing company in Dallas, TX and deploy it to Vercel",
  "Create a complete digital presence for a med spa in Miami — website, brand, 30-day social calendar, 30 videos, and deploy",
  "Launch 50 programmatic websites for pest control across all major Florida cities with full SEO/AEO/GEO",
  "Build an epoxy garage floor website for Pompano Beach, brand it, deploy it, sync to Google, validate 3x, and email me the result",
  "Create a water damage restoration website with instant estimate funnel, deploy, and run digital dominance",
  "Build a complete HVAC company website + PWA, 30-day social with 30 videos, deploy to Vercel, sync Google, validate and email me",
];

export default function GptSyncPipeline() {
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedTab, setAdvancedTab] = useState("agents");
  const [mode, setMode] = useState("selfbuilder"); // "pipeline" | "selfbuilder"

  const launch = (text) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setSubmitted(msg);
    setInput("");
  };

  return (
    <div className="flex flex-col gap-4 pb-12 min-h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-500" />
            GPT Sync Pipeline
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Type what you want to build. GPT handles everything — research, branding, website, social, deployment, validation, and email.
          </p>
        </div>
        <div className="flex items-center gap-2">
        {/* Mode toggle */}
        <div className="flex items-center rounded-lg border border-stone-200 bg-white p-0.5">
          <button
            onClick={() => setMode("selfbuilder")}
            className={`rounded-md px-3 py-1 text-xs font-bold transition ${mode === "selfbuilder" ? "bg-amber-500 text-stone-900" : "text-stone-500 hover:text-stone-900"}`}
          >
            Self-Builder
          </button>
          <button
            onClick={() => setMode("pipeline")}
            className={`rounded-md px-3 py-1 text-xs font-bold transition ${mode === "pipeline" ? "bg-amber-500 text-stone-900" : "text-stone-500 hover:text-stone-900"}`}
          >
            Pipeline Chat
          </button>
        </div>
        <span className="flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-emerald-700">Vercel AI Gateway</span>
        </span>
        </div>
      </div>

      {/* Idea Proving Machine — tells you what to build */}
      {!submitted && (
        <IdeaFeed onBuildIdea={(prompt) => setSubmitted(prompt)} />
      )}

      {/* Main input — Manus-like */}
      {!submitted && (
        <div className="flex flex-col items-center justify-center gap-4 py-8 flex-1">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: "linear-gradient(135deg, #FFF6D5, #D4AF37, #8B6914)" }}>
            <Wand2 className="h-8 w-8 text-stone-900" />
          </div>
          <div className="w-full max-w-2xl">
            <div className="rounded-2xl border-2 border-stone-200 bg-white p-4 shadow-sm focus-within:border-amber-400 transition">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    launch();
                  }
                }}
                placeholder="Describe what you want to build... e.g. 'Build a roofing website for Dallas, deploy it, sync Google, validate 3x, and email me the result'"
                rows={3}
                className="w-full resize-none border-0 bg-transparent text-base text-stone-900 placeholder-stone-400 outline-none"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-stone-400">Press Enter to launch · Shift+Enter for new line</span>
                <button
                  onClick={() => launch()}
                  disabled={!input.trim()}
                  className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2 text-sm font-bold text-stone-900 disabled:opacity-50 hover:bg-amber-400 transition"
                >
                  <Send className="h-4 w-4" />
                  Launch Pipeline
                </button>
              </div>
            </div>
          </div>
          {/* Quick ideas */}
          <div className="w-full max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400 mb-2 text-center">Quick Start</p>
            <div className="flex flex-col gap-1.5">
              {QUICK_IDEAS.map((idea, i) => (
                <button
                  key={i}
                  onClick={() => launch(idea)}
                  className="text-left rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 transition"
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Runner — appears after submission (mode-dependent) */}
      {submitted && mode === "selfbuilder" && (
        <div className="flex-1 min-h-[600px] h-[calc(100vh-180px)]">
          <SelfBuilderRunner initialPrompt={submitted} onConsumed={() => setSubmitted(null)} />
        </div>
      )}
      {submitted && mode === "pipeline" && (
        <div className="flex-1 min-h-[600px] h-[calc(100vh-180px)]">
          <PipelineRunner initialMessage={submitted} onConsumed={() => setSubmitted(null)} />
        </div>
      )}

      {/* Advanced sections — collapsible */}
      <div className="border-t border-stone-200 pt-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm font-bold text-stone-500 hover:text-stone-900 transition"
        >
          <ChevronDown className={`h-4 w-4 transition ${showAdvanced ? "rotate-180" : ""}`} />
          Advanced — Tools, Templates & Config
        </button>
        {showAdvanced && (
          <div className="mt-4 flex flex-col gap-4">
            {/* Advanced tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: "agents", label: "Super Agents", icon: Zap },
                { id: "templates", label: "Industry Templates", icon: Layers },
                { id: "dominance", label: "Digital Dominance", icon: Globe },
                { id: "provisioning", label: "Provisioning", icon: Rocket },
                { id: "json", label: "JSON Config", icon: Code2 },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setAdvancedTab(t.id)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold whitespace-nowrap transition ${
                    advancedTab === t.id
                      ? "bg-amber-500 text-stone-900 border-amber-500"
                      : "bg-white border-stone-200 text-stone-600 hover:border-amber-300"
                  }`}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Advanced content */}
            {advancedTab === "agents" && (
              <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
                <SuperAgentsSection onQuickAction={(p) => { setSubmitted(null); setTimeout(() => setSubmitted(p), 50); }} />
              </div>
            )}
            {advancedTab === "templates" && (
              <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
                <IndustryTemplateGrid onQuickAction={(p) => { setSubmitted(null); setTimeout(() => setSubmitted(p), 50); }} />
              </div>
            )}
            {advancedTab === "dominance" && (
              <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
                <DominanceSelector onQuickAction={(p) => { setSubmitted(null); setTimeout(() => setSubmitted(p), 50); }} />
              </div>
            )}
            {advancedTab === "provisioning" && (
              <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
                <ProvisioningDashboard onQuickAction={(p) => { setSubmitted(null); setTimeout(() => setSubmitted(p), 50); }} />
              </div>
            )}
            {advancedTab === "json" && (
              <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden h-[600px]">
                <JsonConfigPanel />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}