import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2 } from 'lucide-react';

export default function EdenSkyeChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [contact, setContact] = useState({ name: '', phone: '' });
  const scrollRef = useRef(null);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || sending) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setSending(true);
    try {
      const res = await base44.functions.invoke('edenSkye', {
        action: 'chat',
        message: currentInput,
        contact_name: contact.name || 'Admin',
        contact_phone: contact.phone,
        history: messages.map(m => ({ role: m.role, content: m.content })),
      });
      const reply = res.data?.reply || 'I apologize, I had trouble processing that.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e.message}` }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] rounded-2xl border border-white/10 bg-[#0a1220] overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-white/40 text-sm">
            Start a conversation with Eden Skye — she remembers context and responds with Sol-like warmth.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${m.role === 'user' ? 'bg-[#00a2ff] text-white' : 'bg-white/10 text-white/90'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-white/10 rounded-2xl px-4 py-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-white/60" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>
      <div className="border-t border-white/10 p-3 space-y-2">
        <div className="flex gap-2">
          <input value={contact.name} onChange={e => setContact({ ...contact, name: e.target.value })}
            placeholder="Caller name (optional)" className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#00a2ff]" />
          <input value={contact.phone} onChange={e => setContact({ ...contact, phone: e.target.value })}
            placeholder="Caller phone (optional)" className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#00a2ff]" />
        </div>
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Message Eden Skye..." className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#00a2ff]" />
          <button onClick={send} disabled={sending || !input.trim()}
            className="rounded-lg bg-[#00a2ff] px-4 py-2.5 text-white disabled:opacity-40 hover:bg-[#0090e0] transition">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}