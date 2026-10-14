import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const route=readFileSync(new URL('../base44/functions/gptSyncEngine/entry.ts',import.meta.url),'utf8');
const git=readFileSync(new URL('../base44/functions/githubSync/entry.ts',import.meta.url),'utf8');

test('GPT sync route enforces authorization before any action dispatch',()=>{
 assert.ok(route.indexOf('authorizeSyncAction(action, body)')<route.indexOf("if (action === 'execute')"));
 assert.ok(route.indexOf('authorizeSyncAction(action, body)')<route.indexOf("if (action === 'sync')"));
});
test('external key restricted to no-data preflight',()=>{
 assert.match(route,/if \(isApiKeyAuth\) \{\s*if \(action === 'getConfig'\)/);
 assert.match(route,/if \(action !== 'previewPacket'\)/);
 assert.match(route,/TENANT_SCOPED_AUTH_REQUIRED/);
});
test('never accept body API-key authentication',()=>assert.doesNotMatch(route,/bearerKey\s*\|\|\s*body\.api_key/));
test('sync preview never invokes getPendingEvents seeding function',()=>{
 const match=route.match(/if \(action === 'getPending' \|\| action === 'previewSync'\)([\s\S]*?)\n    \}/);
 assert.ok(match);assert.doesNotMatch(match[1],/await\s+getPendingEvents\(/);
});
test('unsafe direct hosted tool invocation removed from execute block',()=>{
 const match=route.match(/if \(action === 'execute'\)([\s\S]*?)\n    \}/);
 assert.ok(match);assert.doesNotMatch(match[1],/executeHostedTool\(/);
});
test('preview reports no applied writes',()=>assert.match(route,/state:'NOT_APPLIED'/));
test('GitHub export requires preview branch',()=>assert.match(git,/ensurePreviewTarget\(repo,input\?\.branch\)/));
test('GitHub export has no hard-coded main target',()=>assert.doesNotMatch(git,/const branch\s*=\s*['"]main['"]/));
test('GitHub export defaults to dry run',()=>assert.match(git,/dryRun=input\?\.dry_run!==false/));
test('GitHub export refuses missing branch',()=>assert.match(git,/PREVIEW_BRANCH_NOT_FOUND_OR_UNAUTHORIZED/));
test('GitHub export computes actual partial/full result',()=>assert.match(git,/summarizeExport\(intendedPaths\.length/));
test('GitHub export never unconditional success',()=>assert.doesNotMatch(git,/return Response\.json\(\{\s*success:\s*true,/));
