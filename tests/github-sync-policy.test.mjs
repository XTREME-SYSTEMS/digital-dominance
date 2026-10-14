import test from 'node:test';
import assert from 'node:assert/strict';
import {DIGITAL_DOMINANCE_REPO,ensurePreviewTarget,safeExportName,buildExportPaths,summarizeExport,githubBase64} from '../base44/shared/githubSyncPolicy.js';

test('matches the operator-selected repo',()=> assert.equal(DIGITAL_DOMINANCE_REPO,'XTREME-SYSTEMS/digital-dominance'));
test('rejects direct main branch writes',()=> assert.throws(()=>ensurePreviewTarget(DIGITAL_DOMINANCE_REPO,'main'),/PREVIEW_BRANCH_REQUIRED/));
test('rejects other repos',()=> assert.throws(()=>ensurePreviewTarget('XTREME-SYSTEMS/epoxyquotenearme','sync-preview/canary'),/SOURCE_TRUTH_MISMATCH/));
test('accepts strictly named preview branch',()=>assert.equal(ensurePreviewTarget(DIGITAL_DOMINANCE_REPO,'sync-preview/gpt-20261013'),'sync-preview/gpt-20261013'));
test('rejects path traversal in branch',()=>{
 for(const b of ['sync-preview/../main','sync-preview/x/y','feature/test','sync-preview/.lock','sync-preview/x..y','sync-preview/'])
 assert.throws(()=>ensurePreviewTarget(DIGITAL_DOMINANCE_REPO,b));
});
test('page slug cannot traverse paths',()=>{
 for(const name of ['../secrets','admin/data','x.json','UPPERCASE',''])assert.throws(()=>safeExportName(name));
});
test('block names cannot inject paths',()=>{
 for(const name of ['../secrets','app/main','foo.bar',''])assert.throws(()=>safeExportName(name,'block'));
});
test('safe page name unchanged',()=>assert.equal(safeExportName('roof-estimate'),'roof-estimate'));
test('deterministic extension mapping',()=>{
 const p=buildExportPaths([{slug:'roof-leads'}],[{name:'Layout',type:'css'},{name:'Data',type:'js'},{name:'Markup',type:'html'},{name:'Other',type:'text'}]);
 assert.deepEqual(p,['pages/roof-leads.json','code-blocks/Layout.css','code-blocks/Data.js','code-blocks/Markup.html','code-blocks/Other.json']);
});
test('duplicate paths fail closed',()=>assert.throws(()=>buildExportPaths([{slug:'a'},{slug:'a'}],[]),/COLLISION/));
test('large inventory fails closed',()=>assert.throws(()=>buildExportPaths(Array.from({length:101},(_,i)=>({slug:'x'+i})),[])));
test('all files and manifest must succeed',()=>{
 assert.equal(summarizeExport(2,2,[],true).success,true);
 for(const [p,e,m] of [[1,[],true],[2,[],false],[2,['failure'],true]])
 assert.equal(summarizeExport(2,p,e,m).success,false);
});
test('partial failure never claims success',()=>{
 const r=summarizeExport(3,2,['one failed'],false);
 assert.equal(r.success,false);assert.equal(r.status,'FAILED_OR_PARTIAL');assert.equal(r.expected_files,4);
});
test('UTF-8 content base64 round trips correctly',()=>{
 const input='Lead-gen ✅ Café \u{1F9E0}';
 const bytes=Uint8Array.from(atob(githubBase64(input)),c=>c.charCodeAt(0));
 assert.equal(new TextDecoder().decode(bytes),input);
});
test('binary unsafe input rejected',()=>assert.throws(()=>githubBase64({x:1}),/TEXT/));
