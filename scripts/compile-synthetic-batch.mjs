// Offline-only 200-site template compiler. Emits real, separate HTML artifacts,
// NEVER deployment requests, domains, Google indexing, backlink networks or leads.
// Output is deliberately OUTSIDE public/ and dist/ so Vite cannot publish these.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const target=path.join(root,'factory','.synthetic-batch-output');
const inputText=fs.readFileSync(path.join(root,'factory','industry_catalog.json'),'utf8');
const c=JSON.parse(inputText);
const sha=s=>createHash('sha256').update(s).digest('hex');
const esc=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const args=process.argv.slice(2);
const arg=args.find(x=>x.startsWith('--count='));
const count=arg?Number(arg.slice(8)):200;
const verify=args.includes('--verify');
assert.ok(Number.isInteger(count)&&count>=1&&count<=200,'Batch size must be 1..200');
assert.ok(c.synthetic_only===true&&c.production_release===false);
assert.equal(c.schema_version,'apex_20_industry_synthetic_catalog_v1');
assert.ok(Array.isArray(c.industries)&&c.industries.length===20);
const names=c.industries.map(x=>x.slug);
assert.equal(new Set(names).size,20);
for(const x of c.industries){
 assert.ok(/^[a-z][a-z0-9_]{2,35}$/.test(x.slug));
 for(const k of ['title','content_focus','required_real_world_proof']){
  assert.ok(typeof x[k]==='string'&&x[k].length>=8&&x[k].length<300);
 }
}
const css=[
 ':root{font-family:Inter,system-ui,sans-serif;color:#f1f6ff;background:#070d1c;font-synthesis:none}',
 '*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(ellipse at 90% 10%,#244e7e 0,transparent 35%),#091326}',
 'header,main,footer{max-width:1100px;width:calc(100% - 40px);margin:auto}',
 'header{padding:28px 0;border-bottom:1px solid #4e779665;display:flex;align-items:center;justify-content:space-between;gap:14px}',
 '.brand{font-size:15px;font-weight:900;letter-spacing:.14em}.tag{font-size:11px;color:#9bb5d1}',
 'main{padding:65px 0 82px}.eyebrow{font-size:12px;color:#83e3ff;letter-spacing:.19em;text-transform:uppercase;font-weight:900}',
 'h1{font-size:clamp(44px,7vw,82px);line-height:1.03;letter-spacing:-.055em;max-width:850px;margin:20px 0 24px}',
 'h2{font-size:26px;letter-spacing:-.035em;margin-bottom:14px}p{max-width:750px;color:#b7c9e0;line-height:1.7;font-size:16px}',
 '.grid{display:grid;grid-template-columns:1fr 1fr;gap:25px;margin-top:55px}.card{background:#10233e;border:1px solid #4b7ca47c;border-radius:17px;padding:28px}',
 '.card span{color:#83deff;font-size:11px;font-weight:800;letter-spacing:.12em}footer{border-top:1px solid #4e779665;padding:22px 0 40px;color:#a6b6d1;font-size:12px}',
 '@media(max-width:650px){.grid{grid-template-columns:1fr}header{flex-wrap:wrap}main{padding-top:40px}}'
].join('');
function htmlFor(industry,zoneIndex){
 const label='Synthetic Zone '+String(zoneIndex).padStart(2,'0');
 const title='APEX '+industry.title+' | '+label+' | Synthetic';
 return [
 '<!doctype html><html lang="en"><head><meta charset="utf-8">',
 '<meta name="viewport" content="width=device-width,initial-scale=1">',
 '<meta name="robots" content="noindex,nofollow,noarchive">',
 '<meta name="googlebot" content="noindex,nofollow,noarchive">',
 '<meta name="description" content="Unpublished, synthetic preview artifact. NOT A REAL BUSINESS.">',
 '<title>'+esc(title)+'</title><style>'+css+'</style></head><body>',
 '<header><div class="brand">APEX / SITE FOUNDRY</div><span class="tag">SYNTHETIC / NOINDEX / NO LIVE OFFER</span></header>',
 '<main><div class="eyebrow">Industry module '+esc(industry.slug.replaceAll('_',' '))+' / '+esc(label)+'</div>',
 '<h1>'+esc(industry.title)+' <span aria-hidden="true">↗</span></h1>',
 '<p><strong>NOT A REAL BUSINESS.</strong> This is an unpublished dry-run webpage generated to test reproducibility and industry template compatibility. No real local service, business, lead intake, claims, rankings or contact information are represented.</p>',
 '<div class="grid"><section class="card"><span>CONTENT COMPONENT</span><h2>What buyers should understand</h2><p>'+esc(industry.content_focus)+'</p></section>',
 '<section class="card"><span>RELEASE-GATE EVIDENCE</span><h2>What must be independently verified</h2><p>'+esc(industry.required_real_world_proof)+'</p></section></div>',
 '<section class="card" style="margin-top:25px"><span>INTERNAL QA ONLY</span><h2>Site identity</h2>',
 '<p>'+esc(label)+' is fictional. Before any real release this template requires verified service-area coverage, company permission, differentiated first-party information, functional accessibility, verified lead routing and an independent technical review.</p></section>',
 '</main><footer>APEX synthetic site factory · Test data only · No links, ads, domains, prices, testimonials, forms or publishing.</footer></body></html>'
 ].join('\n');
}
const manifest={
 schema:'apex_synthetic_batch_manifest_v1',production_release:false,
 synthetic:true,noindex_required:true,backlinks_created:0,
 real_customer_leads:0,published_sites:0,independently_validated_sites:0,
 generated_count:count,industry_count:20,
 synthetic_zone_count:Math.ceil(count/20),
 catalog_sha256:sha(inputText),artifacts:[]
};
const seen=new Set(),hashes=new Set();
for(let i=0;i<count;i++){
 const industry=c.industries[i%20];
 const zoneIndex=Math.floor(i/20)+1;
 const zone='synthetic-zone-'+String(zoneIndex).padStart(2,'0');
 const id='APEX-SYN-'+String(i+1).padStart(3,'0');
 const rel=path.join('sites',zone,industry.slug,'index.html');
 const content=htmlFor(industry,zoneIndex);
 const h=sha(content);
 assert.ok(!seen.has(rel)&&!hashes.has(h),'Site artifact collision');
 assert.match(content,/<meta name="robots" content="noindex,nofollow,noarchive">/);
 assert.match(content,/NOT A REAL BUSINESS/);
 assert.doesNotMatch(content,/<form\b|href=["']https?:|<script\b|<a\b/i);
 seen.add(rel);hashes.add(h);
 manifest.artifacts.push({
  site_id:id,industry:industry.slug,synthetic_zone:zone,
  relative_path:rel.replaceAll('\\','/'),
  html_sha256:h,output_kind:'LOCAL_UNPUBLISHED_HTML',
  status:'SYNTHETIC_ARTIFACT_ONLY',domain:null,vercel_deployment_id:null,
  guardian_receipt_id:null,release_allowed:false,indexable:false,
  required_real_world_proof:industry.required_real_world_proof
 });
 if(verify){
  const disk=fs.readFileSync(path.join(target,rel),'utf8');
  assert.equal(sha(disk),h,'On-disk HTML hash mismatch');
 } else{
  const out=path.join(target,rel);
  fs.mkdirSync(path.dirname(out),{recursive:true});
  fs.writeFileSync(out,content,'utf8');
 }
}
const mf=JSON.stringify(manifest,null,2)+'\n';
const manifestPath=path.join(target,'batch-manifest.json');
if(verify){
 const stored=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
 assert.deepEqual(stored,manifest,'Manifest not deterministic');
} else {
 fs.mkdirSync(target,{recursive:true});
 fs.writeFileSync(manifestPath,mf,'utf8');
}
console.log('PASS SYNTHETIC BATCH '+JSON.stringify({
 requested:count,generated:manifest.artifacts.length,
 unique_paths:seen.size,unique_hashes:hashes.size,
 industry_count:manifest.industry_count,synthetic_zone_count:manifest.synthetic_zone_count,
 production_release:false,published:0,backlinks:0,real_customer_leads:0,
 mode:verify?'verify':'compile',manifest_sha256:sha(mf),
 output:manifestPath
}));
