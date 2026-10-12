import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Rocket, Trash2, CheckCircle2, Circle, Loader, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import SandboxPreview from "./SandboxPreview";
import { PIPELINE_STAGES, FUNCTION_STAGE_MAP, CHECKLIST_ITEMS } from "@/lib/pipelineStages";

const AGENT_ID = "gpt_sync_pipeline";
const MAX_HISTORY = 40;

const STAGE_ICONS = {
  1: "💡", 2: "🎯", 3: "🔍", 4: "📋", 5: "🎨", 6: "🏗️",
  7: "📹", 8: "📦", 9: "🚀", 10: "🌐", 11: "📈", 12: "✅",
};

export default function PipelineRunner({ initialMessage, onConsumed }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [stages, setStages] = useState(PIPELINE_STAGES.map((s) => ({ ...s, status: "pending" })));
  const [checklist, setChecklist] = useState(CHECKLIST_ITEMS.map((c) => ({ ...c, done: false })));
  const [previewUrl, setPreviewUrl] = useState(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef(null);

  const loadMemory = useCallback(async () => {
    try {
      const records = await base44.entities.AgentMemory.filter(
        { agent_id: AGENT_ID, category: "conversation", $or: [{ owner_id: user.id }, { created_by_id: user.id }] },
        { sort: "-created_date", limit: MAX_HISTORY }
      );
      if (records?.length) {
        const sorted = [...records].reverse();
        setMessages(
          sorted.map((r) => {
            try {
              const p = JSON.parse(r.content);
              return { role: p.role, content: p.content, actions: p.actions || [] };
            } catch {
              return { role: "assistant", content: r.content, actions: [] };
            }
          })
        );
      }
    } catch (e) {
      console.error("Chat memory load failed:", e);
    }
    setHistoryLoaded(true);
  }, [user?.id]);

  useEffect(() => {
    if (user?.role === "admin" && !historyLoaded) loadMemory();
  }, [user?.role, historyLoaded, loadMemory]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    if (initialMessage) {
      send(initialMessage);
      onConsumed?.();
    }
  }, [initialMessage]);

  const updateProgress = (receipts) => {
    if (!receipts?.length) return;
    const completedFns = new Set();
    receipts.forEach((r) => {
      if (r.status === "completed" && r.tool === "invoke_function") {
        const fnName = r.target || r.tool;
        completedFns.add(fnName);
      }
    });
    setStages((prev) =>
      prev.map((s) => {
        const hasCompleted = s.functions.some((fn) => completedFns.has(fn));
        const hasActive = s.functions.some((fn) =>
          receipts.some((r) => r.status === "failed" && (r.target || r.tool) === fn)
        );
        return {
          ...s,
          status: hasCompleted ? "done" : hasActive ? "active" : s.status,
        };
      })
    );
    setChecklist((prev) =>
      prev.map((c) => ({
        ...c,
        done: c.done || c.functions.some((fn) => completedFns.has(fn)),
      }))
    );
    receipts.forEach((r) => {
      const detail = r.detail || "";
      const urlMatch = detail.match(/https?:\/\/[^\s"'<>]+vercel\.app[^\s"'<>]*/i);
      if (urlMatch) setPreviewUrl(urlMatch[0]);
      const slugMatch = detail.match(/\/p\/[a-z0-9-]+/i);
      if (slugMatch && !previewUrl) setPreviewUrl(slugMatch[0]);
    });
  };

  const saveMessage = useCallback(
    async (msg) => {
      try {
        await base44.entities.AgentMemory.create({
          agent_id: AGENT_ID,
          owner_id: user.id,
          agent_short_name: "GPT",
          category: "conversation",
          memory_type: "context",
          title: msg.role === "user" ? "User message" : "GPT Pipeline response",
          content: JSON.stringify({
            role: msg.role,
            content: msg.content.slice(0, 7000),
            actions: (msg.actions || []).slice(-8).map((a) => ({ ...a, detail: (a.detail || "").slice(0, 300) })),
          }),
          source: "gpt_sync_pipeline",
          importance: "high",
          is_shared: false,
        });
      } catch (e) {
        console.error("Save message failed:", e);
      }
    },
    [user?.id]
  );

  const send = async (overrideText) => {
    const text = (overrideText || input).trim();
    if (!text || loading) return;
    const userMsg = { role: "user", content: text };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setLoading(true);
    saveMessage(userMsg);

    try {
      const response = await base44.functions.invoke("vercelAiGateway", {
        action: "operatorChat",
        message: text,
        history: messages.slice(-12).map(({ role, content }) => ({ role, content })),
      });
      if (!response.data?.ok || !response.data.text)
        throw new Error(response.data?.error || "No response from operator.");
      const aiMsg = { role: "assistant", content: response.data.text, actions: response.data.receipts || [] };
      setMessages((p) => [...p, aiMsg]);
      saveMessage(aiMsg);
      updateProgress(response.data.receipts);
    } catch (e) {
      const errMsg = { role: "assistant", content: `Error: ${e.message}` };
      setMessages((p) => [...p, errMsg]);
      saveMessage(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const clearMemory = async () => {
    if (!confirm("Clear all pipeline history and progress?")) return;
    try {
      await base44.entities.AgentMemory.deleteMany({
        agent_id: AGENT_ID,
        category: "conversation",
        $or: [{ owner_id: user.id }, { created_by_id: user.id }],
      });
      setMessages([]);
      setStages(PIPELINE_STAGES.map((s) => ({ ...s, status: "pending" })));
      setChecklist(CHECKLIST_ITEMS.map((c) => ({ ...c, done: false })));
      setPreviewUrl(null);
    } catch (e) {
      console.error("Clear failed:", e);
    }
  };

  const doneCount = stages.filter((s) => s.status === "done").length;
  const checklistDone = checklist.filter((c) => c.done).length;

  return (
    <div className="flex flex-col h-full gap-3 text-white">
      {/* Top bar: progress + clear */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#00a2ff] to-[#0066cc]">
              <Rocket className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-xs font-bold text-white">Pipeline Execution</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-24 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-[#00a2ff] transition-all" style={{ width: `${(doneCount / 12) * 100}%` }} />
            </div>
            <span className="text-[10px] font-bold text-white/50">{doneCount}/12 stages</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-20 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(checklistDone / checklist.length) * 100}%` }} />
            </div>
            <span className="text-[10px] font-bold text-white/50">{checklistDone}/{checklist.length} checklist</span>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearMemory} className="rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-red-400">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Main grid: stages | chat | preview+checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr_280px] gap-3 flex-1 min-h-0">
        {/* Stage tracker */}
        <div className="rounded-xl border border-white/10 bg-[#0d1525] p-2.5 overflow-y-auto">
          <p className="text-[10px] font-bold uppercase tracking-wide text-white/30 mb-2 px-1">Pipeline Stages</p>
          <div className="flex flex-col gap-1">
            {stages.map((s) => (
              <div
                key={s.id}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition ${
                  s.status === "done"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : s.status === "active"
                    ? "bg-[#00a2ff]/10 text-[#00a2ff]"
                    : "text-white/40"
                }`}
              >
                {s.status === "done" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                ) : s.status === "active" ? (
                  <Loader className="h-3.5 w-3.5 shrink-0 animate-spin text-[#00a2ff]" />
                ) : (
                  <Circle className="h-3.5 w-3.5 shrink-0 text-white/20" />
                )}
                <span className="font-medium truncate">{STAGE_ICONS[s.id]} {s.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="rounded-xl border border-white/10 bg-[#0d1525] overflow-hidden flex flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-2">
                <Rocket className="h-8 w-8 text-[#00a2ff]" />
                <p className="text-sm font-semibold text-white">Tell GPT what to build.</p>
                <p className="text-xs text-white/40 max-w-[280px]">
                  GPT has full operator access — research, strategy, branding, website generation, provisioning, Google sync, dominance, and validation. All through this chat.
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${msg.role === "user" ? "bg-[#00a2ff] text-white font-medium" : "bg-white/5 text-white/80"}`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.actions?.length > 0 && (
                    <div className="mt-2 space-y-1 border-t border-white/10 pt-2">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-white/40">Execution Receipts</p>
                      {msg.actions.map((a, j) => (
                        <div key={j} className="text-xs flex items-start gap-1.5">
                          <span className={`font-bold ${a.status === "completed" ? "text-emerald-400" : "text-red-400"}`}>
                            {a.status === "completed" ? "✓" : "✗"}
                          </span>
                          <span className="text-white/60">
                            <b className="text-white/80">{a.tool || a.system}</b>: {a.detail || a.target || ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-white/5 px-3.5 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-[#00a2ff]" />
                  <span className="text-sm text-white/50">GPT is working...</span>
                </div>
              </div>
            )}
          </div>
          {/* Input */}
          <div className="border-t border-white/10 bg-[#0d1525] p-2.5">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Follow up or guide GPT..."
                rows={1}
                className="flex-1 rounded-xl border border-white/10 bg-[#0a1220] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#00a2ff]/50 outline-none resize-none max-h-24"
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00a2ff] text-white disabled:opacity-50 hover:bg-[#0090e0] transition"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Preview + Checklist */}
        <div className="flex flex-col gap-3 min-h-0">
          <div className="flex-1 min-h-[200px]">
            <SandboxPreview url={previewUrl} />
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0d1525] p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-white/30 mb-2">Package Checklist</p>
            <div className="flex flex-col gap-1.5">
              {checklist.map((c) => (
                <div key={c.id} className="flex items-center gap-2 text-xs">
                  {c.done ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 shrink-0 text-white/20" />
                  )}
                  <span className={c.done ? "text-emerald-400 font-medium" : "text-white/40"}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}