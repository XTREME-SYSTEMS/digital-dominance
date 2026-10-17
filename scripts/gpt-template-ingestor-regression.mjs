// Offline behavior regression against the actual GPT Template Ingestor handler.
// No network, provider credentials, Base44 writes, external cost or customer data.
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
const require=createRequire(import.meta.url);
const esbuild=require("esbuild");
const path=new URL("../base44/functions/gptTemplateIngestor/entry.ts",import.meta.url);
const source=fs.readFileSync(path,"utf8");
assert.match(source,/if \(!user\) return Response\.json/);
assert.match(source,/if \(user\.role !== "admin"\)/);
const executable=source.replace(/^import \{ createClientFromRequest \} from "npm:@base44\/sdk@[^"]+";\s*$/m,
 'const createClientFromRequest = req => globalThis.__client(req);');
assert.doesNotMatch(executable,/from "npm:@base44\/sdk/);
const transpiled=esbuild.transformSync(executable,{loader:"ts",format:"cjs",target:"es2022"}).code;
const goodHTML='<!DOCTYPE html><html lang="en"><head><title>Fictional Design</title><style>body{color:black}</style></head><body><h1>Design preview</h1><p>'+('An original visual composition. '.repeat(200))+'</p><form><input name="name"><textarea></textarea><button type="submit">Send</button></form></body></html>';
const badHTML=goodHTML.replace('</body>','<script>alert(1)</script></body>');
const stats={privilegeReads:0,creations:0,llmCalls:0,syncEvents:0,lastRecord:null};
let response=goodHTML;
const service={
  entities:{
   TemplateLibrary:{
    filter:async()=>({items:[{niche:"epoxy",status:"draft",is_active:false},{niche:"epoxy",status:"active",is_active:true}]}),
    create:async row=>{stats.creations++;stats.lastRecord=row;return{id:"fake-id"}}
   },
   SyncEvent:{create:async()=>{stats.syncEvents++;return{id:"fake-log"}}}
  },
  integrations:{Core:{InvokeLLM:async()=>{stats.llmCalls++;return response}}}
};
let role={role:"admin"};
const base44={
  auth:{me:async()=>role},
  get asServiceRole(){stats.privilegeReads++;return service;}
};
const sandbox={
  module:{exports:{}},exports:{},
  __client:()=>base44,
  Response:{json:(payload,opt={})=>({status:opt.status||200,data:payload})},
  console:{error(){}},
  JSON,Date,Set,Object,Array,String,Number,Boolean,RegExp,Error,Promise
};
sandbox.exports=sandbox.module.exports;
sandbox.globalThis=sandbox;
vm.runInNewContext(transpiled,sandbox,{timeout:3000});
const handler=sandbox.module.exports.default;
assert.equal(typeof handler,"function");
const request=async data=>handler({json:async()=>data});
role=null;
let r=await request({action:"generate",niche:"epoxy"});
assert.equal(r.status,401);assert.equal(stats.privilegeReads,0);assert.equal(stats.llmCalls,0);
role={role:"user"};
r=await request({action:"status"});
assert.equal(r.status,403);assert.equal(stats.privilegeReads,0);
role={role:"admin"};
r=await request({action:"status"});
assert.equal(r.status,200);assert.equal(r.data.total_gpt_templates,2);assert.equal(r.data.pending_review,1);assert.equal(r.data.legacy_active_unverified,1);
const countBefore=stats.llmCalls;
r=await request({action:"generate_batch",niches:Array.from({length:21},()=>"epoxy")});
assert.equal(r.status,409,"old cron cannot run unapproved paid 21-call batch");
assert.equal(stats.llmCalls,countBefore,"no paid call on denied batch");
r=await request({action:"generate_batch",niches:["epoxy","epoxy"]});
assert.equal(r.status,400);
r=await request({action:"generate",niche:"not-real"});
assert.equal(r.status,400);
response=badHTML;
r=await request({action:"generate",niche:"epoxy"});
assert.equal(r.status,200);assert.equal(r.data.succeeded,0);
assert.equal(stats.creations,0,"executable HTML must not persist");
response=goodHTML;
r=await request({action:"generate",niche:"epoxy"});
assert.equal(r.status,200);assert.equal(r.data.succeeded,1);
assert.equal(stats.creations,1);
assert.equal(stats.syncEvents,1);
assert.equal(stats.lastRecord.status,"draft");
assert.equal(stats.lastRecord.is_active,false);
assert.equal(stats.lastRecord.is_default,false);
assert.ok(stats.lastRecord.tags.includes("pending-visual-qa"));
assert.match(stats.lastRecord.content,/name="robots" content="noindex,nofollow,noarchive"/);
assert.match(stats.lastRecord.content,/<input disabled/);
assert.match(stats.lastRecord.content,/<button disabled/);
assert.match(stats.lastRecord.content,/<textarea disabled/);
assert.ok(!stats.lastRecord.content.includes('<script>'));
console.log("PASS GPT TEMPLATE INGESTOR: unauthorized/forbidden blocked; status counts drafts; paid batch cap; HTML security gate; synthetic noindex inert draft; no live or customer writes");
