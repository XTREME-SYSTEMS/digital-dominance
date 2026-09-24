import React, { useState } from "react";
import { ChevronDown, ChevronRight, Database, Cpu, Workflow, Bot, Plug, Layers } from "lucide-react";

// ═══════════════════════════════════════════════════════
// FORENSIC AUDIT DATA — cataloged from AdminLayout, entities, functions, workflows, agents, connectors
// ═══════════════════════════════════════════════════════

const AUDIT = {
  adminPages: [
    { group: "Core Command", items: [
      { path: "/admin", label: "Opportunity Intelligence", cap: "Real-time opportunity scanning" },
      { path: "/admin/google-workspace-os", label: "Google Workspace OS", cap: "Drive/Calendar/Tasks orchestration" },
      { path: "/admin/internal-architecture", label: "Internal Architecture", cap: "System blueprint viewer" },
      { path: "/admin/google-command-center", label: "Google Command Center", cap: "Connector health dashboard" },
      { path: "/admin/command-center", label: "Command Center", cap: "System health + auto-heal" },
      { path: "/admin/vision-studio", label: "Vision Studio", cap: "Vision → Strategy → Agents → Launch" },
    ]},
    { group: "The Loop — Vision → Agents → Convergence", items: [
      { path: "/admin/agent-builder", label: "Agent Builder", cap: "4-stage agent fleet generation" },
      { path: "/admin/agent-master", label: "Agent Master", cap: "Persona/memory/actions/config per agent" },
      { path: "/admin/swarm", label: "Swarm Command", cap: "Multi-agent swarm orchestration" },
      { path: "/admin/operator", label: "AI Operator", cap: "Autonomous system operator" },
      { path: "/admin/convergence", label: "Convergence Engine", cap: "Score → fix → verify → 100%" },
      { path: "/admin/system-health", label: "System Health", cap: "Live health monitoring" },
    ]},
    { group: "Dominance — The Output", items: [
      { path: "/admin/digital-dominance", label: "Digital Dominance", cap: "Data/intel/bidding/campaign/outreach" },
      { path: "/admin/autonomous-dominance", label: "Autonomous Dominance", cap: "24/7 self-reflection + ingestion" },
      { path: "/admin/autonomous-refactor", label: "Autonomous Refactor", cap: "Scan → plan → execute → validate" },
      { path: "/admin/dominance-sandbox", label: "Dominance Sandbox", cap: "Branding/funnel/content/social/launch" },
    ]},
    { group: "Generator — The System", items: [
      { path: "/admin/builder-library", label: "Builder Library", cap: "Reusable builder patterns" },
      { path: "/admin/meta-agent", label: "Meta Agent", cap: "Goal → readiness → work packets" },
      { path: "/admin/x1-company", label: "X1 Company", cap: "Autonomous company cycle" },
      { path: "/admin/vision-cortex-v2", label: "Vision Cortex V2", cap: "21-stage vision-to-monetization" },
    ]},
    { group: "Advanced — System Internals", items: [
      { path: "/admin/alpha-prime", label: "Alpha Prime", cap: "Source truth + optimization cycle" },
      { path: "/admin/fleet", label: "Fleet Dashboard", cap: "Fleet Alpha Prime heartbeat" },
      { path: "/admin/vision-cortex", label: "Vision Cortex", cap: "Vision → ship pipeline" },
      { path: "/admin/meta-architecture", label: "Meta Architecture", cap: "System architecture generator" },
      { path: "/admin/shadow", label: "Shadow", cap: "Cloud browser + codex" },
      { path: "/admin/system-map", label: "System Map", cap: "Visual system topology" },
      { path: "/admin/platform", label: "Platform", cap: "Platform config viewer" },
      { path: "/admin/architecture", label: "Architecture", cap: "Deep architecture viewer" },
      { path: "/admin/workflows", label: "Workflows", cap: "Autonomous workflow manager" },
      { path: "/admin/playbooks", label: "Playbooks", cap: "Playbook library" },
      { path: "/admin/contractor-simulation", label: "Simulation", cap: "Contractor archetype simulation" },
      { path: "/admin/seo-simulator", label: "SEO Simulator", cap: "URL → score → amplify" },
      { path: "/admin/intelligence", label: "Intelligence", cap: "Market research gathering" },
      { path: "/admin/vision-strategy", label: "Strategy", cap: "Strategy generator" },
      { path: "/admin/rag", label: "RAG Engine", cap: "Retrieval-augmented generation" },
      { path: "/admin/graph", label: "Knowledge Graph", cap: "Graph engine viewer" },
      { path: "/admin/website-factory", label: "Website Factory", cap: "Mass website generation" },
      { path: "/admin/app-factory", label: "App Factory", cap: "App generation pipeline" },
      { path: "/admin/templates", label: "Templates", cap: "Template manager" },
      { path: "/admin/empire", label: "Website Empire", cap: "Multi-site empire manager" },
      { path: "/admin/queue", label: "Site Queue", cap: "Website processing queue" },
      { path: "/admin/code-studio", label: "Code Studio", cap: "Code injection + page builder" },
      { path: "/admin/rebrand-studio", label: "Rebrand Studio", cap: "Rebrand + city generator" },
      { path: "/admin/site-builder", label: "Site Builder", cap: "Universal site builder" },
      { path: "/admin/google", label: "Google SEO", cap: "GSC verification + setup" },
      { path: "/admin/seo-dominance", label: "SEO Dominance", cap: "Autonomous SEO dominance" },
      { path: "/admin/seo-generator", label: "SEO Generator", cap: "SEO page generation" },
      { path: "/admin/url-strategy", label: "URL Strategy", cap: "Domain strategy generator" },
      { path: "/admin/site-health", label: "Site Health", cap: "Site health monitor" },
      { path: "/admin/sop", label: "SOP & Memory", cap: "SOP system + memory logs" },
      { path: "/admin/national-launch", label: "National Launch", cap: "National campaign launcher" },
      { path: "/admin/leads", label: "Leads", cap: "Lead management CRM" },
      { path: "/admin/pipeline", label: "Pipeline", cap: "Sales pipeline kanban" },
      { path: "/admin/emails", label: "Emails", cap: "Email campaign manager" },
      { path: "/admin/reviews", label: "Reviews", cap: "Review management" },
      { path: "/admin/lead-scraper", label: "Lead Scraper", cap: "Multi-source lead scraping" },
      { path: "/admin/skip-trace", label: "Skip Trace", cap: "People/property lookup" },
      { path: "/admin/location-performance", label: "Location Stats", cap: "Per-location analytics" },
      { path: "/admin/xtreme-comms", label: "Xtreme Comms", cap: "SMS/MMS/WhatsApp/voice/email" },
      { path: "/admin/telnyx", label: "Telnyx Manager", cap: "Phone number management" },
      { path: "/admin/voice-assistant", label: "AI Voice", cap: "AI voice assistant" },
      { path: "/admin/social-studio", label: "Social Studio", cap: "Social media generation" },
      { path: "/admin/results", label: "Analytics", cap: "Results dashboard" },
      { path: "/admin/analytics", label: "GA Traffic", cap: "Google Analytics traffic" },
      { path: "/admin/competitors", label: "Competitors", cap: "Competitor scanner" },
      { path: "/admin/vault", label: "Vault", cap: "System vault" },
      { path: "/admin/api-keys", label: "API Keys", cap: "API key manager" },
      { path: "/admin/client-packages", label: "Client Pkgs", cap: "Client package manager" },
      { path: "/admin/tools", label: "App Tools", cap: "Tool manager" },
      { path: "/admin/tool-hub", label: "Tool Hub", cap: "Tool hub" },
      { path: "/admin/blueprint", label: "Blueprint", cap: "System blueprint" },
      { path: "/admin/domain-rush", label: "Domain Rush", cap: "Domain rush workflow" },
      { path: "/admin/crystal-ball", label: "Crystal Ball", cap: "Prediction engine" },
      { path: "/admin/autocomplete", label: "AutoComplete", cap: "Autonomous completion" },
      { path: "/admin/pipeline-builder", label: "Pipeline Builder", cap: "Cascading pipeline builder" },
    ]},
  ],
  backendFunctions: [
    "agentBuilderEngine", "agentRouter", "agentRunner", "aiAssist", "alphaPrimeAudit",
    "alphaPrimeBenchmarkGenerator", "alphaPrimeHeartbeat", "alphaPrimeOptimizationCycle",
    "alphaPrimeRepairFactory", "apiKeyManager", "autoComplete", "autonomousCodingEngine",
    "autonomousRefactorEngine", "autonomousSeoDominance", "autonomousSprint", "bookEstimate",
    "builderLibrarySeeder", "calculateDistanceTo100", "canonicalizeRepairBacklog",
    "checkGoogleStatus", "checkQuestionnaireCompliance", "closedLoopTester", "companyIntel",
    "companyOrchestrator", "convergenceEngine", "conversationHub", "create-checkout",
    "cryptoCreator", "dailyLeadEngine", "digitalDominanceCompiler", "domainGoldRush",
    "dominanceEngine", "enrichLead", "fetchCoreWebVitals", "fillContentGaps", "fleetAlphaPrime",
    "generateRss", "generateSeoPage", "generateSitemap", "generateSop", "githubSync",
    "godaddyApi", "googleAnalytics", "googleEcosystemSync", "googleVerifierConnectUrl",
    "googleVerifierExchange", "googleWorkspaceOS", "googleWorkspaceSync", "graphEngine",
    "intelligenceSync", "intentRouter", "llmRouter", "massIngestionEngine", "memoryRouter",
    "metaAgent", "metaArchitecture", "notifySeoUpdates", "opportunityIntelligenceEngine",
    "optimizeSeo", "payments-webhook", "phase9Proof", "pingIndexNow", "postconditionValidator",
    "predictionEngine", "propertyLookup", "pullSearchConsoleData", "pushLeadToHubspot",
    "ragPipeline", "railwayScraper", "rebrandGenerator", "rebrandStudio", "recursiveHealingEngine",
    "regressionTestSuite", "runContractorSimulation", "runtimeAcceptanceMission", "scanCompetitors",
    "selfReflectionEngine", "sendEstimateEmail", "sendFollowUpEmail", "sendReviewRequest",
    "seoAeoSimulator", "seoGenerator", "seoSimSync", "shadowBrowse", "siteHealthChecker",
    "skipTrace", "socialStudio", "strategicMindsSetup", "submitToIndexers", "supabaseConcurrencyTest",
    "supabaseMigrationDeploy", "supabaseUpload", "swarmOrchestrator", "syncContentCalendar",
    "syncContractorWorkflow", "syncFleetSystemState", "syncLeadToSheet", "syncWorkflowToSwarm",
    "syntheticWorker", "systemAuditor", "systemOrchestrator", "telnyxAutonomousSetup",
    "telnyxManager", "topSitesBenchmarkScanner", "tradeCrystalBall", "vercelAiGateway",
    "vercelDeploy", "vercelManager", "verifySearchConsole", "visionCortexRouter", "visionEngine",
    "voiceAssistant", "xtremeComms", "xtremeUniversalGeneratorBridge",
  ],
  agents: [
    "shadow", "alpha_prime_orchestrator", "swarm_orchestrator", "system_operator",
    "seo_manager", "comms_manager", "social_manager", "lead_orchestrator",
    "site_factory_manager", "reputation_manager",
  ],
  connectors: [
    "Google Calendar", "Google Drive", "Google Docs", "Google Sheets", "Google Tasks",
    "Gmail", "Google Search Console", "Google Analytics", "Google BigQuery", "Google Slides",
    "Google Classroom", "Google Meet", "Google Photos", "Google Forms", "Google Contacts",
    "GitHub", "HubSpot", "Supabase", "Facebook Pages",
  ],
  workflows: [
    "Autonomous Coding Pipeline", "Weekly Opportunity Scanner", "Autonomous Refactor Cycle",
    "Autonomous Dominance 24-7 Cycle", "X1 Autonomous Company Cycle", "Fleet Alpha Prime Heartbeat",
    "Alpha Prime Completion Sprint", "Swarm Autopilot", "Autonomous Auto Complete",
    "Recursive Production Readiness Engine", "XTREME Digital Dominance Compiler",
    "Autonomous Sprint Supervisor", "Autonomous SEO Dominance", "Autonomous Skip Trace",
    "SEO Update Notifier", "Sitemap Auto-Update", "SEO Optimizer", "Competitor Scanner",
    "Daily Lead Engine", "Review Request", "Lead Follow-Up", "Immediate Lead Follow-Up",
    "Social Media Autopilot", "Questionnaire Enforcement",
  ],
};

export default function ForensicAudit() {
  const [open, setOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState(0);

  const counts = {
    pages: AUDIT.adminPages.reduce((s, g) => s + g.items.length, 0),
    functions: AUDIT.backendFunctions.length,
    agents: AUDIT.agents.length,
    connectors: AUDIT.connectors.length,
    workflows: AUDIT.workflows.length,
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 hover:bg-stone-50 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center">
            <Database className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-left">
            <h3 className="text-base font-bold text-stone-900">Forensic System Audit</h3>
            <p className="text-xs text-stone-500">Complete inventory of every system, capability, and technology</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 text-xs">
            <span className="px-2 py-1 rounded bg-stone-100 text-stone-600 font-bold">{counts.pages} pages</span>
            <span className="px-2 py-1 rounded bg-stone-100 text-stone-600 font-bold">{counts.functions} functions</span>
            <span className="px-2 py-1 rounded bg-stone-100 text-stone-600 font-bold">{counts.agents} agents</span>
            <span className="px-2 py-1 rounded bg-stone-100 text-stone-600 font-bold">{counts.connectors} connectors</span>
            <span className="px-2 py-1 rounded bg-stone-100 text-stone-600 font-bold">{counts.workflows} workflows</span>
          </div>
          {open ? <ChevronDown className="w-5 h-5 text-stone-400" /> : <ChevronRight className="w-5 h-5 text-stone-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-stone-100">
          {/* Tab bar */}
          <div className="flex gap-1 px-5 pt-3 border-b border-stone-100 overflow-x-auto">
            {AUDIT.adminPages.map((g, i) => (
              <button
                key={i}
                onClick={() => setActiveGroup(i)}
                className={`px-3 py-2 text-xs font-bold whitespace-nowrap border-b-2 transition ${
                  activeGroup === i ? "border-amber-500 text-amber-600" : "border-transparent text-stone-400 hover:text-stone-600"
                }`}
              >
                {g.group}
              </button>
            ))}
          </div>

          {/* Admin pages grid */}
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {AUDIT.adminPages[activeGroup].items.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className="flex items-start gap-2.5 p-3 rounded-lg border border-stone-200 hover:border-amber-300 hover:bg-amber-50/50 transition group"
              >
                <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-amber-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-stone-800 group-hover:text-amber-700">{item.label}</div>
                  <div className="text-xs text-stone-500">{item.cap}</div>
                </div>
              </a>
            ))}
          </div>

          {/* Backend functions */}
          <div className="px-5 py-4 border-t border-stone-100">
            <h4 className="text-xs font-bold tracking-wide text-stone-400 uppercase mb-2 flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5" /> Backend Functions ({counts.functions})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {AUDIT.backendFunctions.map((fn) => (
                <span key={fn} className="text-xs font-mono px-2 py-1 rounded bg-stone-100 text-stone-600">{fn}</span>
              ))}
            </div>
          </div>

          {/* Agents */}
          <div className="px-5 py-4 border-t border-stone-100">
            <h4 className="text-xs font-bold tracking-wide text-stone-400 uppercase mb-2 flex items-center gap-2">
              <Bot className="w-3.5 h-3.5" /> AI Agents ({counts.agents})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {AUDIT.agents.map((a) => (
                <span key={a} className="text-xs font-mono px-2 py-1 rounded bg-indigo-100 text-indigo-600">{a}</span>
              ))}
            </div>
          </div>

          {/* Connectors */}
          <div className="px-5 py-4 border-t border-stone-100">
            <h4 className="text-xs font-bold tracking-wide text-stone-400 uppercase mb-2 flex items-center gap-2">
              <Plug className="w-3.5 h-3.5" /> Connected Integrations ({counts.connectors})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {AUDIT.connectors.map((c) => (
                <span key={c} className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">{c}</span>
              ))}
            </div>
          </div>

          {/* Workflows */}
          <div className="px-5 py-4 border-t border-stone-100">
            <h4 className="text-xs font-bold tracking-wide text-stone-400 uppercase mb-2 flex items-center gap-2">
              <Workflow className="w-3.5 h-3.5" /> Autonomous Workflows ({counts.workflows})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {AUDIT.workflows.map((w) => (
                <span key={w} className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700">{w}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}