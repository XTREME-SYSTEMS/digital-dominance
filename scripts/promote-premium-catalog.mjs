// Fail-closed generation of a signed-approval-only premium reuse catalog.
// This never alters the public showroom, Base44 data, production or queue.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {approvedCatalog} from './premium-promotion-policy.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const configs=JSON.parse(fs.readFileSync(path.join(root,'data/premium-collection-20.json'),'utf8'));
const ledger=JSON.parse(fs.readFileSync(path.join(root,'docs/quality/premium-signed-approvals.json'),'utf8'));
const keys=JSON.parse(fs.readFileSync(path.join(root,'docs/quality/premium-reviewer-keys.json'),'utf8'));
assert.equal(configs.length,17);
const result=approvedCatalog({configs,ledger,keys});
const allowed=result.designs.filter(x=>x.status==='APPROVED_PREVIEW_REUSE');
assert.equal(allowed.length,result.approved_count);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cards=allowed.map(row=>{
 const master=configs.find(x=>x.id===row.master_id);
 return '<article><span class="tag">INDEPENDENTLY VERIFIED / PREVIEW ONLY</span>'+
 '<h2>'+esc(master.name)+'</h2><p>'+esc(master.industry)+' / '+esc(master.family)+'</p>'+
 '<a href="../collection/'+encodeURIComponent(master.id)+'/index.html">Inspect full-page design ↗</a>'+
 '</article>';
}).join('\n');
const html='<!doctype html><html lang="en"><head><meta charset="utf-8">'+
 '<meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<meta name="robots" content="noindex,nofollow,noarchive">'+
 '<title>APEX | Independently Approved Premium Masters</title>'+
 '<style>:root{font-family:Inter,system-ui,sans-serif;background:#090e17;color:#f2f6ff}*{box-sizing:border-box}body{margin:0}main{width:min(1150px,calc(100% - 40px));margin:auto;padding:65px 0}h1{font-size:clamp(36px,5vw,68px);letter-spacing:-.06em;max-width:760px;line-height:1.04}h2{font-size:24px}p{color:#b3c4d8;line-height:1.7;max-width:740px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,315px),1fr));gap:18px;margin-top:35px}article{padding:30px;border:1px solid #425875;border-radius:16px;background:#152136}.tag{font-size:11px;color:#94dcff;letter-spacing:.1em}a{color:#9dddff;text-decoration:underline;text-underline-offset:5px}</style></head><body>'+
 '<main><div class="tag">PREVIEW-ONLY / EXACT SOURCE / SIGNED REVIEW REQUIRED</div>'+
 '<h1>Only independently approved design systems.</h1>'+
 '<p>'+allowed.length+' design(s) eligible for approved premium preview reuse; '+result.pending_count+
 ' remain unapproved. This catalog deliberately excludes candidate designs without signed, image-bound desktop/mobile visual evidence. Production websites, payments, leads, SEO and customer messaging are NOT authorized by design approval.</p>'+
 (allowed.length?'<div class="grid">'+cards+'</div>':
 '<article><h2>No approved master designs yet</h2><p>Source demos remain available for examination, but are not promoted until an independent reviewer with an authorized signing identity verifies the exact design and image evidence.</p><a href="../collection/index.html">View unapproved preview candidates ↗</a></article>')+
 '</main></body></html>';
const dest=path.join(root,'public/premium/approved');
fs.mkdirSync(dest,{recursive:true});
fs.writeFileSync(path.join(dest,'index.html'),html,'utf8');
fs.writeFileSync(path.join(dest,'catalog.json'),JSON.stringify(result,null,2)+'\n');
console.log('PASS APPROVED PREMIUM CATALOG '+JSON.stringify({approved:result.approved_count,pending:result.pending_count,source_sha:result.source_sha,blocked_unapproved:true,production:false,output:'public/premium/approved/'}));
