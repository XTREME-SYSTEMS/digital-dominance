import fs from 'node:fs';
import assert from 'node:assert/strict';
import { classifyRequestPath, renderNotFoundHtml, manifest } from '../edge-route-policy.mjs';

const sitemap = fs.readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
const vercelManager = fs.readFileSync(new URL('../base44/functions/vercelManager/entry.ts', import.meta.url), 'utf8');
const sitemapPaths = [...sitemap.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)]
  .map((m) => m[1].trim().replace(/^https?:\/\/[^/]+/, '').replace(/\/+$/, '') || '/');

const exact = new Set(manifest.exactPaths);
const checks = [];
const check = (name, fn) => {
  try {
    fn();
    checks.push({ name, pass: true });
  } catch (error) {
    checks.push({ name, pass: false, detail: error.message });
  }
};

check('manifest covers every sitemap URL', () => {
  const missing = sitemapPaths.filter((p) => !exact.has(p));
  assert.equal(missing.length, 0, `${missing.length} missing routes: ${missing.slice(0, 5).join(', ')}`);
});
check('manifest preserves sitemap cardinality', () => {
  assert.equal(manifest.sitemapUrlCount, sitemapPaths.length);
});

check('manifest has deterministic source hash', () => {
  assert.match(manifest.sourceHash, /^[a-f0-9]{64}$/);
});

check('canonical Miami route passes', () => {
  assert.equal(classifyRequestPath('/fl/miami').action, 'next');
});

check('legacy full-state Miami route 308s', () => {
  const result = classifyRequestPath('/florida/miami');
  assert.equal(result.action, 'redirect');
  assert.equal(result.status, 308);
  assert.equal(result.location, '/fl/miami');
});

check('unknown one-segment route is a real 404 decision', () => {
  const result = classifyRequestPath('/nonexistent-route-xyz');
  assert.equal(result.action, 'not_found');
  assert.equal(result.status, 404);
});
check('unknown location route is a real 404 decision', () => {
  const result = classifyRequestPath('/xx/not-a-real-city');
  assert.equal(result.action, 'not_found');
  assert.equal(result.status, 404);
});

check('unknown published-page namespace does not fall through', () => {
  assert.equal(classifyRequestPath('/p/not-a-real-page').action, 'not_found');
});

check('download remains a valid public route', () => {
  assert.equal(classifyRequestPath('/download').action, 'next');
});

check('workflow noindex route remains valid', () => {
  assert.equal(classifyRequestPath('/questionnaire').action, 'next');
});

check('admin routes pass to the SPA/auth layer', () => {
  assert.equal(classifyRequestPath('/admin/site-health').action, 'next');
});

check('session result routes pass to the SPA', () => {
  assert.equal(classifyRequestPath('/results/example-id').action, 'next');
});

check('static assets bypass route enforcement', () => {
  assert.equal(classifyRequestPath('/assets/index-abc123.js').action, 'next');
});
check('full-state aliases are absent from the exact route set', () => {
  const aliases = manifest.exactPaths.filter((p) => /^\/(alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new-hampshire|new-jersey|new-mexico|new-york|north-carolina|north-dakota|ohio|oklahoma|oregon|pennsylvania|rhode-island|south-carolina|south-dakota|tennessee|texas|utah|vermont|virginia|washington|west-virginia|wisconsin|wyoming)\//.test(p));
  assert.equal(aliases.length, 0, `${aliases.length} legacy aliases remain`);
});

check('404 body is explicitly non-indexable', () => {
  const html = renderNotFoundHtml('/nonexistent-route-xyz');
  assert.match(html, /<meta name="robots" content="noindex,nofollow">/);
  assert.doesNotMatch(html, /rel=["']canonical["']/i);
});

check('Vercel manager exposes a preview-only Git deployment action', () => {
  assert.match(vercelManager, /case 'createPreviewDeployment'/);
  assert.match(vercelManager, /preview-only; production target is forbidden/);
  assert.match(vercelManager, /gitSource:/);
});

check('Vercel preview action cannot set production target', () => {
  const previewBlock = vercelManager.slice(
    vercelManager.indexOf("case 'createPreviewDeployment'"),
    vercelManager.indexOf("case 'deleteDeployment'")
  );
  assert.doesNotMatch(previewBlock, /target:\s*['"]production['"]/);
});

check('owner-token preview validator is read-only and host-restricted', () => {
  const block = vercelManager.slice(
    vercelManager.indexOf("case 'validateProtectedPreviewWithOwnerToken'"),
    vercelManager.indexOf("case 'validateProtectedPreview'")
  );
  assert.match(block, /endsWith\('\.vercel\.app'\)/);
  assert.match(block, /auth_mode:\s*'vercel_owner_token'/);
  const resultBlock = block.slice(block.lastIndexOf('result = {'));
  assert.doesNotMatch(resultBlock, /\btoken\s*:/i);
  assert.doesNotMatch(resultBlock, /authorization\s*:/i);
});

check('protected preview bypass mutation is fail-closed behind operator environment gate', () => {
  const block = vercelManager.slice(
    vercelManager.indexOf("case 'validateProtectedPreview'"),
    vercelManager.indexOf("case 'deleteDeployment'")
  );
  const gate = block.indexOf("ALLOW_VERCEL_PROTECTION_BYPASS_MUTATION");
  const mutation = block.indexOf("/protection-bypass");
  assert.ok(gate >= 0, 'missing protected bypass environment gate');
  assert.ok(mutation > gate, 'mutation appears before approval gate');
  assert.match(block, /status:\s*403/);
});

check('protected preview validator is restricted to vercel.app hosts', () => {
  assert.match(vercelManager, /case 'validateProtectedPreview'/);
  assert.match(vercelManager, /endsWith\('\.vercel\.app'\)/);
});

check('protected preview validator never returns bypass value', () => {
  const block = vercelManager.slice(
    vercelManager.indexOf("case 'validateProtectedPreview'"),
    vercelManager.indexOf("case 'deleteDeployment'")
  );
  const resultBlock = block.slice(block.indexOf('result = {'));
  assert.doesNotMatch(resultBlock, /bypass(Value|Secret)\s*:/i);
});

check('preview protection inspection is read-only and secret-safe', () => {
  const block = vercelManager.slice(
    vercelManager.indexOf("case 'inspectPreviewProtection'"),
    vercelManager.indexOf("case 'deleteDeployment'")
  );
  assert.match(block, /inspection_only:\s*true/);
  assert.match(block, /protection_bypass_present/);
  assert.match(block, /protection_bypass_type/);
  assert.doesNotMatch(block, /protection_bypass_value|secret_value/i);
});

const failed = checks.filter((c) => !c.pass);
for (const result of checks) {
  console.log(`${result.pass ? 'PASS' : 'FAIL'}  ${result.name}${result.detail ? ` — ${result.detail}` : ''}`);
}

if (failed.length) {
  console.error(`\n${failed.length} edge-routing regression check(s) failed.`);
  process.exit(1);
}
console.log(`\n${checks.length} edge-routing regression checks passed.`);
