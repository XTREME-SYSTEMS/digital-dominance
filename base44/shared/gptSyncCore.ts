import { operatorEntities, operatorFunctions } from './operatorCatalog.js';
import { runOperator } from './operatorLoop.js';
import { executeHostedTool } from './operatorHosted.js';

// ─────────────────────────────────────────────────────────────────────────────
// gptSyncCore — Bi-directional sync engine shared logic.
//
// Direction 1 (Admin → GPT): admin state changes are logged as SyncEvents.
//   GPT reads pending events to get live context about what's happening.
//
// Direction 2 (GPT → Admin): GPT runs the operator loop with that context,
//   executing commands (read/write entities, invoke functions). Those
//   command results create new SyncEvents, completing the bi-directional loop.
// ─────────────────────────────────────────────────────────────────────────────

// Key entities to snapshot — the ones GPT needs context on to "take over"
const SNAPSHOT_ENTITIES = [
  'Lead', 'WebsiteTemplate', 'MassLaunchBatch', 'ProgrammaticTarget',
  'SwarmTask', 'CommandRun', 'DynamicPage', 'IngestedWebsite',
  'DominanceCampaign', 'WebsiteQueue', 'ClientProject', 'AgentPersona',
];

export async function captureSnapshot(svc) {
  const counts = {};
  for (const entity of SNAPSHOT_ENTITIES) {
    try {
      counts[entity] = await svc.entities[entity].count({});
    } catch {
      counts[entity] = 'unavailable';
    }
  }
  return counts;
}

export async function logSyncEvent(svc, event) {
  return await svc.entities.SyncEvent.create({
    event_type: event.event_type || 'state_snapshot',
    entity_name: event.entity_name || '',
    record_id: event.record_id || '',
    action: event.action || '',
    data_summary: (event.data_summary || '').slice(0, 2000),
    source: event.source || 'sync_engine',
    direction: event.direction || 'to_gpt',
    status: event.status || 'pending',
    gpt_context: (event.gpt_context || '').slice(0, 5000),
    gpt_response: (event.gpt_response || '').slice(0, 5000),
    synced_at: event.synced_at,
    processed_at: event.processed_at,
  });
}

export async function getPendingEvents(svc, sinceId) {
  const query = { status: 'pending', direction: 'to_gpt' };
  const records = await svc.entities.SyncEvent.filter(query, '-created_date', 50);
  return records;
}

export async function markSynced(svc, eventIds, gptResponse) {
  const now = new Date().toISOString();
  for (const id of eventIds) {
    await svc.entities.SyncEvent.update(id, {
      status: 'synced',
      synced_at: now,
      gpt_response: (gptResponse || '').slice(0, 5000),
    });
  }
}

// Build a context string from pending events for GPT
export function buildGptContext(events, snapshot) {
  const lines = [];
  if (snapshot) {
    lines.push('=== CURRENT ADMIN STATE SNAPSHOT ===');
    for (const [entity, count] of Object.entries(snapshot)) {
      lines.push(`- ${entity}: ${count} records`);
    }
    lines.push('');
  }
  if (events.length > 0) {
    lines.push('=== PENDING ADMIN EVENTS (since last sync) ===');
    for (const e of events) {
      const time = new Date(e.created_date).toISOString();
      lines.push(`[${time}] ${e.event_type} · ${e.entity_name || e.action || 'system'} · ${e.data_summary || 'no details'}`);
    }
  }
  return lines.join('\n');
}

// The bi-directional sync cycle:
// 1. Read pending admin events
// 2. Capture state snapshot
// 3. Send context to GPT via operator loop
// 4. GPT executes commands (which create new events)
// 5. Mark original events as synced
export async function runSyncCycle(svc, complete, execute, options = {}) {
  const events = await getPendingEvents(svc);
  const snapshot = await captureSnapshot(svc);
  const context = buildGptContext(events, snapshot);

  // Log the sync cycle itself
  await logSyncEvent(svc, {
    event_type: 'sync_cycle',
    action: 'sync',
    data_summary: `${events.length} pending events processed`,
    source: 'sync_engine',
    direction: 'internal',
    status: 'processed',
    processed_at: new Date().toISOString(),
  });

  // If GPT has a command to run, run the operator loop with full context
  let gptResult = null;
  if (options.command) {
    const fullMessage = `${options.command}\n\n=== LIVE ADMIN CONTEXT ===\n${context}`;
    gptResult = await runOperator({
      message: fullMessage,
      history: options.history || [],
      runtime: 'base44-hosted',
      complete,
      execute,
    });

    // Log GPT's response as a from_gpt event
    await logSyncEvent(svc, {
      event_type: 'gpt_response',
      action: 'operator_chat',
      data_summary: (gptResult.text || '').slice(0, 2000),
      source: 'gpt',
      direction: 'from_gpt',
      status: 'processed',
      gpt_response: (gptResult.text || '').slice(0, 5000),
      processed_at: new Date().toISOString(),
    });
  }

  // Mark the original pending events as synced
  const eventIds = events.map(e => e.id);
  await markSynced(svc, eventIds, gptResult?.text || 'Synced without GPT command');

  return {
    ok: true,
    events_processed: events.length,
    snapshot,
    gpt_result: gptResult,
    context_length: context.length,
  };
}

// GPT takeover: full state + pending events + operator loop with complete context
export async function runTakeover(svc, complete, execute, command, history = []) {
  const events = await getPendingEvents(svc);
  const snapshot = await captureSnapshot(svc);
  const context = buildGptContext(events, snapshot);

  // Log the takeover command
  await logSyncEvent(svc, {
    event_type: 'gpt_command',
    action: 'takeover',
    data_summary: command.slice(0, 2000),
    source: 'gpt',
    direction: 'from_gpt',
    status: 'processed',
    processed_at: new Date().toISOString(),
  });

  const fullMessage = `${command}\n\n=== LIVE ADMIN CONTEXT (TAKEOVER MODE) ===\nYou now have full context of the admin state. Use it to execute the command above. All entities and functions are available via your tools.\n\n${context}`;

  const result = await runOperator({
    message: fullMessage,
    history,
    runtime: 'base44-hosted',
    complete,
    execute,
  });

  // Log the response
  await logSyncEvent(svc, {
    event_type: 'gpt_response',
    action: 'takeover_result',
    data_summary: (result.text || '').slice(0, 2000),
    source: 'gpt',
    direction: 'from_gpt',
    status: 'processed',
    gpt_response: (result.text || '').slice(0, 5000),
    processed_at: new Date().toISOString(),
  });

  // Mark pending events as synced
  const eventIds = events.map(e => e.id);
  await markSynced(svc, eventIds, result.text || 'Takeover complete');

  return {
    ok: true,
    result,
    events_processed: events.length,
    snapshot,
  };
}