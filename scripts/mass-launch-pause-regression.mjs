// Regression: protected mass launch remains inactive until a true preview adapter exists.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const original = readFileSync(new URL('../base44/functions/massLaunchOrchestrator/entry.ts', import.meta.url),'utf8');
assert.match(original,/MASS_LAUNCH_PAUSED/);
assert.match(original,/PREVIEW_ADAPTER_NOT_BOUND/);
assert.doesNotMatch(original,/let deployedUrl = site\.domain/);
assert.doesNotMatch(original,/http_status: hasUrl \? 200 : 0/);
assert.doesNotMatch(original,/waitUntil\(runGoogleSyncAsync\(base44, deployedUrl\)\)/);

const withoutImports = original.replace(
  /^import \{ createClientFromRequest \} from 'npm:@base44\/sdk@[^']+';\s*$/m,
  'const createClientFromRequest = req => globalThis.__client(req);'
).replace(
  /^import \{ waitUntil \} from 'base44:runtime';\s*$/m,
  'const waitUntil = () => { throw new Error("MUST_NOT_RUN_BACKGROUND"); };'
);
assert.ok(!withoutImports.includes('from \'base44:runtime\''),'runtime import removed');
const transpiled=ts.transpileModule(withoutImports,{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
 reportDiagnostics:true,
});
const diagnosticErrors = (transpiled.diagnostics || []).filter(d=>d.category===ts.DiagnosticCategory.Error);
assert.equal(diagnosticErrors.length,0,'TS transpilation works');

async function probe(input, actor={role:'admin'}) {
 let reads=0, writes=0, llm=0, calls=0;
 const module={exports:{}};
 const client={
   auth:{me:async()=>actor},
   get asServiceRole(){reads++; throw new Error('UNSAFE_PRIVILEGED_ROLE_EXECUTION');},
   functions:{invoke:async()=>{calls++;throw new Error('UNSAFE_PROVIDER_INVOKE');}},
   integrations:{Core:{InvokeLLM:async()=>{llm++; throw new Error('UNSAFE_AI_CALL');}}},
 };
 const scope={
   module,exports:module.exports,
   __client:()=>client,
   Response:{json:(body,opts={})=>({status:opts.status||200,body})},
   Date,Math,Number,String,Object,Array,Boolean,Promise,URL,JSON,Set,
   console:{error(){}},
   fetch:async()=>{writes++;throw new Error('UNSAFE_NETWORK');}
 };
 scope.globalThis=scope;
 vm.runInNewContext(transpiled.outputText,scope,{timeout:3000});
 const result=await module.exports.default({json:async()=>input});
 assert.equal(reads,0,'No service-role access');
 assert.equal(writes,0,'No network');
 assert.equal(llm,0,'No AI spend');
 assert.equal(calls,0,'No Base44 function invocation');
 return result;
}
const payloads=[
 {},
 {mode:'auto'},
 {mode:'parallel',locations:Array.from({length:250},()=>({city:'Austin',state:'TX'})),templateKey:'epoxy'},
 {mode:'synthetic_noindex_canary',locations:[{city:'Synthetic City',state:'ZZ'}],templateKey:'epoxy_synthetic_canary'},
 {mode:'synthetic_noindex_canary',locations:[{city:'Synthetic City',state:'ZZ'}],templateKey:'epoxy_synthetic_canary',googleSyncEnabled:false,autoHealEnabled:false,runTestSwarm:false,provisionTarget:'vercel',continueBatchId:'legacy-batch'},
 {mode:'synthetic_noindex_canary',locations:[{city:'Synthetic City',state:'ZZ'}],templateKey:'epoxy_synthetic_canary',googleSyncEnabled:false,autoHealEnabled:false,runTestSwarm:false,provisionTarget:'vercel'}
];
for(let i=0;i<payloads.length;i++) {
 const result=await probe(payloads[i]);
 assert.equal(result.status,409);
 assert.equal(result.body.error,i===5?'PREVIEW_ADAPTER_NOT_BOUND':'MASS_LAUNCH_PAUSED');
}
assert.equal((await probe(payloads[5],null)).status,401);
assert.equal((await probe(payloads[5],{role:'user'})).status,403);
console.log('PASS mass launch quarantine: 8 cases, no paid generation, no provider write, no public indexing, admin-only and adapter fail-closed');
