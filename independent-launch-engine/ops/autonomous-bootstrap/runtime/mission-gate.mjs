import {createHash} from 'node:crypto';
export const VERSION='WLE_AUTONOMY_GATE_V1';
export const SAFE_ACTIONS=['READ','DRAFT','BRANCH_WRITE','PREVIEW_WRITE'];
export const PROTECTED=new Set(['PRODUCTION_DEPLOY','MAIN_MERGE','PROD_DB','PROD_RLS','SECRETS','DNS','PAYMENT','CLIENT_MESSAGE','SOCIAL_PUBLISH','SOCIAL_REPLY','CUSTOMER_REMOTE_ACCESS','PROVISION_ACCOUNT','DELETE']);
export const sha=o=>createHash('sha256').update(JSON.stringify(o,Object.keys(o).sort())).digest('hex');
export function missionErrors(m){
 const e=[];
 if(!m||typeof m!=='object')return ['MISSING_MISSION'];
 if(!/^DD-[A-Z0-9-]{8,90}$/.test(m.missionId||''))e.push('MISSION_ID');
 if(!/^feature\/[a-z0-9-_/]+$/.test(m.branch||''))e.push('UNSAFE_BRANCH');
 if(!/^[0-9a-f]{40}$/.test(m.sourceSha||''))e.push('SOURCE_SHA');
 if(!m.projectId||!m.tenantId)e.push('TENANT_OR_PROJECT');
 if(!m.repo||!m.repo.includes('/'))e.push('REPOSITORY');
 if(!Array.isArray(m.allowedProviders)||m.allowedProviders.length===0)e.push('PROVIDER_ALLOWLIST');
 if(!SAFE_ACTIONS.includes(m.actionClass))e.push('ACTION_CLASS');
 if(!Number.isInteger(m.maxCostCents)||m.maxCostCents<0)e.push('BUDGET');
 if(!Number.isInteger(m.maxRepairAttempts)||m.maxRepairAttempts<0||m.maxRepairAttempts>3)e.push('REPAIR_LIMIT');
 if(!m.rollbackSha)e.push('ROLLBACK');
 return e;
}
export function admit(m,{principalVerified=false,tenantVerified=false,leaseVerified=false,operation='READ',provider='LOCAL_SANDBOX',costCents=0,sourceSha=null}={}){
 const reasons=missionErrors(m);
 if(PROTECTED.has(operation)||operation==='PROTECTED')return {state:'REQUIRES_OPERATOR_APPROVAL',reasons:['PROTECTED_ACTION']};
 if(reasons.length)return {state:'BLOCKED',reasons};
 if(!principalVerified||!tenantVerified)reasons.push('AUTH_NOT_VERIFIED');
 if(sourceSha!==m.sourceSha)reasons.push('SOURCE_SHA_DRIFT');
 if(!SAFE_ACTIONS.includes(operation)||SAFE_ACTIONS.indexOf(operation)>SAFE_ACTIONS.indexOf(m.actionClass))reasons.push('ACTION_SCOPE_DENIED');
 if(!m.allowedProviders.includes(provider))reasons.push('PROVIDER_DENIED');
 if(!Number.isInteger(costCents)||costCents<0||costCents>m.maxCostCents)reasons.push('BUDGET_DENIED');
 if(['BRANCH_WRITE','PREVIEW_WRITE'].includes(operation)&&!leaseVerified)reasons.push('WRITER_LEASE_UNVERIFIED');
 return reasons.length?{state:'BLOCKED',reasons}:{state:'ELIGIBLE_NONPRODUCTION',reasons:[],idempotencyKey:sha({missionId:m.missionId,sourceSha:m.sourceSha,operation,provider})};
}
const CHECKS=['desktop1440x900','mobile390x844','allButtons','navigation','forms','auth','negativeTenant','accessibility','errorHandling','faultRecovery','rollback'];
export function threePassGate({sourceSha,deploymentId,receipts,requiredRoutes=[]}={}){
 const reasons=[],runs=new Set();
 if(!Array.isArray(receipts)||receipts.length!==3)reasons.push('THREE_DISTINCT_FULL_RUNS_REQUIRED');
 for(const r of receipts||[]){
  if(!r||r.sha!==sourceSha||r.deploymentId!==deploymentId)reasons.push('SHA_OR_DEPLOYMENT_MISMATCH');
  if(!r?.id||runs.has(r.id))reasons.push('REUSED_RUN');else runs.add(r.id);
  if(!r?.validatorId||r.validatorId===r.builderId)reasons.push('NOT_INDEPENDENT');
  if(r?.status!=='PASS'||!r?.browserEvidence||!r?.desktopScreenshotHash||!r?.mobileScreenshotHash)reasons.push('MISSING_BROWSER_PROOF');
  for(const k of CHECKS)if(r?.checks?.[k]!=='PASS')reasons.push('FAILED_CHECK:'+k);
  for(const path of requiredRoutes)if(r?.routes?.[path]!=='PASS')reasons.push('FAILED_ROUTE:'+path);
 }
 if(!sourceSha||!deploymentId)reasons.push('SOURCE_OR_DEPLOYMENT_REQUIRED');
 return {state:reasons.length?'BLOCKED':'TRIPLE_VALIDATED_PENDING_OPERATOR_RELEASE',reasons:[...new Set(reasons)],productionApproved:false,customerEmailApproved:false};
}
export function compileSafeOvernight(m){
 const e=missionErrors(m);if(e.length)throw Object.assign(new Error('MISSION_INVALID'),{reasons:e});
 return {missionId:m.missionId,version:VERSION,kind:'PLAN_NOT_DISPATCHED',queue:'EXISTING_X1_OR_LOCAL_ONLY',newScheduler:false,autoExecuted:false,maxCostCents:0,
  steps:['VERIFY_SOURCE','VERIFY_TENANT_AND_WRITER_LEASE','UNIVERSALIZER_INVENTORY','EXTRACT_EXISTING_CAPABILITIES','DRAFT_BUILD_PACK','SANDBOX_CODE_BRANCH','INDEPENDENT_FAULT_LINE','BROWSER_QA_3_ROUNDS','RECEIPT_AND_OWNER_RELEASE_GATE'],
  blocked:['PRODUCTION_DEPLOY','CUSTOMER_MESSAGE','SOCIAL_PUBLISH','DNS','SPEND','SECRET_CHANGE'],next:'Bind to the existing verified lease and worker; never treat this plan as an accepted task.'};
}