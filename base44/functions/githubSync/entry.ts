import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { secrets } from 'base44:runtime';
import { ensurePreviewTarget, buildExportPaths, summarizeExport, githubBase64 } from '../../shared/githubSyncPolicy.js';

// ─────────────────────────────────────────────────────────────────────────────
// githubSync — Pushes Code Studio content (DynamicPages + CodeBlocks) to a
// GitHub repo as JSON files, creating a commit with the current state.
//
// Invoke: base44.functions.invoke('githubSync', {})
// ─────────────────────────────────────────────────────────────────────────────

async function getFileSha(token: string, repo: string, path: string, branch: string): Promise<string | null> {
  const url='https://api.github.com/repos/'+repo+'/contents/'+path+'?ref='+encodeURIComponent(branch);
  const res=await fetch(url,{
    headers: {'Authorization':'token '+token,'Accept':'application/vnd.github.v3+json','User-Agent':'digital-dominance-code-studio'},
    signal: AbortSignal.timeout(10000),
  });
  if(res.status===404) return null;
  if(!res.ok) throw new Error('GH_READ_FAILED_'+res.status);
  const data=await res.json();
  return data.sha||null;
}

async function pushFile(token: string, repo: string, path: string, content: string, branch: string, sha: string | null): Promise<any> {
  const body: any = { message: `sync: ${path}`, content: githubBase64(content), branch };
  if (sha) body.sha = sha;
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json', 'User-Agent': 'epoxy-code-studio' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub API ${res.status} for ${path}: ${err}`);
  }
  return res.json();
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const token = secrets.get('GITHUB_TOKEN');
    const repo = secrets.get('GITHUB_REPO');
    if (!token) return Response.json({ error: 'GITHUB_TOKEN secret is not set' }, { status: 500 });
    if (!repo) return Response.json({ success:false,state:'GITHUB_REPO_UNBOUND' }, { status: 500 });

    // Explicit branch-scoped export only. A legacy bare invocation is a dry-run rejection.
    const input=await req.json().catch(()=>({}));
    let branch;
    try { branch=ensurePreviewTarget(repo,input?.branch); }
    catch { return Response.json({success:false,state:'BRANCH_TARGET_REQUIRED',expected_prefix:'sync-preview/'},{status:400}); }
    const dryRun=input?.dry_run!==false;
    const svc = base44.asServiceRole;
    const pages = await svc.entities.DynamicPage.list('-updated_date', 100);
    const codeBlocks = await svc.entities.CodeBlock.list('-updated_date', 100);

    let intendedPaths;
    try { intendedPaths=buildExportPaths(pages,codeBlocks); }
    catch { return Response.json({success:false,state:'INVALID_EXPORT_INVENTORY'},{status:400}); }
    if(dryRun) return Response.json({
      success:false,state:'DRY_RUN_ONLY',repo,branch,files_planned:intendedPaths.length+1,
      planned_paths:intendedPaths,files_pushed:0,provider_writes:0
    });
    const refRes=await fetch('https://api.github.com/repos/'+repo+'/git/ref/heads/'+encodeURIComponent(branch),{
      headers:{'Authorization':'token '+token,'Accept':'application/vnd.github.v3+json','User-Agent':'digital-dominance-code-studio'},
      signal:AbortSignal.timeout(10000)
    });
    if(!refRes.ok) return Response.json({success:false,state:'PREVIEW_BRANCH_NOT_FOUND_OR_UNAUTHORIZED',provider_writes:0},{status:409});
    const pushed: string[] = [];
    const errors: string[] = [];

    // Push each DynamicPage as a JSON file
    for (const page of pages) {
      const path = `pages/${page.slug}.json`;
      const content = JSON.stringify(page, null, 2);
      try {
        const sha = await getFileSha(token, repo, path, branch);
        await pushFile(token, repo, path, content, branch, sha);
        pushed.push(path);
      } catch (e) {
        errors.push(`${path}: ${e.message}`);
      }
    }

    // Push each CodeBlock as a file
    for (const block of codeBlocks) {
      const ext = block.type === 'css' ? 'css' : block.type === 'js' ? 'js' : block.type === 'html' ? 'html' : 'json';
      const path = `code-blocks/${block.name.replace(/[^a-z0-9-]/gi, '-')}.${ext}`;
      try {
        const sha = await getFileSha(token, repo, path, branch);
        await pushFile(token, repo, path, block.content || '', branch, sha);
        pushed.push(path);
      } catch (e) {
        errors.push(`${block.name}: ${e.message}`);
      }
    }

    // Manifest is committed ONLY after every file succeeds; no misleading green receipt.
    let manifestPushed=false;
    if(errors.length===0 && pushed.length===intendedPaths.length){
      const manifest={synced_at:new Date().toISOString(),branch,pages:pages.length,code_blocks:codeBlocks.length,pushed:pushed.length};
      try{
        const sha=await getFileSha(token,repo,'code-studio-manifest.json',branch);
        await pushFile(token,repo,'code-studio-manifest.json',JSON.stringify(manifest,null,2),branch,sha);
        manifestPushed=true;pushed.push('code-studio-manifest.json');
      }catch{errors.push('manifest: GITHUB_WRITE_FAILED');}
    }
    const summary=summarizeExport(intendedPaths.length,pushed.length-(manifestPushed?1:0),errors,manifestPushed);
    return Response.json({
      ...summary,repo_url:'https://github.com/'+repo,branch,files:pushed,
      errors:errors.length?errors.map(e=>String(e).slice(0,150)):undefined,
      provider_writes:pushed.length
    },{status:summary.success?200:502});
  } catch (error) {
    console.error('githubSync controlled failure');
    return Response.json({ success:false,state:'GITHUB_SYNC_FAILED' }, { status: 502 });
  }
}