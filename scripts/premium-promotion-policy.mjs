// Pure, independently signed premium visual promotion policy.
// NO internal reviewer key is bundled. The AI generator CANNOT approve itself.
import assert from 'node:assert/strict';
import {verify,createHash} from 'node:crypto';

const HEX64=/^[0-9a-f]{64}$/i;
const SHA40=/^[0-9a-f]{40}$/i;
export const SOURCE_REPO='XTREME-SYSTEMS/digital-dominance';
export const SOURCE_SHA='827eebc6f9c665cf2df42ed965d36dec5fdd35a9';
export const DESTINATIONS=Object.freeze({
 marketing_website:['pages','design_tokens','original_asset_provenance','seo_preview'],
 lead_generation_funnel:['pages','design_tokens','verified_cta_map','form_adapter_pending'],
 ecommerce_frontend:['pages','design_tokens','product_catalog_adapter_pending','checkout_adapter_pending'],
 client_portal_frontend:['pages','design_tokens','tenant_auth_adapter_pending','crm_adapter_pending'],
 saas_dashboard_frontend:['pages','design_tokens','rbac_adapter_pending','database_adapter_pending'],
 pwa_shell:['pages','design_tokens','offline_cache_adapter_pending','push_permission_adapter_pending'],
 training_portal_frontend:['pages','design_tokens','courses_adapter_pending','enrollment_adapter_pending']
});
export const hash=x=>createHash('sha256').update(x).digest('hex');
const safeUrl=(x,host)=>{
 try {const u=new URL(x);return u.protocol==='https:'&&u.hostname===host&&!u.username&&!u.password} catch{return false}
};
export function canonicalApproval(record) {
 if(!record||typeof record!=='object')throw Error('APPROVAL_MISSING');
 const images=(record.images||[]).map(i=>({
  field:i.field,photo_id:i.photo_id,asset_sha256:i.asset_sha256,
  semantic_score:i.semantic_score,source_url:i.source_url,rights_review:i.rights_review
 })).sort((a,b)=>a.field.localeCompare(b.field));
 const payload={
  schema:'apex.premium.independent.design-approval.v1',
  master_id:record.master_id,source_repository:record.source_repository,
  source_sha:record.source_sha,source_design_sha256:record.source_design_sha256,
  reviewer_id:record.reviewer_id,reviewer_key_id:record.reviewer_key_id,
  evidence_url:record.evidence_url,desktop_screenshot_sha256:record.desktop_screenshot_sha256,
  mobile_screenshot_sha256:record.mobile_screenshot_sha256,
  visual_score:record.visual_score,
  review_outcome:record.review_outcome,
  scope:record.scope,
  images
 };
 return JSON.stringify(payload);
}
export function validateApproval(master,approval,reviewer,sourceSha=SOURCE_SHA,pinnedImageEvidence=[]) {
 const deny=reason=>({accepted:false,reason});
 if(!master||!approval)return deny('INDEPENDENT_REVIEW_MISSING');
 if(!reviewer||reviewer.key_id!==approval.reviewer_key_id||reviewer.status!=='ACTIVE')
  return deny('REVIEWER_KEY_NOT_REGISTERED');
 if(reviewer.role!=='INDEPENDENT_VISUAL_QA'||!reviewer.public_key_pem)
  return deny('INDEPENDENT_REVIEWER_REQUIRED');
 if(reviewer.reviewer_id!==approval.reviewer_id||reviewer.reviewer_id.toLowerCase().includes('generator'))
  return deny('REVIEWER_IDENTITY_MISMATCH');
 if(!SHA40.test(sourceSha)||approval.source_sha!==sourceSha||approval.source_repository!==SOURCE_REPO)
  return deny('IMMUTABLE_SOURCE_MISMATCH');
 if(approval.master_id!==master.id||approval.source_design_sha256!==hash(JSON.stringify(master)))
  return deny('DESIGN_DNA_CHANGED_REAPPROVAL_REQUIRED');
 if(approval.scope!=='REUSABLE_PREVIEW_ONLY'||approval.review_outcome!=='PASS')
  return deny('NOT_APPROVED_FOR_PREVIEW_REUSE');
 if(typeof approval.visual_score!=='number'||approval.visual_score<0.90||approval.visual_score>1)
  return deny('VISUAL_SCORE_BELOW_CEILING');
 if(!HEX64.test(approval.desktop_screenshot_sha256||'')||!HEX64.test(approval.mobile_screenshot_sha256||''))
  return deny('MISSING_VIEWPORT_SCREENSHOT_BYTES');
 if(!safeUrl(approval.evidence_url,'github.com')||
    !approval.evidence_url.includes('/XTREME-SYSTEMS/digital-dominance/actions/runs/'))
  return deny('PROVIDER_EVIDENCE_REQUIRED');
 if(!Array.isArray(approval.images)||approval.images.length!==2)
  return deny('TWO_INDEPENDENT_ASSET_CHECKS_REQUIRED');
 const expected=['photo','photo2'];
 const seen=new Set();
 for(const item of approval.images) {
  if(!expected.includes(item.field)||seen.has(item.field))return deny('DUPLICATE_OR_UNKNOWN_IMAGE');
  seen.add(item.field);
  if(item.photo_id!==master[item.field]||!HEX64.test(item.asset_sha256||''))
    return deny('IMAGE_SOURCE_OR_BYTES_NOT_BOUND');
  if(typeof item.semantic_score!=='number'||item.semantic_score<0.98||item.semantic_score>1)
    return deny('SEMANTIC_REVIEW_NOT_PASSED');
  if(item.rights_review!=='PASSED_NO_ENDORSEMENT_OR_LIKENESS_CLAIM')
    return deny('IMAGE_RIGHTS_REVIEW_MISSING');
  if(!safeUrl(item.source_url,item.photo_id.startsWith('pexels-')?'www.pexels.com':'unsplash.com'))
    return deny('IMAGE_PROVENANCE_SOURCE_NOT_VERIFIED');
  // Independent reviewer testimony cannot substitute for the actual CDN
  // bytes. Pin both image roles to a separate CI-fetched evidence artifact.
  const pinned=pinnedImageEvidence.find(p=>
    p.master===master.id && p.field===item.field &&
    (p.photo_id || 'pexels-'+String(p.pexels_id))===item.photo_id);
  if(!pinned || pinned.asset_sha256!==item.asset_sha256 ||
     pinned.source_url!==item.source_url ||
     !Number.isSafeInteger(pinned.bytes) || pinned.bytes<10000)
    return deny('INDEPENDENT_CDN_BYTE_EVIDENCE_MISSING_OR_DRIFTED');
 }
 if(seen.size!==2)return deny('MISSING_IMAGE_ROLE');
 const signature=String(approval.signature||'');
 if(!/^[a-zA-Z0-9+/]+=*$/.test(signature)||signature.length<70)
   return deny('INDEPENDENT_SIGNATURE_MISSING');
 try{
  const sig=Buffer.from(signature,'base64');
  if(sig.length!==64||!verify(null,Buffer.from(canonicalApproval(approval)),reviewer.public_key_pem,sig))
    return deny('INDEPENDENT_SIGNATURE_INVALID');
 }catch{return deny('INDEPENDENT_SIGNATURE_INVALID')}
 return {accepted:true,reason:'INDEPENDENTLY_SIGNED_PREVIEW_REUSE_ONLY',
         reviewer:approval.reviewer_id,source_sha:sourceSha,master_id:master.id};
}
export function approvedCatalog({configs,ledger,keys,pinnedImageEvidence=[]}) {
 assert.equal(ledger.schema,'apex.premium.signed-design-approvals.v1');
 assert.equal(keys.schema,'apex.premium.authorized-independent-reviewers.v1');
 assert.equal(ledger.production_release_allowed,false);
 assert.equal(ledger.scope,'reusable_preview_only');
 assert.equal(ledger.source_repo,SOURCE_REPO);
 assert.equal(ledger.source_sha,SOURCE_SHA);
 assert.equal(new Set(configs.map(x=>x.id)).size,configs.length,'duplicate source master');
 const approvals=Array.isArray(ledger.approved)?ledger.approved:[];
 const registered=Array.isArray(keys.keys)?keys.keys:[];
 const listed=new Set();
 const decisions=[];
 for(const master of configs){
  const records=approvals.filter(x=>x.master_id===master.id);
  const record=records.length===1?records[0]:null;
  const key=registered.find(x=>x.key_id===record?.reviewer_key_id);
  const outcome=validateApproval(master,record,key,SOURCE_SHA,pinnedImageEvidence);
  if(records.length>1)outcome.reason='DUPLICATE_APPROVAL_RECEIPTS';
  decisions.push({master_id:master.id,industry:master.industry,layout:master.layout,
    status:outcome.accepted?'APPROVED_PREVIEW_REUSE':'PENDING_INDEPENDENT_APPROVAL',
    reason:outcome.reason,reviewer:outcome.accepted?outcome.reviewer:null});
  if(outcome.accepted)listed.add(master.id);
 }
 return {schema:'apex.premium.approved-catalog.v1',
  source_sha:SOURCE_SHA,source_repo:SOURCE_REPO,
  approved_count:listed.size,pending_count:configs.length-listed.size,
  production_release_allowed:false,customer_data_provisioning:false,
  registered_reviewer_count:registered.length,designs:decisions};
}
