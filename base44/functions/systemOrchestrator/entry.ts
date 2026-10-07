// ═══════════════════════════════════════════════════════════════════════════
// systemOrchestrator — Unified system control plane.
//
// Single entry point for:
//   1. HEALTH  — Aggregate system health across all subsystems
//   2. ACTIVITY — Live agent activity feed
//   3. HEAL    — Auto-detect and repair issues
//   4. OPERATE — Natural language command routing
//
// This function is exposed via MCP so any AI (GPT, Claude, Gemini) can
// operate the entire system through one unified API.
// ═══════════════════════════════════════════════════════════════════════════

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { patchCore } from '../../shared/aiGateway.ts';

// ── Map of all backend functions available for delegation ─────────────────
const FUNCTION_REGISTRY: Record<string, string> = {
  vision: 'visionEngine',
  strategy: 'visionEngine',
  agent: 'agentBuilderEngine',
  dominance: 'dominanceEngine',
  seo: 'seoGenerator',
  social: 'socialStudio',
  competitor: 'scanCompetitors',
  trend: 'tradeCrystalBall',
  convergence: 'autoComplete',
  heal: 'autoComplete',
  validate: 'autoComplete',
  swarm: 'swarmOrchestrator',
  deploy: 'vercelDeploy',
  domain: 'godaddyApi',
  sync: 'googleWorkspaceSync',
  content: 'seoGenerator',
  voice: 'voiceAssistant',
  comms: 'xtremeComms',
  lead: 'dailyLeadEngine',
  enrich: 'enrichLead',
  property: 'propertyLookup',
  skiptrace: 'skipTrace',
  sitehealth: 'siteHealthChecker',
  systemaudit: 'systemAuditor',
  graph: 'graphEngine',
  rag: 'ragPipeline',
  intent: 'intentRouter',
  meta: 'metaAgent',
  repair: 'alphaPrimeRepairFactory',
  benchmark: 'alphaPrimeBenchmarkGenerator',
};

// ── HEALTH: Aggregate system health ──────────────────────────────────────
async function getSystemHealth(svc: any) {
  const [fleetSystems, agents, actions, workflows, campaigns, leads, cycles, manifests] = await Promise.all([
    svc.entities.FleetSystem.list('-updated_date', 50).catch(() => []),
    svc.entities.AgentPersona.list('-created_date', 100).catch(() => []),
    svc.entities.AgentAction.filter({ status: 'active' }, '-created_date', 200).catch(() => []),
    svc.entities.DominanceCampaign.list('-created_date', 20).catch(() => []),
    svc.entities.DominanceCampaign.filter({ status: 'running' }, '-created_date', 10).catch(() => []),
    svc.entities.Lead.list('-created_date', 50).catch(() => []),
    svc.entities.ConvergenceCycle.filter({ status: 'running' }, '-created_date', 10).catch(() => []),
    svc.entities.SystemManifest.list('-updated_date', 20).catch(() => []),
  ]);

  const activeAgents = agents.filter((a: any) => a.active);
  const avgScore = fleetSystems.length > 0
    ? Math.round(fleetSystems.reduce((sum: number, s: any) => sum + (s.global_score || 0), 0) / fleetSystems.length)
    : 0;
  const verifiedSystems = fleetSystems.filter((s: any) => s.distance_to_100 === 0).length;
  const totalBenchmarks = fleetSystems.reduce((sum: number, s: any) => sum + (s.total_benchmarks || 0), 0);
  const passingBenchmarks = fleetSystems.reduce((sum: number, s: any) => sum + (s.passing_benchmarks || 0), 0);

  return {
    overall: {
      score: avgScore,
      verified_systems: verifiedSystems,
      total_systems: fleetSystems.length,
      health_status: avgScore >= 90 ? 'EXCELLENT' : avgScore >= 70 ? 'GOOD' : avgScore >= 50 ? 'DEGRADED' : 'CRITICAL',
    },
    agents: {
      total: agents.length,
      active: activeAgents.length,
      with_prompts: agents.filter((a: any) => a.system_prompt && a.system_prompt.length > 100).length,
      with_actions: new Set(actions.map((a: any) => a.agent_id)).size,
      categories: [...new Set(agents.map((a: any) => a.persona_type))],
    },
    operations: {
      active_campaigns: campaigns.length,
      active_cycles: cycles.length,
      total_leads: leads.length,
      new_leads: leads.filter((l: any) => l.status === 'NEW ESTIMATE').length,
    },
    benchmarks: {
      total: totalBenchmarks,
      passing: passingBenchmarks,
      pass_rate: totalBenchmarks > 0 ? Math.round((passingBenchmarks / totalBenchmarks) * 100) : 0,
    },
    fleet: fleetSystems.slice(0, 10).map((s: any) => ({
      system_id: s.system_id,
      name: s.name,
      score: s.global_score || 0,
      distance_to_100: s.distance_to_100 || 100,
      status: s.lifecycle,
      active: s.active,
    })),
    manifests: manifests.length,
  };
}

// ── ACTIVITY: Live agent activity feed ────────────────────────────────────
async function getAgentActivity(svc: any, limit: number = 30) {
  const [actions, memories, campaigns, cycles, leads] = await Promise.all([
    svc.entities.AgentAction.list('-updated_date', limit).catch(() => []),
    svc.entities.AgentMemory.list('-created_date', limit).catch(() => []),
    svc.entities.DominanceCampaign.list('-updated_date', 5).catch(() => []),
    svc.entities.ConvergenceCycle.list('-updated_date', 5).catch(() => []),
    svc.entities.Lead.list('-created_date', 10).catch(() => []),
  ]);

  const activity: any[] = [];

  // Recent agent actions
  for (const a of actions.slice(0, limit)) {
    activity.push({
      type: 'agent_action',
      timestamp: a.updated_at || a.created_date,
      agent: a.agent_short_name || 'AGENT',
      title: a.title,
      status: a.status,
      category: a.action_category,
      last_result: a.last_result?.slice(0, 200),
    });
  }

  // Recent campaigns
  for (const c of campaigns) {
    activity.push({
      type: 'campaign',
      timestamp: c.updated_date || c.started_at,
      title: `Campaign: ${c.business_name || c.keyword}`,
      phase: c.phase,
      progress: c.progress_percent || 0,
      status: c.status,
    });
  }

  // Recent convergence cycles
  for (const cy of cycles) {
    activity.push({
      type: 'convergence',
      timestamp: cy.updated_date || cy.started_at,
      title: `Convergence: ${cy.system_id}`,
      phase: cy.phase,
      score: cy.current_score || 0,
      verified: cy.verified_100,
    });
  }

  // Recent leads
  for (const l of leads.slice(0, 5)) {
    activity.push({
      type: 'lead',
      timestamp: l.created_date,
      title: `New lead: ${l.first_name} ${l.last_name || ''}`.trim(),
      status: l.status,
      source: l.lead_source,
    });
  }

  // Sort by timestamp descending
  activity.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

  return activity.slice(0, limit);
}

// ── HEAL: Auto-detect and repair issues ───────────────────────────────────
async function autoHeal(svc: any, base44: any) {
  const health = await getSystemHealth(svc);
  const repairs: any[] = [];

  // Check 1: Agents without prompts
  const agentsWithoutPrompts = health.agents.total - health.agents.with_prompts;
  if (agentsWithoutPrompts > 0) {
    repairs.push({
      issue: `${agentsWithoutPrompts} agents missing master prompts`,
      action: 'Run agentBuilderEngine generate to create missing prompts',
      severity: 'high',
      auto_fix: 'agentBuilderEngine',
    });
  }

  // Check 2: Low system score
  if (health.overall.score < 90 && health.overall.total_systems > 0) {
    repairs.push({
      issue: `System score is ${health.overall.score}/100 — below VERIFIED_100`,
      action: 'Run autoComplete convergence cycle',
      severity: 'high',
      auto_fix: 'autoComplete',
    });
  }

  // Check 3: Failing benchmarks
  if (health.benchmarks.pass_rate < 100 && health.benchmarks.total > 0) {
    repairs.push({
      issue: `${health.benchmarks.total - health.benchmarks.passing} benchmarks failing`,
      action: 'Run convergence to repair failing benchmarks',
      severity: 'medium',
      auto_fix: 'autoComplete',
    });
  }

  // Check 4: Active campaigns stuck
  const stuckCampaigns = health.operations.active_campaigns;
  if (stuckCampaigns > 0) {
    repairs.push({
      issue: `${stuckCampaigns} campaigns currently running`,
      action: 'Check campaign progress and resume if stalled',
      severity: 'low',
      auto_fix: 'dominanceEngine',
    });
  }

  // Check 5: New leads needing attention
  if (health.operations.new_leads > 0) {
    repairs.push({
      issue: `${health.operations.new_leads} new leads need follow-up`,
      action: 'Run daily lead engine for automated follow-up',
      severity: 'medium',
      auto_fix: 'dailyLeadEngine',
    });
  }

  return {
    health_status: health.overall.health_status,
    score: health.overall.score,
    issues_found: repairs.length,
    repairs,
    recommendation: repairs.length === 0
      ? 'System is healthy — no issues detected.'
      : `${repairs.length} issue(s) detected. Highest priority: ${repairs[0].issue}`,
  };
}

// ── OPERATE: Natural language command routing ────────────────────────────
async function operate(svc: any, base44: any, command: string) {
  const cmd = command.toLowerCase();

  // Match command to function
  let matchedFunction: string | null = null;
  let action: string = 'status';

  for (const [keyword, fn] of Object.entries(FUNCTION_REGISTRY)) {
    if (cmd.includes(keyword)) {
      matchedFunction = fn;
      break;
    }
  }

  if (!matchedFunction) {
    // Use LLM to interpret the command
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `A user gave this command to an autonomous business system: "${command}"

Available backend functions and their purposes:
- visionEngine: Generate AI-assisted visions and business strategies
- agentBuilderEngine: Build agent fleets from visions
- dominanceEngine: Run digital dominance campaigns (SEO, content, social)
- autoComplete: Validate and auto-heal the system
- swarmOrchestrator: Coordinate agent swarms
- scanCompetitors: Research competitors
- tradeCrystalBall: Analyze industry trends
- seoGenerator: Generate SEO content
- socialStudio: Social media automation
- dailyLeadEngine: Lead processing and follow-up
- googleWorkspaceSync: Sync with Google Workspace
- vercelDeploy: Deploy websites

Which function should handle this command? Respond with ONLY the function name, nothing else.`,
      model: 'gemini_3_flash',
    });

    const interpreted = (typeof result === 'string' ? result : (result as any)?.text || '').trim().toLowerCase();
    if (FUNCTION_REGISTRY[interpreted] || Object.values(FUNCTION_REGISTRY).includes(interpreted)) {
      matchedFunction = interpreted;
    }
  }

  // Determine action based on command intent
  if (cmd.includes('status') || cmd.includes('check') || cmd.includes('health') || cmd.includes('list')) {
    action = 'status';
  } else if (cmd.includes('generate') || cmd.includes('create') || cmd.includes('build') || cmd.includes('launch')) {
    action = 'generate';
  } else if (cmd.includes('analyze') || cmd.includes('scan') || cmd.includes('research')) {
    action = 'analyze';
  } else if (cmd.includes('fix') || cmd.includes('heal') || cmd.includes('repair')) {
    action = 'heal';
  }

  return {
    command,
    interpreted_function: matchedFunction,
    interpreted_action: action,
    message: matchedFunction
      ? `Routing to ${matchedFunction} with action '${action}'. Call base44.functions.invoke('${matchedFunction}', { action: '${action}', ... }) to execute.`
      : 'Could not determine which function should handle this command. Try being more specific.',
    suggestion: matchedFunction
      ? { function: matchedFunction, action }
      : null,
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
    const action = body.action || 'health';

    switch (action) {
      case 'health': {
        const health = await getSystemHealth(svc);
        return Response.json({ ok: true, health });
      }

      case 'activity': {
        const limit = Math.min(body.limit || 30, 100);
        const activity = await getAgentActivity(svc, limit);
        return Response.json({ ok: true, activity, count: activity.length });
      }

      case 'heal': {
        const result = await autoHeal(svc, base44);
        return Response.json({ ok: true, ...result });
      }

      case 'operate': {
        if (!body.command) return Response.json({ error: 'command required' }, { status: 400 });
        const result = await operate(svc, base44, body.command);
        return Response.json({ ok: true, ...result });
      }

      case 'full_status': {
        const [health, activity, healing] = await Promise.all([
          getSystemHealth(svc),
          getAgentActivity(svc, 20),
          autoHeal(svc, base44),
        ]);
        return Response.json({
          ok: true,
          health,
          activity: activity.slice(0, 10),
          healing,
          timestamp: new Date().toISOString(),
        });
      }

      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('[systemOrchestrator] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}