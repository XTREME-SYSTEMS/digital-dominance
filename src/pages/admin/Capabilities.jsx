import React, { useState } from "react";
import {
  CheckCircle2, AlertCircle, XCircle, ChevronDown, ChevronRight,
  Globe, Zap, Bot, Shield, Server, Share2, PhoneCall, Database,
  Crown, Rocket, Layers, Search, TrendingUp, Cpu, Activity,
  Sparkles, Target, Eye, AlertTriangle, ArrowRight,
} from "lucide-react";

const CAPABILITIES = [
  {
    id: "site-generation",
    name: "Website Generation Engine",
    icon: Layers,
    status: "operational",
    summary: "AI-powered site generation with 40 designs per industry via Gap Filler Engine",
    components: [
      { name: "Universal Site Builder", status: "operational", detail: "Generates sites from industry templates" },
      { name: "SEO Page Generator", status: "operational", detail: "Creates SEO-optimized location pages" },
      { name: "Website Factory", status: "operational", detail: "Batch site creation pipeline" },
      { name: "Template Studio", status: "operational", detail: "Universal template editor with brand config" },
      { name: "Visual Template Gallery (40 per industry)", status: "operational", detail: "Gap Filler Engine generates 40 designs per industry (10 styles × 4 layouts) with TemplateDesign entity" },
      { name: "Template Picker UI", status: "operational", detail: "Gap Filler Engine page at /admin/gap-filler provides gallery control" },
    ],
  },
  {
    id: "domain-infra",
    name: "Domain Infrastructure",
    icon: Globe,
    status: "operational",
    summary: "Domain discovery, purchasing, and DNS management",
    components: [
      { name: "Domain Gold Rush", status: "operational", detail: "Domain research + availability checking + scoring" },
      { name: "GoDaddy API Integration", status: "operational", detail: "Automated domain purchasing via GoDaddy" },
      { name: "Domain Strategy Entity", status: "operational", detail: "Tracks domain status from idea → live" },
      { name: "URL Strategy Planner", status: "operational", detail: "Keyword pattern matching for domain selection" },
    ],
  },
  {
    id: "seo-engine",
    name: "SEO Engine",
    icon: Search,
    status: "operational",
    summary: "Full programmatic SEO engine with AEO/GEO and first-page acceleration",
    components: [
      { name: "SEO Generator", status: "operational", detail: "Generates SEO content for pages" },
      { name: "SEO Dominance", status: "operational", detail: "SEO strategy and tracking" },
      { name: "Google Search Console Sync", status: "operational", detail: "GSC property creation + data pulling" },
      { name: "Sitemap Generation", status: "operational", detail: "Auto-generates and submits sitemaps" },
      { name: "IndexNow Ping", status: "operational", detail: "Instant indexing via IndexNow" },
      { name: "Core Web Vitals Monitor", status: "operational", detail: "Fetches CWV metrics from CrUX API" },
      { name: "Google Programmatic SEO (mass page gen)", status: "operational", detail: "Gap Filler Engine: GSC keyword gaps → mass page generation with ProgrammaticSeoJob entity" },
      { name: "First-Page Acceleration Engine", status: "operational", detail: "Gap Filler Engine: combined pSEO + citations + backlinks + content + social in one call" },
      { name: "AEO/GEO Optimization", status: "operational", detail: "Gap Filler Engine: FAQ schema, Organization schema, entity-based content structure applied to all generated pages" },
    ],
  },
  {
    id: "agent-swarm",
    name: "Agent Swarm",
    icon: Bot,
    status: "operational",
    summary: "Full multi-agent system with Alpha Prime orchestrator",
    components: [
      { name: "Alpha Prime Orchestrator", status: "operational", detail: "CEO-style autonomous agent with full entity/function access" },
      { name: "Agent Builder", status: "operational", detail: "Create custom AI agents with tools" },
      { name: "Agent Master", status: "operational", detail: "Manage agent personas, memory, intelligence" },
      { name: "Swarm Command", status: "operational", detail: "Multi-agent task dispatch and coordination" },
      { name: "System Operator Agent", status: "operational", detail: "Master operator for all platform operations" },
      { name: "Per-Site Agent Assignment", status: "operational", detail: "Gap Filler Engine: auto-assigns SEO, content, social, health agents per site with AgentAssignment entity" },
    ],
  },
  {
    id: "convergence",
    name: "Convergence & Quality Engine",
    icon: Shield,
    status: "operational",
    summary: "56-category benchmark constitution with autonomous repair",
    components: [
      { name: "Convergence Constitution (56 categories)", status: "operational", detail: "HARD/SOFT gates, weights, archetype applicability" },
      { name: "Autonomous Repair Factory", status: "operational", detail: "Detects failures and attempts automated fixes" },
      { name: "Broken Twin Testing", status: "operational", detail: "Fault injection + recovery validation" },
      { name: "Evidence Receipts", status: "operational", detail: "Traceable proof for every validation claim" },
      { name: "Regression Test Suite", status: "operational", detail: "Automated test execution and tracking" },
    ],
  },
  {
    id: "comms",
    name: "Communications",
    icon: Share2,
    status: "operational",
    summary: "Email, SMS, voice + social media scheduling + video generation",
    components: [
      { name: "Independent Email (Gmail API)", status: "operational", detail: "Sends via Gmail connector, bypasses Base44 credits" },
      { name: "Telnyx SMS", status: "operational", detail: "SMS sending via Telnyx" },
      { name: "AI Voice Assistant", status: "operational", detail: "Telnyx-powered voice assistant with custom prompts" },
      { name: "Xtreme Comms Gateway", status: "operational", detail: "Unified comms routing" },
      { name: "Social Media Auto-Scheduling", status: "operational", detail: "Gap Filler Engine: 7-day multi-platform scheduling (FB, IG, X, LinkedIn, TikTok, YouTube, GBP) with SocialSchedule entity" },
      { name: "Social Account Sync (FB, IG, X, LinkedIn, TikTok, YouTube)", status: "operational", detail: "Gap Filler Engine: SocialSchedule entity tracks all platforms with auto-generated content" },
      { name: "Content-from-Site Auto-Generation", status: "operational", detail: "Gap Filler Engine: auto-generates posts from site data and industry templates" },
      { name: "Video Generation for Social", status: "operational", detail: "Gap Filler Engine: site content → 5 short-form video topics for Reels/TikTok/Shorts" },
    ],
  },
  {
    id: "infrastructure",
    name: "Infrastructure & Deployment",
    icon: Server,
    status: "operational",
    summary: "Full stack: Vercel, Supabase, Railway, GitHub, GoDaddy",
    components: [
      { name: "Vercel Deploy", status: "operational", detail: "Automated deployment to Vercel" },
      { name: "Supabase (DB + Auth + Storage)", status: "operational", detail: "Connected with service role key" },
      { name: "GitHub Sync", status: "operational", detail: "2-way repo sync" },
      { name: "Railway Workers", status: "operational", detail: "Worker processes for heavy jobs" },
      { name: "Self-Hosted Browser Engine", status: "operational", detail: "Playwright + captcha solver deployed (CLOUD_BROWSER_ENGINE_URL set)" },
      { name: "Vercel AI Gateway", status: "operational", detail: "Bypasses Base44 AI credits via gateway" },
    ],
  },
  {
    id: "client-portal",
    name: "Client Portal System",
    icon: Target,
    status: "operational",
    summary: "Auto-provisioning client portal with social, analytics, and SEO dashboards",
    components: [
      { name: "Customer Portal Page", status: "operational", detail: "Basic client portal at /portal" },
      { name: "Conversations (chat)", status: "operational", detail: "Client-agent messaging system" },
      { name: "Per-Site Portal Provisioning", status: "operational", detail: "Gap Filler Engine: auto-provisions portal on site deploy with ClientPortalConfig entity" },
      { name: "Client Social Media Dashboard", status: "operational", detail: "Gap Filler Engine: portal features include social_dashboard: true" },
      { name: "Client Analytics Dashboard", status: "operational", detail: "Gap Filler Engine: portal features include analytics_dashboard + seo_dashboard: true" },
    ],
  },
  {
    id: "mass-distribution",
    name: "Mass Distribution & Citations",
    icon: Rocket,
    status: "operational",
    summary: "Mass citation engine submits NAP to 35+ directories",
    components: [
      { name: "Submit to Indexers", status: "operational", detail: "IndexNow + Google indexing requests" },
      { name: "Directory Submission", status: "operational", detail: "Gap Filler Engine: submits to 35+ directories" },
      { name: "Mass Business Listing (NAP citations)", status: "operational", detail: "Gap Filler Engine: mass NAP submission to 35+ directories with CitationListing entity" },
      { name: "Google Business Profile Sync", status: "operational", detail: "Gap Filler Engine: sync_gbp action submits to GBP" },
      { name: "Bing Webmaster Tools Sync", status: "operational", detail: "Gap Filler Engine: submit_to_bing action submits sitemap to Bing" },
    ],
  },
  {
    id: "analytics",
    name: "Analytics & Monitoring",
    icon: Activity,
    status: "operational",
    summary: "Google Analytics + Search Console + ranking monitoring",
    components: [
      { name: "GA Traffic Dashboard", status: "operational", detail: "Google Analytics data visualization" },
      { name: "Search Console Data Pull", status: "operational", detail: "GSC queries, impressions, clicks" },
      { name: "Site Health Monitor", status: "operational", detail: "Monitors site uptime and health" },
      { name: "Competitor Scanner", status: "operational", detail: "Tracks competitor strategies" },
      { name: "Crystal Ball (Predictions)", status: "operational", detail: "Predictive analytics engine" },
    ],
  },
  {
    id: "ai-independence",
    name: "AI Credit Independence",
    icon: Cpu,
    status: "operational",
    summary: "All AI routes through Vercel AI Gateway, bypassing Base44 credits",
    components: [
      { name: "Vercel AI Gateway (text, image, speech, video)", status: "operational", detail: "Frontend + backend overrides in place" },
      { name: "Independent Email", status: "operational", detail: "Gmail API, bypasses Base44 email credits" },
      { name: "Supabase Storage", status: "operational", detail: "File uploads via Supabase, bypasses Base44 storage credits" },
      { name: "Groq Fast LLM", status: "operational", detail: "GROQ_API_KEY set for fast inference" },
      { name: "OpenRouter Multi-LLM", status: "operational", detail: "OPENROUTER_API_KEY set for model routing" },
    ],
  },
  {
    id: "autonomous-ops",
    name: "Autonomous Operations",
    icon: Zap,
    status: "operational",
    summary: "Heartbeats and autonomous cycles running on schedule",
    components: [
      { name: "Alpha Prime Heartbeat (5-min cycles)", status: "operational", detail: "Idempotent heartbeat with lease acquisition" },
      { name: "Universal Dominance Engine", status: "operational", detail: "8-step autonomous cycle: SENSE→PLAN→GENERATE→DEPLOY→SOCIAL→MONITOR→OPTIMIZE" },
      { name: "Autonomous Refactor Engine", status: "operational", detail: "Self-healing code pipeline" },
      { name: "Autonomous SEO Dominance", status: "operational", detail: "Self-optimizing SEO pipeline" },
      { name: "Scheduled Workflows (26 active)", status: "operational", detail: "Autonomous cycles running on schedules" },
    ],
  },
];

const GAPS = [
  { severity: "resolved", area: "Template Library", gap: "40 visual designs per industry generated by Gap Filler Engine", impact: "Visual template selection available via TemplateDesign entity", fix: "Gap Filler Engine → generate_template_gallery action creates 40 designs (10 styles × 4 layouts) per industry" },
  { severity: "resolved", area: "Programmatic SEO", gap: "Programmatic SEO engine with GSC keyword gap analysis", impact: "Mass page generation with AEO/GEO schema", fix: "Gap Filler Engine → run_programmatic_seo action pulls keyword gaps, generates pages with FAQ + Organization schema" },
  { severity: "resolved", area: "Social Media", gap: "7-day multi-platform social scheduling with auto-generated content", impact: "Automated posting to FB, IG, X, LinkedIn, TikTok, YouTube, GBP", fix: "Gap Filler Engine → generate_social_content action creates scheduled posts across 7 platforms" },
  { severity: "resolved", area: "Client Portal", gap: "Auto-provisioning client portal with social + analytics dashboards", impact: "Clients get dashboard on site deploy", fix: "Gap Filler Engine → provision_client_portal action auto-creates portal with all features enabled" },
  { severity: "resolved", area: "Mass Distribution", gap: "Mass citation engine submits NAP to 35+ directories", impact: "Business info distributed across the web", fix: "Gap Filler Engine → submit_mass_citations action submits to 35+ directories including GBP, Yelp, Bing, Apple Maps" },
  { severity: "resolved", area: "AEO/GEO", gap: "AEO/GEO optimization with FAQ + Organization + Service schema", impact: "Sites optimized for AI search (ChatGPT, Perplexity, Google SGE)", fix: "Gap Filler Engine → apply_aeo_geo action adds schema to all generated pages" },
  { severity: "resolved", area: "First-Page Acceleration", gap: "Combined first-page acceleration engine", impact: "Systematic approach to force first-page ranking", fix: "Gap Filler Engine → accelerate_first_page action runs pSEO + citations + backlinks + content + social in one call" },
  { severity: "resolved", area: "Video Generation", gap: "Video generation from site content for social", impact: "Short-form video content for Reels/TikTok/Shorts", fix: "Gap Filler Engine → generate_social_video action creates 5 video topics from site content" },
  { severity: "resolved", area: "Per-Site Agents", gap: "Auto-assignment of swarm agents per deployed site", impact: "Sites continuously monitored by dedicated agents", fix: "Gap Filler Engine → assign_site_agents action assigns SEO, content, social, health agents per site" },
  { severity: "resolved", area: "Google Business Profile", gap: "GBP sync via Gap Filler Engine", impact: "Business info synced to Google Maps/Local", fix: "Gap Filler Engine → sync_gbp action submits to Google Business Profile" },
  { severity: "resolved", area: "Bing Webmaster", gap: "Bing submission via Gap Filler Engine", impact: "Bing search indexing active", fix: "Gap Filler Engine → submit_to_bing action submits sitemap to Bing" },
  { severity: "resolved", area: "Backlink Automation", gap: "Backlink opportunity finder + outreach tracking", impact: "Systematic backlink building", fix: "Gap Filler Engine → find_backlink_opportunities action identifies opportunities across 6 types with DA/PA scoring" },
  { severity: "resolved", area: "Content Velocity", gap: "Auto-publishing content calendar engine", impact: "Sites refreshed with new content regularly", fix: "Gap Filler Engine → generate_content_calendar action plans 12 content items (blog, service, location, FAQ, guides)" },
  { severity: "resolved", area: "Apple Maps / Yelp", gap: "Apple Maps + Yelp citation sync via Gap Filler Engine", impact: "Local search presence on Apple + Yelp", fix: "Gap Filler Engine → submit_apple_yelp action submits to both directories" },
];

const STATUS_CONFIG = {
  operational: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", border: "border-green-200", label: "Operational" },
  partial: { icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", label: "Partial" },
  gap: { icon: XCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", label: "Gap" },
  blocked: { icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", label: "Blocked" },
};

const SEVERITY_CONFIG = {
  critical: { color: "text-red-700", bg: "bg-red-50", border: "border-red-300", label: "CRITICAL" },
  high: { color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-300", label: "HIGH" },
  medium: { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-300", label: "MEDIUM" },
  low: { color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-300", label: "LOW" },
  blocker: { color: "text-orange-800", bg: "bg-orange-100", border: "border-orange-400", label: "BLOCKER" },
  resolved: { color: "text-green-700", bg: "bg-green-50", border: "border-green-300", label: "RESOLVED" },
};

export default function Capabilities() {
  const [expanded, setExpanded] = useState(null);
  const [activeTab, setActiveTab] = useState("capabilities");

  const operationalCount = CAPABILITIES.filter(c => c.status === "operational").length;
  const partialCount = CAPABILITIES.filter(c => c.status === "partial").length;
  const gapCount = CAPABILITIES.filter(c => c.status === "gap").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
          <Crown className="h-7 w-7 text-amber-500" /> System Capabilities & Gaps
        </h1>
        <p className="text-stone-500 mt-1">
          Full audit of what this system can do today vs. what's missing to achieve digital dominance at scale.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200">
        {[
          { id: "capabilities", label: "Capabilities", icon: CheckCircle2 },
          { id: "gaps", label: "Gaps & Missing", icon: AlertCircle },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition -mb-px ${
              activeTab === tab.id ? "border-amber-500 text-amber-600" : "border-transparent text-stone-500 hover:text-stone-700"
            }`}
          >
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* === CAPABILITIES TAB === */}
      {activeTab === "capabilities" && (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
              <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-700">{operationalCount}</p>
              <p className="text-xs text-green-600 font-semibold">Operational</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
              <AlertCircle className="h-6 w-6 text-amber-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-amber-700">{partialCount}</p>
              <p className="text-xs text-amber-600 font-semibold">Partial</p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
              <XCircle className="h-6 w-6 text-red-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-red-700">{gapCount}</p>
              <p className="text-xs text-red-600 font-semibold">Gaps</p>
            </div>
          </div>

          {/* Capability Cards */}
          {CAPABILITIES.map((cap) => {
            const cfg = STATUS_CONFIG[cap.status];
            const isExpanded = expanded === cap.id;
            return (
              <div key={cap.id} className={`rounded-xl border-2 ${cfg.border} ${cfg.bg} overflow-hidden`}>
                <button
                  onClick={() => setExpanded(isExpanded ? null : cap.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/50 transition"
                >
                  <div className={`w-10 h-10 rounded-lg ${cfg.bg} border ${cfg.border} grid place-items-center shrink-0`}>
                    <cap.icon className={`h-5 w-5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-stone-900 text-sm">{cap.name}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                        {cfg.label.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">{cap.summary}</p>
                  </div>
                  {isExpanded ? <ChevronDown className="h-5 w-5 text-stone-400 shrink-0" /> : <ChevronRight className="h-5 w-5 text-stone-400 shrink-0" />}
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-2">
                    {cap.components.map((comp) => {
                      const compCfg = STATUS_CONFIG[comp.status] || STATUS_CONFIG.gap;
                      return (
                        <div key={comp.name} className="flex items-start gap-2 p-2.5 rounded-lg bg-white/60 border border-stone-200">
                          <compCfg.icon className={`h-4 w-4 ${compCfg.color} shrink-0 mt-0.5`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-stone-800">{comp.name}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${compCfg.bg} ${compCfg.color}`}>
                                {compCfg.label.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-xs text-stone-500 mt-0.5">{comp.detail}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* === GAPS TAB === */}
      {activeTab === "gaps" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-stone-900">Identified Gaps ({GAPS.length})</h3>
            <span className="text-xs text-stone-500">Ranked by severity</span>
          </div>

          {GAPS.map((gap, idx) => {
            const sev = SEVERITY_CONFIG[gap.severity];
            return (
              <div key={idx} className={`rounded-xl border-2 ${sev.border} ${sev.bg} p-4`}>
                <div className="flex items-start gap-3">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded ${sev.bg} ${sev.color} border ${sev.border} shrink-0`}>
                    {sev.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-stone-700 uppercase tracking-wide">{gap.area}</span>
                    </div>
                    <p className="text-sm font-semibold text-stone-900 mb-1">{gap.gap}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      <div className="flex items-start gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-bold text-red-600 uppercase">Impact</span>
                          <p className="text-xs text-stone-600">{gap.impact}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <ArrowRight className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-bold text-green-600 uppercase">Fix</span>
                          <p className="text-xs text-stone-600">{gap.fix}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Summary */}
          <div className="rounded-xl border-2 border-stone-300 bg-stone-50 p-5 mt-4">
            <h3 className="font-bold text-stone-900 flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-amber-500" /> Path to Full Digital Dominance
            </h3>
            <p className="text-sm text-stone-600">
              The system has strong infrastructure (AI independence, agent swarm, convergence engine, deployment pipeline) but is missing the
              <strong> client-facing growth layer</strong>: visual template gallery, programmatic SEO engine, social media automation, client portal provisioning,
              and mass citation distribution. Building these 5 systems on top of the existing infrastructure would achieve the full vision.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Template Gallery", "Programmatic SEO", "Social Automation", "Client Portal Provisioning", "Mass Citations"].map((item) => (
                <span key={item} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}