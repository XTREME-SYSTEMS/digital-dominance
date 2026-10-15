#!/usr/bin/env node
/**
 * Independent of the website UI: verify that all 20 local category assets
 * exist, have real image headers, match their frozen SHA-256 provenance, and
 * are mapped one-to-one. This is NOT semantic/design/license approval.
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAllHomepageImages } from '../src/data/homeIndustryImages.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const provenancePath = resolve(root, 'docs/quality/homepage-industry-image-provenance.json');
const assetRoot = resolve(root, 'public');
const pathPattern = /^\/images\/(industries|home-industries)\/[a-z0-9_-]+\.(png|jpg|jpeg|webp)$/i;
const shaPattern = /^[a-f0-9]{64}$/i;
const sha256 = buffer => createHash('sha256').update(buffer).digest('hex');
const pngHeader = Buffer.from([137,80,78,71,13,10,26,10]);

export function auditHomepageAssetIntegrity() {
  const registry = getAllHomepageImages();
  const manifest = JSON.parse(readFileSync(provenancePath, 'utf8'));
  const entries = manifest.items || [];
  const index = new Map(entries.map(entry => [entry.category_id, entry]));
  const issues = [];
  const unique = new Set();
  let verified = 0;
  if (registry.length !== 20 || entries.length !== 20 || index.size !== 20)
    issues.push({ issue: 'EXACTLY_20_INDUSTRIES_REQUIRED', registry: registry.length, provenance: entries.length });
  for (const item of registry) {
    const url = item.image_url;
    if (!pathPattern.test(url || '')) {
      issues.push({ category: item.id, issue: 'UNSAFE_OR_NONLOCAL_IMAGE_PATH', url });
      continue;
    }
    if (unique.has(url)) {
      issues.push({ category: item.id, issue: 'DUPLICATE_IMAGE_PATH', url });
      continue;
    }
    unique.add(url);
    const entry = index.get(item.id);
    if (!entry || entry.image_url !== url || entry.image_sha256 !== item.image_sha256 ||
        !shaPattern.test(item.image_sha256 || '')) {
      issues.push({ category: item.id, issue: 'PROVENANCE_HASH_OR_CATEGORY_MISMATCH', url });
      continue;
    }
    let bytes;
    try {
      bytes = readFileSync(resolve(assetRoot, url.slice(1)));
    } catch {
      issues.push({ category: item.id, issue: 'ASSET_MISSING', url });
      continue;
    }
    const isPNG = url.toLowerCase().endsWith('.png');
    const headerOkay = isPNG
      ? bytes.subarray(0,8).equals(pngHeader)
      : (url.toLowerCase().endsWith('.webp')
        ? bytes.subarray(0,4).toString() === 'RIFF' && bytes.subarray(8,12).toString() === 'WEBP'
        : bytes[0] === 0xff && bytes[1] === 0xd8);
    if (!headerOkay || bytes.length < 1024) {
      issues.push({ category: item.id, issue: 'INVALID_IMAGE_BYTES', url, actual_header_hex: bytes.subarray(0,12).toString('hex'), bytes: bytes.length });
      continue;
    }
    if (sha256(bytes) !== item.image_sha256) {
      issues.push({ category: item.id, issue: 'SHA256_MISMATCH', url });
      continue;
    }
    verified++;
  }
  return {
    status: issues.length ? 'FAIL' : 'TECHNICAL_ASSETS_PASS_SEMANTIC_REVIEW_PENDING',
    verified_assets: verified,
    required_assets: 20,
    independent_semantic_approvals: 'NOT_TESTED',
    issues,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = auditHomepageAssetIntegrity();
  console.log(JSON.stringify(result, null, 2));
  if (result.issues.length) process.exitCode = 1;
}
