/**
 * AUTONOMOUS SOFTWARE COMPANY BLUEPRINT v1.0
 * Revised specification — maximum capability, factual, deterministic
 *
 * RESEARCH BASIS:
 * - Top 3 autonomous coding agents: Claude Code (89.1% Terminal-Bench 2.1), Devin/Cognition (SWE-2), GitHub Copilot (Enterprise)
 *   Source: https://www.morphllm.com/ai-coding-agent (Terminal-Bench 2.1 leaderboard, independently run)
 * - Top 3 data intelligence: Palantir (operational AI), Databricks (Lakehouse/ML), Snowflake (cloud data warehouse)
 *   Source: https://aitoolsrecap.com/Comparisons/palantir-vs-snowflake-vs-databricks-enterprise-ai-2026
 * - Top 3 AI consulting: Accenture (4.7/5), McKinsey/QuantumBlack (4.7/5), BCG X
 *   Source: https://iternal.ai/best-ai-consulting-firms
 * - Top 3 prediction: Recorded Future (threat intel, acquired by Mastercard $2.65B), FutureSearch (AI superforecasting), Metaculus (FutureEval benchmark)
 *   Source: https://clclt.com/business-2/the-companies-trying-to-predict-the-future/
 * - Top 3 simulation: NVIDIA Omniverse (physical AI/OpenUSD), AnyLogic (multi-method simulation), SimScale (cloud CFD/FEA + AI agent)
 *   Source: https://www.nvidia.com/en-us/omniverse/, https://www.simscale.com/blog/agentic-engineering-design-review-simulation-workflows/
 * - HeyGen: Avatar IV at $1.50/min on Creator ($29/mo, 600 credits), 177+ languages, API at $0.0167-$0.0667/sec
 *   Source: https://www.heygen.com/blog/ai-video-generator-pricing
 * - OpenHands (formerly OpenDevin): open-source autonomous coding agent, Docker-based, MCP support
 *   Source: https://github.com/OpenHands/openhands
 *
 * GAPS IDENTIFIED IN ORIGINAL REQUEST AND FILLED:
 * 1. No quality gate definition → Added mandatory 3-step pass: (a) static analysis + type check, (b) test suite green, (c) postcondition validator against production state
 * 2. No cost ceiling → Added per-task ACU/credit budget caps with circuit breaker
 * 3. No rollback strategy → Added automatic rollback on postcondition failure (pattern from Devin Review)
 * 4. No human-in-the-loop escalation → Added advisory/supervised/autonomous/full_autonomous tiers (pattern from Manus)
 * 5. No memory persistence → Added AgentMemory entity with categorized long-term storage (pattern from DeepWiki)
 * 6. No security hardening spec → Added OWASP Top 10 + supply-chain scanning in every build
 * 7. No observability → Added structured logging, metrics, and trace propagation across all functions
 * 8. No data provenance → Every benchmark claim must cite a source URL and capture date
 * 9. No anti-drift mechanism → Added weekly self-reflection cycle (StrategicReflectionRecord)
 * 10. No failure pattern learning → Added FailurePattern entity with automatic clustering
 */

export const COMPANY_BLUEPRINT = {
  version: '1.0.0',
  name: 'Autonomous Software Company',
  mission: 'Build, deploy, audit, heal, and evolve software systems with zero human intervention for routine work, with mandatory human approval for production releases.',

  // === HARDWARE / INFRASTRUCTURE ===
  infrastructure: {
    localHardware: {
      cpu: 'AMD Ryzen (2TB NVMe storage, 32GB RAM)',
      purpose: 'Local development, Docker build cache, agent sandboxing',
      dockerConfig: {
        maxContainers: 8,
        resourceLimits: { memory: '4GB per container', cpu: '2 cores per container' },
        network: 'isolated bridge per worker',
      },
    },
    cloudBrowser: {
      engine: 'Railway-deployed cloud browser engine',
      workers: 8,
      scaling: 'horizontal (auto-scale on queue depth > 10)',
      purpose: 'Autonomous web research, benchmark capture, visual cloning, SEO validation',
      secrets: ['CLOUD_BROWSER_ENGINE_URL', 'ENGINE_API_KEY', 'BROWSERBASE_API_KEY'],
    },
    railway: {
      purpose: 'Worker deployment, cron dispatch, sandbox environments',
      secrets: ['RAILWAY_TOKEN', 'RAILWAY_PROJECT_ID'],
      environments: ['staging', 'production'],
    },
    vercel: {
      purpose: 'Frontend hosting, preview deployments, AI Gateway',
      secrets: ['VERCEL_API_TOKEN', 'VERCEL_TEAM', 'VERCEL_PROJECT_NAME', 'VERCEL_AI_GATEWAY_API_KEY'],
      environments: ['preview', 'production'],
    },
    supabase: {
      purpose: 'Auth, database, storage, edge functions',
      secrets: ['SUPABASE_URL', 'SMAI_SUPABASE_URL', 'SMAI_SUPABASE_ANON_KEY', 'SMAI_SUPABASE_SERVICE_ROLE_KEY'],
      environments: ['staging', 'production'],
    },
    github: {
      purpose: 'Source control, CI/CD, GitHub App for autonomous PRs, Enterprise for audit logs',
      secrets: ['GITHUB_TOKEN', 'GITHUB_CLIENT_ID', 'GITHUB_APP_ID', 'GITHUB_ORG', 'GITHUB_REPO'],
      appMode: 'GitHub App (installed on org, autonomous PR creation)',
    },
    googleWorkspace: {
      purpose: 'Calendar, Drive, Sheets, Docs, Gmail — bi-directional sync for scheduling and reporting',
      secrets: ['GOOGLE_CREDENTIALS_JSON', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
      connectors: ['googlecalendar', 'googledrive', 'googlesheets', 'googledocs', 'gmail', 'googletasks'],
    },
  },

  // === AI MODELS (Vercel AI Gateway) ===
  models: {
    gateway: 'Vercel AI Gateway (VERCEL_AI_GATEWAY_API_KEY)',
    routing: {
      complex_reasoning: 'claude-sonnet-5 (code generation, architecture, multi-step planning)',
      fast_classification: 'gemini_3_flash (routing, classification, web search enabled)',
      long_context: 'gemini_3_1_pro (document analysis, web search enabled)',
      code_completion: 'gpt_5_mini (inline completions, quick fixes)',
      evaluation: 'jev (TypeSafe AI evaluation model for rubric scoring)',
      video_generation: 'Google Veo 3.x via GenerateVideo (6-8s, 5 credits/sec)',
      image_generation: 'GenerateImage (DALL-E class, 1 credit per image)',
      speech: 'GenerateSpeech (river/honey/sunny/storm/spark voices, 1 credit/50 chars)',
      avatar_video: 'HeyGen API (Avatar IV, $0.05/sec API, female presenter, solo-style voice)',
    },
    costControls: {
      perTaskCreditCap: 50,
      perTaskDollarCap: 2.00,
      circuitBreakerThreshold: '3 consecutive failures → pause + alert',
    },
  },

  // === QUALITY GATES (mandatory 3-step pass before public release) ===
  qualityGates: {
    description: 'No code reaches production without passing all 3 gates. Pattern sourced from Devin Review (second-agent critique) + GitHub Copilot (sandboxed CI) + closedLoopTester.',
    gates: [
      {
        step: 1,
        name: 'Static Analysis & Type Check',
        tool: 'npx tsc --noEmit + eslint + dependency audit',
        passCriteria: 'Zero TypeScript errors, zero ESLint errors, zero npm audit high/critical vulnerabilities',
        source: 'https://docs.github.com/en/actions/automating-builds-and-tests',
      },
      {
        step: 2,
        name: 'Test Suite Green',
        tool: 'npx vitest run + npx vite build',
        passCriteria: '100% of written tests pass, build succeeds, no runtime warnings',
        source: 'https://vitest.dev/',
      },
      {
        step: 3,
        name: 'Postcondition Validator',
        tool: 'postconditionValidator backend function — checks production state matches intent',
        passCriteria: 'All declared postconditions verified against live production endpoints. No false-green: validator must read real production state, not internal state.',
        source: 'Internal: base44/functions/postconditionValidator/entry.ts',
      },
    ],
    rollbackPolicy: 'On any gate failure: automatic git revert, DeploymentRecord status=rolled_back, RepairJob created. Pattern from Devin Review second-agent critique.',
  },

  // === AGENT TIERS (autonomy levels) ===
  agentTiers: {
    advisory: 'Agent proposes; human approves every action. For production deployments and customer-facing changes.',
    supervised: 'Agent executes; human reviews the result. For new features and refactors.',
    autonomous: 'Agent executes and self-validates; human reviews the audit log. For bug fixes, tests, docs, SEO.',
    full_autonomous: 'Agent executes, validates, and deploys. Only for routine maintenance: sitemaps, index submissions, health checks, cron dispatch.',
    escalation: 'Any agent can escalate to the next human tier by writing an ApprovalRequest.',
  },

  // === SUPER AGENTS (one per workflow stage, minimum) ===
  superAgents: [
    { id: 'vision_architect', stage: 'Vision → Strategy', tier: 'supervised', model: 'claude-sonnet-5', tools: ['InvokeLLM', 'web research', 'GenerateImage'] },
    { id: 'system_architect', stage: 'Strategy → Architecture', tier: 'supervised', model: 'claude-sonnet-5', tools: ['entity CRUD', 'GitHub', 'Supabase'] },
    { id: 'code_engineer', stage: 'Architecture → Code', tier: 'autonomous', model: 'claude-sonnet-5', tools: ['file write', 'GitHub App PR', 'Docker sandbox'] },
    { id: 'test_engineer', stage: 'Code → Tests', tier: 'autonomous', model: 'gpt_5_mini', tools: ['vitest', 'closedLoopTester'] },
    { id: 'security_auditor', stage: 'Code → Security', tier: 'autonomous', model: 'claude-sonnet-5', tools: ['npm audit', 'OWASP scan', 'dependency check'] },
    { id: 'deployment_engineer', stage: 'Tests → Deploy', tier: 'supervised', model: 'gpt_5_mini', tools: ['Vercel', 'Railway', 'Supabase migration'] },
    { id: 'validation_guardian', stage: 'Deploy → Verify', tier: 'autonomous', model: 'jev', tools: ['postconditionValidator', 'siteHealthChecker'] },
    { id: 'seo_dominance_agent', stage: 'Verify → Rank', tier: 'autonomous', model: 'gemini_3_flash', tools: ['Search Console', 'indexNow', 'sitemap'] },
    { id: 'reputation_manager', stage: 'Rank → Reviews', tier: 'autonomous', model: 'gpt_5_mini', tools: ['sendReviewRequest', 'social'] },
    { id: 'system_monitor', stage: 'Operate → Heal', tier: 'full_autonomous', model: 'gemini_3_flash', tools: ['siteHealthChecker', 'recursiveHealingEngine'] },
    { id: 'self_reflection_engine', stage: 'Operate → Learn', tier: 'full_autonomous', model: 'claude-sonnet-5', tools: ['StrategicReflectionRecord', 'FailurePattern'] },
    { id: 'benchmark_scout', stage: 'Learn → Evolve', tier: 'autonomous', model: 'gemini_3_flash', tools: ['web research', 'IndustryBenchmark', 'BenchmarkCompany'] },
  ],

  // === ENVIRONMENTS ===
  environments: {
    local: { purpose: 'Development, Docker sandbox', gate: 'none' },
    staging: { purpose: 'Integration testing, Supabase staging, Vercel preview', gate: 'steps 1-2' },
    production: { purpose: 'Public release', gate: 'steps 1-2-3 mandatory' },
  },

  // === MITIGATION SYSTEMS (every system to avoid issues) ===
  mitigationSystems: [
    { name: 'Recursive Healing Engine', triggers: 'siteHealthChecker finds HTTP error or content regression', action: 'auto-fix + re-validate + create RepairJob if still failing' },
    { name: 'Failure Pattern Learning', triggers: 'same error occurs 3+ times', action: 'cluster into FailurePattern, update agent system prompts' },
    { name: 'Circuit Breaker', triggers: '3 consecutive agent failures', action: 'pause agent, alert human, create ApprovalRequest' },
    { name: 'Cost Circuit Breaker', triggers: 'task exceeds credit/dollar cap', action: 'halt task, log, require human approval to continue' },
    { name: 'Rollback on Postcondition Failure', triggers: 'postconditionValidator fails after deploy', action: 'git revert, mark DeploymentRecord rolled_back' },
    { name: 'Security Scan Gate', triggers: 'npm audit high/critical found', action: 'block deploy, create RepairJob with P0 severity' },
    { name: 'Data Provenance Audit', triggers: 'benchmark claim without source URL', action: 'reject claim, require source + capture date' },
    { name: 'Self-Reflection Cycle', triggers: 'weekly cron', action: 'StrategicReflectionRecord: challenge assumptions, detect false-greens, test validator reliability' },
    { name: 'Anti-Drift Check', triggers: 'monthly cron', action: 'compare system behavior against original spec, flag drift' },
    { name: 'Concurrency Lock', triggers: 'two agents attempt same entity', action: 'ControlLease: first acquires lock, second waits or queues' },
  ],
};

export type CompanyBlueprint = typeof COMPANY_BLUEPRINT;