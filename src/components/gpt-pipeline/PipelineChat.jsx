import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Crown, Trash2, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const AGENT_ID = "gpt_sync_pipeline";
const MAX_HISTORY = 40;

const QUICK_PROMPTS = [
  "Search the top 5 competitors for epoxy garage floors in Pompano Beach, FL and benchmark their strategies",
  "Generate 10 business strategies for a water damage restoration company, then I'll pick one",
  "Create a complete brand pack: logo, colors, fonts, and domain suggestion for a roofing company",
  "Build and deploy a website for an AC repair business, then sync it to Google Search Console and Analytics",
  "Generate a 20-day social media calendar with video and image posts for a landscaping company",
  "Launch a digital dominance campaign: 50 programmatic websites for pest control across Florida cities",
  "Run a full system audit and validate all sites are Google-compliant, fix any gaps found",
  "Provision a new Supabase project and Railway worker for a solar installation business website",
];

export default function PipelineChat({ externalPrompt, onPromptConsumed }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
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
        setMessages(sorted.map((r) => {
          try { const p = JSON.parse(r.content); return { role: p.role, content: p.content, actions: p.actions || [] }; }
          catch { return { role: "assistant", content: r.content, actions: [] }; }
        }));
      }
    } catch (e) { console.error("Chat memory load failed:", e); }
    setHistoryLoaded(true);
  }, [user?.id]);

  useEffect(() => {
    if (user?.role === "admin" && !historyLoaded) loadMemory();
  }, [user?.role, historyLoaded, loadMemory]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  // Handle external prompt injection from quick-actions
  useEffect(() => {
    if (externalPrompt) {
      setInput(externalPrompt);
      onPromptConsumed?.();
    }
  }, [externalPrompt, onPromptConsumed]);

  const saveMessage = useCallback(async (msg) => {
    try {
      await base44.entities.AgentMemory.create({
        agent_id: AGENT_ID, owner_id: user.id, agent_short_name: "GPT",
        category: "conversation", memory_type: "context",
        title: msg.role === "user" ? "User message" : "GPT Pipeline response",
        content: JSON.stringify({ role: msg.role, content: msg.content.slice(0, 7000), actions: (msg.actions || []).slice(-8).map(a => ({ ...a, detail: (a.detail || "").slice(0, 300) })) }),
        source: "gpt_sync_pipeline", importance: "high", is_shared: false,
      });
    } catch (e) { console.error("Save message failed:", e); }
  }, [user?.id]);

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
      if (!response.data?.ok || !response.data.text) throw new Error(response.data?.error || "No response from operator.");
      const aiMsg = { role: "assistant", content: response.data.text, actions: response.data.receipts || [] };
      setMessages((p) => [...p, aiMsg]);
      saveMessage(aiMsg);
    } catch (e) {
      const errMsg = { role: "assistant", content: `Error: ${e.message}` };
      setMessages((p) => [...p, errMsg]);
      saveMessage(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const clearMemory = async () => {
    if (!confirm("Clear all conversation history?")) return;
    try {
      await base44.entities.AgentMemory.deleteMany({ agent_id: AGENT_ID, category: "conversation", $or: [{ owner_id: user.id }, { created_by_id: user.id }] });
      setMessages([]);
    } catch (e) { console.error("Clear failed:", e); }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "linear-gradient(135deg, #FFF6D5, #D4AF37, #8B6914)" }}>
            <Crown className="h-4 w-4 text-stone-900" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900">GPT Bi-Directional Sync</h3>
            <p className="text-[10px] text-stone-500">Full operator access · All tools · Vercel AI Gateway</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearMemory} className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-red-500">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <Crown className="h-10 w-10 text-amber-500" />
            <p className="text-sm font-semibold text-stone-700">Tell GPT what website you want to build.</p>
            <p className="text-xs text-stone-500 max-w-[300px]">
              GPT has full operator access: research, strategy, branding, website generation, provisioning, Google sync, and mass dominance — all through this chat.
            </p>
            <div className="flex flex-col gap-1.5 mt-3 w-full max-w-[320px]">
              {QUICK_PROMPTS.slice(0, 4).map((p) => (
                <button key={p} onClick={() => send(p)} className="text-left rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-600 hover:border-amber-400 hover:text-amber-700 transition">
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === "user" ? "bg-amber-500 text-stone-900 font-medium" : "bg-stone-100 text-stone-800"}`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.actions?.length > 0 && (
                <div className="mt-2 space-y-1 border-t border-stone-300/50 pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">Execution Results</p>
                  {msg.actions.map((a, j) => (
                    <div key={j} className="text-xs flex items-start gap-1.5">
                      <span className={`font-bold ${a.status === "completed" ? "text-emerald-600" : "text-red-500"}`}>{a.status === "completed" ? "✓" : "✗"}</span>
                      <span className="text-stone-700"><b>{a.tool || a.system}</b>: {a.detail || a.target || ""}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-stone-100 px-4 py-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
              <span className="text-sm text-stone-500">GPT is working...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick prompts bar */}
      {messages.length > 0 && (
        <div className="border-t border-stone-200 bg-stone-50 px-3 py-2 flex gap-1.5 overflow-x-auto">
          {QUICK_PROMPTS.slice(4).map((p) => (
            <button key={p} onClick={() => send(p)} className="shrink-0 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-[10px] text-stone-600 hover:border-amber-400 hover:text-amber-700 whitespace-nowrap">
              {p.slice(0, 40)}...
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-stone-200 bg-white p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Tell GPT what to build, deploy, or dominate..."
            rows={1}
            className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:border-amber-500 focus:bg-white outline-none resize-none max-h-32"
          />
          <button onClick={() => send()} disabled={loading || !input.trim()} className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-stone-900 disabled:opacity-50 hover:bg-amber-400 transition">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}