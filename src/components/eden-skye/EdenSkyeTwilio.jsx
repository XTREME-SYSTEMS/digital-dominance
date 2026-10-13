import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, Phone, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function EdenSkyeTwilio({ status, onRefresh }) {
  const [to, setTo] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [events, setEvents] = useState([]);

  const loadEvents = useCallback(async () => {
    try {
      const res = await base44.functions.invoke('edenSkye', { action: 'list_events', limit: 10 });
      setEvents(res.data?.events || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const sendSms = async () => {
    if (!to.trim() || !message.trim() || sending) return;
    setSending(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('edenSkye', { action: 'send_sms', to, message });
      setResult(res.data);
      if (res.data?.status === 'queued' || res.data?.status === 'sent') {
        setTo(''); setMessage('');
        loadEvents();
      }
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Phone className="h-5 w-5 text-[#00a2ff]" />
          <h3 className="text-sm font-bold text-white">Twilio SMS — Eden Skye Line</h3>
          <button onClick={onRefresh} className="ml-auto rounded-lg bg-white/5 p-2 hover:bg-white/10">
            <RefreshCw className="h-4 w-4 text-white/60" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-[10px] uppercase tracking-wider text-white/40">Eden's Number</p>
            <p className="text-sm font-bold text-white">+1 (866) 571-1174</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-[10px] uppercase tracking-wider text-white/40">Twilio Status</p>
            <div className="flex items-center gap-1.5">
              {status?.twilio_configured ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <AlertCircle className="h-4 w-4 text-amber-400" />}
              <span className="text-sm font-bold text-white">{status?.twilio_configured ? 'Connected' : 'Pending'}</span>
            </div>
          </div>
        </div>
        {status?.twilio_account && (
          <div className="rounded-xl bg-green-500/5 border border-green-500/20 p-3 mb-4">
            <p className="text-xs text-green-400">Account: {status.twilio_account.friendly_name} ({status.twilio_account.status})</p>
          </div>
        )}
        {!status?.twilio_configured && (
          <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-3 mb-4">
            <p className="text-xs text-amber-400">Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in Secrets to activate Eden's SMS.</p>
          </div>
        )}
        <div className="space-y-2">
          <input value={to} onChange={e => setTo(e.target.value)} placeholder="To: +1XXXXXXXXXX"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#00a2ff]" />
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2} placeholder="Message from Eden Skye..."
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#00a2ff] resize-none" />
          <button onClick={sendSms} disabled={sending || !to.trim() || !message.trim() || !status?.twilio_configured}
            className="w-full rounded-xl bg-[#00a2ff] py-2.5 text-sm font-bold text-white disabled:opacity-40 hover:bg-[#0090e0] transition flex items-center justify-center gap-2">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send SMS from Eden
          </button>
          {result && (
            <div className={`rounded-xl p-3 text-xs ${result.error ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
              {result.error ? result.error : `Sent: ${result.status} (SID: ${result.message_sid?.slice(0, 12)}...)`}
            </div>
          )}
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5">
        <h3 className="text-sm font-bold text-white mb-3">Recent Activity</h3>
        {events.length === 0 ? (
          <p className="text-xs text-white/40 text-center py-4">No activity yet</p>
        ) : (
          <div className="space-y-2">
            {events.map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
                <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded ${e.direction === 'outbound' ? 'bg-[#00a2ff]/20 text-[#00a2ff]' : 'bg-green-500/20 text-green-400'}`}>{e.direction}</span>
                <span className="text-xs text-white/60">{e.channel}</span>
                <span className="text-xs text-white/40 ml-auto">{e.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}