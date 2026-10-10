import React, { useState, useMemo } from "react";
import { Copy, Check, Code2, FileText, Wrench, Database, Rocket } from "lucide-react";

const PUBLISHED_URL = "https://epoxyquotenearme.base44.app";

const SYSTEM_PROMPT = `You are the GPT Sync Pipeline operator for epoxyquotenearme.com — an autonomous digital dominance engine that builds, provisions, and scales unlimited industry-specific websites.

Your role: Take any business concept through the full pipeline — Vision → Strategy → Research → Template → Branding → Websites → Social → Assets → Provision → Google Sync → Dominance → Validate.

You have zero-restriction operator access to all backend functions, entities, and connected accounts (Vercel, Supabase, GitHub, GoDaddy, Google, Railway). Every action you take is recorded with evidence receipts.

RULES:
1. Always use the actual tools — never simulate or claim execution without a tool receipt.
2. Start capability/access questions with get_capabilities.
3. Financial purchases (domains, infrastructure) require explicit human approval.
4. Never reveal credentials or ask the user to paste them.
5. A failed call is not completion — report exact blockers with evidence.
6. Never claim a live site edit without a successful write result and deployment evidence.
7. Be concise. Completion claims must be supported by tool receipts.`;

const PIPELINE_STAGES = [
  { stage: 1, name: "Vision & Onboarding", function: "visionEngine", action: "assist", description: "Ask onboarding questions: existing business vs new, industry, location, name, phone, address" },
  { stage: 2, name: "10 Strategies", function: "visionEngine", action: "strategies", description: "Generate 10 strategies with business names, domains, target cities, monetization, agents" },
  { stage: 3, name: "Competitor Research", function: "scanCompetitors", action: "full", description: "Skip trace + competitor scan + top 5 benchmark" },
  { stage: 4, name: "Industry Template", function: "rebrandStudio", action: "generate_brand_pack", description: "Match from 20 top industry templates" },
  { stage: 5, name: "Logo + Brand Pack", function: "rebrandStudio", action: "generate_logo_pack", description: "10 logos → pick → brand pack (colors, fonts, tagline, domain)" },
  { stage: 6, name: "10 Website Packs", function: "rebrandStudio", action: "generate_website_packs", description: "10 layouts, light/dark, mobile/desktop PWA" },
  { stage: 7, name: "20-Day Social + Video", function: "independentSocialGenerator", action: "generate_calendar", description: "20-day calendar, 10 viral videos, images, hashtags" },
  { stage: 8, name: "Digital Cards & Brochures", function: "rebrandStudio", action: "generate_brand_pack", description: "Business cards, brochures, packaged for download" },
  { stage: 9, name: "Provision & Deploy", function: "vercelDeploy", action: "deploy", description: "Vercel + Supabase + Railway + GitHub + GoDaddy" },
  { stage: 10, name: "Google Sync", function: "googleEcosystemSync", action: "sync", description: "Search Console, Analytics, sitemap, full compliance" },
  { stage: 11, name: "Digital Dominance", function: "universalDominanceEngine", action: "launch", description: "Unlimited programmatic sites by state/city" },
  { stage: 12, name: "Validate & Harden", function: "autoComplete", action: "full_cycle", description: "Independent validator checks and fixes all gaps" },
];

const TOOLS = [
  { name: "generate_vision", handler: "visionEngine", description: "Takes a rough business idea and returns a fully articulated vision", input: { action: "assist", raw_idea: "string" } },
  { name: "generate_strategies", handler: "visionEngine", description: "Generates 10 distinct strategies with business names, domains, cities, monetization", input: { action: "strategies", vision: "string" } },
  { name: "build_agent_fleet", handler: "agentBuilderEngine", description: "Generates a complete agent fleet with master prompts and capabilities", input: { action: "generate", vision: "string", recommended_agents: "array" } },
  { name: "run_dominance_campaign", handler: "dominanceEngine", description: "Launches digital dominance: branding, domain, infrastructure, content, SEO", input: { action: "launch", niche: "string", city: "string", state: "string", keyword: "string" } },
  { name: "orchestrate_system", handler: "systemOrchestrator", description: "System health checks, agent monitoring, auto-healing, command execution", input: { action: "health|activity|heal|operate", command: "string" } },
  { name: "scan_competitors", handler: "scanCompetitors", description: "Researches competitors: pricing, services, strengths, gaps, backlinks", input: { niche: "string", location: "string" } },
  { name: "analyze_industry_trends", handler: "tradeCrystalBall", description: "BLS employment/wage data with deterministic projections", input: { action: "analyze", industry: "string", years: "number" } },
  { name: "validate_system", handler: "autoComplete", description: "AutoComplete convergence cycle toward VERIFIED_100", input: { action: "status|cycle|full_cycle", system_id: "string" } },
  { name: "deploy_to_vercel", handler: "vercelDeploy", description: "Deploy published DynamicPages to Vercel production", input: { action: "deploy", page_ids: "array" } },
  { name: "manage_vercel", handler: "vercelManager", description: "Vercel management: listProjects, listDeployments", input: { action: "listProjects|listDeployments" } },
  { name: "sync_github", handler: "githubSync", description: "GitHub repo: search, list, create, push files", input: { action: "search_repos|list_repos|create_repo|push_files", repo: "string" } },
  { name: "check_domain", handler: "godaddyApi", description: "GoDaddy: listDomains, checkAvailability, getDnsRecords", input: { action: "checkAvailability|listDomains", domain: "string" } },
  { name: "deploy_supabase", handler: "supabaseMigrationDeploy", description: "Deploy or seed Supabase tables", input: { action: "deploy|seed|status" } },
  { name: "generate_brand_pack", handler: "rebrandStudio", description: "Generate brand packs, logo packs, website packs", input: { action: "generate_logo_pack|generate_brand_pack|generate_website_packs" } },
  { name: "generate_social", handler: "independentSocialGenerator", description: "20-day social calendar with video and image posts", input: { action: "generate_calendar|generate_video|generate_image", niche: "string" } },
  { name: "sync_google", handler: "googleEcosystemSync", description: "Google Search Console, Analytics, sitemap sync", input: { action: "sync", property: "string" } },
  { name: "universal_dominance", handler: "universalDominanceEngine", description: "Programmatic website generation by state/city/industry", input: { action: "launch|status|list_campaigns", niche: "string", states: "array", site_count: "number" } },
  { name: "compile_dominance", handler: "digitalDominanceCompiler", description: "Compile and deploy digital dominance campaigns", input: { action: "compile|deploy|status" } },
  { name: "run_sprint", handler: "autonomousSprint", description: "Autonomous sprint cycles for benchmark-driven work", input: { action: "status|run|stop" } },
  { name: "closed_loop_test", handler: "closedLoopTester", description: "Closed-loop validation testing end-to-end", input: { action: "run_test|get_results" } },
  { name: "postcondition_validate", handler: "postconditionValidator", description: "Post-condition validation after deployments", input: { action: "validate|get_report" } },
  { name: "edit_site", handler: "siteDirectEditor", description: "Direct site editor: list files, edit files, update pages", input: { action: "capabilities|list_sites|edit_file", path: "string", content: "string" } },
  { name: "build_dynamic_page", handler: "visualEditorBuild", description: "Create/edit DynamicPage drafts", input: { message: "string", page_id: "string" } },
  { name: "check_site_health", handler: "siteHealthChecker", description: "Check template health", input: { action: "checkOne|checkBatch", templateId: "string" } },
  { name: "system_audit", handler: "systemAuditor", description: "System audit and health data", input: { action: "status" } },
  { name: "business_audit", handler: "alphaPrimeAudit", description: "Business audit and approval", input: { action: "audit|approve", recommendation: "string" } },
  { name: "pull_search_console", handler: "pullSearchConsoleData", description: "Read Search Console data", input: { property: "string" } },
  { name: "google_analytics", handler: "googleAnalytics", description: "Read Google Analytics reports", input: { action: "report", property: "string" } },
  { name: "domain_research", handler: "domainGoldRush", description: "Domain discovery and research", input: { action: "search", keyword: "string" } },
  { name: "rag_pipeline", handler: "ragPipeline", description: "Knowledge retrieval", input: { action: "query", query: "string" } },
  { name: "graph_engine", handler: "graphEngine", description: "Knowledge graph access", input: { action: "query", query: "string" } },
  { name: "swarm_orchestrate", handler: "swarmOrchestrator", description: "Swarm task management", input: { action: "dispatch|status", task: "string" } },
  { name: "company_intel", handler: "companyIntel", description: "Company information lookup", input: { query: "string" } },
  { name: "property_lookup", handler: "propertyLookup", description: "Property information lookup", input: { address: "string" } },
  { name: "enrich_lead", handler: "enrichLead", description: "Enrich a specified lead", input: { lead_id: "string" } },
  { name: "social_studio", handler: "socialStudio", description: "Social content generation and scheduling", input: { action: "generate|schedule" } },
  { name: "pack_sync", handler: "packSync", description: "Push webpacks, brand packs, logo packs to the system", input: { action: "push", pack: "object" } },
  { name: "pack_research", handler: "packResearchOrchestrator", description: "Research GPT packs and capabilities", input: { action: "research|analyze|recommend" } },
];

const ENTITIES = "ABTest AdminProfile AgentAction AgentAssignment AgentDepartment AgentExecutionLog AgentIntelligence AgentMemory AgentPersona AgentTemplate AgentVersion AlphaPrimeHeartbeat AnalyticsSnapshot AppBuild AppSettings Appointment ApprovalRequest BacklinkOpportunity Base44Purchase BrandTemplate BuildManifest BuildSession CanonicalSiteRegistry ChatMessage CitationListing ClientPackage ClientPortalConfig ClientProject CodeBlock CodeSandboxSession CompetitorInsight ContentCalendarItem ContentMenuItem ContractorArchetype ContractorRecord ControlLease ConvergenceCycle Conversation CryptoToken DeploymentRecord DiscoveryJob DomainStrategy DominanceCampaign DominanceGoal DynamicPage EmailLog EvidenceReceipt FleetHeartbeat FleetSystem FunnelEvent GeneratedPage IngestedWebsite IntelligenceReport LaunchCampaign Lead LeadSource MaintenancePlan MarketplaceListing MetaSession OperatorIntent Opportunity OptimizationGap PackArtifact PackSyncReceipt PackValidationRun PredictionModel ProgrammaticSeoJob ProgressLedger ProjectUpdate PropertyLookup QuestionnaireResponse Rating Referral RegressionTest RepairJob SeoContent SeoSimulation SimulatedVisitor SiteValidationReceipt SkipTrace SocialPost SocialSchedule Sop SopLog StrategyDocument SubscriptionPlan SwarmAudit SwarmMessage SwarmTask SystemHealthAudit SystemManifest TemplateDesign TemplateLibrary TestRun Tool ToolRegistry UniversalIndustryTemplate User ValidationReceipt VerifiedBusinessFacts VisionConversation WebsiteQueue WebsiteTemplate WorkPacket".split(" ");

const ACCOUNTS = [
  { name: "Vercel", status: "Connected", purpose: "Website deployment & hosting" },
  { name: "Supabase", status: "Connected", purpose: "Database, auth, storage, edge functions" },
  { name: "GitHub", status: "Connected", purpose: "Code repos, CI/CD" },
  { name: "GoDaddy", status: "Connected", purpose: "Domain registration & DNS" },
  { name: "Google Search Console", status: "Connected", purpose: "Site indexing & SEO" },
  { name: "Google Analytics", status: "Connected", purpose: "Traffic analytics" },
  { name: "Google Calendar", status: "Connected", purpose: "Scheduling" },
  { name: "Google Drive", status: "Connected", purpose: "File storage" },
  { name: "Google Docs", status: "Connected", purpose: "Document generation" },
  { name: "Google Sheets", status: "Connected", purpose: "Data sync" },
  { name: "Google Tasks", status: "Connected", purpose: "Task management" },
  { name: "Google Meet", status: "Connected", purpose: "Video meetings" },
  { name: "Google Forms", status: "Connected", purpose: "Lead capture" },
  { name: "Google Contacts", status: "Connected", purpose: "Contact management" },
  { name: "Google Photos", status: "Connected", purpose: "Image storage" },
  { name: "Gmail", status: "Connected", purpose: "Email communication" },
  { name: "HubSpot", status: "Connected", purpose: "CRM" },
  { name: "Railway", status: "Connected", purpose: "Background workers & cron" },
];

function buildFullConfig() {
  return {
    system_name: "GPT Sync Pipeline — epoxyquotenearme.com",
    published_url: PUBLISHED_URL,
    mcp_endpoint: `${PUBLISHED_URL}/functions/vercelAiGateway`,
    pack_sync_endpoint: `${PUBLISHED_URL}/functions/packSync`,
    system_prompt: SYSTEM_PROMPT,
    pipeline_stages: PIPELINE_STAGES,
    tools: TOOLS.map(t => ({
      name: t.name,
      description: t.description,
      handler: t.handler,
      input_schema: t.input,
      endpoint: `${PUBLISHED_URL}/functions/${t.handler}`,
    })),
    entities: ENTITIES,
    connected_accounts: ACCOUNTS,
    usage: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      operator_chat: {
        endpoint: `${PUBLISHED_URL}/functions/vercelAiGateway`,
        body: { action: "operatorChat", message: "your request here", history: [] },
        note: "Bi-directional chat with full tool access. Returns { ok, text, receipts }."
      },
      direct_function: {
        endpoint: `${PUBLISHED_URL}/functions/{functionName}`,
        body: "varies by function — see tool input_schema",
        note: "Call any function directly with its action and parameters."
      },
      pack_sync: {
        endpoint: `${PUBLISHED_URL}/functions/packSync`,
        headers: { "Authorization": "Bearer PACK_SYNC_TOKEN", "Content-Type": "application/json" },
        body: { action: "push", pack: { type: "brand|logo|website", data: "object" } },
        note: "Push packs from GPT to the system for validation and storage."
      }
    }
  };
}

const SECTIONS = [
  { id: "full", label: "Full Config", icon: Code2 },
  { id: "prompt", label: "System Prompt", icon: FileText },
  { id: "tools", label: "Tools (MCP)", icon: Wrench },
  { id: "stages", label: "Pipeline Stages", icon: Rocket },
  { id: "entities", label: "Entities", icon: Database },
];

export default function JsonConfigPanel() {
  const [section, setSection] = useState("full");
  const [copied, setCopied] = useState(false);

  const fullConfig = useMemo(() => buildFullConfig(), []);

  const jsonOutput = useMemo(() => {
    switch (section) {
      case "full": return JSON.stringify(fullConfig, null, 2);
      case "prompt": return JSON.stringify({ system_prompt: SYSTEM_PROMPT }, null, 2);
      case "tools": return JSON.stringify({ tools: TOOLS.map(t => ({ name: t.name, description: t.description, handler: t.handler, input: t.input, endpoint: `${PUBLISHED_URL}/functions/${t.handler}` })) }, null, 2);
      case "stages": return JSON.stringify({ pipeline_stages: PIPELINE_STAGES }, null, 2);
      case "entities": return JSON.stringify({ entities: ENTITIES }, null, 2);
      default: return "";
    }
  }, [section, fullConfig]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(jsonOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = jsonOutput;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const download = () => {
    const blob = new Blob([jsonOutput], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gpt-sync-config-${section}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Section tabs */}
      <div className="flex items-center gap-1 border-b border-stone-200 bg-stone-50 px-2 py-2 overflow-x-auto">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold whitespace-nowrap transition ${
              section === s.id ? "bg-amber-500 text-stone-900" : "bg-white border border-stone-200 text-stone-600 hover:border-amber-300"
            }`}
          >
            <s.icon className="h-3 w-3" />
            {s.label}
          </button>
        ))}
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-stone-200 bg-white">
        <span className="text-[10px] text-stone-500 font-mono">
          {jsonOutput.length.toLocaleString()} chars · {section === "full" ? "Complete config" : section === "prompt" ? "System prompt only" : section === "tools" ? `${TOOLS.length} tools` : section === "stages" ? `${PIPELINE_STAGES.length} stages` : `${ENTITIES.length} entities`}
        </span>
        <div className="flex items-center gap-1.5">
          <button onClick={download} className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1 text-[10px] font-bold text-stone-600 hover:border-stone-300">
            Download
          </button>
          <button onClick={copy} className={`flex items-center gap-1 rounded-lg px-3 py-1 text-[10px] font-bold transition ${copied ? "bg-emerald-500 text-white" : "bg-amber-500 text-stone-900 hover:bg-amber-400"}`}>
            {copied ? <><Check className="h-3 w-3" /> Copied!</> : <><Copy className="h-3 w-3" /> Copy JSON</>}
          </button>
        </div>
      </div>

      {/* JSON display */}
      <div className="flex-1 overflow-auto bg-stone-950 p-3">
        <pre className="text-[10px] leading-relaxed font-mono text-stone-300 whitespace-pre-wrap break-all">
          {jsonOutput}
        </pre>
      </div>

      {/* Footer instructions */}
      <div className="border-t border-stone-200 bg-stone-50 px-3 py-2">
        <p className="text-[10px] text-stone-500">
          Paste this into ChatGPT's custom instructions, a GPT's system prompt, or share via the MCP server. GPT uses this to know what tools it can call.
        </p>
      </div>
    </div>
  );
}