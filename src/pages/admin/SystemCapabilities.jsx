import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Shield, Cpu, Database, Workflow, Bot, Globe, Zap, Star,
  Loader2, Sparkles, CheckCircle2, AlertCircle, TrendingUp,
  Code2, Brain, Eye, Rocket, Target, Award, Layers, Clock,
} from "lucide-react";

const CAPABILITY_DOMAINS = [
  {
    domain: "Template Quality",
    icon: Layers,
    color: "#126fc8",
    capabilities: [
      { name: "Stock Template Factory", status: "active", desc: "200+ industry-specific templates with deterministic compilation" },
      { name: "Benchmark Reverse Engineering", status: "active", desc: "Captures and replicates top-ranking competitor site designs" },
      { name: "Visual Render Library", status: "active", desc: "Master library of benchmark screenshots for visual token extraction" },
      { name: "Prompt Testing Lab", status: "active", desc: "AI-evaluated image generation prompts with quality scoring" },
      { name: "Hero Mockup Enhancer", status: "active", desc: "AI-enhanced hero sections from GPT-generated mockups" },
      { name: "Template Image Mandate", status: "active", desc: "Enforces visual quality gate on all template imagery" },
      { name: "Multi-Template Launcher", status: "active", desc: "Bulk publish selected templates across multiple sites" },
      { name: "Autonomous Template Enhancer", status: "active", desc: "AI-driven continuous template quality improvement" },
    ],
  },
  {
    domain: "Content Generation",
    icon: Code2,
    color: "#10b981",
    capabilities: [
      { name: "SEO Content Generator", status: "active", desc: "Generates Google-compliant programmatic SEO content per page" },
      { name: "Content Gap Filler", status: "active", desc: "Identifies and fills content gaps across deployed sites" },
      { name: "Google Programmatic Standard", status: "active", desc: "Enforces Google's guidelines for programmatic content quality" },
      { name: "Content Freshness Engine", status: "planned", desc: "Automated content updates every 30-90 days per site" },
      { name: "Content Uniqueness Scoring", status: "planned", desc: "Per-page uniqueness score comparing against all network pages" },
      { name: "Multi-Language Generator", status: "planned", desc: "Spanish, French, Portuguese versions with hreflang tags" },
    ],
  },
  {
    domain: "Brand & Visual",
    icon: Star,
    color: "#8b5cf6",
    capabilities: [
      { name: "Brand Generator", status: "active", desc: "AI-powered brand name, tagline, and visual identity generation" },
      { name: "Logo Generator", status: "active", desc: "Generates professional logos with industry-specific prompts" },
      { name: "Rebrand Studio", status: "active", desc: "Full rebrand pipeline with forensic site analysis" },
      { name: "Brand Compliance Guardian", status: "active", desc: "Autonomous agent auditing brand consistency across all pages" },
      { name: "Mandatory Branding System", status: "active", desc: "CSS variable injection enforcing brand colors, fonts, spacing" },
      { name: "Color Studio", status: "active", desc: "AI-driven color palette generation and visual identity tuning" },
    ],
  },
  {
    domain: "Automation & Deployment",
    icon: Zap,
    color: "#f59e0b",
    capabilities: [
      { name: "Bulk Launch Engine", status: "active", desc: "Mass Vercel/Base44 subdomain provisioning with cron automation" },
      { name: "Site Bank Orchestrator", status: "active", desc: "Deterministic, credit-free site inventory creation and tagging" },
      { name: "Backlink Sheets Logger", status: "active", desc: "Automated backlink tracking to master Google Sheets" },
      { name: "Autonomous Visual Orchestrator", status: "active", desc: "Background image generation and quality checking pipeline" },
      { name: "Background Operations Manager", status: "active", desc: "Manages all background autonomous operations and scheduling" },
      { name: "Vercel AI Gateway", status: "active", desc: "Multi-model AI gateway for complex generation tasks" },
      { name: "Railway Cron Dispatcher", status: "active", desc: "24/7 cron-driven task execution via Railway workers" },
      { name: "Autonomous Refactor Engine", status: "active", desc: "AI-driven code refactoring for maintainability" },
    ],
  },
  {
    domain: "Intelligence & QA",
    icon: Brain,
    color: "#ef4444",
    capabilities: [
      { name: "Vision Cortex", status: "active", desc: "Analyzes top-ranking sites and extracts visual tokens for replication" },
      { name: "FaultLine Scanner", status: "active", desc: "Cloud browser-based site scanning for security, performance, SEO issues" },
      { name: "Headless Site Validator", status: "active", desc: "Headless browser testing for every deployed site" },
      { name: "Full Site Test Agent", status: "active", desc: "Comprehensive end-to-end site testing with coverage audits" },
      { name: "Parallel Test Swarm", status: "active", desc: "Parallel test execution across multiple sites simultaneously" },
      { name: "Site Launch Validator", status: "active", desc: "Pre-deployment validation gate for every new site" },
      { name: "Site Health Checker", status: "active", desc: "Continuous health monitoring with auto-healing triggers" },
      { name: "Regression Test Suite", status: "active", desc: "Automated regression testing for template and content changes" },
    ],
  },
  {
    domain: "Autonomous Agents",
    icon: Bot,
    color: "#3b82f6",
    capabilities: [
      { name: "Alpha Prime Orchestrator", status: "active", desc: "Master orchestrator coordinating all agents and priorities" },
      { name: "Code Engineer Agent", status: "active", desc: "Writes and deploys code for new websites and templates" },
      { name: "Validation Guardian", status: "active", desc: "Validates every site against Google's standards" },
      { name: "Shadow Browser Agent", status: "active", desc: "Autonomous web browser for competitor scanning" },
      { name: "Self-Reflection Engine", status: "active", desc: "Analyzes past actions and generates improvement recommendations" },
      { name: "Passive Learner", status: "active", desc: "Continuously learns from system outcomes" },
      { name: "System Monitor", status: "active", desc: "Monitors system health and triggers repair workflows" },
      { name: "Benchmark Scout", status: "active", desc: "Discovers new industry benchmarks for the visual library" },
    ],
  },
];

const TOP_ENHANCEMENTS = [
  { rank: 1, title: "AI Content Uniqueness Scoring", impact: "Critical", effort: "Medium", desc: "Per-page uniqueness score comparing each generated page against all existing pages. Google penalizes near-duplicate content — a uniqueness gate prevents this before deployment.", icon: Brain, gain: "Prevents Google duplicate-content penalties across 10,000+ sites" },
  { rank: 2, title: "Automated Internal Linking Graph", impact: "Critical", effort: "Medium", desc: "Each site links to 3-5 related sites using natural anchor text. Creates a powerful backlink network Google rewards.", icon: Target, gain: "10,000+ internal backlinks with zero manual effort" },
  { rank: 3, title: "Schema.org Structured Data Generator", impact: "Critical", effort: "Low", desc: "JSON-LD schema markup (LocalBusiness, Service, FAQ, Review) for every page. Rich snippets dramatically increase CTR.", icon: Code2, gain: "Rich snippets = 30%+ CTR increase in search results" },
  { rank: 4, title: "Bulk Video Generator Integration", impact: "High", effort: "Medium", desc: "Generate video content for every site using AI — hero videos, service explainers, testimonial videos. Video is the #1 engagement factor.", icon: Zap, gain: "Video on every page increases dwell time and conversion" },
  { rank: 5, title: "Fully Automated Social Media System", impact: "High", effort: "Medium", desc: "Per-site social media generation + 30-day content calendar + auto-scheduling. Each site gets its own social presence.", icon: Star, gain: "Social signals boost SEO + drive referral traffic" },
  { rank: 6, title: "Real-Time GSC Position Tracking", impact: "High", effort: "Medium", desc: "Poll GSC daily for keyword positions. Auto-trigger content optimization when a site drops below position 10.", icon: TrendingUp, gain: "Auto-healing underperforming sites before traffic drops" },
  { rank: 7, title: "Automated Google Business Profile Sync", impact: "High", effort: "High", desc: "Auto-create and sync GBP for each location-based site with matching NAP data, services, and photos.", icon: Globe, gain: "#1 local SEO ranking factor automated at scale" },
  { rank: 8, title: "Content Freshness Engine", impact: "Medium", effort: "Low", desc: "Schedule automated content updates every 30-90 days per site. Google rewards fresh content with higher crawl frequency.", icon: Clock, gain: "Higher crawl frequency = faster indexing and ranking" },
  { rank: 9, title: "Predictive Launch Queue", impact: "Medium", effort: "Medium", desc: "Run GodMode simulation before deploying. Only deploy sites with >70% predicted success rate.", icon: Target, gain: "Eliminates wasted resources on doomed launches" },
  { rank: 10, title: "Multi-Language International Expansion", impact: "Medium", effort: "High", desc: "Generate Spanish, French, Portuguese versions of top-performing sites with hreflang tags.", icon: Globe, gain: "International traffic with zero additional content cost" },
];

export default function SystemCapabilities() {
  const [auditRunning, setAuditRunning] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [auditError, setAuditError] = useState(null);

  // Load template count for audit context
  const { data: templateCount = 0 } = useQuery({
    queryKey: ["sc-template-count"],
    queryFn: async () => base44.entities.TemplateLibrary.count({ is_active: true }),
  });

  const { data: siteCount = 0 } = useQuery({
    queryKey: ["sc-site-count"],
    queryFn: async () => base44.entities.SiteBank.count({}),
  });

  const { data: promptCount = 0 } = useQuery({
    queryKey: ["sc-prompt-count"],
    queryFn: async () => base44.entities.PromptLibrary.count({ is_active: true }),
  });

  const { data: agentCount = 0 } = useQuery({
    queryKey: ["sc-agent-count"],
    queryFn: async () => {
      try { return await base44.entities.AgentPersona.count({}); } catch { return 0; }
    },
  });

  const totalCapabilities = CAPABILITY_DOMAINS.reduce((sum, d) => sum + d.capabilities.length, 0);
  const activeCapabilities = CAPABILITY_DOMAINS.reduce((sum, d) => sum + d.capabilities.filter(c => c.status === "active").length, 0);
  const capabilityScore = Math.round((activeCapabilities / totalCapabilities) * 100);

  const runAudit = async () => {
    setAuditRunning(true);
    setAuditError(null);
    setAuditResult(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are auditing a mass-scale programmatic SEO website network called "Unlimited Websites". Perform a comprehensive end-to-end system audit.

System inventory:
- ${templateCount} active templates across multiple industries
- ${siteCount} sites in the SiteBank inventory
- ${promptCount} active image generation prompts
- ${agentCount} AI agent personas
- ${totalCapabilities} total system capabilities (${activeCapabilities} active, ${capabilityScore}% operational)
- ${CAPABILITY_DOMAINS.length} capability domains: ${CAPABILITY_DOMAINS.map(d => d.domain).join(", ")}

Capability domains and their features:
${CAPABILITY_DOMAINS.map(d => `${d.domain} (${d.capabilities.filter(c => c.status === "active").length}/${d.capabilities.length} active):\n${d.capabilities.map(c => `  - ${c.name}: ${c.status} — ${c.desc}`).join("\n")}`).join("\n\n")}

Top planned enhancements:
${TOP_ENHANCEMENTS.map(e => `${e.rank}. ${e.title} (${e.impact} impact, ${e.effort} effort): ${e.desc}`).join("\n")}

Perform a comprehensive audit and provide:
1. TEMPLATE QUALITY AUDIT — Score 0-100 with specific findings on template design, imagery, content quality, and brand consistency
2. CONTENT QUALITY AUDIT — Score 0-100 with findings on content uniqueness, SEO compliance, and Google guideline adherence
3. BRAND GENERATOR AUDIT — Score 0-100 with findings on brand name quality, logo generation, and visual identity consistency
4. AUTOMATION AUDIT — Score 0-100 with findings on workflow reliability, cron coverage, and autonomous operation gaps
5. OVERALL SYSTEM SCORE — Weighted average 0-100
6. TOP 5 ENHANCEMENTS — Ranked by impact-to-effort ratio, with specific implementation guidance for each
7. QUALITY CEILING ANALYSIS — What is the absolute highest quality technologically achievable, and what specific upgrades get us there

Be direct, specific, and brutally honest. No fluff. Score each area independently.`,
        response_json_schema: {
          type: "object",
          properties: {
            template_quality: { type: "object", properties: { score: { type: "number" }, findings: { type: "array", items: { type: "string" } } } },
            content_quality: { type: "object", properties: { score: { type: "number" }, findings: { type: "array", items: { type: "string" } } } },
            brand_generator: { type: "object", properties: { score: { type: "number" }, findings: { type: "array", items: { type: "string" } } } },
            automation: { type: "object", properties: { score: { type: "number" }, findings: { type: "array", items: { type: "string" } } } },
            overall_score: { type: "number" },
            top_enhancements: { type: "array", items: { type: "object", properties: { rank: { type: "number" }, title: { type: "string" }, guidance: { type: "string" } } } },
            quality_ceiling: { type: "string" },
          },
        },
      });
      setAuditResult(res);
    } catch (e) {
      setAuditError(e.message || "Audit failed");
    } finally {
      setAuditRunning(false);
    }
  };

  const audit = auditResult;

  return (
    <div className="wle-content" style={{ paddingBottom: 40 }}>
      {/* Hero */}
      <div className="wle-hero">
        <div>
          <div className="wle-eyebrow">◈ SYSTEM AUDIT</div>
          <h1>System Capabilities & Audit</h1>
          <p>Complete inventory of system capabilities across all domains, with an end-to-end AI audit of template quality, content, brand generators, and automations. Includes recommended enhancements to achieve the highest possible quality.</p>
        </div>
        <div className="wle-hero-badge" style={{ background: "#16a34a", color: "#fff" }}>
          ◈ {capabilityScore}% OPERATIONAL
        </div>
      </div>

      {/* System Stats */}
      <div className="wle-stats">
        <div className="wle-stat"><small>Templates</small><strong>{templateCount}</strong></div>
        <div className="wle-stat"><small>Sites</small><strong>{siteCount}</strong></div>
        <div className="wle-stat"><small>Prompts</small><strong>{promptCount}</strong></div>
        <div className="wle-stat"><small>Agents</small><strong>{agentCount}</strong></div>
        <div className="wle-stat"><small>Capabilities</small><strong>{activeCapabilities}<span style={{ fontSize: 11, color: "#8faec9" }}>/{totalCapabilities}</span></strong></div>
        <div className="wle-stat"><small>Domains</small><strong>{CAPABILITY_DOMAINS.length}</strong></div>
      </div>

      {/* Capability Domains */}
      <div className="wle-panels" style={{ marginBottom: 16 }}>
        <section className="wle-panel" style={{ gridColumn: "1 / -1" }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#112940", margin: "0 0 12px" }}>🧩 System Capabilities by Domain</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 12 }}>
            {CAPABILITY_DOMAINS.map((d, di) => {
              const Icon = d.icon;
              const active = d.capabilities.filter(c => c.status === "active").length;
              const pct = Math.round((active / d.capabilities.length) * 100);
              return (
                <div key={di} style={{ padding: 14, borderRadius: 12, border: "1px solid #dce6f1", background: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #f4f8fd" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${d.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon style={{ width: 18, height: 18, color: d.color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 800, color: "#112940", margin: 0 }}>{d.domain}</p>
                      <span style={{ fontSize: 10, color: d.color, fontWeight: 700 }}>{active}/{d.capabilities.length} active · {pct}%</span>
                    </div>
                  </div>
                  <div style={{ display: "grid", gap: 4 }}>
                    {d.capabilities.map((c, ci) => (
                      <div key={ci} style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: "4px 0" }}>
                        {c.status === "active" ? <CheckCircle2 style={{ width: 14, height: 14, color: "#16a34a", flexShrink: 0, marginTop: 1 }} /> : <Clock style={{ width: 14, height: 14, color: "#d97706", flexShrink: 0, marginTop: 1 }} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: c.status === "active" ? "#112940" : "#607790", margin: 0 }}>{c.name}</p>
                          <p style={{ fontSize: 10, color: "#8faec9", margin: "1px 0 0", lineHeight: 1.3 }}>{c.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* AI Audit */}
      <div className="wle-panels" style={{ marginBottom: 16 }}>
        <section className="wle-panel" style={{ gridColumn: "1 / -1" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#112940", margin: 0 }}>🔍 End-to-End System Audit</h2>
              <p style={{ fontSize: 12, color: "#607790", margin: "4px 0 0" }}>AI-powered audit of template quality, content, brand generators, and automations with enhancement recommendations</p>
            </div>
            <button onClick={runAudit} disabled={auditRunning}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 10, background: "#126fc8", color: "#fff", fontWeight: 700, fontSize: 13, border: 0, cursor: auditRunning ? "not-allowed" : "pointer", opacity: auditRunning ? 0.6 : 1 }}>
              {auditRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {auditRunning ? "Auditing..." : "Run Full Audit"}
            </button>
          </div>

          {auditError && <div style={{ padding: 12, borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: 12 }}>{auditError}</div>}

          {audit && (
            <div style={{ display: "grid", gap: 12 }}>
              {/* Scores */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                {[
                  { label: "Template Quality", data: audit.template_quality, color: "#126fc8" },
                  { label: "Content Quality", data: audit.content_quality, color: "#10b981" },
                  { label: "Brand Generator", data: audit.brand_generator, color: "#8b5cf6" },
                  { label: "Automation", data: audit.automation, color: "#f59e0b" },
                ].map((s, i) => (
                  <div key={i} style={{ padding: 14, borderRadius: 10, border: "1px solid #dce6f1", background: "#fff", textAlign: "center" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#607790", margin: "0 0 6px", textTransform: "uppercase" }}>{s.label}</p>
                    <p style={{ fontSize: 32, fontWeight: 900, color: s.color, margin: "0 0 4px" }}>{s.data?.score ?? "—"}</p>
                    <div style={{ height: 4, borderRadius: 2, background: "#dce6f1", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${s.data?.score || 0}%`, background: s.color, borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Overall Score */}
              <div style={{ padding: 16, borderRadius: 12, background: "linear-gradient(135deg,#031327,#0b3e70)", textAlign: "center" }}>
                <p style={{ fontSize: 12, color: "#89a6c2", margin: "0 0 4px", textTransform: "uppercase", fontWeight: 700 }}>Overall System Score</p>
                <p style={{ fontSize: 48, fontWeight: 900, color: "#41bdff", margin: 0 }}>{audit.overall_score}<span style={{ fontSize: 20, color: "#89a6c2" }}>/100</span></p>
              </div>

              {/* Findings */}
              {[
                { label: "Template Quality Findings", data: audit.template_quality?.findings, color: "#126fc8", bg: "#eff6ff" },
                { label: "Content Quality Findings", data: audit.content_quality?.findings, color: "#10b981", bg: "#f0fdf4" },
                { label: "Brand Generator Findings", data: audit.brand_generator?.findings, color: "#8b5cf6", bg: "#faf5ff" },
                { label: "Automation Findings", data: audit.automation?.findings, color: "#f59e0b", bg: "#fffbeb" },
              ].map((f, i) => f.data?.length > 0 && (
                <div key={i} style={{ padding: 14, borderRadius: 10, background: f.bg, border: `1px solid ${f.color}33` }}>
                  <h3 style={{ fontSize: 13, fontWeight: 800, color: f.color, margin: "0 0 8px" }}>{f.label}</h3>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: "#112940", lineHeight: 1.6 }}>
                    {f.data.map((item, j) => <li key={j}>{item}</li>)}
                  </ul>
                </div>
              ))}

              {/* Top Enhancements from Audit */}
              {audit.top_enhancements?.length > 0 && (
                <div style={{ padding: 14, borderRadius: 10, background: "#faf5ff", border: "1px solid #e9d5ff" }}>
                  <h3 style={{ fontSize: 13, fontWeight: 800, color: "#9333ea", margin: "0 0 8px" }}>⚡ AI-Recommended Top Enhancements</h3>
                  <ol style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: "#6b21a8", lineHeight: 1.6 }}>
                    {audit.top_enhancements.map((e, i) => (
                      <li key={i} style={{ marginBottom: 6 }}>
                        <strong>{e.title}</strong> — {e.guidance}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Quality Ceiling */}
              {audit.quality_ceiling && (
                <div style={{ padding: 14, borderRadius: 10, background: "#112940", border: "1px solid #126fc8" }}>
                  <h3 style={{ fontSize: 13, fontWeight: 800, color: "#41bdff", margin: "0 0 8px" }}>🎯 Quality Ceiling Analysis</h3>
                  <p style={{ fontSize: 12, color: "#e9f4ff", margin: 0, lineHeight: 1.6 }}>{audit.quality_ceiling}</p>
                </div>
              )}
            </div>
          )}

          {!audit && !auditRunning && !auditError && (
            <div style={{ padding: 32, textAlign: "center", color: "#8faec9", fontSize: 13 }}>
              <Brain style={{ width: 32, height: 32, margin: "0 auto 8px", opacity: 0.3 }} />
              Click "Run Full Audit" to generate a comprehensive end-to-end system audit
            </div>
          )}
        </section>
      </div>

      {/* Top Enhancements */}
      <div className="wle-panels">
        <section className="wle-panel" style={{ gridColumn: "1 / -1" }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#112940", margin: "0 0 12px" }}>🏆 Top Enhancements for Maximum Quality</h2>
          <p style={{ fontSize: 12, color: "#607790", margin: "0 0 12px" }}>Ranked enhancements to achieve the absolute highest quality templates technologically achievable</p>
          <div style={{ display: "grid", gap: 8 }}>
            {TOP_ENHANCEMENTS.map((e, i) => {
              const Icon = e.icon;
              const impactColor = e.impact === "Critical" ? "#dc2626" : e.impact === "High" ? "#d97706" : "#126fc8";
              const impactBg = e.impact === "Critical" ? "#fef2f2" : e.impact === "High" ? "#fffbeb" : "#eff6ff";
              return (
                <div key={i} style={{ display: "flex", gap: 12, padding: 14, borderRadius: 10, border: "1px solid #dce6f1", background: "#fff" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: impactBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon style={{ width: 18, height: 18, color: impactColor }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: "#8faec9" }}>#{e.rank}</span>
                      <p style={{ fontSize: 13, fontWeight: 800, color: "#112940", margin: 0 }}>{e.title}</p>
                      <span style={{ fontSize: 9, fontWeight: 700, color: impactColor, background: impactBg, padding: "2px 6px", borderRadius: 4, textTransform: "uppercase" }}>{e.impact}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#607790", background: "#f4f8fd", padding: "2px 6px", borderRadius: 4, textTransform: "uppercase" }}>{e.effort} effort</span>
                    </div>
                    <p style={{ fontSize: 11, color: "#607790", margin: "0 0 4px", lineHeight: 1.4 }}>{e.desc}</p>
                    <p style={{ fontSize: 10, color: "#16a34a", margin: 0, fontWeight: 600 }}>✓ {e.gain}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}