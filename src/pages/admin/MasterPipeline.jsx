import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Brain, Search, Radar, Target, Bot, Globe, FileText, Users,
  MessageSquare, Shield, Rocket, Check, RotateCcw, ChevronLeft,
  Loader2, Lightbulb, Zap, TrendingUp, Database, Github, MapPin,
} from "lucide-react";
import ForensicAudit from "@/components/master-pipeline/ForensicAudit";
import PipelineStep from "@/components/master-pipeline/PipelineStepV2";

// ═══════════════════════════════════════════════════════════════
// MASTER PIPELINE — 10 steps, each cascading from prior choices
// Each step's recommendations are computed from uploaded intelligence
// ═══════════════════════════════════════════════════════════════

const PIPELINE = [
  {
    id: 1,
    phase: "DISCOVER",
    title: "Intelligence Audit",
    description: "Scan all uploaded workbooks, market research, and intelligence to understand what the system knows",
    icon: Brain,
    intelCategories: ["market_research", "competitor_analysis", "industry_trends", "customer_insights", "product_knowledge"],
    recommend: (state, intel) => {
      if (intel.length === 0) return { text: "No intelligence uploaded yet. Start by gathering market research or uploading workbooks.", reason: "AgentIntelligence entity is empty" };
      const categories = {};
      intel.forEach((i) => { categories[i.category] = (categories[i.category] || 0) + 1; });
      const topCat = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
      return {
        text: `Focus on ${topCat[0].replace(/_/g, " ")} — you have ${topCat[1]} sources in this area. This is your strongest knowledge base.`,
        reason: `${intel.length} total intelligence sources across ${Object.keys(categories).length} categories`,
      };
    },
    actions: (s, intel) => [
      { id: "use_existing", label: "Use Existing Intelligence", desc: `Leverage ${intel.length} uploaded sources`, icon: Database, tools: ["Intelligence", "RAG Engine", "SOP & Memory"] },
      { id: "gather_new", label: "Gather New Intelligence", desc: "Run market research scans", icon: Search, tools: ["Intelligence", "Opportunity Intelligence"] },
      { id: "upload_workbooks", label: "Upload Workbooks", desc: "Add new data from files", icon: FileText, tools: ["RAG Engine", "Intelligence"] },
    ],
    tools: [
      { path: "/admin/intelligence", label: "Intelligence Center" },
      { path: "/admin/rag", label: "RAG Engine" },
      { path: "/admin/sop", label: "SOP & Memory" },
    ],
  },
  {
    id: 2,
    phase: "DISCOVER",
    title: "Opportunity Discovery",
    description: "Search Google + GitHub for opportunities, trends, and open-source tools to leverage",
    icon: Search,
    intelCategories: ["market_research", "industry_trends", "domain_strategy"],
    recommend: (s, intel) => {
      const focus = s.step1?.id;
      if (focus === "use_existing" && intel.length > 0) {
        return { text: "Search for opportunities in your strongest markets. Use GitHub to find open-source tools that match your intelligence.", reason: "Step 1 selected: use existing intelligence" };
      }
      return { text: "Run a broad opportunity scan across Google Trends, GitHub repos, and regional business needs (FL: Vero Beach to Miami).", reason: "Default discovery pattern" };
    },
    actions: (s) => [
      { id: "google_scan", label: "Google Trends Scan", desc: "Search trending topics + market gaps", icon: TrendingUp, tools: ["Opportunity Intelligence"] },
      { id: "github_scan", label: "GitHub Repo Search", desc: "Find open-source tools & templates", icon: Github, tools: ["GitHub Search"] },
      { id: "regional_scan", label: "Regional Business Scan", desc: "FL: Vero Beach → Miami industry needs", icon: Globe, tools: ["Lead Scraper"] },
      { id: "full_scan", label: "Full Multi-Source Scan", desc: "Google + GitHub + Regional combined", icon: Zap, tools: ["Opportunity Intelligence", "Lead Scraper"] },
    ],
    tools: [
      { path: "/admin", label: "Opportunity Intelligence" },
      { path: "/admin/lead-scraper", label: "Lead Scraper" },
    ],
  },
  {
    id: 3,
    phase: "ANALYZE",
    title: "Competitive Recon",
    description: "Scrape competitors, analyze their strategies, and benchmark against top performers",
    icon: Radar,
    intelCategories: ["competitor_analysis", "industry_trends", "seo_strategy"],
    recommend: (s, intel) => {
      const competitorIntel = intel.filter((i) => i.category === "competitor_analysis");
      if (competitorIntel.length > 0) {
        return { text: `You have ${competitorIntel.length} competitor analyses. Run the scraper on their sites to extract updated strategies and design patterns.`, reason: "Competitor intelligence available" };
      }
      return { text: "Start by scraping the top 20 benchmark companies in your niche. Extract their marketing, design, and funnel strategies.", reason: "No competitor data yet" };
    },
    actions: (s) => [
      { id: "scrape_competitors", label: "Scrape Top Competitors", desc: "Extract strategies from top 20 sites", icon: Radar, tools: ["Competitors"] },
      { id: "benchmark_analysis", label: "Benchmark Analysis", desc: "Compare against industry leaders", icon: TrendingUp, tools: ["Competitors", "Site Health"] },
      { id: "seo_recon", label: "SEO Recon", desc: "Analyze competitor SEO strategies", icon: Search, tools: ["SEO Simulator", "Google SEO"] },
    ],
    tools: [
      { path: "/admin/competitors", label: "Competitors" },
      { path: "/admin/site-health", label: "Site Health" },
      { path: "/admin/seo-simulator", label: "SEO Simulator" },
    ],
  },
  {
    id: 4,
    phase: "STRATEGIZE",
    title: "Strategy Selection",
    description: "System recommends the best strategy based on all uploaded intelligence and scan results",
    icon: Target,
    intelCategories: ["sales_playbook", "domain_strategy", "seo_strategy", "brand_guidelines"],
    recommend: (s, intel) => {
      const strategies = intel.filter((i) => i.category === "sales_playbook" || i.category === "domain_strategy" || i.category === "seo_strategy");
      if (strategies.length > 0) {
        const top = strategies[0];
        return { text: `Deploy the "${top.title}" strategy — it has the highest confidence score (${top.confidence || 0.9}) in your intelligence base.`, reason: `${strategies.length} strategy sources found in workbooks` };
      }
      return { text: "Use the Vision Studio to generate a strategy from your scan results. The system will produce 3 options ranked by viability.", reason: "No pre-loaded strategies found" };
    },
    actions: (s) => [
      { id: "vision_studio", label: "Vision Studio Strategy", desc: "AI generates 3 ranked strategy options", icon: Target, tools: ["Vision Studio"] },
      { id: "crystal_ball", label: "Crystal Ball Prediction", desc: "Predictive modeling for best path", icon: Zap, tools: ["Crystal Ball"] },
      { id: "manual_strategy", label: "Manual Strategy", desc: "Define your own approach", icon: FileText, tools: ["Strategy"] },
    ],
    tools: [
      { path: "/admin/vision-studio", label: "Vision Studio" },
      { path: "/admin/vision-strategy", label: "Strategy" },
      { path: "/admin/crystal-ball", label: "Crystal Ball" },
    ],
  },
  {
    id: 5,
    phase: "BUILD",
    title: "Agent Architecture",
    description: "Build the right agent team to execute your selected strategy",
    icon: Bot,
    intelCategories: ["training_material", "company_policy", "product_knowledge"],
    recommend: (s, intel) => {
      const strategy = s.step4?.id;
      if (strategy === "vision_studio") {
        return { text: "Deploy a full Corporate Agent Team: CEO, CTO, EA, VPs (Marketing, Sales, Engineering), QA, and Security. The Vision Studio will generate personas automatically.", reason: "Vision Studio strategy selected" };
      }
      return { text: "Start with a lean team: Lead Orchestrator + SEO Manager + Comms Manager. Expand as the pipeline grows.", reason: "Lean deployment recommended" };
    },
    actions: (s) => [
      { id: "full_team", label: "Full Corporate Team", desc: "CEO, CTO, EA, VPs, QA, Security (12+ agents)", icon: Users, tools: ["Agent Builder"] },
      { id: "lean_team", label: "Lean Team", desc: "Lead Orchestrator + SEO + Comms (3-5 agents)", icon: Bot, tools: ["Agent Builder"] },
      { id: "swarm", label: "Swarm Deployment", desc: "Multi-agent autonomous swarm", icon: Zap, tools: ["Swarm Command"] },
    ],
    tools: [
      { path: "/admin/agent-builder", label: "Agent Builder" },
      { path: "/admin/agent-master", label: "Agent Master" },
      { path: "/admin/swarm", label: "Swarm Command" },
    ],
  },
  {
    id: 6,
    phase: "BUILD",
    title: "Domain & URL Strategy",
    description: "Secure high-value domains and plan your URL architecture for SEO dominance",
    icon: Globe,
    intelCategories: ["domain_strategy", "seo_strategy"],
    recommend: (s, intel) => {
      const domainIntel = intel.filter((i) => i.category === "domain_strategy");
      if (domainIntel.length > 0) {
        return { text: `Your workbooks contain ${domainIntel.length} domain strategies. Generate "near me" + city-specific patterns for your top niches.`, reason: "Domain strategy intelligence found" };
      }
      return { text: "Generate domains using 'near me', 'near you', 'cost', and city+state patterns. Focus on epoxy, decorative concrete, and polished concrete niches.", reason: "Default domain strategy" };
    },
    actions: (s) => [
      { id: "near_me", label: "Near Me Domains", desc: "High-intent 'near me' pattern", icon: Globe, tools: ["URL Strategy"] },
      { id: "city_domains", label: "City-Specific Domains", desc: "City + state + niche patterns", icon: MapPin, tools: ["URL Strategy", "Domain Rush"] },
      { id: "full_portfolio", label: "Full Domain Portfolio", desc: "All patterns + all niches + all cities", icon: Rocket, tools: ["URL Strategy", "Domain Rush"] },
    ],
    tools: [
      { path: "/admin/url-strategy", label: "URL Strategy" },
      { path: "/admin/domain-rush", label: "Domain Rush" },
    ],
  },
  {
    id: 7,
    phase: "GENERATE",
    title: "Content & SEO Engine",
    description: "Generate SEO pages, content, and websites at scale",
    icon: FileText,
    intelCategories: ["seo_strategy", "brand_guidelines", "product_knowledge", "training_material"],
    recommend: (s, intel) => {
      const seoIntel = intel.filter((i) => i.category === "seo_strategy" || i.category === "brand_guidelines");
      if (seoIntel.length > 0) {
        return { text: `Generate location pages + cost guides + service pages using your ${seoIntel.length} SEO/brand intelligence sources. Target the "near me" + city patterns from Step 6.`, reason: "SEO strategy intelligence available" };
      }
      return { text: "Start with cost guides (highest search volume), then location pages, then service pages. Use the SEO Generator for automated page creation.", reason: "Default content priority" };
    },
    actions: (s) => [
      { id: "seo_pages", label: "SEO Page Generation", desc: "Location + cost + service pages", icon: FileText, tools: ["SEO Generator", "SEO Dominance"] },
      { id: "website_factory", label: "Website Factory", desc: "Mass website generation", icon: Rocket, tools: ["Website Factory", "Templates"] },
      { id: "full_empire", label: "Website Empire", desc: "Multi-site empire deployment", icon: Globe, tools: ["Website Empire", "Site Builder"] },
    ],
    tools: [
      { path: "/admin/seo-generator", label: "SEO Generator" },
      { path: "/admin/seo-dominance", label: "SEO Dominance" },
      { path: "/admin/website-factory", label: "Website Factory" },
    ],
  },
  {
    id: 8,
    phase: "GENERATE",
    title: "Lead Generation & Skip Trace",
    description: "Find leads, scrape contact info, and enrich with skip trace data",
    icon: Users,
    intelCategories: ["customer_insights", "sales_playbook", "operational_data"],
    recommend: (s, intel) => {
      const customerIntel = intel.filter((i) => i.category === "customer_insights");
      if (customerIntel.length > 0) {
        return { text: `Target ${customerIntel.length} customer insight profiles. Use the Lead Scraper for bulk collection, then Skip Trace for enrichment.`, reason: "Customer intelligence available" };
      }
      return { text: "Scrape leads from multiple sources (Estately, BLS, public records), then run Skip Trace to enrich with phone/email/address.", reason: "Default lead gen pattern" };
    },
    actions: (s) => [
      { id: "scrape_leads", label: "Scrape Leads", desc: "Multi-source lead collection", icon: Radar, tools: ["Lead Scraper"] },
      { id: "skip_trace", label: "Skip Trace Enrichment", desc: "People + property lookup", icon: Search, tools: ["Skip Trace"] },
      { id: "full_pipeline", label: "Full Lead Pipeline", desc: "Scrape → enrich → score → assign", icon: Zap, tools: ["Lead Scraper", "Skip Trace", "Pipeline"] },
    ],
    tools: [
      { path: "/admin/lead-scraper", label: "Lead Scraper" },
      { path: "/admin/skip-trace", label: "Skip Trace" },
      { path: "/admin/pipeline", label: "Pipeline" },
    ],
  },
  {
    id: 9,
    phase: "DEPLOY",
    title: "Communication & Outreach",
    description: "Multi-channel outreach: SMS, email, voice, WhatsApp, social media",
    icon: MessageSquare,
    intelCategories: ["sales_playbook", "company_policy", "brand_guidelines"],
    recommend: (s, intel) => {
      const salesIntel = intel.filter((i) => i.category === "sales_playbook");
      if (salesIntel.length > 0) {
        return { text: `Deploy ${salesIntel.length} sales playbooks via Xtreme Comms. Use SMS for immediate contact, email for follow-up, and AI Voice for appointment setting.`, reason: "Sales playbook intelligence found" };
      }
      return { text: "Start with SMS follow-up (highest response rate), then email sequences, then AI Voice for appointment booking.", reason: "Default outreach priority" };
    },
    actions: (s) => [
      { id: "sms_campaign", label: "SMS/MMS Campaign", desc: "Immediate contact via Telnyx", icon: MessageSquare, tools: ["Xtreme Comms", "Telnyx"] },
      { id: "email_campaign", label: "Email Sequence", desc: "Automated follow-up emails", icon: FileText, tools: ["Emails"] },
      { id: "voice_ai", label: "AI Voice Outreach", desc: "Automated call booking", icon: Bot, tools: ["AI Voice", "Xtreme Comms"] },
      { id: "social", label: "Social Media", desc: "Automated social posting", icon: Zap, tools: ["Social Studio"] },
    ],
    tools: [
      { path: "/admin/xtreme-comms", label: "Xtreme Comms" },
      { path: "/admin/telnyx", label: "Telnyx" },
      { path: "/admin/voice-assistant", label: "AI Voice" },
      { path: "/admin/social-studio", label: "Social Studio" },
    ],
  },
  {
    id: 10,
    phase: "DOMINATE",
    title: "Convergence & Dominance",
    description: "Validate the entire system, converge to 100%, and launch autonomous dominance",
    icon: Shield,
    intelCategories: ["operational_data", "company_policy", "training_material"],
    recommend: (s, intel) => {
      return { text: "Run the Convergence Engine to validate all systems, then activate Autonomous Dominance for 24/7 operation. The system will self-heal and self-optimize.", reason: "Final pipeline phase" };
    },
    actions: (s) => [
      { id: "converge", label: "Run Convergence Engine", desc: "Validate → fix → verify → 100%", icon: Shield, tools: ["Convergence Engine"] },
      { id: "autonomous", label: "Activate Autonomous Dominance", desc: "24/7 self-reflection + ingestion", icon: Zap, tools: ["Autonomous Dominance"] },
      { id: "full_dominance", label: "Full Dominance Launch", desc: "Converge + autonomous + digital dominance", icon: Rocket, tools: ["Convergence Engine", "Digital Dominance", "Autonomous Dominance"] },
    ],
    tools: [
      { path: "/admin/convergence", label: "Convergence Engine" },
      { path: "/admin/digital-dominance", label: "Digital Dominance" },
      { path: "/admin/autonomous-dominance", label: "Autonomous Dominance" },
    ],
  },
];

// ═══════════════════════════════════════════════════════

export default function MasterPipeline() {
  const [state, setState] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [githubQuery, setGithubQuery] = useState("");
  const [githubResults, setGithubResults] = useState([]);

  // Load ALL uploaded intelligence
  const { data: intelligence = [], isLoading: intelLoading } = useQuery({
    queryKey: ["master-pipeline-intelligence"],
    queryFn: async () => {
      try {
        const items = await base44.entities.AgentIntelligence.list("-created_date", 200);
        return items;
      } catch { return []; }
    },
  });

  // Load agent memory for additional context
  const { data: memories = [] } = useQuery({
    queryKey: ["master-pipeline-memory"],
    queryFn: async () => {
      try {
        return await base44.entities.AgentMemory.list("-created_date", 100);
      } catch { return []; }
    },
  });

  // Load existing opportunities
  const { data: opportunities = [] } = useQuery({
    queryKey: ["master-pipeline-opportunities"],
    queryFn: async () => {
      try {
        return await base44.entities.Opportunity.list("-created_date", 50);
      } catch { return []; }
    },
  });

  const allIntel = useMemo(() => [...intelligence, ...memories.map((m) => ({ ...m, category: m.category, title: m.title || m.content?.substring(0, 50), content: m.content }))], [intelligence, memories]);

  const completedSteps = useMemo(() => {
    const c = {};
    for (let i = 1; i <= 10; i++) c[i] = !!state[`step${i}`];
    return c;
  }, [state]);

  const handleAction = (stepNum, action) => {
    const newState = {};
    for (let i = 1; i < stepNum; i++) newState[`step${i}`] = state[`step${i}`];
    newState[`step${stepNum}`] = action;
    setState(newState);
    if (stepNum < 10) setTimeout(() => setCurrentStep(stepNum + 1), 400);
  };

  const reset = () => { setState({}); setCurrentStep(1); setGithubResults([]); };

  const searchGithub = async () => {
    if (!githubQuery.trim()) return;
    setGithubResults([{ name: "Searching...", loading: true }]);
    try {
      const res = await base44.functions.invoke("githubSync", { action: "search_repos", query: githubQuery });
      setGithubResults(res?.data?.results || res?.results || [{ name: "No results — check githubSync function", error: true }]);
    } catch (err) {
      setGithubResults([{ name: "Search failed — try the GitHub connector directly", error: true, detail: err.message }]);
    }
  };

  const allComplete = Object.values(completedSteps).every(Boolean);
  const completedCount = Object.values(completedSteps).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Master Intelligence Pipeline</h1>
            <p className="text-sm text-stone-500">Forensic audit + 10-step deterministic workflow with intelligent recommendations from your uploaded intelligence</p>
          </div>
        </div>
      </div>

      {/* Intelligence status bar */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-bold text-blue-900">Intelligence Base</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="px-2 py-1 rounded bg-white text-blue-700 font-bold">{intelligence.length} intelligence sources</span>
          <span className="px-2 py-1 rounded bg-white text-blue-700 font-bold">{memories.length} memories</span>
          <span className="px-2 py-1 rounded bg-white text-blue-700 font-bold">{opportunities.length} opportunities</span>
        </div>
        {intelLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
      </div>

      {/* Forensic Audit */}
      <ForensicAudit />

      {/* GitHub Search (always available) */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 mb-3">
          <Github className="w-4 h-4" /> GitHub Source Search
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={githubQuery}
            onChange={(e) => setGithubQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchGithub()}
            placeholder="Search GitHub repos (e.g. 'epoxy floor calculator', 'SEO location pages', 'lead scraper')"
            className="flex-1 h-10 px-3 rounded-lg border border-stone-200 text-sm outline-none focus:border-amber-400"
          />
          <button onClick={searchGithub} disabled={!githubQuery.trim()} className="px-4 h-10 rounded-lg bg-stone-900 text-white text-sm font-bold hover:bg-amber-500 hover:text-stone-950 disabled:opacity-50 transition">
            Search
          </button>
        </div>
        {githubResults.length > 0 && (
          <div className="mt-3 space-y-2">
            {githubResults.map((r, i) => (
              <div key={i} className={`p-3 rounded-lg border text-sm ${r.error ? "border-red-200 bg-red-50 text-red-600" : "border-stone-200 bg-stone-50"}`}>
                {r.loading ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Searching GitHub...</span> : (
                  <div>
                    <div className="font-bold text-stone-800">{r.name || r.full_name}</div>
                    {r.description && <div className="text-xs text-stone-500 mt-0.5">{r.description}</div>}
                    {r.html_url && <a href={r.html_url} target="_blank" rel="noopener" className="text-xs text-blue-500 hover:underline mt-1 inline-block">View repo →</a>}
                    {r.detail && <div className="text-xs text-red-400 mt-1">{r.detail}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-1 flex-wrap">
        {PIPELINE.map((step, i) => (
          <React.Fragment key={step.id}>
            <button
              onClick={() => {
                if (completedSteps[step.id] || step.id === 1 || completedSteps[step.id - 1]) setCurrentStep(step.id);
              }}
              disabled={!completedSteps[step.id] && step.id !== 1 && !completedSteps[step.id - 1]}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                currentStep === step.id ? "bg-amber-500 text-stone-950" : completedSteps[step.id] ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-stone-100 text-stone-400 cursor-not-allowed"
              }`}
            >
              {completedSteps[step.id] ? <Check className="w-3 h-3" /> : step.id}
              <span className="hidden lg:inline">{step.title}</span>
            </button>
            {i < PIPELINE.length - 1 && <div className={`h-0.5 w-3 ${completedSteps[step.id] ? "bg-green-300" : "bg-stone-200"}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* Pipeline steps */}
      <div className="space-y-4">
        {PIPELINE.map((step) => {
          const isActive = currentStep === step.id;
          const isComplete = completedSteps[step.id];
          const isLocked = step.id > 1 && !completedSteps[step.id - 1] && !isActive;
          return (
            <PipelineStep
              key={step.id}
              step={step}
              stepNum={step.id}
              intelligence={allIntel}
              state={state}
              onAction={handleAction}
              isActive={isActive}
              isComplete={isComplete}
              isLocked={isLocked}
            />
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
          disabled={currentStep === 1}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100 disabled:opacity-40 transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-stone-500">{completedCount}/10 complete</span>
          <button onClick={reset} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-stone-500 hover:bg-stone-100 transition">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>
      </div>

      {/* Final summary */}
      {allComplete && (
        <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Rocket className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-amber-900">Pipeline Complete — Full Configuration</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PIPELINE.map((step) => (
              <div key={step.id} className="flex items-start gap-2">
                <span className="text-xs font-black text-amber-600 mt-0.5">{step.id}.</span>
                <div>
                  <div className="text-xs text-stone-500">{step.title}</div>
                  <div className="text-sm font-bold text-stone-800">{state[`step${step.id}`]?.label}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-amber-200 flex items-center gap-2 text-sm font-bold text-green-700">
            <Check className="w-5 h-5" /> All 10 steps configured. Launch via the tool links in each step above.
          </div>
        </div>
      )}
    </div>
  );
}