import React, { useState } from 'react';
import { Crown, Zap, Activity, Database, Radar, DollarSign, FileCode2, Layout, Users, Rocket, Gift, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import AutonomousSwarmGenerator from '@/components/digital-dominance/AutonomousSwarmGenerator';
import DataStrategyPipeline from '@/components/digital-dominance/DataStrategyPipeline';
import NationalContractorScraper from '@/components/digital-dominance/NationalContractorScraper';
import CompetitorIntelligence from '@/components/digital-dominance/CompetitorIntelligence';
import SmartBidSystem from '@/components/digital-dominance/SmartBidSystem';
import WebsiteTemplateGallery from '@/components/digital-dominance/WebsiteTemplateGallery';
import NationalCampaignManager from '@/components/digital-dominance/NationalCampaignManager';
import AlumniOutreachSystem from '@/components/digital-dominance/AlumniOutreachSystem';
import PlatformProvisionGenerator from '@/components/digital-dominance/PlatformProvisionGenerator';
import KnowledgeLibrary from '@/components/digital-dominance/KnowledgeLibrary';
import MetricDashboard from '@/components/digital-dominance/MetricDashboard';

const SECTIONS = [
  { id: 'swarm', title: 'Autonomous Swarm Generator', desc: 'Save the 38 specialist profiles; activate tools and automations separately', icon: Zap, accent: 'amber', component: AutonomousSwarmGenerator },
  { id: 'data', title: 'Data Strategy Pipeline', desc: 'Discovery → Acquisition → Ingestion → Normalization → Organize → Strategize → Enrich', icon: Database, accent: 'blue', component: DataStrategyPipeline },
  { id: 'scraper', title: 'National Epoxy Contractor Scraper', desc: 'Passive cloud-browser scraping of every epoxy contractor in the USA', icon: Radar, accent: 'emerald', component: NationalContractorScraper },
  { id: 'competitors', title: 'Competitor Intelligence + Pricing', desc: 'Top 20 epoxy competitor websites + pricing intelligence engine', icon: Radar, accent: 'rose', component: CompetitorIntelligence },
  { id: 'bidding', title: 'Digital Smart Bid System', desc: 'Autonomous bid generation from pricing intelligence and project specs', icon: DollarSign, accent: 'amber', component: SmartBidSystem },
  { id: 'templates', title: 'Website Template Gallery', desc: 'Rebrandable templates for all industries — funnels, landing pages, full sites', icon: Layout, accent: 'violet', component: WebsiteTemplateGallery },
  { id: 'campaign', title: 'National Campaign Manager', desc: 'Xtreme Polishing Systems, National Concrete Polishing, Polished Concrete University, National Epoxy Pros', icon: Rocket, accent: 'amber', component: NationalCampaignManager },
  { id: 'alumni', title: 'Alumni Outreach System', desc: 'Polished Concrete University alumni → SMS/MMS with message templates', icon: Users, accent: 'blue', component: AlumniOutreachSystem },
  { id: 'provision', title: 'Autonomous Platform Provision Generator', desc: 'Auto-provision Google, HubSpot, Vercel, Supabase, Telnyx, social platforms', icon: Rocket, accent: 'emerald', component: PlatformProvisionGenerator },
  { id: 'knowledge', title: 'Knowledge Library (Free)', desc: 'Templates, AI tools, strategies, prompt library, tips & tricks, intelligence catalog', icon: Gift, accent: 'violet', component: KnowledgeLibrary },
  { id: 'metrics', title: 'Metric Dashboard', desc: 'Per-system tracking dashboards — every launched system gets its own', icon: BarChart3, accent: 'amber', component: MetricDashboard },
];

const accentMap = {
  amber: { border: 'border-amber-300', bg: 'bg-amber-50', text: 'text-amber-600', icon: 'bg-amber-500' },
  blue: { border: 'border-blue-300', bg: 'bg-blue-50', text: 'text-blue-600', icon: 'bg-blue-500' },
  emerald: { border: 'border-emerald-300', bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'bg-emerald-500' },
  rose: { border: 'border-rose-300', bg: 'bg-rose-50', text: 'text-rose-600', icon: 'bg-rose-500' },
  violet: { border: 'border-violet-300', bg: 'bg-violet-50', text: 'text-violet-600', icon: 'bg-violet-500' },
};

export default function DigitalDominance() {
  const [expanded, setExpanded] = useState({ swarm: true });

  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  const expandAll = () => {
    const all = {};
    SECTIONS.forEach((s) => { all[s.id] = true; });
    setExpanded(all);
  };
  const collapseAll = () => setExpanded({});

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-stone-950 via-amber-950 to-stone-900 p-6 text-white border border-amber-500/30">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 grid place-items-center">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Digital Dominance System</h1>
              <p className="text-stone-400 text-sm">Full-stack autonomous domination: data → scrape → intelligence → bid → campaign → outreach → swarm → metrics</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={expandAll} className="rounded-lg border border-stone-700 bg-stone-800 px-4 py-2 text-sm font-bold text-stone-300 hover:border-amber-500 hover:text-amber-400 transition">
              Expand All
            </button>
            <button onClick={collapseAll} className="rounded-lg border border-stone-700 bg-stone-800 px-4 py-2 text-sm font-bold text-stone-300 hover:border-amber-500 hover:text-amber-400 transition">
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-2">
        {SECTIONS.map((section) => {
          const a = accentMap[section.accent];
          const Icon = section.icon;
          const isExpanded = expanded[section.id];
          const Component = section.component;
          return (
            <div key={section.id} className={`rounded-2xl border-2 ${isExpanded ? a.border : 'border-stone-200'} bg-white overflow-hidden transition-all`}>
              <button
                onClick={() => toggle(section.id)}
                className={`w-full flex items-center gap-4 p-4 ${isExpanded ? a.bg : 'bg-white'} transition-all hover:bg-stone-50`}
              >
                <div className={`h-11 w-11 rounded-xl ${a.icon} grid place-items-center shrink-0`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <h3 className="text-base font-bold text-stone-900">{section.title}</h3>
                  <p className="text-xs text-stone-500 truncate">{section.desc}</p>
                </div>
                {isExpanded ? <ChevronUp className="h-5 w-5 text-stone-400 shrink-0" /> : <ChevronDown className="h-5 w-5 text-stone-400 shrink-0" />}
              </button>
              {isExpanded && (
                <div className="p-5 border-t border-stone-100">
                  <Component />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}