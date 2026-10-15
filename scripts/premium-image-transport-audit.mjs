// Independent, read-only byte evidence of the five replaced Pexels photo
// assets. GitHub CI writes an artifact; it never grants visual or release approval.
// Avoids user secrets, paid APIs, customer information and publication.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=JSON.parse(fs.readFileSync(path.join(root,'docs/quality/premium-hero-image-evidence-20261014.json'),'utf8'));
const configs=JSON.parse(fs.readFileSync(path.join(root,'data/premium-collection-20.json'),'utf8'));
const pinned=JSON.parse(fs.readFileSync(path.join(root,'docs/quality/premium-hero-asset-digests-20261015.json'),'utf8'));
assert.equal(pinned.schema,'apex.premium.pinned-image-transport-receipts.v1');
assert.equal(pinned.semantic_visual_approval,'PENDING');
assert.equal(pinned.production_release_allowed,false);
assert.equal(pinned.records.length,5);
assert.equal(new Set(pinned.records.map(x=>x.master+'|'+x.field)).size,5);
assert.equal(source.schema_version,'apex.premium.hero-image-review.v1');
assert.equal(source.image_change_count,5);
assert.equal(source.sources.length,5);
assert.equal(source.production_allowed,false);
const digest=x=>createHash('sha256').update(x).digest('hex');
const result={
 schema:'apex.premium.hero-image-transport-v1',
 source_evidence_sha256:digest(JSON.stringify(source)),
 source_repository:'XTREME-SYSTEMS/digital-dominance',
 source_commit:process.env.GITHUB_SHA||process.env.VERCEL_GIT_COMMIT_SHA||null,
 source_page_license:'https://www.pexels.com/license/',
 disclaimer:'SHA-256 verifies response bytes only, NOT semantic review, likeness consent, stock endorsement, origin provenance beyond URL or permission for customer-release claims.',
 immutable_source_approved:false,
 production_release_allowed:false,
 verified_at:new Date().toISOString(),
 samples:[]
};
for(const entry of source.sources){
 const design=configs.find(x=>x.id===entry.master);
 assert.ok(design);
 assert.equal(design[entry.field],'pexels-'+entry.pexels_id);
 assert.match(entry.source_url,new RegExp('^https://www\\.pexels\\.com/photo/[a-z0-9-]*'+entry.pexels_id+'/$'));
 const url='https://images.pexels.com/photos/'+entry.pexels_id+'/pexels-photo-'+entry.pexels_id+'.jpeg?auto=compress&cs=tinysrgb&w=1800&q=78&fit=crop';
 const sample={
  master:entry.master,field:entry.field,category:design.industry,
  image_id:entry.pexels_id,asset_url:url,source_url:entry.source_url,
  claimed_subject:entry.semantic,
  http_status:null,content_type:null,bytes:null,asset_sha256:null,
  transport:'UNKNOWN',semantic_visual_review:'PENDING',independent_approval:'PENDING'
 };
 try {
  const r=await fetch(url,{redirect:'follow',signal:AbortSignal.timeout(20000),headers:{Accept:'image/jpeg,image/avif,image/webp,image/*'}});
  sample.http_status=r.status;
  sample.content_type=(r.headers.get('content-type')||'').split(';')[0].trim();
  if(!r.ok||!/^image\/(jpeg|png|webp|avif)$/i.test(sample.content_type))throw Error('IMAGE_HTTP_OR_MIME');
  const data=Buffer.from(await r.arrayBuffer());
  sample.bytes=data.length;
  if(data.length<10000||data.length>12000000)throw Error('IMAGE_BYTES_SIZE_INVALID');
  sample.asset_sha256=digest(data);
  // Cross-check against the independent CI artifact captured on 2026-10-15.
  const approvedTransport=pinned.records.find(x=>
    x.master===entry.master && x.field===entry.field && x.pexels_id===entry.pexels_id);
  if(!approvedTransport || approvedTransport.source_url!==entry.source_url ||
     approvedTransport.asset_sha256!==sample.asset_sha256 || approvedTransport.bytes!==data.length)
    throw Error('PINNED_IMAGE_DIGEST_OR_SOURCE_DRIFT');
  sample.transport='PASS';
 } catch(e) {
  sample.transport='FAIL';
  sample.error=String(e.message||e).slice(0,200);
 }
 result.samples.push(sample);
}
result.count=result.samples.length;
result.http_image_pass=result.samples.filter(x=>x.transport==='PASS').length;
result.status=result.http_image_pass===5?'HTTP_BYTES_VERIFIED_SEMANTIC_APPROVAL_PENDING':'TRANSPORT_BLOCKED';
const out=path.join(root,'factory','.premium-evidence-output');
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'premium-photo-hashes.json'),JSON.stringify(result,null,2)+'\n');
console.log('PREMIUM_IMAGE_TRANSPORT '+JSON.stringify({status:result.status,pass:result.http_image_pass,total:5,asset_receipts:result.samples.map(x=>({master:x.master,field:x.field,sha256:x.asset_sha256,bytes:x.bytes,status:x.transport,error:x.error}))}));
if(result.http_image_pass!==5)process.exitCode=1;
