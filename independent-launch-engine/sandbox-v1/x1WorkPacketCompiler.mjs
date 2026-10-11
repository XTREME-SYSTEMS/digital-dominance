/** 
 * Strategic Minds AI V2: deterministic, side-effect-free X1 staging bridge.
 * Converts approved safe MissionSpec tasks into existing X1 queue rows.
 * This module NEVER invokes a provider or writes to any database.
 */
import { createHash } from 'node:crypto';

const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const SHA = /^[a-f0-9]{40}$/;
const TASK_ID = /^[a-zA-Z0-9_-]{2,80}$/;
const RISK = Object.freeze({
  READ_ONLY: 'READ_ONLY',
  NON_PRODUCTION_MUTATION: 'NON_PRODUCTION_MUTATION',
});
const CAPABILITIES = new Set([
  'source.research', 'content.draft', 'website.preview', 'website.validate',
  'sandbox.fs', 'sandbox.browser', 'sandbox.test', 'agent.plan',
]);

function check(ok, message) { if (!ok) throw new Error(message); }
function digest(value) { return createHash('sha256').update(value).digest('hex'); }

export function compileX1StagingPackets(mission, { tenantUuid, requestedBy = 'gpt_orchestrator' } = {}) {
  check(mission && mission.schema === 'dd.mission.v1', 'mission schema mismatch');
  check(['SCOPE_APPROVED', 'QUEUED'].includes(mission.state), 'safe scope must be approved first');
  check(UUID.test(tenantUuid || ''), 'verified tenant UUID required');
  check(typeof mission.tenant_id === 'string' && mission.tenant_id.length > 5, 'mission tenant missing');
  check(SHA.test(mission.source_sha || ''), 'source commit SHA required');
  check(/^[a-zA-Z0-9_-]{4,100}$/.test(mission.mission_id || ''), 'mission ID invalid');
  check(typeof mission.plan_hash === 'string' && /^[a-f0-9]{64}$/.test(mission.plan_hash), 'plan hash missing');
  check(typeof mission.approval_id === 'string' && mission.approval_id.length > 5, 'approval receipt required');
  check(Array.isArray(mission.plan?.tasks) && mission.plan.tasks.length > 0 && mission.plan.tasks.length <= 40, 'bounded plan required');
  check(Number.isInteger(mission.max_repairs) && mission.max_repairs >= 0 && mission.max_repairs <= 3, 'repair budget invalid');
  check(mission.spent_usd === 0 && mission.budget_usd === 0, 'staging demo must not authorize spend');
  check(typeof requestedBy === 'string' && /^[a-zA-Z0-9_-]{4,80}$/.test(requestedBy), 'requester invalid');

  const seen = new Set();
  const tasks = mission.plan.tasks;
  for (const task of tasks) {
    check(TASK_ID.test(task.id || '') && !seen.has(task.id), 'duplicate or invalid task ID');
    seen.add(task.id);
    check(Object.hasOwn(RISK, task.risk), 'protected or unknown action blocked');
    check(Array.isArray(task.depends_on), 'dependencies required');
    check(typeof task.acceptance_test === 'string' && task.acceptance_test.trim().length > 0 && task.acceptance_test.length <= 1000, 'acceptance test required');
    check(Array.isArray(task.capabilities || []), 'capability list invalid');
    check((task.capabilities || []).every(c => CAPABILITIES.has(c)), 'unapproved capability blocked');
  }
  const visiting = new Set(), visited = new Set();
  function visit(id) {
    check(seen.has(id), 'unknown dependency');
    if (visited.has(id)) return;
    check(!visiting.has(id), 'cyclic dependency');
    visiting.add(id);
    const t = tasks.find(x => x.id === id);
    for (const dep of t.depends_on) { check(dep !== id, 'self dependency'); visit(dep); }
    visiting.delete(id); visited.add(id);
  }
  for (const task of tasks) visit(task.id);

  return tasks.map((task, sequence) => {
    const dedupe = digest(JSON.stringify({tenantUuid, mission_id: mission.mission_id, source_sha: mission.source_sha,
      plan_hash: mission.plan_hash, task_id: task.id}));
    return {
      tenant_id: tenantUuid,
      work_packet_id: mission.mission_id,
      mission_id: mission.mission_id,
      task_id: task.id,
      requested_by: requestedBy,
      action_class: RISK[task.risk],
      required_capabilities: [...new Set(task.capabilities || [])],
      payload: {
        schema: 'smai.v2.sandbox.task.v1',
        sandbox_mode: 'ISOLATED_PREVIEW',
        execution_enabled: false,
        external_writes_enabled: false,
        source_tenant_ref: mission.tenant_id,
        project_ref: mission.project_id || null,
        depends_on: task.depends_on,
        acceptance_test: task.acceptance_test,
        sequence,
        plan_hash: mission.plan_hash,
        approval_reference: mission.approval_id,
      },
      source_sha: mission.source_sha,
      idempotency_key: dedupe,
      status: 'PENDING',
      priority: 50,
      max_attempts: Math.max(1, Math.min(mission.max_repairs + 1, 4)),
      approval_reference: mission.approval_id,
      rollback_reference: 'branch:' + mission.source_sha,
    };
  });
}
