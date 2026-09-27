import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const configPath = path.join(root, 'digital-dominance.site.json');
const sitemapPath = path.join(root, 'public', 'sitemap.xml');
const outJson = path.join(root, 'edge-route-manifest.json');
const outModule = path.join(root, 'edge-route-manifest.mjs');

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const sitemap = fs.readFileSync(sitemapPath, 'utf8');

const normalizePath = (value) => {
  if (!value) return '/';
  const withSlash = value.startsWith('/') ? value : `/${value}`;
  return withSlash !== '/' ? withSlash.replace(/\/+$/, '') : '/';
};

const locs = [...sitemap.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)]
  .map((match) => match[1].trim());

if (!locs.length) throw new Error('No <loc> entries found in sitemap.xml');
const canonicalOrigin = String(config.canonicalOrigin || '').replace(/\/+$/, '');
if (!canonicalOrigin) throw new Error('canonicalOrigin is required');

const sitemapPaths = locs.map((url) => {
  if (!url.startsWith(canonicalOrigin + '/') && url !== canonicalOrigin) {
    throw new Error(`Sitemap URL is outside canonical origin: ${url}`);
  }
  return normalizePath(url.slice(canonicalOrigin.length) || '/');
});

const exactPaths = [...new Set([
  ...sitemapPaths,
  ...(config.validNonIndexPaths || []).map(normalizePath),
])].sort();

const stateMap = {
  alabama:'al', alaska:'ak', arizona:'az', arkansas:'ar', california:'ca',
  colorado:'co', connecticut:'ct', delaware:'de', florida:'fl', georgia:'ga',
  hawaii:'hi', idaho:'id', illinois:'il', indiana:'in', iowa:'ia',
  kansas:'ks', kentucky:'ky', louisiana:'la', maine:'me', maryland:'md',
  massachusetts:'ma', michigan:'mi', minnesota:'mn', mississippi:'ms',
  missouri:'mo', montana:'mt', nebraska:'ne', nevada:'nv',
  'new-hampshire':'nh', 'new-jersey':'nj', 'new-mexico':'nm', 'new-york':'ny',
  'north-carolina':'nc', 'north-dakota':'nd', ohio:'oh', oklahoma:'ok',
  oregon:'or', pennsylvania:'pa', 'rhode-island':'ri', 'south-carolina':'sc',
  'south-dakota':'sd', tennessee:'tn', texas:'tx', utah:'ut', vermont:'vt',
  virginia:'va', washington:'wa', 'west-virginia':'wv', wisconsin:'wi',
  wyoming:'wy', 'district-of-columbia':'dc'
};

const sourceHash = crypto.createHash('sha256')
  .update(JSON.stringify(config))
  .update('\n')
  .update(sitemap)
  .digest('hex');

const manifest = {
  schemaVersion: '1.0',
  contract: 'digital-dominance-edge-routing',
  siteId: config.siteId,
  siteName: config.siteName,
  canonicalOrigin,
  spaFallback: config.spaFallback || '/index.html',
  sourceHash,
  exactPaths,
  passThroughPrefixes: [...new Set(config.passThroughPrefixes || [])].sort(),
  legacyStateMap: stateMap,
  sitemapUrlCount: sitemapPaths.length,
  exactPathCount: exactPaths.length
};

const json = JSON.stringify(manifest, null, 2) + '\n';
fs.writeFileSync(outJson, json, 'utf8');
fs.writeFileSync(outModule, `export default ${json.trim()};\n`, 'utf8');

console.log(JSON.stringify({
  status: 'PASS',
  output: path.basename(outJson),
  sitemapUrlCount: manifest.sitemapUrlCount,
  exactPathCount: manifest.exactPathCount,
  sourceHash
}, null, 2));
