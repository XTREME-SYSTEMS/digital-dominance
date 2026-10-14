import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const DEST=path.join(ROOT,'public','premium','collection');
const raw=fs.readFileSync(path.join(ROOT,'data','premium-collection-20.json'),'utf8');
const templates=JSON.parse(raw);
const sha=s=>createHash('sha256').update(s).digest('hex');
assert.equal(templates.length,17);
assert.equal(new Set(templates.map(x=>x.layout)).size,17,'Not distinct master layouts');
assert.equal(new Set(templates.map(x=>x.id)).size,17);
const manifest=JSON.parse(fs.readFileSync(path.join(DEST,'catalog-manifest.json'),'utf8'));
assert.equal(manifest.full_page_master_count,20);
assert.equal(manifest.published_customer_websites,0);
assert.equal(manifest.state,'NOINDEX_PREVIEW_ONLY');
const gallery=fs.readFileSync(path.join(DEST,'index.html'),'utf8');
assert.equal(sha(gallery),manifest.catalog_sha256);
assert.match(gallery,/<meta name="robots" content="noindex,nofollow,noarchive">/);
const checks=[];
for(const t of templates){
 const full=path.join(DEST,t.id,'index.html');
 const body=fs.readFileSync(full,'utf8');
 const rec=manifest.new_masters.find(x=>x.id===t.id);
 assert.ok(rec&&rec.layout===t.layout);
 assert.equal(sha(body),rec.sha256,t.id+' content SHA mismatch');
 assert.match(body,/<meta name="robots" content="noindex,nofollow,noarchive">/);
 for(const anchor of ['id="main"','id="experience"','id="navigation"','id="demo-status"','class="hero"','class="story"']){
  assert.ok(body.includes(anchor),t.id+' missing '+anchor);
 }
 assert.ok(body.length>10000,t.id+' appears as stub');
 assert.match(body,/PREMIUM DESIGN STUDY/);
 assert.match(body,/No information is sent or stored/);
 assert.ok(gallery.includes('href="'+t.id+'/index.html"'),t.id+' has no catalog link');
 assert.ok(/images\.(?:unsplash\.com\/photo-|pexels\.com\/photos\/[0-9]+\/pexels-photo-[0-9]+\.jpeg)/.test(body),t.id+' image source missing');
 assert.doesNotMatch(body,/<script[^>]*src=["']https?:/i,t.id+' should not include remote executable JS');
 checks.push({master:t.id,layout:t.layout,html_sha256:rec.sha256,byte_count:Buffer.byteLength(body)});
}
for(const id of ['monolith','argent','atelier'])assert.ok(gallery.includes('../templates/'+id+'/index.html'),id+' existing master link missing');
assert.ok(gallery.includes('href="../launch-composer/index.html"'),'Launch composer link missing from premium gallery');
assert.doesNotMatch(gallery,/digital-dominance-oeahjexvu/i,'Stale absolute Vercel preview host must not be preserved');
// Image candidates are not self-approved. This test binds their source IDs
// to the exact generated master, preventing silent fallback to generic imagery.
const imageEvidence=JSON.parse(fs.readFileSync(new URL('../docs/quality/premium-hero-image-evidence-20261014.json',import.meta.url),'utf8'));
assert.equal(imageEvidence.schema_version,'apex.premium.hero-image-review.v1');
assert.equal(imageEvidence.image_change_count,5);
assert.equal(imageEvidence.sources.length,5);
assert.equal(imageEvidence.production_allowed,false);
assert.equal(imageEvidence.independent_semantic_approval,'PENDING');
for(const record of imageEvidence.sources){
 const design=templates.find(t=>t.id===record.master);
 assert.ok(design,'Unknown approved candidate master');
 assert.ok(record.field==='photo'||record.field==='photo2');
 assert.equal(design[record.field],'pexels-'+record.pexels_id,'Subject-relevant master image was silently reverted');
 assert.match(record.source_url,/^https:\/\/www\.pexels\.com\/photo\/[a-z0-9-]+\/$/i);
 const asset='https://images.pexels.com/photos/'+record.pexels_id+'/pexels-photo-'+record.pexels_id+'.jpeg';
 const rendered=fs.readFileSync(path.join(DEST,design.id,'index.html'),'utf8');
 assert.ok(rendered.includes(asset),'Master HTML lost vetted photo source '+design.id);
}
console.log('PASS PREMIUM_20_STATIC_PROOF '+JSON.stringify({new_masters:17,existing_v2_linked:3,total:20,unique_layouts:17,hashes_verified:17,noindex:true,customer_sites_released:0,proof:checks.map(x=>x.master)}));
