import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dest=path.join(root,'public','premium','collection');
const conf=JSON.parse(fs.readFileSync(path.join(root,'data','premium-collection-20.json'),'utf8'));
const extra=['monolith','argent','atelier'];
const ids=[...extra,...conf.map(x=>x.id)];
const hash=s=>createHash('sha256').update(s).digest('hex');
const manifest=JSON.parse(fs.readFileSync(path.join(dest,'catalog-manifest.json'),'utf8'));
assert.equal(ids.length,20);
assert.equal(manifest.brand_count,20);
assert.equal(manifest.brand_asset_count,60);
assert.equal(manifest.production_release,false);
assert.equal(manifest.new_masters.length,17);
assert.equal(manifest.brand_assets.length,60);
const gallery=fs.readFileSync(path.join(dest,'index.html'),'utf8');
const brands=fs.readFileSync(path.join(dest,'brands','index.html'),'utf8');
const studio=fs.readFileSync(path.join(root,'public','premium','index.html'),'utf8');
assert.equal(hash(gallery),manifest.catalog_sha256);
assert.equal(hash(brands),manifest.brand_gallery_sha256);
assert.match(gallery,/href="brands\/index.html"/);
assert.match(studio,/OPEN 20 BUSINESS WEBSITES/);
assert.match(studio,/href="collection\/brands\/index.html"/);
assert.match(brands,/<meta name="robots" content="noindex,nofollow,noarchive">/);
assert.ok(!/<script\b/i.test(brands));
const marks=new Set();
for(const id of ids){
 for(const kind of ['mark','logo','logo-contrast']){
  const name=id+'-'+kind+'.svg';
  const content=fs.readFileSync(path.join(dest,'assets','brands',name),'utf8');
  assert.ok(content.startsWith('<svg '),id+' missing real vector file');
  assert.match(content,/viewBox=/);
  assert.match(content,/<path\b|<circle\b/);
  assert.doesNotMatch(content,/<script\b|onload=|javascript:/i);
  const rec=manifest.brand_assets.find(x=>x.file==='assets/brands/'+name);
  assert.ok(rec,id+' missing '+kind+' manifest');
  assert.equal(rec.sha256,hash(content));
  marks.add(rec.sha256);
 }
 assert.ok(gallery.includes('assets/brands/'+id+'-logo-contrast.svg'),id+' gallery missing brand');
 assert.ok(brands.includes('assets/brands/'+id+'-logo.svg'),id+' downloadable logo absent');
 assert.ok(brands.includes('assets/brands/'+id+'-mark.svg'),id+' downloadable icon absent');
 if(!extra.includes(id)){
  const html=fs.readFileSync(path.join(dest,id,'index.html'),'utf8');
  assert.ok(html.includes('src="../assets/brands/'+id+'-logo.svg"'),id+' page brand missing');
  assert.ok(html.includes('rel="icon"'),id+' favicon absent');
  assert.match(html,/<meta name="robots" content="noindex,nofollow,noarchive">/);
  assert.equal(manifest.new_masters.find(x=>x.id===id).sha256,hash(html));
 }
}
assert.equal(marks.size,60,'Original SVG files may not be duplicative');
console.log('PASS BUSINESS WEBSITE AND LOGO CATALOG '+JSON.stringify({full_page_website_masters:20,new_business_examples:17,logo_families:20,original_svg_files:60,logos_browsable:true,logo_downloads:true,website_links:true,studio_discovery:true,active_customer_sites:0}));
