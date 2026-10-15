// Executable policy regression with ephemeral TEST-ONLY Ed25519 identity.
// It does NOT register keys, certify an image, or approve any real design.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {sign,generateKeyPairSync} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {approvedCatalog,validateApproval,canonicalApproval,DESTINATIONS,hash,SOURCE_REPO,SOURCE_SHA} from './premium-promotion-policy.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const configs=JSON.parse(fs.readFileSync(path.join(root,'data/premium-collection-20.json'),'utf8'));
const approved=JSON.parse(fs.readFileSync(path.join(root,'docs/quality/premium-signed-approvals.json'),'utf8'));
const keys=JSON.parse(fs.readFileSync(path.join(root,'docs/quality/premium-reviewer-keys.json'),'utf8'));
const pinned=JSON.parse(fs.readFileSync(path.join(root,'docs/quality/premium-hero-asset-digests-20261015.json'),'utf8'));
assert.equal(pinned.records.length,5);
assert.equal(configs.length,17);
assert.equal(keys.keys.length,0,'Do not auto-register a generator reviewer');
assert.equal(approved.approved.length,0,'Do not silently approve candidates');
const current=approvedCatalog({configs,ledger:approved,keys,pinnedImageEvidence:pinned.records});
assert.equal(current.approved_count,0,'Unsigned reviews must never promote any master');
assert.equal(current.pending_count,17);
const master=configs.find(x=>x.id==='forge-roofing');
assert.ok(master);
const kp=generateKeyPairSync('ed25519');
const reviewer={key_id:'EPHEMERAL_TEST_ONLY',reviewer_id:'independent-test-validator',
 role:'INDEPENDENT_VISUAL_QA',status:'ACTIVE',
 public_key_pem:kp.publicKey.export({type:'spki',format:'pem'})};
const receipt={
 schema:'apex.premium.independent.design-approval.v1',
 master_id:master.id,source_repository:SOURCE_REPO,source_sha:SOURCE_SHA,
 source_design_sha256:hash(JSON.stringify(master)),
 reviewer_id:reviewer.reviewer_id,reviewer_key_id:reviewer.key_id,
 evidence_url:'https://github.com/XTREME-SYSTEMS/digital-dominance/actions/runs/12345',
 desktop_screenshot_sha256:'a'.repeat(64),mobile_screenshot_sha256:'b'.repeat(64),
 visual_score:0.97,review_outcome:'PASS',scope:'REUSABLE_PREVIEW_ONLY',
 images:[
  {field:'photo',photo_id:'pexels-33404248',asset_sha256:'10ff01c4cbca459e97994324c1d81bd3b05ea776b25411dbaebf3d2216e776c9',semantic_score:0.99,
   source_url:'https://www.pexels.com/photo/professional-roofer-installing-shingles-on-new-roof-33404248/',
   rights_review:'PASSED_NO_ENDORSEMENT_OR_LIKENESS_CLAIM'},
  {field:'photo2',photo_id:'pexels-38028508',asset_sha256:'6648852c3b1de57f73ed87d148a0336d4995fe157a64333ffac1958ea4792a42',semantic_score:0.99,
   source_url:'https://www.pexels.com/photo/roofer-installing-shingles-on-a-sunny-day-38028508/',
   rights_review:'PASSED_NO_ENDORSEMENT_OR_LIKENESS_CLAIM'},
 ]
};
const signing=record=>({...record,signature:sign(null,Buffer.from(canonicalApproval(record)),kp.privateKey).toString('base64')});
const signed=signing(receipt);
const verdict=validateApproval(master,signed,reviewer,SOURCE_SHA,pinned.records);
assert.equal(verdict.accepted,true,verdict.reason);
const mockCatalog=approvedCatalog({configs,ledger:{...approved,approved:[signed]},keys:{...keys,keys:[reviewer]},pinnedImageEvidence:pinned.records});
assert.equal(mockCatalog.approved_count,1);
assert.equal(mockCatalog.pending_count,16);
assert.equal(mockCatalog.production_release_allowed,false);
const denied=[
 ['unsigned',{...receipt}],
 ['false-photo',{...signed,images:signed.images.map((x,i)=>i===0?{...x,photo_id:'pexels-12345'}:x)}],
 ['low-score',{...signed,visual_score:0.89}],
 ['no-rights',{...signed,images:signed.images.map((x,i)=>i===0?{...x,rights_review:'PENDING'}:x)}],
 ['bad-source',{...signed,source_sha:'0'.repeat(40)}],
 ['wrong-design',{...signed,source_design_sha256:'0'.repeat(64)}],
 ['wrong-scope',{...signed,scope:'PRODUCTION_RELEASE'}],
 ['missing-desktop',{...signed,desktop_screenshot_sha256:null}],
 ['wrong-image-reviewer',{...signed,reviewer_id:'the-generator'}],
 ['forged-source-url',{...signed,images:signed.images.map((x,i)=>i===0?{...x,source_url:'https://untrusted.example.com/photo/'}:x)}]
];
for(const [name,item] of denied){
 assert.equal(validateApproval(master,item,reviewer,SOURCE_SHA,pinned.records).accepted,false,name+' must fail closed');
}
assert.equal(validateApproval(master,signed,null,SOURCE_SHA,pinned.records).accepted,false,'Unregistered reviewer is not accepted');
assert.equal(validateApproval(master,signed,reviewer).accepted,false,'Signed review without independently fetched image bytes fails');
const staleBytes=pinned.records.map(x=>({...x,asset_sha256:'f'.repeat(64)}));
assert.equal(validateApproval(master,signed,reviewer,SOURCE_SHA,staleBytes).accepted,false,'Tampered CDN byte hashes fail closed');
const dup=approvedCatalog({configs,ledger:{...approved,approved:[signed,signed]},keys:{...keys,keys:[reviewer]},pinnedImageEvidence:pinned.records});
assert.equal(dup.approved_count,0,'Duplicated receipt cannot promote');
const kinds=Object.keys(DESTINATIONS);
assert.ok(kinds.length>=7);
assert.ok(kinds.includes('lead_generation_funnel'));
assert.ok(kinds.includes('saas_dashboard_frontend'));
assert.ok(kinds.includes('ecommerce_frontend'));
assert.ok(kinds.includes('client_portal_frontend'));
for(const kind of kinds)assert.ok(DESTINATIONS[kind].length>=2);
const cli=path.join(root,'scripts/export-premium-handoff.mjs');
const list=spawnSync(process.execPath,[cli,'--list'],{cwd:root,encoding:'utf8'});
assert.equal(list.status,0,list.stderr);
assert.match(list.stdout,/"independently_approved":0/);
const draft=spawnSync(process.execPath,[cli,'--master','forge-roofing','--target','lead_generation_funnel','--brand','APEX SYNTHETIC CONCEPT'],{cwd:root,encoding:'utf8'});
assert.equal(draft.status,0,draft.stderr);
assert.match(draft.stdout,/"base44_writes":0/);
assert.match(draft.stdout,/"base44_import_authorized":false/);
const invalid=spawnSync(process.execPath,[cli,'--master','forge-roofing','--target','real-money-charge','--brand','APEX SYNTHETIC CONCEPT'],{cwd:root,encoding:'utf8'});
assert.notEqual(invalid.status,0,'Unsupported product kind must fail');
console.log('PASS INDEPENDENT PREMIUM SIGNOFF '+JSON.stringify({
 real_world_approved:current.approved_count,
 mock_cryptographic_positive:true,
 negative_cases:denied.length+5,
 supported_target_kinds:kinds,
 transport:'OFFLINE_DRAFT_ONLY',base44_writes:0,production_release:false
}));
