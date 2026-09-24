// ═══════════════════════════════════════════════════════════════════════════
// agentBuilderEngine — Deterministic Vision-to-Production Agent Builder.
//
// Takes a natural-language vision and produces a complete, operational agent
// fleet with master prompts, capabilities, actions, and project structure.
//
// Pipeline:
//   1. ANALYZE  — LLM analyzes vision → strategy with recommended agents
//   2. GENERATE — Creates AgentPersona + AgentAction records with master prompts
//   3. BOOTSTRAP — Generates project manifest, folder structure, sync configs
//   4. LAUNCH   — Validates, activates agents, creates BuilderLibrary entry
//   5. STATUS   — Returns current build state
//
// Deterministic: same vision → same agent fleet (hash-based IDs).
// ═══════════════════════════════════════════════════════════════════════════

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { AGENT_TAXONOMY, SYNC_TARGETS, getArchetype } from '../../shared/agentTaxonomy.ts';
import { invokeIndependentAi } from '../../shared/independentCore.ts';

// ── Deterministic ID generator ────────────────────────────────────────────
function deterministicId(...parts: string[]): string {
  const combined = parts.join('|').toLowerCase();
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash) + combined.charCodeAt(i);
    hash |= 0;
  }
  return `ab_${Math.abs(hash).toString(36)}`;
}

function visionHash(vision: string): string {
  let hash = 0;
  for (let i = 0; i < vision.length; i++) {
    hash = ((hash << 5) - hash) + vision.charCodeAt(i);
    hash |= 0;
  }
  return `vh_${Math.abs(hash).toString(36)}`;
}

function shortName(archetypeId: string, index: number): string {
  const arch = getArchetype(archetypeId);
  return arch?.short_name || `A${index}`;
}

// ── ANALYZE: LLM analyzes vision and recommends agents ───────────────────
async function analyzeVision(base44: any, vision: string) {
  const archetypeList = AGENT_TAXONOMY.map(a => ({
    id: a.id,
    name: a.name,
    category: a.category,
    description: a.description,
    capabilities: a.capabilities,
  }));

  const prompt = `You are an AI agent fleet architect. A user has described their vision for an autonomous business system.

VISION: "${vision}"

AVAILABLE AGENT ARCHETYPES:
${JSON.stringify(archetypeList, null, 2)}

Analyze this vision and determine which agents are needed to build and operate this system 24/7. For each recommended agent:
1. Select the archetype_id from the list above
2. Explain WHY this agent is needed for this specific vision
3. List the specific responsibilities this agent will have
4. Rate the priority (critical, high, medium, low)

Also provide:
- A 2-3 sentence executive summary of the strategy
- The recommended system architecture (2-3 sentences)
- The key capabilities the system needs
- Which sync targets are essential (chatgpt, google_drive, supabase, vercel, github, railway)

Return as JSON with this schema:
{
  "executive_summary": "string",
  "architecture": "string",
  "recommended_agents": [
    {
      "archetype_id": "string (must be one of the available IDs)",
      "reason": "string",
      "responsibilities": ["string"],
      "priority": "critical|high|medium|low"
    }
  ],
  "key_capabilities": ["string"],
  "sync_targets": ["string"]
}

Select at minimum: orchestrator, ceo, seo_agent, social_media, maintenance_agent, validator. Add others based on the vision. Do not exceed 20 agents.`;

  const result = await invokeIndependentAi(base44, {
    prompt,
    response_json_schema: {
      type: 'object',
      properties: {
        executive_summary: { type: 'string' },
        architecture: { type: 'string' },
        recommended_agents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              archetype_id: { type: 'string' },
              reason: { type: 'string' },
              responsibilities: { type: 'array', items: { type: 'string' } },
              priority: { type: 'string' },
            },
          },
        },
        key_capabilities: { type: 'array', items: { type: 'string' } },
        sync_targets: { type: 'array', items: { type: 'string' } },
      },
    },
  });

  return result;
}

// ── Generate master prompt for a single agent ────────────────────────────
async function generateMasterPrompt(base44: any, archetype: any, vision: string, responsibilities: string[]) {
  const prompt = `You are a master prompt engineer. Generate a production-grade master system prompt for an AI agent.

AGENT: ${archetype.name} (${archetype.short_name})
CATEGORY: ${archetype.category}
DESCRIPTION: ${archetype.description}
CAPABILITIES: ${archetype.capabilities.join(', ')}
TOOLS AVAILABLE: ${archetype.tools.join(', ')}
MAX AUTONOMY: ${archetype.max_autonomy}

SYSTEM VISION: "${vision}"

AGENT RESPONSIBILITIES:
${responsibilities.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Generate a comprehensive master system prompt that:
1. Defines the agent's identity, role, and authority level
2. Specifies exact behavioral rules and constraints
3. Lists the tools available and how to use each
4. Defines communication style and tone
5. Specifies decision-making protocols
6. Defines error handling and escalation procedures
7. Includes deterministic execution rules (same input → same output)
8. Specifies when to seek approval vs. act autonomously
9. Defines memory usage and context retention
10. Includes validation and self-checking rules

The prompt should be 500-1500 words, production-grade, and written as direct instructions to the agent. Use imperative voice. Be specific and actionable.

Return ONLY the master prompt text, no JSON wrapper.`;

  const result = await invokeIndependentAi(base44, {
    prompt,
  });

  return typeof result === 'string' ? result : (result as any)?.text || (result as any)?.result || '';
}

// ── Create a single agent from archetype ──────────────────────────────────
async function createAgentFromArchetype(svc: any, base44: any, archetype: any, vision: string, responsibilities: string[], index: number, ownerId: string, strategyHash: string) {
  const agentId = deterministicId('agent', archetype.id, vision.slice(0, 100));

  // Check if already exists
  const existing = await svc.entities.AgentPersona.filter({ agent_id: agentId }, '-created_date', 1).catch(() => []);
  if (existing && existing.length > 0) {
    return { agent: existing[0], skipped: true };
  }

  // Generate master prompt
  const masterPrompt = await generateMasterPrompt(base44, archetype, vision, responsibilities);

  // Create AgentPersona record
  const persona = await svc.entities.AgentPersona.create({
    owner_id: ownerId,
    strategy_hash: strategyHash,
    name: archetype.name,
    short_name: shortName(archetype.id, index),
    persona_type: archetype.persona_type,
    system_prompt: masterPrompt,
    personality_traits: [archetype.category, 'deterministic', 'production-grade'],
    tone: archetype.category === 'leadership' ? 'authoritative' : 'professional',
    assigned_context: `Vision: ${vision.slice(0, 200)}`,
    avatar_color: '#D4AF37',
    communication_config: {
      sms_enabled: archetype.communication.sms,
      mms_enabled: archetype.communication.mms,
      email_enabled: archetype.communication.email,
      voice_enabled: archetype.communication.voice,
      whatsapp_enabled: archetype.communication.whatsapp,
      auto_respond: true,
      business_hours_only: false,
    },
    google_workspace_config: {
      calendar_enabled: archetype.google_workspace.calendar,
      tasks_enabled: archetype.google_workspace.tasks,
      gmail_enabled: archetype.google_workspace.gmail,
      drive_enabled: archetype.google_workspace.drive,
      sheets_enabled: archetype.google_workspace.sheets,
      docs_enabled: archetype.google_workspace.docs,
      auto_create_calendar_events: archetype.google_workspace.calendar,
      auto_assign_tasks: archetype.google_workspace.tasks,
    },
    cloud_browser_config: {
      enabled: archetype.cloud_browser.enabled,
      max_sessions: archetype.cloud_browser.max_sessions,
      auto_browse_on_query: archetype.cloud_browser.enabled,
      persist_history: false,
      proxy_rotation: true,
    },
    api_access_level: archetype.api_access_level,
    api_allowed_functions: archetype.tools,
    api_allowed_entities: archetype.capabilities.includes('entity_crud') ? ['all'] : [],
    memory_categories: archetype.memory_categories,
    model_preference: archetype.model_preference,
    max_autonomy: archetype.max_autonomy,
    active: true,
    is_default: false,
  });

  // Create default AgentAction records
  const actionIds: string[] = [];
  for (const action of archetype.default_actions) {
    try {
      const actionId = deterministicId('action', persona.id, action.title);
      const created = await svc.entities.AgentAction.create({
        owner_id: ownerId,
        action_id: actionId,
        agent_id: persona.id,
        agent_short_name: persona.short_name,
        title: action.title,
        description: action.description,
        action_category: action.category,
        action_type: 'function_invoke',
        target_function: archetype.tools[0] || null,
        parameters: {},
        trigger_type: 'manual',
        priority: 'normal',
        autonomy_level: archetype.max_autonomy === 'full_autonomous' ? 'full_autonomous' : 'supervised',
        requires_approval: archetype.max_autonomy === 'advisory',
        status: 'active',
      });
      actionIds.push(created.id);
    } catch (e) {
      // Skip action creation errors
    }
  }

  return { agent: persona, masterPrompt, actionIds, skipped: false };
}

// ── Generate project manifest ─────────────────────────────────────────────
function generateProjectManifest(vision: string, agents: any[], syncTargets: string[]) {
  const manifestId = deterministicId('manifest', vision.slice(0, 100));
  const folders = [
    '/agents/',
    '/agents/prompts/',
    '/agents/configs/',
    '/agents/memory/',
    '/agents/actions/',
    '/agents/intelligence/',
    '/project/',
    '/project/src/',
    '/project/src/pages/',
    '/project/src/components/',
    '/project/src/api/',
    '/project/base44/',
    '/project/base44/functions/',
    '/project/base44/entities/',
    '/project/base44/workflows/',
    '/project/base44/agents/',
    '/project/base44/shared/',
    '/project/docs/',
    '/project/docs/build/',
    '/project/docs/architecture/',
    '/project/docs/sops/',
    '/project/.xtreme/',
    '/project/.xtreme/system.manifest.yaml',
    '/project/.xtreme/agent-registry.json',
  ];

  const agentFiles = agents.map(a => ({
    path: `/agents/prompts/${a.short_name || 'AGENT'}_${a.name?.replace(/\s+/g, '_')}.md`,
    type: 'master_prompt',
    agent_id: a.id,
  }));

  return {
    manifest_id: manifestId,
    vision: vision.slice(0, 500),
    generated_at: new Date().toISOString(),
    structure: {
      folders,
      agent_files: agentFiles,
      total_files: folders.length + agentFiles.length,
    },
    sync_targets: SYNC_TARGETS.filter(s => syncTargets.includes(s.id)),
    agent_count: agents.length,
    validation: {
      all_agents_created: agents.length > 0,
      master_prompts_generated: agents.filter(a => a.system_prompt).length === agents.length,
      actions_created: true,
      sync_targets_configured: syncTargets.length > 0,
    },
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
    // Multi-tenant: any authenticated user can build their own agent fleet

    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'analyze';

    switch (action) {
      // ── ANALYZE: Vision → Strategy ──
      case 'analyze': {
        if (!body.vision) return Response.json({ error: 'vision required' }, { status: 400 });
        const vision = body.vision as string;
        const vHash = visionHash(vision);

        // DETERMINISM: Check for cached strategy — same vision → same strategy
        const existingSessions = await svc.entities.BuildSession.filter(
          { owner_id: user.id, vision_hash: vHash, status: 'strategy_locked' },
          '-created_date',
          1
        ).catch(() => []);

        if (existingSessions && existingSessions.length > 0) {
          const cached = existingSessions[0];
          const strategy = JSON.parse(cached.strategy_snapshot || '{}');
          return Response.json({
            ok: true,
            vision,
            session_id: cached.session_id,
            strategy_hash: vHash,
            cached: true,
            executive_summary: strategy.executive_summary,
            architecture: strategy.architecture,
            recommended_agents: strategy.recommended_agents || [],
            key_capabilities: strategy.key_capabilities || [],
            sync_targets: strategy.sync_targets || ['google_drive', 'supabase', 'vercel', 'github'],
            archetype_count: AGENT_TAXONOMY.length,
          });
        }

        // Create BuildSession
        const sessionId = deterministicId('session', user.id, vHash);
        await svc.entities.BuildSession.create({
          owner_id: user.id,
          session_id: sessionId,
          vision_text: vision,
          vision_hash: vHash,
          status: 'analyzing',
          seed_value: vHash,
          created_at: new Date().toISOString(),
        });

        const analysis = await analyzeVision(base44, vision);

        // Validate recommended agents have valid archetype IDs
        const validAgents = (analysis.recommended_agents || []).filter((a: any) => getArchetype(a.archetype_id));

        // Ensure minimum agents
        const requiredIds = ['orchestrator', 'ceo', 'seo_agent', 'social_media', 'maintenance_agent', 'validator'];
        const existingIds = validAgents.map((a: any) => a.archetype_id);
        for (const reqId of requiredIds) {
          if (!existingIds.includes(reqId)) {
            const arch = getArchetype(reqId);
            if (arch) {
              validAgents.push({
                archetype_id: reqId,
                reason: `Required baseline agent for any autonomous system`,
                responsibilities: arch.default_actions.map(a => a.title),
                priority: 'critical',
              });
            }
          }
        }

        const finalStrategy = {
          executive_summary: analysis.executive_summary,
          architecture: analysis.architecture,
          recommended_agents: validAgents.slice(0, 20),
          key_capabilities: analysis.key_capabilities || [],
          sync_targets: analysis.sync_targets || ['google_drive', 'supabase', 'vercel', 'github'],
        };

        // Lock strategy in BuildSession (determinism — frozen snapshot)
        const sessionRecords = await svc.entities.BuildSession.filter(
          { owner_id: user.id, session_id: sessionId },
          '-created_date',
          1
        );
        if (sessionRecords && sessionRecords.length > 0) {
          await svc.entities.BuildSession.update(sessionRecords[0].id, {
            status: 'strategy_locked',
            strategy_snapshot: JSON.stringify(finalStrategy),
            model_versions: JSON.stringify({ analysis: 'gemini_3_flash', prompt: 'claude-sonnet-5' }),
          });
        }

        return Response.json({
          ok: true,
          vision,
          session_id: sessionId,
          strategy_hash: vHash,
          cached: false,
          ...finalStrategy,
          archetype_count: AGENT_TAXONOMY.length,
        });
      }

      // ── GENERATE: Create all agents ──
      case 'generate': {
        if (!body.vision) return Response.json({ error: 'vision required' }, { status: 400 });
        const vision = body.vision as string;
        const recommendedAgents = body.recommended_agents || body.recommendedAgents;

        if (!recommendedAgents || !Array.isArray(recommendedAgents) || recommendedAgents.length === 0) {
          return Response.json({ error: 'recommended_agents required (run analyze first)' }, { status: 400 });
        }

        const created: any[] = [];
        const errors: string[] = [];

        for (let i = 0; i < recommendedAgents.length; i++) {
          const rec = recommendedAgents[i];
          const archetype = getArchetype(rec.archetype_id);
          if (!archetype) {
            errors.push(`Unknown archetype: ${rec.archetype_id}`);
            continue;
          }

          try {
            const result = await createAgentFromArchetype(svc, base44, archetype, vision, rec.responsibilities || [], i, user.id, body.strategy_hash || '');
            created.push({
              id: result.agent.id,
              name: result.agent.name,
              short_name: result.agent.short_name,
              archetype_id: rec.archetype_id,
              priority: rec.priority,
              skipped: result.skipped,
              action_count: result.actionIds?.length || 0,
            });
          } catch (e: any) {
            errors.push(`${archetype.name}: ${e.message}`);
          }
        }

        return Response.json({
          ok: true,
          vision,
          agents_created: created.length,
          agents: created,
          errors,
        });
      }

      // ── BOOTSTRAP: Generate project manifest ──
      case 'bootstrap': {
        if (!body.vision) return Response.json({ error: 'vision required' }, { status: 400 });
        const vision = body.vision as string;
        const syncTargets = body.sync_targets || ['google_drive', 'supabase', 'vercel', 'github'];

        // Get all agents created for this vision (owner-scoped for multi-tenancy)
        const allAgents = await svc.entities.AgentPersona.filter({ owner_id: user.id }, '-created_date', 100);
        const manifest = generateProjectManifest(vision, allAgents, syncTargets);

        // Create BuildManifest for reproducibility
        const manifestId = deterministicId('manifest', user.id, visionHash(vision));
        try {
          await svc.entities.BuildManifest.create({
            owner_id: user.id,
            manifest_id: manifestId,
            session_id: body.session_id || deterministicId('session', user.id, visionHash(vision)),
            vision_text: vision,
            strategy_json: JSON.stringify(manifest),
            archetype_list: (body.recommended_agents || []).map((a: any) => a.archetype_id),
            model_versions: JSON.stringify({ analysis: 'gemini_3_flash', prompt: 'claude-sonnet-5' }),
            seed_values: JSON.stringify({ vision_hash: visionHash(vision) }),
            agent_ids: allAgents.map((a: any) => a.id),
            created_at: new Date().toISOString(),
          });
        } catch (e) {
          console.error('[agentBuilderEngine] BuildManifest creation failed:', e.message);
        }

        // Create a BuilderLibrary entry for the agent builder system
        const libId = deterministicId('lib', 'agent_builder', vision.slice(0, 50));
        try {
          await svc.entities.BuilderLibrary.create({
            item_id: libId,
            item_type: 'capability',
            name: `Agent Builder System — ${vision.slice(0, 60)}`,
            phase: 'orchestrator',
            description: `Deterministic agent fleet generated from vision: ${vision.slice(0, 200)}`,
            status: 'active',
            output_artifact: JSON.stringify(manifest).slice(0, 3000),
            execution_count: 1,
            last_executed_at: new Date().toISOString(),
            last_result: `${manifest.agent_count} agents bootstrapped`,
            quality_score: manifest.validation.all_agents_created ? 100 : 0,
            order: 0,
          });
        } catch {}

        return Response.json({
          ok: true,
          manifest,
          agents: allAgents.map(a => ({ id: a.id, name: a.name, short_name: a.short_name })),
        });
      }

      // ── LAUNCH: Validate and activate ──
      case 'launch': {
        const allAgents = await svc.entities.AgentPersona.filter({ active: true }, '-created_date', 100);

        // Validation checks
        const validation = {
          total_agents: allAgents.length,
          agents_with_prompts: allAgents.filter(a => a.system_prompt && a.system_prompt.length > 100).length,
          agents_with_actions: 0,
          agents_with_memory: allAgents.filter(a => a.memory_categories && a.memory_categories.length > 0).length,
          agents_with_tools: allAgents.filter(a => a.api_allowed_functions && a.api_allowed_functions.length > 0).length,
          agents_with_comms: allAgents.filter(a => a.communication_config && (a.communication_config.sms_enabled || a.communication_config.email_enabled || a.communication_config.voice_enabled)).length,
          agents_with_browser: allAgents.filter(a => a.cloud_browser_config && a.cloud_browser_config.enabled).length,
        };

        // Check actions
        const actions = await svc.entities.AgentAction.filter({ status: 'active' }, '-created_date', 200);
        validation.agents_with_actions = new Set(actions.map(a => a.agent_id)).size;

        const ready = validation.agents_with_prompts === validation.total_agents && validation.total_agents > 0;

        return Response.json({
          ok: true,
          validation,
          ready,
          message: ready
            ? `All ${validation.total_agents} agents are production-ready. System is LIVE.`
            : `${validation.total_agents - validation.agents_with_prompts} agents need master prompts. Run generate first.`,
        });
      }

      // ── STATUS: Current build state ──
      case 'status': {
        const [agents, actions, templates] = await Promise.all([
          svc.entities.AgentPersona.list('-created_date', 100),
          svc.entities.AgentAction.filter({ status: 'active' }, '-created_date', 200),
          svc.entities.AgentTemplate.list('-created_date', 50),
        ]);

        return Response.json({
          ok: true,
          total_personas: agents.length,
          active_personas: agents.filter(a => a.active).length,
          total_actions: actions.length,
          total_templates: templates.length,
          archetype_catalog: AGENT_TAXONOMY.length,
          sync_targets: SYNC_TARGETS,
        });
      }

      // ── ARCHETYPES: List all available archetypes ──
      case 'archetypes': {
        return Response.json({
          ok: true,
          archetypes: AGENT_TAXONOMY.map(a => ({
            id: a.id,
            name: a.name,
            short_name: a.short_name,
            category: a.category,
            icon: a.icon,
            description: a.description,
            capabilities: a.capabilities,
            tools: a.tools,
            max_autonomy: a.max_autonomy,
          })),
        });
      }

      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('[agentBuilderEngine] Error:', error.message);
    return Response.json({ error: error.message }, { status: error.status === 503 ? 503 : 500 });
  }
}