import fs from "node:fs";
import assert from "node:assert/strict";

const read = (p) => fs.readFileSync(p, "utf8");
const railway = JSON.parse(read("railway/railway.json"));
const dispatcher = read("base44/functions/railwayCronDispatcher/entry.ts");
const worker = read("railway/workers/worker.js");
const heartbeat = read("base44/functions/ddv3Heartbeat/entry.ts");
const claim = read("base44/functions/claimDDV3Work/entry.ts");
const complete = read("base44/functions/completeDDV3Work/entry.ts");
const manifest = JSON.parse(read("runtime/ddv3-runtime-cutover.json"));

const jobs = railway.deploy.cron.jobs || [];
assert.equal(jobs.length, 1);
assert.equal(jobs[0].name, "ddv3-heartbeat");
assert.equal(jobs[0].schedule, "*/5 * * * *");
assert.ok(jobs[0].command.includes("ddv3_heartbeat"));

assert.ok(dispatcher.includes("DDV3_SINGLE_HEARTBEAT_REQUIRED"));
assert.ok(dispatcher.includes("ddv3_heartbeat"));
assert.ok(!dispatcher.includes("daily_lead_engine: { function"));
assert.ok(!dispatcher.includes("social_autopilot: { function"));

assert.ok(worker.includes('ddv3_heartbeat: "ddv3Heartbeat"'));
assert.ok(worker.includes("processEntityEvents()"));
assert.ok(!worker.includes("daily_lead_engine:"));
assert.ok(!worker.includes("lead_follow_up:"));

assert.ok(heartbeat.includes('const SAFE_RISKS = new Set(["READ", "DRAFT", "BRANCH_WRITE"])'));
assert.ok(heartbeat.includes('packet.risk_class === "PROTECTED"'));
assert.ok(!heartbeat.includes("functions.invoke("));
for (const marker of ["sendEmail", "sendSMS", "purchase_domain", "change_dns", "production_deploy", "publish_social", "stripe"]) {
  assert.ok(!heartbeat.includes(marker), "heartbeat must not contain protected action marker: " + marker);
}

assert.ok(claim.includes('const SAFE_RISKS = new Set(["READ", "DRAFT", "BRANCH_WRITE"])'));
assert.ok(claim.includes('packet.status === "READY"'));
assert.ok(!claim.includes('"PROTECTED"'));

assert.ok(complete.includes("DDV3_PROTECTED_WORK_BLOCKED"));
assert.ok(complete.includes("DDV3_INDEPENDENT_VALIDATION_REQUIRED"));
assert.ok(complete.includes("receipt.validator !== workerId"));
assert.ok(complete.includes('receipt.status === "PASS"'));

assert.equal(manifest.base44_scheduled_workflows_to_retire.length, 22);
assert.equal(manifest.railway_crons_to_replace.length, 16);
assert.equal(manifest.desired_railway_crons.length, 1);
assert.equal(manifest.production_mutation, false);
assert.ok(manifest.entity_workflows.quarantine_customer_messaging.includes("Lead Follow-Up"));
assert.ok(manifest.entity_workflows.quarantine_customer_messaging.includes("Immediate Lead Follow-Up"));
assert.ok(manifest.entity_workflows.quarantine_customer_messaging.includes("Review Request"));

console.log("PASS | Railway cron list converges to one 5-minute heartbeat");
console.log("PASS | Legacy dispatcher tasks are structurally retired");
console.log("PASS | Entity event processing is folded into the same scheduled tick");
console.log("PASS | Heartbeat performs no protected/external execution");
console.log("PASS | Workers can claim only safe READY packets");
console.log("PASS | Protected packets cannot complete through safe worker");
console.log("PASS | Independent validator PASS is required for validated work");
console.log("PASS | Runtime cutover manifest captures 22 Base44 schedules + 16 Railway crons");
console.log("\nDDV3 runtime regression: 8/8 passed");
