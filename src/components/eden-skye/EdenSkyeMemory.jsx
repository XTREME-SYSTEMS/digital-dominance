import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Brain, CheckCircle2, Phone, MessageSquare, Mail, Clock } from 'lucide-react';

const CHANNEL_ICONS = { voice: Phone, sms: MessageSquare, email: Mail, mms: MessageSquare, whatsapp: MessageSquare };
const SENTIMENT_COLORS = {
  positive: 'text-green-400 bg-green-500/10',
  neutral: 'text-white/60 bg-white/5',
  negative: 'text-red-400 bg-red-500/10',
  mixed: 'text-amber-400 bg-amber-500/10',
};

export default function EdenSkyeMemory() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('edenSkye', { action: 'list_memories', limit: 30 });
      setMemories(res.data?.memories || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const review = async (id) => {
    try {
      await base44.functions.invoke('edenSkye', { action: 'review_memory', memory_id: id });
      load();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-[#00a2ff]" />
        <h3 className="text-sm font-bold text-white">Conversation Memory Log</h3>
        <span className="ml-auto text-xs text-white/40">{memories.length} memories</span>
      </div>
      {loading && <p className="text-sm text-white/40 text-center py-8">Loading memories...</p>}
      {!loading && memories.length === 0 && (
        <div className="text-center py-12 rounded-2xl border border-white/10 bg-[#0a1220]">
          <Brain className="h-10 w-10 text-white/20 mx-auto mb-2" />
          <p className="text-sm text-white/40">No memories yet — Eden Skye will log every conversation here.</p>
        </div>
      )}
      {memories.map((m) => {
        const Icon = CHANNEL_ICONS[m.channel] || MessageSquare;
        return (
          <div key={m.id} className={`rounded-xl border p-4 ${m.status === 'new' ? 'border-[#00a2ff]/30 bg-[#00a2ff]/5' : 'border-white/10 bg-[#0a1220]'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 flex-shrink-0">
                  <Icon className="h-4 w-4 text-[#00a2ff]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-white">{m.contact_name || 'Unknown'}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${SENTIMENT_COLORS[m.sentiment] || SENTIMENT_COLORS.neutral}`}>{m.sentiment}</span>
                    {m.status === 'new' && <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#00a2ff]/20 text-[#00a2ff]">New</span>}
                  </div>
                  <p className="text-xs text-white/70 line-clamp-2">{m.summary}</p>
                  {m.contact_phone && <p className="text-[10px] text-white/40 mt-1">{m.contact_phone}</p>}
                </div>
              </div>
              {m.status === 'new' && (
                <button onClick={() => review(m.id)} className="flex-shrink-0 rounded-lg bg-white/5 p-2 hover:bg-white/10" title="Mark reviewed">
                  <CheckCircle2 className="h-4 w-4 text-white/60" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}