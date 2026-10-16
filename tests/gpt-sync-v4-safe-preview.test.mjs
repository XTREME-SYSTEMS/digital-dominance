import test from 'node:test';
import assert from 'node:assert/strict';
import {
 SYNC_PREVIEW_VERSION,SAFE_SYNC_ENTITIES,authorizeHostedRead,authorizeSyncAction,
 safeEventFilter,sanitizeEvents,sanitizeSyncEvent,boundedLimit,compilePreviewPacket
} from '../base44/shared/gptSyncGuard.js';

const sha='a'.repeat(64);
const base=()=>({
 project_id:'digital-dominance',tenant_id:'tenant-synthetic',actor_id:'operator-synthetic',
 source_system:'github',source_sha256:sha,expected_target_revision:'rev-01',
 observed_target_revision:'rev-01',action_class:'DRAFT',new_creative_mission:false
});
test('contract version explicitly says preview',()=>assert.match(SYNC_PREVIEW_VERSION,/preview/));
test('only minimal SyncEvent metadata entity is readable',()=>{
 assert.deepEqual(SAFE_SYNC_ENTITIES,['SyncEvent']);
 assert.equal(authorizeHostedRead('read_entities',{entity:'SyncEvent'}).allowed,true);
});
test('get_capabilities uses safe fixed metadata',()=>assert.equal(authorizeSyncAction('execute',{tool:'get_capabilities',args:{}}).allowed,true));
test('all data-rich entities fail closed',()=>{
 for(const entity of ['Lead','CryptoToken','WorkPacket','PackSyncReceipt','ApprovalRequest','SystemManifest'])
 assert.equal(authorizeHostedRead('read_entities',{entity}).allowed,false);
});
test('all mutation or arbitrary function execution denied',()=>{
 for(const tool of ['write_entity','invoke_function','admin','delete_entity'])
 assert.equal(authorizeSyncAction('execute',{tool,args:{entity:'SyncEvent'}}).allowed,false);
});
test('high authority actions are blocked regardless of payload',()=>{
 for(const action of ['takeOver','sync','snapshot','logEvent','invoke','destroy'])
 assert.equal(authorizeSyncAction(action,{command:'anything'}).allowed,false);
});
test('read-only preview actions are permitted',()=>{
 for(const action of ['getConfig','getPending','previewSync','previewPacket','stats','listEvents'])
 assert.equal(authorizeSyncAction(action,{}).allowed,true);
});
test('arbitrary record id access not allowed',()=>{
 assert.equal(authorizeHostedRead('read_entities',{entity:'SyncEvent',id:'some-id'}).allowed,false);
 assert.equal(authorizeHostedRead('read_entities',{entity:'SyncEvent',cursor:'cursor'}).allowed,false);
});
test('arbitrary options cannot widen a read',()=>assert.equal(authorizeHostedRead('read_entities',{entity:'SyncEvent',include_full_payload:true}).allowed,false));
test('query operators cannot be injected',()=>{
 assert.equal(authorizeHostedRead('read_entities',{entity:'SyncEvent',query:{$where:'secret'}}).allowed,false);
 assert.equal(authorizeHostedRead('read_entities',{entity:'SyncEvent',query:{$or:[]}}).allowed,false);
});
test('nested query is not permitted',()=>assert.throws(()=>safeEventFilter({status:{$ne:'failed'}})));
test('array query is invalid',()=>assert.throws(()=>safeEventFilter([])));
test('only known status and direction filters are accepted',()=>{
 assert.deepEqual(safeEventFilter({direction:'to_gpt',status:'pending'}),{direction:'to_gpt',status:'pending'});
 assert.throws(()=>safeEventFilter({direction:'everyone'}));
 assert.throws(()=>safeEventFilter({status:'whatever'}));
});
test('out-of-bounds read limit rejected',()=>{
 assert.equal(authorizeHostedRead('read_entities',{entity:'SyncEvent',limit:-20}).allowed,false);
 assert.equal(authorizeHostedRead('read_entities',{entity:'SyncEvent',limit:50}).allowed,true);
});
test('all bound limits clamp consistently',()=>{
 assert.equal(boundedLimit(9999),50);
 assert.equal(boundedLimit(0),1);
 assert.equal(boundedLimit(undefined),20);
});
test('sanitizer drops free text and personal context',()=>{
 const event={id:'evt-1',status:'pending',event_type:'entity_update',created_date:'date',
  data_summary:'private customer',gpt_context:'account access',gpt_response:'secret',record_id:'private-user'};
 const e=sanitizeSyncEvent(event);
 assert.equal(e.id,'evt-1');assert.equal(e.status,'pending');
 for(const k of ['data_summary','gpt_context','gpt_response','record_id'])
 assert.equal(Object.hasOwn(e,k),false);
});
test('provider paginated wrapper is sanitized without raw fields',()=>{
 const events=sanitizeEvents({items:[{id:'1',status:'pending',data_summary:'secret'}]});
 assert.equal(events.length,1); assert.equal(events[0].data_summary,undefined);
});
test('a synthetic DRAFT packet remains pending, with no effects',async()=>{
 const p=await compilePreviewPacket(base());
 assert.equal(p.status,'PENDING_REVIEW');
 assert.equal(p.provider_writes,0); assert.equal(p.dispatched_jobs,0);
 assert.equal(p.actor_authenticated,false);assert.equal(p.independent_validator,'NOT_RUN');
});
test('canonical packet identity survives reordered input keys',async()=>{
 const a=base(),b={};for(const k of Object.keys(a).reverse())b[k]=a[k];
 const [x,y]=await Promise.all([compilePreviewPacket(a),compilePreviewPacket(b)]);
 assert.equal(x.packet_id,y.packet_id);
 assert.equal(x.idempotency_key,y.idempotency_key);
});
test('actual revision conflict holds all operations',async()=>{
 const p=await compilePreviewPacket({...base(),observed_target_revision:'rev-02'});
 assert.equal(p.status,'HOLD');assert.ok(p.holds.includes('TARGET_REVISION_CONFLICT'));
});
test('all write classes require a separate approved adapter',async()=>{
 for(const action_class of ['BRANCH_WRITE','PREVIEW_WRITE','PROTECTED']){
  const p=await compilePreviewPacket({...base(),action_class});
  assert.equal(p.status,'HOLD');assert.ok(p.holds.includes('WRITE_REQUIRES_APPROVED_ADAPTER'));
 }
});
test('new creative work cannot bypass ZERO foresight',async()=>{
 const p=await compilePreviewPacket({...base(),new_creative_mission:true});
 assert.equal(p.status,'HOLD');assert.ok(p.holds.includes('FORESIGHT_RECEIPT_MISSING'));
});
test('receipt identifier alone is not independent validation',async()=>{
 const p=await compilePreviewPacket({...base(),new_creative_mission:true,foresight_receipt_id:'receipt-123'});
 assert.equal(p.status,'HOLD');assert.ok(p.holds.includes('FORESIGHT_RECEIPT_NOT_INDEPENDENTLY_VERIFIED'));
});
test('invalid actor and tenant identifiers are rejected',async()=>{
 await assert.rejects(compilePreviewPacket({...base(),tenant_id:'person@example.com'}));
 await assert.rejects(compilePreviewPacket({...base(),actor_id:''}));
});
test('source revision is strict digest',async()=>{
 await assert.rejects(compilePreviewPacket({...base(),source_sha256:'not-a-hash'}));
 await assert.rejects(compilePreviewPacket({...base(),source_sha256:'f'.repeat(65)}));
});
test('unknown or sensitive packet fields are rejected',async()=>{
 await assert.rejects(compilePreviewPacket({...base(),api_key:'do-not-store'}));
 await assert.rejects(compilePreviewPacket({...base(),contact_email:'do-not-store'}));
});
test('unsupported source is rejected',async()=>await assert.rejects(compilePreviewPacket({...base(),source_system:'bypass'})));
test('malformed flags are rejected',async()=>await assert.rejects(compilePreviewPacket({...base(),new_creative_mission:'true'})));
test('no live actor validation is claimed by preview',async()=>{
 const p=await compilePreviewPacket(base());
 assert.equal(p.foresight_validated,false);
 assert.equal(p.source_classification,'UNVERIFIED_INPUT');
});
