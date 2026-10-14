// Reusable independent HTTP proof for a deterministically compiled synthetic
// website, manifest and actual backend round trip. No customer data or outbound actions.
// Usage: node scripts/verify-factory-preview-live.mjs https://KNOWN.vercel.app
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const target=process.argv[2];
assert.ok(target,'Provide an existing Vercel preview host');
const origin=new URL(target);
assert.equal(origin.protocol,'https:');
assert.ok(origin.hostname.endsWith('.vercel.app'));
assert.ok(!origin.username&&!origin.password&&!origin.port&&!origin.search&&!origin.hash);
const http=async(path,opts={})=>{
 const res=await fetch(origin.origin+path,{redirect:'manual',signal:AbortSignal.timeout(20000),...opts});
 const type=res.headers.get('content-type')||'';
 const data=type.includes('application/json')?await res.json():await res.text();
 return {status:res.status,headers:res.headers,data};
};
const page=await http('/factory-demo/');
assert.equal(page.status,200,'Generated site must be live');
assert.match(page.headers.get('x-robots-tag')||'',/noindex/i);
assert.match(page.headers.get('x-content-type-options')||'',/nosniff/i);
assert.match(page.data,/<meta name="robots" content="noindex,nofollow,noarchive">/);
assert.match(page.data,/<meta name="viewport"/);
assert.match(page.data,/NOT A REAL BUSINESS/);
assert.match(page.data,/Synthetic City/);
assert.match(page.data,/id="demo-form"/);
assert.match(page.data,/id="area"/);
assert.doesNotMatch(page.data,/<a\b[^>]*href=["'](?:tel:|mailto:)/i);
const receipt=await http('/factory-demo/manifest.json');
assert.equal(receipt.status,200);
assert.match(receipt.headers.get('x-robots-tag')||'',/noindex/i);
assert.equal(receipt.data.schema_version,'apex-preview-manifest-v1');
assert.equal(receipt.data.synthetic,true);
assert.equal(receipt.data.indexable,false);
assert.equal(receipt.data.production_release,false);
assert.equal(receipt.data.customer_data_persisted,false);
assert.equal(receipt.data.customers_contacted,0);
const sha=createHash('sha256').update(page.data).digest('hex');
assert.equal(sha,receipt.data.html_sha256,'SHA256 byte-identical preview to generated manifest');
const fixture={fixture_id:'apex-single-noindex-canary-v1',name:'Synthetic Test Lead',email:'synthetic-test@example.invalid',message:'Synthetic canary: form-to-API connectivity test'};
const post=body=>http('/api/canary-lead',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
const valid=await post(fixture);
assert.equal(valid.status,200);
assert.equal(valid.data.ok,true);
assert.equal(valid.data.synthetic,true);
assert.equal(valid.data.persisted,false);
assert.equal(valid.data.outbound_messages,0);
assert.match(valid.data.receipt_id||'',/^CANARY-[a-f0-9]{24}$/);
const invalid=await post({...fixture,email:'not-the-synthetic-fixture@example.invalid'});
assert.equal(invalid.status,422);
const getDenied=await http('/api/canary-lead');
assert.equal(getDenied.status,405);
console.log('PASS LIVE ONE-SITE FACTORY '+JSON.stringify({
 origin:origin.origin,site:'/factory-demo/',html_sha256:sha,manifest_sha256:receipt.data.fixture_sha256,
 html_http:page.status,manifest_http:receipt.status,api_http:valid.status,
 invalid_http:invalid.status,api_get_http:getDenied.status,
 source_sha:valid.data.source_sha,synthetic_receipt_id:valid.data.receipt_id,
 noindex_header:true,noindex_meta:true,
 synthetic:true,customer_data_persisted:false,customer_outbound:false
}));
