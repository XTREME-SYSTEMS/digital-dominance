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
import {authorizeSyncAction, SAFE_SYNC_ENTITIES, sanitizeSyncEvent, scrubSyncData, boundedLimit, SYNC_CONTRACT_VERSION} from '../../shared/gptSyncGuard.js';

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

    // ── Auth: API key (external GPT) OR admin session (dashboard) ──
    const authHeader = req.headers.get('authorization') || '';
    const bearerKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const body = await req.json().catch(() => ({}));
    // External credentials must be sent in the Authorization header, never in JSON payloads.
    const apiKey = bearerKey;
    const syncKey = secrets.get('GPT_SYNC_API_KEY') || '';
    let isApiKeyAuth = false;
    if (syncKey && apiKey) {
      const hashes = await Promise.all([apiKey, syncKey].map(async (key) =>
        new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key)))));
      let mismatch = 0;
      for (let i = 0; i < 32; i++) mismatch |= hashes[0][i] ^ hashes[1][i];
      isApiKeyAuth = mismatch === 0;
    }

    let svc;
    if (isApiKeyAuth) {
      // External GPT authenticated via API key — use service role directly
      svc = base44.asServiceRole;
    } else {
      // Dashboard path — require admin session
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });
      svc = base44.asServiceRole;
    }
    const action = body.action || 'stats';
    // Preview-only. Deny all mutations and LLM execution loops on this branch.
    const permission = authorizeSyncAction(action, body);
    if (!permission.allowed) return Response.json({ ok: false, state: 'PENDING_APPROVAL', code: permission.reason }, { status: 403 });

    // ── getConfig: Return full sync config JSON for external GPT ──
    if (action === 'getConfig') {
      const githubRepo = secrets.get('GITHUB_REPO') || 'XTREME-SYSTEMS/digital-dominance';
      const config = {
        system_name: 'Digital Dominance GPT Sync Pipeline',
        version: SYNC_CONTRACT_VERSION,
        github_repo: `https://github.com/${githubRepo}.git`,
        sync_endpoint: 'gptSyncEngine',
        endpoint_url: 'https://unlimitedwebsites.base44.app/functions/gptSyncEngine',
        execution_model: 'Base44 SDK (server-side, authenticated as admin or API key)',
        authentication: {
          method: 'Bearer token (API key)',
          header: 'Authorization: Bearer <GPT_SYNC_API_KEY>',
          alternative: 'No credential values are accepted in request bodies. Use an authenticated provider connection.',
          note: 'The external bearer key is limited to read-only metadata access in this branch. Writes need a separate approved adapter.',
        },
        sdk_instructions: 'The Base44 SDK remains server-side; no SDK or credential in a GPT prompt. This preview allows only a small metadata-read tool set and never invokes provider write functions.',
        sync_actions: {
          execute: 'POST action=execute for get_capabilities or allowlisted read_entities only. write_entity and invoke_function are blocked.',
          takeOver: 'BLOCKED in read-only branch preview. Requires server-verified approval and an independently tested write adapter.',
          sync: 'BLOCKED until guarded durable bidirectional handoff validation; use previewSync for safe inspection.',
          getPending: 'POST action=getPending; returns read-only bounded event metadata, never auto-seeds a snapshot.',
          previewSync: 'POST action=previewSync; read-only handoff preflight with no provider mutations.',
          snapshot: 'BLOCKED in read-only branch preview; old snapshot implementation writes an event.',
          logEvent: 'BLOCKED pending authenticated, tenant-scoped draft-event adapter.',
          stats: 'POST { action: "stats" } — Sync statistics',
          listEvents: 'POST { action: "listEvents", status?, direction?, limit? } — List recent sync events',
        },
        operator_instructions: 'GPT SYNC READ-ONLY PREVIEW: inspect event metadata and propose versioned changes. Never call write_entity, invoke_function, takeOver, sync, snapshot or logEvent. No action is deployed.',
        operator_entities: SAFE_SYNC_ENTITIES,
        operator_functions: {},
        operator_tools: operatorTools.filter(t => ['get_capabilities','read_entities'].includes(t.function.name)),
        execution_protocol: {
          step_1: 'Call getPending to read any pending admin events (live context).',
          step_2: 'Read allowlisted metadata using execute or previewSync; do not submit provider mutations.',
          step_3: 'Compile a signed-off proposal outside the live endpoint, then wait for an approved write adapter.',
          step_4: 'Use immutable evidence receipts; metadata reads do not establish a completed write.',
        },
        runtime: 'base44-sdk (branch preview, metadata read-only)',
        llm_gateway: 'Internal takeover/sync is disabled in this branch preview. Model routing is not evaluated.',
      };
      return Response.json({ ok: true, config });
    }

    // ── execute: External GPT calls a hosted tool via the Base44 SDK ──
    if (action === 'execute') {
      const { tool, args } = body;
      if (!tool) return Response.json({ error: 'tool required' }, { status: 400 });
      if (tool === 'get_capabilities') {
        return Response.json({ ok: true, tool, scope: 'read_only', entities: SAFE_SYNC_ENTITIES, actions: ['getConfig','stats','listEvents','getPending','previewSync','execute'] });
      }
      const result = await executeHostedTool(base44, tool, args || {});
      return Response.json({ ok: true, tool, scope: 'read_only', result: scrubSyncData(result) });
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
    if (action === 'getPending' || action === 'previewSync') {
      // Avoid gptSyncCore.getPendingEvents: it creates a SyncEvent when none exist.
      const raw = await svc.entities.SyncEvent.filter({ status: 'pending', direction: 'to_gpt' }, '-created_date', 20);
      const events = (Array.isArray(raw) ? raw : (raw?.items || [])).map(sanitizeSyncEvent);
      return Response.json({
        ok: true, state: 'READ_ONLY_PREVIEW', action, count: events.length, events,
        provider_writes: 0, llm_calls: 0, source_repo: 'XTREME-SYSTEMS/digital-dominance',
        next: 'Review evidence and produce a versioned PENDING_REVIEW handoff before applying changes.',
      });
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
        recent: allEvents.slice(0, 10).map(sanitizeSyncEvent),
        sampled_records: allEvents.length,
        sample_is_not_total: true,
      });
    }

    // ── listEvents: List recent sync events ──
    if (action === 'listEvents') {
      const { status, direction, limit = 50 } = body;
      const filter: any = {};
      if (status) filter.status = status;
      if (direction) filter.direction = direction;
      const raw = await svc.entities.SyncEvent.filter(filter, '-created_date', boundedLimit(limit));
      const events = (Array.isArray(raw) ? raw : (raw?.items || [])).map(sanitizeSyncEvent);
      return Response.json({ ok: true, count: events.length, events, scope: 'read_only' });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('[gptSyncEngine] Error:', error.message);
    return Response.json({ error: 'GPT_SYNC_OPERATION_FAILED', state: 'UNKNOWN' }, { status: 500 });
  }
}