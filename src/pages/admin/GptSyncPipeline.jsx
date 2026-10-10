import React, { useState } from "react";
import { Sparkles, MessageSquare, Layers, Globe, Rocket } from "lucide-react";
import PipelineChat from "@/components/gpt-pipeline/PipelineChat";
import PipelineStages from "@/components/gpt-pipeline/PipelineStages";
import IndustryTemplateGrid from "@/components/gpt-pipeline/IndustryTemplateGrid";
import DominanceSelector from "@/components/gpt-pipeline/DominanceSelector";
import ProvisioningDashboard from "@/components/gpt-pipeline/ProvisioningDashboard";

const TABS = [
  { id: "stages", label: "Pipeline Stages", icon: Sparkles },
  { id: "templates", label: "Industry Templates", icon: Layers },
  { id: "dominance", label: "Digital Dominance", icon: Globe },
  { id: "provisioning", label: "Provisioning", icon: Rocket },
];

export default function GptSyncPipeline() {
  const [tab, setTab] = useState("stages");
  const [chatPrompt, setChatPrompt] = useState("");

  const handleQuickAction = (prompt) => {
    setChatPrompt(prompt);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] gap-0">
      {/* Header */}
      <div className="flex items-center justify-between px-1 pb-4">
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

      {/* Main split: Chat (left) + Panel (right) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4 min-h-0">
        {/* LEFT — Full-height chat */}
        <div className="min-h-0 rounded-2xl border border-stone-200 bg-white overflow-hidden flex flex-col">
          <PipelineChat externalPrompt={chatPrompt} onPromptConsumed={() => setChatPrompt("")} />
        </div>

        {/* RIGHT — Tabbed panel */}
        <div className="min-h-0 rounded-2xl border border-stone-200 bg-white overflow-hidden flex flex-col">
          {/* Tab bar */}
          <div className="flex border-b border-stone-200 bg-stone-50">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-3 text-xs font-bold transition-colors ${
                  tab === t.id
                    ? "text-amber-600 border-b-2 border-amber-500 bg-white"
                    : "text-stone-500 hover:text-stone-700 border-b-2 border-transparent"
                }`}
              >
                <t.icon className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {tab === "stages" && <PipelineStages onQuickAction={handleQuickAction} />}
            {tab === "templates" && <IndustryTemplateGrid onQuickAction={handleQuickAction} />}
            {tab === "dominance" && <DominanceSelector onQuickAction={handleQuickAction} />}
            {tab === "provisioning" && <ProvisioningDashboard onQuickAction={handleQuickAction} />}
          </div>
        </div>
      </div>
    </div>
  );
}