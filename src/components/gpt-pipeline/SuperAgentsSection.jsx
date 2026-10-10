import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Crown, Hammer, Palette, Plug, Rocket, Share2, Mail, ShieldCheck,
  Activity, Search, Trophy, RefreshCw, ChevronRight, Loader2, Zap
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const AGENTS = [
  { id: "apex_orchestrator", name: "APEX Orchestrator", icon: Crown, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200",
    role: "Master brain — routes work, ensures pipeline functional, all systems operational, quality 100%, visual parity 99%",
    prompt: "As APEX Orchestrator: Run a full system status check. Report the health of all agents, all systems, all connected accounts, and all active campaigns. Identify any issues and dispatch work packets to the appropriate super agents." },
  { id: "build_factory", name: "Build Factory", icon: Hammer, color: "text-stone-700", bg: "bg-stone-50", border: "border-stone-200",
    role: "Turns definitions into production-grade websites and apps. No stubs. Builder docs first.",
    prompt: "As Build Factory: I want to build a new website. Ask me for the industry, location, and business name. Then generate builder docs, compile the DAG, and build the site with no stubs." },
  { id: "visual_factory", name: "Visual Factory", icon: Palette, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200",
    role: "99% visual parity perfection. Brand lock. Design tokens, typography, component recipes, visual QA.",
    prompt: "As Visual Factory: Generate 10 logo directions, 10 brand systems, and 10 website/app directions for my business. Then halt for my selection. Ensure 99% visual parity perfection." },
  { id: "provider_adapters", name: "Provider Adapters", icon: Plug, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200",
    role: "Manages Vercel, Supabase, GitHub, Railway, GoDaddy, Google. Health, capabilities, dry_run, execute, validate, rollback.",
    prompt: "As Provider Adapters: Check the health of all connected providers — Vercel, Supabase, GitHub, Railway, GoDaddy, Google Analytics, Search Console, Drive, Gmail, Calendar. Report which are connected and which need attention." },
  { id: "scale_fleet", name: "Scale Fleet", icon: Rocket, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200",
    role: "Mass-produces validated templates into N sites. Each clone gets stable IDs, validation receipts, rollback pointers.",
    prompt: "As Scale Fleet: I want to launch 50 programmatic websites for epoxy garage floors across Florida. Generate each from the validated template, build, test, visual QA, SEO QA, package, and deploy." },
  { id: "social_media_manager", name: "Social Media Manager", icon: Share2, color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200",
    role: "Manages all social accounts. Content generation, scheduling, posting, responding to messages, engagement tracking.",
    prompt: "As Social Media Manager: Generate a 20-day social media content calendar with video and image posts for my business. Also generate 10 viral scroll-stopping videos. Then tell me which social accounts I need to connect." },
  { id: "email_manager", name: "Email Manager", icon: Mail, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200",
    role: "Creates, reads, sends, responds to emails. Manages campaigns, follow-ups, estimates, review requests, inbox monitoring.",
    prompt: "As Email Manager: Check my inbox for important messages and summarize them. Then draft a follow-up email sequence for my recent leads." },
  { id: "validation_guardian", name: "Validation Guardian", icon: ShieldCheck, color: "text-red-600", bg: "bg-red-50", border: "border-red-200",
    role: "Validates ALL templates, websites, systems, emails, content. Fixes, enhances, self-reflects. Independent — builders never self-certify.",
    prompt: "As Validation Guardian: Run a full validation cycle on all published websites. Check visual parity, SEO, AEO, GEO, accessibility, performance. Fix any gaps found. Self-reflect on what could be improved." },
  { id: "system_monitor", name: "System Monitor", icon: Activity, color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-200",
    role: "Monitors entire system 24/7. Fixes, hardens, optimizes. Keeps system at 100%. Detects degradation, triggers auto-healing.",
    prompt: "As System Monitor: Run a full system health check. Check all systems, all agents, all connected accounts. Identify any degradation, trigger auto-healing, and harden the system against failures." },
  { id: "bottleneck_hunter", name: "Bottleneck Hunter", icon: Search, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200",
    role: "Identifies bottlenecks, restrictions, limitations. Removes them or finds workarounds. Escalates hard blockers.",
    prompt: "As Bottleneck Hunter: Scan the entire system for bottlenecks and restrictions. Check for rate limits, credit exhaustion, API restrictions, permission gaps, missing connectors. Remove what you can and find workarounds for the rest." },
  { id: "benchmark_scout", name: "Benchmark Scout", icon: Trophy, color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200",
    role: "Finds top systems and websites in existence. Creates benchmarks for all systems. Models best websites — not guessing.",
    prompt: "As Benchmark Scout: Find the top 5 epoxy garage floor websites in the country. Analyze what makes them the best — design, UX, content, SEO, performance, conversion. Create a benchmark pack we can model our websites after." },
  { id: "sync_guardian", name: "Sync Guardian", icon: RefreshCw, color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-200",
    role: "Ensures all systems and documents sync with Drive, GitHub, Supabase, Vercel, Railway. Detects drift, reconciles.",
    prompt: "As Sync Guardian: Check sync status across all platforms — Google Drive, GitHub, Supabase, Vercel, Railway. Detect any drift and reconcile. Ensure every website and system is fully synced." },
];

export default function SuperAgentsSection({ onQuickAction }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("superAgentOrchestrator", { action: "status" });
      setStatus(res.data);
    } catch (e) {
      console.error("Agent status failed:", e);
    }
    setLoading(false);
  };

  const dispatch = async (agent) => {
    setDispatching(agent.id);
    try {
      onQuickAction(agent.prompt);
    } catch (e) {
      console.error("Dispatch failed:", e);
    }
    setDispatching(null);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            12 XTREME Super Agents
          </h3>
          <p className="text-[11px] text-stone-500">Full read/write/execute access · Vercel AI Gateway · Railway crons</p>
        </div>
        <button onClick={loadStatus} disabled={loading} className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1 text-[10px] font-bold text-stone-600 hover:border-amber-300 disabled:opacity-50">
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Refresh
        </button>
      </div>

      {/* Status summary */}
      {status?.ok && (
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-lg border border-stone-200 bg-white p-2 text-center">
            <div className="text-lg font-black text-amber-600">{status.agents?.length || 12}</div>
            <div className="text-[9px] font-bold uppercase text-stone-400">Agents</div>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white p-2 text-center">
            <div className="text-lg font-black text-blue-600">{status.active_work_packets || 0}</div>
            <div className="text-[9px] font-bold uppercase text-stone-400">Work Packets</div>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white p-2 text-center">
            <div className="text-lg font-black text-orange-600">{status.pending_approvals || 0}</div>
            <div className="text-[9px] font-bold uppercase text-stone-400">Approvals</div>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white p-2 text-center">
            <div className="text-lg font-black text-emerald-600">{status.last_heartbeat ? "Live" : "—"}</div>
            <div className="text-[9px] font-bold uppercase text-stone-400">Heartbeat</div>
          </div>
        </div>
      )}

      {/* Agent grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {AGENTS.map((agent) => {
          const Icon = agent.icon;
          return (
            <div key={agent.id} className={`group rounded-xl border ${agent.border} ${agent.bg} p-3 transition hover:shadow-md`}>
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-white ${agent.color} shrink-0`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-stone-900">{agent.name}</h4>
                    <span className="flex items-center gap-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-bold text-emerald-600">ACTIVE</span>
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-600 mt-0.5 leading-tight">{agent.role}</p>
                  <button
                    onClick={() => dispatch(agent)}
                    disabled={dispatching === agent.id}
                    className="mt-2 flex items-center gap-1 rounded-lg bg-stone-900 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-amber-500 hover:text-stone-900 disabled:opacity-50 transition"
                  >
                    {dispatching === agent.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ChevronRight className="h-3 w-3" />}
                    Dispatch to GPT
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Social media connection notice */}
      <div className="rounded-xl border border-pink-200 bg-pink-50 p-3">
        <div className="flex items-center gap-2 mb-1">
          <Share2 className="h-4 w-4 text-pink-600" />
          <h4 className="text-xs font-bold text-pink-800">Connect Social Media Accounts</h4>
        </div>
        <p className="text-[10px] text-pink-700 mb-2">
          The Social Media Manager agent needs your social accounts connected. Available: Facebook Pages, Instagram Business, LinkedIn, X (Twitter), TikTok, YouTube.
        </p>
        <Link to="/connect" className="inline-flex items-center gap-1 rounded-lg bg-pink-600 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-pink-700">
          Connect Accounts <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}