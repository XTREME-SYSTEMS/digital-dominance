// Synthetic preview image candidate integrity check. NOT an independent semantic approval.
// Browser and Guardian approvals remain separate protected gates.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {TOP_20_INDUSTRIES} from '../src/data/topIndustries.js';
const m=JSON.parse(fs.readFileSync(new URL('../docs/quality/proposed-industry-image-replacements-20261014.json',import.meta.url),'utf8'));
assert.equal(m.schema_version,'apex.visual.category-image-candidates.v1');
assert.equal(m.scope,'DEVELOPMENT_PREVIEW_ONLY');
assert.equal(m.qa_summary.production_approved,false);
assert.equal(m.qa_summary.independent_guardian_review,'PENDING');
assert.equal(TOP_20_INDUSTRIES.length,20);
assert.equal(m.candidates.length,16);
assert.equal(m.photos_replaced,16);
const ids=new Set();
const imageURLs=new Set();
for(const item of TOP_20_INDUSTRIES){
 assert.ok(/^[a-z0-9_]+$/.test(item.id),'Invalid category');
 assert.ok(!ids.has(item.id),'Duplicate category ID');
 ids.add(item.id);
 const url=new URL(item.previewImage);
 assert.equal(url.protocol,'https:');
 assert.ok(['images.pexels.com','images.unsplash.com'].includes(url.hostname),'Untrusted image host');
 assert.ok(!imageURLs.has(url.origin+url.pathname),'Duplicate category image');
 imageURLs.add(url.origin+url.pathname);
}
for(const row of m.candidates){
 assert.ok(ids.has(row.category_id));
 const original=TOP_20_INDUSTRIES.find(x=>x.id===row.category_id);
 assert.equal(original.previewImage,row.proposed_url);
 assert.notEqual(row.previous_url,row.proposed_url);
 assert.equal(new URL(row.proposed_url).hostname,'images.pexels.com');
 const match=row.proposed_url.match(/\/photos\/(\d+)\/pexels-photo-(\d+)\.jpeg/);
 assert.ok(match,'Invalid Pexels photo URL');
 assert.equal(match[1],match[2],'Photo IDs mismatch in URI');
 assert.equal(Number(match[1]),row.photo_id);
 assert.ok(row.photo_page_url.endsWith('/photo/'+row.photo_id+'/'));
 assert.ok(row.visual_description.length>20);
 assert.equal(row.approval_status,'PENDING_INDEPENDENT_REVIEW');
 assert.equal(row.independent_validator,null);
 assert.equal(row.semantic_match_score,null);
 assert.equal(row.image_sha256,null);
}
console.log('PASS INDUSTRY IMAGE CANDIDATE SOURCE '+JSON.stringify({categories:20,replaced:16,unique_urls:imageURLs.size,external_image_hosts:['images.pexels.com','images.unsplash.com'],network_and_pixel_qa:'SEPARATE',guardian:'PENDING',release_allowed:false}));
