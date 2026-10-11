import test from 'node:test';
import assert from 'node:assert/strict';
import {compileSwarmMission,AGENT_ROUTES} from '../runtime/swarmnexus-compatibility.mjs';
const m={
 missionId:'DD-WLE-SWARMNEXUS-CONVERGENCE-20261011',
 projectId:'website-launch-engine-xps',tenantId:'SYNTHETIC',
 repo:'XTREME-SYSTEMS/digital-dominance',branch:'feature/wle-autonomous-bootstrap-sandbox-20261011',
 sourceSha:'4ade50a37ee0377e9837b1e3d542032e403de644',
 rollbackSha:'9918cbfe3a1037b3d8bf0158b1d78ae957ad63f2',
 actionClass:'DRAFT',maxCostCents:0,maxRepairAttempts:2,allowedProviders:['LOCAL_SANDBOX']};
const opts={
 principalVerified:true,tenantVerified:true,leaseVerified:true,mode:'DRAFT',
 providerStatus:{LOCAL_JARVIS:'EXECUTION_VERIFIED',XTREME_CLOUD_BROWSER:'HEALTH_VERIFIED',XTREME_FAULT_LINE:'UNAVAILABLE',XTREME_SEO_GENERATOR:'UNKNOWN'},
 roleExecutionProof:{'SOURCE_RESEARCH:LOCAL_JARVIS':true,'PLANNING:LOCAL_JARVIS':true}
};
const plan=(v={})=>compileSwarmMission(m,{...opts,...v});
test('all role routes are explicit and fixed',()=>assert.equal(Object.keys(AGENT_ROUTES).length,9));
test('missing tenant verified denies all dispatch',()=>assert.equal(plan({tenantVerified:false}).status,'BLOCKED'));
test('missing principal verified denies all dispatch',()=>assert.equal(plan({principalVerified:false}).status,'BLOCKED'));
test('source-sha drift denied',()=>assert.equal(compileSwarmMission({...m,sourceSha:'latest'},opts).status,'BLOCKED'));
test('unknown role rejected',()=>assert.equal(plan({requestedRoles:['ALL_SYSTEMS_ADMIN']}).status,'BLOCKED'));
test('duplicate role rejected',()=>assert.equal(plan({requestedRoles:['PLANNING','PLANNING']}).status,'BLOCKED'));
test('protected op is not routed',()=>assert.equal(plan({mode:'PRODUCTION_DEPLOY'}).status,'BLOCKED'));
test('no new queue or scheduler',()=>{const p=plan();assert.equal(p.newQueueCreated,false);assert.equal(p.existingSchedulerOnly,true);assert.equal(p.autoDispatched,false)});
test('unavailable Fault Line cannot be assigned as working',()=>{const p=plan({requestedRoles:['FAULT_AUDIT']});assert.equal(p.jobRequests[0].state,'BLOCKED_PROVIDER');assert.equal(p.jobRequests[0].provider,null)});
test('healthy browser alone is not browser QA execution proof',()=>{const p=plan({requestedRoles:['BROWSER_QA']});assert.equal(p.jobRequests[0].state,'BLOCKED_PROVIDER')});
test('provider role-specific execution proof permits only planned dispatch',()=>{const p=plan({requestedRoles:['BROWSER_QA'],roleExecutionProof:{'BROWSER_QA:XTREME_CLOUD_BROWSER':true}});assert.equal(p.status,'PLANNED_NOT_DISPATCHED');assert.equal(p.jobRequests[0].notExecuted,true);assert.equal(p.jobRequests[0].provider,'XTREME_CLOUD_BROWSER')});
test('planner with verified local role routes to existing local only',()=>{const p=plan({requestedRoles:['PLANNING']});assert.equal(p.jobRequests[0].provider,'LOCAL_JARVIS')});
test('packet builder receipt does not prove real coding',()=>{const p=plan({requestedRoles:['CODING']});assert.equal(p.jobRequests[0].state,'BLOCKED_PROVIDER')});
test('unknown provider health requires explicit proof',()=>{const p=plan({requestedRoles:['SEO_AUDIT']});assert.equal(p.jobRequests[0].state,'BLOCKED_PROVIDER')});
test('unapproved AI spending cannot enter',()=>{const p=compileSwarmMission({...m,maxCostCents:3},{...opts,requestedRoles:['PLANNING']});assert.equal(p.jobRequests[0].allowCostCents,0)});
test('no customer message sending in work packet',()=>{const p=plan({requestedRoles:['CLIENT_EMAIL_DRAFT'],roleExecutionProof:{'CLIENT_EMAIL_DRAFT:LOCAL_JARVIS':true}});assert.ok(p.protectedActions.includes('CLIENT_MESSAGE'))});
test('role execution proof never self-certifies client release',()=>{const p=plan({requestedRoles:['INDEPENDENT_REVIEW'],roleExecutionProof:{'INDEPENDENT_REVIEW:LOCAL_JARVIS':true}});assert.ok(p.jobRequests[0].requiresExternalDispatch);assert.equal(p.autoDispatched,false)});
