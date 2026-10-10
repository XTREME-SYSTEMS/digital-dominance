import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

// ─────────────────────────────────────────────────────────────────────────────
// superAgentOrchestrator — Master super agent dispatcher.
//
// Routes work to the right super agent, monitors all agents, and ensures
// the entire pipeline is functional. Uses Vercel AI Gateway for all LLM.
//
// Actions:
//   dispatch   — Route a message to the appropriate super agent via operatorChat
//   status     — Get status of all 12 super agents
//   health     — System health check across all agents
//   list       — List all super agents and their capabilities
// ─────────────────────────────────────────────────────────────────────────────

const SUPER_AGENTS = [
  { id: 'apex_orchestrator', name: 'APEX Orchestrator', role: 'Master brain — routes work, ensures pipeline functional', status: 'active' },
  { id: 'build_factory', name: 'Build Factory', role: 'Turns definitions into production websites/apps', status: 'active' },
  { id: 'visual_factory', name: 'Visual Factory', role: '99% visual parity, brand lock, design tokens', status: 'active' },
  { id: 'provider_adapters', name: 'Provider Adapters', role: 'Manages Vercel, Supabase, GitHub, Railway, GoDaddy, Google', status: 'active' },
  { id: 'scale_fleet', name: 'Scale Fleet', role: 'Mass-produces validated templates into N sites', status: 'active' },
  { id: 'social_media_manager', name: 'Social Media Manager', role: 'Social accounts, content, scheduling, posting, responding', status: 'active' },
  { id: 'email_manager', name: 'Email Manager', role: 'Creates, reads, sends, responds to emails', status: 'active' },
  { id: 'validation_guardian', name: 'Validation Guardian', role: 'Validates ALL templates, websites, systems; fixes, enhances, self-reflects', status: 'active' },
  { id: 'system_monitor', name: 'System Monitor', role: 'Monitors system 24/7, fixes, hardens, optimizes, keeps at 100%', status: 'active' },
  { id: 'bottleneck_hunter', name: 'Bottleneck Hunter', role: 'Identifies restrictions, removes them, finds workarounds', status: 'active' },
  { id: 'benchmark_scout', name: 'Benchmark Scout', role: 'Finds top systems, creates benchmarks, models best websites', status: 'active' },
  { id: 'sync_guardian', name: 'Sync Guardian', role: 'Ensures all systems sync with Drive, GitHub, Supabase, Vercel, Railway', status: 'active' },
];

const GATEWAY_BASE = 'https://ai-gateway.vercel.sh/v1';

async function callGateway(messages, apiKey) {
  const res = await fetch(`${GATEWAY_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'openai/gpt-5.4', messages, max_tokens: 3000, temperature: 0.3 }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`Gateway error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const apiKey = secrets.get('VERCEL_AI_GATEWAY_API_KEY') || secrets.get('VERCEL_API_TOKEN');
    if (!apiKey) return Response.json({ error: 'VERCEL_AI_GATEWAY_API_KEY not set' }, { status: 500 });

    const body = await req.json();
    const { action } = body;

    // ── list: List all super agents ──
    if (action === 'list') {
      return Response.json({ ok: true, agents: SUPER_AGENTS, count: SUPER_AGENTS.length });
    }

    // ── status: Get status of all agents ──
    if (action === 'status') {
      const svc = base44.asServiceRole;
      const [heartbeats, health, workPackets, approvals] = await Promise.allSettled([
        svc.entities.AlphaPrimeHeartbeat.filter({}, { sort: '-created_date', limit: 1 }),
        svc.entities.SystemHealthAudit.filter({}, { sort: '-created_date', limit: 1 }),
        svc.entities.WorkPacket.filter({ status: { $in: ['pending', 'in_progress'] } }, { sort: '-created_date', limit: 20 }),
        svc.entities.ApprovalRequest.filter({ status: 'pending' }, { sort: '-created_date', limit: 10 }),
      ]);
      return Response.json({
        ok: true,
        agents: SUPER_AGENTS,
        last_heartbeat: heartbeats.status === 'fulfilled' ? heartbeats.value?.[0] : null,
        last_health_audit: health.status === 'fulfilled' ? health.value?.[0] : null,
        active_work_packets: workPackets.status === 'fulfilled' ? workPackets.value?.length || 0 : 0,
        pending_approvals: approvals.status === 'fulfilled' ? approvals.value?.length || 0 : 0,
      });
    }

    // ── health: System health check ──
    if (action === 'health') {
      const svc = base44.asServiceRole;
      const checks = await Promise.allSettled([
        svc.entities.DynamicPage.count({ status: 'published' }),
        svc.entities.WebsiteQueue.count({ status: { $in: ['pending', 'building', 'deploying'] } }),
        svc.entities.LaunchCampaign.count({ status: 'active' }),
        svc.entities.AgentAssignment.count({ active: true }),
        svc.entities.SystemHealthAudit.filter({}, { sort: '-created_date', limit: 1 }),
      ]);
      return Response.json({
        ok: true,
        published_sites: checks[0].status === 'fulfilled' ? checks[0].value : 0,
        sites_in_queue: checks[1].status === 'fulfilled' ? checks[1].value : 0,
        active_campaigns: checks[2].status === 'fulfilled' ? checks[2].value : 0,
        active_agents: checks[3].status === 'fulfilled' ? checks[3].value : 0,
        last_audit: checks[4].status === 'fulfilled' ? checks[4].value?.[0] : null,
        agents: SUPER_AGENTS,
      });
    }

    // ── dispatch: Route a message to the right super agent ──
    if (action === 'dispatch') {
      const { message, agent_id } = body;
      if (!message) return Response.json({ error: 'message required' }, { status: 400 });

      // If agent_id is specified, route directly; otherwise, use APEX to classify
      const targetAgent = agent_id
        ? SUPER_AGENTS.find(a => a.id === agent_id)
        : await classifyAgent(message, apiKey);

      if (!targetAgent) return Response.json({ error: 'Could not classify target agent' }, { status: 400 });

      // Route to the operator chat with agent context
      const res = await base44.functions.invoke('vercelAiGateway', {
        action: 'operatorChat',
        message: `[${targetAgent.name}] ${message}`,
        history: [],
      });

      return Response.json({
        ok: true,
        agent: targetAgent,
        response: res.data,
      });
    }

    return Response.json({ error: 'Unknown action. Use: list, status, health, dispatch.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function classifyAgent(message, apiKey) {
  const classificationPrompt = `Classify this request into one of these super agent IDs. Return ONLY the agent_id, nothing else:

apex_orchestrator: master coordination, pipeline management, system-wide operations
build_factory: building websites, apps, code generation, deployment
visual_factory: branding, logos, design, visual quality, UI/UX
provider_adapters: Vercel, Supabase, GitHub, Railway, GoDaddy, Google account management
scale_fleet: mass website generation, programmatic SEO, multi-city deployment
social_media_manager: social media posts, content, scheduling, responding to messages
email_manager: email creation, sending, reading, responding
validation_guardian: validation, testing, fixing, enhancing, self-reflection
system_monitor: system health, monitoring, hardening, optimization
bottleneck_hunter: identifying restrictions, removing bottlenecks, finding workarounds
benchmark_scout: competitor research, benchmarking, top sites analysis
sync_guardian: syncing with Drive, GitHub, Supabase, Vercel, Railway

Request: "${message}"

Agent ID:`;

  const result = await callGateway(
    [{ role: 'user', content: classificationPrompt }],
    apiKey
  );
  const agentId = result.trim().toLowerCase().replace(/[^a-z_]/g, '');
  return SUPER_AGENTS.find(a => a.id === agentId) || SUPER_AGENTS[0];
}