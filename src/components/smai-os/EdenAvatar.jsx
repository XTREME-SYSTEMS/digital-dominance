import React, { useState, useEffect } from "react";
import { Sparkles, MessageCircle } from "lucide-react";

// Eden Skye — AI avatar that welcomes clients and guides them through the approval gate.
// Renders as a glowing orb with a chat interface.
export default function EdenAvatar({ messages, onSend, thinking }) {
  const [input, setInput] = useState("");
  const [displayedMessages, setDisplayedMessages] = useState(messages || []);

  useEffect(() => {
    setDisplayedMessages(messages || []);
  }, [messages]);

  const send = () => {
    if (!input.trim() || thinking) return;
    onSend?.(input.trim());
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#03070d] to-[#0a0a0a]">
      {/* Eden avatar header */}
      <div className="flex flex-col items-center pt-8 pb-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[#00D4FF]/30 blur-2xl animate-pulse" />
          <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-[#00D4FF] via-[#2196F3] to-[#0040CC] flex items-center justify-center shadow-[0_0_40px_rgba(0,212,255,0.4)]">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
        </div>
        <h2 className="mt-4 text-xl font-bold text-white">Eden Skye</h2>
        <p className="text-xs text-[#00D4FF] font-semibold uppercase tracking-widest">Your AI Guide</p>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 space-y-4 pb-4">
        {displayedMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "client" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === "client"
                  ? "bg-[#00D4FF]/20 border border-[#00D4FF]/30 text-white"
                  : "bg-stone-800/80 border border-stone-700 text-stone-100"
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex justify-start">
            <div className="bg-stone-800/80 border border-stone-700 rounded-2xl px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#00D4FF] animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 rounded-full bg-[#00D4FF] animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 rounded-full bg-[#00D4FF] animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-stone-800 p-4">
        <div className="flex items-center gap-2 rounded-xl bg-stone-800/80 border border-stone-700 px-4 py-2">
          <MessageCircle className="h-4 w-4 text-stone-500 shrink-0" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask Eden anything..."
            className="flex-1 bg-transparent text-sm text-white placeholder-stone-500 outline-none"
          />
          <button
            onClick={send}
            disabled={!input.trim() || thinking}
            className="rounded-lg bg-[#00D4FF] px-4 py-1.5 text-xs font-bold text-black disabled:opacity-40 hover:bg-[#00D4FF]/80 transition"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}