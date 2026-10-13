import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, Activity, CheckCircle2, AlertCircle, Loader2, RefreshCw, Clock, Zap } from 'lucide-react';

const SYSTEM_PARTS = [
  { id: 'frontend', name: 'Frontend Pages', icon: '🖥️' },
  { id: 'backend', name: 'Backend Functions', icon: '⚙️' },
  { id: 'entities', name: 'Database Entities', icon: '🗄️' },
  { id: 'agents', name: 'AI Agents', icon: '🤖' },
  { id: 'workflows', name: 'Automated Workflows', icon: '🔄' },
  { id: 'integrations', name: 'External Integrations', icon: '🔌' },
  { id: 'connectors', name: 'OAuth Connectors', icon: '🔗' },
  { id: 'secrets', name: 'Secrets & Env Vars', icon: '🔐' },
  { id: 'twilio', name: 'Twilio (Eden Skye)', icon: '📱' },
  { id: 'heygen', name: 'HeyGen Avatar', icon: '🎬' },
  { id: 'crm', name: 'CRM & Follow-up', icon: '📨' },
  { id: 'validation', name: 'Site Validation', icon: '✅' },
];

export default function SystemHeal() {
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState(null);

  const runCheck = useCallback(async () => {
    setRunning(true);
    setResults({});
    try {
      const res = await base44.functions.invoke('systemAuditor', { action: 'full_system_check' }).catch(() => null);
      if (res?.data) {
        setResults(res.data);
        setLastRun(new Date().toISOString());
      }
    } catch (e) { /* noop */ }
    setRunning(false);
  }, []);

  useEffect(() => { runCheck(); }, [runCheck]);

  const passed = Object.values(results).filter(r => r?.status === 'healthy').length;
  const total = SYSTEM_PARTS.length;

  return (
    <div className="min-h-screen bg-[#050508] p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a1220] to-[#0d1a2e] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-green-400" />
              <div>
                <h1 className="text-2xl font-extrabold text-white">System Heal</h1>
                <p className="text-sm text-white/60">Automated full system check — runs every 1 day. Checks every part of the system.</p>
              </div>
            </div>
            <button onClick={runCheck} disabled={running}
              className="flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-600 disabled:opacity-50">
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Run Now
            </button>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                <span className="text-xl font-black text-green-400">{running ? '...' : passed}</span>
              </div>
              <div>
                <p className="text-xs text-white/40">Systems Healthy</p>
                <p className="text-sm font-bold text-white">{passed} / {total} passed</p>
              </div>
            </div>
            {lastRun && (
              <div className="flex items-center gap-1.5 text-xs text-white/40">
                <Clock className="h-3.5 w-3.5" /> Last run: {new Date(lastRun).toLocaleString()}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {SYSTEM_PARTS.map(part => {
            const result = results[part.id];
            const status = running ? 'checking' : (result?.status || 'pending');
            return (
              <div key={part.id} className={`rounded-xl border p-4 ${status === 'healthy' ? 'border-green-400/30 bg-green-500/5' : status === 'unhealthy' ? 'border-red-400/30 bg-red-500/5' : 'border-white/10 bg-[#0a1220]'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{part.icon}</span>
                    <span className="text-sm font-bold text-white">{part.name}</span>
                  </div>
                  {status === 'healthy' && <CheckCircle2 className="h-5 w-5 text-green-400" />}
                  {status === 'unhealthy' && <AlertCircle className="h-5 w-5 text-red-400" />}
                  {status === 'checking' && <Loader2 className="h-5 w-5 text-white/40 animate-spin" />}
                  {status === 'pending' && <Activity className="h-5 w-5 text-white/20" />}
                </div>
                <p className="text-xs text-white/50">{result?.detail || (running ? 'Checking...' : 'Awaiting first run')}</p>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-[#00a2ff]" />
            <h3 className="text-sm font-bold text-white">Auto-Heal Schedule</h3>
          </div>
          <p className="text-xs text-white/60">The system health check runs automatically every 1 day. All 12 system parts are verified: frontend, backend, database, agents, workflows, integrations, connectors, secrets, Twilio, HeyGen, CRM, and site validation. Issues are auto-healed when possible, escalated when not.</p>
        </div>
      </div>
    </div>
  );
}