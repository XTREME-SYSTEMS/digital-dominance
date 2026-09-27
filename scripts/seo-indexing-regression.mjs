import fs from 'node:fs';

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const checks = [];
const check = (name, pass, detail = '') => checks.push({ name, pass: Boolean(pass), detail });

const robots = read('public/robots.txt');
const sitemap = read('public/sitemap.xml');
const seo = read('src/components/Seo.jsx');
const notFound = read('src/lib/PageNotFound.jsx');
const location = read('src/pages/seo/LocationSeoPage.jsx');
const distance = read('base44/functions/calculateDistanceTo100/entry.ts');
const repairFactory = read('base44/functions/alphaPrimeRepairFactory/entry.ts');
const postcondition = read('base44/functions/postconditionValidator/entry.ts');
const heartbeat = read('base44/functions/alphaPrimeHeartbeat/entry.ts');

check('robots blocks admin', robots.includes('Disallow: /admin'));
check('robots blocks api', robots.includes('Disallow: /api/'));
check('robots blocks visualizer test', robots.includes('Disallow: /visualizer-test'));
check('robots allows download', !robots.includes('Disallow: /download'));
check('robots has one sitemap', (robots.match(/^Sitemap:/gm) || []).length === 1);
check('robots retired sitemap-epn', !robots.includes('sitemap-epn.xml'));

const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const nonCanonicalStates = sitemapUrls.filter((url) => {
  const path = url.replace(/^https?:\/\/[^/]+/, '');
  const parts = path.split('/').filter(Boolean);
  return parts.length === 2 && parts[0].length > 2;
});
check('sitemap has no full-state aliases', nonCanonicalStates.length === 0, `${nonCanonicalStates.length} aliases`);
check('sitemap includes download', sitemapUrls.includes('https://epoxyquotenearme.com/download'));
check('sitemap contains 400+ canonical URLs', sitemapUrls.length >= 400, `${sitemapUrls.length} URLs`);

check('route-aware noindex exists', seo.includes('shouldNoIndex(path)'));
check('404 sets noindex', notFound.includes("noindex, nofollow"));
check('404 removes canonical', notFound.includes("link[rel=\"canonical\"]"));
check('404 sets runtime not-found marker', notFound.includes("dataset.pageNotFound = 'true'"));
check('RouteSeo respects runtime not-found marker', seo.includes('dataset.pageNotFound === "true"') && seo.includes('if (runtimeNotFound) removeCanonical()'));
check('legacy location uses document navigation', location.includes('window.location.replace(canonicalPath)'));
check('legacy location sets noindex', location.includes('noindex, follow'));

check('WEB-404 rejects 200', distance.includes("resp.status === 404 || resp.status === 410"));
check('HTTP SEO validators reachable', distance.includes("HTTP_SEO_BENCHMARKS.has(bid)"));
check('sitemap checks registry membership', distance.includes('registry URLs missing from'));
check('repair factory knows WEB-404', repairFactory.includes("'WEB-404-001':"));
check('repair factory knows SEO-ROBOTS', repairFactory.includes("'SEO-ROBOTS-001':"));
check('postcondition checks WEB-404', postcondition.includes("benchmarkId === 'WEB-404-001'"));
check('heartbeat detects robots drift', heartbeat.includes('robotsDrift'));
check('heartbeat detects soft404', heartbeat.includes('soft404Risk'));

const failed = checks.filter((x) => !x.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? ` — ${c.detail}` : ''}`);
if (failed.length) {
  console.error(`\n${failed.length} SEO indexing regression check(s) failed.`);
  process.exit(1);
}
console.log(`\n${checks.length} SEO indexing regression checks passed.`);
