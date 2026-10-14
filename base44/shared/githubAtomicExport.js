import { ensurePreviewTarget } from './githubSyncPolicy.js';

// Atomically publish one complete snapshot to an existing nonproduction GitHub branch.
// Never create branches, change main, update secrets, or run a partial series of content PUTs.
const isSha = v => typeof v==='string' && /^[a-f0-9]{40}$/.test(v);
const allowedPath = path => typeof path==='string' && (/^pages\/[a-z0-9][a-z0-9-]{0,159}\.json$/.test(path) ||
  /^code-blocks\/[A-Za-z0-9][A-Za-z0-9_-]{0,159}\.(css|html|js|json)$/.test(path) ||
  path==='code-studio-manifest.json');
const sensitive = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|(?:sk-proj-|sk-|ghp_|github_pat_|xox[baprs]-|AIza|AKIA|sk_live_)[A-Za-z0-9_-]{14,}/i;

export function validateExportEntries(entries) {
  if(!Array.isArray(entries) || entries.length<1 || entries.length>201) throw new Error('INVALID_EXPORT_COUNT');
  const seen = new Set();
  for(const e of entries) {
    if(!e || !allowedPath(e.path) || seen.has(e.path) || typeof e.content!=='string' ||
       new TextEncoder().encode(e.content).byteLength>500000 || sensitive.test(e.content)) {
      throw new Error('UNSAFE_EXPORT_ENTRY');
    }
    seen.add(e.path);
  }
  if(!seen.has('code-studio-manifest.json')) throw new Error('MANIFEST_REQUIRED');
  return entries.slice().sort((a,b)=>a.path.localeCompare(b.path));
}

export async function runAtomicPreviewExport({
  fetchFn,repo,branch,token,expectedHeadSha,entries,timeoutMs=12000
}) {
  ensurePreviewTarget(repo,branch);
  if(typeof token!=='string'||!token) throw new Error('MISSING_GITHUB_AUTH');
  if(!isSha(expectedHeadSha)) throw new Error('EXACT_EXPECTED_HEAD_REQUIRED');
  if(typeof fetchFn!=='function') throw new Error('MISSING_TRANSPORT');
  const normalized=validateExportEntries(entries);
  const api='https://api.github.com/repos/'+repo;
  const headers={Authorization:'token '+token,Accept:'application/vnd.github+json',
    'Content-Type':'application/json','User-Agent':'digital-dominance-gpt-sync'};

  async function call(method,path,body,phase) {
    let response;
    try {
      response=await fetchFn(api+path,{
        method,headers,signal:AbortSignal.timeout(Math.max(1000,Math.min(30000,timeoutMs))),
        ...(body!==undefined?{body:JSON.stringify(body)}:{})
      });
    } catch {throw new Error(phase+'_TRANSPORT_FAILED');}
    if(!response||!response.ok) throw new Error(phase+'_REJECTED_'+(response?.status||'UNKNOWN'));
    try{return await response.json();}catch {throw new Error(phase+'_INVALID_RESPONSE');}
  }

  const path='/git/ref/heads/'+branch;
  const ref=await call('GET',path,undefined,'READ_REF');
  const baseSha=ref?.object?.sha;
  if(!isSha(baseSha)) throw new Error('INVALID_HEAD_PROOF');
  if(baseSha!==expectedHeadSha) throw new Error('HEAD_REVISION_CONFLICT');

  const baseCommit=await call('GET','/git/commits/'+baseSha,undefined,'READ_BASE');
  if(!isSha(baseCommit?.tree?.sha)) throw new Error('INVALID_BASE_TREE');

  const tree=await call('POST','/git/trees',{
    base_tree:baseCommit.tree.sha,
    tree:normalized.map(e=>({path:e.path,mode:'100644',type:'blob',content:e.content}))
  },'PREPARE_TREE');
  if(!isSha(tree?.sha)) throw new Error('INVALID_TREE_PROOF');

  // No commit or branch write for repeated content.
  if(tree.sha===baseCommit.tree.sha){
    return {success:true,state:'UNCHANGED',branch,head_sha:baseSha,commit_sha:baseSha,
      branch_ref_updates:0,files_verified:normalized.length,readback_verified:true};
  }
  const commit=await call('POST','/git/commits',{
    message:'sync-preview: atomic Code Studio export',tree:tree.sha,parents:[baseSha]
  },'CREATE_COMMIT');
  if(!isSha(commit?.sha)) throw new Error('INVALID_COMMIT_PROOF');

  // This is the only branch-ref write, and force=false protects concurrent writers.
  await call('PATCH','/git/refs/heads/'+branch,{sha:commit.sha,force:false},'CAS_UPDATE');
  const readback=await call('GET',path,undefined,'VERIFY_HEAD');
  if(readback?.object?.sha!==commit.sha) throw new Error('READBACK_MISMATCH');

  return {success:true,state:'COMMITTED',branch,parent_sha:baseSha,commit_sha:commit.sha,
    tree_sha:tree.sha,branch_ref_updates:1,files_verified:normalized.length,readback_verified:true};
}
