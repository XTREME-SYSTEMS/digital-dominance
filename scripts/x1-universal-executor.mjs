#!/usr/bin/env node
// Digital Dominance X1 Universal Generator: fail-closed coding executor adapter.
// Does not create a scheduler/queue/worker, deploy, commit, push or merge.
import { createHash, createPublicKey, verify } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
function requireGate(ok, code) {
  if (!ok) throw Object.assign(new Error(code), { code });
}
export function canonicalJSON(v) {
  if (Array.isArray(v)) return '[' + v.map(canonicalJSON).join(',') + ']';
  if (v && typeof v === 'object')
    return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canonicalJSON(v[k])).join(',') + '}';
  return JSON.stringify(v);
}
export function sha256(v) {
  return createHash('sha256').update(typeof v === 'string' ? v : canonicalJSON(v)).digest('hex');
}
export function validateAuthority(a) {
  requireGate(a?.schema_version === 'x1.universal-generator.authority.v1' && a.project_id === 'digital-dominance', 'AUTHORITY_INVALID');
  requireGate(a.engine?.compiler === 'x1-universal-generator' && a.engine?.command === 'god-mode-commander', 'COMPILER_COMMAND_REQUIRED');
  requireGate(a.engine?.coordinator === 'existing-x1-control-plane' && a.engine?.worker === 'x1-swarm-preview-1', 'EXISTING_X1_REQUIRED');
  requireGate(a.execution?.max_unapproved_new_model_spend_usd === 0 && a.execution?.production_release_requires_separate_approval === true, 'RELEASE_OR_SPEND_POLICY_INVALID');
  requireGate(a.visual?.preserve_existing_homepage === true && /^[0-9a-f]{64}$/.test(a.visual.reference_sha256), 'APPROVED_VISUAL_REQUIRED');
  return a;
}
export function validatePacket(p, a) {
  validateAuthority(a);
  requireGate(p?.schema_version === 'x1.universal-generator.build-packet.v1' && p.project_id === a.project_id, 'PACKET_SCHEMA_INVALID');
  requireGate(p.repo === a.source.repository && p.branch === a.source.review_branch && p.branch.startsWith('feature/dd-'), 'REPOSITORY_OR_BRANCH_DENIED');
  requireGate(p.action_class === 'NON_PRODUCTION_MUTATION' && p.scope === 'DEVELOPMENT_AND_NOINDEX_PREVIEW_ONLY', 'PROTECTED_ACTION_DENIED');
  requireGate(p.noindex === true && p.production_release === false && p.no_spend === true && p.synthetic === true && p.no_customer_data === true, 'SYNTHETIC_PREVIEW_ONLY');
  requireGate(p.visual_template === a.source.visual_template_entry && p.visual_reference_sha256 === a.visual.reference_sha256, 'APPROVED_TEMPLATE_MISMATCH');
  requireGate(typeof p.mission_id === 'string' && /^[a-z0-9-]{8,96}$/.test(p.mission_id), 'MISSION_INVALID');
  requireGate(typeof p.task_id === 'string' && /^[a-z0-9.-]{8,96}$/.test(p.task_id), 'TASK_INVALID');
  requireGate(Array.isArray(p.approved_scope_paths) && p.approved_scope_paths.length > 0, 'SCOPE_REQUIRED');
  for (const path of p.approved_scope_paths) {
    requireGate(typeof path === 'string' && !path.startsWith('/') && !path.includes('..') && !path.includes('\\') && path.endsWith('/'), 'UNSAFE_SCOPE');
    requireGate(/^(src\/|tests\/|docs\/|config\/x1\/)/.test(path), 'SCOPE_OUTSIDE_SOURCE');
  }
  requireGate(Array.isArray(p.requirements) && p.requirements.length >= 3, 'BUILD_REQUIREMENTS_REQUIRED');
  requireGate(Array.isArray(p.required_checks) && p.required_checks.includes('independent-guardian'), 'GUARDIAN_REQUIRED');
  return p;
}
export function compileBuildPacket(p, a) {
  validatePacket(p,a);
  const payload = {
    project_id:p.project_id,mission_id:p.mission_id,task_id:p.task_id,
    source_repo:a.source.repository,source_baseline_sha:a.source.review_branch_start_sha,
    target_branch:p.branch,template:p.visual_template,visual_sha256:a.visual.reference_sha256,
    generator_compiler:a.engine.compiler,commander:a.engine.command,
    execution_owner:a.engine.coordinator,worker:a.engine.worker,
    action_class:p.action_class,approved_scope_paths:p.approved_scope_paths,
    requirements:p.requirements,required_checks:p.required_checks,
    forbidden_actions:a.execution.forbidden_actions,
    execution_policy:'SINGLE_STAGING_PREVIEW_NO_EXTRA_WORKER',
    max_unapproved_new_spend_usd:0,max_repair_attempts:a.execution.max_repair_attempts,
    status:'PENDING_SIGNED_X1_AUTHORIZATION'
  };
  const manifest_sha256=sha256(payload);
  return {...payload,manifest_sha256,idempotency_key:sha256(p.mission_id+':'+manifest_sha256)};
}
export function verifySignedGrant(envelope,pem,p,a,now=Date.now()) {
  requireGate(envelope && typeof envelope.signature === 'string' && envelope.grant && typeof pem === 'string', 'SIGNED_GRANT_REQUIRED');
  requireGate(pem.includes('PUBLIC KEY'), 'TRUSTED_KEY_REQUIRED');
  const grant=envelope.grant;
  requireGate(verify(null,Buffer.from(canonicalJSON(grant)),createPublicKey(pem),Buffer.from(envelope.signature,'base64')), 'GRANT_SIGNATURE_INVALID');
  requireGate(grant.tenant_id && grant.actor_id && grant.worker_id===a.engine.worker, 'GRANT_ACTOR_WORKER_INVALID');
  requireGate(grant.project_id===p.project_id && grant.task_id===p.task_id && grant.mission_id===p.mission_id, 'GRANT_TASK_MISMATCH');
  requireGate(grant.repository===p.repo && grant.branch===p.branch, 'GRANT_BRANCH_MISMATCH');
  requireGate(grant.pack_sha256===compileBuildPacket(p,a).manifest_sha256, 'GRANT_PACK_MISMATCH');
  requireGate(grant.action_class==='NON_PRODUCTION_MUTATION' && grant.preview_only===true && grant.production_release===false, 'GRANT_RELEASE_DENIED');
  requireGate(grant.provider_hard_cap_verified===true && typeof grant.provider_cap_receipt==='string' && grant.provider_cap_receipt.length>=12, 'MODEL_SPEND_CAP_UNVERIFIED');
  requireGate(Number.isFinite(grant.maximum_model_spend_usd) && grant.maximum_model_spend_usd>0 && grant.maximum_model_spend_usd<=25, 'MODEL_BUDGET_NOT_APPROVED');
  requireGate(grant.isolated_workspace_verified===true && grant.no_push_credentials_verified===true, 'UNISOLATED_CODING_AGENT');
  requireGate(Number.isInteger(grant.issued_at_ms) && Number.isInteger(grant.expires_at_ms) &&
    grant.issued_at_ms<=now && now<grant.expires_at_ms && grant.expires_at_ms-grant.issued_at_ms<=900000, 'GRANT_EXPIRED');
  requireGate(typeof grant.unique_work_id==='string' && /^[0-9a-f-]{36}$/i.test(grant.unique_work_id), 'WORK_ID_REQUIRED');
  requireGate(grant.preview_noindex===true && grant.no_customer_data===true, 'GRANT_SYNTHETIC_REQUIRED');
  return grant;
}
export function agentPrompt(pack) {
  return [
    'You are the coding executor for X1 Universal Generator coordinated by GOD MODE Commander.',
    'Mission: '+pack.mission_id,
    'Task: '+pack.task_id,
    'Repo: '+pack.source_repo,
    'Feature branch: '+pack.target_branch,
    'Approved template: '+pack.template,
    'Preserve approved premium visual, twenty industries and existing functioning features.',
    'Edit only these source prefixes: '+pack.approved_scope_paths.join(', '),
    'Never commit, push, merge, deploy, publish, send messages, alter secrets/permissions, or initiate spend.',
    'Never create another X1 worker, queue, heartbeat, scheduler, registry or operating system.',
    'Implement exact functionality and relevant tests; changes stay uncommitted for independent review.',
    'Requirements:\n'+pack.requirements.map((s,i)=>(i+1)+'. '+s).join('\n'),
    'Independent gates: '+pack.required_checks.join(', '),
    'Report real changes, test results and UNKNOWN checks; do not invent evidence.'
  ].join('\n');
}
function hasCodex() {
  const r=spawnSync('codex',['--version'],{encoding:'utf8',timeout:4000,shell:false});
  return r.status===0;
}
export function parseChangedPaths(porcelain) {
  return porcelain.split('\n').filter(Boolean).map(line=>{
    requireGate(line.length>=4,'GIT_STATUS_INVALID');
    const name=line.slice(3).trim();
    requireGate(!name.includes(' -> '),'RENAMES_REQUIRE_REVIEW');
    return name;
  });
}
export function assertChangesScoped(paths,p) {
  for (const path of paths)
    requireGate(!path.startsWith('.github/') && path!=='.env' && p.approved_scope_paths.some(prefix=>path.startsWith(prefix)), 'CHANGED_FILE_OUTSIDE_SCOPE');
  return true;
}
export async function executeAuthenticatedPack({cwd,p,a,grantEnvelope,pubkey,dryRun=true}) {
  const packet=compileBuildPacket(p,a);
  if (dryRun) return {status:'PACK_COMPILED_NOT_EXECUTED',packet,codex_cli_detected:hasCodex()};
  const grant=verifySignedGrant(grantEnvelope,pubkey,p,a);
  const gitBranch=spawnSync('git',['branch','--show-current'],{cwd,encoding:'utf8',timeout:4000});
  requireGate(gitBranch.status===0 && gitBranch.stdout.trim()===p.branch, 'WRONG_GIT_BRANCH');
  requireGate(hasCodex(), 'CODEX_CLI_NOT_AVAILABLE');
  const before=spawnSync('git',['status','--porcelain=v1'],{cwd,encoding:'utf8',timeout:4000});
  requireGate(before.status===0 && before.stdout.trim()==='', 'WORKSPACE_MUST_BE_CLEAN');
  // Only allow OS and Codex login environment. No GitHub, Vercel, Railway, Supabase, X1 or model API tokens.
  const env={};
  for (const k of ['PATH','Path','HOME','USERPROFILE','APPDATA','LOCALAPPDATA','CODEX_HOME','TEMP','TMP','SYSTEMROOT'])
    if (process.env[k]) env[k]=process.env[k];
  const args=['exec','--sandbox','workspace-write','--ask-for-approval','never','--cd',cwd,'-'];
  const outcome=await new Promise((res,rej)=>{
    const child=spawn('codex',args,{cwd,env,stdio:['pipe','pipe','pipe'],shell:false});
    let bytes=0;
    child.stdout.on('data',b=>{bytes+=b.length;});
    child.stderr.on('data',b=>{bytes+=b.length;});
    const timer=setTimeout(()=>child.kill('SIGKILL'),Math.min(900000,a.execution.per_job_timeout_seconds*1000));
    child.on('error',e=>{clearTimeout(timer);rej(e);});
    child.on('close',(exitCode,signal)=>{clearTimeout(timer);res({exitCode,signal,log_bytes:bytes});});
    child.stdin.end(agentPrompt(packet));
  });
  const after=spawnSync('git',['status','--porcelain=v1'],{cwd,encoding:'utf8',timeout:4000});
  requireGate(after.status===0,'GIT_POSTRUN_FAILED');
  const changes=parseChangedPaths(after.stdout);
  assertChangesScoped(changes,p);
  return {status:outcome.exitCode===0?'CODING_FINISHED_PENDING_INDEPENDENT_QA':'CODING_FAILED',
    work_id:grant.unique_work_id,packet_sha256:packet.manifest_sha256,
    changed_files:changes,exit_code:outcome.exitCode,qa:'UNKNOWN',deployed:false,committed:false};
}
async function main() {
  const [command='--preflight',packetFile,grantFile,keyFile]=process.argv.slice(2);
  const a=JSON.parse(await readFile(join(root,'config/x1/digital-dominance-authority.json'),'utf8'));
  const p=JSON.parse(await readFile(command==='--preflight' || !packetFile?
    join(root,'config/x1/phase-1-website-packet.json'):resolve(packetFile),'utf8'));
  const packet=compileBuildPacket(p,a);
  if (command==='--preflight') {
    process.stdout.write(JSON.stringify({status:'READY_TO_COMPILE_EXECUTION_BLOCKED',project:p.project_id,
      pack_sha256:packet.manifest_sha256,worker:a.engine.worker,
      codex_cli_detected:hasCodex(),model_budget_usd:0,
      required:['existing X1 signed one-job authorization','provider-verified spend cap','isolated authorized model runtime','independent QA']},null,2)+'\n');
    return;
  }
  if (command==='--compile') {process.stdout.write(JSON.stringify(packet,null,2)+'\n');return;}
  if (command==='--run') {
    requireGate(grantFile && keyFile,'GRANT_AND_VERIFICATION_KEY_REQUIRED');
    const grantEnvelope=JSON.parse(await readFile(resolve(grantFile),'utf8'));
    const pubkey=await readFile(resolve(keyFile),'utf8');
    const result=await executeAuthenticatedPack({cwd:process.cwd(),p,a,grantEnvelope,pubkey,dryRun:false});
    process.stdout.write(JSON.stringify(result,null,2)+'\n');
    return;
  }
  throw new Error('Use --preflight, --compile, or --run <packet> <signed-grant> <public-key>');
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url))
  main().catch(e=>{process.stderr.write(JSON.stringify({status:'BLOCKED',code:e.code||e.message})+'\n');process.exitCode=1;});
