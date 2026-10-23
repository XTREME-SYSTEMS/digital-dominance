#!/usr/bin/env node
/**
 * Independent image-evidence preflight for Digital Dominance.
 * Runs outside Base44. A URL that loads is NOT proof of category relevance.
 * This gate verifies that independently produced semantic evidence is present
 * for each home-page image. It never generates its own approvals.
 *
 * To run: node scripts/independent-image-evidence-gate.mjs
 * To export evidence: IMAGE_AUDIT_OUT=... node scripts/independent-image-evidence-gate.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { TOP_20_INDUSTRIES } from '../src/data/topIndustries.js';

const root = resolve(import.meta.dirname, '..');
const manifestPath = resolve(root, 'docs/quality/approved-industry-image-evidence.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const approvals = Object.fromEntries((manifest.approvals || []).map(x => [x.category_id, x]));
const findings = [];
const seen = new Map();
for (const item of TOP_20_INDUSTRIES) {
  const url = item.previewImage;
  if (!url || !/^https:\/\//.test(url)) {
    findings.push({category: item.id, status: 'FAIL', issue: 'MISSING_OR_INSECURE_IMAGE_URL'});
    continue;
  }
  const normalizedUrl = url.split('?')[0];
  if (seen.has(normalizedUrl)) {
    findings.push({category: item.id, status: 'FAIL', issue: 'CATEGORY_IMAGE_REUSED', also_used_by: seen.get(normalizedUrl)});
  } else seen.set(normalizedUrl, item.id);
  const evidence = approvals[item.id];
  if (!evidence) {
    findings.push({category: item.id, status: 'UNKNOWN', issue: 'NO_INDEPENDENT_SEMANTIC_IMAGE_EVIDENCE', url});
    continue;
  }
  const hasProof =
    evidence.image_url === url &&
    evidence.category_label === item.label &&
    typeof evidence.evidence_uri === 'string' && evidence.evidence_uri.trim().length > 0 &&
    typeof evidence.independent_validator === 'string' && evidence.independent_validator.trim().length > 0 &&
    typeof evidence.image_sha256 === 'string' && /^[0-9a-f]{64}$/i.test(evidence.image_sha256) &&
    typeof evidence.semantic_match_score === 'number' && evidence.semantic_match_score >= 0.98 &&
    evidence.status === 'APPROVED';
  if (!hasProof) findings.push({category: item.id, status: 'UNKNOWN', issue: 'INVALID_OR_STALE_SEMANTIC_EVIDENCE', url});
}
const blocked = findings.filter(x => x.status !== 'PASS').length;
const report = {
  schema_version: 'digital-dominance.independent-image-evidence-gate.v1',
  repo_scope: 'XTREME-SYSTEMS/digital-dominance',
  status: blocked ? 'BLOCKED' : 'EVIDENCE_PRESENT_PENDING_INDEPENDENT_RUNTIME_QA',
  total_categories: TOP_20_INDUSTRIES.length,
  categories_without_verifiable_evidence: blocked,
  checks: ['URL presence', 'URL uniqueness', 'category identity', 'independent evidence reference', 'approved semantic match score'],
  limitation: 'This deterministic gate checks evidence records, not image pixels. Independent visual inspection and browser screenshots remain separate required gates.',
  manifest_sha256: createHash('sha256').update(readFileSync(manifestPath)).digest('hex'),
  findings,
};
if (process.env.IMAGE_AUDIT_OUT) writeFileSync(resolve(process.env.IMAGE_AUDIT_OUT), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (blocked) process.exitCode = 1;
