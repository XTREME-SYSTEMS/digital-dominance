import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { LayoutGrid, AlertTriangle, CheckCircle2, XCircle, Loader2, Zap, ArrowRight, FileText } from 'lucide-react';

const PAGE_INVENTORY = [
  { path: '/', name: 'Launch Engine (Home)', category: 'Public', status: 'active', desc: 'Main landing page with hero, industries, templates, results, pricing, portals, contact' },
  { path: '/templates', name: 'Templates Gallery', category: 'Public', status: 'active', desc: 'Browse all stock templates with industry filtering' },
  { path: '/pricing', name: 'Pricing', category: 'Public', status: 'active', desc: 'Pricing tiers and plans' },
  { path: '/estimate', name: 'Estimator Funnel', category: 'Public', status: 'active', desc: 'Multi-step epoxy floor estimator' },
  { path: '/admin', name: 'Launch Engine Admin', category: 'Admin', status: 'active', desc: 'Main admin dashboard' },
  { path: '/admin/super-agents', name: 'Super Agents', category: 'Admin', status: 'new', desc: 'Agent cards with health, schedule, tools' },
  { path: '/admin/system-heal', name: 'System Heal', category: 'Admin', status: 'new', desc: 'Automated full system check (12 parts, daily)' },
  { path: '/admin/gap-analysis', name: 'Gap Analysis', category: 'Admin', status: 'new', desc: 'Gap analysis with priority filtering' },
  { path: '/admin/brand-guidelines', name: 'Brand Guidelines', category: 'Admin', status: 'new', desc: 'Visual brand system — colors, fonts, spacing, effects' },
  { path: '/admin/site-project/:id', name: 'Site Project', category: 'Admin', status: 'new', desc: 'Per-site project page with location, variations, validation' },
  { path: '/admin/eden-skye', name: 'Eden Skye', category: 'Admin', status: 'active', desc: 'AI receptionist with Twilio + HeyGen' },
  { path: '/admin/template-studio', name: 'Template Studio', category: 'Admin', status: 'active', desc: 'Stock template library and editor' },
  { path: '/admin/mass-launch', name: 'Mass Launch Console', category: 'Admin', status: 'active', desc: 'Mass site launch orchestration' },
  { path: '/admin/swarm', name: 'Swarm Command', category: 'Admin', status: 'active', desc: 'Agent swarm orchestration' },
  { path: '/admin/alpha-prime', name: 'Alpha Prime', category: 'Admin', status: 'active', desc: 'Optimization cycle engine' },
  { path: '/admin/fleet', name: 'Fleet Dashboard', category: 'Admin', status: 'active', desc: 'Fleet system monitoring' },
  { path: '/admin/shadow', name: 'Shadow', category: 'Admin', status: 'active', desc: 'Covert operator channel' },
  { path: '/admin/assistant', name: 'GPT Sync Pipeline', category: 'Admin', status: 'active', desc: 'AI build request pipeline' },
  { path: '/admin/contents', name: 'Contents', category: 'Admin', status: 'active', desc: 'Content menu management' },
  { path: '/admin/capabilities', name: 'Capabilities', category: 'Admin', status: 'active', desc: 'Capability inventory' },
  { path: '/admin/leads', name: 'Leads', category: 'Admin', status: 'active', desc: 'Lead management and detail' },
  { path: '/admin/pipeline', name: 'Pipeline', category: 'Admin', status: 'active', desc: 'Sales pipeline' },
  { path: '/admin/website-factory', name: 'Website Factory', category: 'Admin', status: 'legacy', desc: 'Legacy website factory — superseded by Template Studio' },
  { path: '/admin/templates', name: 'Template Manager', category: 'Admin', status: 'legacy', desc: 'Legacy template manager — superseded by Template Studio' },
  { path: '/admin/app-factory', name: 'App Factory', category: 'Admin', status: 'legacy', desc: 'Legacy app factory' },
  { path: '/admin/national-launch', name: 'National Launch', category: 'Admin', status: 'legacy', desc: 'Legacy launch — superseded by Mass Launch' },
  { path: '/admin/seo-generator', name: 'SEO Generator', category: 'Admin', status: 'legacy', desc: 'Legacy SEO generator' },
  { path: '/admin/xtreme-comms', name: 'Xtreme Comms', category: 'Admin', status: 'legacy', desc: 'Legacy comms — superseded by Eden Skye' },
  { path: '/admin/telnyx', name: 'Telnyx Manager', category: 'Admin', status: 'legacy', desc: 'Legacy telnyx — not in use' },
  { path: '/admin/lead-scraper', name: 'Lead Scraper', category: 'Admin', status: 'legacy', desc: 'Legacy scraper' },
  { path: '/admin/skip-trace', name: 'Skip Trace', category: 'Admin', status: 'legacy', desc: 'Legacy skip trace' },
  { path: '/admin/autocomplete', name: 'Auto Complete', category: 'Admin', status: 'legacy', desc: 'Legacy autocomplete' },
  { path: '/admin/agent-builder', name: 'Agent Builder', category: 'Admin', status: 'legacy', desc: 'Legacy agent builder' },
  { path: '/admin/vision-studio', name: 'Vision Studio', category: 'Admin', status: 'legacy', desc: 'Legacy vision studio' },
  { path: '/admin/command-center', name: 'Command Center', category: 'Admin', status: 'legacy', desc: 'Legacy command center' },
  { path: '/admin/agent-master', name: 'Agent Master', category: 'Admin', status: 'legacy', desc: 'Legacy agent master' },
  { path: '/admin/vision-strategy', name: 'Vision Strategy', category: 'Admin', status: 'legacy', desc: 'Legacy vision strategy' },
  { path: '/admin/intelligence', name: 'Intelligence', category: 'Admin', status: 'legacy', desc: 'Legacy intelligence' },
  { path: '/admin/client-packages', name: 'Client Packages', category: 'Admin', status: 'legacy', desc: 'Legacy client packages' },
  { path: '/admin/api-keys', name: 'API Keys', category: 'Admin', status: 'legacy', desc: 'Legacy API key manager' },
  { path: '/admin/vault', name: 'System Vault', category: 'Admin', status: 'legacy', desc: 'Legacy vault' },
  { path: '/admin/provider-vault', name: 'Provider Vault', category: 'Admin', status: 'legacy', desc: 'Legacy provider vault' },
  { path: '/admin/social-studio', name: 'Social Studio', category: 'Admin', status: 'legacy', desc: 'Legacy social studio' },
  { path: '/admin/rebrand-studio', name: 'Rebrand Studio', category: 'Admin', status: 'legacy', desc: 'Legacy rebrand studio' },
];

const CAPABILITIES = [
  { name: 'Mass Website Launch', status: 'active', value: 'high', desc: 'Launch hundreds of full websites simultaneously — verified competitive advantage' },
  { name: 'Headless Site Validation', status: 'active', value: 'high', desc: 'Cloud browser validates every site is live and functional' },
  { name: 'Eden Skye AI Receptionist', status: 'active', value: 'high', desc: 'Twilio SMS + HeyGen avatar + AI chat' },
  { name: 'CRM 3-Day Follow-Up', status: 'active', value: 'high', desc: 'Automated branded email sequence to leads' },
  { name: 'Super Agent Orchestration', status: 'active', value: 'high', desc: '10 super agents operating autonomously' },
  { name: 'System Health Monitoring', status: 'active', value: 'high', desc: 'Daily automated check of 12 system parts' },
  { name: 'Template Studio', status: 'active', value: 'high', desc: '200 stock designs with industry-specific layouts' },
  { name: 'God Mode Optimizer', status: 'active', value: 'high', desc: 'Deterministic path to Google first page' },
  { name: 'Industry Skip Trace', status: 'active', value: 'medium', desc: 'Scans top 5 competitors for pricing/SEO/funnel intel' },
  { name: 'Google Standard Scoring', status: 'active', value: 'high', desc: '14-factor Google 2026 compliance scoring' },
  { name: 'Shadow Agent', status: 'active', value: 'medium', desc: 'Covert operator with full system access' },
  { name: 'Brand Guidelines System', status: 'new', value: 'medium', desc: 'Visual perfection system applied site-wide' },
];

const GAPS = [
  { gap: 'No automated site-to-project page linking', priority: 'high', fix: 'Connect mass launch output to Site Project pages automatically' },
  { gap: 'Cloud browser deep validation not fully wired', priority: 'high', fix: 'Connect CLOUD_BROWSER_ENGINE_URL to headlessSiteValidator and fullSiteTestAgent' },
  { gap: 'Legacy pages clutter navigation', priority: 'medium', fix: 'Archive 20+ legacy pages or merge into active pages' },
  { gap: 'No visual snapshot grid of all pages', priority: 'medium', fix: 'This page provides it — wire to live screenshots' },
  { gap: 'Shadow page not rebranded to dark theme', priority: 'medium', fix: 'Rebrand Shadow.jsx to match system aesthetic' },
  { gap: 'No full end-to-end user flow diagram', priority: 'low', fix: 'Document visual user flow' },
];

export default function SystemInventory() {
  const [tab, setTab] = useState('pages');
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const runFullTest = async () => {
    setTesting(true);
    try {
      const res = await base44.functions.invoke('fullSiteTestAgent', { url: 'https://epoxyquotenearme.com', depth: 'full' });
      setTestResult(res.data);
    } catch (e) { setTestResult({ error: e.message }); }
    setTesting(false);
  };

  const activePages = PAGE_INVENTORY.filter(p => p.status === 'active');
  const newPages = PAGE_INVENTORY.filter(p => p.status === 'new');
  const legacyPages = PAGE_INVENTORY.filter(p => p.status === 'legacy');

  return (
    <div className="min-h-screen bg-[#050508] p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a1220] to-[#0d1a2e] p-6">
          <div className="flex items-center gap-3">
            <LayoutGrid className="h-8 w-8 text-[#00a2ff]" />
            <div>
              <h1 className="text-2xl font-extrabold text-white">System Inventory & Audit</h1>
              <p className="text-sm text-white/60">Full end-to-end page inventory, capabilities, gaps, and optimization plan</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3"><p className="text-[10px] uppercase tracking-wider text-green-400">Active</p><p className="text-xl font-black text-white">{activePages.length}</p></div>
            <div className="rounded-xl bg-[#00a2ff]/10 border border-[#00a2ff]/20 p-3"><p className="text-[10px] uppercase tracking-wider text-[#00a2ff]">New</p><p className="text-xl font-black text-white">{newPages.length}</p></div>
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3"><p className="text-[10px] uppercase tracking-wider text-amber-400">Legacy</p><p className="text-xl font-black text-white">{legacyPages.length}</p></div>
            <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-3"><p className="text-[10px] uppercase tracking-wider text-purple-400">Capabilities</p><p className="text-xl font-black text-white">{CAPABILITIES.length}</p></div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[{id:'pages',label:'All Pages'},{id:'capabilities',label:'Capabilities'},{id:'gaps',label:'Gaps & Inefficiencies'},{id:'plan',label:'Optimization Plan'},{id:'test',label:'Full Site Test'}].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === t.id ? 'bg-[#00a2ff] text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>{t.label}</button>
          ))}
        </div>

        {tab === 'pages' && (
          <div className="space-y-2">
            {PAGE_INVENTORY.map((p, i) => (
              <div key={p.path} className="rounded-xl border border-white/10 bg-[#0a1220] p-4 hover:border-green-400/50 transition-all duration-300">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-xs font-mono text-white/30 mt-0.5">{i + 1}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">{p.name}</h3>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${p.status === 'active' ? 'bg-green-500/20 text-green-400' : p.status === 'new' ? 'bg-[#00a2ff]/20 text-[#00a2ff]' : 'bg-amber-500/20 text-amber-400'}`}>{p.status}</span>
                        <span className="text-[9px] text-white/30">{p.category}</span>
                      </div>
                      <p className="text-xs text-white/50 mt-1">{p.desc}</p>
                      <code className="text-[10px] text-white/30">{p.path}</code>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'capabilities' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CAPABILITIES.map(c => (
              <div key={c.name} className="rounded-xl border border-white/10 bg-[#0a1220] p-4 hover:border-green-400/50 transition">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white">{c.name}</h3>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${c.value === 'high' ? 'bg-green-500/20 text-green-400' : c.value === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-white/40'}`}>{c.value}</span>
                </div>
                <p className="text-xs text-white/50">{c.desc}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'gaps' && (
          <div className="space-y-2">
            {GAPS.map((g, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-[#0a1220] p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`h-4 w-4 mt-0.5 ${g.priority === 'high' ? 'text-red-400' : 'text-amber-400'}`} />
                  <div>
                    <h3 className="text-sm font-bold text-white">{g.gap}</h3>
                    <p className="text-xs text-green-400 mt-1">Fix: {g.fix}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'plan' && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-green-400/20 bg-green-500/5 p-5">
              <h3 className="text-sm font-bold text-green-400 mb-3">Clean-Out Plan (Legacy Pages)</h3>
              <p className="text-xs text-white/60 mb-3">Archive or merge these {legacyPages.length} legacy pages to reduce clutter:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {legacyPages.map(p => (
                  <div key={p.path} className="flex items-center gap-2 text-xs text-white/50">
                    <XCircle className="h-3.5 w-3.5 text-red-400" /> {p.name}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-[#00a2ff]/20 bg-[#00a2ff]/5 p-5">
              <h3 className="text-sm font-bold text-[#00a2ff] mb-3">Optimization Plan</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-xs text-white/60"><CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5" /> Merge Website Factory + Template Manager → Template Studio (already done)</div>
                <div className="flex items-start gap-2 text-xs text-white/60"><CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5" /> Merge Xtreme Comms → Eden Skye (already done)</div>
                <div className="flex items-start gap-2 text-xs text-white/60"><ArrowRight className="h-4 w-4 text-[#00a2ff] mt-0.5" /> Archive 20+ legacy pages from admin navigation</div>
                <div className="flex items-start gap-2 text-xs text-white/60"><ArrowRight className="h-4 w-4 text-[#00a2ff] mt-0.5" /> Wire mass launch output to Site Project pages</div>
                <div className="flex items-start gap-2 text-xs text-white/60"><ArrowRight className="h-4 w-4 text-[#00a2ff] mt-0.5" /> Connect cloud browser to headlessSiteValidator</div>
                <div className="flex items-start gap-2 text-xs text-white/60"><ArrowRight className="h-4 w-4 text-[#00a2ff] mt-0.5" /> Rebrand Shadow page to dark theme</div>
                <div className="flex items-start gap-2 text-xs text-white/60"><ArrowRight className="h-4 w-4 text-[#00a2ff] mt-0.5" /> Apply brand guidelines site-wide</div>
              </div>
            </div>
          </div>
        )}

        {tab === 'test' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-[#00a2ff]" />
                  <h3 className="text-sm font-bold text-white">Full Site Test Agent</h3>
                </div>
                <button onClick={runFullTest} disabled={testing}
                  className="flex items-center gap-2 rounded-xl bg-[#00a2ff] px-4 py-2 text-xs font-bold text-white hover:bg-[#0090e0] disabled:opacity-50">
                  {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />} Run Full Test
                </button>
              </div>
              <p className="text-xs text-white/50">Tests every button, form, link, and feature on the site. Uses cloud browser for deep validation.</p>
            </div>
            {testResult && (
              <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5">
                <pre className="text-xs text-white/60 overflow-auto">{JSON.stringify(testResult, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}