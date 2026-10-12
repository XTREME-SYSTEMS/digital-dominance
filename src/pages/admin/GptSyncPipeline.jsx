import React, { useState } from "react";
import { Sparkles, ChevronDown, Code2, Zap, Layers, Globe, Rocket, Send, Wand2, Phone } from "lucide-react";
import PipelineRunner from "@/components/gpt-pipeline/PipelineRunner";
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

  const launch = (text) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setSubmitted(msg);
    setInput("");
  };

  return (
    <div className="flex flex-col gap-4 pb-12 min-h-[calc(100vh-64px)] text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#00a2ff] to-[#0066cc]">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            GPT Sync Pipeline
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Type what you want to build. GPT handles everything — research, branding, website, social, deployment, validation, and email.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-lg bg-[#00a2ff]/10 border border-[#00a2ff]/30 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-[#00a2ff] animate-pulse" />
            <span className="text-xs font-bold text-[#00a2ff]">Vercel AI Gateway</span>
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
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00a2ff] to-[#0066cc] shadow-[0_0_30px_rgba(0,162,255,0.4)]">
            <Wand2 className="h-8 w-8 text-white" />
          </div>
          <div className="w-full max-w-2xl">
            <div className="rounded-2xl border-2 border-white/10 bg-[#0d1525] p-4 shadow-lg focus-within:border-[#00a2ff]/50 transition">
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
                className="w-full resize-none border-0 bg-transparent text-base text-white placeholder-white/30 outline-none"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-white/30">Press Enter to launch · Shift+Enter for new line</span>
                <button
                  onClick={() => launch()}
                  disabled={!input.trim()}
                  className="flex items-center gap-2 rounded-xl bg-[#00a2ff] px-5 py-2 text-sm font-bold text-white disabled:opacity-50 hover:bg-[#0090e0] transition shadow-[0_0_20px_rgba(0,162,255,0.3)]"
                >
                  <Send className="h-4 w-4" />
                  Launch Pipeline
                </button>
              </div>
            </div>
          </div>
          {/* Quick ideas */}
          <div className="w-full max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-wide text-white/30 mb-2 text-center">Quick Start</p>
            <div className="flex flex-col gap-1.5">
              {QUICK_IDEAS.map((idea, i) => (
                <button
                  key={i}
                  onClick={() => launch(idea)}
                  className="text-left rounded-xl border border-white/10 bg-[#0d1525] px-4 py-2.5 text-sm text-white/60 hover:border-[#00a2ff]/50 hover:bg-[#00a2ff]/5 hover:text-white transition"
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pipeline Runner — appears after submission */}
      {submitted && (
        <div className="flex-1 min-h-[600px] h-[calc(100vh-180px)]">
          <PipelineRunner initialMessage={submitted} onConsumed={() => setSubmitted(null)} />
        </div>
      )}

      {/* Advanced sections — collapsible */}
      <div className="border-t border-white/10 pt-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm font-bold text-white/50 hover:text-white transition"
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
                      ? "bg-[#00a2ff] text-white border-[#00a2ff]"
                      : "bg-[#0d1525] border-white/10 text-white/60 hover:border-[#00a2ff]/50"
                  }`}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Advanced content */}
            {advancedTab === "agents" && (
              <div className="rounded-2xl border border-white/10 bg-[#0d1525] overflow-hidden">
                <SuperAgentsSection onQuickAction={(p) => { setSubmitted(null); setTimeout(() => setSubmitted(p), 50); }} />
              </div>
            )}
            {advancedTab === "templates" && (
              <div className="rounded-2xl border border-white/10 bg-[#0d1525] overflow-hidden">
                <IndustryTemplateGrid onQuickAction={(p) => { setSubmitted(null); setTimeout(() => setSubmitted(p), 50); }} />
              </div>
            )}
            {advancedTab === "dominance" && (
              <div className="rounded-2xl border border-white/10 bg-[#0d1525] overflow-hidden">
                <DominanceSelector onQuickAction={(p) => { setSubmitted(null); setTimeout(() => setSubmitted(p), 50); }} />
              </div>
            )}
            {advancedTab === "provisioning" && (
              <div className="rounded-2xl border border-white/10 bg-[#0d1525] overflow-hidden">
                <ProvisioningDashboard onQuickAction={(p) => { setSubmitted(null); setTimeout(() => setSubmitted(p), 50); }} />
              </div>
            )}
            {advancedTab === "json" && (
              <div className="rounded-2xl border border-white/10 bg-[#0d1525] overflow-hidden h-[600px]">
                <JsonConfigPanel />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}