import test from "node:test";
import assert from "node:assert/strict";
import { createMission, transitionMission, classifyToolCall, authorizeToolCall, determineLane } from "./missionContract.mjs";
const mission = () => createMission({ id: "m-1", goal: "Create a local roofing website and SEO PageSpec", actorId: "operator-1", tenantId: "xps", sourceSha: "test", scope: "staging" });
test("website goal maps to factory and uses approval-gated seven-stage plan", () => {
  const m = mission();
  assert.equal(m.lane, "WEBSITE_FACTORY");
  assert.equal(m.status, "DRAFT");
  assert.equal(m.stages.length, 7);
  assert.equal(m.stages[4].requiresApproval, true);
});
test("research and marketing goals have distinct lanes", () => {
  assert.equal(determineLane("Investigate competitor pricing"), "RESEARCH");
  assert.equal(determineLane("Create a 30-day social media campaign"), "MARKETING");
});
test("V1 refuses production-scoped missions", () => assert.throws(() => createMission({id:"a",goal:"x",actorId:"y",tenantId:"z",scope:"production"})));
test("read tool is permitted only with a bound mission", () => {
  assert.equal(authorizeToolCall({mission:mission(), toolName:"read_entities",args:{entity:"Lead"}}).allowed,true);
  assert.throws(() => authorizeToolCall({mission:{},toolName:"read_entities"}));
});
test("unknown and unapproved write tools fail closed", () => {
  assert.equal(authorizeToolCall({mission:mission(),toolName:"invoke_function",args:{function_name:"generatePage"}}).allowed,false);
  assert.equal(authorizeToolCall({mission:mission(),toolName:"write_entity",args:{operation:"create",entity:"AgentTask"}}).allowed,false);
});
test("generic chat approval never unlocks protected actions", () => {
  const m=mission(), a={id:"app-1",missionId:m.id,tenantId:m.tenantId,actorId:m.actorId,toolName:"invoke_function",target:"publishSite",expiresAt:Date.now()+60000};
  assert.equal(classifyToolCall("invoke_function",{function_name:"publishSite"}).risk,"PROTECTED");
  assert.equal(authorizeToolCall({mission:m,toolName:"invoke_function",args:{function_name:"publishSite"},approval:a,verifiedByServer:true}).allowed,false);
});
test("nonproduction approval is exact-target, signed-server-verified, and expiring", () => {
  const m=mission(), a={id:"app-1",missionId:m.id,tenantId:m.tenantId,actorId:m.actorId,toolName:"write_entity",target:"AgentTask",expiresAt:1000};
  const call={mission:m,toolName:"write_entity",args:{entity:"AgentTask",operation:"create"},approval:a,now:500};
  assert.equal(authorizeToolCall({...call,verifiedByServer:false}).allowed,false);
  assert.equal(authorizeToolCall({...call,verifiedByServer:true}).allowed,true);
  assert.equal(authorizeToolCall({...call,verifiedByServer:true,now:1001}).allowed,false);
  assert.equal(authorizeToolCall({...call,verifiedByServer:true,args:{entity:"Other",operation:"create"}}).allowed,false);
});
test("mission completion cannot be self-certified", () => {
  const m=mission();
  const p=transitionMission(m,"PLANNED",{reason:"Source truth found"});
  const q=transitionMission(p,"QUEUED",{reason:"Approved safe queue"});
  const r=transitionMission(q,"RUNNING",{reason:"Lease acquired"});
  const v=transitionMission(r,"VALIDATING",{reason:"Sandbox output produced"});
  assert.throws(()=>transitionMission(v,"COMPLETED",{reason:"Done"}));
  assert.throws(()=>transitionMission(v,"COMPLETED",{reason:"Done",validationReceipt:{missionId:m.id,status:"PASS",validatorId:m.actorId}}));
  const c=transitionMission(v,"COMPLETED",{reason:"Independent QA",validationReceipt:{missionId:m.id,status:"PASS",validatorId:"qa-independent"}});
  assert.equal(c.status,"COMPLETED");
  assert.equal(c.receipts.length,1);
});
test("invalid state transitions and empty goals are refused", () => {
  assert.throws(()=>transitionMission(mission(),"COMPLETED",{reason:"skip"}));
  assert.throws(()=>createMission({id:"a",goal:" ",actorId:"x",tenantId:"y"}));
});
