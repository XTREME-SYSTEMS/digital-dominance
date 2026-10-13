import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Rocket, Activity, Database, FileCode, Shield, Brain, Eye, Zap } from 'lucide-react';

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'benchmarks', label: 'Benchmarks', icon: Database },
  { id: 'prompts', label: 'Prompt Library', icon: FileCode },
  { id: 'agents', label: 'Agents', icon: Brain },
  { id: 'playbook', label: 'Playbook', icon: Rocket },
  { id: 'terminology', label: 'Terminology', icon: Eye },
  { id: 'invoke', label: 'Invoke', icon: Zap },
];

export default function AutonomousCompany() {
  const [section, setSection] = useState('overview');
  const [command, setCommand] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const invoke = async () => {
    if (!command.trim()) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke('autonomousCompanyOrchestrator', { message: command, tier: 'supervised' });
      setResult(res.data);
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <div className="border-b border-white/10 px-4 py-4 md:px-8">
        <h1 className="font-heading text-xl font-extrabold md:text-2xl">Autonomous Software Company</h1>
        <p className="mt-1 text-sm text-white/50">Self-coding, self-auditing, self-healing, self-evolving system</p>
      </div>

      <div className="flex gap-0 overflow-x-auto border-b border-white/10 px-2">
        {SECTIONS.map(s => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-semibold transition ${section === s.id ? 'border-b-2 border-[#00a2ff] text-[#00a2ff]' : 'text-white/40 hover:text-white/70'}`}
            >
              <Icon className="h-4 w-4" /> {s.label}
            </button>
          );
        })}
      </div>

      <div className="p-4 md:p-8">
        {section === 'overview' && <OverviewSection />}
        {section === 'benchmarks' && <BenchmarksSection />}
        {section === 'prompts' && <PromptsSection />}
        {section === 'agents' && <AgentsSection />}
        {section === 'playbook' && <PlaybookSection />}
        {section === 'terminology' && <TerminologySection />}
        {section === 'invoke' && (
          <div className="mx-auto max-w-2xl space-y-4">
            <h2 className="font-heading text-lg font-bold">Master Invocation</h2>
            <p className="text-sm text-white/50">Type a natural language command. The system routes it to the correct agent pipeline and executes autonomously.</p>
            <Input value={command} onChange={e => setCommand(e.target.value)} placeholder="Build a website for a roofing company in Florida..." className="bg-white/5 border-white/10 text-white" onKeyDown={e => e.key === 'Enter' && invoke()} />
            <Button onClick={invoke} disabled={loading || !command.trim()} className="bg-[#00a2ff] text-white hover:bg-[#0090e0]">
              {loading ? 'Routing...' : 'Execute Command'}
            </Button>
            {result && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <pre className="overflow-x-auto text-xs text-white/70">{JSON.stringify(result, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function OverviewSection() {
  const stats = [
    { label: 'Agent Roster', value: '12+' },
    { label: 'Quality Gates', value: '3-step' },
    { label: 'Benchmark Companies', value: '16' },
    { label: 'AI Terminology', value: '200' },
    { label: 'Wealth Categories', value: '20' },
    { label: 'Industry Templates', value: '200' },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-2xl font-extrabold text-[#00a2ff]">{s.value}</div>
            <div className="text-xs text-white/50">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-5">
        <h3 className="font-heading text-lg font-bold">System Capabilities</h3>
        <ul className="space-y-2 text-sm text-white/70">
          <li>✓ Self-coding: autonomous code generation with 3-step quality gates</li>
          <li>✓ Self-auditing: weekly self-reflection cycle with false-green detection</li>
          <li>✓ Self-healing: recursive healing engine on health check failure</li>
          <li>✓ Self-evolving: benchmark scout researches top 3 in every category</li>
          <li>✓ Self-governing: alpha prime audit with system integrity scoring</li>
          <li>✓ 100 steps ahead: vision cortex scans GitHub trending daily</li>
          <li>✓ Passive learning: continuous AI intelligence ingestion</li>
          <li>✓ Bi-directional sync: GitHub, Supabase, Vercel, Railway, Google Workspace</li>
        </ul>
      </div>
    </div>
  );
}

function BenchmarksSection() {
  const [companies, setCompanies] = useState(null);
  React.useEffect(() => {
    base44.entities.BenchmarkCompany.filter({ is_top_20: true }, { sort: '-benchmark_score', limit: 20, fields: ['company_name', 'industry', 'benchmark_score', 'url', 'marketing_intelligence'] }).then(r => setCompanies(r.items)).catch(() => setCompanies([]));
  }, []);
  if (!companies) return <p className="text-white/50">Loading benchmarks...</p>;
  return (
    <div className="space-y-3">
      {companies.map(c => (
        <div key={c.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">{c.company_name}</h3>
            <span className="rounded-full bg-[#00a2ff]/20 px-3 py-1 text-xs font-bold text-[#00a2ff]">{c.benchmark_score}/100</span>
          </div>
          <p className="mt-1 text-xs text-white/40">{c.industry}</p>
          <p className="mt-2 text-sm text-white/60">{c.marketing_intelligence?.slice(0, 200)}...</p>
          <a href={c.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-[#00a2ff] underline">Source</a>
        </div>
      ))}
    </div>
  );
}

function PromptsSection() {
  const prompts = [
    { name: 'Bootstrap', desc: 'Master orchestrator that routes commands to agent pipelines' },
    { name: 'Vision Architect', desc: 'Receives a goal and produces a structured vision document' },
    { name: 'System Architect', desc: 'Maps vision to concrete systems and architecture blueprint' },
    { name: 'Code Engineer', desc: 'Produces working code that passes all quality gates' },
    { name: 'Test Engineer', desc: 'Writes tests and validates postconditions (Devin Review pattern)' },
    { name: 'Security Auditor', desc: 'OWASP Top 10, supply-chain, secrets, RLS checks' },
    { name: 'Deployment Engineer', desc: 'Deploys to staging then production with rollback on failure' },
    { name: 'Validation Guardian', desc: 'Verifies production state matches intent (anti-false-green)' },
    { name: 'Self-Reflection Engine', desc: 'Weekly audit of the system\'s own auditing' },
    { name: 'Benchmark Scout', desc: 'Researches top 3 in every category with source URLs' },
    { name: 'Vision Cortex', desc: 'Keeps system 100 steps ahead by scanning GitHub daily' },
    { name: 'Passive Learner', desc: 'Monitors AI intelligence sources and ingests updates' },
    { name: 'System Monitor', desc: '24/7 health monitoring with auto-healing' },
  ];
  return (
    <div className="space-y-3">
      {prompts.map(p => (
        <div key={p.name} className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="font-bold text-[#00a2ff]">{p.name}</h3>
          <p className="mt-1 text-sm text-white/60">{p.desc}</p>
        </div>
      ))}
    </div>
  );
}

function AgentsSection() {
  const agents = [
    { name: 'Autonomous Orchestrator', tier: 'supervised', model: 'claude-sonnet-5' },
    { name: 'Code Engineer', tier: 'autonomous', model: 'claude-sonnet-5' },
    { name: 'Validation Guardian', tier: 'autonomous', model: 'claude-sonnet-5' },
    { name: 'Benchmark Scout', tier: 'autonomous', model: 'gemini_3_flash' },
    { name: 'Self-Reflection Engine', tier: 'full_autonomous', model: 'claude-sonnet-5' },
    { name: 'Vision Cortex', tier: 'full_autonomous', model: 'gemini_3_flash' },
    { name: 'Passive Learner', tier: 'full_autonomous', model: 'gemini_3_flash' },
    { name: 'System Monitor', tier: 'full_autonomous', model: 'gemini_3_flash' },
  ];
  return (
    <div className="space-y-3">
      {agents.map(a => (
        <div key={a.name} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
          <div>
            <h3 className="font-bold">{a.name}</h3>
            <p className="text-xs text-white/40">Model: {a.model}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${a.tier === 'full_autonomous' ? 'bg-green-500/20 text-green-400' : a.tier === 'autonomous' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>{a.tier}</span>
        </div>
      ))}
    </div>
  );
}

function PlaybookSection() {
  const steps = [
    { step: 1, name: 'Bootstrap Base44 Account', actions: ['Create workspace', 'Connect all services', 'Set secrets', 'Deploy Railway workers'] },
    { step: 2, name: 'Deploy Agent Roster', actions: ['Create 16 agent files', 'Configure memory', 'Set up execution logging'] },
    { step: 3, name: 'Deploy Workflows', actions: ['Create 22 workflows', 'Configure triggers', 'Set up bi-directional sync'] },
    { step: 4, name: 'Deploy Quality Gates', actions: ['3-step pass', 'Postcondition validator', 'Auto-rollback'] },
    { step: 5, name: 'Deploy Intelligence', actions: ['Benchmark scout', 'Vision cortex', 'Passive learner'] },
    { step: 6, name: 'Deploy 24/7 Operations', actions: ['System monitor', 'Fleet heartbeat', 'Auto-healing'] },
    { step: 7, name: 'Deploy Governance', actions: ['Alpha prime audit', 'Self-reflection', 'Failure patterns'] },
    { step: 8, name: 'Scale to Infinite', actions: ['Mass launch', 'Swarm orchestration', 'HeyGen avatar'] },
  ];
  return (
    <div className="space-y-4">
      {steps.map(s => (
        <div key={s.step} className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="font-bold text-[#00a2ff]">Step {s.step}: {s.name}</h3>
          <ul className="mt-2 space-y-1 text-sm text-white/60">
            {s.actions.map(a => <li key={a}>• {a}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}

function TerminologySection() {
  const [terms, setTerms] = useState(null);
  React.useEffect(() => {
    import('@/data/aiTerminology').then(m => setTerms(m.AI_TERMINOLOGY || m.default || [])).catch(() => setTerms([]));
  }, []);
  if (!terms) return <p className="text-white/50">Loading terminology...</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {terms.slice(0, 100).map((t, i) => (
        <span key={i} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70">{t}</span>
      ))}
    </div>
  );
}