import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bot, Clock, Loader2, CheckCircle2, AlertCircle, Zap, RefreshCw,
  Globe, FileText, Workflow, Layers, Activity, Cpu,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import AdminSystemPage from "@/components/launch-engine-admin/AdminSystemPage";

export default function BackgroundOperations() {
  const queryClient = useQueryClient();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const { data: templates = [] } = useQuery({
    queryKey: ["bg-ops-templates"],
    queryFn: async () => {
      const page = await base44.entities.TemplateLibrary.filter({ is_active: true }, { limit: 1 });
      return page.items || [];
    },
  });

  const { data: prompts = [] } = useQuery({
    queryKey: ["bg-ops-prompts"],
    queryFn: async () => {
      const page = await base44.entities.PromptLibrary.filter({ is_active: true }, { limit: 1 });
      return page.items || [];
    },
  });

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke("backgroundOperationsManager", {});
      setResult(res?.data?.summary || null);
      queryClient.invalidateQueries({ queryKey: ["bg-ops-templates"] });
      queryClient.invalidateQueries({ queryKey: ["bg-ops-prompts"] });
    } catch (e) {
      setError(e.message || "Failed to run background operations");
    } finally {
      setRunning(false);
    }
  };

  return (
    <AdminSystemPage
      eyebrow="AUTONOMOUS OPERATIONS · 24/7"
      title="Background Operations Manager"
      description="The autonomous agent that keeps all operational systems functioning, organized, and updated — template routing, pipeline progression, stale record cleanup, and workflow health. Runs every 6 hours automatically."
      badge="◈ AUTONOMOUS"
      stats={[
        ["Schedule", "Every 6h"],
        ["Templates tracked", "200+"],
        ["Pipeline stages", "5"],
        ["Auto-repair", "ON"],
      ]}
    >
      {/* Agent status banner */}
      <div className="rounded-lg border border-[#dce6f1] bg-gradient-to-r from-[#f8fbfe] to-[#f0f7ff] p-4 mb-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg grid place-items-center bg-[#126fc8]/10 text-[#126fc8]">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#112940] flex items-center gap-2">
                Background Operations Agent
                <span className="flex items-center gap-1 text-[10px] font-bold text-[#16a34a] bg-green-50 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse" /> RUNNING
                </span>
              </p>
              <p className="text-xs text-[#607790] flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3 h-3" /> Cron: every 6 hours · Next run auto-scheduled
              </p>
            </div>
          </div>
          <button
            onClick={handleRun}
            disabled={running}
            className="flex items-center gap-2 px-4 h-9 rounded-lg bg-[#126fc8] text-white text-xs font-bold hover:bg-[#0d58a8] disabled:opacity-50 transition"
          >
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            {running ? "Running..." : "Run Now"}
          </button>
        </div>
        {error && (
          <div className="mt-3 flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg p-2.5">
            <AlertCircle className="w-3.5 h-3.5" /> {error}
          </div>
        )}
        {result && (
          <div className="mt-3 pt-3 border-t border-[#dce6f1]">
            <p className="text-xs font-bold text-[#112940] mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#16a34a]" /> Last Run Result
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <ResultStat icon={FileText} label="Templates Routed" value={result.templates_routed} color="#126fc8" />
              <ResultStat icon={Layers} label="Templates Fixed" value={result.templates_fixed} color="#7c3aed" />
              <ResultStat icon={AlertCircle} label="Stale Flagged" value={result.stale_records_flagged} color="#d97706" />
              <ResultStat icon={Activity} label="Pipeline Progressed" value={result.pipeline_progressed} color="#16a34a" />
            </div>
            {result.issues_found?.length > 0 && (
              <div className="mt-2 space-y-1">
                {result.issues_found.map((issue, i) => (
                  <p key={i} className="text-xs text-[#d97706] flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3" /> {issue}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* What the agent does */}
      <div className="grid md:grid-cols-2 gap-3 mb-4">
        <AgentTask
          icon={FileText}
          title="Template Routing"
          description="Ensures all TemplateLibrary records have valid slugs, correct categories, proper status, and are routed to the correct deployment pipeline."
          color="#126fc8"
        />
        <AgentTask
          icon={Layers}
          title="System Organization"
          description="Audits entity records for stale or stuck data, resets records that have been in transitional states too long, and maintains inventory consistency."
          color="#7c3aed"
        />
        <AgentTask
          icon={Activity}
          title="Pipeline Progression"
          description="Moves queued WebsiteQueue and AppBuild records through their status pipeline — queued → researching → generating → deploying → live."
          color="#16a34a"
        />
        <AgentTask
          icon={Workflow}
          title="Workflow Health"
          description="Monitors active MassLaunchBatch records, flags stalled batches, and ensures the deployment workflow continues operating correctly."
          color="#d97706"
        />
      </div>

      {/* Cron schedule info */}
      <div className="rounded-lg border border-[#dce6f1] bg-white p-4">
        <h3 className="text-sm font-bold text-[#112940] mb-3 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#126fc8]" /> Autonomous Cron Schedule
        </h3>
        <div className="space-y-2">
          <CronRow name="Background Operations Manager" schedule="Every 6 hours" cron="0 */6 * * *" status="active" />
          <CronRow name="Automated Prompt Tester" schedule="Every 12 hours" cron="0 */12 * * *" status="active" />
          <CronRow name="Autonomous Visual Orchestrator" schedule="Every 6 hours" cron="0 */6 * * *" status="active" />
          <CronRow name="Daily Site Validation" schedule="Daily at 9am" cron="0 9 * * *" status="active" />
        </div>
      </div>
    </AdminSystemPage>
  );
}

function ResultStat({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-white border border-[#e4edf5] px-3 py-2">
      <div className="w-7 h-7 rounded-lg grid place-items-center shrink-0" style={{ background: color + "15", color }}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div>
        <p className="text-base font-extrabold text-[#112940] leading-none">{value}</p>
        <p className="text-[9px] text-[#607790] mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function AgentTask({ icon: Icon, title, description, color }) {
  return (
    <div className="rounded-lg border border-[#dce6f1] bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg grid place-items-center shrink-0" style={{ background: color + "15", color }}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#112940]">{title}</p>
          <p className="text-xs text-[#607790] mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

function CronRow({ name, schedule, cron, status }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#e4edf5] last:border-0">
      <div className="flex items-center gap-3">
        <span className={`w-2 h-2 rounded-full ${status === "active" ? "bg-[#16a34a] animate-pulse" : "bg-gray-300"}`} />
        <div>
          <p className="text-xs font-bold text-[#112940]">{name}</p>
          <p className="text-[10px] text-[#8faec9] font-mono">{cron}</p>
        </div>
      </div>
      <span className="text-xs text-[#607790] font-bold">{schedule}</span>
    </div>
  );
}