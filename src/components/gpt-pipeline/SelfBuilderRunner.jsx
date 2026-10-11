import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Wand2, Loader2, CheckCircle2, XCircle, AlertTriangle,
  Play, ChevronRight, Cpu, RefreshCw, FileText, Eye,
} from "lucide-react";

const AGENT_ICONS = {
  ApexOrchestrator: Cpu,
  BuildFactory: Wand2,
  VisualFactory: Eye,
  ProviderAdapters: Play,
  ScaleFleet: ChevronRight,
  SocialMediaManager: FileText,
  EmailManager: FileText,
  ValidationGuardian: CheckCircle2,
  SystemMonitor: RefreshCw,
  BottleneckHunter: AlertTriangle,
  BenchmarkScout: Eye,
  SyncGuardian: RefreshCw,
};

export default function SelfBuilderRunner({ initialPrompt, onConsumed }) {
  const [prompt, setPrompt] = useState("");
  const [plan, setPlan] = useState(null);
  const [planning, setPlanning] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
      generatePlanFn(initialPrompt);
      onConsumed?.();
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [events]);

  const generatePlanFn = async (promptText) => {
    const text = (promptText || prompt).trim();
    if (!text) return;
    setPlanning(true);
    setError(null);
    setPlan(null);
    setEvents([]);
    setSummary(null);
    try {
      const res = await base44.functions.invoke("smaiSelfBuilder", { action: "plan", prompt: text });
      if (!res.data?.ok) throw new Error(res.data?.error || "Plan generation failed");
      setPlan(res.data.plan);
    } catch (e) {
      setError(e.message);
    }
    setPlanning(false);
  };

  const executePlan = async () => {
    if (!prompt.trim()) return;
    setExecuting(true);
    setError(null);
    setEvents([]);
    setSummary(null);
    try {
      const res = await base44.functions.invoke("smaiSelfBuilder", { action: "execute", prompt: prompt.trim() });
      if (!res.data?.ok) throw new Error(res.data?.error || "Execution failed");
      setEvents(res.data.events || []);
      setSummary(res.data.summary);
    } catch (e) {
      setError(e.message);
    }
    setExecuting(false);
  };

  // Group events by step
  const stepEvents = events.filter((e) => e.type?.startsWith("step_"));
  const stepMap = {};
  for (const ev of stepEvents) {
    if (!stepMap[ev.step]) stepMap[ev.step] = { events: [], title: ev.title, agent: ev.agent };
    stepMap[ev.step].events.push(ev);
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Input bar */}
      <div className="rounded-2xl border-2 border-stone-200 bg-white p-4 shadow-sm focus-within:border-amber-400 transition">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "linear-gradient(135deg, #FFF6D5, #D4AF37, #8B6914)" }}>
            <Wand2 className="h-4 w-4 text-stone-900" />
          </div>
          <span className="text-sm font-bold text-stone-900">Self-Building Engine</span>
          <span className="text-[10px] text-stone-400">Plan → Execute → Verify → Adjust → Loop</span>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              generatePlanFn();
            }
          }}
          placeholder="Describe what to build... e.g. 'Build a stunning website for a Miami roofing company with SEO, deploy to Vercel'"
          rows={2}
          className="w-full resize-none border-0 bg-transparent text-sm text-stone-900 placeholder-stone-400 outline-none"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-stone-400">Enter to plan · Shift+Enter for new line</span>
          <div className="flex gap-2">
            <button
              onClick={() => generatePlanFn()}
              disabled={planning || !prompt.trim()}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold text-stone-700 disabled:opacity-50 hover:border-amber-400 transition"
            >
              {planning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
              Generate Plan
            </button>
            {plan && (
              <button
                onClick={executePlan}
                disabled={executing || !prompt.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-stone-900 disabled:opacity-50 hover:bg-amber-400 transition"
              >
                {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                Execute & Self-Build
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
          <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Plan display */}
      {plan && (
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-bold text-stone-900">Execution Plan</h3>
            <span className="text-[10px] text-stone-400">{plan.steps?.length || 0} steps</span>
          </div>
          {plan.summary && <p className="text-xs text-stone-600 mb-3">{plan.summary}</p>}
          <div className="flex flex-col gap-1.5">
            {(plan.steps || []).map((step, i) => {
              const Icon = AGENT_ICONS[step.agent] || Cpu;
              return (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-stone-100 bg-stone-50 p-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 shrink-0 mt-0.5">
                    <span className="text-xs font-black text-amber-700">{step.step_number}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-stone-900">{step.title}</span>
                      <span className="text-[9px] font-bold uppercase text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">{step.phase}</span>
                    </div>
                    <p className="text-[11px] text-stone-600 mt-0.5">{step.task}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Icon className="h-3 w-3 text-stone-400" />
                      <span className="text-[10px] text-stone-500">{step.agent}</span>
                      <span className="text-[10px] text-stone-400">·</span>
                      <span className="text-[10px] text-stone-500 truncate">{step.function_hint}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Execution log */}
      {(executing || events.length > 0) && (
        <div ref={scrollRef} className="rounded-2xl border border-stone-200 bg-white p-4 flex-1 overflow-y-auto">
          <div className="flex items-center gap-2 mb-3 sticky top-0 bg-white pb-2">
            {executing ? <Loader2 className="h-4 w-4 animate-spin text-amber-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            <h3 className="text-sm font-bold text-stone-900">Self-Building Log</h3>
            <span className="text-[10px] text-stone-400">{events.length} events</span>
          </div>

          <div className="flex flex-col gap-2">
            {Object.entries(stepMap).map(([stepNum, data]) => {
              const lastEvent = data.events[data.events.length - 1];
              const verified = data.events.some((e) => e.type === "step_verified" && e.verified);
              const failed = data.events.some((e) => e.type === "step_failed");
              const adjusted = data.events.some((e) => e.type === "step_adjust");
              const isRunning = data.events.some((e) => e.type === "step_start") && !verified && !failed;

              return (
                <div key={stepNum} className={`rounded-xl border p-3 ${verified ? "border-emerald-200 bg-emerald-50" : failed ? "border-red-200 bg-red-50" : isRunning ? "border-amber-300 bg-amber-50" : "border-stone-200 bg-stone-50"}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black bg-stone-200 text-stone-700">
                      {stepNum}
                    </span>
                    <span className="text-xs font-bold text-stone-900">{data.title || `Step ${stepNum}`}</span>
                    {data.agent && <span className="text-[9px] text-stone-500">{data.agent}</span>}
                    {verified && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                    {failed && <XCircle className="h-3.5 w-3.5 text-red-500" />}
                    {isRunning && <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />}
                    {adjusted && <RefreshCw className="h-3 w-3 text-amber-500" />}
                  </div>
                  <div className="flex flex-col gap-1 ml-8">
                    {data.events.map((ev, j) => (
                      <div key={j} className="text-[11px]">
                        {ev.type === "step_start" && (
                          <span className="text-stone-600">
                            <b>Attempt {ev.attempt}:</b> {ev.task?.slice(0, 120)}{ev.task?.length > 120 ? "..." : ""}
                          </span>
                        )}
                        {ev.type === "step_executed" && (
                          <span className="text-stone-500">
                            Executed — {ev.receipts?.length || 0} tool calls
                            {ev.receipts?.map((r, k) => (
                              <span key={k} className={`ml-1 ${r.status === "completed" ? "text-emerald-600" : "text-red-500"}`}>
                                {r.status === "completed" ? "✓" : "✗"}{r.target}
                              </span>
                            ))}
                          </span>
                        )}
                        {ev.type === "step_verified" && (
                          <span className={ev.verified ? "text-emerald-600 font-medium" : "text-red-500"}>
                            {ev.verified ? "✓ Verified" : "✗ Failed"} — {ev.reason?.slice(0, 150)}
                          </span>
                        )}
                        {ev.type === "step_adjust" && (
                          <span className="text-amber-600">
                            ↻ Adjusting — {ev.fix_prompt?.slice(0, 120)}{ev.fix_prompt?.length > 120 ? "..." : ""}
                          </span>
                        )}
                        {ev.type === "step_failed" && (
                          <span className="text-red-500 font-medium">✗ Step failed — {ev.reason?.slice(0, 150)}</span>
                        )}
                        {ev.type === "step_done" && (
                          <span className="text-emerald-600 font-medium">✓ Step complete</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          {summary && (
            <div className={`mt-4 rounded-xl border-2 p-4 ${summary.is_complete ? "border-emerald-300 bg-emerald-50" : "border-amber-300 bg-amber-50"}`}>
              <div className="flex items-center gap-2 mb-2">
                {summary.is_complete ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertTriangle className="h-5 w-5 text-amber-600" />}
                <h3 className="text-sm font-bold text-stone-900">
                  {summary.is_complete ? "Build Complete — All Steps Verified" : "Build Partial — Some Steps Failed"}
                </h3>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-2">
                <div className="text-center">
                  <div className="text-xl font-black text-stone-900">{summary.total_steps}</div>
                  <div className="text-[9px] font-bold uppercase text-stone-400">Total Steps</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-black text-emerald-600">{summary.passed_steps}</div>
                  <div className="text-[9px] font-bold uppercase text-stone-400">Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-black text-red-500">{summary.failed_steps}</div>
                  <div className="text-[9px] font-bold uppercase text-stone-400">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-black text-amber-600">{summary.total_iterations}</div>
                  <div className="text-[9px] font-bold uppercase text-stone-400">Iterations</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}