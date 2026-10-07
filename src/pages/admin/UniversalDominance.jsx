import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Crown, Sparkles, Zap, Globe, Bot, Network, Activity, Database,
  Server, RefreshCw, Play, ArrowRight, CheckCircle2, AlertCircle,
  Layers, Rocket, TrendingUp, Film, Share2, Cpu, Brain, Eye,
} from "lucide-react";

const LAYER_ICONS = {
  L1_INTELLIGENCE: Activity,
  L2_TEMPLATES: Layers,
  L3_GENERATION: Cpu,
  L4_PROVISIONING: Server,
  L5_SOCIAL: Share2,
  L6_ANALYTICS: TrendingUp,
  L7_ORCHESTRATION: Crown,
};

export default function UniversalDominance() {
  const queryClient = useQueryClient();
  const [running, setRunning] = useState(null);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ["universal-dominance-status"],
    queryFn: () => base44.functions.invoke("universalDominanceEngine", { action: "get_status" })
      .then((r) => r.data),
    refetchInterval: 15000,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["universal-templates"],
    queryFn: () => base44.entities.UniversalIndustryTemplate.list("-created_date", 100),
  });

  const runAction = async (action, payload = {}) => {
    setRunning(action);
    setResult(null);
    try {
      const res = await base44.functions.invoke("universalDominanceEngine", { action, ...payload });
      setResult(res.data);
      queryClient.invalidateQueries({ queryKey: ["universal-dominance-status"] });
      queryClient.invalidateQueries({ queryKey: ["universal-templates"] });
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setRunning(null);
    }
  };

  const layers = status?.layers || {};
  const totals = status?.totals || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
          <Crown className="h-7 w-7 text-amber-500" /> Universal Dominance Engine
        </h1>
        <p className="text-stone-500 mt-1">
          Fully autonomous, end-to-end system. Builds, provisions, and scales unlimited online presences across every industry — deterministically, while you sleep.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200">
        {[
          { id: "overview", label: "System Overview", icon: Activity },
          { id: "autonomous", label: "Autonomous Loop", icon: Play },
          { id: "templates", label: "Industry Templates", icon: Layers },
          { id: "sync", label: "Sync & Providers", icon: RefreshCw },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition -mb-px ${
              activeTab === tab.id ? "border-amber-500 text-amber-600" : "border-transparent text-stone-500 hover:text-stone-700"
            }`}
          >
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* === OVERVIEW === */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* 7 Layer Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(layers).map(([layerId, info]) => {
              const Icon = LAYER_ICONS[layerId] || Activity;
              return (
                <div key={layerId} className="rounded-xl border border-stone-200 bg-white p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 grid place-items-center">
                      <Icon className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-stone-900">{layerId.replace("_", " ")}</h3>
                      <span className={`text-[10px] font-bold ${info.status === "active" ? "text-green-600" : "text-stone-400"}`}>
                        {info.status?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-stone-500 space-y-0.5">
                    {Object.entries(info).filter(([k]) => k !== "status").map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-stone-400">{k.replace(/_/g, " ")}:</span>
                        <span className="font-semibold text-stone-700">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Layers} label="Templates" value={totals.templates || 0} color="text-blue-600" />
            <StatCard icon={Server} label="Queued Sites" value={totals.queued_sites || 0} color="text-amber-600" />
            <StatCard icon={Rocket} label="Live Sites" value={totals.live_sites || 0} color="text-green-600" />
            <StatCard icon={Share2} label="Scheduled Posts" value={totals.scheduled_posts || 0} color="text-purple-600" />
          </div>
        </div>
      )}

      {/* === AUTONOMOUS LOOP === */}
      {activeTab === "autonomous" && (
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-stone-900 flex items-center gap-2">
                  <Play className="h-5 w-5 text-amber-600" /> Run Full Autonomous Cycle
                </h3>
                <p className="text-sm text-stone-500 mt-1">
                  Executes all 8 steps: SENSE → PLAN → TEMPLATE → GENERATE → PROVISION → SOCIAL → MONITOR → OPTIMIZE
                </p>
              </div>
              <button
                onClick={() => runAction("run_autonomous_cycle")}
                disabled={!!running}
                className="h-11 px-6 rounded-lg bg-amber-500 text-stone-950 text-sm font-bold flex items-center gap-2 hover:bg-amber-400 disabled:opacity-50"
              >
                {running === "run_autonomous_cycle" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Run Cycle
              </button>
            </div>

            {/* 8 Steps */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { step: 1, name: "SENSE", desc: "Identify demand", icon: Activity },
                { step: 2, name: "PLAN", desc: "Alpha Prime prioritizes", icon: Brain },
                { step: 3, name: "TEMPLATE", desc: "Match to industry", icon: Layers },
                { step: 4, name: "GENERATE", desc: "GPT builds site", icon: Cpu },
                { step: 5, name: "PROVISION", desc: "Deploy everywhere", icon: Server },
                { step: 6, name: "SOCIAL", desc: "30-60 day calendar", icon: Share2 },
                { step: 7, name: "MONITOR", desc: "Track performance", icon: TrendingUp },
                { step: 8, name: "OPTIMIZE", desc: "Auto-improve", icon: Zap },
              ].map((s) => (
                <div key={s.step} className="rounded-lg border border-amber-200 bg-white p-3 text-center">
                  <s.icon className="h-5 w-5 mx-auto text-amber-600 mb-1" />
                  <div className="text-xs font-bold text-stone-900">{s.step}. {s.name}</div>
                  <div className="text-[10px] text-stone-500">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Individual actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ActionCard
              icon={Activity}
              title="Sense Demand"
              desc="Pull analytics + trends → identify what people want"
              action="sense_demand"
              running={running}
              onRun={runAction}
            />
            <ActionCard
              icon={Layers}
              title="Match Template"
              desc="Match demand to industry template (or create new)"
              action="match_template"
              running={running}
              onRun={runAction}
              inputs={{ industry: "epoxy_garage" }}
            />
            <ActionCard
              icon={Cpu}
              title="Generate Site"
              desc="GPT generates a full Google-compliant site from template"
              action="generate_site"
              running={running}
              onRun={runAction}
              inputs={{ template_id: "epoxy_garage", city: "Miami" }}
            />
            <ActionCard
              icon={Server}
              title="Provision Site"
              desc="Deploy to Vercel + Supabase + domain + indexers"
              action="provision_site"
              running={running}
              onRun={runAction}
            />
            <ActionCard
              icon={Share2}
              title="Schedule Social"
              desc="Create 30-60 day social calendar across all platforms"
              action="schedule_social"
              running={running}
              onRun={runAction}
              inputs={{ template_id: "epoxy_garage", business_name: "Test Business", days: 30 }}
            />
            <ActionCard
              icon={Rocket}
              title="Queue Batch"
              desc="Queue a batch of websites for an industry"
              action="queue_batch"
              running={running}
              onRun={runAction}
              inputs={{ template_id: "epoxy_garage", count: 10 }}
            />
          </div>

          {/* Result */}
          {result && (
            <div className={`rounded-xl border p-4 ${result.error ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}>
              <div className="flex items-center gap-2 mb-2">
                {result.error ? <AlertCircle className="h-4 w-4 text-red-500" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />}
                <span className="font-bold text-sm text-stone-900">{result.error ? "Error" : "Success"}</span>
              </div>
              <pre className="text-xs text-stone-600 overflow-x-auto max-h-60 overflow-y-auto">
                {JSON.stringify(result.error || result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* === TEMPLATES === */}
      {activeTab === "templates" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-stone-900">Industry Templates ({templates.length})</h3>
            <span className="text-xs text-stone-500">{templates.filter((t) => t.template_status === "active").length} active</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map((t) => (
              <div key={t.id} className="rounded-xl border border-stone-200 bg-white p-4 hover:border-amber-300 transition">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-sm text-stone-900">{t.name}</h4>
                    <p className="text-xs text-stone-500">{t.parent_industry}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.template_status === "active" ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"}`}>
                    {t.template_status}
                  </span>
                </div>
                {t.sub_industries?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {t.sub_industries.slice(0, 4).map((s) => (
                      <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">{s}</span>
                    ))}
                    {t.sub_industries.length > 4 && <span className="text-[10px] text-stone-400">+{t.sub_industries.length - 4}</span>}
                  </div>
                )}
                <div className="flex items-center gap-3 text-[10px] text-stone-400">
                  {t.competition_level && <span>🏆 {t.competition_level}</span>}
                  {t.avg_order_value && <span>💰 ${t.avg_order_value}</span>}
                  {t.seasonality && <span>📅 {t.seasonality}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === SYNC === */}
      {activeTab === "sync" && (
        <div className="space-y-4">
          {/* GPT Sync */}
          <div className="rounded-2xl border-2 border-purple-200 bg-purple-50/50 p-5">
            <h3 className="font-bold text-stone-900 flex items-center gap-2 mb-3">
              <Cpu className="h-5 w-5 text-purple-600" /> GPT Bi-Directional Sync
            </h3>
            <p className="text-sm text-stone-500 mb-3">
              Push templates to GPT, pull generated content back. GPT can read entities and run functions via MCP.
            </p>
            <div className="flex gap-2">
              <button onClick={() => runAction("sync_gpt", { direction: "push" })} disabled={!!running} className="h-10 px-4 rounded-lg bg-purple-600 text-white text-sm font-bold flex items-center gap-2 hover:bg-purple-700 disabled:opacity-50">
                {running === "sync_gpt" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />} Push to GPT
              </button>
              <button onClick={() => runAction("sync_gpt", { direction: "pull" })} disabled={!!running} className="h-10 px-4 rounded-lg bg-purple-600 text-white text-sm font-bold flex items-center gap-2 hover:bg-purple-700 disabled:opacity-50">
                {running === "sync_gpt" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4 rotate-180" />} Pull from GPT
              </button>
              <button onClick={() => runAction("sync_gpt", { direction: "both" })} disabled={!!running} className="h-10 px-4 rounded-lg bg-stone-900 text-white text-sm font-bold flex items-center gap-2 hover:bg-stone-800 disabled:opacity-50">
                {running === "sync_gpt" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Full Sync
              </button>
            </div>
          </div>

          {/* Local Machine */}
          <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/50 p-5">
            <h3 className="font-bold text-stone-900 flex items-center gap-2 mb-3">
              <Server className="h-5 w-5 text-blue-600" /> Dell Ryzen Local Bridge
            </h3>
            <p className="text-sm text-stone-500 mb-3">
              Sync with your local machine for building, testing, and processing heavy jobs locally.
            </p>
            <button onClick={() => runAction("sync_local")} disabled={!!running} className="h-10 px-4 rounded-lg bg-blue-600 text-white text-sm font-bold flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50">
              {running === "sync_local" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Check Local Bridge
            </button>
          </div>

          {/* Providers */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <h3 className="font-bold text-stone-900 mb-3">Infrastructure Providers (All Synced)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { name: "Vercel", purpose: "Hosting + SSL + CDN" },
                { name: "Supabase", purpose: "Database + Auth" },
                { name: "Railway", purpose: "Workers + Jobs" },
                { name: "GoDaddy", purpose: "Domains + DNS" },
                { name: "GitHub", purpose: "Code Repos" },
                { name: "Vercel AI Gateway", purpose: "AI Inference" },
                { name: "Telnyx", purpose: "SMS + Voice" },
                { name: "Google Workspace", purpose: "Gmail + Calendar" },
                { name: "OpenRouter", purpose: "Multi-LLM Routing" },
                { name: "Groq", purpose: "Fast LLM" },
                { name: "Browserbase", purpose: "Cloud Browser" },
                { name: "Dell Ryzen", purpose: "Local Machine" },
              ].map((p) => (
                <div key={p.name} className="rounded-lg border border-stone-200 p-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-xs font-bold text-stone-900">{p.name}</span>
                  </div>
                  <p className="text-[10px] text-stone-500">{p.purpose}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-xs font-semibold text-stone-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-stone-900">{value}</p>
    </div>
  );
}

function ActionCard({ icon: Icon, title, desc, action, running, onRun, inputs = {} }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 grid place-items-center shrink-0">
          <Icon className="h-4 w-4 text-amber-600" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-stone-900">{title}</h4>
          <p className="text-xs text-stone-500">{desc}</p>
        </div>
      </div>
      <button
        onClick={() => onRun(action, inputs)}
        disabled={!!running}
        className="w-full h-9 rounded-lg bg-stone-900 text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-amber-500 hover:text-stone-950 transition disabled:opacity-50"
      >
        {running === action ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
        Run
      </button>
    </div>
  );
}