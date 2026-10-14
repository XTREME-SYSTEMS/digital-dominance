import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generateKeyPairSync, sign } from 'node:crypto';
import { join, resolve } from 'node:path';
import {
  canonicalJSON, sha256, validateAuthority, validatePacket, compileBuildPacket,
  verifySignedGrant, agentPrompt, parseChangedPaths, assertChangesScoped,
  executeAuthenticatedPack
} from '../scripts/x1-universal-executor.mjs';

const root=resolve(import.meta.dirname,'..');
const authority=JSON.parse(readFileSync(join(root,'config/x1/digital-dominance-authority.json'),'utf8'));
const packet=JSON.parse(readFileSync(join(root,'config/x1/phase-1-website-packet.json'),'utf8'));
const {publicKey,privateKey}=generateKeyPairSync('ed25519');
const pem=publicKey.export({type:'spki',format:'pem'}).toString();
function makeGrant(extra={}) {
  const now=Date.now();
  const grant={
    tenant_id:'666f23bf-61bd-4be0-b5cb-4872e04fad9b',
    actor_id:'synthetic-approved-operator',
    worker_id:'x1-swarm-preview-1',
    project_id:packet.project_id,task_id:packet.task_id,mission_id:packet.mission_id,
    repository:packet.repo,branch:packet.branch,
    pack_sha256:compileBuildPacket(packet,authority).manifest_sha256,
    action_class:'NON_PRODUCTION_MUTATION',
    preview_only:true,production_release:false,preview_noindex:true,no_customer_data:true,
    provider_hard_cap_verified:true,provider_cap_receipt:'SYNTHETIC_HARD_CAP_PROOF',
    maximum_model_spend_usd:5,
    isolated_workspace_verified:true,no_push_credentials_verified:true,
    issued_at_ms:now,expires_at_ms:now+60000,
    unique_work_id:'5153313d-8835-4eec-8f75-29befb35250e',...extra
  };
  return {grant,signature:sign(null,Buffer.from(canonicalJSON(grant)),privateKey).toString('base64')};
}
test('X1 Universal Generator and GOD MODE commander are canonical without duplicate infrastructure',()=>{
  assert.equal(validateAuthority(authority),authority);
  assert.equal(authority.engine.coordinator,'existing-x1-control-plane');
  assert.equal(authority.engine.worker,'x1-swarm-preview-1');
  assert.equal(authority.generator_catalog.documented_types,700);
  assert.throws(()=>validateAuthority({...authority,engine:{...authority.engine,worker:'second-worker'}}),/EXISTING_X1_REQUIRED/);
});
test('new unapproved model spend defaults to zero; production remains gated',()=>{
  assert.equal(authority.execution.max_unapproved_new_model_spend_usd,0);
  assert.throws(()=>validateAuthority({...authority,execution:{...authority.execution,max_unapproved_new_model_spend_usd:10}}),/RELEASE_OR_SPEND_POLICY_INVALID/);
});
test('rejects production action, main branch, wrong visual lock, customer data',()=>{
  assert.equal(validatePacket(packet,authority),packet);
  assert.throws(()=>validatePacket({...packet,branch:'main'},authority),/REPOSITORY_OR_BRANCH_DENIED/);
  assert.throws(()=>validatePacket({...packet,production_release:true},authority),/SYNTHETIC_PREVIEW_ONLY/);
  assert.throws(()=>validatePacket({...packet,visual_reference_sha256:'0'.repeat(64)},authority),/APPROVED_TEMPLATE_MISMATCH/);
  assert.throws(()=>validatePacket({...packet,no_customer_data:false},authority),/SYNTHETIC_PREVIEW_ONLY/);
});
test('rejects escape from allowed development paths',()=>{
  for (const path of ['../.env','/etc/secrets','src/../../.env','railway/','.github/'])
    assert.throws(()=>validatePacket({...packet,approved_scope_paths:[path]},authority),/UNSAFE_SCOPE|SCOPE_OUTSIDE_SOURCE/);
  assertChangesScoped(['src/pages/LaunchEngine.jsx','tests/foo.test.mjs'],packet);
  assert.throws(()=>assertChangesScoped(['.github/workflows/deploy.yml'],packet),/CHANGED_FILE_OUTSIDE_SCOPE/);
});
test('build packet is stable, idempotent and review-only',()=>{
  const a=compileBuildPacket(packet,authority),b=compileBuildPacket(packet,authority);
  assert.deepEqual(a,b);
  assert.match(a.manifest_sha256,/^[0-9a-f]{64}$/);
  assert.match(a.idempotency_key,/^[0-9a-f]{64}$/);
  assert.equal(a.max_unapproved_new_spend_usd,0);
  assert.equal(a.status,'PENDING_SIGNED_X1_AUTHORIZATION');
});
test('signed X1 single-job grant binds exact packet, worker and verified provider budget',()=>{
  const good=makeGrant();
  assert.equal(verifySignedGrant(good,pem,packet,authority).task_id,packet.task_id);
  assert.throws(()=>verifySignedGrant({...good,grant:{...good.grant,branch:'main'}},pem,packet,authority),/GRANT_SIGNATURE_INVALID/);
  assert.throws(()=>verifySignedGrant(makeGrant({pack_sha256:'0'.repeat(64)}),pem,packet,authority),/GRANT_PACK_MISMATCH/);
  assert.throws(()=>verifySignedGrant(makeGrant({production_release:true}),pem,packet,authority),/GRANT_RELEASE_DENIED/);
  assert.throws(()=>verifySignedGrant(makeGrant({provider_hard_cap_verified:false}),pem,packet,authority),/MODEL_SPEND_CAP_UNVERIFIED/);
  assert.throws(()=>verifySignedGrant(makeGrant({isolated_workspace_verified:false}),pem,packet,authority),/UNISOLATED_CODING_AGENT/);
  assert.throws(()=>verifySignedGrant(makeGrant({expires_at_ms:Date.now()-1000}),pem,packet,authority),/GRANT_EXPIRED/);
});
test('model prompt forbids automatic deployment, provider changes and worker duplication',()=>{
  const p=agentPrompt(compileBuildPacket(packet,authority));
  assert.match(p,/Never commit, push, merge, deploy/);
  assert.match(p,/existing X1/);
  assert.match(p,/LaunchEngine/);
});
test('modified files are parsed and renamed files require review',()=>{
  assert.deepEqual(parseChangedPaths(' M src/pages/LaunchEngine.jsx\n?? tests/a.test.mjs\n'),['src/pages/LaunchEngine.jsx','tests/a.test.mjs']);
  assert.throws(()=>parseChangedPaths('R  src/old.js -> src/new.js'),/RENAMES_REQUIRE_REVIEW/);
});
test('preflight/dry run compiles but never invokes a paid model or deploys',async()=>{
  const result=await executeAuthenticatedPack({cwd:root,p:packet,a:authority,dryRun:true});
  assert.equal(result.status,'PACK_COMPILED_NOT_EXECUTED');
  assert.equal(result.packet.max_unapproved_new_spend_usd,0);
});
test('canonical SHA256 fingerprint is independent of object key order',()=>{
  assert.equal(sha256({a:1,b:2}),sha256({b:2,a:1}));
  assert.notEqual(sha256({a:1}),sha256({a:2}));
});
