import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const path = new URL('../docs/god-mode-commander/mission.v1.json', import.meta.url);
const contract = JSON.parse(readFileSync(path, 'utf8'));

function validate(c) {
  assert.equal(c.schema_version, 'strategic-minds.god-mode-commander.mission/1.0.0');
  assert.equal(c.identity.mission_key, 'GOD_MODE_INTELLIGENCE_V1');
  assert.equal(c.identity.activation_state, 'DISABLED', 'must not autoactivate');
  assert.equal(c.identity.deployment_state, 'NOT_DEPLOYED', 'must not claim deployed worker');
  assert.equal(c.authority.operator_selected_primary_repo, 'XTREME-SYSTEMS/digital-dominance');
  assert.match(c.authority.repo_baseline_sha, /^[0-9a-f]{40}$/);
  assert.equal(c.authority.base44_superagent_bridge_app_id, '6a4ae522852a5e08bfa42450');
  assert.equal(c.authority.base44_bidirectional_last_run, 'UNKNOWN_NULL');
  assert.equal(c.governance.default_action_class, 'READ');
  assert.equal(c.governance.automatic_activation, false);
  assert.equal(c.governance.new_scheduler_provisioning, false);
  assert.equal(c.governance.new_queue_provisioning, false);
  assert.equal(c.governance.new_supervisor_provisioning, false);
  assert.equal(c.governance.max_unapproved_external_spend_usd, 0);
  assert.equal(c.bidirectional_sync_contract.main_branch_direct_push, false);
  assert.equal(c.simulation_contract.execution_state, 'NOT_EXECUTED_BY_WORKER');
  assert.equal(c.simulation_contract.determinism, 'fixed_input_grid_no_sampling');
  assert.equal(c.candidate_acquisition_models.length, 10);
  const n = c.simulation_contract.scenario_axes.reduce((acc, axis) => acc * axis.count, 1);
  assert.ok(n >= 1000 && n >= c.simulation_contract.minimum_actual_evaluations, 'require 1,000+ planned cases');
  assert.ok(c.workflow.execution_pattern.includes('IDEMPOTENT_X1_LEASE'));
  assert.ok(c.workflow.execution_pattern.includes('INDEPENDENT_QA'));
  for (const action of ['PRODUCTION_DEPLOY','DATABASE_SCHEMA_OR_RLS','SECRETS','SPEND','CUSTOMER_OUTBOUND','LIVE_PUBLISH','PROTECTED_BRANCH_MERGE']) {
    assert.ok(c.governance.explicit_approval_required.includes(action), 'missing approval gate: ' + action);
  }
  for (const file of c.input_packages) {
    assert.match(file.sha256, /^[0-9a-f]{64}$/, 'bad SHA-256 fingerprint: ' + file.name);
  }
  assert.equal(c.acceptance_gates.length, 8);
  assert.ok(c.acceptance_gates.every(g => g.status === 'PENDING'), 'activation gates must start pending');
  return n;
}

const plannedCount = validate(contract);
for (const [label, change] of [
  ['autoactivation', draft => { draft.governance.automatic_activation = true; }],
  ['unapproved production', draft => { draft.governance.explicit_approval_required = draft.governance.explicit_approval_required.filter(x => x !== 'PRODUCTION_DEPLOY'); }],
  ['undercount', draft => { draft.simulation_contract.scenario_axes[0].count = 1; }],
  ['unverified worker', draft => { draft.identity.deployment_state = 'DEPLOYED'; }],
]) {
  const invalid = structuredClone(contract);
  change(invalid);
  assert.throws(() => validate(invalid), 'negative test failed for ' + label);
}
console.log('PASS: disabled GOD MODE mission contract, ' + plannedCount + ' planned deterministic cases, 4 negative tests.');
console.log('NOTE: contract validation is NOT proof of worker deployment, actual simulation execution or bidirectional runtime sync.');
