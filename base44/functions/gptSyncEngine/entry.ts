import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { completeGateway } from '../../shared/aiGateway.ts';
import { executeHostedTool } from '../../shared/operatorHosted.js';
import {
  captureSnapshot,
  logSyncEvent,
  getPendingEvents,
  runSyncCycle,
  runTakeover,
} from '../../shared/gptSyncCore.ts';

// ─────────────────────────────────────────────────────────────────────────────
// gptSyncEngine — Bi-directional sync between the admin and GPT.
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
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });
    const svc = base44.asServiceRole;

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'stats';

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
      const [pending, synced, total] = await Promise.all([
        svc.entities.SyncEvent.count({ status: 'pending' }),
        svc.entities.SyncEvent.count({ status: 'synced' }),
        svc.entities.SyncEvent.count({}),
      ]);
      const recent = await svc.entities.SyncEvent.filter({}, '-created_date', 10);
      const lastSynced = recent.find(e => e.status === 'synced');
      return Response.json({
        ok: true,
        stats: {
          pending,
          synced,
          total,
          last_sync: lastSynced?.synced_at || null,
        },
        recent,
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