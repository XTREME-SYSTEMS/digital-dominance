import { readFileSync } from 'node:fs';

// Read-only, deterministic X1 runtime snapshot evaluator. No provider calls.
export function audit(snapshot) {
  const statuses = Object.fromEntries((snapshot.queue_statuses || []).map(x => [x.status, Number(x.n)]));
  const errors = (snapshot.error_groups || []).map(x => ({ status:x.status, code:x.last_error_code || 'UNSPECIFIED', count:Number(x.n) }));
  const latest = snapshot.latest_heartbeat || {};
  const worker = snapshot.latest_execution || {};
  const sensorOnly = latest.health?.mode === 'SENSOR_ONLY' || latest.health?.lease_requested === false;
  return {
    schema_version:'x1-snapshot-audit/v1',
    telemetry:latest.observed_at ? 'OBSERVED' : 'UNKNOWN',
    sensor_only:sensorOnly,
    historical_execution_receipt_verified:Boolean(worker.task_id && worker.lease_id && worker.receipt_id && worker.state === 'COMPLETED'),
    worker_identity:worker.agent_id || null,
    last_execution:worker.task_id || null,
    queue:{...statuses, unresolved:(statuses.BLOCKED || 0)+(statuses.DEAD_LETTER || 0)},
    error_groups:errors,
    auto_requeue_permitted:false,
    next_gate:sensorOnly ? 'PROVE_ACTIVE_WORKER_LEASE_AND_RECEIPT' : 'INDEPENDENT_RUNTIME_REVIEW',
    note:'Historical completion does not prove continuously executing missions; no dead-letter replay.'
  };
}
if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) {
  if (!process.argv[2]) { console.error('Usage: node audit-x1-snapshot.mjs snapshot.json'); process.exitCode=2; }
  else process.stdout.write(JSON.stringify(audit(JSON.parse(readFileSync(process.argv[2], 'utf8'))), null, 2)+'\n');
}
