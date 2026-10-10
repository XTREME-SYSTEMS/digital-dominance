import React, { useState } from "react";
import { Sparkles, MessageSquare, Layers, Globe, Rocket, Code2, ChevronDown } from "lucide-react";
import PipelineChat from "@/components/gpt-pipeline/PipelineChat";
import PipelineStages from "@/components/gpt-pipeline/PipelineStages";
import IndustryTemplateGrid from "@/components/gpt-pipeline/IndustryTemplateGrid";
import DominanceSelector from "@/components/gpt-pipeline/DominanceSelector";
import ProvisioningDashboard from "@/components/gpt-pipeline/ProvisioningDashboard";
import JsonConfigPanel from "@/components/gpt-pipeline/JsonConfigPanel";

const SECTIONS = [
  { id: "json", label: "JSON Config", icon: Code2 },
  { id: "chat", label: "GPT Chat", icon: MessageSquare },
  { id: "stages", label: "Pipeline Stages", icon: Sparkles },
  { id: "templates", label: "Industry Templates", icon: Layers },
  { id: "dominance", label: "Digital Dominance", icon: Globe },
  { id: "provisioning", label: "Provisioning", icon: Rocket },
];

export default function GptSyncPipeline() {
  const [chatPrompt, setChatPrompt] = useState("");

  const handleQuickAction = (prompt) => {
    setChatPrompt(prompt);
    document.getElementById("gpt-chat-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollTo = (id) => {
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-4 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-500" />
            GPT Sync Pipeline
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Bi-directional ChatGPT sync · Full creation-to-provisioning pipeline · Zero-restriction operator access
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-700">Vercel AI Gateway</span>
          </span>
          <span className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5">
            <MessageSquare className="h-3 w-3 text-amber-600" />
            <span className="text-xs font-bold text-amber-700">MCP Connected</span>
          </span>
        </div>
      </div>

      {/* Quick nav pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 px-1">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold text-stone-600 hover:border-amber-300 hover:text-amber-700 whitespace-nowrap transition"
          >
            <s.icon className="h-3.5 w-3.5" />
            {s.label}
          </button>
        ))}
      </div>

      {/* JSON Config */}
      <div id="section-json" className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-200 bg-stone-50">
          <Code2 className="h-5 w-5 text-amber-500" />
          <h2 className="text-sm font-bold text-stone-900">JSON Config — Copy to give to GPT</h2>
        </div>
        <div className="h-[600px]">
          <JsonConfigPanel />
        </div>
      </div>

      {/* GPT Chat */}
      <div id="section-chat" className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-200 bg-stone-50">
          <MessageSquare className="h-5 w-5 text-amber-500" />
          <h2 className="text-sm font-bold text-stone-900">GPT Bi-Directional Chat</h2>
        </div>
        <div id="gpt-chat-section" className="h-[600px]">
          <PipelineChat externalPrompt={chatPrompt} onPromptConsumed={() => setChatPrompt("")} />
        </div>
      </div>

      {/* Pipeline Stages */}
      <div id="section-stages" className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-200 bg-stone-50">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <h2 className="text-sm font-bold text-stone-900">Pipeline Stages</h2>
        </div>
        <PipelineStages onQuickAction={handleQuickAction} />
      </div>

      {/* Industry Templates */}
      <div id="section-templates" className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-200 bg-stone-50">
          <Layers className="h-5 w-5 text-amber-500" />
          <h2 className="text-sm font-bold text-stone-900">20 Top Industry Templates</h2>
        </div>
        <IndustryTemplateGrid onQuickAction={handleQuickAction} />
      </div>

      {/* Digital Dominance */}
      <div id="section-dominance" className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-200 bg-stone-50">
          <Globe className="h-5 w-5 text-amber-500" />
          <h2 className="text-sm font-bold text-stone-900">Digital Dominance</h2>
        </div>
        <DominanceSelector onQuickAction={handleQuickAction} />
      </div>

      {/* Provisioning */}
      <div id="section-provisioning" className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-200 bg-stone-50">
          <Rocket className="h-5 w-5 text-amber-500" />
          <h2 className="text-sm font-bold text-stone-900">Provisioning Dashboard</h2>
        </div>
        <ProvisioningDashboard onQuickAction={handleQuickAction} />
      </div>
    </div>
  );
}