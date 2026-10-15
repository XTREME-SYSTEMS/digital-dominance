/**
 * Safe inventory of existing Base44 workflows. Read-only, no cron, no network.
 * A JSONC definition in Git does not establish an enabled live workflow.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";

const root = join(process.cwd(), "base44", "workflows");
const paths = readdirSync(root).filter(p => p.endsWith(".jsonc")).sort();
const definitions = [];
const risky = /(launch|deploy|publish|outreach|follow.?up|send|sms|email|payment|purchase|social|post|mass|bulk|heartbeat|cron|autopilot|sync)/i;
for (const name of paths) {
  const content = readFileSync(join(root, name), "utf8");
  let parsed;
  try { parsed = JSON.parse(content); } catch {
    // Keep the workflow visible but never make an unsafe interpretation of JSONC.
    definitions.push({ file: name, status: "UNPARSEABLE", live: "UNKNOWN", deployment_safe: false });
    continue;
  }
  const trigger = parsed.trigger?.config || {};
  const tasks = parsed.definition?.do || [];
  const function_names = [...new Set([...content.matchAll(/"function_name"\s*:\s*"([^"]+)"/g)].map(m=>m[1]))];
  const schedule = trigger.cron_expression || (trigger.schedule_mode === "interval"
    ? String(trigger.interval_value) + " " + String(trigger.interval_unit) : null);
  const hazard = risky.test([name, parsed.name, parsed.description, ...function_names].join(" "));
  const duplicate_scheduler_risk = Boolean(schedule);
  definitions.push({
    file: name, workflow: parsed.name || name,
    status: "SOURCE_DEFINED_RUNTIME_UNVERIFIED", live: "UNKNOWN",
    invoked_functions: function_names,
    scheduled_in_source: duplicate_scheduler_risk,
    declared_schedule: schedule,
    risk: hazard ? "PROTECTED_REVIEW" : "READ_OR_DRAFT_CANDIDATE",
    auto_enable_approved: false,
    duplicate_x1_heartbeat_allowed: false,
    deployment_safe: false,
    step_count: tasks.length
  });
}
assert.ok(definitions.length >= 30, "Expected at least 30 workflow definitions");
assert.ok(definitions.every(x => x.live === "UNKNOWN"), "Never claim that source proves runtime activation");
assert.ok(definitions.every(x => !x.auto_enable_approved && !x.deployment_safe), "No automatic workflow launch");
const receipt = {
  status: "PASS_SOURCE_AUDIT",
  evidence_type: "GIT_SOURCE_ONLY",
  definitions_total: definitions.length,
  parseable: definitions.filter(d => d.status !== "UNPARSEABLE").length,
  runtime_verified: 0,
  scheduled_in_source: definitions.filter(d => d.scheduled_in_source).length,
  protected_review_required: definitions.filter(d => d.risk === "PROTECTED_REVIEW").length,
  independent_runtime_validation_required: true,
  no_new_scheduler_created: true,
  live_activation: "BLOCKED_WITHOUT_INDEPENDENT_EVIDENCE_AND_APPROVAL",
  workflows: definitions
};
console.log(JSON.stringify(receipt, null, 2));
if (definitions.some(x=>x.status==="UNPARSEABLE")) process.exitCode=1;
