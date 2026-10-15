import React, { useState, Suspense, lazy } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
const UniversalPhaseControl = lazy(() => import("@/components/universal/UniversalPhaseControl"));
import {
  Sparkles, Bot, Shield, Crown, ChevronDown, ChevronRight,
  Wand2, Network, Activity, Target, Zap, ArrowRight, Loader2,
  CheckCircle2, AlertCircle, Brain,
} from "lucide-react";

const STAGES = [
  { num: 1, title: "VISION", subtitle: "A thought enters the system", icon: Sparkles, accent: "violet" },
  { num: 2, title: "AGENTS", subtitle: "Agents carry out the request", icon: Bot, accent: "amber" },
  { num: 3, title: "CONVERGENCE", subtitle: "The system self-heals and verifies", icon: Shield, accent: "emerald" },
  { num: 4, title: "DOMINANCE", subtitle: "Output — goals and metrics", icon: Crown, accent: "amber" },
];

const ACCENT_STYLES = {
  violet: { bg: "from-violet-500 to-violet-700", text: "text-violet-600", border: "border-violet-200", chip: "bg-violet-100 text-violet-700" },
  amber: { bg: "from-amber-400 to-amber-600", text: "text-amber-600", border: "border-amber-200", chip: "bg-amber-100 text-amber-700" },
  emerald: { bg: "from-emerald-500 to-emerald-700", text: "text-emerald-600", border: "border-emerald-200", chip: "bg-emerald-100 text-emerald-700" },
};

export default function GeneratorSandbox() {
  const navigate = useNavigate();
  const [vision, setVision] = useState("");
  const [collapsed, setCollapsed] = useState({ 1: false, 2: false, 3: false, 4: false });
  const [converging, setConverging] = useState(false);

  const toggle = (num) => setCollapsed((p) => ({ ...p, [num]: !p[num] }));

  // Fetch agent activity
  const { data: agentLogs = [], isLoading: agentsLoading } = useQuery({
    queryKey: ["generator-agent-logs"],
    queryFn: async () => {
      try {
        const res = await base44.entities.AgentExecutionLog.list("-created_date", 5);
        return res || [];
      } catch { return []; }
    },
  });

  // Fetch convergence score
  const { data: convergence, isLoading: convergenceLoading, refetch: refetchConvergence } = useQuery({
    queryKey: ["generator-convergence"],
    queryFn: async () => {
      try {
        const res = await base44.functions.invoke("convergenceEngine", { action: "scorecard", system_id: "epoxyquotenearme" });
        return res.data || res;
      } catch { return null; }
    },
  });

  // Fetch dominance goals
  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ["generator-goals"],
    queryFn: async () => {
      try {
        const res = await base44.entities.DominanceGoal.filter({ status: "active" }, "-updated_at", 5);
        return res || [];
      } catch { return []; }
    },
  });

  const handleGenerate = () => {
    if (!vision.trim()) return;
    navigate("/admin/agent-builder");
  };

  const handleConverge = async () => {
    setConverging(true);
    try {
      await base44.functions.invoke("convergenceEngine", { action: "cycle", system_id: "epoxyquotenearme" });
      refetchConvergence();
    } catch { /* best effort */ }
    setConverging(false);
  };

  const convergenceScore = convergence?.score ?? 0;
  const convergenceVerified = convergence?.verified_100 ?? false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-violet-950 via-stone-950 to-stone-900 p-8 text-white border border-violet-500/30">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-violet-500 to-amber-500 grid place-items-center">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Generator Sandbox</h1>
            <p className="text-stone-400 text-sm mt-1">Turn thoughts into deployed systems — agents carry out your request, the system converges in the background.</p>
          </div>
        </div>
      </div>

      <Suspense fallback={<div className="rounded-xl border border-slate-200 p-6 text-sm text-slate-600">Loading Universal Phase Sandbox…</div>}>
        <UniversalPhaseControl />
      </Suspense>

      {/* Pipeline Stages */}
      <div className="space-y-4">
        {/* Stage 1: VISION */}
        <StageCard stage={STAGES[0]} collapsed={collapsed[1]} onToggle={() => toggle(1)}>
          <div className="space-y-4 p-2">
            <p className="text-sm text-stone-600">Enter your thought. The system will route it to agents who carry it out.</p>
            <textarea
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              placeholder="e.g. Build a lead generation system for epoxy garage floors in 50 cities..."
              className="w-full h-28 px-4 py-3 text-sm border border-stone-200 rounded-xl resize-none focus:border-amber-500 outline-none"
            />
            <div className="flex gap-3">
              <Button
                onClick={handleGenerate}
                disabled={!vision.trim()}
                className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Deploy to Agent Builder
              </Button>
              <Button
                onClick={() => navigate("/admin/vision-studio")}
                variant="outline"
              >
                Open Vision Studio
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </StageCard>

        {/* Stage 2: AGENTS */}
        <StageCard stage={STAGES[1]} collapsed={collapsed[2]} onToggle={() => toggle(2)}>
          <div className="p-2 space-y-3">
            {agentsLoading ? (
              <div className="flex items-center gap-2 text-sm text-stone-500 py-4">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading agent activity...
              </div>
            ) : agentLogs.length === 0 ? (
              <div className="text-sm text-stone-500 py-4">No recent agent activity. Deploy a vision to activate agents.</div>
            ) : (
              agentLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 bg-stone-50">
                  <div className={`h-8 w-8 rounded-lg grid place-items-center ${log.status === "completed" ? "bg-emerald-100 text-emerald-600" : log.status === "failed" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>
                    {log.status === "completed" ? <CheckCircle2 className="h-4 w-4" /> : log.status === "failed" ? <AlertCircle className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">{log.agent_name || log.action_title || "Agent"}</p>
                    <p className="text-xs text-stone-500 truncate">{log.result || log.error || log.status}</p>
                  </div>
                </div>
              ))
            )}
            <div className="flex gap-2 pt-2">
              <Button onClick={() => navigate("/admin/agent-builder")} variant="outline" size="sm">
                <Bot className="h-3.5 w-3.5 mr-1.5" /> Agent Builder
              </Button>
              <Button onClick={() => navigate("/admin/swarm")} variant="outline" size="sm">
                <Network className="h-3.5 w-3.5 mr-1.5" /> Swarm
              </Button>
              <Button onClick={() => navigate("/admin/operator")} variant="outline" size="sm">
                <Activity className="h-3.5 w-3.5 mr-1.5" /> Operator
              </Button>
            </div>
          </div>
        </StageCard>

        {/* Stage 3: CONVERGENCE */}
        <StageCard stage={STAGES[2]} collapsed={collapsed[3]} onToggle={() => toggle(3)}>
          <div className="p-2 space-y-4">
            {convergenceLoading ? (
              <div className="flex items-center gap-2 text-sm text-stone-500 py-4">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading convergence status...
              </div>
            ) : (
              <div className="flex items-center gap-6">
                {/* Score circle */}
                <div className="relative h-24 w-24 shrink-0">
                  <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="44" fill="none" stroke="#e7e5e4" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="44" fill="none"
                      stroke={convergenceVerified ? "#10b981" : "#f59e0b"}
                      strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={`${(convergenceScore / 100) * 276.46} 276.46`}
                    />
                  </svg>
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="text-2xl font-extrabold text-stone-900">{convergenceScore}</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {convergenceVerified ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                        <CheckCircle2 className="h-3.5 w-3.5" /> VERIFIED 100
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                        <AlertCircle className="h-3.5 w-3.5" /> CONVERGING
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-stone-500">
                    {convergenceVerified
                      ? "System verified at 100/100. All mandatory categories passing."
                      : `Score: ${convergenceScore}/100. Running convergence cycle to close remaining gaps.`}
                  </p>
                  <Button
                    onClick={handleConverge}
                    disabled={converging}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    {converging ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Converging...</> : <><Shield className="h-3.5 w-3.5 mr-1.5" /> Run Convergence Cycle</>}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </StageCard>

        {/* Stage 4: DOMINANCE */}
        <StageCard stage={STAGES[3]} collapsed={collapsed[4]} onToggle={() => toggle(4)}>
          <div className="p-2 space-y-3">
            {goalsLoading ? (
              <div className="flex items-center gap-2 text-sm text-stone-500 py-4">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading goals...
              </div>
            ) : goals.length === 0 ? (
              <div className="text-sm text-stone-500 py-4">No active dominance goals. Create goals to track progress.</div>
            ) : (
              goals.map((g) => {
                const pct = g.target_value > 0 ? Math.min(100, (g.current_value / g.target_value) * 100) : 0;
                return (
                  <div key={g.id} className="p-4 rounded-lg border border-stone-200 bg-stone-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-stone-900">{g.title}</span>
                      <span className="text-xs text-stone-500">{g.current_value || 0} / {g.target_value} {g.unit || ""}</span>
                    </div>
                    <div className="h-2 rounded-full bg-stone-200 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
            <div className="flex gap-2 pt-2">
              <Button onClick={() => navigate("/admin/digital-dominance")} variant="outline" size="sm">
                <Crown className="h-3.5 w-3.5 mr-1.5" /> Digital Dominance
              </Button>
              <Button onClick={() => navigate("/admin/autonomous-dominance")} variant="outline" size="sm">
                <Zap className="h-3.5 w-3.5 mr-1.5" /> Autonomous
              </Button>
            </div>
          </div>
        </StageCard>
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
        <QuickCard icon={Wand2} label="Vision Studio" to="/admin/vision-studio" />
        <QuickCard icon={Bot} label="Agent Builder" to="/admin/agent-builder" />
        <QuickCard icon={Network} label="Swarm" to="/admin/swarm" />
        <QuickCard icon={Shield} label="Convergence" to="/admin/convergence" />
      </div>
    </div>
  );
}

function StageCard({ stage, collapsed, onToggle, children }) {
  const accent = ACCENT_STYLES[stage.accent] || ACCENT_STYLES.amber;
  return (
    <div className="rounded-2xl bg-white border border-stone-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-5 hover:bg-stone-50 transition-colors text-left"
      >
        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${accent.bg} grid place-items-center shrink-0`}>
          <stage.icon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold tracking-wider ${accent.text}`}>STAGE {stage.num}</span>
          </div>
          <h3 className="text-base font-bold text-stone-900">{stage.title}</h3>
          <p className="text-xs text-stone-500">{stage.subtitle}</p>
        </div>
        {collapsed ? <ChevronRight className="h-5 w-5 text-stone-400" /> : <ChevronDown className="h-5 w-5 text-stone-400" />}
      </button>
      {!collapsed && <div className="px-5 pb-5 border-t border-stone-100">{children}</div>}
    </div>
  );
}

function QuickCard({ icon: Icon, label, to }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="flex items-center gap-3 p-4 rounded-xl bg-white border border-stone-200 hover:border-amber-400 hover:shadow-md transition-all text-left"
    >
      <div className="h-10 w-10 rounded-lg bg-amber-50 grid place-items-center">
        <Icon className="h-5 w-5 text-amber-600" />
      </div>
      <span className="text-sm font-semibold text-stone-900">{label}</span>
      <ArrowRight className="h-4 w-4 text-stone-400 ml-auto" />
    </button>
  );
}