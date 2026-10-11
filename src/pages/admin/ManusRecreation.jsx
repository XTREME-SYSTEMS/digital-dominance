import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  Target, GitCompare, Wrench, Box, RefreshCw, CheckCircle2,
  AlertTriangle, ArrowRight, Trophy, Eye, Loader2, Sparkles,
} from "lucide-react";

const CATEGORY_LABELS = {
  architecture: "Architecture",
  ux: "UX / Interface",
  autonomy: "Autonomy",
  tools: "Tools",
  sandbox: "Sandbox",
  memory: "Memory",
  multi_platform: "Multi-Platform",
  transparency: "Transparency",
  progressive_delegation: "Progressive Delegation",
  deployment: "Deployment",
};

const PRIORITY_STYLES = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-stone-100 text-stone-600 border-stone-200",
};

export default function ManusRecreation() {
  const [tab, setTab] = useState("benchmark");
  const [loading, setLoading] = useState(false);
  const [benchmark, setBenchmark] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [refactorPlan, setRefactorPlan] = useState(null);
  const [contents, setContents] = useState(null);
  const [records, setRecords] = useState([]);

  const runBenchmark = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("manusBenchmarkEngine", { action: "benchmark" });
      setBenchmark(res.data);
      const page = await base44.entities.ManusBenchmark.filter(
        { benchmark_run_id: res.data.run_id },
        { sort: "-created_date", limit: 100 }
      );
      setRecords(Array.isArray(page) ? page : page?.items || []);
    } catch (e) {
      console.error("Benchmark failed:", e);
    }
    setLoading(false);
  }, []);

  const loadComparison = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("manusBenchmarkEngine", { action: "compare" });
      setComparison(res.data);
    } catch (e) {
      console.error("Comparison failed:", e);
    }
    setLoading(false);
  }, []);

  const loadRefactorPlan = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("manusBenchmarkEngine", { action: "refactor_plan" });
      setRefactorPlan(res.data);
    } catch (e) {
      console.error("Refactor plan failed:", e);
    }
    setLoading(false);
  }, []);

  const loadContents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("manusBenchmarkEngine", { action: "contents" });
      setContents(res.data);
    } catch (e) {
      console.error("Contents failed:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    runBenchmark();
  }, [runBenchmark]);

  const switchTab = (t) => {
    setTab(t);
    if (t === "compare" && !comparison) loadComparison();
    if (t === "refactor" && !refactorPlan) loadRefactorPlan();
    if (t === "contents" && !contents) loadContents();
  };

  const overallParity = benchmark?.overall_parity ?? 0;
  const parityColor = overallParity >= 75 ? "text-emerald-600" : overallParity >= 50 ? "text-amber-600" : "text-red-600";

  return (
    <div className="flex flex-col gap-4 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Target className="h-6 w-6 text-amber-500" />
            Manus Recreation System
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Benchmark against Manus.im · Reverse-engineer patterns · Compare · Refactor · Rebuild frontend
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={runBenchmark}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-stone-900 hover:bg-amber-400 disabled:opacity-50 transition"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Run Benchmark
          </button>
        </div>
      </div>

      {/* Overall score banner */}
      {benchmark && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-stone-200 bg-white p-4">
            <div className="flex items-center gap-2 text-stone-500 text-xs font-bold uppercase">
              <Trophy className="h-3.5 w-3.5" /> Overall Parity
            </div>
            <div className={`text-3xl font-black mt-1 ${parityColor}`}>{overallParity}%</div>
            <div className="text-[10px] text-stone-400">vs Manus.im</div>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-4">
            <div className="flex items-center gap-2 text-stone-500 text-xs font-bold uppercase">
              <Target className="h-3.5 w-3.5" /> Patterns Scored
            </div>
            <div className="text-3xl font-black mt-1 text-stone-900">{benchmark.total_patterns}</div>
            <div className="text-[10px] text-stone-400">Manus patterns assessed</div>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-4">
            <div className="flex items-center gap-2 text-stone-500 text-xs font-bold uppercase">
              <AlertTriangle className="h-3.5 w-3.5" /> Critical Gaps
            </div>
            <div className="text-3xl font-black mt-1 text-red-600">{benchmark.critical_gaps}</div>
            <div className="text-[10px] text-stone-400">need immediate action</div>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-4">
            <div className="flex items-center gap-2 text-stone-500 text-xs font-bold uppercase">
              <Wrench className="h-3.5 w-3.5" /> High Priority
            </div>
            <div className="text-3xl font-black mt-1 text-orange-600">{benchmark.high_gaps}</div>
            <div className="text-[10px] text-stone-400">refactor items</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: "benchmark", label: "Benchmark", icon: Target },
          { id: "compare", label: "Comparison", icon: GitCompare },
          { id: "refactor", label: "Refactor Plan", icon: Wrench },
          { id: "contents", label: "System Contents", icon: Box },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => switchTab(t.id)}
            className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold whitespace-nowrap transition ${
              tab === t.id
                ? "bg-amber-500 text-stone-900 border-amber-500"
                : "bg-white border-stone-200 text-stone-600 hover:border-amber-300"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && !benchmark && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      )}

      {/* === BENCHMARK TAB === */}
      {tab === "benchmark" && benchmark && (
        <div className="flex flex-col gap-4">
          {/* Category scores */}
          {benchmark.category_scores && (
            <div className="rounded-2xl border border-stone-200 bg-white p-4">
              <h3 className="text-sm font-bold text-stone-900 mb-3">Parity by Category</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(benchmark.category_scores).map(([cat, score]) => (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-stone-600 w-32 truncate">{CATEGORY_LABELS[cat] || cat}</span>
                    <div className="flex-1 h-6 rounded-full bg-stone-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${score}%`,
                          background: score >= 75 ? "#16a34a" : score >= 50 ? "#f59e0b" : "#ef4444",
                        }}
                      />
                    </div>
                    <span className="text-xs font-black text-stone-900 w-10 text-right">{score}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pattern cards */}
          <div className="grid grid-cols-1 gap-2">
            {records.map((r) => (
              <div key={r.id} className="rounded-xl border border-stone-200 bg-white p-3 hover:border-amber-300 transition">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-stone-900">{r.pattern_name}</h4>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${PRIORITY_STYLES[r.priority]}`}>
                        {r.priority}
                      </span>
                      <span className="text-[9px] text-stone-400">{CATEGORY_LABELS[r.category] || r.category}</span>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">{r.manus_description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-stone-400">Our state:</span>
                      <span className="text-[11px] text-stone-600">{r.our_current_state}</span>
                    </div>
                    <div className="mt-1.5 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-100 p-2">
                      <ArrowRight className="h-3 w-3 text-amber-600 mt-0.5 shrink-0" />
                      <span className="text-[11px] text-amber-800">{r.refactor_action}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-2xl font-black ${r.parity_score >= 75 ? "text-emerald-600" : r.parity_score >= 50 ? "text-amber-600" : "text-red-600"}`}>
                      {r.parity_score}%
                    </div>
                    <div className="text-[9px] text-stone-400">parity</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === COMPARISON TAB === */}
      {tab === "compare" && comparison && (
        <div className="flex flex-col gap-4">
          {/* High-level comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-stone-200 bg-white p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-bold text-stone-900">Manus AI</h3>
              </div>
              <dl className="space-y-2">
                {Object.entries(comparison.manus).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[10px] font-bold uppercase text-stone-400">{k.replace(/_/g, " ")}</dt>
                    <dd className="text-xs text-stone-700">{Array.isArray(v) ? v.join(", ") : String(v)}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-4">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="h-4 w-4 text-stone-700" />
                <h3 className="text-sm font-bold text-stone-900">GPT Sync Pipeline (Us)</h3>
              </div>
              <dl className="space-y-2">
                {Object.entries(comparison.us).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[10px] font-bold uppercase text-stone-400">{k.replace(/_/g, " ")}</dt>
                    <dd className="text-xs text-stone-700">{Array.isArray(v) ? v.join(", ") : String(v)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Pattern-by-pattern comparison */}
          <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
            <div className="px-4 py-2.5 border-b border-stone-200 bg-stone-50">
              <h3 className="text-sm font-bold text-stone-900">Pattern-by-Pattern Comparison</h3>
            </div>
            <div className="divide-y divide-stone-100">
              {comparison.patterns.map((p) => (
                <div key={p.pattern_id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-xs font-bold text-stone-900">{p.pattern_name}</h4>
                    <span className={`text-xs font-black ${p.parity >= 75 ? "text-emerald-600" : p.parity >= 50 ? "text-amber-600" : "text-red-600"}`}>
                      {p.parity}% parity
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                    <div className="rounded-lg bg-amber-50 border border-amber-100 p-2">
                      <span className="text-[9px] font-bold uppercase text-amber-600">Manus</span>
                      <p className="text-[11px] text-stone-700 mt-0.5">{p.manus}</p>
                    </div>
                    <div className="rounded-lg bg-stone-50 border border-stone-200 p-2">
                      <span className="text-[9px] font-bold uppercase text-stone-500">Us</span>
                      <p className="text-[11px] text-stone-700 mt-0.5">{p.us}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* === REFACTOR PLAN TAB === */}
      {tab === "refactor" && refactorPlan && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-2">
            {["critical", "high", "medium", "low"].map((p) => {
              const items = refactorPlan[p] || [];
              return (
                <div key={p} className={`rounded-xl border p-3 text-center ${PRIORITY_STYLES[p]}`}>
                  <div className="text-2xl font-black">{items.length}</div>
                  <div className="text-[9px] font-bold uppercase">{p}</div>
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            {refactorPlan.plan.map((item, i) => (
              <div key={item.pattern_id} className="rounded-xl border border-stone-200 bg-white p-3">
                <div className="flex items-start gap-3">
                  <span className="text-stone-300 font-black text-lg shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-stone-900">{item.pattern_name}</h4>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${PRIORITY_STYLES[item.priority]}`}>
                        {item.priority}
                      </span>
                      <span className="text-[9px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">{item.effort}</span>
                    </div>
                    <p className="text-xs text-stone-600 mt-1">{item.action}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-lg font-black ${item.parity >= 75 ? "text-emerald-600" : item.parity >= 50 ? "text-amber-600" : "text-red-600"}`}>
                      {item.parity}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === CONTENTS TAB === */}
      {tab === "contents" && contents && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Entities", value: contents.entities, icon: Box },
              { label: "Backend Functions", value: contents.backend_functions, icon: Wrench },
              { label: "Admin Pages", value: contents.admin_pages, icon: Eye },
              { label: "Agents", value: contents.agents, icon: Sparkles },
              { label: "Connectors", value: contents.connectors, icon: ArrowRight },
              { label: "Workflows", value: contents.workflows, icon: RefreshCw },
              { label: "Secrets", value: contents.secrets, icon: CheckCircle2 },
              { label: "Packages", value: contents.installed_packages, icon: Box },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-stone-200 bg-white p-4 text-center">
                <s.icon className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                <div className="text-2xl font-black text-stone-900">{s.value}</div>
                <div className="text-[10px] font-bold uppercase text-stone-400">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-4">
            <h3 className="text-sm font-bold text-stone-900 mb-3">Key System Components</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {contents.key_components.map((c, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-stone-50 border border-stone-200 px-3 py-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span className="text-xs text-stone-700">{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}