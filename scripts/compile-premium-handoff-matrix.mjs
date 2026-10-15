// Universal design-to-product handoff demonstration, 17 actual premium
// masters x 7 frontend/product destination kinds = 119 draft-only packets.
// These are NOT 119 fully functioning apps, live sites, approved designs, or
// customer deployments. Every packet is SHA-bound and fail closed.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {DESTINATIONS,SOURCE_SHA,SOURCE_REPO} from './premium-promotion-policy.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const configs=JSON.parse(fs.readFileSync(path.join(root,'data/premium-collection-20.json'),'utf8'));
const kinds=Object.keys(DESTINATIONS);
assert.equal(configs.length,17);
assert.equal(kinds.length,7);
const dir=path.join(root,'factory','.pending-premium-handoffs');
const cli=path.join(root,'scripts','export-premium-handoff.mjs');
fs.mkdirSync(dir,{recursive:true});
const hash=s=>createHash('sha256').update(s).digest('hex');
const entries=[];
const ids=new Set();
for(const master of configs){
 for(const kind of kinds){
  const args=[cli,'--master',master.id,'--target',kind,'--brand','APEX SYNTHETIC CONCEPT'];
  const result=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',timeout:30000,maxBuffer:1024*1024});
  assert.equal(result.status,0,master.id+' / '+kind+' '+result.stderr);
  const line=result.stdout.trim().split(/\r?\n/).find(x=>x.startsWith('PASS SAFE PREMIUM HANDOFF '));
  assert.ok(line,'No machine-readable handoff receipt');
  const data=JSON.parse(line.slice('PASS SAFE PREMIUM HANDOFF '.length));
  assert.equal(data.design_approved,false);
  assert.equal(data.base44_writes,0);
  assert.equal(data.production_release,false);
  assert.equal(data.backend_working,false);
  const file=path.resolve(root,data.file);
  assert.ok(file.startsWith(dir+path.sep));
  const packet=JSON.parse(fs.readFileSync(file,'utf8'));
  const receipt=packet.receipt.output_sha256;
  const check=JSON.parse(JSON.stringify(packet));
  check.receipt.output_sha256=null;
  assert.equal(receipt,hash(JSON.stringify(check)),'Packet receipt hash changed');
  assert.equal(packet.stage,'DRAFT_DESIGN_REVIEW_ONLY');
  assert.equal(packet.transport.import_authorized,false);
  assert.equal(packet.transport.design_reuse_eligible,false);
  assert.equal(packet.transport.field_mapping,null);
  assert.equal(packet.source.repository,SOURCE_REPO);
  assert.equal(packet.source.immutable_commit,SOURCE_SHA);
  assert.equal(packet.source.master_id,master.id);
  assert.equal(packet.target.kind,kind);
  assert.ok(packet.target.required_modules.length>=2);
  assert.equal(packet.target.working_backend_modules.length,0);
  assert.equal(packet.provisioning.publish_live,false);
  assert.equal(packet.provisioning.noindex,true);
  assert.equal(packet.provisioning.customer_messaging,false);
  assert.equal(packet.provisioning.payment_operations,false);
  assert.ok(!ids.has(packet.packet_id));
  ids.add(packet.packet_id);
  entries.push({
   master_id:master.id,target_kind:kind,packet_id:packet.packet_id,
   file:path.relative(root,file).split(path.sep).join('/'),
   receipt_sha256:receipt,sha256:hash(fs.readFileSync(file)),
   design_approved:false,production_release:false,
   website_deployed:false,working_backend:false
  });
 }
}
const matrix={
 schema:'apex.premium.handoff-matrix.v1',
 source_repo:SOURCE_REPO,source_sha:SOURCE_SHA,
 master_count:configs.length,target_kind_count:kinds.length,
 draft_handoff_count:entries.length,independently_approved:0,
 base44_writes:0,paid_provider_calls:0,actual_customer_sites_created:0,
 production_release_allowed:false,preview_only:true,
 warning:'PREVIEW PACKET SPECIFICATIONS ONLY; never claim 119 working apps or approved designs.',
 entries
};
assert.equal(entries.length,119);
const manifestPath=path.join(dir,'MATRIX_RECEIPT.json');
fs.writeFileSync(manifestPath,JSON.stringify(matrix,null,2)+'\n');
console.log('PASS PREMIUM DESIGN CONVERSION MATRIX '+JSON.stringify({
 templates:matrix.master_count,product_kinds:matrix.target_kind_count,
 versioned_draft_packets:matrix.draft_handoff_count,
 independently_approved:matrix.independently_approved,
 live_sites:0,working_backends:0,base44_writes:0,
 archive_source:'factory/.pending-premium-handoffs',receipt:hash(fs.readFileSync(manifestPath))
}));
