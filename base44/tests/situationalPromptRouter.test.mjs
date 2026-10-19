import test from "node:test";
import assert from "node:assert/strict";
import {buildPromptCatalog,routeSituationalPrompts,compileSituationalContext} from "../shared/situationalPromptRouter.mjs";
const builtins=[
{id:"PROMPT-003",name:"Recursive repair",objective:"repair failing code",category:"repair",intent_types:["REPAIR","HEAL"],system_types:["WEBSITE"],triggers:["repair","fix"],risk_class:"BRANCH_WRITE",prompt_text:"repair code"},
{id:"PROMPT-050",name:"Production release commander",objective:"review release",category:"release",intent_types:["RELEASE_PREP"],system_types:[],triggers:["release"],risk_class:"PROTECTED",prompt_text:"prepare deployment"}];
test("routes the relevant repair prompt without weak unrelated matches",()=>{
 const c=buildPromptCatalog({builtins});
 const r=routeSituationalPrompts({goal:"repair broken website code",intents:["REPAIR"],systemTypes:["WEBSITE"],phase:"REPAIR",agentRole:"BASE44"},c);
 assert.equal(r.selected.length,1);
 assert.equal(r.selected[0].id,"PROMPT-003");
});
test("draft imported prompts cannot become executable",()=>{
 const imported={active:true,content:JSON.stringify({prompt_id:"PB-001",title:"Factory",version:"1.0.0",import_status:"PENDING_REVIEW",prompt_text:"do stuff",intents:["BUILD"]})};
 const c=buildPromptCatalog({builtins,intelligence:[imported]});
 assert.equal(c.some(x=>x.id==="PB-001"),false);
});
test("approved prompts require matching tenant, stage, and role",()=>{
 const payload={prompt_id:"PB-142",title:"Agent orchestration",version:"1.0.0",approval_status:"APPROVED",tenant_id:"tenant-a",category:"Agent orchestration",phases:["BUILD"],agent_roles:["BASE44"],intents:["BUILD"],prompt_text:"bounded agent coding"};
 const c=buildPromptCatalog({intelligence:[{active:true,content:JSON.stringify(payload)}],tenantId:"tenant-a"});
 assert.equal(routeSituationalPrompts({goal:"build agent",intents:["BUILD"],phase:"BUILD",agentRole:"BASE44"},c).selected.length,1);
 assert.equal(routeSituationalPrompts({goal:"build agent",intents:["BUILD"],phase:"VALIDATE",agentRole:"BASE44"},c).selected.length,0);
 assert.equal(buildPromptCatalog({intelligence:[{active:true,content:JSON.stringify(payload)}],tenantId:"tenant-b"}).length,0);
});
test("risk flags follow protected class and compiler omits protected instructions",()=>{
 const c=buildPromptCatalog({builtins});
 const r=routeSituationalPrompts({goal:"release to production",intents:["RELEASE_PREP"]},c);
 assert.equal(r.selected[0].requiresApproval,true);
 const assembled=compileSituationalContext({task:"prepare release",selected:r.selected,kernel:"test"});
 assert.equal(assembled.applied.length,0);
});
test("deterministic selection, tie ordering, and size cap",()=>{
 const c=buildPromptCatalog({builtins});
 const input={goal:"repair",intents:["REPAIR"],systemTypes:["WEBSITE"]};
 assert.deepEqual(routeSituationalPrompts(input,c),routeSituationalPrompts(input,c));
 assert.ok(routeSituationalPrompts(input,c,{maxPrompts:100}).selected.length<=5);
});
test("malformed registry payload does not enter router",()=>{
 const c=buildPromptCatalog({intelligence:[{active:true,content:"not json"}]});
 assert.deepEqual(c,[]);
});
