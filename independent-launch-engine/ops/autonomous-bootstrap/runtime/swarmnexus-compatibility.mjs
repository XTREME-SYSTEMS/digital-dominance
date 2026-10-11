import {missionErrors,admit} from './mission-gate.mjs';

// SwarmNexus docs are DONOR SPECIFICATIONS, not independently running workers.
// This module is a pure, deterministic compatibility planner. It never starts jobs,
// makes provider calls, mutates production, pays for AI, or creates another scheduler.
export const BRIDGE_VERSION='SWARMNEXUS_MANUS_OPENCLAW_CONVERGENCE_V1';
export const AGENT_ROUTES=Object.freeze({
  SOURCE_RESEARCH:{provider:'LOCAL_JARVIS',role:'universalizer',fallback:[]},
  PLANNING:{provider:'LOCAL_JARVIS',role:'planner',fallback:[]},
  CODING:{provider:'LOCAL_JARVIS',role:'code_architect',fallback:[]},
  BROWSER_QA:{provider:'XTREME_CLOUD_BROWSER',role:'browser_qa',fallback:['LOCAL_JARVIS']},
  FAULT_AUDIT:{provider:'XTREME_FAULT_LINE',role:'fault_line_qa',fallback:['LOCAL_JARVIS']},
  INDEPENDENT_REVIEW:{provider:'LOCAL_JARVIS',role:'guardian',fallback:[]},
  SEO_AUDIT:{provider:'XTREME_SEO_GENERATOR',role:'growth_analyst',fallback:['LOCAL_JARVIS']},
  DOCUMENT_DRAFT:{provider:'LOCAL_JARVIS',role:'documenter',fallback:[]},
  CLIENT_EMAIL_DRAFT:{provider:'LOCAL_JARVIS',role:'communications_draft',fallback:[]}
});
export const DEFAULT_PROVIDER_STATUS=Object.freeze({
  LOCAL_JARVIS:'UNKNOWN',XTREME_CLOUD_BROWSER:'UNKNOWN',
  XTREME_FAULT_LINE:'UNKNOWN',XTREME_SEO_GENERATOR:'UNKNOWN'
});
const PHASES=Object.freeze([
  'SOURCE_RESEARCH','PLANNING','CODING','BROWSER_QA',
  'FAULT_AUDIT','INDEPENDENT_REVIEW','SEO_AUDIT',
  'DOCUMENT_DRAFT','CLIENT_EMAIL_DRAFT'
]);
const STATUSES=new Set(['HEALTH_VERIFIED','EXECUTION_VERIFIED','UNAVAILABLE','UNKNOWN']);
const isSafe=(x)=>typeof x==='string'&&/^[A-Z_]{3,45}$/.test(x);
function providerPolicy(provider,status,mode){
  if(!STATUSES.has(status))return {state:'BLOCKED',why:'UNKNOWN_PROVIDER_STATUS'};
  if(status==='UNAVAILABLE')return {state:'BLOCKED',why:'PROVIDER_UNAVAILABLE'};
  if(status==='UNKNOWN')return {state:'BLOCKED',why:'PROVIDER_UNVERIFIED'};
  if(mode==='DRAFT'&&status!=='EXECUTION_VERIFIED'&&status!=='HEALTH_VERIFIED')return {state:'BLOCKED',why:'PROVIDER_NOT_HEALTHY'};
  if(mode!=='DRAFT'&&status!=='EXECUTION_VERIFIED')return {state:'BLOCKED',why:'PROVIDER_EXECUTION_UNVERIFIED'};
  return {state:'ELIGIBLE',why:'PROVIDER_STATUS_ACCEPTED_FOR_PLANNING'};
}
export function compileSwarmMission(mission,{
  providerStatus=DEFAULT_PROVIDER_STATUS,
  roleExecutionProof={},
  requestedRoles=PHASES,
  mode='DRAFT',
  principalVerified=false,
  tenantVerified=false,
  leaseVerified=false
}={}){
  const errors=missionErrors(mission);
  if(errors.length)return {status:'BLOCKED',reasons:errors,jobRequests:[],autoDispatched:false};
  if(!['READ','DRAFT','BRANCH_WRITE','PREVIEW_WRITE'].includes(mode))return {status:'BLOCKED',reasons:['ACTION_MODE_INVALID'],jobRequests:[],autoDispatched:false};
  if(!Array.isArray(requestedRoles)||requestedRoles.some(x=>!isSafe(x)||!Object.hasOwn(AGENT_ROUTES,x)))return {status:'BLOCKED',reasons:['UNKNOWN_AGENT_ROLE'],jobRequests:[],autoDispatched:false};
  if(requestedRoles.length>PHASES.length||new Set(requestedRoles).size!==requestedRoles.length)return {status:'BLOCKED',reasons:['ROLE_QUANTITY_OR_DUPLICATE'],jobRequests:[],autoDispatched:false};
  const admissible=admit(mission,{principalVerified,tenantVerified,leaseVerified,operation:mode,
    provider:'LOCAL_SANDBOX',costCents:0,sourceSha:mission.sourceSha});
  if(admissible.state!=='ELIGIBLE_NONPRODUCTION')return {status:'BLOCKED',reasons:admissible.reasons||['ACTION_SCOPE_DENIED'],jobRequests:[],autoDispatched:false};
  const tasks=requestedRoles.map((name,i)=>{
    const route=AGENT_ROUTES[name];const candidates=[route.provider,...route.fallback];
    const viable=candidates.find(p=>providerPolicy(p,providerStatus[p]??'UNKNOWN',mode).state==='ELIGIBLE' && (mode==='READ'||roleExecutionProof[name+':'+p]===true));
    const stage=viable?'PLANNED_FOR_AUTHENTICATED_DISPATCH':'BLOCKED_PROVIDER';
    return {
      index:i+1,phase:name,assignedRole:route.role,provider:viable??null,
      state:stage,notExecuted:true,sourceSha:mission.sourceSha,tenantId:mission.tenantId,
      requiresExternalDispatch:true,requiresExistingX1Lease:true,
      allowProductionMutations:false,allowCostCents:0,
      reason:viable?null:'NO_VERIFIED_PROVIDER_AND_ROLE_EXECUTION_PROOF',
      idempotencyScope:mission.missionId+'|'+name+'|'+mission.sourceSha
    };
  });
  const blocked=tasks.filter(t=>t.state==='BLOCKED_PROVIDER').map(t=>t.phase);
  return {
    version:BRIDGE_VERSION,missionId:mission.missionId,
    status:blocked.length?'PARTIAL_PLAN_WITH_BLOCKERS':'PLANNED_NOT_DISPATCHED',
    existingSchedulerOnly:true,newQueueCreated:false,autoDispatched:false,
    protectedActions:['PRODUCTION_DEPLOY','DNS','CLIENT_MESSAGE','SOCIAL_PUBLISH','SECRETS','PAID_USAGE','REMOTE_CLIENT_ACCESS'],
    blockedPhases:blocked,jobRequests:tasks,
    executionNotice:'An eligible provider is not proof of a completed job. Dispatch only from an authenticated X1 or verified local worker with a real lease; record actual provider receipts.'
  };
}
