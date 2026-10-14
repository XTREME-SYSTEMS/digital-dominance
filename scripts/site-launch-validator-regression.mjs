// Fail-closed SiteLaunchValidator regression with a completely offline mocked Base44 client.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../base44/functions/siteLaunchValidator/entry.ts', import.meta.url), 'utf8');
const code = source.replace(
  /^import \{ createClientFromRequest \} from 'npm:@base44\/sdk@[^']+';$/m,
  'const createClientFromRequest = req => globalThis.__base44;'
).replace('export default async function', 'globalThis.__handler = async function');
assert.ok(!code.includes('import { createClientFromRequest }'), 'SDK runtime is replaced in harness');

const url = 'https://synthetic-fixture.vercel.app/canary/';
const meta = '<!doctype html><html><head><meta name="robots" content="noindex,nofollow"></head><body><h1>Synthetic only</h1></body></html>';
const site = { id:'site-synthetic-1',generated_url:url,target_city:'Synthetic City',target_state:'ZZ',status:'monitoring',seo_score:100,aeo_score:100,traffic_score:100 };
const guardian = {validator_version:'guardian:v1',deployment_id:'dpl_proof123',canonical_url:url,http_status:200,correct_robots:true,overall_pass:true};
let stubSite = { ...site }, stubReceipt = guardian, fetches = 0, remoteStatus = 200, header = 'noindex, nofollow', siteBody = meta;
const svc = {
  entities:{
    WebsiteQueue: { filter: async () => [stubSite], update: async () => ({ok:true}) },
    SiteValidationReceipt: { filter: async () => stubReceipt ? [stubReceipt] : [] },
    MassLaunchBatch: { filter: async () => [] },
  }
};
const context={
  __base44:{auth:{me:async()=>({role:'admin',id:'synthetic-admin'})},asServiceRole:svc},
  Response:{json:(data, opts={})=>({ status:opts.status||200, data })},
  fetch:async (...args)=>{
    fetches++;
    assert.equal(args[1]?.redirect,'manual','prevent private redirect following');
    return {status:remoteStatus,headers:{get:k=>({ 'content-type':'text/html','x-robots-tag':header,'content-length':String(siteBody.length) })[k]||null},text:async()=>siteBody};
  },
  Date,URL,AbortSignal,Math,Object,Array,Number,Boolean,String,Error,RegExp,console
};
context.globalThis=context;
vm.runInNewContext(code,context,{timeout:2500});
const run=async()=> (await context.__handler({json:async()=>({siteId:stubSite.id})})).data;
const pass=await run();
assert.equal(pass.all_pass,true,'correct live preview + independent Guardian receipt can pass');
assert.equal(pass.passed,1);
assert.equal(pass.sites[0].google_score,100);
assert.equal(pass.scoring_method,'internal_preview_evidence_not_google_ranking');

stubReceipt=null;
const noGuardian=await run();
assert.equal(noGuardian.all_pass,false,'cannot self-attest from HTTP only');
assert.equal(noGuardian.sites[0].checks.guardian_receipt_matches_preview,false);

stubReceipt={...guardian,validator_version:'3.0'};
assert.equal((await run()).all_pass,false,'self-issued v3 receipt cannot pass');
stubReceipt={...guardian,deployment_id:'batch_123'};
assert.equal((await run()).all_pass,false,'batch identifier is not deployment evidence');
stubReceipt={...guardian,canonical_url:'https://different.vercel.app/canary/'};
assert.equal((await run()).all_pass,false,'origin mismatch cannot pass');

stubReceipt=guardian;header='';
assert.equal((await run()).all_pass,false,'missing live noindex HTTP header cannot pass');
header='noindex, nofollow';siteBody='<html><body>no robots meta</body></html>';
assert.equal((await run()).all_pass,false,'missing HTML meta noindex cannot pass');
siteBody=meta;remoteStatus=302;
assert.equal((await run()).all_pass,false,'no redirect-following PASS');
remoteStatus=200;stubSite={...site,generated_url:'http://127.0.0.1/admin'};
fetches=0;
assert.equal((await run()).all_pass,false);
assert.equal(fetches,0,'SSRF/private URLs must never be fetched');
stubSite={...site,generated_url:null,status:'live'};stubReceipt=guardian;
assert.equal((await run()).all_pass,false,'claimed live status is not deployment proof');

console.log('PASS proof-gated validator (10 cases): HTTP+robots+Guardian+SHA semantics; fake status, redirects, private URL all rejected');
