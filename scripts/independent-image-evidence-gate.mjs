#!/usr/bin/env node
/**
 * Independent release gate for homepage category images.
 * Technical image integrity is checked deterministically against the exact
 * local bytes and provenance manifest. Semantic image/category correctness
 * requires separate independent visual evidence and cannot self-certify.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { TOP_20_INDUSTRIES } from '../src/data/topIndustries.js';

const root = resolve(import.meta.dirname, '..');
const manifestPath = resolve(root, 'docs/quality/approved-industry-image-evidence.json');
const provenancePath = resolve(root, 'docs/quality/industry-image-provenance.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const provenance = JSON.parse(readFileSync(provenancePath, 'utf8'));
const approvals = Object.fromEntries((manifest.approvals || []).map(x => [x.category_id, x]));
const assets = Object.fromEntries((provenance.items || []).map(x => [x.category, x]));
const findings = [];
const seen = new Map();
let technicalPassed = 0, semanticPassed = 0;

for (const item of TOP_20_INDUSTRIES) {
  const url = item.previewImage;
  if (!url || !/^\/images\/industries\/[a-z0-9_-]+\.(png|jpg|jpeg|webp)$/.test(url)) {
    findings.push({ category: item.id, status: 'FAIL', issue: 'UNSAFE_OR_UNLOCALIZED_IMAGE_URL', url });
    continue;
  }
  if (seen.has(url)) {
    findings.push({ category: item.id, status: 'FAIL', issue: 'CATEGORY_IMAGE_REUSED', also_used_by: seen.get(url) });
    continue;
  }
  seen.set(url, item.id);

  const filePath = resolve(root, 'public', url.slice(1));
  const assetRoot = resolve(root, 'public/images/industries');
  if (!filePath.startsWith(assetRoot + (process.platform === 'win32' ? '\\' : '/')) || !existsSync(filePath)) {
    findings.push({ category: item.id, status: 'FAIL', issue: 'ASSET_PATH_MISSING_OR_ESCAPED', url });
    continue;
  }
  const bytes = readFileSync(filePath);
  const actualHash = createHash('sha256').update(bytes).digest('hex');
  const asset = assets[item.id];
  if (bytes.length < 8000 || !asset || asset.public_url !== url || asset.sha256 !== actualHash ||
      !asset.source_url || !asset.source_type || !asset.license) {
    findings.push({ category: item.id, status: 'FAIL', issue: 'ASSET_INTEGRITY_OR_PROVENANCE_MISMATCH', url });
    continue;
  }
  technicalPassed++;

  const evidence = approvals[item.id];
  if (!evidence) {
    findings.push({ category: item.id, status: 'UNKNOWN', issue: 'NO_INDEPENDENT_SEMANTIC_IMAGE_EVIDENCE', url });
    continue;
  }
  const hasProof =
    evidence.image_url === url && evidence.image_sha256 === actualHash &&
    evidence.category_label === item.label &&
    typeof evidence.evidence_uri === 'string' && evidence.evidence_uri.trim().length > 0 &&
    typeof evidence.independent_validator === 'string' && evidence.independent_validator.trim().length > 0 &&
    typeof evidence.semantic_match_score === 'number' && evidence.semantic_match_score >= 0.98 &&
    evidence.status === 'APPROVED';
  if (!hasProof) findings.push({ category: item.id, status: 'UNKNOWN', issue: 'INVALID_OR_STALE_SEMANTIC_EVIDENCE', url });
  else semanticPassed++;
}

const blocked = findings.length;
const report = {
  schema_version: 'digital-dominance.independent-image-evidence-gate.v2',
  repo_scope: 'XTREME-SYSTEMS/digital-dominance',
  status: blocked ? 'BLOCKED' : 'EVIDENCE_PRESENT_PENDING_INDEPENDENT_RUNTIME_QA',
  total_categories: TOP_20_INDUSTRIES.length,
  technical_asset_integrity: { status: technicalPassed === TOP_20_INDUSTRIES.length ? 'PASS' : 'FAIL', passed: technicalPassed, total: TOP_20_INDUSTRIES.length },
  semantic_independent_evidence: { status: semanticPassed === TOP_20_INDUSTRIES.length ? 'PASS' : 'BLOCKED', passed: semanticPassed, total: TOP_20_INDUSTRIES.length },
  categories_without_verifiable_evidence: blocked,
  checks: ['local image path', 'asset presence', 'unique image path', 'content SHA-256', 'source provenance', 'independent visual evidence'],
  limitation: 'A real image and its matching SHA-256 do not prove semantic category relevance. This release gate requires externally authored evidence from an independent visual reviewer.',
  manifest_sha256: createHash('sha256').update(readFileSync(manifestPath)).digest('hex'),
  provenance_sha256: createHash('sha256').update(readFileSync(provenancePath)).digest('hex'),
  findings,
};
if (process.env.IMAGE_AUDIT_OUT) writeFileSync(resolve(process.env.IMAGE_AUDIT_OUT), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (blocked) process.exitCode = 1;
