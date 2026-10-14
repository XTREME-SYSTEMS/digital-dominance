// Executable independent HTTP verification for one noindex preview. No human data or messaging.
// Usage: node scripts/verify-apex-canary-live.mjs <https://known-preview.vercel.app>
// Optional: EXPECTED_DEPLOY_SHA=<40-hex-sha> (only for immutable preview URLs)
import assert from 'node:assert/strict';
const address = process.argv[2];
assert.ok(address,'Pass exact URL of the known authorized HTTPS Vercel preview');
const u=new URL(address);
assert.equal(u.protocol,'https:');
assert.ok(u.hostname.endsWith('.vercel.app'),'Host must be a Vercel preview, not an arbitrary internal endpoint');
assert.ok(!u.username&&!u.password&&!u.port&&!u.search&&!u.hash);
const origin=u.origin;
const query=async(path,options={})=>{
 const res=await fetch(origin+path,{redirect:'manual',signal:AbortSignal.timeout(20000),...options});
 const type=res.headers.get('content-type')||'';
 const payload=type.includes('application/json') ? await res.json() : await res.text();
 return {status:res.status,headers:res.headers,data:payload};
};
const page=await query('/canary/');
assert.equal(page.status,200);
assert.match(page.headers.get('x-robots-tag')||'',/noindex/i);
assert.match(page.data,/<meta\s+name="robots"\s+content="noindex/i);
assert.match(page.data,/id="canary-form"/);
const fixture={fixture_id:'apex-single-noindex-canary-v1',name:'Synthetic Test Lead',email:'synthetic-test@example.invalid',message:'Synthetic canary: form-to-API connectivity test'};
const post=body=>query('/api/canary-lead',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
const api=await post(fixture);
assert.equal(api.status,200);
assert.equal(api.data?.ok,true);
assert.equal(api.data?.synthetic,true);
assert.equal(api.data?.persisted,false);
assert.equal(api.data?.outbound_messages,0);
assert.match(api.data?.receipt_id||'',/^CANARY-[a-f0-9]{24}$/);
assert.match(api.headers.get('x-robots-tag')||'',/noindex/i);
if(process.env.EXPECTED_DEPLOY_SHA)assert.equal(api.data?.source_sha,process.env.EXPECTED_DEPLOY_SHA);
const bad=await post({...fixture,email:'wrong@example.invalid'});
assert.equal(bad.status,422);
assert.equal(bad.data.code,'SYNTHETIC_FIXTURE_ONLY');
const denied=await query('/api/canary-lead');
assert.equal(denied.status,405);
const repeat=await post(fixture);
assert.equal(repeat.status,200);
assert.equal(repeat.data.receipt_id,api.data.receipt_id);
console.log('PASS LIVE APEX CANARY '+JSON.stringify({origin,source_sha:api.data.source_sha,receipt_id:api.data.receipt_id,page_http:page.status,api_http:api.status,invalid_http:bad.status,method_http:denied.status,idempotent:true,noindex:true,synthetic:true,persisted:false,outbound_messages:0}));
