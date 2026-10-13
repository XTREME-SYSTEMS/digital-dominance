/**
 * AUTONOMOUS COMPANY PLAYBOOK v1.0
 * End-to-end playbook for operating a fully autonomous company with 100% agents.
 *
 * This is the complete checklist of everything needed: workflows, tools, skills, plugins,
 * MCP capabilities, settings, folder structures, agent files, and content.
 */

export const PLAYBOOK = {
  // === COMPLETE CHECKLIST ===
  checklist: {
    agents: {
      required: [
        'vision_architect', 'system_architect', 'code_engineer', 'test_engineer',
        'security_auditor', 'deployment_engineer', 'validation_guardian',
        'seo_dominance_agent', 'reputation_manager', 'system_monitor',
        'self_reflection_engine', 'benchmark_scout', 'vision_cortex',
        'passive_learner', 'meta_agent', 'swarm_orchestrator',
      ],
      files: 'base44/agents/*.jsonc (one file per agent)',
      minimum: 'One agent per workflow stage (12 stages = 12 agents minimum)',
    },

    entities: {
      core: ['User', 'AgentPersona', 'AgentMemory', 'AgentExecutionLog', 'AgentAction', 'ConversationMessage'],
      workflow: ['BuildSession', 'WorkPacket', 'CommandRun', 'DeploymentRecord', 'ValidationReceipt', 'RepairJob', 'FailurePattern'],
      intelligence: ['BenchmarkCompany', 'IndustryBenchmark', 'IntelligenceReport', 'CompetitorInsight', 'Opportunity'],
      content: ['TemplateLibrary', 'GeneratedPage', 'DynamicPage', 'SeoContent', 'ContentCalendarItem'],
      operations: ['SiteValidationReceipt', 'SystemHealthAudit', 'FleetHeartbeat', 'ProgressLedger', 'ControlLease'],
      learning: ['StrategicReflectionRecord', 'SelfReflectionCycle', 'Sop', 'SopLog', 'BenchmarkResult'],
      governance: ['ApprovalRequest', 'AuditSystemIntegrityScore', 'AlphaPrimeAuditLedger'],
    },

    functions: {
      core: ['autonomousCodingEngine', 'autonomousRefactorEngine', 'closedLoopTester', 'postconditionValidator', 'recursiveHealingEngine', 'regressionTestSuite', 'systemAuditor', 'selfReflectionEngine'],
      deployment: ['vercelDeploy', 'vercelManager', 'supabaseMigrationDeploy', 'githubSync'],
      intelligence: ['opportunityIntelligenceEngine', 'topSitesBenchmarkScanner', 'scanCompetitors', 'companyIntel', 'intelligenceSync'],
      content: ['stockTemplateFactory', 'generateSeoPage', 'generateSitemap', 'generateRss', 'seoGenerator', 'optimizeSeo'],
      operations: ['siteHealthChecker', 'siteLaunchValidator', 'railwayCronDispatcher', 'systemOrchestrator', 'fleetAlphaPrime'],
      learning: ['manusBenchmarkEngine', 'ideaProvingMachine', 'convergenceEngine', 'alphaPrimeBenchmarkGenerator'],
      governance: ['alphaPrimeAudit', 'alphaPrimeRepairFactory', 'canonicalizeRepairBacklog', 'runtimeAcceptanceMission'],
    },

    workflows: {
      required: [
        'Autonomous Sprint Supervisor', 'Autonomous Coding Pipeline', 'Autonomous Refactor Cycle',
        'Autonomous SEO Dominance', 'Autonomous Dominance 24-7 Cycle', 'Recursive Production Readiness Engine',
        'Fleet Alpha Prime Heartbeat', 'Alpha Prime Heartbeat', 'Daily Lead Engine',
        'Weekly Opportunity Scanner', 'Competitor Scanner', 'Social Media Autopilot',
        'Sitemap Auto-Update', 'SEO Update Notifier', 'Swarm Autopilot',
        'Lead Follow-Up', 'Immediate Lead Follow-Up', 'Review Request',
        'Autonomous Skip Trace', 'Autonomous AutoComplete', 'Questionnaire Enforcement',
        'X1 Autonomous Company Cycle', 'XTREME Digital Dominance Compiler',
      ],
      files: 'base44/workflows/*.jsonc (one file per workflow)',
    },

    connectors: {
      required: ['googlecalendar', 'googledrive', 'googlesheets', 'googledocs', 'gmail', 'googletasks', 'google_search_console', 'google_analytics', 'supabase', 'github', 'hubspot'],
      purpose: 'Bi-directional persistent connection between Base44 and external services for fastest swarm/parallel capabilities',
    },

    secrets: {
      required: ['VERCEL_AI_GATEWAY_API_KEY', 'GITHUB_TOKEN', 'GITHUB_APP_ID', 'RAILWAY_TOKEN', 'RAILWAY_PROJECT_ID', 'SUPABASE_URL', 'VERCEL_API_TOKEN', 'VERCEL_TEAM', 'VERCEL_PROJECT_NAME', 'GOOGLE_CREDENTIALS_JSON', 'BROWSERBASE_API_KEY', 'CLOUD_BROWSER_ENGINE_URL', 'ENGINE_API_KEY', 'TELNYX_API_KEY', 'GODADDY_API_KEY', 'GOOGLE_AI_API_KEY', 'OPENROUTER_API_KEY', 'GROQ_API_KEY', 'BLS_API_KEY', 'RENTCAST_API_KEY', 'SEOGENERATOR_API_KEY'],
      purpose: 'Every external service the autonomous company uses needs a secret for authentication',
    },

    skills: {
      required: ['web-design-reviewer', 'playwright', 'webapp-testing', 'refactor', 'data-exploration', 'statistical-analysis', 'data-visualization', 'interactive-dashboard-builder', 'content-creation', 'compelling-copy', 'marketing-psychology', 'competitive-intelligence', 'call-prep', 'draft-outreach', 'knowledge-synthesis', 'search-strategy', 'screenshot', 'imagegen', 'mcp-integration', 'agent-development', 'skill-creator', 'accessibility', 'ui-ux-design-guide'],
      purpose: 'Workspace skills that extend agent capabilities for specific tasks',
    },

    mcp: {
      required: 'base44/mcp/config.json — MCP server exposing entities and functions to external AI clients',
      purpose: 'Allows ChatGPT, Claude, and other AI clients to operate the company through MCP',
    },

    settings: {
      required: ['RLS on every entity', 'Auth on every protected route', 'Secrets for every external service', 'Environment variables for staging/production', 'Custom domain for production', 'API keys for external access'],
    },

    folderStructure: {
      'src/pages/': 'React page components (one per route)',
      'src/components/': 'Reusable UI components (50 lines or less)',
      'src/lib/': 'Shared utilities and hooks',
      'src/data/': 'Static data and configurations',
      'base44/entities/': 'Entity schemas (JSON)',
      'base44/agents/': 'Agent configurations (JSON)',
      'base44/functions/': 'Backend functions (TypeScript)',
      'base44/workflows/': 'Workflow definitions (JSON)',
      'base44/shared/': 'Shared modules imported by functions',
      'base44/emails/': 'Email templates (MJML)',
      'base44/connectors/': 'Connector configurations (JSON)',
      'base44/mcp/': 'MCP server configuration',
    },
  },

  // === END-TO-END PLAYBOOK (for ChatGPT or any AI to operate the company) ===
  playbook: {
    step1_bootstrap: {
      name: 'Bootstrap Base44 Account',
      actions: [
        'Create a Base44 account and workspace',
        'Connect GitHub, Google Workspace, Supabase, Vercel, Railway connectors',
        'Set all required secrets (see checklist.secrets)',
        'Register GitHub App for autonomous PR creation',
        'Deploy Railway cloud browser engine with 8 workers',
        'Configure Supabase staging and production environments',
        'Configure Vercel preview and production environments',
        'Set up custom domain for production',
      ],
    },
    step2_agents: {
      name: 'Deploy Agent Roster',
      actions: [
        'Create 16 agent files in base44/agents/ (one per agent)',
        'Configure each agent with: system_prompt, model_preference, tools, tier',
        'Set up agent memory (AgentMemory entity) with categorized storage',
        'Configure agent communication (ConversationMessage entity)',
        'Set up agent execution logging (AgentExecutionLog entity)',
        'Create swarm orchestrator for parallel agent execution',
      ],
    },
    step3_workflows: {
      name: 'Deploy Workflow Automations',
      actions: [
        'Create 22 workflow files in base44/workflows/',
        'Configure triggers: scheduled, entity, connector, webhook',
        'Configure activities: invoke_backend_function, send_email, compute_seconds_until',
        'Set up bi-directional sync between Base44 and external services',
        'Configure GPT sync pipeline for command execution',
      ],
    },
    step4_quality: {
      name: 'Deploy Quality Gates',
      actions: [
        'Configure 3-step pass: static analysis, test suite, postcondition validation',
        'Deploy postconditionValidator function',
        'Deploy closedLoopTester function',
        'Deploy recursiveHealingEngine for auto-healing',
        'Deploy regressionTestSuite for regression detection',
        'Configure automatic rollback on postcondition failure',
      ],
    },
    step5_intelligence: {
      name: 'Deploy Intelligence Systems',
      actions: [
        'Deploy benchmark_scout agent for continuous research',
        'Deploy vision_cortex agent for 100-steps-ahead scanning',
        'Deploy passive_learner for AI resource ingestion',
        'Create BenchmarkCompany records for all researched companies',
        'Set up weekly self-reflection cycle',
        'Configure opportunity intelligence engine',
      ],
    },
    step6_operations: {
      name: 'Deploy 24/7 Operations',
      actions: [
        'Deploy system_monitor with 5-minute heartbeat',
        'Deploy fleet heartbeat for multi-system monitoring',
        'Configure Railway cron dispatcher for scheduled tasks',
        'Set up alerting: ApprovalRequest for human escalation',
        'Configure auto-healing: recursiveHealingEngine on health check failure',
        'Set up concurrency locks: ControlLease for concurrent access prevention',
      ],
    },
    step7_governance: {
      name: 'Deploy Governance',
      actions: [
        'Deploy alphaPrimeAudit for system integrity scoring',
        'Deploy selfReflectionEngine for weekly assumption challenging',
        'Configure failure pattern learning (FailurePattern entity)',
        'Set up anti-drift checks (monthly comparison against original spec)',
        'Deploy convergence engine for multi-agent agreement',
        'Configure data provenance audit (every claim needs source URL)',
      ],
    },
    step8_scale: {
      name: 'Scale to Infinite',
      actions: [
        'Deploy massLaunchOrchestrator for bulk site launching',
        'Configure Railway workers for horizontal scaling (auto-scale on queue depth > 10)',
        'Deploy swarm orchestrator for parallel agent execution',
        'Set up programmatic SEO for location-based scaling',
        'Configure Google Workspace sync for bi-directional persistent connection',
        'Deploy HeyGen avatar for onboarding (female presenter, solo-style voice)',
      ],
    },
  },

  // === BI-DIRECTIONAL CONNECTION PLAYBOOKS ===
  connectionPlaybooks: {
    base44_github: {
      purpose: 'Autonomous PR creation, code review, and 2-way sync',
      steps: [
        'Install GitHub App on the organization',
        'Set GITHUB_TOKEN, GITHUB_APP_ID, GITHUB_ORG, GITHUB_REPO secrets',
        'code_engineer creates a branch, writes code, opens PR',
        'test_engineer runs CI, validation_guardian validates postconditions',
        'On approval, deployment_engineer merges and deploys',
        'githubSync function keeps Base44 and GitHub in sync',
      ],
    },
    base44_supabase: {
      purpose: 'Database, auth, storage, and edge functions',
      steps: [
        'Set SUPABASE_URL and SMAI_SUPABASE_* secrets for staging and production',
        'Connect Supabase connector (already authorized)',
        'supabaseMigrationDeploy function runs SQL migrations',
        'supabaseUpload function handles file storage',
        'supabaseConcurrencyTest verifies concurrent access safety',
      ],
    },
    base44_vercel: {
      purpose: 'Frontend hosting, preview deployments, AI Gateway',
      steps: [
        'Set VERCEL_API_TOKEN, VERCEL_TEAM, VERCEL_PROJECT_NAME secrets',
        'vercelDeploy function creates preview and production deployments',
        'vercelManager function manages domains and environment variables',
        'vercelAiGateway function routes to best models for best purposes',
        'Preview deployments auto-created on every PR',
      ],
    },
    base44_railway: {
      purpose: 'Worker deployment, cron dispatch, cloud browser sandbox',
      steps: [
        'Set RAILWAY_TOKEN, RAILWAY_PROJECT_ID secrets',
        'Deploy cloud browser engine to Railway with 8 workers',
        'railwayCronDispatcher function dispatches scheduled tasks',
        'railwayScraper function runs web scraping tasks',
        'Workers auto-scale on queue depth',
      ],
    },
    base44_google: {
      purpose: 'Calendar, Drive, Sheets, Docs, Gmail, Tasks — bi-directional sync',
      steps: [
        'Set GOOGLE_CREDENTIALS_JSON, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET secrets',
        'Connect googlecalendar, googledrive, googlesheets, googledocs, gmail, googletasks connectors',
        'googleWorkspaceSync function syncs calendar events and tasks',
        'googleEcosystemSync function syncs analytics and search console',
        'syncLeadToSheet function pushes leads to Google Sheets',
        'Bi-directional: Google Calendar events create Base44 tasks, and vice versa',
      ],
    },
  },

  // === MASTER INVOCATION PROMPTS ===
  masterInvocations: {
    full_autonomous: `Execute autonomously: [TASK]. Route to the correct agent pipeline. Execute all gates. Deploy to staging. Report results. Request human approval for production.`,
    supervised: `Execute under supervision: [TASK]. Route to the correct agent pipeline. Execute all gates. Open a PR for human review. Do not deploy.`,
    research: `Research: [TOPIC]. Find the top 3 companies/systems. Record capabilities, weaknesses, and reverse-engineering actions. Create BenchmarkCompany records with source URLs.`,
    audit: `Audit: [SYSTEM]. Run the system auditor. Check all validators. Identify false-greens. Create StrategicReflectionRecord with findings.`,
    heal: `Heal: [ISSUE]. Run recursiveHealingEngine. If healing fails 3 times, create ApprovalRequest for human intervention.`,
    evolve: `Evolve: [AREA]. Run benchmark_scout to research the state of the art. Identify gaps. Create enhancement jobs. Execute the enhancements.`,
  },
};