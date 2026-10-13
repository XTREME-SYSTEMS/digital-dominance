/** Strict side-effect-free Digital Dominance V1 SmaiSandboxJob -> V2 mission adapter. */
import { createHash } from 'node:crypto';

export const V1_SANDBOX_SOURCE = Object.freeze({
  repository: 'XTREME-SYSTEMS/digital-dominance',
  app_id: '6a77f4491f0bf92de9a3ed8b',
  dispatcher: 'base44/functions/smaiSandboxDispatcher/entry.ts',
  entity: 'base44/entities/SmaiSandboxJob.jsonc',
});
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const shaRe = /^[a-f0-9]{40}$/;
const safeId = /^[a-zA-Z0-9_-]{4,100}$/;
const statuses = new Set(['queued','compiling','validating','deploying','ready','approved','failed']);
const credentialPattern = /(BEGIN\s+(RSA|OPENSSH)\s+PRIVATE\s+KEY|sk-[a-zA-Z0-9_-]{20,}|\bBearer\s+[a-zA-Z0-9._-]{24,})/i;
function insist(ok,message){if(!ok)throw new Error(message)}
export function inspectV1SandboxJob(job) {
  insist(job && typeof job === 'object' && !Array.isArray(job),'V1 job object required');
  insist(typeof job.job_id === 'string' && safeId.test(job.job_id),'V1 stable job_id required');
  insist(typeof job.client_id === 'string' && job.client_id.length > 0 && job.client_id.length <= 100,'V1 client identity required');
  insist(typeof job.prompt === 'string' && job.prompt.trim().length >= 10 && job.prompt.length <= 10000,'V1 task prompt 10..10000 chars required');
  insist(!credentialPattern.test(job.prompt),'Embedded credential material is not allowed in mission prompt');
  insist(statuses.has(job.status),'Unknown V1 status');
  const flags=['web_pack_approved','logo_pack_approved','brand_pack_approved'];
  const indications=Object.fromEntries(flags.map(name=>[name,job.pack_status?.[name] === true]));
  return Object.freeze({
    job_id:job.job_id,client_id:job.client_id,source_status:job.status,
    prompt_sha256:hash(job.prompt.trim()),pack_indications:indications,
    pack_approvals_verified:false,independent_preview_verified:false,
    approval_receipt_verified:false,live_or_production_authorized:false,
    safe_to_resume_in_production:false,
    reason:'V1 flags, checklist state and URLs are not independently verified approvals or build evidence',
  });
}
export function createV2MissionFromV1({job,tenant_id,source_sha,budget_usd=0}) {
  const v1=inspectV1SandboxJob(job);
  insist(typeof tenant_id==='string' && safeId.test(tenant_id) && tenant_id.length>5,'Exact tenant identity required');
  insist(v1.client_id===tenant_id || (v1.client_id==='system' && tenant_id==='smai-internal'),'Cross-tenant V1 job rejected');
  insist(typeof source_sha==='string' && shaRe.test(source_sha),'Immutable V1 source SHA required');
  insist(budget_usd===0,'No paid budget may be inferred from V1');
  const mission_id='smai_v2_'+hash({job_id:v1.job_id,tenant_id,source_sha}).slice(0,40);
  const tasks=[
    {id:'inspect_v1',depends_on:[],risk:'READ_ONLY',acceptance_test:'Current V1 source and isolated tenant snapshot evidence'},
    {id:'compile_plan',depends_on:['inspect_v1'],risk:'READ_ONLY',acceptance_test:'Versioned typed DAG + source provenance receipt'},
    {id:'sandbox_build',depends_on:['compile_plan'],risk:'NON_PRODUCTION_MUTATION',acceptance_test:'Isolated worker build artifact with source and output hashes'},
    {id:'independent_validate',depends_on:['sandbox_build'],risk:'READ_ONLY',acceptance_test:'Separate validator, 3-pass evidence, source SHA, and rollback'},
  ];
  return Object.freeze({
    mission_id,tenant_id,source_sha,budget_usd:0,max_repairs:2,plan:{tasks},
    v1_origin:v1,state:'PLANNED',release_authorized:false,
    x1_queue_mutated:false,staging_binding_verified:false,
    approval_source:'REQUIRES_EXPLICIT_SCOPED_APPROVAL',
  });
}
export function makeStagingPreflight(mission,{project_id='uvdkzsbjackpjvpoxtyk',authorization_receipt=null}={}) {
  insist(mission?.state==='PLANNED' && safeId.test(mission.mission_id || ''),'Validated V2 planned mission required');
  insist(project_id==='uvdkzsbjackpjvpoxtyk','Unexpected staging target; fail closed');
  // A JSON receipt supplied by a caller is a claim, NOT provider-native proof.
  const claimed=Boolean(authorization_receipt && authorization_receipt.project_id===project_id
    && typeof authorization_receipt.receipt_id==='string');
  return {
    operation:'PREFLIGHT_ONLY',target:project_id,mission_id:mission.mission_id,
    source_sha:mission.source_sha,plan_sha256:hash(mission.plan),
    authorization_verified:false,authorization_receipt_claimed:claimed,queue_write_performed:false,
    next:'BLOCKED_PROVIDER_NATIVE_AUTHORIZATION_VERIFICATION',
    idempotency_key:hash({project_id,mission_id:mission.mission_id,plan:mission.plan}),
  };
}
