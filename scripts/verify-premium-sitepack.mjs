// APEX universal SitePack export -> premium-master compilation regression.
// All tests stay in a local build sandbox. No provider calls, secrets or leads.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const script=path.join(ROOT,'scripts','compile-premium-sitepack.mjs');
const sha=s=>createHash('sha256').update(s).digest('hex');
const receiptFile=path.join(ROOT,'public','premium','sitepacks','synthetic-vanta','PREVIEW_RECEIPT.json');
const htmlFile=path.join(ROOT,'public','premium','sitepacks','synthetic-vanta','index.html');
const check=()=>spawnSync(process.execPath,[script,'--example'],{cwd:ROOT,encoding:'utf8',timeout:45000});
let ok=check();
assert.equal(ok.status,0,ok.stderr||'Example sitepack failed');
const html=fs.readFileSync(htmlFile,'utf8'),receipt=JSON.parse(fs.readFileSync(receiptFile,'utf8'));
assert.equal(sha(html),receipt.generated_html_sha256);
assert.equal(receipt.template_id,'vanta-motors');
assert.equal(receipt.mode,'STATIC_SYNTHETIC_EXAMPLE');
assert.equal(receipt.production_release_allowed,false);
assert.equal(receipt.indexable,false);
assert.equal(receipt.independent_guardian_validation,'NOT_RUN');
assert.match(html,/PREMIUM DESIGN STUDY/);
assert.match(html,/VANTA CONCEPT STUDIO/);
assert.match(html,/<meta name="robots" content="noindex,nofollow,noarchive">/);
const repeat=check();
assert.equal(repeat.status,0);
assert.equal(sha(fs.readFileSync(htmlFile)),receipt.generated_html_sha256,'Sitepack output changed between builds');
const catalog=fs.readFileSync(path.join(ROOT,'public','premium','collection','catalog-manifest.json'));
const pack={
 pack_id:'APEX-COMPOSER-FAKE-001',version:'universal-sitepack-v1',
 source:{repository:'XTREME-SYSTEMS/digital-dominance',template_id:'vanta-motors',catalog_manifest_sha256:sha(catalog)},
 brand:{name:'VANTA & CONCEPT STUDIO',contact_phone:'PENDING_VERIFIED_PHONE',legal_business_name:'PENDING_VERIFIED_LEGAL_NAME'},
 industry:{slug:'automotive',services:['PENDING_VERIFIED_FIRST_PARTY_SERVICE_CATALOG']},
 design:{visual_approval:false,master_family:'Cinematic industrial'},
 locations:[{city:'Test City',region:'ZZ',country:'US',verified_service_area:false}],
 provisioning:{mode:'preview',approval_required:true,noindex_until_validated:true},
 selection:{requested_quantity:1,industry_facts_verified:false},
 release_gates:{operator_approved:false,guardian_pass:false,real_customer_content_verified:false,source_sha_provider_verified:false,public_release_allowed:false,no_data_submitted:true,mass_launch_paused:true},
 packet_state:'DRAFT_FOR_OPERATOR_REVIEW_NOT_QUEUED'
};
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'apex-sitepack-'));
try{
 function runPacket(value){
  const packet={...value};
  delete packet.local_packet_checksum_sha256;
  packet.local_packet_checksum_sha256=sha(JSON.stringify(packet));
  const file=path.join(tmp,'packet.json');
  fs.writeFileSync(file,JSON.stringify(packet,null,2));
  return spawnSync(process.execPath,[script,'--packet',file],{cwd:ROOT,encoding:'utf8',timeout:45000});
 }
 const good=runPacket(pack);
 assert.equal(good.status,0,good.stderr);
 const destination=path.join(ROOT,'factory','.sitepack-preview-output',pack.pack_id.toLowerCase());
 assert.equal(fs.existsSync(path.join(destination,'index.html')),true);
 const preview=fs.readFileSync(path.join(destination,'index.html'),'utf8');
 assert.match(preview,/VANTA &amp; CONCEPT STUDIO/);
 assert.match(preview,/<meta name="robots" content="noindex,nofollow,noarchive">/);
 for(const [name,mutator] of [
  ['bulk',p=>({...p,selection:{...p.selection,requested_quantity:10}})],
  ['production',p=>({...p,release_gates:{...p.release_gates,public_release_allowed:true}})],
  ['wrongMaster',p=>({...p,source:{...p.source,template_id:'not-a-master'}})],
  ['wrongIndustry',p=>({...p,industry:{...p.industry,slug:'legal_services'}})],
  ['wrongCatalog',p=>({...p,source:{...p.source,catalog_manifest_sha256:'a'.repeat(64)}})]
 ]){
  const result=runPacket(mutator(pack));
  assert.notEqual(result.status,0,name+' should fail closed');
 }
 const wrongChecksum={...pack,local_packet_checksum_sha256:'0'.repeat(64)};
 const badFile=path.join(tmp,'tampered.json');
 fs.writeFileSync(badFile,JSON.stringify(wrongChecksum));
 const bad=spawnSync(process.execPath,[script,'--packet',badFile],{cwd:ROOT,encoding:'utf8',timeout:45000});
 assert.notEqual(bad.status,0,'Tampered pack checksum must fail');
 fs.rmSync(destination,{recursive:true,force:true});
 console.log('PASS PREMIUM SITEPACK COMPILER '+JSON.stringify({rendered_source_master:receipt.template_id,deterministic_rebuild:true,approved_source_pinned:true,offline_export_compiles:true,fail_closed_cases:6,live_customer_sites:0,provider_mutations:0,robots:'noindex',production_release:false}));
}finally{fs.rmSync(tmp,{recursive:true,force:true})}
