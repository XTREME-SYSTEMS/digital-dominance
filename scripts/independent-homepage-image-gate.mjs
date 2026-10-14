#!/usr/bin/env node
// Separate quality reviewer: actual approved homepage image mapping, local image
// content hashes and semantic evidence. Does not grant its own approvals.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {HOME_INDUSTRY_IMAGES} from '../src/data/homeIndustryImages.js';

const root=resolve(import.meta.dirname,'..');
const dir=resolve(root,'public/images');
const src=readFileSync(resolve(root,'src/components/launch-engine/IndustriesGrid.jsx'),'utf8');
const prov=JSON.parse(readFileSync(resolve(root,'docs/quality/homepage-industry-image-provenance.json'),'utf8'));
const approvals=JSON.parse(readFileSync(resolve(root,'docs/quality/approved-homepage-image-evidence.json'),'utf8'));
const records=Object.fromEntries(prov.items.map(x=>[x.category_id,x]));
const approved=Object.fromEntries((approvals.approvals||[]).map(x=>[x.category_id,x]));
const findings=[];
const sourceIsCanonical=src.includes('image: HOME_INDUSTRY_IMAGES[niche],')&&!src.includes('stock?.preview_image_url')&&!src.includes('SafeImage');
if(!sourceIsCanonical)findings.push({status:'FAIL',issue:'HOMEPAGE_HAS_UNCONTROLLED_DYNAMIC_IMAGES'});
const list=src.match(/const CATEGORIES = \[([\s\S]*?)\];/);
const categories=list?[...list[1].matchAll(/\['([^']+)',\s*'([^']+)'\]/g)].map(x=>({label:x[1],niche:x[2]})):[];
if(categories.length!==20)findings.push({status:'FAIL',issue:'HOMEPAGE_CATEGORY_COVERAGE_NOT_20',actual:categories.length});
const seen=new Set();
let technical=0,semantic=0;
for(const {label,niche} of categories){
 const url=HOME_INDUSTRY_IMAGES[niche];
 if(!url||!/^\/images\/(industries|home-industries)\/[a-z0-9_-]+\.(png|jpg|jpeg|webp)$/.test(url)){findings.push({category:niche,status:'FAIL',issue:'INVALID_ASSET_PATH'});continue;}
 if(seen.has(url)){findings.push({category:niche,status:'FAIL',issue:'REUSED_ASSET_PATH',url});continue;}seen.add(url);
 const file=resolve(root,'public',url.slice(1));
 if(!file.startsWith(dir+(process.platform==='win32'?'\\':'/'))||!existsSync(file)){findings.push({category:niche,status:'FAIL',issue:'MISSING_ASSET',url});continue;}
 const bytes=readFileSync(file);const hash=createHash('sha256').update(bytes).digest('hex');
 const rec=records[niche];
 if(bytes.length<8000||!rec||rec.image_url!==url||rec.image_sha256!==hash||!rec.source_url||!rec.license){findings.push({category:niche,status:'FAIL',issue:'BAD_PROVENANCE_OR_HASH',url});continue;}technical++;
 const q=approved[niche];
 if(!q){findings.push({category:niche,status:'UNKNOWN',issue:'INDEPENDENT_SEMANTIC_REVIEW_PENDING',url});continue;}
 if(q.image_sha256!==hash||q.image_url!==url||q.category_label!==label||q.status!=='APPROVED'||!q.independent_validator||!q.evidence_uri||!(Number(q.semantic_match_score)>=0.98)){findings.push({category:niche,status:'UNKNOWN',issue:'SEMANTIC_EVIDENCE_STALE_OR_INVALID',url});continue;}
 semantic++;
}
const status=findings.length?'BLOCKED':'EVIDENCE_PRESENT_PENDING_BROWSER_PARITY';
const report={schema:'digital-dominance.independent-homepage-image-gate.v1',status,homepage_canonical_registry:sourceIsCanonical,technical_integrity:{status:technical===20&&sourceIsCanonical?'PASS':'FAIL',passed:technical,total:20},independent_semantic_evidence:{status:semantic===20?'PASS':'BLOCKED',passed:semantic,total:20},findings,limitation:'A matching hash and visually relevant candidate do not prove independent model/human semantic certification or final approved-page screenshot parity.'};
if(process.env.IMAGE_AUDIT_OUT)writeFileSync(resolve(process.env.IMAGE_AUDIT_OUT),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));if(findings.length)process.exitCode=1;