// Brand system for 20 synthetic premium business demos. Generates editable
// original vector marks, light/dark wordmarks, a logo showroom, and links it
// to the existing website gallery. No production/customer mutations.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dest=path.join(root,'public','premium','collection');
const dir=path.join(dest,'assets','brands');
const configs=JSON.parse(fs.readFileSync(path.join(root,'data','premium-collection-20.json'),'utf8'));
const v2=[
 {id:'monolith',name:'MONOLITH',industry:'Architectural Flooring',accent:'#c6a279',ink:'#f9f6e9',tone:'#191a1a'},
 {id:'argent',name:'ARGENT & VALE',industry:'Legal',accent:'#c2ae95',ink:'#f4efdf',tone:'#131c23'},
 {id:'atelier',name:'ATELIER SEREIN',industry:'Luxury Beauty Commerce',accent:'#b79b84',ink:'#eee8dc',tone:'#211a16'}
];
const data=[...v2,...configs];
assert.equal(data.length,20);
assert.equal(new Set(data.map(x=>x.id)).size,20);
const motif={
 'vanta-motors':'<path d="M4 21L20 27L32 9L44 27L60 21L48 45L32 53L16 45Z"/><path d="M20 35L32 41L44 35"/>',
 'halcyon-estates':'<path d="M7 52V19L20 9V33L32 22L44 33V9L57 19V52M7 52H57M20 35H44"/>',
 'veil-wellness':'<path d="M32 56C9 42 9 22 21 13C29 21 32 34 32 45C32 34 35 21 43 13C55 22 55 42 32 56Z"/><path d="M32 42C19 30 10 30 6 36M32 42C45 30 54 30 58 36"/>',
 'nexus-cloud':'<circle cx="32" cy="32" r="7"/><circle cx="12" cy="13" r="5"/><circle cx="52" cy="13" r="5"/><circle cx="12" cy="51" r="5"/><circle cx="52" cy="51" r="5"/><path d="M16 17L27 27M48 17L37 27M16 47L27 37M48 47L37 37"/>',
 'arcus-architecture':'<path d="M6 57V29C6 15 18 5 32 5S58 15 58 29V57M17 57V31C17 23 23 17 32 17S47 23 47 31V57M28 57V33H36V57"/>',
 'aster-escapes':'<circle cx="32" cy="25" r="13"/><path d="M4 46C14 39 23 39 32 46S50 53 60 46M4 56C14 49 23 49 32 56S50 63 60 56M32 4V1M12 11L9 8M52 11L55 8"/>',
 'forge-roofing':'<path d="M5 35L32 9L59 35H51V56H13V35Z"/><path d="M21 38L30 28L36 34L48 22M25 56V42H40V56"/>',
 'phase-electric':'<path d="M38 4L14 36H29L23 60L51 25H34Z"/>',
 'lumen-solar':'<circle cx="32" cy="32" r="13"/><path d="M32 2V13M32 51V62M2 32H13M51 32H62M11 11L19 19M45 45L53 53M53 11L45 19M19 45L11 53"/>',
 'vault-private':'<path d="M32 4L55 18V46L32 60L9 46V18Z"/><path d="M17 21L32 48L47 21M22 20L32 38L42 20"/>',
 'remedy-restore':'<path d="M32 4C46 24 53 33 53 41A21 21 0 0 1 11 41C11 33 18 24 32 4Z"/><path d="M21 43C28 37 36 37 43 43M32 26V39M25 32H39"/>',
 'sync-creative':'<circle cx="22" cy="24" r="15"/><circle cx="42" cy="24" r="15"/><circle cx="32" cy="43" r="15"/>',
 'heritage-homes':'<path d="M5 30L32 8L59 30M13 28V55H51V28M25 55V37H39V55M19 33L25 39M45 33L39 39"/>',
 'flow-home':'<path d="M4 17C14 7 24 7 34 17S54 27 60 17M4 32C14 22 24 22 34 32S54 42 60 32M4 47C14 37 24 37 34 47S54 57 60 47"/>',
 'nova-performance':'<path d="M6 56L27 7L37 33L49 15L58 56M14 42H52M6 61H58"/>',
 'eclipse-time':'<circle cx="32" cy="32" r="25"/><path d="M42 11C26 17 20 26 20 34C20 45 30 52 45 51C25 64 8 47 8 31C8 16 22 4 42 11Z"/><path d="M32 21V32L41 37"/>',
 'aurora-dental':'<path d="M16 10C24 7 27 12 32 13C37 12 41 7 48 10C57 17 53 37 47 52C45 57 41 58 39 51L34 39C33 36 31 36 30 39L25 51C23 58 19 57 17 52C11 37 7 17 16 10Z"/><path d="M32 3V11M28 7H36"/>',
 'monolith':'<path d="M8 56V9L24 35L32 23L40 35L56 9V56M8 56H56"/>',
 'argent':'<path d="M9 56L32 7L55 56M18 39H46M14 56H50"/>',
 'atelier':'<path d="M32 57C12 43 8 28 21 13C28 17 31 27 32 36C33 27 36 17 43 13C56 28 52 43 32 57Z"/><path d="M13 42C24 37 28 43 32 51C36 43 40 37 51 42"/>'
};
for(const b of data)assert.ok(motif[b.id]&&/^#[0-9a-fA-F]{6}$/.test(b.accent));
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sha=s=>createHash('sha256').update(s).digest('hex');
const svg=(body,box)=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+box+'" role="img">'+body+'</svg>';
const graphic=b=>'<rect x="2" y="2" width="92" height="92" rx="21" fill="#101925" stroke="'+b.accent+'" stroke-opacity=".4"/><g transform="translate(16 16)" fill="none" stroke="'+b.accent+'" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.25">'+motif[b.id]+'</g>';
const mark=b=>svg(graphic(b),'0 0 96 96');
const wordmark=(b,inverse)=>{
 const ink=inverse?'#faf9f5':b.ink;
 const size=b.name.length>=18?21:b.name.length>=13?25:29;
 return svg('<g transform="translate(0 0)">'+graphic(b)+'</g><text x="115" y="49" fill="'+ink+'" font-family="Avenir Next,Montserrat,Inter,Arial,sans-serif" font-weight="750" font-size="'+size+'" letter-spacing="2.1">'+escape(b.name)+'</text><text x="116" y="71" fill="'+b.accent+'" font-family="Inter,Arial,sans-serif" font-size="10.5" font-weight="700" letter-spacing="2.2">'+escape(b.industry.toUpperCase().slice(0,43))+'</text>','0 0 600 96');
};
fs.mkdirSync(dir,{recursive:true});
const receipts=[];
for(const b of data){
 for(const [suffix,html] of [['-mark.svg',mark(b)],['-logo.svg',wordmark(b,false)],['-logo-contrast.svg',wordmark(b,true)]]){
  assert.ok(!/<script|onload=|javascript:/i.test(html));
  const name=b.id+suffix;fs.writeFileSync(path.join(dir,name),html);
  receipts.push({brand_id:b.id,file:'assets/brands/'+name,sha256:sha(html)});
 }
}
const replace=(str,a,b,name)=>{
 if(str.split(a).length!==2)throw Error('UNEXPECTED_HTML_'+name);
 return str.replace(a,b);
};
for(const b of configs){
 const dest=path.join(dest,b.id,'index.html');
 let html=fs.readFileSync(dest,'utf8');
 const original='<a href="#top" class="site-brand">'+escape(b.name)+'</a>';
 const updated='<a href="#top" class="site-brand" aria-label="'+escape(b.name)+' home"><img class="site-logo" src="../assets/brands/'+b.id+'-logo.svg" width="295" height="56" alt="'+escape(b.name)+' concept logo"></a>';
 html=replace(html,original,updated,b.id+'-header');
 html=replace(html,'</head>','<link rel="icon" type="image/svg+xml" href="../assets/brands/'+b.id+'-mark.svg"></head>',b.id+'-favicon');
 html=replace(html,'</style>','.site-brand{display:inline-flex;align-items:center;min-width:0}.site-logo{display:block;width:min(295px,43vw);height:56px;max-width:100%;object-fit:contain;object-position:left center}@media(max-width:700px){.site-logo{height:42px;width:min(235px,54vw)}}\n</style>',b.id+'-css');
 html=replace(html,'<a href="../index.html">Browse every master ↗</a>','<a href="../index.html">Browse every master ↗</a><a href="../brands/index.html">View brand identity ↗</a>',b.id+'-brandfooter');
 fs.writeFileSync(dest,html);
}
const galleryFile=path.join(dest,'index.html');
let gallery=fs.readFileSync(galleryFile,'utf8');
gallery=replace(gallery,'<span class="studio-actions">','<span class="studio-actions"><a href="brands/index.html">20 BRAND LOGOS ↗</a> &nbsp; ', 'gallery-header');
gallery=replace(gallery,'<a class="compose-cta" href="../launch-composer/index.html">CHOOSE A MASTER · BUILD A REVIEW PACKET ↗</a>','<a class="compose-cta" href="brands/index.html">BROWSE ALL 20 LOGOS ↗</a> <a class="compose-cta" href="../launch-composer/index.html">CHOOSE A MASTER · BUILD A REVIEW PACKET ↗</a>','gallery-cta');
gallery=replace(gallery,'</style>','.design-logo{margin-bottom:10px;width:min(260px,100%);height:51px;display:block;object-fit:contain;object-position:left center}.design-card:hover .design-logo{filter:brightness(1.12)}\n</style>','gallery-style');
for(const b of data){
 const title='<h3>'+escape(b.name)+' <span>↗</span></h3>';
 gallery=replace(gallery,title,'<img class="design-logo" src="assets/brands/'+b.id+'-logo-contrast.svg" width="260" height="51" loading="lazy" alt="'+escape(b.name)+' original logo">'+title,'catalog-'+b.id);
}
fs.writeFileSync(galleryFile,gallery);
const studioFile=path.join(root,'public','premium','index.html');
let studio=fs.readFileSync(studioFile,'utf8');
if(!studio.includes('OPEN 20 BUSINESS WEBSITES')){
 studio=replace(studio,'<body>','<body><div style="background:#111b28;color:#f5f0e7;padding:16px 24px;display:flex;gap:20px;align-items:center;justify-content:center;flex-wrap:wrap;border-bottom:2px solid #d5b688;font:700 13px Inter,system-ui,sans-serif"><span>20 BUSINESS WEBSITES · 20 ORIGINAL LOGOS</span><a href="collection/index.html" style="color:#121c29;background:#e4c69a;padding:13px 17px;border-radius:4px;text-decoration:none">OPEN 20 BUSINESS WEBSITES ↗</a><a href="collection/brands/index.html" style="color:#f4d9ab">VIEW LOGOS ↗</a></div>','studio-link');
 fs.writeFileSync(studioFile,studio);
}
const brandRows=data.map((b,i)=>{
 const href=['monolith','argent','atelier'].includes(b.id)?'../../templates/'+b.id+'/index.html':'../'+b.id+'/index.html';
 return '<article class="brand"><div class="art"><img src="../assets/brands/'+b.id+'-logo-contrast.svg" alt="'+escape(b.name)+' wordmark" width="510" height="90" loading="lazy"></div><div class="info"><small>'+String(i+1).padStart(2,'0')+' / 20 · '+escape(b.industry)+'</small><h2>'+escape(b.name)+'</h2><div class="actions"><a class="open" href="'+href+'">OPEN FULL WEBSITE ↗</a><a href="../assets/brands/'+b.id+'-logo.svg" download>DOWNLOAD SVG ↧</a><a href="../assets/brands/'+b.id+'-mark.svg" download>ICON ↧</a></div></div></article>';
}).join('\n');
const css=':root{background:#0b1019;color:#f5f0e8;font-family:Inter,system-ui,Arial,sans-serif}*{box-sizing:border-box}body{margin:0}a{color:inherit;text-decoration:none}header{padding:26px 5%;display:flex;gap:20px;justify-content:space-between;border-bottom:1px solid #354253;flex-wrap:wrap}header a{color:#e5c69b}.hero{padding:80px 5% 60px;background:radial-gradient(circle at 85% 0,#293a50,transparent 45%)}.eyebrow{color:#c4a679;letter-spacing:.15em;font-size:11px;font-weight:800}.hero h1{font-family:Georgia,serif;font-weight:400;letter-spacing:-.06em;font-size:clamp(48px,7vw,98px);line-height:1.02;max-width:1000px;margin:20px 0}.hero p{font-size:18px;line-height:1.7;max-width:800px;color:#aeb8c8}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;padding:35px 5% 80px}.brand{border:1px solid #354151;background:#111b27;min-width:0}.art{min-height:210px;background:radial-gradient(ellipse at top right,#39485a99,transparent 60%),#15202f;display:flex;align-items:center;padding:28px}.art img{width:100%;height:auto;max-height:105px;object-fit:contain}.info{padding:24px}.info small{letter-spacing:.09em;color:#d1ae83;text-transform:uppercase}.info h2{font-size:24px;letter-spacing:-.03em;margin:15px 0 24px}.actions{display:flex;flex-wrap:wrap;gap:10px}.actions a{border:1px solid #566279;padding:11px 13px;font-weight:750;font-size:11px}.actions .open{color:#142030;background:#e5c69b;border-color:#e5c69b}footer{border-top:1px solid #334156;padding:25px 5%;font-size:12px;color:#9caec5}@media(max-width:1060px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:660px){.grid{grid-template-columns:1fr}.hero{padding:55px 5%}.art{min-height:170px}}';
const brandHTML='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>20 Business Brands & Logos | Strategic Minds AI</title><style>'+css+'</style></head><body><header><strong>STRATEGIC MINDS AI / BRAND FOUNDRY</strong><a href="../index.html">← ALL 20 BUSINESS WEBSITES</a></header><section class="hero"><span class="eyebrow">20 original, editable SVG brand concepts</span><h1>A logo for every<br>business experience.</h1><p>Browse twenty fictional brand identities, open their complete website previews, or download each SVG wordmark and icon. These are design concepts, not trademark-clearance certificates or operating businesses.</p></section><main class="grid">'+brandRows+'</main><footer>PREVIEW ONLY · NOINDEX · CHECK ALL NAMES AND TRADEMARKS BEFORE COMMERCIAL RELEASE</footer></body></html>';
const brandDir=path.join(dest,'brands');fs.mkdirSync(brandDir,{recursive:true});
fs.writeFileSync(path.join(brandDir,'index.html'),brandHTML);
const manifestPath=path.join(dest,'catalog-manifest.json');
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
for(const row of manifest.new_masters){
 const html=fs.readFileSync(path.join(dest,row.id,'index.html'),'utf8');
 row.sha256=sha(html);row.bytes=Buffer.byteLength(html);
 row.brand_logo='assets/brands/'+row.id+'-logo.svg';
 row.brand_mark='assets/brands/'+row.id+'-mark.svg';
}
manifest.catalog_sha256=sha(gallery);
manifest.brand_count=20;
manifest.brand_asset_count=receipts.length;
manifest.brand_assets=receipts;
manifest.brand_gallery='brands/index.html';
manifest.brand_gallery_sha256=sha(brandHTML);
manifest.production_release=false;
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
assert.equal(receipts.length,60);
assert.equal(new Set(receipts.map(x=>x.sha256)).size,60);
console.log('PASS 20 BUSINESS BRANDS '+JSON.stringify({business_websites:20,brand_logos:20,svg_files:60,homepage_catalog_link:true,brands_gallery:'premium/collection/brands/index.html',noindex:true,source_safe:true}));
