import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveProjectRoute,listProjectReadiness,ProjectRouteDenied} from './project-router.mjs';
const principal={verifiedByServer:true,subject:'synthetic-staging-admin',tenantId:'synthetic-tenant'};
const route=(projectKey,operation,actionClass='READ',p=principal,tenantId='synthetic-tenant')=>resolveProjectRoute({projectKey,operation,actionClass,principal:p,tenantId});
function denied(fn,code) { assert.throws(fn,e=>e instanceof ProjectRouteDenied && e.code===code); }
test('all four project ids registered',()=>assert.deepEqual(new Set(listProjectReadiness().map(x=>x.key)),new Set(['x1_production','x1_staging','strategic_intelligence','property_intelligence'])));
test('production read-only route with no credentials',()=>{const x=route('x1_production','queue.status.aggregate');assert.equal(x.projectRef,'vgsmyhqqtkkluhypxyua');assert.equal(x.credentials,'NOT_ATTACHED');});
test('reject production mutations',()=>denied(()=>route('x1_production','queue.status.aggregate','DRAFT'),'PRODUCTION_OR_SPECIALIST_WRITE_PROTECTED'));
test('allow staging draft mission route',()=>assert.equal(route('x1_staging','mission.draft.record','DRAFT').projectRef,'uvdkzsbjackpjvpoxtyk'));
test('reject staging status mutation',()=>denied(()=>route('x1_staging','queue.status.aggregate','DRAFT'),'UNAPPROVED_ACTION_CLASS'));
test('reject unapproved strategic raw data access',()=>denied(()=>route('strategic_intelligence','market.data.read'),'UNAPPROVED_OPERATION'));
test('reject property raw record access',()=>denied(()=>route('property_intelligence','distressed_properties.read'),'UNAPPROVED_OPERATION'));
test('reject sensitive operation naming',()=>denied(()=>route('strategic_intelligence','agent_secret.read'),'UNAPPROVED_OPERATION'));
test('reject unknown project',()=>denied(()=>route('unknown','health.metadata'),'UNKNOWN_PROJECT'));
test('reject unverified caller',()=>denied(()=>route('x1_production','health.metadata','READ',{...principal,verifiedByServer:false}),'AUTHENTICATED_PRINCIPAL_REQUIRED'));
test('reject cross-tenant access',()=>denied(()=>route('x1_production','health.metadata','READ',principal,'different'),'CROSS_TENANT_ACCESS_DENIED'));
test('reject specialist mutation',()=>denied(()=>route('property_intelligence','health.metadata','PROTECTED'),'PRODUCTION_OR_SPECIALIST_WRITE_PROTECTED'));
