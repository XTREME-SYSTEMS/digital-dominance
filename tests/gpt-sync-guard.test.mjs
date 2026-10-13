import test from 'node:test';
import assert from 'node:assert/strict';
import {SYNC_CONTRACT_VERSION, SAFE_SYNC_ENTITIES, authorizeHostedRead, authorizeSyncAction, sanitizeSyncEvent, scrubSyncData, boundedLimit} from '../base44/shared/gptSyncGuard.js';

test('version and metadata allowlist are fixed',()=>{
  assert.match(SYNC_CONTRACT_VERSION,/preview/);
  assert.ok(SAFE_SYNC_ENTITIES.includes('SyncEvent'));
  assert.ok(!SAFE_SYNC_ENTITIES.includes('Lead'));
});
test('safe capabilities accessible',()=> assert.equal(authorizeSyncAction('execute',{tool:'get_capabilities',args:{}}).allowed,true));
test('safe entity read accessible',()=> assert.equal(authorizeSyncAction('execute',{tool:'read_entities',args:{entity:'SyncEvent'}}).allowed,true));
test('unsupported entity denied',()=> assert.equal(authorizeHostedRead('read_entities',{entity:'CryptoToken'}).allowed,false));
test('lead entity denied',()=> assert.equal(authorizeHostedRead('read_entities',{entity:'Lead'}).allowed,false));
test('write operations denied',()=> assert.equal(authorizeHostedRead('write_entity',{entity:'SyncEvent',operation:'delete'}).allowed,false));
test('function invocations denied',()=> assert.equal(authorizeHostedRead('invoke_function',{function_name:'vercelDeploy'}).allowed,false));
test('auto takeover denied',()=> assert.equal(authorizeSyncAction('takeOver',{command:'launch'}).allowed,false));
test('sync auto loop denied',()=> assert.equal(authorizeSyncAction('sync',{command:'launch'}).allowed,false));
test('snapshot side effects denied',()=> assert.equal(authorizeSyncAction('snapshot',{}).allowed,false));
test('logEvent side effects denied',()=> assert.equal(authorizeSyncAction('logEvent',{}).allowed,false));
test('unknown actions denied',()=> assert.equal(authorizeSyncAction('unknown',{}).allowed,false));
test('getPending permitted as metadata-only read',()=> assert.equal(authorizeSyncAction('getPending',{}).allowed,true));
test('previewSync permitted',()=> assert.equal(authorizeSyncAction('previewSync',{}).allowed,true));
test('nested malicious query rejected',()=> assert.equal(authorizeHostedRead('read_entities',{entity:'SyncEvent',query:{$and:[{$where:'this.secret'}]}}).allowed,false));
test('invalid query rejected',()=> assert.equal(authorizeHostedRead('read_entities',{entity:'SyncEvent',query:[]}).allowed,false));
test('oversized query rejected',()=> assert.equal(authorizeHostedRead('read_entities',{entity:'SyncEvent',query:{a:'x'.repeat(1300)}}).allowed,false));
test('invalid id rejected',()=> assert.equal(authorizeHostedRead('read_entities',{entity:'SyncEvent',id:'a'.repeat(257)}).allowed,false));
test('event sanitization drops free-text PII',()=>{
  const event=sanitizeSyncEvent({id:'1',event_type:'entity_update',data_summary:'Private customer',gpt_context:'password here'});
  assert.equal(event.data_summary,undefined);assert.equal(event.gpt_context,undefined);assert.equal(event.id,'1');
});
test('provider response redacts sensitive nested values',()=>{
  const r=scrubSyncData([{id:'one',api_key:'SECRET',details:{access_token:'OTHER',status:'pending'}}]);
  assert.equal(r[0].api_key,'[redacted]'); assert.equal(r[0].details.access_token,'[redacted]'); assert.equal(r[0].id,'one');
});
test('limit bound protects reads',()=>{
  assert.equal(boundedLimit(100000),50);assert.equal(boundedLimit(-20),1);assert.equal(boundedLimit('invalid'),20);
});
