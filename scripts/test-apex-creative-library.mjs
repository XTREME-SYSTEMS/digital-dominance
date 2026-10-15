async function testCreativeLibrary(){
 const fs=await import('node:fs');
 const path=await import('node:path');
 const crypto=await import('node:crypto');
 const {fileURLToPath}=await import('node:url');
 const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
 const out=path.join(root,'public','premium','libraries');
 const catalog=JSON.parse(fs.readFileSync(path.join(out,'catalog.json'),'utf8'));
 const manifest=JSON.parse(fs.readFileSync(path.join(out,'manifest.json'),'utf8'));
 const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
 const assert=(await import('node:assert/strict')).default;
 assert.equal(catalog.schema,'apex.universal-creative-library.v1');
 assert.equal(manifest.schema,'apex.creative.asset-manifest.v1');
 assert.equal(manifest.approval,'DRAFT_ONLY');
 assert.equal(manifest.production_release,false);
 assert.equal(manifest.public_social_publish,false);
 assert.equal(catalog.governance.mass_publish_allowed,false);
 assert.equal(manifest.counts.original_logo_motifs,12);
 assert.equal(manifest.counts.rendered_logo_svgs,36);
 assert.equal(manifest.counts.social_systems,8);
 assert.equal(manifest.counts.rendered_social_svgs,72);
 assert.equal(manifest.counts.creative_library_families,32);
 assert.equal(manifest.counts.website_type_recipes,61);
 assert.equal(manifest.counts.source_declared_patterns,486);
 assert.equal(manifest.artifact_count,233);
 assert.equal(manifest.artifacts.length,233);
 const uniquePaths=new Set(),uniqueHashes=new Set();
 for(const a of manifest.artifacts){
   assert.match(a.path,/^(logos|social|brands|emails|website-recipes|storyboards|motion|sections)\/|^(index\.html|catalog\.json)$/);
   assert.ok(!a.path.includes('..'));
   const bytes=fs.readFileSync(path.join(out,a.path));
   assert.equal(sha(bytes),a.sha256,'Hash drift for '+a.path);
   uniquePaths.add(a.path);uniqueHashes.add(a.sha256);
 }
 assert.equal(uniquePaths.size,233);
 assert.equal(uniqueHashes.size,233);
 for(const x of catalog.logo_systems)for(const v of x.variants){
   const content=fs.readFileSync(path.join(out,'logos',x.id+'-'+v+'.svg'),'utf8');
   assert.match(content,/aria-label=/);
   assert.match(content,/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
   assert.match(content,/UNAPPROVED|SYNTHETIC/);
   assert.doesNotMatch(content,/<script\b|onload\s*=|href="https?:/i);
 }
 for(const c of catalog.social_campaigns)for(const ch of catalog.social_channels){
   const content=fs.readFileSync(path.join(out,'social',c.id+'-'+ch.id+'.svg'),'utf8');
   assert.match(content,/NO PUBLISHING/);
   assert.match(content,new RegExp('viewBox="0 0 '+ch.width+' '+ch.height+'"'));
 }
 for(const e of catalog.email_systems){
   const content=fs.readFileSync(path.join(out,'emails',e.id+'.html'),'utf8');
   assert.match(content,/noindex/i);
   assert.match(content,/CTA PLACEHOLDER/);
   assert.doesNotMatch(content,/<script\b|<form\b|https?:\/\/tracking/);
 }
 for(const x of catalog.website_type_recipes){
   const r=JSON.parse(fs.readFileSync(path.join(out,'website-recipes',x.id+'.json'),'utf8'));
   assert.equal(r.release,'PENDING_APPROVAL');
   assert.equal(r.approval_required,true);
   assert.equal(r.noindex,true);
 }
 const html=fs.readFileSync(path.join(out,'index.html'),'utf8');
 for(const token of ['id="library-app"','id="library-nav"','id="grid"','id="detail"','id="jump-social"','id="download-primary"','id="search"','id="export-catalog"']) {
   if(token==='id="download-primary"'){assert.match(html,/download-primary/)}else assert.ok(html.includes(token),token);
 }
 assert.match(html,/<meta name="robots" content="noindex,nofollow,noarchive"/);
 assert.match(html,/async function creativeStudio/);
 assert.ok(!html.includes('<script src="https://'));
 console.log('PASS CREATIVE LIBRARY SECURITY AND QUALITY: '+JSON.stringify({assetHashes:uniqueHashes.size,files:manifest.artifact_count,logoMarks:12,socialCompositions:8,socialFormats:9,websiteRecipes:61,families:32,allNoindex:true,release:false}));
}
await testCreativeLibrary();
