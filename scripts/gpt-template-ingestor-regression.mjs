// Offline security and quality regression for real gptTemplateIngestor source.
// No LLM calls, credits, Base44 writes, credentials or provider access.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const source=fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)),'..','base44','functions','gptTemplateIngestor','entry.ts'),'utf8');
assert.match(source,/GPT_TEMPLATE_INGESTOR_TOKEN/);
const adminPage=fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)),'..','src','pages','admin','GptTemplateSync.jsx'),'utf8');
assert.match(adminPage,/pendingReview/,'Admin shows pending drafts');
assert.match(adminPage,/Legacy Active · Unverified/,'Admin distinguishes old active templates from reviewed');
assert.match(adminPage,/window\.confirm/,'Batch requires actual operator confirmation');
assert.doesNotMatch(adminPage,/complete, production-ready HTML page/,'Admin must not falsely advertise completed sites');

assert.match(source,/constantTimeEquals/);
assert.match(source,/pending-visual-review/);
assert.match(source,/is_active:\s*false/);
assert.match(source,/status:\s*"draft"/);
assert.doesNotMatch(source,/stack:\s*error\.stack/);
assert.match(source,/24h_niche_cooldown/);
assert.match(source,/ART_DIRECTIONS/);
const inlined=source
 .replace(/^import \{ createClientFromRequest \} from "npm:@base44\/sdk@[^"]+";/m,'const createClientFromRequest = () => globalThis.__client;')
 .replace(/^import \{ secrets \} from "base44:runtime";/m,'const secrets = globalThis.__secrets;')
 .replace('export default async function(req: Request): Promise<Response> {','globalThis.__handler = async function(req: Request): Promise<Response> {');
assert.ok(!inlined.includes('from "base44:runtime"'));
assert.ok(!inlined.includes('export default async function'));
const compiled=ts.transpileModule(inlined,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None},reportDiagnostics:true});
assert.equal((compiled.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0,'TypeScript diagnostics');
const SECRET='test_'+('x'.repeat(55));
const validFixture='<!DOCTYPE html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Premium Candidate</title><style>body{background:#111;color:white}</style></head><body><main><h1>Premium Study</h1><section>Hero</section><section>Work</section><section>Proof</section><section>Process</section><section>Contact</section><p>'+('Original art direction and specific helpful service information. '.repeat(140))+'</p></main></body></html>';
assert.ok(validFixture.length>6000);
function runtime({role=null,bearer='',latest=[],html=validFixture,failLlm=false}={}){
 const calls={filter:0,llm:0,create:[],events:[],access:0};
 const service={
  entities:{
   TemplateLibrary:{
    filter:async(query)=>{calls.filter++;return Object.prototype.hasOwnProperty.call(query,'author')?latest:{items:[{niche:'epoxy',is_active:true,status:'active'},{niche:'roofing',is_active:false,status:'draft'}]};},
    create:async(fields)=>{calls.create.push(fields);return {id:'test-only-template-id'};}
   },
   SyncEvent:{create:async(fields)=>{calls.events.push(fields);return {id:'test-only-sync-event-id'};}}
  },
  integrations:{Core:{InvokeLLM:async({prompt})=>{calls.llm++;assert.match(prompt,/NO fabricated reviews/);assert.match(prompt,/SYNTHETIC DESIGN PREVIEW/);if(failLlm)throw Error('EXTERNAL_SECRET_FAKE');return html;}}}
 };
 const client={auth:{me:async()=>role?{role}:null},get asServiceRole(){calls.access++;return service}};
 const sandbox={
  __client:client,__secrets:{get:name=>name==='GPT_TEMPLATE_INGESTOR_TOKEN'?SECRET:''},
  Date,Math,TextEncoder,RegExp,Array,Object,String,Number,Boolean,JSON,Set,
  Response:{json:(body,options={})=>({status:options.status||200,body})},
  console:{error:()=>{}}
 };
 sandbox.globalThis=sandbox;
 vm.runInNewContext(compiled.outputText,sandbox,{timeout:3000});
 const handle=async(action='status',payload={})=>sandbox.__handler({
  headers:{get:n=>n.toLowerCase()==='authorization'?(bearer?'Bearer '+bearer:''):''},
  json:async()=>({action,...payload})
 });
 return {calls,handle};
}
const anon=runtime();
assert.equal((await anon.handle('generate',{niche:'epoxy'})).status,401);
assert.equal(anon.calls.llm,0);
assert.equal(anon.calls.access,0,'Anonymous must not acquire service role');
const viewer=runtime({role:'user'});
assert.equal((await viewer.handle('generate_batch',{niches:['epoxy']})).status,403);
assert.equal(viewer.calls.access,0);
const invalidToken=runtime({bearer:'z'.repeat(45)});
assert.equal((await invalidToken.handle('status')).status,401);
assert.equal(invalidToken.calls.filter,0);
const admin=runtime({role:'admin'});
const status=await admin.handle('status');
assert.equal(status.status,200);
assert.equal(status.body.pending_review,1);
assert.equal(status.body.previously_active,1);
const malformed=await admin.handle('generate_batch',{niches:'epoxy'});
assert.equal(malformed.status,400);
const max=await admin.handle('generate_batch',{niches:new Array(23).fill('epoxy')});
assert.equal(max.status,400);
assert.equal(admin.calls.llm,0);
const recently=runtime({role:'admin',latest:[{created_date:new Date().toISOString()}]});
const skipped=await recently.handle('generate',{niche:'epoxy'});
assert.equal(skipped.body.skipped,1);
assert.equal(recently.calls.llm,0);
assert.equal(recently.calls.create.length,0);
const authorized=runtime({bearer:SECRET});
const resp=await authorized.handle('generate',{niche:'roofing'});
assert.equal(resp.status,200);
assert.equal(resp.body.drafted,1);
assert.equal(resp.body.production_release,false);
assert.equal(authorized.calls.llm,1);
assert.equal(authorized.calls.create.length,1);
const draft=authorized.calls.create[0];
assert.equal(draft.is_active,false);
assert.equal(draft.status,'draft');
assert.ok(draft.tags.includes('pending-visual-review'));
assert.match(draft.content,/<meta name="robots" content="noindex,nofollow,noarchive">/);
assert.equal(authorized.calls.events.length,1);
assert.equal(authorized.calls.events[0].status,'pending');
assert.equal(authorized.calls.events[0].direction,'internal');
const badHtml=runtime({role:'admin',html:'<html><title>Too small</title></html>'});
const badResponse=await badHtml.handle('generate',{niche:'epoxy'});
assert.equal(badResponse.body.failed,1);
assert.equal(badHtml.calls.create.length,0);
const scripted=runtime({role:'admin',html:validFixture.replace('</main>','<script>fetch("https://evil.test")</script></main>')});
const scriptedResult=await scripted.handle('generate',{niche:'epoxy'});
assert.equal(scriptedResult.body.failed,1,'No stored executable scripts');
assert.equal(scripted.calls.create.length,0);
const evented=runtime({role:'admin',html:validFixture.replace('<main>','<main onload="alert(1)">')});
assert.equal((await evented.handle('generate',{niche:'epoxy'})).body.failed,1,'No inline DOM event handlers');
assert.equal(evented.calls.create.length,0);
const staleRobots=runtime({role:'admin',html:validFixture.replace('<title>','<meta name="robots" content="index,follow"><title>')});
assert.equal((await staleRobots.handle('generate',{niche:'epoxy'})).body.drafted,1);
const safeHtml=staleRobots.calls.create[0].content;
assert.ok(!safeHtml.includes('content="index,follow"'),'Indexing override must not survive');
assert.equal((safeHtml.match(/name="robots"/g)||[]).length,1);
assert.match(safeHtml,/<meta name="robots" content="noindex,nofollow,noarchive">/);
const fails=runtime({role:'admin',failLlm:true});
const failed=await fails.handle('generate',{niche:'epoxy'});
assert.equal(failed.body.failed,1);
assert.equal(fails.calls.create.length,0);
console.log('PASS GPT TEMPLATE INGESTOR SECURITY AND QUALITY: 14 backend cases + 4 UI truth checks; anonymous/read-only rejected, admin/service token accepted, 24h cooldown, preview-only draft, no fake sync PASS, malformed HTML refused, no real provider access');
