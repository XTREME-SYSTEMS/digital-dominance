import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { generateSite } from "../base44/shared/universalGenerator.ts";
import {
  PHASE_GROUPS, PHASE_STEPS, createMissionPlan, executeSyntheticMission, phaseSummary
} from "../base44/shared/universalPhaseRuntime.js";
import { validateSandboxArtifact } from "../base44/shared/universalPhaseQa.js";
import { runSyntheticForesight, FORESIGHT_STRATEGIES } from "../base44/shared/godModeForesightSandbox.js";

const SOURCE_SHA = (() => {
  const configured = process.env.DD_SOURCE_SHA;
  if (configured && /^[a-f0-9]{40}$/i.test(configured)) return configured;
  if (configured) throw new Error("DD_SOURCE_SHA_INVALID");
  const dirty = execFileSync("git", ["status", "--porcelain"], {encoding:"utf8"}).trim();
  if (dirty) throw new Error("LOCAL_SOURCE_DIRTY_CANNOT_CLAIM_EXACT_SHA");
  const head = execFileSync("git", ["rev-parse", "HEAD"], {encoding:"utf8"}).trim();
  if (!/^[a-f0-9]{40}$/i.test(head)) throw new Error("SOURCE_SHA_UNVERIFIED");
  return head;
})();
let checks = 0;
const check = (ok, label) => {assert.ok(ok, label); checks++;};
check(PHASE_GROUPS.length === 5, "five canonical phase groups");
check(PHASE_STEPS.length === 30, "30 canonical steps");
check(new Set(PHASE_STEPS.map(x => x.id)).size === 30, "unique stage ids");
check(PHASE_STEPS.every(s => s.generator_entrypoint.endsWith("#generateSite")), "same generator contract every step");
const plan = createMissionPlan({
  synthetic: true, niche: "epoxy_flooring", brandName: "Sandbox Example Epoxy",
  city: "Boca Raton", state: "FL", sourceSha: SOURCE_SHA
});
check(plan.work_packets.length === 30, "every stage has typed packet");
check(plan.work_packets.every(x => x.generator_context === plan.generator_context), "one immutable context");
check(plan.new_scheduler === false && plan.existing_x1_only, "no duplicate heartbeat");
check(plan.production_approval === "MISSING" && !plan.publish, "no silent public release");
check(plan.connectors.god_mode_commander.includes("NOT_SERVER_BINDING"), "no invented plugin gateway");
assert.throws(() => createMissionPlan({ synthetic: true, niche:"epoxy", brandName:"Demo", domain:"example.com" }), /NO_REAL_CONTACT/); checks++;
assert.throws(() => createMissionPlan({ synthetic: true, niche:"epoxy", brandName:"Demo", allowPublishing:true }), /SANDBOX_ONLY/); checks++;
assert.throws(() => createMissionPlan({ synthetic: false, niche:"epoxy", brandName:"Demo" }), /SANDBOX_ONLY/); checks++;
assert.throws(() => executeSyntheticMission({ ...plan, publish: true }, generateSite, validateSandboxArtifact), /PROTECTED/); checks++;
const report = executeSyntheticMission(plan, generateSite, validateSandboxArtifact);
check(report.status === "SANDBOX_PREVIEW_VALIDATED", "sandbox preview independent QA passes");
check(report.qa.status === "PASS" && report.qa.failed === 0, "all mandatory QA checks");
check(report.qa.release_ready === false, "QA cannot self-authorize production");
check(report.release_gate.startsWith("BLOCKED_"), "release gate fail closed");
check(report.generated?.length === undefined, "no ungoverned generator output field");
check(report.generator.html_bytes > 3000, "real HTML output generated");
check(report.generator.supported_niches >= 20, "uses existing niche registry");
check(report.executed_step_count === 2 && report.remaining_step_count === 28, "no false success for unexecuted stages");
check(report.results.filter(x => x.status.startsWith("PASS_")).length === 2, "only two stages executed");
check(report.sandbox_html.includes("noindex,nofollow"), "noindex");
check(report.sandbox_html.includes("form-action &#39;none&#39;"), "form traffic disabled");
check(phaseSummary(report).length === 5, "all five phases included in report");
check(phaseSummary(report).every(x => x.stage_status === "PARTIAL"), "not falsely asserting 30-stage readiness");
check(validateSandboxArtifact("<html><body>broken</body></html>", { synthetic:true, source_sha: SOURCE_SHA }).status === "FAIL", "negative QA fails");
const dir = mkdtempSync(join(tmpdir(), "dd-universal-qa-"));
const html = join(dir, "sandbox-preview.html"), receipt = join(dir, "qa-receipt.json");
writeFileSync(html, report.sandbox_html);
const proc = spawnSync(process.execPath,
  [join(process.cwd(), "scripts", "universal-independent-qa.mjs"), html, SOURCE_SHA, receipt],
  { cwd: process.cwd(), encoding:"utf8", timeout: 25000 });
if (proc.status !== 0) throw new Error("INDEPENDENT_QA_PROCESS_FAILED: " + proc.stderr + proc.stdout.slice(0,800));
const independent = JSON.parse(readFileSync(receipt, "utf8"));
check(independent.status === "PASS" && independent.qa_agent_id === "independent-universal-qa-v1", "separate process QA");
check(independent.html_sha256 === createHash("sha256").update(report.sandbox_html).digest("hex"), "hash-verified artifact");
const foresight = runSyntheticForesight({seed:20261013,draws:1000,months:12,synthetic:true});
check(FORESIGHT_STRATEGIES.length === 10 && foresight.strategies.length === 10, "ten GOD MODE strategy variants");
check(foresight.strategies.every(x => x.draws === 1000 && x.months === 12), "1000 repeatable scenarios per strategy");
check(foresight.pricing_evidence === "NONE" && foresight.buyer_evidence === "NONE", "never fabricate buyer evidence");
check(foresight.decision === "HOLD_NOT_DEPLOYABLE" && !foresight.publish, "hypothetical ROI cannot authorize release");
check(JSON.stringify(runSyntheticForesight({seed:20261013})) === JSON.stringify(foresight), "seeded foresight reproducible");
assert.throws(() => runSyntheticForesight({synthetic:false}),/SYNTHETIC_ONLY/); checks++;
assert.throws(() => runSyntheticForesight({draws:100}),/SYNTHETIC_ONLY/); checks++;
console.log(JSON.stringify({
  status:"PASS",checks,source_sha:SOURCE_SHA,
  stages:PHASE_STEPS.length,executed_stages:report.executed_step_count,
  independent_qa:independent.status,html_sha256:independent.html_sha256,
  sandbox_artifact:html,qa_receipt:receipt,
  notes:["NOT a deployed Base44 function","NO external research data or priced leads","Production gate DENIED","Existing X1 supervisor unchanged"]
}, null, 2));