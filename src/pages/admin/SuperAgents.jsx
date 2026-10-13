import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Brain, Zap, Shield, Clock, Activity, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const AGENTS = [
  { name: 'Eden Skye', role: 'Executive AI Receptionist', icon: '🎧', desc: 'Handles all inbound SMS, voice calls, and visitor inquiries via Twilio + HeyGen avatar. Warm Sol-like voice.', schedule: '24/7 Always On', tools: ['Twilio SMS', 'HeyGen Avatar', 'AI Chat', 'CRM'] },
  { name: 'Apex Orchestrator', role: 'Master Coordinator', icon: '👑', desc: 'Orchestrates all super agents, assigns tasks, and ensures every system runs autonomously.', schedule: '24/7 Always On', tools: ['All Systems', 'Task Routing', 'Escalation'] },
  { name: 'SEO Manager', role: 'SEO/AEO/GEO Optimizer', icon: '📊', desc: 'Continuously optimizes every site for Google first-page rankings across SEO, AEO, and GEO.', schedule: 'Hourly', tools: ['Google Standard', 'God Mode', 'Content Enhancement'] },
  { name: 'Site Factory Manager', role: 'Website Builder', icon: '🏗️', desc: 'Builds and deploys websites from templates with brand generation and benchmark enhancement.', schedule: 'On-Demand + Daily', tools: ['Template Engine', 'Brand Generator', 'Deploy'] },
  { name: 'Swarm Orchestrator', role: 'Agent Swarm Controller', icon: '🐝', desc: 'Manages the agent swarm for parallel site validation, testing, and mass launch operations.', schedule: '24/7 Always On', tools: ['Swarm Tasks', 'Validation', 'Testing'] },
  { name: 'Comms Manager', role: 'Communications Director', icon: '📨', desc: 'Manages all outbound communications, email campaigns, and 3-day follow-up sequences.', schedule: 'Daily + On-Trigger', tools: ['Email Automation', 'CRM Follow-up', 'Eden Skye'] },
  { name: 'Social Media Manager', role: 'Content Publisher', icon: '📱', desc: 'Generates and publishes social media content across Facebook with AI-optimized posts.', schedule: 'Daily', tools: ['Facebook API', 'Content Gen', 'Scheduling'] },
  { name: 'System Operator', role: 'Infrastructure Guardian', icon: '🛡️', desc: 'Monitors system health, runs healing cycles, and eliminates all points of failure.', schedule: 'Every 1 Day', tools: ['Health Checks', 'Auto-Heal', 'Gap Analysis'] },
  { name: 'Build Factory', role: 'Code Engineer', icon: '⚙️', desc: 'Autonomously builds and refactors code, functions, and backend systems.', schedule: 'On-Demand', tools: ['Code Gen', 'Refactoring', 'Testing'] },
  { name: 'Reputation Manager', role: 'Review & Reputation', icon: '⭐', desc: 'Manages online reviews, sends review requests, and monitors brand sentiment.', schedule: 'Daily', tools: ['Review Requests', 'Sentiment', 'Google'] },
];

export default function SuperAgents() {
  const [agents, setAgents] = useState(AGENTS);
  const [health, setHealth] = useState({});
  const [loading, setLoading] = useState(true);

  const loadHealth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('systemAuditor', { action: 'agent_health' }).catch(() => null);
      if (res?.data) setHealth(res.data);
    } catch (e) { /* noop */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadHealth(); }, [loadHealth]);

  return (
    <div className="min-h-screen bg-[#050508] p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a1220] to-[#0d1a2e] p-6">
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-[#00a2ff]" />
            <div>
              <h1 className="text-2xl font-extrabold text-white">Super Agents</h1>
              <p className="text-sm text-white/60">Your autonomous digital workforce — operating 24/7 as employees of your digital business</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => {
            const agentHealth = health[agent.name];
            const isHealthy = agentHealth?.status !== 'down';
            return (
              <div key={agent.name} className="rounded-2xl border border-white/10 bg-[#0a1220] p-5 hover:border-green-400/50 hover:shadow-[0_0_16px_-2px_rgba(34,197,94,0.4)] transition-all duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-2xl">{agent.icon}</div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{agent.name}</h3>
                      <p className="text-[10px] uppercase tracking-wider text-[#00a2ff]">{agent.role}</p>
                    </div>
                  </div>
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full ${isHealthy ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    {isHealthy ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <AlertCircle className="h-4 w-4 text-red-400" />}
                  </div>
                </div>
                <p className="text-xs text-white/60 mb-3 leading-relaxed">{agent.desc}</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="h-3.5 w-3.5 text-white/40" />
                    <span className="text-white/40">Schedule:</span>
                    <span className="font-semibold text-white">{agent.schedule}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Activity className="h-3.5 w-3.5 text-white/40" />
                    <span className="text-white/40">Health:</span>
                    <span className={`font-semibold ${isHealthy ? 'text-green-400' : 'text-red-400'}`}>{isHealthy ? 'Healthy' : 'Down'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Zap className="h-3.5 w-3.5 text-white/40" />
                    <span className="text-white/40">Last Worked:</span>
                    <span className="font-semibold text-white">{agentHealth?.last_worked || 'Active now'}</span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {agent.tools.map(t => (
                    <span key={t} className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-[#00a2ff]/10 text-[#00a2ff] border border-[#00a2ff]/20">{t}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {loading && <div className="text-center text-white/40 py-4"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>}
      </div>
    </div>
  );
}