import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Zap, Loader2, CheckCircle2, AlertCircle, Bot } from 'lucide-react';

const SWARM_BLUEPRINT = [
  { role: 'Data Discovery Agent', purpose: 'Scans web for epoxy/concrete contractors, investors, and market data', count: 3, tools: ['cloud_browser', 'web_search'] },
  { role: 'Ingestion & Normalization Agent', purpose: 'Cleans, deduplicates, and normalizes all scraped data', count: 2, tools: ['entity_crud', 'llm'] },
  { role: 'Pricing Intelligence Agent', purpose: 'Scrapes and tracks competitor pricing across all regions', count: 2, tools: ['cloud_browser', 'llm'] },
  { role: 'Smart Bid Generator', purpose: 'Generates competitive bids from pricing intelligence and project specs', count: 2, tools: ['llm', 'entity_crud'] },
  { role: 'SEO Dominance Agent', purpose: 'Generates and deploys SEO content for every city/service combination', count: 4, tools: ['seo_generator', 'llm'] },
  { role: 'Social Media Automation Agent', purpose: 'Creates and schedules posts, images, videos across all platforms', count: 3, tools: ['social_studio', 'image_gen', 'video_gen'] },
  { role: 'YouTube Content Agent', purpose: 'Generates video content, thumbnails, descriptions, and uploads', count: 2, tools: ['video_gen', 'llm'] },
  { role: 'Lead Capture & Enrichment Agent', purpose: 'Captures leads, enriches with property/skip-trace data, scores', count: 3, tools: ['lead_scraper', 'skip_trace', 'property_lookup'] },
  { role: 'SMS/MMS Outreach Agent', purpose: 'Sends templated SMS/MMS campaigns to leads and alumni', count: 2, tools: ['xtreme_comms', 'telnyx'] },
  { role: 'Email Outreach Agent', purpose: 'Sends professional email packages with company highlights', count: 2, tools: ['send_email', 'gmail'] },
  { role: 'Voice Outreach Agent', purpose: 'AI voice calls for follow-up and appointment setting', count: 2, tools: ['voice_assistant', 'telnyx'] },
  { role: 'HubSpot Sync Agent', purpose: 'Syncs all leads and interactions to HubSpot CRM', count: 1, tools: ['hubspot'] },
  { role: 'Website Generator Agent', purpose: 'Generates and deploys websites from templates for all industries', count: 3, tools: ['website_factory', 'vercel_deploy'] },
  { role: 'Platform Submission Agent', purpose: 'Submits company name and content to every platform nationwide', count: 2, tools: ['cloud_browser', 'web_search'] },
  { role: 'Campaign Orchestrator', purpose: 'Coordinates national campaigns across all 4 brands', count: 1, tools: ['llm', 'entity_crud'] },
  { role: 'Metric & Analytics Agent', purpose: 'Tracks KPIs for every launched system', count: 2, tools: ['google_analytics', 'entity_crud'] },
  { role: 'Validation & QA Agent', purpose: 'Validates all outputs, checks quality, flags issues', count: 2, tools: ['closed_loop_tester', 'llm'] },
];

const SWARM_VERSION = 'digital-dominance-v1';
const SWARM_PROFILES = SWARM_BLUEPRINT.flatMap((entry, roleIndex) =>
  Array.from({ length: entry.count }, (_, slot) => ({
    short_name: `DD-${String(roleIndex + 1).padStart(2, '0')}-${slot + 1}`,
    name: `${entry.role} ${slot + 1}`,
    persona_type: 'swarm',
    strategy_hash: SWARM_VERSION,
    assigned_context: entry.purpose,
    system_prompt: `You are ${entry.role} ${slot + 1} for the Digital Dominance System. Your responsibility: ${entry.purpose}. Relevant tools: ${entry.tools.join(', ')}. Only use tools and data explicitly made available to you; do not claim a task has run unless its result is verified. Request approval before messaging customers, spending money, publishing, or changing production systems.`,
    max_autonomy: 'supervised',
    active: false,
  }))
);

export default function AutonomousSwarmGenerator() {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let current = true;
    const load = async () => {
      try {
        const user = await base44.auth.me();
        const saved = await base44.entities.AgentPersona.filter({ owner_id: user.id, strategy_hash: SWARM_VERSION });
        if (current && saved.length) setGenerated({ agents: saved });
      } catch (e) {
        if (current) setError(e.message);
      }
    };
    load();
    return () => { current = false; };
  }, []);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const user = await base44.auth.me();
      const existing = await base44.entities.AgentPersona.filter({ owner_id: user.id, strategy_hash: SWARM_VERSION });
      const savedNames = new Set(existing.map((agent) => agent.short_name));
      const missing = SWARM_PROFILES.filter((profile) => !savedNames.has(profile.short_name));
      const created = missing.length ? await base44.entities.AgentPersona.bulkCreate(missing.map((profile) => ({ ...profile, owner_id: user.id }))) : [];
      setGenerated({ agents: [...existing, ...created] });
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-bold text-stone-900">Generate Your Exact Swarm</h3>
          <p className="text-sm text-stone-500">One click saves {SWARM_PROFILES.length} specialist profiles across {SWARM_BLUEPRINT.length} roles. Automations and tools require separate setup.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={generate}
            disabled={generating}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-stone-950 hover:bg-amber-400 disabled:opacity-50 transition"
          >
            {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
            {generating ? 'Saving Profiles...' : 'Generate Swarm'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {/* Blueprint Preview */}
      {!generated && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SWARM_BLUEPRINT.map((agent, i) => (
            <div key={i} className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-bold text-stone-900">{agent.role}</span>
                </div>
                <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">×{agent.count}</span>
              </div>
              <p className="text-xs text-stone-600 mb-2">{agent.purpose}</p>
              <div className="flex flex-wrap gap-1">
                {agent.tools.map((t) => (
                  <span key={t} className="text-[10px] bg-white border border-stone-200 rounded px-1.5 py-0.5 text-stone-500">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generated Swarm */}
      {generated && (
        <div className="space-y-3">
          <div className="flex items-center gap-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
            <CheckCircle2 className="h-8 w-8 text-amber-600" />
            <div>
              <p className="text-sm font-bold text-stone-900">{generated.agents?.length || 0} of {SWARM_PROFILES.length} specialist profiles saved</p>
              <p className="text-xs text-stone-500">Profiles are drafts, not running agents. Scheduled automations and tool access have not been activated.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(generated.agents || []).map((agent, i) => (
              <div key={i} className="rounded-xl border border-stone-200 bg-white p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-stone-900">{agent.agent_name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                                       Inactive
                                     </span>
                </div>
                <p className="text-xs text-stone-600 mb-2">{agent.assigned_context}</p>
                <p className="text-[10px] text-stone-400">{agent.short_name} · Draft profile · No schedule</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}