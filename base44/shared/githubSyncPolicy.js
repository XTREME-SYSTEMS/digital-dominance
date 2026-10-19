// Pure export policy; code-studio sync must never silently write to a protected branch.
export const DIGITAL_DOMINANCE_REPO='XTREME-SYSTEMS/digital-dominance';
export function ensurePreviewTarget(repo,branch) {
 if(repo!==DIGITAL_DOMINANCE_REPO) throw new Error('REPOSITORY_SOURCE_TRUTH_MISMATCH');
 if(typeof branch!=='string'||!/^sync-preview\/[a-z0-9][a-z0-9._-]{0,78}$/.test(branch)||branch.includes('..')||branch.endsWith('.lock')) throw new Error('PREVIEW_BRANCH_REQUIRED');
 return branch;
}
export function safeExportName(input,type='page') {
 if(typeof input!=='string'||!input||input.length>160) throw new Error('INVALID_EXPORT_NAME');
 // Require one stable ASCII path segment, never silently remap colliding names.
 if(type==='page' && !/^[a-z0-9][a-z0-9-]{0,159}$/.test(input)) throw new Error('UNSAFE_PAGE_SLUG');
 if(type==='block' && !/^[A-Za-z0-9][A-Za-z0-9_-]{0,159}$/.test(input)) throw new Error('UNSAFE_BLOCK_NAME');
 return input;
}
export function buildExportPaths(pages,blocks) {
 if(!Array.isArray(pages)||!Array.isArray(blocks)||pages.length>100||blocks.length>100) throw new Error('INVALID_EXPORT_INVENTORY');
 const paths=[];
 for(const page of pages){const slug=safeExportName(page?.slug);paths.push('pages/'+slug+'.json');}
 for(const block of blocks){
   const name=safeExportName(block?.name,'block');
   const ext=block.type==='css'?'css':block.type==='js'?'js':block.type==='html'?'html':'json';
   paths.push('code-blocks/'+name+'.'+ext);
 }
 if(new Set(paths).size!==paths.length) throw new Error('EXPORT_PATH_COLLISION');
 return paths;
}
export function summarizeExport(expected, pushed, errors,manifestPushed=false){
 const complete=Number.isInteger(expected)&&expected>=0&&pushed===expected&&errors.length===0&&manifestPushed;
 return {
   success:complete,status:complete?'PASS':errors.length?'FAILED_OR_PARTIAL':'INCOMPLETE',
   expected_files:expected+1,files_pushed:pushed+(manifestPushed?1:0),
   failed_files:errors.length,manifest_pushed:manifestPushed
 };
}
export function githubBase64(value){
 if(typeof value!=='string') throw new TypeError('EXPORT_CONTENT_NOT_TEXT');
 const bytes=new TextEncoder().encode(value); let binary='';
 for(let i=0;i<bytes.length;i+=8192) binary+=String.fromCharCode(...bytes.slice(i,i+8192));
 return btoa(binary);
}
