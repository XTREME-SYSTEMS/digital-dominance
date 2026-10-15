#!/usr/bin/env node
/**
 * Independent image review packet builder for BOTH Digital Dominance image
 * catalogs. Never self-certifies semantic matches or edits approval manifests.
 *
 * Usage:
 *   node scripts/prepare-image-review-packet.mjs --out <directory> --fetch
 *   node scripts/prepare-image-review-packet.mjs --out <directory> (offline)
 *
 * --fetch downloads approved-host image BYTES and pins SHA-256 locally.
 * Independent visual reviewer must inspect the contact sheet and separately
 * approve exact bytes/category match. This script cannot approve release.
 */
import { getAllHomepageImages } from "../src/data/homeIndustryImages.js";
import { TOP_20_INDUSTRIES } from "../src/data/topIndustries.js";
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const args = process.argv.slice(2);
const fetchEnabled = args.includes("--fetch");
const oi = args.indexOf("--out");
const outDir = resolve(oi >= 0 && args[oi + 1] ? args[oi + 1] :
  join(tmpdir(), "dd-image-review-20261014"));
const sourceSha = process.env.DD_SOURCE_SHA || "UNKNOWN";
if (sourceSha !== "UNKNOWN" && !/^[0-9a-f]{40}$/i.test(sourceSha)) {
  throw new Error("INVALID_SOURCE_SHA");
}
const validHosts = new Set(["images.unsplash.com", "media.base44.com"]);
const escapeHtml = (text) => String(text ?? "").replace(/[&<>"']/g, (ch) =>
  ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const safeFile = (name) => String(name).toLowerCase().replace(/[^a-z0-9_-]/g, "-");
const items = [
  ...getAllHomepageImages().map((v) => ({
    catalog: "homepage",category_id:v.id,category_label:v.label,
    image_url:v.image_url,alt_text:v.alt_text,
    source_claim:v.source,license_claim:v.license
  })),
  ...TOP_20_INDUSTRIES.map((v) => ({
    catalog: "opportunity",category_id:v.id,category_label:v.label,
    image_url:v.previewImage,alt_text:v.label + " industry concept",
    source_claim:"topIndustries.previewImage",license_claim:"UNVERIFIED"
  }))
];
if (getAllHomepageImages().length !== 20 || TOP_20_INDUSTRIES.length !== 20)
  throw new Error("CATALOG_COUNT_DRIFT");
await mkdir(join(outDir, "assets"), {recursive:true});
let cursor = 0;
async function inspect(item) {
  const key = safeFile(item.catalog+"-"+item.category_id);
  const record = {...item,asset_status:"NOT_FETCHED",http_status:null,
    byte_length:null,mime:null,image_sha256:null,local_asset:null,
    semantic_match_score:null,independent_validator:null,
    review_status:"PENDING_INDEPENDENT_VISUAL_REVIEW",release_approved:false};
  let url;
  try { url = new URL(item.image_url); } catch {
    record.asset_status="INVALID_URL";return record;
  }
  if (url.protocol !== "https:" || !validHosts.has(url.hostname)) {
    record.asset_status="UNAPPROVED_HOST";return record;
  }
  record.host=url.hostname;
  record.url_sha256=createHash("sha256").update(item.image_url).digest("hex");
  if (!fetchEnabled) return record;
  try {
    const result=await fetch(item.image_url,{redirect:"follow",signal:AbortSignal.timeout(16000),
      headers:{"User-Agent":"StrategicMindsIndependentImageEvidenceAudit/1.0"}});
    record.http_status=result.status;
    if (!result.ok) throw new Error("HTTP_"+result.status);
    const length=Number(result.headers.get("content-length")||0);
    if (length>9000000) throw new Error("IMAGE_TOO_LARGE");
    const bytes=Buffer.from(await result.arrayBuffer());
    if (bytes.length>9000000 || bytes.length<250) throw new Error("INVALID_IMAGE_BYTES");
    const mimeHeader=(result.headers.get("content-type")||"").toLowerCase();
    const png=bytes.subarray(0,8).toString("hex")==="89504e470d0a1a0a";
    const jpg=bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
    const webp=bytes.toString("ascii",0,4)==="RIFF"&&bytes.toString("ascii",8,12)==="WEBP";
    const mime=png?"image/png":jpg?"image/jpeg":webp?"image/webp":null;
    if (!mime) throw new Error("NON_RASTER_IMAGE");
    record.mime=mime;
    record.response_content_type=mimeHeader;
    record.byte_length=bytes.length;
    record.image_sha256=createHash("sha256").update(bytes).digest("hex");
    const filename=key+(png?".png":jpg?".jpg":".webp");
    await writeFile(join(outDir,"assets",filename),bytes);
    record.local_asset="assets/"+filename;
    record.asset_status="BYTES_HASH_VERIFIED_SEMANTICS_PENDING";
  } catch (e) {
    record.asset_status="FETCH_FAILED";
    record.error_code=String(e?.message||"FETCH_ERROR").slice(0,120);
  }
  return record;
}
const records=new Array(items.length);
async function worker() {
  while (cursor<items.length) {
    const at=cursor++;
    records[at]=await inspect(items[at]);
  }
}
await Promise.all(Array.from({length:fetchEnabled?4:1},()=>worker()));
const duplicateAcrossCatalogs=new Map();
const duplicates=[];
for (const record of records) {
  const key=String(record.image_url||"").split("?")[0];
  if (duplicateAcrossCatalogs.has(key)) duplicates.push({
    first:duplicateAcrossCatalogs.get(key),second:record.catalog+":"+record.category_id,url:key
  });
  else duplicateAcrossCatalogs.set(key,record.catalog+":"+record.category_id);
}
const photoCount=records.filter(r=>r.asset_status==="BYTES_HASH_VERIFIED_SEMANTICS_PENDING").length;
const reviewReport={
  schema_version:"dd.independent-image-review-queue.v1",
  source_sha:sourceSha,created_at:new Date().toISOString(),
  release_status:"BLOCKED_PENDING_INDEPENDENT_IMAGE_APPROVAL",
  evidence_class:fetchEnabled?"BYTES_HASHED_SEMANTICS_UNREVIEWED":"SOURCE_URLS_ONLY",
  image_count:records.length,catalogs:{homepage:20,opportunity:20},
  byte_verified:photoCount,fetch_failed:records.filter(r=>r.asset_status==="FETCH_FAILED").length,
  duplicate_source_urls:duplicates,
  independent_visual_approvals:0,approval_manifests_modified:false,
  no_new_queue_or_scheduler:true,network_access:fetchEnabled?"IMAGE_HOST_ALLOWLIST_ONLY":"NONE",
  requirements:["confirm image depicts exact category","assess originality/license",
    "inspect output pixels for misleading AI artifacts","attach independent evidence URI",
    "sign human/independent-vision reviewer name","only then approve exact byte hash"],
  records
};
const sections=records.map(r=>{
  const asset=r.local_asset?'<img loading="lazy" alt="'+escapeHtml(r.alt_text)+'" src="'+escapeHtml(r.local_asset)+'">':
    '<div class="missing">Image not pinned to local verified bytes</div>';
  return '<article><header><span>'+escapeHtml(r.catalog)+'</span><h2>'+
    escapeHtml(r.category_label)+'</h2></header>'+asset+'<p><strong>'+
    escapeHtml(r.asset_status)+'</strong></p><p>'+escapeHtml(r.alt_text)+'</p><small>'+
    escapeHtml(r.image_sha256||"No verified image SHA-256")+'</small><footer>'+
    '<a href="'+escapeHtml(r.image_url)+'" target="_blank" rel="noreferrer">Review source</a></footer></article>';
}).join("\n");
const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Digital Dominance independent image evidence review</title>'+
  '<meta name="robots" content="noindex,nofollow"><meta name="viewport" content="width=device-width, initial-scale=1">'+
  '<style>body{font-family:Arial,sans-serif;background:#080f1f;color:#e5edf7;margin:0;padding:30px}'+
  'h1{font-size:30px}p{line-height:1.4}.note{padding:16px;background:#4b2717;color:#fff;border-radius:10px}'+
  'main{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px}'+
  'article{background:#14233a;border:1px solid #34506e;border-radius:14px;padding:12px;overflow:hidden}'+
  'article header{min-height:75px}article img,.missing{width:100%;height:235px;object-fit:cover;background:#27344b;border-radius:8px}'+
  '.missing{display:grid;place-items:center;color:#fed7aa;text-align:center}span{color:#8bd5ff;font-size:12px;text-transform:uppercase}'+
  'h2{font-size:19px}small{overflow-wrap:anywhere;color:#9caec5}a{color:#8cd4fc}footer{padding:8px 0}</style></head><body>'+
  '<h1>Digital Dominance | Independent Image Review</h1><p class="note">NOT APPROVED. '+
  'Local image bytes and hashes are evidence of identity only. Inspect semantics, rights, and visual artifacts before approval. '+
  'No indexable content, published sites or customer messages were created.</p>'+
  '<p>Source: '+escapeHtml(sourceSha)+' | Byte-verified: '+photoCount+'/'+records.length+
  ' | Pending semantic approvals: '+records.length+'</p><main>'+sections+'</main></body></html>';
await Promise.all([
  writeFile(join(outDir,"review.json"),JSON.stringify(reviewReport,null,2)+"\n"),
  writeFile(join(outDir,"contact-sheet.html"),html)
]);
console.log(JSON.stringify({status:"REVIEW_BATCH_READY_NOT_RELEASE_APPROVED",
  source_sha:sourceSha,out_dir:outDir,images:records.length,byte_verified:photoCount,
  fetch_failed:reviewReport.fetch_failed,duplicate_url_count:duplicates.length,
  manifest_approvals_written:0,reviewer_action:"INDEPENDENT_VISUAL_REVIEW_REQUIRED"},null,2));
