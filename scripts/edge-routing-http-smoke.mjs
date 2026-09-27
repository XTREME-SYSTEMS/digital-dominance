import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { once } from 'node:events';
import middleware from '../middleware.js';

const root = process.cwd();
const dist = path.join(root, 'dist');
const indexHtml = fs.readFileSync(path.join(dist, 'index.html'));
const robotsTxt = fs.readFileSync(path.join(dist, 'robots.txt'));
const sitemapXml = fs.readFileSync(path.join(dist, 'sitemap.xml'));

const server = http.createServer(async (req, res) => {
  try {
    const addr = server.address();
    const url = `http://127.0.0.1:${addr.port}${req.url}`;
    const result = await middleware(new Request(url, { method: req.method || 'GET' }));
    const routeHeader = result.headers.get('x-digital-dominance-route');

    if (result.headers.get('x-middleware-next') !== '1') {
      res.statusCode = result.status;
      result.headers.forEach((value, key) => {
        if (key.toLowerCase() !== 'content-length') res.setHeader(key, value);
      });
      const body = Buffer.from(await result.arrayBuffer());
      res.end(body);
      return;
    }

    const pathname = new URL(url).pathname;
    res.statusCode = 200;
    if (routeHeader) res.setHeader('x-digital-dominance-route', routeHeader);

    if (pathname === '/robots.txt') {
      res.setHeader('content-type', 'text/plain; charset=utf-8');
      res.end(robotsTxt);
      return;
    }
    if (pathname === '/sitemap.xml') {
      res.setHeader('content-type', 'application/xml; charset=utf-8');
      res.end(sitemapXml);
      return;
    }

    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.end(indexHtml);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: error?.message || String(error) }));
  }
});

await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});

const { port } = server.address();
const base = `http://127.0.0.1:${port}`;

const cases = [
  { path: '/fl/miami', status: 200, route: 'exact_route' },
  { path: '/florida/miami', status: 308, route: 'legacy_state_alias', location: '/fl/miami' },
  { path: '/nonexistent-route-xyz', status: 404, route: 'route_not_in_manifest', robots: 'noindex, nofollow' },
  { path: '/xx/not-a-real-city', status: 404, route: 'route_not_in_manifest', robots: 'noindex, nofollow' },
  { path: '/download', status: 200, route: 'exact_route' },
  { path: '/questionnaire', status: 200, route: 'exact_route' },
  { path: '/robots.txt', status: 200, route: 'asset_or_platform' },
  { path: '/sitemap.xml', status: 200, route: 'asset_or_platform' },
];

const results = [];
let failed = 0;

try {
  for (const item of cases) {
    const response = await fetch(base + item.path, { redirect: 'manual' });
    const body = await response.text();
    const observed = {
      path: item.path,
      status: response.status,
      location: response.headers.get('location'),
      route: response.headers.get('x-digital-dominance-route'),
      robots: response.headers.get('x-robots-tag'),
      noindexBody: /noindex/i.test(body),
      canonicalBody: /rel=["']canonical["']/i.test(body),
    };

    const checks = [
      observed.status === item.status,
      !item.route || observed.route === item.route,
      !item.location || observed.location === item.location,
      !item.robots || observed.robots === item.robots,
    ];
    if (item.status === 404) {
      checks.push(observed.noindexBody === true);
      checks.push(observed.canonicalBody === false);
    }
    const pass = checks.every(Boolean);
    if (!pass) failed++;
    results.push({ ...observed, expected: item, pass });
  }
} finally {
  server.close();
  await once(server, 'close');
}

console.log(JSON.stringify({
  status: failed === 0 ? 'PASS' : 'FAIL',
  failed,
  total: results.length,
  results,
}, null, 2));

if (failed) process.exit(1);
