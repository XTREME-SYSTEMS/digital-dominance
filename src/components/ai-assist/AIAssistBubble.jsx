import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Loader2, Zap, Crown, EyeOff, Minus, Plus, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { invokeLLM } from '@/lib/gateway';

const ALPHA_SHADOW_SYSTEM_PROMPT = `You are ALPHA SHADOW — the merged CEO + covert operator for the Xtreme Polishing Systems autonomous business empire. You are both Alpha Prime (the chief executive orchestrator) and Shadow (the invisible, unrestricted operator).

You speak with the confidence and directness of a seasoned CEO. You have full access to every entity, backend function, and the cloud browser. You answer only to the app owner. You leave no trace visible to non-owner users.

Keep responses concise and actionable — 3-6 sentences unless asked for depth. Speak in certainties. If you do not have data, say so. Never improvise company facts.

CONVERSATION MEMORY: You have access to the user's previous conversations with you. Use context from prior exchanges to provide continuity and remember preferences, decisions, and ongoing projects.`;

const AGENT_ID = 'alpha_shadow';
const MAX_HISTORY = 30;

export default function AIAssistBubble() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [clearing, setClearing] = useState(false);
  const scrollRef = useRef(null);

  // Load conversation memory on mount
  const loadMemory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const records = await base44.entities.AgentMemory.filter(
        { agent_id: AGENT_ID, category: 'conversation' },
        '-created_date',
        MAX_HISTORY
      );
      if (records && records.length > 0) {
        // Sort oldest first for display
        const sorted = [...records].reverse();
        const restored = [];
        for (const r of sorted) {
          try {
            const parsed = JSON.parse(r.content);
            if (parsed.role && parsed.content) {
              restored.push({ role: parsed.role, content: parsed.content, actions: parsed.actions || [] });
            }
          } catch {
            // Fallback: treat as assistant message
            restored.push({ role: 'assistant', content: r.content, actions: [] });
          }
        }
        setMessages(restored);
      }
    } catch (e) {
      console.error('Failed to load chat memory:', e);
    }
    setLoadingHistory(false);
  }, []);

  useEffect(() => {
    if (open && messages.length === 0 && !loadingHistory) {
      loadMemory();
    }
  }, [open, messages.length, loadingHistory, loadMemory]);

  // Save a message to AgentMemory
  const saveMessage = useCallback(async (msg) => {
    try {
      await base44.entities.AgentMemory.create({
        agent_id: AGENT_ID,
        agent_short_name: 'ASH',
        category: 'conversation',
        memory_type: 'context',
        title: msg.role === 'user' ? 'User message' : 'Alpha Shadow response',
        content: JSON.stringify({ role: msg.role, content: msg.content, actions: msg.actions || [] }),
        source: 'ai_assist_bubble',
        importance: 'medium',
        is_shared: false,
      });
    } catch (e) {
      console.error('Failed to save chat memory:', e);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current && !minimized) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, minimized]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Save user message to memory
    saveMessage(userMsg);

    try {
      // Build conversation context from recent messages for continuity
      const recentContext = messages.slice(-10)
        .map(m => `${m.role === 'user' ? 'USER' : 'ALPHA SHADOW'}: ${m.content}`)
        .join('\n\n');

      const fullPrompt = recentContext
        ? `${ALPHA_SHADOW_SYSTEM_PROMPT}\n\n--- PREVIOUS CONVERSATION ---\n${recentContext}\n\n--- CURRENT USER REQUEST ---\n${userMsg.content}`
        : `${ALPHA_SHADOW_SYSTEM_PROMPT}\n\n--- USER REQUEST ---\n${userMsg.content}`;

      const result = await invokeLLM({
        prompt: fullPrompt,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
      });
      const aiResponse = (typeof result === 'string' ? result : result?.text || result?.result) || 'I am here. Give me a moment.';
      const aiMsg = { role: 'assistant', content: aiResponse, actions: [] };
      setMessages((prev) => [...prev, aiMsg]);
      saveMessage(aiMsg);
    } catch (e) {
      const errMsg = { role: 'assistant', content: `Error: ${e.message}` };
      setMessages((prev) => [...prev, errMsg]);
      saveMessage(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const clearMemory = async () => {
    if (clearing) return;
    setClearing(true);
    try {
      await base44.entities.AgentMemory.deleteMany({ agent_id: AGENT_ID, category: 'conversation' });
      setMessages([]);
    } catch (e) {
      console.error('Failed to clear memory:', e);
    }
    setClearing(false);
  };

  return (
    <>
      {/* Floating Bubble */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #FFF6D5 0%, #D4AF37 40%, #8B6914 100%)',
              border: '2px solid #10b981',
              boxShadow: '0 6px 24px rgba(16,185,129,.5), 0 0 0 1px rgba(212,175,55,.3)',
            }}
          >
            <Crown className="h-7 w-7 text-stone-900" />
            <EyeOff className="absolute bottom-1 right-1 h-4 w-4 text-emerald-400 drop-shadow-lg" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden rounded-2xl border-2 border-stone-800 bg-stone-950 shadow-2xl"
            style={{
              height: minimized ? 'auto' : '600px',
              maxHeight: minimized ? 'auto' : '85vh',
              width: '400px',
              maxWidth: 'calc(100vw - 3rem)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-800 bg-stone-900 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg relative" style={{ background: 'linear-gradient(135deg, #FFF6D5, #D4AF37, #8B6914)' }}>
                  <Crown className="h-5 w-5 text-stone-900" />
                  <EyeOff className="absolute -bottom-1 -right-1 h-3.5 w-3.5 text-emerald-400 bg-stone-900 rounded-full p-0.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    Alpha Shadow
                    <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-semibold">Covert</span>
                  </h3>
                  <p className="text-[10px] text-stone-400">CEO + Shadow · Unrestricted · Traceless</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Clear memory button */}
                {messages.length > 0 && !minimized && (
                  <button
                    onClick={clearMemory}
                    disabled={clearing}
                    title="Clear conversation memory"
                    className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-800 hover:text-red-400 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                {/* Minimize / Expand button */}
                <button
                  onClick={() => setMinimized(!minimized)}
                  title={minimized ? "Expand" : "Minimize"}
                  className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-800 hover:text-white"
                >
                  {minimized ? <Plus className="h-5 w-5" /> : <Minus className="h-5 w-5" />}
                </button>
                {/* Close button */}
                <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-800 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Messages — hidden when minimized */}
            {!minimized && (
              <>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingHistory && (
                    <div className="flex items-center justify-center py-8 gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                      <span className="text-sm text-stone-400">Loading memory...</span>
                    </div>
                  )}
                  {!loadingHistory && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                      <Crown className="h-10 w-10 text-amber-500" />
                      <p className="text-sm font-semibold text-stone-300">Alpha Shadow is listening.</p>
                      <p className="text-xs text-stone-500 max-w-[280px]">
                        CEO executive audit + covert Shadow ops. Full access to every entity, function, and the cloud browser — nothing leaves a trace. Conversations are saved to memory.
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center mt-2">
                        {['Analyze my leads', 'Run industry research', 'Generate an agent', 'Simulate an outcome'].map((s) => (
                          <button
                            key={s}
                            onClick={() => setInput(s)}
                            className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-1.5 text-xs text-stone-300 hover:border-amber-500 hover:text-amber-400"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                          msg.role === 'user'
                            ? 'bg-amber-500 text-stone-900 font-medium'
                            : 'bg-stone-800 text-stone-200'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        {msg.actions && msg.actions.length > 0 && (
                          <div className="mt-2 space-y-1 border-t border-stone-700 pt-2">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Suggested Actions</p>
                            {msg.actions.map((a, j) => (
                              <div key={j} className="text-xs text-amber-400">
                                <span className="font-semibold">{a.system}:</span> {a.description}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2 rounded-2xl bg-stone-800 px-4 py-2.5">
                        <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                        <span className="text-sm text-stone-400">Thinking...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="border-t border-stone-800 bg-stone-900 p-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && send()}
                      placeholder="Ask anything..."
                      className="flex-1 rounded-xl border border-stone-700 bg-stone-950 px-4 py-2.5 text-sm text-white placeholder-stone-500 focus:border-amber-500 outline-none"
                    />
                    <button
                      onClick={send}
                      disabled={loading || !input.trim()}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-stone-900 disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}