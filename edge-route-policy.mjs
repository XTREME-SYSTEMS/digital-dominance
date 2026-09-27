import manifest from './edge-route-manifest.mjs';

const exactPaths = new Set(manifest.exactPaths);
const passThroughPrefixes = manifest.passThroughPrefixes || [];
const stateMap = manifest.legacyStateMap || {};

function normalizePathname(pathname) {
  if (!pathname) return '/';
  let decoded = pathname;
  try { decoded = decodeURIComponent(pathname); } catch {}
  if (!decoded.startsWith('/')) decoded = '/' + decoded;
  return decoded !== '/' ? decoded.replace(/\/+$/, '') : '/';
}

function matchesPrefix(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(prefix + '/');
}

function isStaticAssetOrPlatformPath(pathname) {
  if (pathname === '/favicon.ico' || pathname === '/robots.txt' || pathname === '/sitemap.xml') return true;
  if (pathname.startsWith('/assets/') || pathname.startsWith('/_') || pathname.startsWith('/.well-known/')) return true;
  return /\.[a-z0-9]{2,10}$/i.test(pathname);
}

function legacyCanonicalTarget(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length !== 2) return null;
  const stateName = parts[0].toLowerCase();
  const citySlug = parts[1].toLowerCase();
  const code = stateMap[stateName];
  if (!code) return null;
  const target = `/${code}/${citySlug}`;
  return exactPaths.has(target) ? target : null;
}

export function classifyRequestPath(pathname) {
  const path = normalizePathname(pathname);

  if (isStaticAssetOrPlatformPath(path)) {
    return { action: 'next', path, reason: 'asset_or_platform' };
  }

  const legacyTarget = legacyCanonicalTarget(path);
  if (legacyTarget) {
    return { action: 'redirect', path, location: legacyTarget, status: 308, reason: 'legacy_state_alias' };
  }

  if (exactPaths.has(path)) {
    return { action: 'next', path, reason: 'exact_route' };
  }

  if (passThroughPrefixes.some((prefix) => matchesPrefix(path, prefix))) {
    return { action: 'next', path, reason: 'internal_or_session_route' };
  }

  return { action: 'not_found', path, status: 404, reason: 'route_not_in_manifest' };
}
function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function renderNotFoundHtml(pathname) {
  const siteName = escapeHtml(manifest.siteName || 'Digital Dominance Site');
  const path = escapeHtml(normalizePathname(pathname));
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Page Not Found | ${siteName}</title>
<style>
body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0;background:#fff;color:#111}
main{max-width:760px;margin:12vh auto;padding:32px}
h1{font-size:clamp(2rem,6vw,4rem);margin:0 0 12px}
p{line-height:1.6}
a{color:#111;font-weight:700}
code{background:#f4f4f5;padding:2px 6px;border-radius:6px}
</style>
</head>
<body><main><h1>Page not found</h1><p>The requested page <code>${path}</code> does not exist.</p><p><a href="/">Return to ${siteName}</a></p></main></body>
</html>`;
}

export { manifest };
