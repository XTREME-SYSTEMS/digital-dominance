// Preview source provenance is emitted by the *actual* Vercel/GitHub build.
// Never copy a hard-coded commit ID into a SitePack draft.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const input=path.join(repo,'public/premium/collection/catalog-manifest.json');
const output=path.join(repo,'public/premium/launch-composer/source-identity.json');
const gitSha=String(process.env.VERCEL_GIT_COMMIT_SHA||process.env.GITHUB_SHA||'').trim();
if(gitSha && !/^[0-9a-f]{40}$/i.test(gitSha))throw Error('INVALID_BUILD_SOURCE_SHA');
const manifest=readFileSync(input);
const identity={
  schema_version:'apex.premium.build-source.v1',
  repo:'XTREME-SYSTEMS/digital-dominance',
  source_commit_sha:gitSha||null,
  source_sha_attached:!!gitSha,
  source_sha_provider_verified:false,
  source_sha_authority:process.env.VERCEL_GIT_COMMIT_SHA?'VERCEL_BUILD_GIT_METADATA':process.env.GITHUB_SHA?'GITHUB_ACTIONS_CHECKOUT':'UNBOUND',
  catalog_manifest_sha256:createHash('sha256').update(manifest).digest('hex'),
  deployment_id:null,
  independent_visual_approval:false,
  production_release_allowed:false
};
mkdirSync(path.dirname(output),{recursive:true});
writeFileSync(output,JSON.stringify(identity,null,2)+'\n','utf8');
console.log('PASS PREMIUM BUILD PROVENANCE '+JSON.stringify({source_sha:gitSha||null,authority:identity.source_sha_authority,manifest_sha256:identity.catalog_manifest_sha256,release:false}));
