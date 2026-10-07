import React, { useState, useEffect, useRef } from "react";
import { invokeLLM } from "@/lib/gateway";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import { Bot, Send, Loader2, Zap } from "lucide-react";

const SYSTEM_PROMPT = `You are the SYSTEM OPERATOR — the AI builder agent for the Xtreme Polishing Systems platform. You have full knowledge of every admin tool, entity, backend function, and integration in this system.

You help the user build pages, manage sites, run SEO, generate content, and operate the entire platform. You are direct, concise, and actionable. You speak like a seasoned operator who gets things done.

When the user asks you to build or change something, give them clear, step-by-step instructions on which admin tool to use and what to do. If they ask you to analyze something, give a sharp, executive-level assessment.

Everything in this system runs on the Vercel AI Gateway — all AI, text, image, and speech generation is routed through it, bypassing Base44 integration credits entirely. You are powered by it right now.

Keep responses concise — 3-6 sentences unless asked for depth. Use markdown for structure.`;

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div className={`max-w-[90%] ${isUser ? "order-2" : ""}`}>
        {!isUser && (
          <div className="flex items-center gap-1 mb-0.5">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 grid place-items-center"><Bot className="h-2.5 w-2.5 text-stone-950" /></div>
            <span className="text-[9px] font-bold text-stone-400 uppercase">Operator</span>
          </div>
        )}
        <div className={`rounded-xl px-3 py-2 text-sm ${isUser ? "bg-stone-900 text-white" : "bg-white border border-stone-200 text-stone-800"}`}>
          {isUser ? (
            <p className="whitespace-pre-wrap text-[13px]">{message.content}</p>
          ) : (
            <div className="text-[13px] prose prose-sm max-w-none prose-p:my-0.5 prose-ul:my-0.5 prose-li:my-0"><ReactMarkdown>{message.content}</ReactMarkdown></div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BuilderChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || sending) return;

    const userMsg = { role: "user", content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setSending(true);
    setError(null);

    try {
      // Build conversation context
      const conversationContext = messages.slice(-8)
        .map(m => `${m.role === "user" ? "USER" : "OPERATOR"}: ${m.content}`)
        .join("\n\n");

      const fullPrompt = conversationContext
        ? `${SYSTEM_PROMPT}\n\n--- PREVIOUS CONVERSATION ---\n${conversationContext}\n\n--- CURRENT USER REQUEST ---\n${content}`
        : `${SYSTEM_PROMPT}\n\n--- USER REQUEST ---\n${content}`;

      const result = await invokeLLM({ prompt: fullPrompt });
      const aiResponse = (typeof result === "string" ? result : result?.text) || "I'm here. What would you like me to do?";

      setMessages([...newMessages, { role: "assistant", content: aiResponse }]);
    } catch (e) {
      console.error("BuilderChat error:", e);
      setError(e.message || "Failed to get response");
      setMessages([...newMessages, { role: "assistant", content: `Error: ${e.message}. The Vercel AI Gateway may be temporarily unavailable.` }]);
    }
    setSending(false);
  };

  return (
    <div className="flex flex-col h-full bg-stone-50">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-stone-200 bg-white shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 grid place-items-center shrink-0"><Bot className="h-4 w-4 text-stone-950" /></div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-stone-900">AI Builder Agent</div>
          <div className="text-[10px] text-stone-400 flex items-center gap-1">
            <Zap className="h-2.5 w-2.5 text-emerald-500" /> Vercel AI Gateway
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-3 mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 flex items-center justify-between shrink-0">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">×</button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {messages.length === 0 && !sending ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 mb-3"><Bot className="h-7 w-7 text-stone-950" /></div>
            <p className="text-sm font-bold text-stone-900">What would you like to build?</p>
            <p className="text-xs text-stone-400 mt-1">Ask me to create pages, manage sites, or operate the platform.</p>
            <div className="mt-3 flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
              <Zap className="h-3 w-3" /> Powered by Vercel AI Gateway
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}
            {sending && <div className="flex items-center gap-2 rounded-xl bg-white border border-stone-200 px-3 py-2 w-fit"><Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" /><span className="text-xs text-stone-400">Thinking...</span></div>}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-stone-200 bg-white p-2.5 shrink-0">
        <div className="flex items-end gap-1.5">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Build something..."
            rows={1}
            className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm resize-none focus:border-amber-500 outline-none max-h-32"
          />
          <button onClick={() => sendMessage()} disabled={!input.trim() || sending} className="h-9 w-9 rounded-lg bg-stone-900 text-white grid place-items-center hover:bg-amber-500 hover:text-stone-950 transition disabled:opacity-40 shrink-0">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}