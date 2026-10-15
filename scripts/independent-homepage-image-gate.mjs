#!/usr/bin/env node
/**
 * Semantic evidence gate remains fail-closed. Unlike the legacy check, it
 * recognizes self-hosted, hash-verified image paths as secure technical assets.
 * Asset integrity is NOT independent approval of the depicted subject.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAllHomepageImages } from '../src/data/homeIndustryImages.js';
import { auditHomepageAssetIntegrity } from './homepage-image-asset-integrity.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = resolve(root, 'docs/quality/approved-homepage-image-evidence.json');
const raw = readFileSync(manifestPath);
const manifest = JSON.parse(raw.toString('utf8'));
const approvals = new Map((manifest.approvals || []).map(x => [x.category_id, x]));
const images = getAllHomepageImages();
const technical = auditHomepageAssetIntegrity();
const findings = [];
const seen = new Set();

for (const item of images) {
  const url = item.image_url;
  if (!url || !/^\/images\/(industries|home-industries)\/[a-z0-9_-]+\.(png|jpe?g|webp)$/i.test(url)) {
    findings.push({ category: item.id, status:'FAIL', issue:'MISSING_OR_UNSAFE_LOCAL_IMAGE_URL',url });
    continue;
  }
  if (seen.has(url)) {
    findings.push({ category:item.id,status:'FAIL',issue:'CATEGORY_IMAGE_REUSED',url });
    continue;
  }
  seen.add(url);
  const badAsset = technical.issues.find(x => x.category === item.id);
  if (badAsset) {
    findings.push({ category:item.id,status:'FAIL',issue:badAsset.issue,url });
    continue;
  }
  const evidence = approvals.get(item.id);
  if (!evidence) {
    findings.push({ category:item.id,status:'UNKNOWN',issue:'NO_INDEPENDENT_SEMANTIC_IMAGE_EVIDENCE',url });
    continue;
  }
  const valid =
    evidence.image_url === url &&
    evidence.category_label === item.label &&
    evidence.image_sha256 === item.image_sha256 &&
    typeof evidence.evidence_uri === 'string' && evidence.evidence_uri.trim().length > 0 &&
    typeof evidence.independent_validator === 'string' && evidence.independent_validator.trim().length > 0 &&
    typeof evidence.semantic_match_score === 'number' && evidence.semantic_match_score >= 0.98 &&
    evidence.status === 'APPROVED';
  if (!valid) findings.push({ category:item.id,status:'UNKNOWN',issue:'INVALID_OR_STALE_SEMANTIC_EVIDENCE',url });
}
const blocked = technical.issues.length > 0 || findings.length > 0;
const report = {
  schema_version:'digital-dominance.independent-homepage-image-evidence-gate.v2',
  status:blocked?'BLOCKED':'EVIDENCE_PRESENT_PENDING_INDEPENDENT_RUNTIME_QA',
  total_categories:images.length,
  technically_verified:technical.verified_assets,
  technical_issues:technical.issues,
  independent_semantic_approvals:images.length - findings.length,
  categories_without_verifiable_semantic_evidence:findings.filter(x=>x.status==='UNKNOWN').length,
  no_self_certification:true,
  limitation:'SHA-256 and HTTP availability do not prove category relevance. Independently approved pixel review, visual-reference comparison and license verification remain separate.',
  semantic_manifest_sha256:createHash('sha256').update(raw).digest('hex'),
  findings,
};
if (process.env.IMAGE_AUDIT_OUT)
  writeFileSync(resolve(process.env.IMAGE_AUDIT_OUT),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if (blocked) process.exitCode=1;
