import test from 'node:test';
import assert from 'node:assert/strict';
import {runAtomicPreviewExport,validateExportEntries} from '../base44/shared/githubAtomicExport.js';

const A='a'.repeat(40),B='b'.repeat(40),C='c'.repeat(40),D='d'.repeat(40),E='e'.repeat(40);
const path='sync-preview/gpt-test';
const entries=[{path:'pages/test.json',content:'{"hello":"world"}'},{path:'code-studio-manifest.json',content:'{"version":2}'}];
const args=fetchFn=>({fetchFn,repo:'XTREME-SYSTEMS/digital-dominance',branch:path,token:'SYNTHETIC_DUMMY',expectedHeadSha:A,entries});

function mock({initial=A,baseTree=B,newTree=C,newCommit=D,final=D,fail='',status=422}={}) {
 const calls=[],heads=[initial,final];
 const fetchFn=async(url,opts)=>{
  const method=opts.method;calls.push({url,method,payload:opts.body?JSON.parse(opts.body):null});
  let stage='UNKNOWN',out={};
  if(url.includes('/git/ref/heads/') && method==='GET'){
    stage='GET_REF';out={object:{sha:heads.shift()??final}};
  } else if(url.includes('/git/commits/') && method==='GET'){
    stage='GET_COMMIT';out={tree:{sha:baseTree}};
  } else if(url.includes('/git/trees') && method==='POST'){
    stage='POST_TREE';out={sha:newTree};
  } else if(url.endsWith('/git/commits') && method==='POST'){
    stage='POST_COMMIT';out={sha:newCommit};
  } else if(url.includes('/git/refs/heads/') && method==='PATCH'){
    stage='PATCH_REF';out={object:{sha:newCommit}};
  } else throw new Error('unexpected simulated request '+url+' '+method);
  return {ok:stage!==fail,status:stage===fail?status:200,json:async()=>out};
 };
 return {fetchFn,calls};
}
test('manifest is mandatory',()=>assert.throws(()=>validateExportEntries([{path:'pages/a.json',content:'x'}]),/MANIFEST/));
test('invalid file paths rejected before any provider call',()=>{
 assert.throws(()=>validateExportEntries([{path:'../private.key',content:'SECRET'},entries[1]]),/UNSAFE_EXPORT/);
});
test('duplicate paths fail closed',()=>assert.throws(()=>validateExportEntries([...entries,entries[0]]),/UNSAFE_EXPORT/));
test('large payload fails closed',()=>assert.throws(()=>validateExportEntries([entries[1],{path:'pages/a.json',content:'x'.repeat(500001)}]),/UNSAFE_EXPORT/));
test('secret signatures fail closed',()=>{
 for(const s of ['-----BEGIN PRIVATE KEY-----','ghp_'+'x'.repeat(24),'sk-proj-'+'x'.repeat(24)])
 assert.throws(()=>validateExportEntries([{...entries[0],content:s},entries[1]]),/UNSAFE_EXPORT/);
});
test('input sorting stable across same batch',()=>{
 assert.deepEqual(validateExportEntries([...entries].reverse()).map(x=>x.path),validateExportEntries(entries).map(x=>x.path));
});
test('rejects main branch even with correct head',async()=>{
 const m=mock();await assert.rejects(runAtomicPreviewExport({...args(m.fetchFn),branch:'main'}),/PREVIEW_BRANCH_REQUIRED/);
 assert.equal(m.calls.length,0);
});
test('rejects repo mismatch before network',async()=>{
 const m=mock();await assert.rejects(runAtomicPreviewExport({...args(m.fetchFn),repo:'other/repo'}),/SOURCE_TRUTH_MISMATCH/);
 assert.equal(m.calls.length,0);
});
test('missing exact head does not touch provider',async()=>{
 const m=mock();await assert.rejects(runAtomicPreviewExport({...args(m.fetchFn),expectedHeadSha:null}),/EXACT_EXPECTED_HEAD_REQUIRED/);
 assert.equal(m.calls.length,0);
});
test('stale revision holds with read only',async()=>{
 const m=mock({initial:E});await assert.rejects(runAtomicPreviewExport(args(m.fetchFn)),/HEAD_REVISION_CONFLICT/);
 assert.deepEqual(m.calls.map(x=>x.method),['GET']);
});
test('atomic publish creates exactly one branch pointer update',async()=>{
 const m=mock();const r=await runAtomicPreviewExport(args(m.fetchFn));
 assert.equal(r.state,'COMMITTED');assert.equal(r.branch_ref_updates,1);
 assert.equal(r.readback_verified,true);assert.equal(r.commit_sha,D);
 assert.deepEqual(m.calls.map(x=>x.method),['GET','GET','POST','POST','PATCH','GET']);
 assert.equal(m.calls.find(x=>x.method==='PATCH').payload.force,false);
 assert.equal(m.calls.filter(x=>x.method==='PUT').length,0);
});
test('new commit parent is prior verified SHA and manifest part of same tree',async()=>{
 const m=mock();await runAtomicPreviewExport(args(m.fetchFn));
 assert.deepEqual(m.calls.find(x=>x.url.endsWith('/git/commits')&&x.method==='POST').payload.parents,[A]);
 const tree=m.calls.find(x=>x.url.endsWith('/git/trees')).payload.tree;
 assert.ok(tree.some(x=>x.path==='code-studio-manifest.json'));assert.equal(tree.length,entries.length);
});
test('unchanged tree returns verified replay without new commit',async()=>{
 const m=mock({newTree:B});const r=await runAtomicPreviewExport(args(m.fetchFn));
 assert.equal(r.state,'UNCHANGED');assert.equal(r.branch_ref_updates,0);
 assert.deepEqual(m.calls.map(x=>x.method),['GET','GET','POST']);
});
test('tree API error never touches branch pointer',async()=>{
 const m=mock({fail:'POST_TREE',status:503});
 await assert.rejects(runAtomicPreviewExport(args(m.fetchFn)),/PREPARE_TREE_REJECTED_503/);
 assert.equal(m.calls.some(x=>x.method==='PATCH'),false);
});
test('rejected compare-and-swap never reports success',async()=>{
 const m=mock({fail:'PATCH_REF',status:422});
 await assert.rejects(runAtomicPreviewExport(args(m.fetchFn)),/CAS_UPDATE_REJECTED_422/);
 assert.equal(m.calls.filter(x=>x.method==='PATCH').length,1);
});
test('readback mismatch never reports success',async()=>{
 const m=mock({final:E});
 await assert.rejects(runAtomicPreviewExport(args(m.fetchFn)),/READBACK_MISMATCH/);
});
test('transport error is bounded to a sanitized error code',async()=>{
 await assert.rejects(runAtomicPreviewExport({...args(async()=>{throw new Error('private provider detail')})}),/READ_REF_TRANSPORT_FAILED/);
});
