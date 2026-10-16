import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { secrets } from 'base44:runtime';
import { ensurePreviewTarget, buildExportPaths } from '../../shared/githubSyncPolicy.js';
import { runAtomicPreviewExport, validateExportEntries } from '../../shared/githubAtomicExport.js';

// githubSync exports Code Studio snapshots ONLY to existing sync-preview/* GitHub
// branches. It never changes main or writes one content file at a time.
export default async function(req: Request): Promise<Response> {
  try {
    const base44=createClientFromRequest(req);
    const user=await base44.auth.me();
    if(!user) return Response.json({success:false,state:'AUTH_REQUIRED'},{status:401});
    if(user.role!=='admin') return Response.json({success:false,state:'ADMIN_ONLY'},{status:403});

    const token=secrets.get('GITHUB_TOKEN');
    const repo=secrets.get('GITHUB_REPO');
    if(!token||!repo) return Response.json({success:false,state:'GITHUB_NOT_CONFIGURED'},{status:503});

    const input=await req.json().catch(()=>({}));
    if(input===null || Array.isArray(input) || typeof input!=='object' ||
       (input.dry_run!==undefined && typeof input.dry_run!=='boolean')) {
      return Response.json({success:false,state:'INVALID_SYNC_REQUEST'},{status:400});
    }
    let branch;
    try {branch=ensurePreviewTarget(repo,input.branch);}
    catch {return Response.json({success:false,state:'BRANCH_TARGET_REQUIRED',expected_prefix:'sync-preview/',provider_writes:0},{status:400});}
    const dryRun=input.dry_run!==false;

    const svc=base44.asServiceRole;
    const [pages,codeBlocks]=await Promise.all([
      svc.entities.DynamicPage.list('-updated_date',100),
      svc.entities.CodeBlock.list('-updated_date',100)
    ]);
    if(!Array.isArray(pages)||!Array.isArray(codeBlocks))
      return Response.json({success:false,state:'INVALID_PROVIDER_INVENTORY'},{status:503});
    let paths,entries;
    try {
      paths=buildExportPaths(pages,codeBlocks);
      entries=[
        ...pages.map(p=>({path:'pages/'+p.slug+'.json',content:JSON.stringify(p,null,2)})),
        ...codeBlocks.map(b=>{
          const ext=b.type==='css'?'css':b.type==='js'?'js':b.type==='html'?'html':'json';
          return {path:'code-blocks/'+b.name+'.'+ext,content:b.content||''};
        }),
        {path:'code-studio-manifest.json',content:JSON.stringify({
          schema_version:'dd-code-studio-export-v2',branch,
          pages:pages.length,code_blocks:codeBlocks.length,
          paths:paths.slice().sort()
        },null,2)}
      ];
      validateExportEntries(entries);
    } catch {
      return Response.json({success:false,state:'INVALID_OR_SENSITIVE_EXPORT_CONTENT',provider_writes:0},{status:422});
    }

    if(dryRun) return Response.json({
      success:false,state:'DRY_RUN_ONLY',repo,branch,
      files_planned:entries.length,planned_paths:paths,
      provider_writes:0,branch_ref_updates:0
    });

    // No unattended write: require the exact existing preview-branch revision.
    if(typeof input.expected_head_sha!=='string'||!/^[a-f0-9]{40}$/.test(input.expected_head_sha))
      return Response.json({success:false,state:'EXPECTED_BRANCH_HEAD_REQUIRED',provider_writes:0},{status:400});

    try {
      const receipt=await runAtomicPreviewExport({
        fetchFn:fetch,repo,branch,token,
        expectedHeadSha:input.expected_head_sha,entries
      });
      return Response.json({...receipt,repo_url:'https://github.com/'+repo,provider_writes:receipt.branch_ref_updates});
    } catch(error) {
      const code=typeof error?.message==='string'&&/^[A-Z0-9_]{3,85}$/.test(error.message)
        ?error.message:'GITHUB_SYNC_FAILED';
      const conflict=code==='HEAD_REVISION_CONFLICT'||code.startsWith('CAS_UPDATE_REJECTED_');
      return Response.json({
        success:false,state:code,branch,provider_writes:'UNKNOWN_ON_FAILED_REMOTE_UPDATE',
        rollback:'VERIFY_BRANCH_HEAD_THEN_RETRY_WITH_FRESH_REVISION'
      },{status:conflict?409:502});
    }
  } catch {
    return Response.json({success:false,state:'GITHUB_SYNC_FAILED'},{status:502});
  }
}
