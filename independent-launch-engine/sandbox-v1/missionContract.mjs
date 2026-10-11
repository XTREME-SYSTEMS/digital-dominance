/** Digital Dominance durable mission contract. No provider calls, no protected side effects. */
import { createHash } from 'node:crypto';
export const STATES=Object.freeze(['PLANNED','SCOPE_APPROVED','QUEUED','CLAIMED','BUILDING','VALIDATING','REPAIR_REQUIRED','VERIFIED_PREVIEW','BLOCKED','AWAITING_RELEASE_APPROVAL']);
const NEXT={PLANNED:['SCOPE_APPROVED','BLOCKED'],SCOPE_APPROVED:['QUEUED','BLOCKED'],QUEUED:['CLAIMED','BLOCKED'],CLAIMED:['BUILDING','BLOCKED'],BUILDING:['VALIDATING','BLOCKED'],VALIDATING:['REPAIR_REQUIRED','VERIFIED_PREVIEW','BLOCKED'],REPAIR_REQUIRED:['BUILDING','BLOCKED'],VERIFIED_PREVIEW:['AWAITING_RELEASE_APPROVAL'],BLOCKED:[],AWAITING_RELEASE_APPROVAL:[]};
const PROTECTED=new Set(['PRODUCTION_RELEASE','DNS_CHANGE','CUSTOMER_MESSAGE','LIVE_SOCIAL_PUBLISH','SECRETS_CHANGE','PAID_SPEND','PRODUCTION_DATABASE_CHANGE','DESTRUCTIVE_ACTION']);
function sha(v){return createHash('sha256').update(JSON.stringify(v)).digest('hex')}
function insist(ok,msg){if(!ok)throw new Error(msg)}
export function validatePlan(plan){
 insist(plan&&Array.isArray(plan.tasks)&&plan.tasks.length>0&&plan.tasks.length<=40,'typed tasks required (max 40)');
 const ids=new Set(plan.tasks.map(t=>t.id));insist(ids.size===plan.tasks.length,'duplicate task IDs');
 for(const task of plan.tasks){insist(/^[a-z0-9_-]{2,80}$/i.test(task.id||''),'invalid task ID');insist(Array.isArray(task.depends_on),'missing depends_on');insist(task.depends_on.every(x=>ids.has(x)&&x!==task.id),'missing/self dependency');insist(['READ_ONLY','NON_PRODUCTION_MUTATION','PROTECTED_MUTATION'].includes(task.risk),'unclassified action');insist(typeof task.acceptance_test==='string'&&task.acceptance_test.trim(),'acceptance test required')}
 const visiting=new Set(),visited=new Set();function visit(id){if(visiting.has(id))throw new Error('cyclic plan');if(visited.has(id))return;visiting.add(id);for(const d of plan.tasks.find(t=>t.id===id).depends_on)visit(d);visiting.delete(id);visited.add(id)}
 for(const id of ids)visit(id);
 return true;
}
export function createMission({mission_id,tenant_id,source_sha,plan,max_repairs=2,budget_usd=0}){
 insist(/^[a-zA-Z0-9_-]{4,100}$/.test(mission_id||''),'mission id required');insist(typeof tenant_id==='string'&&tenant_id.length>5,'tenant ID required');insist(/^[a-f0-9]{40}$/.test(source_sha||''),'immutable Git SHA required');validatePlan(plan);
 insist(Number.isInteger(max_repairs)&&max_repairs>=0&&max_repairs<=3,'repair cap 0..3');insist(typeof budget_usd==='number'&&budget_usd>=0&&budget_usd<=100,'bounded budget');
 return {schema:'dd.mission.v1',mission_id,tenant_id,source_sha,plan_hash:sha(plan),plan,state:'PLANNED',approval_id:null,attempts:0,max_repairs,budget_usd,spent_usd:0,lease:null,receipts:[],release_authorized:false};
}
export function approveSafeScope(m,approval_id){insist(m.state==='PLANNED','mission must be planned');insist(typeof approval_id==='string'&&approval_id.length>5,'approval receipt required');insist(m.plan.tasks.every(t=>t.risk!=='PROTECTED_MUTATION'),'protected action in safe plan');return {...m,state:'SCOPE_APPROVED',approval_id}}
export function transition(m,next,receipt){insist(NEXT[m.state]?.includes(next),'invalid state transition '+m.state+' -> '+next);insist(receipt&&typeof receipt.id==='string'&&receipt.id.length>4,'receipt id required');insist(receipt.source_sha===m.source_sha,'revision mismatch');return {...m,state:next,receipts:[...m.receipts,{...receipt,state:next}]}}
export function retryFromFailure(m,validation){insist(m.state==='VALIDATING','must validate before retry');insist(validation&&validation.status==='FAIL'&&validation.implementer_is_validator===false,'independent failure required');insist(validation.source_sha===m.source_sha,'source revision mismatch');insist(typeof validation.failure_fingerprint==='string'&&validation.failure_fingerprint.length>3,'failure evidence needed');if(m.attempts>=m.max_repairs)return {...m,state:'BLOCKED',blocker:'REPAIR_BUDGET_EXHAUSTED'};return {...m,state:'REPAIR_REQUIRED',attempts:m.attempts+1,receipts:[...m.receipts,{type:'REPAIR_REQUEST',failure_fingerprint:validation.failure_fingerprint,validator_ref:validation.receipt_id,attempt:m.attempts+1}]}}
export function verifyPreview(m,receipt){insist(m.state==='VALIDATING','must be validating');insist(receipt?.status==='PASS'&&receipt?.source_sha===m.source_sha&&receipt?.implementer_is_validator===false&&receipt?.evidence_hash,'independent current-revision proof required');return {...m,state:'VERIFIED_PREVIEW',receipts:[...m.receipts,receipt],release_authorized:false}}
export function authorizeAction(action,approval){if(PROTECTED.has(action))return {allowed:false,reason:'PROTECTED_ACTION_REQUIRES_SEPARATE_OPERATOR_APPROVAL'};if(!['READ','DRAFT','BRANCH_BUILD','STAGING_VALIDATE','PREVIEW_BUILD'].includes(action))return {allowed:false,reason:'UNKNOWN_ACTION'};return {allowed:true,reason:'SANDBOX_SCOPE_ONLY'}}
