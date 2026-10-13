import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Rocket, MapPin, Bot, Globe, CheckCircle2, Circle, Clock,
  Loader2, Sparkles, Shield, TrendingUp, Target, Zap,
  Brain, Eye, Code2, Mail, Phone, Calendar, Star, Cpu,
  Network, AlertCircle, ArrowRight, Lightbulb, Search,
} from "lucide-react";
import USMap from "@/components/master-plan/USMap";

// ── Agent Roster ────────────────────────────────────────────────────────────
const AGENTS = [
  { name: "Alpha Prime Orchestrator", dept: "Command", icon: Brain, job: "Master orchestrator — coordinates all agents, sets priorities, and ensures convergence across the entire website network.", status: "active" },
  { name: "Brand Compliance Guardian", dept: "Governance", icon: Shield, job: "Audits every admin page and template for brand compliance. Enforces mandatory branding and hides over-complicated systems.", status: "active" },
  { name: "Eden Skye", dept: "Communications", icon: Phone, job: "AI voice agent — handles inbound/outbound calls, SMS, and WhatsApp conversations with leads and customers.", status: "active" },
  { name: "Shadow", dept: "Intelligence", icon: Eye, job: "Autonomous web browser — scans competitor sites, captures benchmarks, and feeds visual intelligence to the reverse-engineering pipeline.", status: "active" },
  { name: "Vision Cortex", dept: "Intelligence", icon: Eye, job: "Analyzes top-ranking sites, extracts visual tokens, and generates replication strategies for the universal generator.", status: "active" },
  { name: "Code Engineer", dept: "Engineering", icon: Code2, job: "Writes and deploys code for new websites, templates, and backend functions. Handles autonomous refactoring.", status: "active" },
  { name: "Validation Guardian", dept: "QA", icon: CheckCircle2, job: "Validates every generated site against Google's standards. Runs headless browser tests and coverage audits.", status: "active" },
  { name: "Passive Learner", dept: "Intelligence", icon: Brain, job: "Continuously learns from system outcomes. Updates prompt libraries and strategy documents based on performance data.", status: "active" },
  { name: "Autonomous Orchestrator", dept: "Command", icon: Cpu, job: "Runs the 24/7 autonomous cycle — generates sites, deploys them, monitors performance, and triggers auto-healing.", status: "active" },
  { name: "System Monitor", dept: "Operations", icon: AlertCircle, job: "Monitors system health, detects failures, and triggers repair workflows. Tracks uptime and error rates.", status: "active" },
  { name: "Benchmark Scout", dept: "Intelligence", icon: Search, job: "Discovers new industry benchmarks, captures screenshots, and feeds them into the Master Visual Render Library.", status: "active" },
  { name: "Self-Reflection Engine", dept: "Intelligence", icon: Brain, job: "Analyzes past actions, identifies mistakes, and generates improvement recommendations for the agent swarm.", status: "active" },
  { name: "Email Manager", dept: "Communications", icon: Mail, job: "Manages outbound email campaigns, follow-up sequences, and review request automation.", status: "active" },
  { name: "Social Manager", dept: "Marketing", icon: Sparkles, job: "Generates and schedules social media posts across all platforms. Syncs content calendars automatically.", status: "active" },
  { name: "Comms Manager", dept: "Communications", icon: Phone, job: "Routes communications across voice, SMS, email, and WhatsApp. Ensures no lead goes uncontacted.", status: "active" },
  { name: "Site Factory Manager", dept: "Engineering", icon: Globe, job: "Manages the bulk site generation pipeline. Creates SiteBank entries, assigns templates, and triggers deployments.", status: "active" },
  { name: "Scale Fleet", dept: "Engineering", icon: Rocket, job: "Scales the website fleet by provisioning new Vercel subdomains and Base44 URLs in bulk batches.", status: "active" },
  { name: "Swarm Orchestrator", dept: "Command", icon: Network, job: "Coordinates the agent swarm — distributes tasks, tracks completion, and ensures no bottlenecks.", status: "active" },
  { name: "Build Factory", dept: "Engineering", icon: Cpu, job: "Builds and compiles website templates from benchmark data. Handles the stock template factory pipeline.", status: "active" },
  { name: "Lead Orchestrator", dept: "Revenue", icon: Target, job: "Manages lead ingestion, enrichment, scoring, and routing. Ensures every lead is followed up within minutes.", status: "active" },
  { name: "Bottleneck Hunter", dept: "Operations", icon: AlertCircle, job: "Identifies system bottlenecks and performance issues. Recommends and implements optimizations.", status: "active" },
  { name: "System Operator", dept: "Operations", icon: Cpu, job: "Executes system-level operations — deployments, migrations, configuration changes, and infrastructure scaling.", status: "active" },
  { name: "SEO Manager", dept: "Marketing", icon: TrendingUp, job: "Manages SEO strategy, content optimization, and Google Search Console sync across all sites.", status: "active" },
  { name: "Visual Factory", dept: "Engineering", icon: Sparkles, job: "Generates ultra-lifelike images using the prompt library. Ensures all imagery passes the visual quality gate.", status: "active" },
  { name: "Reputation Manager", dept: "Marketing", icon: Star, job: "Manages online reviews, reputation monitoring, and review request automation across all sites.", status: "active" },
];

// ── Master Checklist ────────────────────────────────────────────────────────
const MASTER_CHECKLIST = [
  { item: "Universal Generator System architecture defined", done: true, category: "Architecture" },
  { item: "SiteBank entity for deterministic site inventory tracking", done: true, category: "Architecture" },
  { item: "Bulk Launch Engine for mass Vercel/Base44 provisioning", done: true, category: "Deployment" },
  { item: "Backlink Sheets Logger for Google Sheets tracking", done: true, category: "SEO" },
  { item: "Master Visual Render Library page built", done: true, category: "Intelligence" },
  { item: "Brand Compliance Guardian agent deployed", done: true, category: "Governance" },
  { item: "GPT Bi-Directional Sync pipeline operational", done: true, category: "Integration" },
  { item: "Cron workflows for autonomous bulk launches", done: true, category: "Automation" },
  { item: "Cron workflow for backlink sheets sync", done: true, category: "Automation" },
  { item: "Prompt Testing Lab with autonomous testing agent", done: true, category: "QA" },
  { item: "Connect Railway for 24/7 hosting and sandbox management", done: false, category: "Infrastructure" },
  { item: "Purchase and connect new domain for production", done: false, category: "Infrastructure" },
  { item: "Re-authorize Google connectors with write scopes", done: false, category: "Integration" },
  { item: "Wire mass launch to Site Project pages", done: false, category: "Deployment" },
  { item: "Clone existing external site URL into platform system", done: false, category: "Engineering" },
  { item: "Execute site audit and optimization plan", done: false, category: "QA" },
  { item: "Integrate lead ingestion from fault-line project", done: false, category: "Revenue" },
  { item: "Wire ConfigPanel state to PWA build process", done: false, category: "Engineering" },
  { item: "Enable real-time preview canvas functionality", done: false, category: "Engineering" },
  { item: "Deploy safeguard and synthetic CRM canary", done: false, category: "Security" },
  { item: "Scale to 1,000+ live sites across all 50 states", done: false, category: "Scale" },
  { item: "Achieve Google indexing for 80%+ of deployed sites", done: false, category: "SEO" },
  { item: "Build automated social media syncing per site", done: false, category: "Marketing" },
  { item: "Implement predictive launch simulations via Vision Cortex", done: false, category: "Intelligence" },
];

// ── Google Verification ──────────────────────────────────────────────────────
const GOOGLE_VERIFICATION = [
  { step: "1", title: "Google Search Console Property Setup", desc: "Each site gets its own GSC property. The addSearchConsoleProperty function automates domain verification via DNS TXT records.", status: "automated" },
  { step: "2", title: "Sitemap Generation & Submission", desc: "The generateSitemap function creates XML sitemaps for every site. pingIndexNow and submitToIndexers push them to Google, Bing, and IndexNow.", status: "automated" },
  { step: "3", title: "Google-Compliant Programmatic SEO", desc: "The googleProgrammaticStandard function enforces Google's guidelines for programmatic content — unique value per page, no doorway pages, location-specific content.", status: "automated" },
  { step: "4", title: "Core Web Vitals Monitoring", desc: "The fetchCoreWebVitals function pulls real CWV data from GSC for every site. Sites failing LCP/CLS/INP thresholds trigger auto-healing.", status: "automated" },
  { step: "5", title: "Google Analytics 4 Integration", desc: "The googleAnalytics function syncs GA4 data for traffic, conversions, and user behavior across the entire site network.", status: "automated" },
  { step: "6", title: "Batch Indexing Submission", desc: "The googleBatchSubmissionEngine submits URLs in batches to GSC's URL Inspection API, requesting indexing for new and updated pages.", status: "automated" },
  { step: "7", title: "Google Happiness Score", desc: "The GoogleHappiness dashboard aggregates GSC impressions, clicks, position, and CWV into a single score per site — identifying what Google loves and what needs fixing.", status: "automated" },
  { step: "8", title: "Content Quality Gate", desc: "Every generated page passes through the benchmarkVisualQualityCheck and brandComplianceScanner before deployment — ensuring Google sees unique, high-quality, non-AI-slop content.", status: "automated" },
];

// ── Enhancement Recommendations ──────────────────────────────────────────────
const ENHANCEMENTS = [
  { title: "AI-Driven Content Uniqueness Scoring", impact: "Critical", desc: "Add a per-page content uniqueness score that compares each generated page against all existing pages in the network. Google penalizes near-duplicate content — a uniqueness gate prevents this before deployment.", icon: Brain },
  { title: "Automated Internal Linking Graph", impact: "High", desc: "Build an automated internal linking system where each site links to 3-5 related sites in the network using natural anchor text. This creates a powerful backlink network that Google rewards.", icon: Network },
  { title: "Real-Time GSC Position Tracking", impact: "High", desc: "Poll GSC daily for keyword positions and auto-trigger content optimization when a site drops below position 10. The auto-healing system rewrites underperforming sections automatically.", icon: TrendingUp },
  { title: "Schema.org Structured Data Generator", impact: "High", desc: "Generate JSON-LD schema markup (LocalBusiness, Service, FAQ, Review) for every page. Rich snippets dramatically increase CTR and are a major Google ranking factor for local SEO.", icon: Code2 },
  { title: "Automated Google Business Profile Sync", impact: "Medium", desc: "For each location-based site, auto-create and sync a Google Business Profile with matching NAP data, services, and photos. This is the #1 local SEO ranking factor.", icon: MapPin },
  { title: "Content Freshness Engine", impact: "Medium", desc: "Schedule automated content updates — blog posts, service page tweaks, FAQ additions — every 30-90 days per site. Google rewards fresh content with higher crawl frequency and rankings.", icon: Clock },
  { title: "Multi-Language International Expansion", impact: "Medium", desc: "Use the InternationalEnhancer to generate Spanish, French, and Portuguese versions of top-performing sites. hreflang tags + localized content = international traffic.", icon: Globe },
  { title: "Predictive Launch Queue", impact: "High", desc: "Before deploying a site, run a GodMode simulation to predict its success probability. Only deploy sites with >70% predicted success rate — saving resources on doomed launches.", icon: Target },
];

export default function MasterPlan() {
  const [auditRunning, setAuditRunning] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [auditError, setAuditError] = useState(null);

  // Load SiteBank entries for the map and website list
  const { data: siteBank = [], isLoading: sitesLoading } = useQuery({
    queryKey: ["mp-sitebank"],
    queryFn: async () => {
      const page = await base44.entities.SiteBank.filter({}, { sort: "-created_date", limit: 200 });
      return page.items || [];
    },
  });

  // Load WebsiteQueue entries
  const { data: queue = [], isLoading: queueLoading } = useQuery({
    queryKey: ["mp-queue"],
    queryFn: async () => {
      const page = await base44.entities.WebsiteQueue.filter({}, { sort: "-created_date", limit: 200 });
      return page.items || [];
    },
  });

  // Combine all sites for the map
  const allSites = useMemo(() => {
    const sb = siteBank.map((s) => ({
      id: s.id, site_name: s.site_name, niche: s.niche,
      target_city: s.target_city, target_state: s.target_state,
      status: s.status, site_url: s.site_url, type: "sitebank",
    }));
    const wq = queue.map((q) => ({
      id: q.id, site_name: q.keyword, niche: q.niche,
      target_city: q.target_city, target_state: q.target_state,
      status: q.status, site_url: q.generated_url, type: "queue",
    }));
    return [...sb, ...wq];
  }, [siteBank, queue]);

  // Stats
  const stats = useMemo(() => {
    const live = allSites.filter((s) => s.status === "live" || s.status === "synced").length;
    const queued = allSites.filter((s) => s.status === "queued" || s.status === "deploying").length;
    const cities = new Set(allSites.filter((s) => s.target_city).map((s) => `${s.target_city}|${s.target_state}`)).size;
    const niches = new Set(allSites.map((s) => s.niche).filter(Boolean)).size;
    const states = new Set(allSites.filter((s) => s.target_state).map((s) => s.target_state)).size;
    return { total: allSites.length, live, queued, cities, niches, states, agents: AGENTS.length };
  }, [allSites]);

  // Checklist progress
  const checklistDone = MASTER_CHECKLIST.filter((c) => c.done).length;
  const checklistPct = Math.round((checklistDone / MASTER_CHECKLIST.length) * 100);

  // Group agents by department
  const agentsByDept = useMemo(() => {
    const groups = {};
    AGENTS.forEach((a) => {
      if (!groups[a.dept]) groups[a.dept] = [];
      groups[a.dept].push(a);
    });
    return groups;
  }, []);

  // Run AI audit
  const runAudit = async () => {
    setAuditRunning(true);
    setAuditError(null);
    setAuditResult(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are auditing a mass-scale programmatic SEO website network called "Digital Dominance". The system uses Base44 + Vercel to deploy thousands of location-specific contractor websites (epoxy flooring, roofing, etc.) across all 50 US states.

Current state:
- ${stats.total} sites in the system (${stats.live} live, ${stats.queued} queued)
- ${stats.cities} cities covered across ${stats.states} states
- ${stats.niches} niches targeted
- ${stats.agents} autonomous AI agents running 24/7
- ${checklistDone}/${MASTER_CHECKLIST.length} master checklist items complete (${checklistPct}%)
- Bi-directional GPT sync pipeline operational
- Bulk launch engine with cron automation
- Backlink tracking via Google Sheets
- Master Visual Render Library for benchmark reverse-engineering
- Brand compliance guardian enforcing consistency

Analyze this plan and provide:
1. STRENGTHS — What's working well (3-5 bullet points)
2. WEAKNESSES — Critical gaps and risks (3-5 bullet points)
3. GOOGLE COMPLIANCE RISK — Specific Google guidelines that could be violated and how to prevent it
4. SCALABILITY ASSESSMENT — Can this scale to 10,000+ sites? What breaks first?
5. TOP 3 IMMEDIATE ACTIONS — What should be done right now to maximize success
6. VERDICT — Overall assessment in one sentence

Be direct, specific, and actionable. No fluff.`,
        response_json_schema: {
          type: "object",
          properties: {
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            google_risks: { type: "array", items: { type: "string" } },
            scalability: { type: "string" },
            immediate_actions: { type: "array", items: { type: "string" } },
            verdict: { type: "string" },
          },
        },
      });
      setAuditResult(JSON.stringify(res, null, 2));
    } catch (e) {
      setAuditError(e.message || "Audit failed");
    } finally {
      setAuditRunning(false);
    }
  };

  const audit = auditResult ? JSON.parse(auditResult) : null;

  return (
    <div className="wle-content" style={{ paddingBottom: 40 }}>
      {/* Hero */}
      <div className="wle-hero">
        <div>
          <div className="wle-eyebrow">◈ MASTER COMMAND CENTER</div>
          <h1>Master Plan & Strategy</h1>
          <p>The unified command center for the Digital Dominance network — a mass-scale, AI-orchestrated, Google-compliant programmatic SEO system deploying thousands of location-specific contractor websites across all 50 states.</p>
        </div>
        <div className="wle-hero-badge" style={{ background: "#16a34a", color: "#fff" }}>
          ◈ {checklistPct}% COMPLETE
        </div>
      </div>

      {/* Stats */}
      <div className="wle-stats">
        <div className="wle-stat"><small>Total Sites</small><strong>{stats.total}</strong></div>
        <div className="wle-stat"><small>Live Sites</small><strong style={{ color: "#16a34a" }}>{stats.live}</strong></div>
        <div className="wle-stat"><small>Cities</small><strong>{stats.cities}</strong></div>
        <div className="wle-stat"><small>States</small><strong>{stats.states}</strong></div>
        <div className="wle-stat"><small>Niches</small><strong>{stats.niches}</strong></div>
        <div className="wle-stat"><small>AI Agents</small><strong>{stats.agents}</strong></div>
      </div>

      {/* Interactive US Map */}
      <div className="wle-panels" style={{ marginBottom: 16 }}>
        <section className="wle-panel" style={{ gridColumn: "1 / -1" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#112940", margin: 0 }}>
                🗺️ Live Network Map — Website Locations
              </h2>
              <p style={{ fontSize: 12, color: "#607790", margin: "4px 0 0" }}>
                Every star 💻 is a live site. Every ✦ is queued for deployment. Click any marker for details.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, fontSize: 11 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 6, background: "#dcfce7", color: "#16a34a", fontWeight: 700 }}>
                💻 Live ({stats.live})
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 6, background: "#fef3c7", color: "#d97706", fontWeight: 700 }}>
                ✦ Queued ({stats.queued})
              </span>
            </div>
          </div>
          {sitesLoading || queueLoading ? (
            <div style={{ height: 520, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Loader2 className="w-6 h-6 animate-spin text-[#126fc8]" />
            </div>
          ) : allSites.length === 0 ? (
            <div style={{ height: 520, display: "flex", alignItems: "center", justifyContent: "center", color: "#607790", fontSize: 14 }}>
              No sites deployed yet. Launch sites from the Site Bank or Mass Launch console to populate the map.
            </div>
          ) : (
            <USMap sites={allSites} />
          )}
        </section>
      </div>

      {/* Master Checklist + To-Do */}
      <div className="wle-panels" style={{ marginBottom: 16, gridTemplateColumns: "1fr 1fr" }}>
        {/* Checklist */}
        <section className="wle-panel">
          <div style={{ marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#112940", margin: 0 }}>✅ Master Checklist</h2>
            <p style={{ fontSize: 11, color: "#607790", margin: "4px 0 0" }}>{checklistDone} of {MASTER_CHECKLIST.length} complete · {checklistPct}%</p>
            <div style={{ height: 6, borderRadius: 3, background: "#dce6f1", marginTop: 8, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${checklistPct}%`, background: "linear-gradient(90deg,#126fc8,#41bdff)", borderRadius: 3 }} />
            </div>
          </div>
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {MASTER_CHECKLIST.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 0", borderBottom: "1px solid #f4f8fd" }}>
                {c.done ? (
                  <CheckCircle2 style={{ width: 16, height: 16, color: "#16a34a", flexShrink: 0, marginTop: 1 }} />
                ) : (
                  <Circle style={{ width: 16, height: 16, color: "#dce6f1", flexShrink: 0, marginTop: 1 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, color: c.done ? "#607790" : "#112940", fontWeight: c.done ? 400 : 600, margin: 0, textDecoration: c.done ? "line-through" : "none" }}>
                    {c.item}
                  </p>
                  <span style={{ fontSize: 9, color: "#8faec9", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{c.category}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* To-Do List */}
        <section className="wle-panel">
          <div style={{ marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#112940", margin: 0 }}>📋 Active To-Do List</h2>
            <p style={{ fontSize: 11, color: "#607790", margin: "4px 0 0" }}>Priority actions to advance the master plan</p>
          </div>
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {MASTER_CHECKLIST.filter((c) => !c.done).map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, background: "#fff8e1", border: "1px solid #ffe082", marginBottom: 6 }}>
                <Clock style={{ width: 14, height: 14, color: "#d97706", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, color: "#112940", fontWeight: 600, margin: 0 }}>{c.item}</p>
                  <span style={{ fontSize: 9, color: "#d97706", fontWeight: 700, textTransform: "uppercase" }}>{c.category}</span>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#d97706", background: "#fef3c7", padding: "2px 6px", borderRadius: 4 }}>
                  P{i < 3 ? "1" : i < 7 ? "2" : "3"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Agent Roster */}
      <div className="wle-panels" style={{ marginBottom: 16 }}>
        <section className="wle-panel" style={{ gridColumn: "1 / -1" }}>
          <div style={{ marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#112940", margin: 0 }}>🤖 Autonomous Agent Roster — {AGENTS.length} Agents</h2>
            <p style={{ fontSize: 12, color: "#607790", margin: "4px 0 0" }}>Every agent has a specific job in the autonomous website production pipeline</p>
          </div>
          <div>
            {Object.entries(agentsByDept).map(([dept, agents]) => (
              <div key={dept} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#126fc8", marginBottom: 6, borderBottom: "1px solid #dce6f1", paddingBottom: 4 }}>
                  {dept} Department
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
                  {agents.map((a) => {
                    const Icon = a.icon;
                    return (
                      <div key={a.name} style={{ padding: 10, borderRadius: 10, border: "1px solid #dce6f1", background: "#f8fbfe" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#126fc8,#41bdff)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Icon style={{ width: 14, height: 14, color: "#fff" }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 12, fontWeight: 800, color: "#112940", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</p>
                            <span style={{ fontSize: 9, color: "#16a34a", fontWeight: 700 }}>● {a.status}</span>
                          </div>
                        </div>
                        <p style={{ fontSize: 10, color: "#607790", margin: 0, lineHeight: 1.4 }}>{a.job}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Website Network List */}
      <div className="wle-panels" style={{ marginBottom: 16 }}>
        <section className="wle-panel" style={{ gridColumn: "1 / -1" }}>
          <div style={{ marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#112940", margin: 0 }}>🌐 Website Network — {stats.total} Sites</h2>
            <p style={{ fontSize: 12, color: "#607790", margin: "4px 0 0" }}>Every site in the network with its niche, location, and purpose</p>
          </div>
          <div style={{ maxHeight: 400, overflowY: "auto", borderRadius: 8, border: "1px solid #dce6f1" }}>
            <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f4f8fd", position: "sticky", top: 0 }}>
                  <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: 700, color: "#607790" }}>Site</th>
                  <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: 700, color: "#607790" }}>Niche</th>
                  <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: 700, color: "#607790" }}>Location</th>
                  <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: 700, color: "#607790" }}>Purpose</th>
                  <th style={{ textAlign: "center", padding: "8px 10px", fontWeight: 700, color: "#607790" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {allSites.slice(0, 100).map((s, i) => (
                  <tr key={s.id || i} style={{ borderBottom: "1px solid #f4f8fd" }}>
                    <td style={{ padding: "6px 10px", fontWeight: 600, color: "#112940", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.site_name}
                    </td>
                    <td style={{ padding: "6px 10px", color: "#607790" }}>{s.niche || "—"}</td>
                    <td style={{ padding: "6px 10px", color: "#607790" }}>{s.target_city ? `${s.target_city}, ${s.target_state}` : s.target_state || "—"}</td>
                    <td style={{ padding: "6px 10px", color: "#607790", fontSize: 10 }}>
                      {s.type === "sitebank" ? "Deterministic SEO site for local lead gen" : "Keyword-targeted site for search dominance"}
                    </td>
                    <td style={{ padding: "6px 10px", textAlign: "center" }}>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                        background: s.status === "live" || s.status === "synced" ? "#dcfce7" : s.status === "queued" ? "#fef3c7" : "#e0e7ef",
                        color: s.status === "live" || s.status === "synced" ? "#16a34a" : s.status === "queued" ? "#d97706" : "#607790",
                      }}>
                        {s.status?.toUpperCase() || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {allSites.length > 100 && (
            <p style={{ fontSize: 11, color: "#8faec9", textAlign: "center", marginTop: 8 }}>
              Showing first 100 of {allSites.length} sites
            </p>
          )}
        </section>
      </div>

      {/* AI Audit & Analysis */}
      <div className="wle-panels" style={{ marginBottom: 16 }}>
        <section className="wle-panel" style={{ gridColumn: "1 / -1" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#112940", margin: 0 }}>🧠 AI Audit & Strategy Analysis</h2>
              <p style={{ fontSize: 12, color: "#607790", margin: "4px 0 0" }}>Live AI-powered audit of the entire master plan — strengths, weaknesses, Google risks, and immediate actions</p>
            </div>
            <button
              onClick={runAudit}
              disabled={auditRunning}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 10, background: "#126fc8", color: "#fff", fontWeight: 700, fontSize: 13, border: 0, cursor: auditRunning ? "not-allowed" : "pointer", opacity: auditRunning ? 0.6 : 1 }}
            >
              {auditRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {auditRunning ? "Analyzing..." : "Run AI Audit"}
            </button>
          </div>

          {auditError && (
            <div style={{ padding: 12, borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: 12 }}>
              {auditError}
            </div>
          )}

          {audit && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ padding: 14, borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#16a34a", margin: "0 0 8px" }}>✓ STRENGTHS</h3>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: "#166534", lineHeight: 1.6 }}>
                  {audit.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div style={{ padding: 14, borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca" }}>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#dc2626", margin: "0 0 8px" }}>⚠ WEAKNESSES</h3>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: "#991b1b", lineHeight: 1.6 }}>
                  {audit.weaknesses?.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div style={{ padding: 14, borderRadius: 10, background: "#fffbeb", border: "1px solid #fde68a", gridColumn: "1 / -1" }}>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#d97706", margin: "0 0 8px" }}>🔍 GOOGLE COMPLIANCE RISKS</h3>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: "#92400e", lineHeight: 1.6 }}>
                  {audit.google_risks?.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div style={{ padding: 14, borderRadius: 10, background: "#eff6ff", border: "1px solid #bfdbfe", gridColumn: "1 / -1" }}>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#2563eb", margin: "0 0 8px" }}>📈 SCALABILITY ASSESSMENT</h3>
                <p style={{ fontSize: 11, color: "#1e40af", margin: 0, lineHeight: 1.6 }}>{audit.scalability}</p>
              </div>
              <div style={{ padding: 14, borderRadius: 10, background: "#faf5ff", border: "1px solid #e9d5ff", gridColumn: "1 / -1" }}>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#9333ea", margin: "0 0 8px" }}>⚡ TOP 3 IMMEDIATE ACTIONS</h3>
                <ol style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: "#6b21a8", lineHeight: 1.6 }}>
                  {audit.immediate_actions?.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
              </div>
              <div style={{ padding: 14, borderRadius: 10, background: "#112940", border: "1px solid #126fc8", gridColumn: "1 / -1" }}>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#41bdff", margin: "0 0 8px" }}>🎯 VERDICT</h3>
                <p style={{ fontSize: 12, color: "#e9f4ff", margin: 0, lineHeight: 1.6 }}>{audit.verdict}</p>
              </div>
            </div>
          )}

          {!audit && !auditRunning && !auditError && (
            <div style={{ padding: 32, textAlign: "center", color: "#8faec9", fontSize: 13 }}>
              <Brain style={{ width: 32, height: 32, margin: "0 auto 8px", opacity: 0.3 }} />
              Click "Run AI Audit" to generate a live analysis of your master plan
            </div>
          )}
        </section>
      </div>

      {/* Google Verification */}
      <div className="wle-panels" style={{ marginBottom: 16 }}>
        <section className="wle-panel" style={{ gridColumn: "1 / -1" }}>
          <div style={{ marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#112940", margin: 0 }}>🔍 Google Verification — How This Works with Google</h2>
            <p style={{ fontSize: 12, color: "#607790", margin: "4px 0 0" }}>Every step in the pipeline is designed to comply with Google's guidelines for programmatic SEO and local content</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
            {GOOGLE_VERIFICATION.map((g) => (
              <div key={g.step} style={{ padding: 12, borderRadius: 10, border: "1px solid #dce6f1", background: "#f8fbfe" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: "#126fc8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                    {g.step}
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#112940", margin: 0, flex: 1 }}>{g.title}</p>
                  <span style={{ fontSize: 8, fontWeight: 700, color: "#16a34a", background: "#dcfce7", padding: "2px 5px", borderRadius: 3, textTransform: "uppercase" }}>Auto</span>
                </div>
                <p style={{ fontSize: 10, color: "#607790", margin: 0, lineHeight: 1.5 }}>{g.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Enhancement Recommendations */}
      <div className="wle-panels" style={{ marginBottom: 16 }}>
        <section className="wle-panel" style={{ gridColumn: "1 / -1" }}>
          <div style={{ marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#112940", margin: 0 }}>💡 Enhancement Recommendations</h2>
            <p style={{ fontSize: 12, color: "#607790", margin: "4px 0 0" }}>Strategic upgrades to make this the best mass-scale SEO system possible</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 10 }}>
            {ENHANCEMENTS.map((e, i) => {
              const Icon = e.icon;
              const impactColor = e.impact === "Critical" ? "#dc2626" : e.impact === "High" ? "#d97706" : "#126fc8";
              const impactBg = e.impact === "Critical" ? "#fef2f2" : e.impact === "High" ? "#fffbeb" : "#eff6ff";
              return (
                <div key={i} style={{ padding: 14, borderRadius: 10, border: "1px solid #dce6f1", background: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: impactBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon style={{ width: 16, height: 16, color: impactColor }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 800, color: "#112940", margin: 0 }}>{e.title}</p>
                      <span style={{ fontSize: 9, fontWeight: 700, color: impactColor, textTransform: "uppercase" }}>{e.impact} Impact</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 10, color: "#607790", margin: 0, lineHeight: 1.5 }}>{e.desc}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Mission Statement */}
      <div className="wle-panels">
        <section className="wle-panel" style={{ gridColumn: "1 / -1", background: "linear-gradient(135deg,#031327,#0b3e70)", border: 0 }}>
          <div style={{ textAlign: "center", padding: "20px 16px" }}>
            <Rocket style={{ width: 36, height: 36, color: "#41bdff", margin: "0 auto 12px" }} />
            <h2 style={{ fontSize: 20, fontWeight: 900, color: "#e9f4ff", margin: "0 0 8px" }}>The Mission</h2>
            <p style={{ fontSize: 13, color: "#bad3e9", maxWidth: 700, margin: "0 auto", lineHeight: 1.7 }}>
              Build the world's largest AI-orchestrated, Google-compliant network of location-specific contractor websites.
              Every site delivers genuine value to its local community — real services, real content, real contact information —
              while the autonomous agent swarm handles generation, deployment, monitoring, and optimization 24/7.
              The system scales infinitely through Vercel subdomains and Base44 URLs, with zero marginal cost per site.
            </p>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 24, fontWeight: 900, color: "#41bdff", margin: 0 }}>10,000+</p>
                <p style={{ fontSize: 10, color: "#89a6c2", margin: "2px 0 0" }}>Target Sites</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 24, fontWeight: 900, color: "#41bdff", margin: 0 }}>50</p>
                <p style={{ fontSize: 10, color: "#89a6c2", margin: "2px 0 0" }}>US States</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 24, fontWeight: 900, color: "#41bdff", margin: 0 }}>25+</p>
                <p style={{ fontSize: 10, color: "#89a6c2", margin: "2px 0 0" }}>AI Agents</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 24, fontWeight: 900, color: "#41bdff", margin: 0 }}>24/7</p>
                <p style={{ fontSize: 10, color: "#89a6c2", margin: "2px 0 0" }}>Autonomous</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}