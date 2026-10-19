// ═══════════════════════════════════════════════════════════════════════════
// metaAgent — Deterministic intent-to-work-packet router.
//
// Turns a natural-language goal into structured, stored work:
//   GOAL → INTENT → SYSTEM TYPE → ARSENAL SEARCH → GAP DETECTION
//   → WORK PACKETS → DEPENDENCY GRAPH → VALIDATION PLAN → RISK/APPROVAL
//
// Actions:
//   analyze  — analyze a goal, create MetaSession + WorkPackets
//   session  — get full session state (packets, validations, approvals)
//   command  — run a slash command (/AUDIT, /HEAL, /MIGRATE, etc.)
//   approve  — approve/deny a work packet
//   validate — run validation checks and create receipts
//   score    — calculate evidence-driven readiness score
//   list     — list all sessions
// ═══════════════════════════════════════════════════════════════════════════

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { patchCore } from '../../shared/aiGateway.ts';
import { ENGINEERING_PROMPTS } from '../../shared/engineeringPromptLibrary.ts';
import { buildPromptCatalog, routeSituationalPrompts } from '../../shared/situationalPromptRouter.mjs';

// ── Deterministic intent patterns ─────────────────────────────────────────
const INTENT_PATTERNS: Record<string, string[]> = {
  DISCOVERY: ['discover', 'find', 'search', 'research', 'explore', 'investigate', 'lookup', 'source'],
  AUDIT: ['audit', 'inspect', 'assess', 'evaluate', 'review', 'examine', 'check', 'scan'],
  ARCHITECTURE: ['architect', 'design', 'structure', 'blueprint', 'plan', 'layout', 'compose'],
  BUILD: ['build', 'create', 'generate', 'construct', 'make', 'develop', 'implement', 'scaffold'],
  COMPLETE: ['complete', 'finish', 'finalize', 'wrap up', 'ship', 'done', 'remaining', 'unfinished'],
  REPAIR: ['repair', 'fix', 'patch', 'resolve', 'correct', 'debug', 'troubleshoot'],
  HEAL: ['heal', 'recover', 'restore', 'remediate', 'auto-fix', 'self-heal'],
  HARDEN: ['harden', 'secure', 'fortify', 'protect', 'defend', 'lock down', 'safeguard'],
  OPTIMIZE: ['optimize', 'improve', 'enhance', 'boost', 'accelerate', 'streamline', 'refine'],
  MIGRATE: ['migrate', 'move', 'transfer', 'port', 'relocate', 'transition', 'cutover'],
  REFACTOR: ['refactor', 'restructure', 'reorganize', 'clean up', 'modernize', 'rewrite'],
  INTEGRATE: ['integrate', 'connect', 'link', 'wire', 'hook up', 'bind', 'couple'],
  PACKAGE: ['package', 'bundle', 'assemble', 'compile', 'manifest', 'export'],
  DOCUMENT: ['document', 'docs', 'readme', 'explain', 'describe', 'manual', 'guide'],
  TEST: ['test', 'validate', 'verify', 'check', 'qa', 'tdd', 'spec', 'coverage'],
  VALIDATE: ['validate', 'verify', 'confirm', 'prove', 'certify', 'evidence'],
  RELEASE_PREP: ['production', 'release', 'deploy', 'launch', 'go-live', 'ship to prod', 'staging'],
  RESEARCH: ['research', 'study', 'analyze', 'understand', 'learn', 'investigate'],
};

const SYSTEM_TYPE_PATTERNS: Record<string, string[]> = {
  WEBSITE: ['website', 'landing page', 'homepage', 'site', 'web page', 'marketing site'],
  WEB_APP: ['web app', 'application', 'dashboard', 'portal app', 'web application'],
  SAAS: ['saas', 'multi-tenant', 'subscription service', 'cloud service', 'platform'],
  MOBILE_APP: ['mobile app', 'ios app', 'android app', 'native app', 'react native'],
  PWA: ['pwa', 'progressive web app', 'installable', 'offline app'],
  API: ['api', 'rest api', 'graphql', 'endpoint', 'microservice', 'backend service'],
  MCP_SERVER: ['mcp', 'model context protocol', 'mcp server', 'tool server'],
  AI_AGENT: ['agent', 'ai agent', 'assistant', 'bot', 'llm agent', 'autonomous agent'],
  AGENT_SWARM: ['swarm', 'multi-agent', 'agent fleet', 'agent team', 'collective'],
  WORKFLOW: ['workflow', 'pipeline', 'automation chain', 'dag', 'step sequence'],
  AUTOMATION: ['automation', 'automate', 'cron', 'scheduled', 'trigger', 'hook'],
  GENERATOR: ['generator', 'scaffold', 'codegen', 'template engine', 'builder'],
  SCRAPER: ['scraper', 'crawler', 'spider', 'extractor', 'parser'],
  BROWSER_AGENT: ['browser', 'playwright', 'puppeteer', 'selenium', 'headless'],
  DATA_PIPELINE: ['data pipeline', 'etl', 'data flow', 'streaming', 'batch processing'],
  RAG: ['rag', 'retrieval augmented', 'vector store', 'embedding', 'semantic search'],
  MEMORY_SYSTEM: ['memory', 'knowledge base', 'memory store', 'context store'],
  BUSINESS_SYSTEM: ['business system', 'crm', 'erp', 'operations', 'back office'],
  MARKETING_SYSTEM: ['marketing', 'campaign', 'funnel', 'lead gen', 'outreach'],
  SEO_SYSTEM: ['seo', 'search engine', 'ranking', 'organic traffic', 'serp'],
  LEAD_SYSTEM: ['lead', 'prospect', 'outbound', 'inbound', 'crm pipeline'],
  ECOMMERCE: ['ecommerce', 'shop', 'store', 'cart', 'checkout', 'product catalog'],
  ADMIN_PORTAL: ['admin', 'admin panel', 'management', 'backoffice', 'control panel'],
  CLIENT_PORTAL: ['client portal', 'customer portal', 'user portal', 'member area'],
  DEVELOPER_TOOL: ['developer tool', 'cli', 'sdk', 'devtool', 'debugger'],
};

// ── Capability categories for the capability map ──────────────────────────
const CAPABILITY_CATEGORIES = [
  'ARCHITECTURE', 'FRONTEND', 'BACKEND', 'DATABASE', 'AI', 'AGENTS', 'MCP',
  'BROWSER', 'AUTOMATION', 'WORKFLOWS', 'TESTING', 'SECURITY', 'OBSERVABILITY',
  'DEVOPS', 'DOCUMENTATION', 'BUSINESS', 'MARKETING', 'SEO', 'DATA',
];

// ── Readiness score weights (100 points total) ───────────────────────────
const READINESS_WEIGHTS = {
  source_truth: 10,
  architecture: 10,
  code_quality: 15,
  data_integrity: 10,
  security: 15,
  testing: 15,
  reliability: 10,
  performance: 5,
  ux_accessibility: 5,
  operations_documentation: 5,
};

// ── Risk classification rules ─────────────────────────────────────────────
const RISK_RULES: Record<string, 'READ' | 'DRAFT' | 'BRANCH_WRITE' | 'PROTECTED'> = {
  'research': 'READ',
  'discover': 'READ',
  'audit': 'READ',
  'analyze': 'READ',
  'document': 'DRAFT',
  'generate': 'DRAFT',
  'draft': 'DRAFT',
  'plan': 'DRAFT',
  'build': 'BRANCH_WRITE',
  'implement': 'BRANCH_WRITE',
  'refactor': 'BRANCH_WRITE',
  'repair': 'BRANCH_WRITE',
  'migrate': 'PROTECTED',
  'deploy': 'PROTECTED',
  'production': 'PROTECTED',
  'database': 'PROTECTED',
  'secrets': 'PROTECTED',
  'billing': 'PROTECTED',
  'payment': 'PROTECTED',
  'publish': 'PROTECTED',
  'delete': 'PROTECTED',
  'destructive': 'PROTECTED',
};

// ── Deterministic ID generator ────────────────────────────────────────────
function deterministicId(...parts: string[]): string {
  const combined = parts.join('|').toLowerCase();
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash) + combined.charCodeAt(i);
    hash |= 0;
  }
  return `ma_${Math.abs(hash).toString(36)}`;
}

// ── Classify intent from goal text ────────────────────────────────────────
function classifyIntents(goal: string): string[] {
  const lower = goal.toLowerCase();
  const matched: string[] = [];
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    if (patterns.some(p => lower.includes(p))) {
      matched.push(intent);
    }
  }
  return matched.length > 0 ? matched : ['RESEARCH'];
}

// ── Classify system type from goal text ──────────────────────────────────
function classifySystemTypes(goal: string): string[] {
  const lower = goal.toLowerCase();
  const matched: string[] = [];
  for (const [type, patterns] of Object.entries(SYSTEM_TYPE_PATTERNS)) {
    if (patterns.some(p => lower.includes(p))) {
      matched.push(type);
    }
  }
  return matched.length > 0 ? matched : ['OTHER'];
}

// ── Classify risk level from goal text ───────────────────────────────────
function classifyRisk(goal: string): 'READ' | 'DRAFT' | 'BRANCH_WRITE' | 'PROTECTED' {
  const lower = goal.toLowerCase();
  let maxRisk: 'READ' | 'DRAFT' | 'BRANCH_WRITE' | 'PROTECTED' = 'READ';
  const riskOrder = { READ: 0, DRAFT: 1, BRANCH_WRITE: 2, PROTECTED: 3 };
  for (const [keyword, risk] of Object.entries(RISK_RULES)) {
    if (lower.includes(keyword) && riskOrder[risk] > riskOrder[maxRisk]) {
      maxRisk = risk;
    }
  }
  return maxRisk;
}

// ── Search Arsenal (BuilderLibrary) for matching assets ─────────────────
async function searchArsenal(svc: any, goal: string, intents: string[], systemTypes: string[]) {
  const allItems = await svc.entities.BuilderLibrary.list('-order', 200);
  const lowerGoal = goal.toLowerCase();
  const keywords = lowerGoal.split(/\s+/).filter(w => w.length > 3);

  const scored = allItems.map((item: any) => {
    let score = 0;
    const itemText = `${item.name} ${item.description || ''} ${item.phase || ''}`.toLowerCase();

    // Keyword overlap
    for (const kw of keywords) {
      if (itemText.includes(kw)) score += 5;
    }

    // Intent matching
    for (const intent of intents) {
      const intentLower = intent.toLowerCase();
      if (itemText.includes(intentLower)) score += 10;
      if (item.item_type === 'agent' && (intent === 'AUDIT' || intent === 'REPAIR' || intent === 'HEAL')) score += 5;
      if (item.item_type === 'workflow' && (intent === 'AUTOMATION' || intent === 'BUILD')) score += 5;
    }

    // System type matching
    for (const st of systemTypes) {
      const stLower = st.toLowerCase().replace('_', ' ');
      if (itemText.includes(stLower)) score += 8;
    }

    // Item type boost
    if (item.item_type === 'capability') score += 2;
    if (item.item_type === 'agent' && intents.includes('BUILD')) score += 3;
    if (item.item_type === 'workflow' && intents.includes('AUTOMATION')) score += 3;

    return { item, score };
  });

  return scored
    .filter((s: any) => s.score > 0)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 20)
    .map((s: any) => ({
      item_id: s.item.item_id,
      name: s.item.name,
      item_type: s.item.item_type,
      phase: s.item.phase,
      status: s.item.status,
      description: s.item.description,
      relevance: Math.min(100, s.score),
      reason: s.score > 30 ? 'Strong keyword and intent match' : s.score > 15 ? 'Partial match on keywords or intent' : 'Weak match',
    }));
}

// ── Build capability map ─────────────────────────────────────────────────
function buildCapabilityMap(matchedAssets: any[], intents: string[], systemTypes: string[]) {
  // Map BuilderLibrary phases to capability categories
  const phaseToCategory: Record<string, string> = {
    foundation: 'ARCHITECTURE',
    backend_data: 'BACKEND',
    frontend_ui: 'FRONTEND',
    ai_agents: 'AI',
    integrations: 'AUTOMATION',
    security_testing: 'SECURITY',
    delivery_provisioning: 'DEVOPS',
    orchestrator: 'ARCHITECTURE',
    executor: 'DEVOPS',
    validator: 'TESTING',
    provisioner: 'DEVOPS',
    generator: 'AUTOMATION',
    intelligence: 'AI',
    delivery: 'DEVOPS',
  };

  const categoryCounts: Record<string, { available: number; needed: number }> = {};
  for (const cat of CAPABILITY_CATEGORIES) {
    categoryCounts[cat] = { available: 0, needed: 0 };
  }

  // Count available assets per category
  for (const asset of matchedAssets) {
    const cat = phaseToCategory[asset.phase] || 'ARCHITECTURE';
    if (categoryCounts[cat]) {
      categoryCounts[cat].available++;
    }
  }

  // Determine needed categories based on intents and system types
  const neededCategories = new Set<string>();
  for (const intent of intents) {
    if (intent === 'AUDIT' || intent === 'VALIDATE') neededCategories.add('TESTING');
    if (intent === 'MIGRATE') { neededCategories.add('DATABASE'); neededCategories.add('DEVOPS'); }
    if (intent === 'BUILD' || intent === 'COMPLETE') { neededCategories.add('FRONTEND'); neededCategories.add('BACKEND'); }
    if (intent === 'HARDEN') neededCategories.add('SECURITY');
    if (intent === 'OPTIMIZE') { neededCategories.add('PERFORMANCE'); }
    if (intent === 'DISCOVERY') neededCategories.add('BROWSER');
    if (intent === 'ARCHITECTURE') neededCategories.add('ARCHITECTURE');
  }
  for (const st of systemTypes) {
    if (st === 'AI_AGENT' || st === 'AGENT_SWARM') neededCategories.add('AGENTS');
    if (st === 'MCP_SERVER') neededCategories.add('MCP');
    if (st === 'WORKFLOW' || st === 'AUTOMATION') neededCategories.add('WORKFLOWS');
    if (st === 'SCRAPER' || st === 'BROWSER_AGENT') neededCategories.add('BROWSER');
    if (st === 'RAG') { neededCategories.add('DATA'); neededCategories.add('AI'); }
    if (st === 'SEO_SYSTEM') neededCategories.add('SEO');
    if (st === 'MARKETING_SYSTEM') neededCategories.add('MARKETING');
    if (st === 'LEAD_SYSTEM') neededCategories.add('BUSINESS');
  }
  // Always need these
  neededCategories.add('ARCHITECTURE');
  neededCategories.add('DOCUMENTATION');
  neededCategories.add('SECURITY');

  for (const cat of neededCategories) {
    if (categoryCounts[cat]) categoryCounts[cat].needed++;
  }

  const categories = Object.entries(categoryCounts).map(([category, counts]) => ({
    category,
    status: counts.available > 0 && counts.needed > 0 ? 'AVAILABLE' :
            counts.needed > 0 && counts.available === 0 ? 'MISSING' :
            counts.available > 0 ? 'PARTIAL' : 'AVAILABLE',
    available_count: counts.available,
    needed_count: counts.needed,
  }));

  return { categories };
}

// ── Detect capability gaps ────────────────────────────────────────────────
function detectGaps(capabilityMap: any, intents: string[], systemTypes: string[]) {
  const gaps: any[] = [];

  for (const cat of capabilityMap.categories) {
    if (cat.needed_count > 0 && cat.status === 'MISSING') {
      gaps.push({
        needed: `${cat.category} capability`,
        found: 'No validated implementation',
        status: 'MISSING',
        action: 'CREATE_DISCOVERY_JOB',
      });
    } else if (cat.status === 'PARTIAL' && cat.available_count > 0) {
      gaps.push({
        needed: `${cat.category} capability`,
        found: `${cat.available_count} partial asset(s)`,
        status: 'PARTIAL',
        action: 'VALIDATE_EXISTING',
      });
    }
  }

  // Intent-specific gaps
  if (intents.includes('MIGRATE')) {
    gaps.push({
      needed: 'Supabase migration validator',
      found: 'No validated implementation',
      status: 'MISSING',
      action: 'CREATE_DISCOVERY_JOB',
    });
  }
  if (intents.includes('TEST') || intents.includes('VALIDATE')) {
    gaps.push({
      needed: 'Playwright E2E validation',
      found: 'No validated implementation',
      status: 'MISSING',
      action: 'CREATE_DISCOVERY_JOB',
    });
  }

  return gaps;
}

// Reuse the existing AgentIntelligence registry; import records stay inert until
// reviewed, versioned, explicitly approved, and enabled by the owner.
async function loadApprovedPromptCatalog(svc: any, ownerId: string) {
  let external: any[] = [];
  try {
    const records = await svc.entities.AgentIntelligence.filter(
      { active: true, category: 'custom' }, '-created_date', 200,
    );
    external = (records || []).filter((r: any) =>
      r.owner_id === ownerId && Array.isArray(r.tags) && r.tags.includes('prompt_registry')
    );
  } catch (err) {
    console.warn('Prompt registry read unavailable; using approved built-in prompts only');
  }
  return buildPromptCatalog({ builtins: ENGINEERING_PROMPTS, intelligence: external, tenantId: ownerId });
}

// ── Generate work packets from analysis ──────────────────────────────────
function generateWorkPackets(sessionId: string, intents: string[], systemTypes: string[], matchedAssets: any[], gaps: any[], promptCatalog: any[]) {
  const packets: any[] = [];
  let order = 0;

  // Phase templates based on intents
  const phaseTemplates: Record<string, any> = {
    DISCOVERY: {
      title: 'Discover Source Truth & Capabilities',
      phase: 'DISCOVER_SOURCE_TRUTH',
      objective: 'Identify the current system state, repository, deployed URLs, and available capabilities',
      risk: 'READ',
      executor: 'XTREME_CLOUD_BROWSER',
    },
    AUDIT: {
      title: 'Audit System Architecture & Code',
      phase: 'AUDIT_ARCHITECTURE',
      objective: 'Run comprehensive audit of architecture, code quality, security, and data integrity',
      risk: 'READ',
      executor: 'BASE44',
    },
    MIGRATE: {
      title: 'Plan & Execute Migration',
      phase: 'DATABASE_MIGRATION_PLAN',
      objective: 'Design and execute migration from current platform to target infrastructure',
      risk: 'PROTECTED',
      executor: 'SUPABASE',
    },
    COMPLETE: {
      title: 'Complete Missing Features',
      phase: 'BUILD',
      objective: 'Identify and implement all unfinished features and missing functionality',
      risk: 'BRANCH_WRITE',
      executor: 'BASE44',
    },
    REPAIR: {
      title: 'Repair Detected Failures',
      phase: 'REPAIR',
      objective: 'Fix all detected failures from audit and validation cycles',
      risk: 'BRANCH_WRITE',
      executor: 'BASE44',
    },
    HEAL: {
      title: 'Auto-Heal System',
      phase: 'REPAIR',
      objective: 'Run recursive healing loop to drive system to production readiness',
      risk: 'BRANCH_WRITE',
      executor: 'BASE44',
    },
    HARDEN: {
      title: 'Harden Security & Reliability',
      phase: 'SECURITY',
      objective: 'Implement security hardening, RLS, access controls, and reliability measures',
      risk: 'BRANCH_WRITE',
      executor: 'BASE44',
    },
    OPTIMIZE: {
      title: 'Optimize Performance & Quality',
      phase: 'OPTIMIZE',
      objective: 'Optimize performance, code quality, and user experience',
      risk: 'BRANCH_WRITE',
      executor: 'BASE44',
    },
    TEST: {
      title: 'Generate & Run Tests',
      phase: 'TEST',
      objective: 'Create test suite, run validation, and collect evidence',
      risk: 'DRAFT',
      executor: 'BASE44',
    },
    VALIDATE: {
      title: 'Validate Production Readiness',
      phase: 'VALIDATE',
      objective: 'Run all validation checks and collect evidence receipts',
      risk: 'READ',
      executor: 'BASE44',
    },
    DOCUMENT: {
      title: 'Generate Documentation',
      phase: 'DOCUMENT',
      objective: 'Create comprehensive documentation for the system',
      risk: 'DRAFT',
      executor: 'BASE44',
    },
    PACKAGE: {
      title: 'Package System Manifest',
      phase: 'PACKAGE',
      objective: 'Create deployable package manifest with all dependencies',
      risk: 'DRAFT',
      executor: 'BASE44',
    },
    RELEASE_PREP: {
      title: 'Prepare for Production Release',
      phase: 'PRODUCTION_READINESS',
      objective: 'Final production readiness checks, deployment, and go-live',
      risk: 'PROTECTED',
      executor: 'VERCEL',
    },
  };

  // Generate packets for each intent
  for (const intent of intents) {
    const template = phaseTemplates[intent];
    if (!template) continue;

    const packetId = deterministicId(sessionId, intent, template.phase);
    const recommendedAssets = matchedAssets
      .filter(a => {
        // Match assets to this intent
        if (intent === 'AUDIT' && a.item_type === 'function') return true;
        if (intent === 'REPAIR' || intent === 'HEAL') return a.item_type === 'function' || a.item_type === 'workflow';
        if (intent === 'BUILD' || intent === 'COMPLETE') return a.item_type === 'capability' || a.item_type === 'agent';
        if (intent === 'MIGRATE') return a.item_type === 'function';
        if (intent === 'TEST' || intent === 'VALIDATE') return a.item_type === 'function';
        return false;
      })
      .slice(0, 5)
      .map(a => ({
        item_id: a.item_id,
        name: a.name,
        relationship: a.item_type === 'agent' ? 'executor' : 'tool',
        reason: a.reason,
        priority: a.relevance > 30 ? 'critical' : a.relevance > 15 ? 'high' : 'medium',
      }));

    packets.push({
      packet_id: packetId,
      session_id: sessionId,
      title: template.title,
      objective: template.objective,
      description: `${template.objective} for ${systemTypes.join(', ').toLowerCase()}`,
      phase: template.phase,
      status: 'DRAFT',
      risk_class: template.risk,
      inputs: 'System ID, repository URL, deployed URL, current state',
      outputs: 'Structured work output with evidence',
      source_truth: 'FleetSystem registry + BuilderLibrary catalog',
      dependencies: order > 0 ? [packets[order - 1].packet_id] : [],
      parallel_safe: order === 0,
      acceptance_criteria: `${template.title} complete with evidence receipt`,
      validation_requirements: 'Independent validator confirms completion',
      allowed_actions: template.risk === 'READ' ? ['read', 'analyze', 'report'] :
                       template.risk === 'DRAFT' ? ['read', 'analyze', 'generate', 'draft'] :
                       template.risk === 'BRANCH_WRITE' ? ['read', 'analyze', 'generate', 'write_branch'] :
                       ['read', 'analyze', 'plan'],
      forbidden_actions: template.risk === 'PROTECTED' ? ['execute', 'deploy', 'modify_secrets', 'delete'] : [],
      // Route per execution phase; never hard-code a small set of prompt IDs.
      // Registry candidates without APPROVED status are rejected by the router.
      recommended_prompts: routeSituationalPrompts({
        goal: template.objective + ' ' + systemTypes.join(' '),
        intents: [intent], systemTypes,
        phase: template.phase, agentRole: template.executor,
      }, promptCatalog, { maxPrompts: 5, minScore: 40 }).selected.map(p => ({
        id: p.id, name: p.name, version: p.version, source: p.source,
        reason: p.reason, risk_class: p.riskClass, requires_approval: p.requiresApproval,
        relevance: Math.min(100, p.score),
      })),
      recommended_tools: [template.executor],
      recommended_executor: template.executor,
      fallback_executor: 'HUMAN',
      affected_files: [],
      affected_systems: systemTypes,
      rollback_requirements: template.risk === 'PROTECTED' ? 'Full backup required before execution' : 'Revert branch changes',
      order,
    });
    order++;
  }

  return packets;
}

// ── Calculate readiness score from validation receipts ──────────────────
async function calculateReadinessScore(svc: any, sessionId: string) {
  const receipts = await svc.entities.ValidationReceipt.filter({ session_id: sessionId }, '-timestamp', 200);

  const breakdown: Record<string, number> = {};
  let verifiedScore = 0;
  let unverifiedPoints = 0;
  let failedPoints = 0;
  const blockers: string[] = [];

  for (const [category, maxPoints] of Object.entries(READINESS_WEIGHTS)) {
    const categoryReceipts = receipts.filter((r: any) => r.category === category);
    let categoryScore = 0;
    let categoryUnverified = 0;
    let categoryFailed = 0;

    for (const r of categoryReceipts) {
      if (r.status === 'PASS') {
        categoryScore += r.points_verified || (maxPoints / Math.max(1, categoryReceipts.length));
      } else if (r.status === 'FAIL') {
        categoryFailed += r.points_possible || (maxPoints / Math.max(1, categoryReceipts.length));
        blockers.push(`${category}: ${r.check_name} failed`);
      } else if (r.status === 'MISSING_EVIDENCE' || r.status === 'PENDING') {
        categoryUnverified += r.points_possible || (maxPoints / Math.max(1, categoryReceipts.length));
      } else if (r.status === 'BLOCKED') {
        blockers.push(`${category}: ${r.check_name} blocked`);
      }
    }

    categoryScore = Math.min(maxPoints, categoryScore);
    breakdown[category] = categoryScore;
    verifiedScore += categoryScore;
    unverifiedPoints += Math.min(maxPoints - categoryScore, categoryUnverified);
    failedPoints += categoryFailed;
  }

  return {
    verified_score: Math.round(verifiedScore),
    unverified_points: Math.round(unverifiedPoints),
    failed_points: Math.round(failedPoints),
    blockers,
    breakdown,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════════

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const svc = base44.asServiceRole;
    patchCore(base44);
    patchCore(svc);
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'list';

    switch (action) {
      // ── ANALYZE: Full goal analysis ──
      case 'analyze': {
        if (!body.goal) return Response.json({ error: 'goal required' }, { status: 400 });

        const goal = body.goal as string;
        const sessionId = deterministicId(goal, user.id, Date.now().toString());
        const now = new Date().toISOString();

        // Create session
        const session = await svc.entities.MetaSession.create({
          session_id: sessionId,
          user_id: user.id,
          goal,
          status: 'ANALYZING',
          current_phase: 'INTENT_ANALYSIS',
          risk_level: classifyRisk(goal),
          work_packet_ids: [],
        });

        // Classify
        const intents = classifyIntents(goal);
        const systemTypes = classifySystemTypes(goal);

        // Search Arsenal
        const matchedAssets = await searchArsenal(svc, goal, intents, systemTypes);

        // Read the approved catalog once and route based on the actual current situation.
        const promptCatalog = await loadApprovedPromptCatalog(svc, user.id);
        const matchedPrompts = routeSituationalPrompts({ goal, intents, systemTypes }, promptCatalog,
          { maxPrompts: 5, minScore: 40 }).selected.map(p => ({
          id: p.id, name: p.name, category: p.category, risk_class: p.riskClass,
          relevance: Math.min(100, p.score), reason: p.reason, version: p.version,
        }));

        // Build capability map
        const capabilityMap = buildCapabilityMap(matchedAssets, intents, systemTypes);

        // Detect gaps
        const gaps = detectGaps(capabilityMap, intents, systemTypes);

        // Generate work packets
        const packets = generateWorkPackets(sessionId, intents, systemTypes, matchedAssets, gaps, promptCatalog);

        // Create WorkPacket records
        const packetIds: string[] = [];
        for (const pkt of packets) {
          const created = await svc.entities.WorkPacket.create(pkt);
          packetIds.push(pkt.packet_id);
        }

        // Create DiscoveryJobs for MISSING gaps
        for (const gap of gaps) {
          if (gap.status === 'MISSING' && gap.action === 'CREATE_DISCOVERY_JOB') {
            const discoveryId = deterministicId(sessionId, gap.needed);
            await svc.entities.DiscoveryJob.create({
              discovery_id: discoveryId,
              session_id: sessionId,
              query: gap.needed,
              category: gap.needed.split(' ')[0],
              reason: `Gap detected: ${gap.found}`,
              status: 'QUEUED',
              source_requirements: {
                official_sources_preferred: true,
                github_allowed: true,
                open_source_only: false,
                commercial_use_required: true,
                free_only: false,
                maximum_results: 10,
                freshness_requirement: '90d',
                validation_requirements: 'Must be validated before use',
              },
              preferred_executor: 'XTREME_CLOUD_BROWSER',
              created_at: now,
            });
          }
        }

        // Generate summary via LLM
        let summary = '';
        let architecture = '';
        try {
          const llmRes = await base44.integrations.Core.InvokeLLM({
            prompt: `Analyze this user goal and provide a structured summary.\n\nGoal: "${goal}"\n\nIntents detected: ${intents.join(', ')}\nSystem types: ${systemTypes.join(', ')}\nMatched arsenal assets: ${matchedAssets.length}\nCapability gaps: ${gaps.length}\n\nProvide:\n1. A 2-3 sentence summary of what the user wants to accomplish\n2. A recommended architecture in 2-3 sentences\n\nFormat as JSON: {"summary": "...", "architecture": "..."}`,
            response_json_schema: {
              type: 'object',
              properties: {
                summary: { type: 'string' },
                architecture: { type: 'string' },
              },
            },
          });
          summary = (llmRes as any).summary || '';
          architecture = (llmRes as any).architecture || '';
        } catch {
          summary = `Goal analyzed: ${intents.join(', ')} for ${systemTypes.join(', ')}. Found ${matchedAssets.length} matching assets and ${gaps.length} capability gaps.`;
          architecture = `Recommended: ${systemTypes.join(' + ')} with ${intents.join(' → ')} pipeline.`;
        }

        // Calculate initial readiness score (0 without validation receipts)
        const readinessScore = {
          verified_score: 0,
          unverified_points: 100,
          failed_points: 0,
          blockers: gaps.filter(g => g.status === 'MISSING').map(g => g.needed),
          breakdown: Object.keys(READINESS_WEIGHTS).reduce((acc, k) => { acc[k] = 0; return acc; }, {} as any),
        };

        // Update session with full analysis
        await svc.entities.MetaSession.update(session.id, {
          status: 'PLANNED',
          intent_types: intents,
          system_types: systemTypes,
          summary,
          recommended_architecture: architecture,
          matched_assets: matchedAssets,
          matched_prompts: matchedPrompts,
          capability_map: capabilityMap,
          capability_gaps: gaps,
          readiness_score: readinessScore,
          current_phase: 'PLANNED',
          work_packet_ids: packetIds,
          next_action: packets.length > 0 ? `Review ${packets.length} work packets and approve for execution` : 'No work packets generated',
        });

        // Create CommandRun record
        await svc.entities.CommandRun.create({
          command_id: deterministicId(sessionId, 'ANALYZE'),
          session_id: sessionId,
          command: 'ANALYZE',
          parameters: { goal },
          status: 'COMPLETED',
          result_summary: `Analyzed goal: ${intents.length} intents, ${systemTypes.length} system types, ${matchedAssets.length} assets, ${gaps.length} gaps, ${packets.length} work packets`,
          work_packets_created: packetIds,
          created_at: now,
          completed_at: new Date().toISOString(),
        });

        return Response.json({
          ok: true,
          session_id: sessionId,
          intents,
          system_types: systemTypes,
          summary,
          architecture,
          matched_assets: matchedAssets,
          matched_prompts: matchedPrompts,
          capability_map: capabilityMap,
          capability_gaps: gaps,
          work_packets: packets,
          readiness_score: readinessScore,
          next_action: `Review ${packets.length} work packets and approve for execution`,
        });
      }

      // ── SESSION: Get full session state ──
      case 'session': {
        if (!body.session_id) return Response.json({ error: 'session_id required' }, { status: 400 });

        const sessions = await svc.entities.MetaSession.filter({ session_id: body.session_id }, '-created_date', 1);
        if (!sessions || sessions.length === 0) return Response.json({ error: 'Session not found' }, { status: 404 });

        const session = sessions[0];
        const [packets, validations, approvals, discoveries, commands] = await Promise.all([
          svc.entities.WorkPacket.filter({ session_id: body.session_id }, 'order', 50),
          svc.entities.ValidationReceipt.filter({ session_id: body.session_id }, '-timestamp', 100),
          svc.entities.ApprovalRequest.filter({ session_id: body.session_id }, '-requested_at', 50),
          svc.entities.DiscoveryJob.filter({ session_id: body.session_id }, '-created_date', 50),
          svc.entities.CommandRun.filter({ session_id: body.session_id }, '-created_date', 50),
        ]);

        return Response.json({
          ok: true,
          session,
          work_packets: packets,
          validation_receipts: validations,
          approval_requests: approvals,
          discovery_jobs: discoveries,
          command_runs: commands,
        });
      }

      // ── LIST: List all sessions ──
      case 'list': {
        const sessions = await svc.entities.MetaSession.list('-created_date', 50);
        return Response.json({ ok: true, sessions });
      }

      // ── COMMAND: Run a slash command ──
      case 'command': {
        if (!body.session_id || !body.command) return Response.json({ error: 'session_id and command required' }, { status: 400 });

        const sessions = await svc.entities.MetaSession.filter({ session_id: body.session_id }, '-created_date', 1);
        if (!sessions || sessions.length === 0) return Response.json({ error: 'Session not found' }, { status: 404 });
        const session = sessions[0];

        const commandId = deterministicId(body.session_id, body.command, Date.now().toString());
        const now = new Date().toISOString();

        // Create command run
        const cmdRun = await svc.entities.CommandRun.create({
          command_id: commandId,
          session_id: body.session_id,
          command: body.command,
          parameters: body.parameters || {},
          status: 'RUNNING',
          created_at: now,
        });

        // Route command to appropriate action
        const intents = session.intent_types || [];
        const systemTypes = session.system_types || [];
        const matchedAssets = session.matched_assets || [];

        let resultSummary = '';
        const newPacketIds: string[] = [];

        switch (body.command) {
          case 'AUDIT':
          case 'HEAL':
          case 'COMPLETE':
          case 'HARDEN':
          case 'MIGRATE':
          case 'VALIDATE':
          case 'SCORE': {
            // These commands re-analyze with specific intent focus
            const focusedGoal = `${body.command.toLowerCase()} ${session.goal}`;
            const focusedIntents = classifyIntents(focusedGoal);
            const allIntents = [...new Set([...intents, ...focusedIntents])];
            const focusedAssets = await searchArsenal(svc, focusedGoal, allIntents, systemTypes);
            const allAssets = [...matchedAssets, ...focusedAssets].filter((a, i, arr) => arr.findIndex(b => b.item_id === a.item_id) === i);
            const capMap = buildCapabilityMap(allAssets, allIntents, systemTypes);
            const gaps = detectGaps(capMap, allIntents, systemTypes);
            const promptCatalog = await loadApprovedPromptCatalog(svc, user.id);
            const newPackets = generateWorkPackets(body.session_id, focusedIntents, systemTypes, allAssets, gaps, promptCatalog);

            for (const pkt of newPackets) {
              const existing = await svc.entities.WorkPacket.filter({ packet_id: pkt.packet_id }, '-created_date', 1);
              if (!existing || existing.length === 0) {
                await svc.entities.WorkPacket.create(pkt);
                newPacketIds.push(pkt.packet_id);
              }
            }

            resultSummary = `/${body.command}: ${newPacketIds.length} new work packets created, ${gaps.length} gaps detected`;
            break;
          }

          case 'DISCOVER': {
            // Create discovery jobs for all gaps
            const gaps = session.capability_gaps || [];
            for (const gap of gaps) {
              if (gap.status === 'MISSING') {
                const discoveryId = deterministicId(body.session_id, gap.needed, Date.now().toString());
                await svc.entities.DiscoveryJob.create({
                  discovery_id: discoveryId,
                  session_id: body.session_id,
                  query: gap.needed,
                  category: gap.needed.split(' ')[0],
                  reason: `Discovery from /DISCOVER command: ${gap.found}`,
                  status: 'QUEUED',
                  source_requirements: {
                    official_sources_preferred: true,
                    github_allowed: true,
                    open_source_only: false,
                    commercial_use_required: true,
                    free_only: false,
                    maximum_results: 10,
                    freshness_requirement: '90d',
                    validation_requirements: 'Must be validated before use',
                  },
                  preferred_executor: 'XTREME_CLOUD_BROWSER',
                  created_at: now,
                });
              }
            }
            resultSummary = `Created discovery jobs for ${gaps.filter((g: any) => g.status === 'MISSING').length} gaps`;
            break;
          }

          case 'MCP':
          case 'AGENTS':
          case 'WORKFLOWS':
          case 'PROMPTS':
          case 'PACKAGE':
          case 'UPGRADE': {
            resultSummary = `/${body.command}: Command queued. External executor needed for full execution.`;
            break;
          }

          case 'CONVERGE': {
            // Run the full convergence pipeline (XACE) on the target system
            const targetSystemId = body.parameters?.system_id || body.system_id || 'epoxyquotenearme';
            try {
              const convergeRes = await base44.functions.invoke('convergenceEngine', {
                action: 'cycle',
                system_id: targetSystemId,
              });
              const convergeData = convergeRes.data || convergeRes;
              resultSummary = `/CONVERGE: Full pipeline executed on ${targetSystemId}. Score ${convergeData.baseline_score} → ${convergeData.final_score}, verified=${convergeData.verified_100}, phases=${convergeData.phases?.length || 0}, duration=${(convergeData.total_duration_ms / 1000).toFixed(1)}s`;

              // Update session with convergence results
              await svc.entities.MetaSession.update(session.id, {
                status: convergeData.verified_100 ? 'COMPLETE' : 'IN_PROGRESS',
                current_phase: convergeData.verified_100 ? 'COMPLETE' : 'VALIDATING',
                next_action: convergeData.verified_100
                  ? 'System reached VERIFIED_100 — pipeline complete'
                  : `Score ${convergeData.final_score}/100. ${convergeData.next_action || 'Run /CONVERGE again to continue convergence'}`,
              });

              // Create validation receipts from convergence scorecard
              const scorecard = convergeData.scorecard || {};
              const categories = scorecard.categories || [];
              for (const cat of categories) {
                if (cat.status === 'pass' || cat.status === 'fail') {
                  const receiptId = deterministicId(body.session_id, 'CONVERGE', cat.id);
                  const existingR = await svc.entities.ValidationReceipt.filter({ receipt_id: receiptId }, '-timestamp', 1);
                  if (!existingR || existingR.length === 0) {
                    await svc.entities.ValidationReceipt.create({
                      receipt_id: receiptId,
                      session_id: body.session_id,
                      work_packet_id: `CONVERGE-${targetSystemId}`,
                      check_name: cat.name || cat.id,
                      expected: cat.pass_condition || '',
                      actual: cat.status,
                      status: cat.status === 'pass' ? 'PASS' : 'FAIL',
                      evidence: `Convergence Engine ${cat.id} — ${cat.status}`,
                      validator: 'convergenceEngine',
                      category: (cat as any).category || 'operations_documentation',
                      points_possible: cat.weight || 1,
                      points_verified: cat.status === 'pass' ? (cat.weight || 1) : 0,
                      timestamp: new Date().toISOString(),
                    });
                  }
                }
              }

              // Recalculate readiness score from new receipts
              const updatedScore = await calculateReadinessScore(svc, body.session_id);
              await svc.entities.MetaSession.update(session.id, { readiness_score: updatedScore });
            } catch (cerr: any) {
              resultSummary = `/CONVERGE: FAILED — ${cerr.message}`;
            }
            break;
          }

          default:
            resultSummary = `Unknown command: ${body.command}`;
        }

        // Update command run
        await svc.entities.CommandRun.update(cmdRun.id, {
          status: 'COMPLETED',
          result_summary: resultSummary,
          work_packets_created: newPacketIds,
          completed_at: new Date().toISOString(),
        });

        return Response.json({
          ok: true,
          command: body.command,
          command_id: commandId,
          result: resultSummary,
          new_work_packets: newPacketIds,
        });
      }

      // ── APPROVE: Approve/deny a work packet ──
      case 'approve': {
        if (!body.work_packet_id || !body.decision) return Response.json({ error: 'work_packet_id and decision required' }, { status: 400 });

        const packets = await svc.entities.WorkPacket.filter({ packet_id: body.work_packet_id }, '-created_date', 1);
        if (!packets || packets.length === 0) return Response.json({ error: 'Work packet not found' }, { status: 404 });
        const packet = packets[0];

        const approvalId = deterministicId(body.work_packet_id, 'approval');
        const now = new Date().toISOString();

        await svc.entities.ApprovalRequest.create({
          approval_id: approvalId,
          session_id: packet.session_id,
          work_packet_id: body.work_packet_id,
          action: `Execute: ${packet.title}`,
          reason: `Risk class: ${packet.risk_class}`,
          risk_class: packet.risk_class,
          status: body.decision === 'approve' ? 'APPROVED' : 'DENIED',
          requested_at: now,
          resolved_at: now,
          resolved_by: user.id,
          notes: body.notes || '',
        });

        if (body.decision === 'approve') {
          await svc.entities.WorkPacket.update(packet.id, {
            status: packet.risk_class === 'PROTECTED' ? 'WAITING_APPROVAL' : 'READY',
          });
        }

        return Response.json({
          ok: true,
          work_packet_id: body.work_packet_id,
          decision: body.decision,
          approval_id: approvalId,
        });
      }

      // ── VALIDATE: Run validation checks ──
      case 'validate': {
        if (!body.session_id) return Response.json({ error: 'session_id required' }, { status: 400 });

        const packets = await svc.entities.WorkPacket.filter({ session_id: body.session_id, status: ['DRAFT', 'READY', 'RUNNING', 'VALIDATING'] }, 'order', 50);
        const now = new Date().toISOString();
        const receipts: any[] = [];

        for (const pkt of packets) {
          // Create a validation receipt for each packet
          const receiptId = deterministicId(body.session_id, pkt.packet_id, 'validation');
          const category = pkt.phase === 'SECURITY' ? 'security' :
                           pkt.phase === 'TEST' ? 'testing' :
                           pkt.phase === 'AUDIT_ARCHITECTURE' ? 'architecture' :
                           pkt.phase === 'DISCOVER_SOURCE_TRUTH' ? 'source_truth' :
                           pkt.phase === 'PRODUCTION_READINESS' ? 'reliability' :
                           'operations_documentation';

          const maxPoints = (READINESS_WEIGHTS as any)[category] || 5;

          await svc.entities.ValidationReceipt.create({
            receipt_id: receiptId,
            session_id: body.session_id,
            work_packet_id: pkt.packet_id,
            check_name: `${pkt.phase} validation`,
            expected: pkt.acceptance_criteria,
            actual: 'PENDING — awaiting executor evidence',
            status: 'MISSING_EVIDENCE',
            evidence: '',
            validator: 'metaAgent',
            category,
            points_possible: maxPoints,
            points_verified: 0,
            timestamp: now,
          });

          receipts.push(receiptId);
        }

        // Recalculate readiness score
        const score = await calculateReadinessScore(svc, body.session_id);

        // Update session
        const sessions = await svc.entities.MetaSession.filter({ session_id: body.session_id }, '-created_date', 1);
        if (sessions && sessions.length > 0) {
          await svc.entities.MetaSession.update(sessions[0].id, {
            readiness_score: score,
            current_phase: 'VALIDATING',
          });
        }

        return Response.json({
          ok: true,
          session_id: body.session_id,
          receipts_created: receipts.length,
          readiness_score: score,
        });
      }

      // ── SCORE: Calculate readiness score ──
      case 'score': {
        if (!body.session_id) return Response.json({ error: 'session_id required' }, { status: 400 });

        const score = await calculateReadinessScore(svc, body.session_id);

        const sessions = await svc.entities.MetaSession.filter({ session_id: body.session_id }, '-created_date', 1);
        if (sessions && sessions.length > 0) {
          await svc.entities.MetaSession.update(sessions[0].id, {
            readiness_score: score,
          });
        }

        return Response.json({ ok: true, session_id: body.session_id, readiness_score: score });
      }

      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('[metaAgent] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}