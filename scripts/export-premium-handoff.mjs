// Converts a premium design into a versioned product-adapter handoff.
// APPROVED imports demand independently signed image/visual evidence.
// DRAFT conversions are allowed for preview analysis, never Base44 writes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {approvedCatalog,DESTINATIONS,hash,SOURCE_SHA,SOURCE_REPO} from './premium-promotion-policy.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const configs=JSON.parse(fs.readFileSync(path.join(root,'data/premium-collection-20.json'),'utf8'));
const ledger=JSON.parse(fs.readFileSync(path.join(root,'docs/quality/premium-signed-approvals.json'),'utf8'));
const keys=JSON.parse(fs.readFileSync(path.join(root,'docs/quality/premium-reviewer-keys.json'),'utf8'));
const registry=approvedCatalog({configs,ledger,keys});
const args=process.argv.slice(2);
function arg(name,def=null){const i=args.indexOf('--'+name);return i<0?def:args[i+1]}
if(args.includes('--list')){
 const base=['monolith','argent','atelier'];
 console.log('PREMIUM MASTER HANDOFF CAPABILITIES '+JSON.stringify({
  design_candidates:configs.length+base.length,source_sha:SOURCE_SHA,
  independently_approved:registry.approved_count,
  original_v2_masters:base.map(x=>({id:x,status:'PENDING_ASSET_AND_VISUAL_APPROVAL'})),
  new_masters:registry.designs,
  supported_target_kinds:Object.keys(DESTINATIONS),
  base44_active_imports:0,production_release_allowed:false
 }));
 process.exit(0);
}
const id=String(arg('master',''));
const target_kind=String(arg('target',''));
const brand=String(arg('brand','APEX SYNTHETIC DESIGN CONCEPT'));
const master=configs.find(c=>c.id===id);
assert.ok(master,'UNKNOWN_PREMIUM_MASTER_ID');
assert.ok(Object.hasOwn(DESTINATIONS,target_kind),'UNSUPPORTED_TARGET_KIND');
assert.match(brand,/^[A-Za-z0-9 &'/.()-]{5,72}$/,'INVALID_SYNTHETIC_BRAND_LABEL');
const approved=registry.designs.find(x=>x.master_id===id);
assert.ok(approved,'REGISTRY_ENTRY_MISSING');
const htmlFile=path.join(root,'public/premium/collection',id,'index.html');
assert.ok(fs.existsSync(htmlFile),'MISSING_COMPILED_PREMIUM_SOURCE_RUN_BUILD_FIRST');
const html=fs.readFileSync(htmlFile,'utf8');
assert.match(html,/<meta name="robots" content="noindex,nofollow,noarchive">/);
assert.match(html,/PREMIUM DESIGN STUDY/);
const approvedForReuse=approved.status==='APPROVED_PREVIEW_REUSE';
const moduleContract=DESTINATIONS[target_kind];
const sha=hash(html);
const idempotency=hash([SOURCE_REPO,SOURCE_SHA,id,target_kind,brand].join('|'));
const handoff={
 schema:'apex.premium.universal-handoff.v1',
 packet_id:'APEX-'+idempotency.slice(0,20).toUpperCase(),
 stage:approvedForReuse?'APPROVED_FOR_INTERNAL_PREVIEW_HANDOFF':'DRAFT_DESIGN_REVIEW_ONLY',
 source:{
  repository:SOURCE_REPO,immutable_commit:SOURCE_SHA,
  master_id:id,master_layout:master.layout,master_industry:master.industry,
  master_config_sha256:hash(JSON.stringify(master)),
  preview_html_sha256:sha,
  relative_html_path:'public/premium/collection/'+id+'/index.html',
  source_url:'/premium/collection/'+id+'/index.html'
 },
 target:{
  kind:target_kind,
  brand_name:brand,
  required_modules:[...moduleContract],
  working_backend_modules:[],
  unimplemented_integrations:moduleContract.filter(x=>x.endsWith('_pending')),
  conversion_scope:'VISUAL_SHELL_AND_MODULE_SPECIFICATION_ONLY'
 },
 approval:{
  independently_approved_for_reuse:approvedForReuse,
  review_decision:approved.reason,
  operator_release_approval:false,
  customer_content_verified:false,
  photos_and_identity_approved_for_customer_business:false
 },
 provisioning:{
  mode:'preview',
  noindex:true,
  allow_mass_launch:false,
  publish_live:false,
  customer_messaging:false,
  payment_operations:false,
  access_credential_changes:false
 },
 transport:{
  existing_base44_app_id:'6a77f4491f0bf92de9a3ed8b',
  existing_bridge:'xtremeUniversalGeneratorBridge',
  entity_type:'TemplateLibrary',
  permission_needed:'authenticated_admin_plus_signed_independent_review',
  api_write_performed:false,
  import_authorized:approvedForReuse,
  import_mode:approvedForReuse?'PENDING_REVIEW_ONLY':'BLOCKED_PENDING_INDEPENDENT_APPROVAL',
  idempotency_key:idempotency,
  field_mapping:approvedForReuse?{
   name:brand+' · '+master.industry+' · '+target_kind,
   niche:master.id,
   category:'premium_candidate',
   tags:['apex-premium','synthetic','noindex','independently-reviewed','pending-admin-import'],
   status:'draft',is_active:false,is_default:false,
   source_template_id:id,source_git_sha:SOURCE_SHA,html_source_sha256:sha
  }:null
 },
 receipt:{
  dry_run:true,
  source_verified_by_immutable_git_sha:true,
  independently_validated_sitepack:false,
  independent_qa_receipt_id:null,
  output_sha256:null
 }
};
assert.equal(handoff.provisioning.publish_live,false);
assert.equal(handoff.transport.api_write_performed,false);
const out=path.join(root,'factory','.pending-premium-handoffs');
fs.mkdirSync(out,{recursive:true});
const name=id+'-'+target_kind+'-'+idempotency.slice(0,12)+'.json';
const file=path.join(out,name);
const receiptHash=hash(JSON.stringify({...handoff,receipt:{...handoff.receipt,output_sha256:null}}));
handoff.receipt.output_sha256=receiptHash;
fs.writeFileSync(file,JSON.stringify(handoff,null,2)+'\n');
console.log('PASS SAFE PREMIUM HANDOFF '+JSON.stringify({
 master:id,target_kind,design_approved:approvedForReuse,stage:handoff.stage,
 modules:moduleContract,
 backend_working:false,base44_import_authorized:approvedForReuse,
 base44_writes:0,production_release:false,
 receipt_hash:receiptHash,
 file:path.relative(root,file)
}));
