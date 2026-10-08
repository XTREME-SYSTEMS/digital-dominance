import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Loader2, Crown, EyeOff, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';



const AGENT_ID = 'alpha_shadow';
const MAX_HISTORY = 30;

export default function AIAssistBubble() {
  const { user } = useAuth();
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [open, setOpen] = useState(false);
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
        { agent_id: AGENT_ID, category: 'conversation', $or: [{ owner_id: user.id }, { created_by_id: user.id }] },
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
    setHistoryLoaded(true);
  }, [user?.id]);

  useEffect(() => {
    if (user?.role === 'admin' && open && !historyLoaded && !loadingHistory) loadMemory();
  }, [user?.role, open, historyLoaded, loadingHistory, loadMemory]);

  // Save a message to AgentMemory
  const saveMessage = useCallback(async (msg) => {
    try {
      await base44.entities.AgentMemory.create({
        agent_id: AGENT_ID,
        owner_id: user.id,
        agent_short_name: 'ASH',
        category: 'conversation',
        memory_type: 'context',
        title: msg.role === 'user' ? 'User message' : 'Alpha Shadow response',
        content: JSON.stringify({ role: msg.role, content: msg.content.slice(0, 7000), actions: (msg.actions || []).slice(-5).map(a => ({ ...a, detail: (a.detail || '').slice(0, 250) })) }),
        source: 'ai_assist_bubble',
        importance: 'medium',
        is_shared: false,
      });
    } catch (e) {
      console.error('Failed to save chat memory:', e);
    }
  }, [user?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Save user message to memory
    saveMessage(userMsg);

    try {
      const response = await base44.functions.invoke('vercelAiGateway', {
        action: 'operatorChat', message: userMsg.content,
        history: messages.slice(-12).map(({ role, content }) => ({ role, content })),
      });
      if (!response.data?.ok || !response.data.text) throw new Error(response.data?.error || 'The operator returned no response.');
      const aiMsg = { role: 'assistant', content: response.data.text, actions: response.data.receipts || [] };
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
      await base44.entities.AgentMemory.deleteMany({ agent_id: AGENT_ID, category: 'conversation', $or: [{ owner_id: user.id }, { created_by_id: user.id }] });
      setMessages([]);
    } catch (e) {
      console.error('Failed to clear memory:', e);
    }
    setClearing(false);
  };

  if (user?.role !== 'admin') return null;

  return (
    <>
      {/* Slide-in Panel from right edge */}
      <motion.div
        initial={false}
        animate={{ x: open ? 0 : '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-0 right-0 z-50 flex h-screen flex-col border-l-2 border-stone-800 bg-stone-950 shadow-2xl"
        style={{ width: '400px', maxWidth: '100vw' }}
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
              <p className="text-[10px] text-stone-400">CEO + Shadow · Tool-enabled · Results recorded</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={clearMemory}
                disabled={clearing}
                title="Clear conversation memory"
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-800 hover:text-red-400 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-800 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
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
                Inspect, edit and execute through real tools. Provider access is checked when used; the current bridge still runs on Base44. Conversations and execution results are saved.
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
                    <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Execution Results</p>
                    {msg.actions.map((a, j) => (
                      <div key={j} className="text-xs text-amber-400">
                        <span className="font-semibold">{a.tool || a.system}:</span> {a.status ? `${a.status} · ${a.target || ''} · ${a.detail}` : a.description}
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
      </motion.div>

      {/* Right-edge toggle tab — always visible, slides panel in/out */}
      <motion.button
        initial={false}
        animate={{ x: open ? -400 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={() => setOpen(!open)}
        className="fixed top-1/2 right-0 z-50 -translate-y-1/2 flex h-28 w-8 flex-col items-center justify-center gap-2 rounded-l-xl border-r-0 border-2 border-stone-800 bg-stone-900 shadow-xl hover:bg-stone-800 transition-colors"
        style={{ borderColor: '#D4AF37' }}
        title={open ? 'Close Alpha Shadow' : 'Open Alpha Shadow'}
      >
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
        </span>
        <Crown className="h-4 w-4 text-amber-500" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-amber-500" style={{ writingMode: 'vertical-rl' }}>
          {open ? 'Close' : 'Shadow'}
        </span>
      </motion.button>
    </>
  );
}