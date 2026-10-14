// APEX Universal SitePack -> Premium Visual Factory adapter (preview only).
// Reuses the actual art-directed master generator. It never invents new business
// facts, changes source templates, spends AI credits or deploys customer sites.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {page,configs,ROOT} from './build-premium-20.mjs';
const sha=s=>createHash('sha256').update(s).digest('hex');
const toSlug=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
const buildDir=path.join(ROOT,'public','premium','sitepacks');
const localDir=path.join(ROOT,'factory','.sitepack-preview-output');
const catalogPath=path.join(ROOT,'public','premium','collection','catalog-manifest.json');
const catalogSha=sha(fs.readFileSync(catalogPath));
const list=process.argv.slice(2);
const example=list.includes('--example');
const pIndex=list.indexOf('--packet');
if((example&&pIndex>=0)||(!example&&pIndex<0))throw Error('MODE_REQUIRED: use --example or --packet <file>');
if(!example&&(pIndex+1>=list.length||list[pIndex+1].startsWith('--')))throw Error('PACKET_FILE_REQUIRED');

function demoPacket(){
 const master=configs.find(x=>x.id==='vanta-motors');
 if(!master)throw Error('DEMO_MASTER_MISSING');
 return {
  pack_id:'APEX-SYNTHETIC-VANTA-001',version:'universal-sitepack-v1',
  source:{repository:'XTREME-SYSTEMS/digital-dominance',template_id:master.id,commit_sha:null,catalog_manifest_sha256:catalogSha,source_identity_status:'LOCAL_SOURCE_NOT_PROVIDER_VERIFIED'},
  brand:{name:'VANTA CONCEPT STUDIO',contact_phone:'PENDING_VERIFIED_PHONE',legal_business_name:'PENDING_VERIFIED_LEGAL_NAME'},
  industry:{slug:toSlug(master.industry),services:['PENDING_VERIFIED_FIRST_PARTY_SERVICE_CATALOG']},
  design:{approved_reference:null,visual_approval:false,master_family:master.family},
  locations:[{city:'Synthetic City',region:'ZZ',country:'US',verified_service_area:false}],
  provisioning:{mode:'preview',approval_required:true,noindex_until_validated:true},
  selection:{requested_quantity:1,industry_facts_verified:false},
  release_gates:{operator_approved:false,guardian_pass:false,real_customer_content_verified:false,provider_deployment_id:null,source_sha_provider_verified:false,public_release_allowed:false,no_data_submitted:true,mass_launch_paused:true},
  packet_state:'DRAFT_FOR_OPERATOR_REVIEW_NOT_QUEUED'
 };
}
const packet=example?demoPacket():JSON.parse(fs.readFileSync(path.resolve(list[pIndex+1]),'utf8'));
assert.equal(packet.version,'universal-sitepack-v1');
assert.match(String(packet.pack_id||''),/^[A-Za-z0-9_-]{12,100}$/);
assert.equal(packet.packet_state,'DRAFT_FOR_OPERATOR_REVIEW_NOT_QUEUED');
assert.equal(packet.source?.repository,'XTREME-SYSTEMS/digital-dominance');
assert.equal(packet.source?.catalog_manifest_sha256,catalogSha,'PACK_SOURCE_CATALOG_CHANGED_REAPPROVAL_REQUIRED');
assert.equal(packet.provisioning?.mode,'preview');
assert.equal(packet.provisioning?.approval_required,true);
assert.equal(packet.provisioning?.noindex_until_validated,true);
assert.equal(packet.design?.visual_approval,false);
assert.equal(packet.selection?.requested_quantity,1,'PREVIEW_SINGLE_SITE_ONLY');
assert.equal(packet.selection?.industry_facts_verified,false);
assert.ok(packet.release_gates&&packet.release_gates.operator_approved===false);
assert.equal(packet.release_gates.guardian_pass,false);
assert.equal(packet.release_gates.real_customer_content_verified,false);
assert.equal(packet.release_gates.public_release_allowed,false);
assert.equal(packet.release_gates.mass_launch_paused,true);
assert.equal(packet.release_gates.source_sha_provider_verified,false);
assert.equal(packet.release_gates.no_data_submitted,true);
assert.ok(Array.isArray(packet.locations)&&packet.locations.length>=1);
assert.ok(packet.locations.every(x=>x.verified_service_area===false));
assert.ok(typeof packet.brand?.name==='string'&&packet.brand.name.length>=3&&packet.brand.name.length<=90);
assert.ok(!/[<>]/.test(packet.brand.name));
assert.ok(String(packet.brand.contact_phone).startsWith('PENDING_'));
assert.ok(String(packet.brand.legal_business_name).startsWith('PENDING_'));
assert.ok(Array.isArray(packet.industry?.services));
assert.ok(packet.industry.services.every(x=>String(x).startsWith('PENDING_')));
if(!example){
 assert.match(packet.local_packet_checksum_sha256||'',/^[a-f0-9]{64}$/);
 const canonical={...packet};
 delete canonical.local_packet_checksum_sha256;
 assert.equal(sha(JSON.stringify(canonical)),packet.local_packet_checksum_sha256,'EXPORTED_SITEPACK_CHECKSUM_MISMATCH');
}
const master=configs.find(x=>x.id===packet.source?.template_id);
if(!master)throw Error('UNKNOWN_MASTER_TEMPLATE');
assert.equal(packet.industry.slug,toSlug(master.industry),'INDUSTRY_MASTER_MISMATCH');
const brand=packet.brand.name.trim();
// page() is originally nested under /premium/collection/<master>/.
 // SitePack previews use /premium/sitepacks/<pack>/, so rebase ONLY the
 // library-return link while keeping the original layout and scripts intact.
const sourceHtml=page({...master,name:brand});
const oldGalleryLink='href="../index.html">Browse every master';
if(!sourceHtml.includes(oldGalleryLink))throw Error('PREMIUM_MASTER_GALLERY_LINK_CHANGED');
const render=sourceHtml.replace(oldGalleryLink,'href="../../collection/index.html">Browse every master');
assert.match(render,/<meta name="robots" content="noindex,nofollow,noarchive">/);
assert.match(render,/PREMIUM DESIGN STUDY \/ FICTIONAL BRAND \/ NO LIVE ENQUIRIES OR PURCHASES/);
assert.ok(render.includes(brand),'Brand has not been injected');
const folder=example?path.join(buildDir,'synthetic-vanta'):path.join(localDir,packet.pack_id.toLowerCase());
assert.ok(folder.startsWith((example?buildDir:localDir)+path.sep),'OUTPUT_PATH_INVALID');
fs.mkdirSync(folder,{recursive:true});
fs.writeFileSync(path.join(folder,'index.html'),render);
const receipt={
 schema:'apex.premium.sitepack.preview-receipt.v1',
 sitepack_id:packet.pack_id,template_id:master.id,
 master_layout:master.layout,industry:master.industry,
 brand_preview_name:brand,source_catalog_sha256:catalogSha,
 sitepack_checksum_sha256:example?sha(JSON.stringify(packet)):packet.local_packet_checksum_sha256,
 generated_html_sha256:sha(render),html_bytes:Buffer.byteLength(render),
 mode:example?'STATIC_SYNTHETIC_EXAMPLE':'OFFLINE_PACKET_PREVIEW',
 provider_deployment_id:null,source_commit_provider_verified:false,
 independent_guardian_validation:'NOT_RUN',visual_approval:false,
 production_release_allowed:false,indexable:false,
 real_business_claims_approved:false,real_client_leads_received:0,
 public_customer_websites_created:0
};
fs.writeFileSync(path.join(folder,'PREVIEW_RECEIPT.json'),JSON.stringify(receipt,null,2)+'\n');
console.log('PASS SITEPACK PREMIUM PREVIEW '+JSON.stringify({sitepack:packet.pack_id,master:master.id,bytes:receipt.html_bytes,hash:receipt.generated_html_sha256,mode:receipt.mode,out:path.relative(ROOT,folder),indexable:false,production_release:false}));
