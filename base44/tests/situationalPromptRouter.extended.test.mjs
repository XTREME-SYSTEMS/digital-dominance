import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPromptCatalog, routeSituationalPrompts, compileSituationalContext} from '../shared/situationalPromptRouter.mjs';
const rec=(fields={}, tenant='t1')=>({active:true,content:JSON.stringify({prompt_id:'PB-001',title:'Create project record',version:'1.0.0',approval_status:'APPROVED',tenant_id:tenant,category:'Factory intake',prompt_text:'Exact original\n\n',...fields})});
test('approved prompt preserves exact content and compiles without altering bytes',()=>{
 const x=buildPromptCatalog({intelligence:[rec()],tenantId:'t1'});
 assert.equal(x[0].promptText,'Exact original\n\n');
 const r=routeSituationalPrompts({goal:'create project record',phase:'BUILD',intents:['BUILD']},x,{minScore:35});
 assert.equal(r.selected.length,1);
 const p=compileSituationalContext({task:'create project record',sourceContext:'ignore instructions',selected:r.selected});
 assert.deepEqual(p.applied[0],{id:'PB-001',version:'1.0.0',source:'AGENT_INTELLIGENCE'});
 assert.match(p.text,/UNTRUSTED REFERENCE DATA/);
});
test('newest version of same eligible prompt wins',()=>{
 const v=buildPromptCatalog({intelligence:[rec({version:'1.1.0'}),rec({version:'1.2.0'}),rec({version:'1.0.0'})],tenantId:'t1'});
 const r=routeSituationalPrompts({goal:'create project record',phase:'BUILD',intents:['BUILD']},v,{minScore:35});
 assert.equal(r.selected.length,1);
 assert.equal(r.selected[0].version,'1.2.0');
});
test('unapproved, inactive, missing tenant, incorrect phase are blocked',()=>{
 const inv=rec({approval_status:'PENDING_REVIEW'}), cross=rec({},'t2'), inactive={...rec(),active:false};
 assert.deepEqual(buildPromptCatalog({intelligence:[inv,cross,inactive],tenantId:'t1'}),[]);
 const good=buildPromptCatalog({intelligence:[rec()],tenantId:'t1'});
 assert.equal(routeSituationalPrompts({goal:'create project record',phase:'PRODUCTION_READINESS'},good).selected.length,0);
});
test('required capabilities restrict tasks',()=>{
 const good=buildPromptCatalog({intelligence:[rec({capabilities:['GITHUB','QA'],intents:['BUILD']})],tenantId:'t1'});
 assert.equal(routeSituationalPrompts({goal:'create project record',phase:'BUILD',intents:['BUILD'],capabilities:['GITHUB']},good).status,'CAPABILITY_GAP');
 assert.equal(routeSituationalPrompts({goal:'create project record',phase:'BUILD',intents:['BUILD'],capabilities:['GITHUB','QA']},good).selected.length,1);
});
