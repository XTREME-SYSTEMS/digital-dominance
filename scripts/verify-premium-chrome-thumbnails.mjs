// Independent static proof that every gallery thumbnail is an actual
// audited Chrome screenshot of the corresponding full-page website preview.
// This verifies provenance and image bytes; it is not a Guardian visual approval.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const screenshotsRoot=path.join(root,'public','premium','collection','screenshots');
const gallery=fs.readFileSync(path.join(root,'public','premium','collection','index.html'),'utf8');
const proof=JSON.parse(fs.readFileSync(path.join(root,'public','premium','collection','SCREENSHOT_PROOF.json'),'utf8'));
const configs=JSON.parse(fs.readFileSync(path.join(root,'data','premium-collection-20.json'),'utf8'));
assert.equal(proof.schema,'smai.premium.browser-screenshot-evidence.v1');
assert.equal(proof.source_type,'REAL_CHROME_SCREENSHOT_NOT_STOCK_PHOTOGRAPH');
assert.equal(proof.guardian_visual_approval,'PENDING');
assert.equal(proof.production_release,false);
assert.match(proof.source_commit_sha,/^[a-f0-9]{40}$/);
assert.equal(proof.desktop_qa_passes,17);
assert.equal(proof.mobile_qa_passes,17);
assert.equal(proof.screenshots.length,17);
assert.equal(configs.length,17);
const expected=new Set(configs.map(x=>x.id));
const hashes=new Set();
for(const shot of proof.screenshots){
 assert.ok(expected.delete(shot.id),'Duplicate or unexpected screenshot master: '+shot.id);
 assert.equal(shot.filename,shot.id+'-desktop.jpg');
 assert.equal(shot.independently_approved_visual,false);
 assert.equal(shot.page_http_status,200);
 assert.equal(shot.meta_robots_noindex,true);
 assert.deepEqual(shot.local_capture_viewport,{width:1440,height:900});
 assert.equal(shot.source_commit_sha,proof.source_commit_sha);
 assert.match(shot.preview_url,/^https:\/\/[a-z0-9-]+\.vercel\.app\/premium\/collection\/[a-z0-9-]+\/index\.html$/);
 const bytes=fs.readFileSync(path.join(screenshotsRoot,shot.filename));
 assert.ok(bytes.length>=18000&&bytes.length<=700000,'Capture size unexpected');
 assert.deepEqual(Array.from(bytes.subarray(0,3)),[255,216,255],'Not an actual JPEG');
 assert.equal(shot.bytes,bytes.length,'JPEG payload length mismatch');
 const hash=createHash('sha256').update(bytes).digest('hex');
 assert.equal(shot.sha256,hash,'Actual screenshot bytes changed');
 assert.ok(!hashes.has(hash),'Reused screenshot across two different designs');
 hashes.add(hash);
 assert.ok(gallery.includes('src="screenshots/'+shot.filename+'"'),'Gallery must display screenshot for '+shot.id);
 assert.ok(gallery.includes('href="'+shot.id+'/index.html"'),'Gallery preview link must work for '+shot.id);
}
assert.equal(expected.size,0,'A premium master is missing a screenshot');
assert.ok(gallery.includes('href="SCREENSHOT_PROOF.json"'),'Evidence link missing');
assert.ok(gallery.includes('REAL PAGE CAPTURE'),'Screenshot provenance badge missing');
assert.ok(gallery.includes('aspect-ratio:16/10'),'Screenshot card must use source-accurate 1440:900 framing');
assert.ok(gallery.includes('object-fit:contain;object-position:center'),'No screenshot headlines may be cropped by cover');
for(const id of ['monolith','argent','atelier']){
 assert.ok(gallery.includes('href="../templates/'+id+'/index.html"'),'Original V2 premium source lost: '+id);
}
const explicit=gallery.match(/class="design-card"/g)||[];
assert.equal(explicit.length,20);
console.log('PASS PREMIUM REAL CHROME THUMBNAILS '+JSON.stringify({
 masters:20,new_chrome_captures:17,original_v2_previews:3,
 screenshots_sha256_verified:hashes.size,bytes:proof.screenshots.reduce((n,x)=>n+x.bytes,0),
 source_commit_sha:proof.source_commit_sha,
 desktop_chrome_cases:proof.desktop_qa_passes,mobile_chrome_cases:proof.mobile_qa_passes,
 production_release:false,guardian_visual_approval:'PENDING'
}));
