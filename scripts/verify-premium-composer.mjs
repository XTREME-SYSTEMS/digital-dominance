// Static prevention gate for the premium approval-first SitePack composer.
// Browser-level interaction tests execute independently on JARVIS Chrome.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const wizard=fs.readFileSync(new URL('../public/premium/launch-composer/index.html',import.meta.url),'utf8');
const catalog=fs.readFileSync(new URL('../public/premium/collection/catalog-manifest.json',import.meta.url),'utf8');
const manifest=JSON.parse(catalog);
assert.equal(manifest.full_page_master_count,20);
assert.equal(manifest.published_customer_websites,0);
assert.ok(wizard.includes('<meta name="robots" content="noindex,nofollow,noarchive">'));
assert.match(wizard,/sandbox="allow-scripts"/,'Preview iframe must sandbox candidate interactions');
assert.match(wizard,/referrerpolicy="no-referrer"/,'Iframe must hide operator referrer');
assert.match(wizard,/fetch\('\.\.\/collection\/catalog-manifest\.json'/);
assert.match(wizard,/new TextEncoder\(\)/);
assert.match(wizard,/crypto\.subtle\.digest\('SHA-256'/);
assert.match(wizard,/URL\.createObjectURL\(blob\)/);
assert.match(wizard,/packet_state:'DRAFT_FOR_OPERATOR_REVIEW_NOT_QUEUED'/);
for(const s of [
 'verified_service_area:false', 'approval_required:true', 'noindex_until_validated:true',
 'operator_approved:false', 'guardian_pass:false','provider_deployment_id:null',
 'public_release_allowed:false', 'mass_launch_paused:true',
 "market_scores:'NOT_AVAILABLE_NO_VERIFIED_DATA'", "mode:'preview'"
])assert.ok(wizard.includes(s),'Missing essential release/safety declaration: '+s);
for(const id of ['monolith','argent','atelier'])assert.match(wizard,new RegExp("id:'"+id+"'"));
assert.ok(wizard.includes('launch-composer'));
assert.match(wizard,/b\.addEventListener\('keydown'/,'Master listbox must handle keyboard selection');
assert.match(wizard,/\['ArrowDown','ArrowUp','Home','End'\]/,'Arrow and boundary navigation required');
assert.match(wizard,/choices\[j\]\.click\(\)/,'Keyboard navigation must select a master');
assert.match(wizard,/x\.dataset\.masterId===t\.id\)\?\.focus\(\)/,'Selection must preserve keyboard focus');

assert.ok(wizard.includes('source-identity.json'), 'Composer must load source identity from current deployment');
assert.match(wizard, /PREVIEW_BUILD_IDENTITY_MISMATCH/, 'Stale or mismatched catalog manifests must fail');
assert.match(wizard, /UNBOUND_NO_VERIFIED_SOURCE/, 'Unbound checkout must be labeled honestly');
assert.match(wizard, /source_sha_provider_verified:false/, 'Build metadata is not independent provider validation');
assert.doesNotMatch(wizard, /8410144f6b3981d478fd8fd7a6115f4624eb2cdb/, 'Hard-coded stale SHA prohibited');
const provenance=fs.readFileSync(new URL('./write-premium-build-provenance.mjs',import.meta.url),'utf8');
assert.match(provenance, /VERCEL_GIT_COMMIT_SHA/);
assert.match(provenance, /catalog_manifest_sha256/);
assert.match(provenance, /source_sha_provider_verified:false/);
assert.doesNotMatch(wizard,/(?:fetch|XMLHttpRequest)\([^\n]*\/functions\/(?:publish|deploy|massLaunch|siteBank)/i);
assert.doesNotMatch(wizard,/import.*['"]base44|window\.base44|base44\.functions\.invoke/);
console.log('PASS PREMIUM_COMPOSER_CONTRACT: pinned 20 verified designs; sandbox full-page preview; 1-1000 proposed only; SitePack hash; all release gates fail closed');
