import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { completeGateway } from '../../shared/openRouterGateway.ts';
import { executeHostedTool } from '../../shared/operatorHosted.js';
import {
  captureSnapshot,
  logSyncEvent,
  getPendingEvents,
  runSyncCycle,
  runTakeover,
} from '../../shared/gptSyncCore.ts';
import { operatorEntities, operatorFunctions, operatorInstructions } from '../../shared/operatorCatalog.js';
import { operatorTools } from '../../shared/operatorLoop.js';

// ─────────────────────────────────────────────────────────────────────────────
// gptSyncEngine — Bi-directional sync between the admin and GPT. v2
//
// Actions:
//   logEvent     — Log an admin state change (Admin → GPT direction)
//   getPending   — Get pending events GPT hasn't seen yet
//   snapshot     — Capture current admin state snapshot
//   sync         — Run a bi-directional sync cycle (events → GPT → commands)
//   takeOver     — GPT takes over with full context + operator loop
//   stats        — Sync statistics (pending, synced, total, last sync)
//   listEvents   — List recent sync events
// ─────────────────────────────────────────────────────────────────────────────

export default async function(req: Request): Promise<Response> {
  try {
    const { secrets } = await import('base44:runtime');
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });
    const svc = base44.asServiceRole;

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'stats';

    // ── getConfig: Return full sync config JSON for external GPT ──
    if (action === 'getConfig') {
      const githubRepo = secrets.get('GITHUB_REPO') || 'XTREME-SYSTEMS/digital-dominance';
      const config = {
        system_name: 'Digital Dominance GPT Sync Pipeline',
        version: '3.0',
        github_repo: `https://github.com/${githubRepo}.git`,
        sync_endpoint: 'gptSyncEngine',
        execution_model: 'Base44 SDK (server-side, authenticated as admin)',
        sdk_instructions: 'The Base44 SDK is initialized server-side inside the gptSyncEngine function. The external GPT does NOT install the SDK directly. Instead, it calls the execute action below, which authenticates via the SDK and runs typed entity operations and backend function invocations on the GPT\'s behalf.',
        sync_actions: {
          execute: 'POST { action: "execute", tool: "<tool_name>", args: { entity, operation, data, function_name, payload, query, id, count_only, cursor } } — Execute a hosted tool via the Base44 SDK. This is the primary execution path. Available tools: get_capabilities, read_entities, write_entity, invoke_function.',
          takeOver: 'POST { action: "takeOver", command: "<your command>" } — GPT executes with full admin context via the internal operator loop',
          sync: 'POST { action: "sync", command: "<optional>" } — Bi-directional sync cycle',
          getPending: 'POST { action: "getPending" } — Get pending admin events for GPT context (auto-seeds a snapshot if empty)',
          snapshot: 'POST { action: "snapshot" } — Capture current admin state',
          logEvent: 'POST { action: "logEvent", event_type, entity_name, data_summary, direction } — Log a state change',
          stats: 'POST { action: "stats" } — Sync statistics',
          listEvents: 'POST { action: "listEvents", status?, direction?, limit? } — List recent sync events',
        },
        operator_instructions: operatorInstructions,
        operator_entities: operatorEntities,
        operator_functions: operatorFunctions,
        operator_tools: operatorTools,
        execution_protocol: {
          step_1: 'Call getPending to read any pending admin events (live context).',
          step_2: 'Call execute with a tool name and args to run any entity operation or backend function. The Base44 SDK authenticates as admin and returns typed results.',
          step_3: 'Call logEvent to record what you did (direction: "from_gpt") so the admin dashboard sees your actions.',
          step_4: 'Repeat until the command is complete. Every action must produce a tool receipt.',
        },
        runtime: 'base44-sdk (authenticated server-side)',
        llm_gateway: 'groq (llama-3.3-70b-versatile) with openrouter fallback — used only for internal takeOver/sync operator loop. External GPTs use their own LLM and call execute for tool operations.',
      };
      return Response.json({ ok: true, config });
    }

    // ── execute: External GPT calls a hosted tool via the Base44 SDK ──
    if (action === 'execute') {
      const { tool, args } = body;
      if (!tool) return Response.json({ error: 'tool required' }, { status: 400 });
      const result = await executeHostedTool(base44, tool, args || {});
      return Response.json({ ok: true, tool, result });
    }

    // ── logEvent: Log an admin state change ──
    if (action === 'logEvent') {
      const event = await logSyncEvent(svc, {
        event_type: body.event_type || 'entity_update',
        entity_name: body.entity_name || '',
        record_id: body.record_id || '',
        action: body.action_name || '',
        data_summary: body.data_summary || '',
        source: body.source || 'admin_ui',
        direction: body.direction || 'to_gpt',
        status: 'pending',
        gpt_context: body.gpt_context || '',
      });
      return Response.json({ ok: true, event });
    }

    // ── getPending: Get pending events for GPT ──
    if (action === 'getPending') {
      const events = await getPendingEvents(svc);
      return Response.json({ ok: true, count: events.length, events });
    }

    // ── snapshot: Capture current admin state ──
    if (action === 'snapshot') {
      const snapshot = await captureSnapshot(svc);
      await logSyncEvent(svc, {
        event_type: 'state_snapshot',
        action: 'snapshot',
        data_summary: JSON.stringify(snapshot).slice(0, 2000),
        source: 'sync_engine',
        direction: 'to_gpt',
        status: 'pending',
      });
      return Response.json({ ok: true, snapshot });
    }

    // ── sync: Run a bi-directional sync cycle ──
    if (action === 'sync') {
      const result = await runSyncCycle(svc,
        payload => completeGateway({ model: 'anthropic/claude-opus-4.7', ...payload }),
        (name, args) => executeHostedTool(base44, name, args),
        { command: body.command, history: body.history || [] }
      );
      return Response.json(result);
    }

    // ── takeOver: GPT takes over with full context ──
    if (action === 'takeOver') {
      if (!body.command) return Response.json({ error: 'command required' }, { status: 400 });
      const result = await runTakeover(svc,
        payload => completeGateway({ model: 'anthropic/claude-opus-4.7', ...payload }),
        (name, args) => executeHostedTool(base44, name, args),
        body.command,
        body.history || []
      );
      return Response.json(result);
    }

    // ── stats: Sync statistics ──
    if (action === 'stats') {
      const allEvents = await svc.entities.SyncEvent.filter({}, '-created_date', 100);
      const pending = allEvents.filter(e => e.status === 'pending').length;
      const synced = allEvents.filter(e => e.status === 'synced').length;
      const total = allEvents.length;
      const lastSynced = allEvents.find(e => e.status === 'synced');
      return Response.json({
        ok: true,
        stats: {
          pending,
          synced,
          total,
          last_sync: lastSynced?.synced_at || null,
        },
        recent: allEvents.slice(0, 10),
      });
    }

    // ── listEvents: List recent sync events ──
    if (action === 'listEvents') {
      const { status, direction, limit = 50 } = body;
      const filter: any = {};
      if (status) filter.status = status;
      if (direction) filter.direction = direction;
      const events = await svc.entities.SyncEvent.filter(filter, '-created_date', limit);
      return Response.json({ ok: true, count: events.length, events });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('[gptSyncEngine] Error:', error.message);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}