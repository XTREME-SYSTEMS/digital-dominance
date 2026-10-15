// This lightweight release gate checks the exact published Chrome capture source.
// Byte-valid thumbnails do not prove they depict the currently deployed page.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const proof=JSON.parse(readFileSync(path.join(root,'public/premium/collection/SCREENSHOT_PROOF.json'),'utf8'));
const expected=process.env.CURRENT_SOURCE_SHA?.trim();
assert.match(expected||'',/^[0-9a-f]{40}$/,'CURRENT_SOURCE_SHA_REQUIRED');
assert.match(proof.source_commit_sha||'',/^[0-9a-f]{40}$/,'SCREENSHOT_CAPTURE_SOURCE_REQUIRED');
assert.equal(proof.production_release,false);
assert.equal(proof.guardian_visual_approval,'PENDING');
assert.equal(proof.screenshots.length,17);
if(proof.source_commit_sha!==expected){
  console.error('FAIL CAPTURED_PREVIEW_SOURCE_IS_STALE',JSON.stringify({captured:proof.source_commit_sha,current:expected,visual_approval:'PENDING',action:'recapture 17 sites, update digest manifest, revalidate'}));
  process.exit(1);
}
console.log('PASS CHROME_CAPTURE_SOURCE_MATCH',expected,'17 image entries; Guardian pending');
