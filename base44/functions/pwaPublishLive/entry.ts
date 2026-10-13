import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets, waitUntil } from 'base44:runtime';

// ============================================================
// pwaPublishLive — Deploys a customized PWA App Factory build
// to Vercel as a standalone static PWA site.
//
// Invoke: base44.functions.invoke('pwaPublishLive', {
//   buildId,       // AppBuild record ID to update
//   appName,       // PWA display name
//   appSlug,       // URL-safe slug (used as Vercel project name)
//   html,          // Full standalone index.html content (rendered by frontend)
//   manifest,      // PWA manifest object
//   navConfig,     // bottom nav config array
// })
//
// Returns: { success, url, deployment_id, build_id }
// ============================================================

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json();
    const { buildId, appName, appSlug, html, manifest, navConfig } = body;

    if (!html || !appSlug) {
      return Response.json({ error: 'html and appSlug are required' }, { status: 400 });
    }

    const token = secrets.get('VERCEL_API_TOKEN');
    if (!token) {
      return Response.json({ error: 'VERCEL_API_TOKEN secret is not set' }, { status: 500 });
    }

    const svc = base44.asServiceRole;

    // Mark build as publishing
    if (buildId) {
      await svc.entities.AppBuild.update(buildId, { status: 'building' }).catch(() => {});
    }

    // ── Assemble the static PWA file set ──────────────────────────────
    const projectName = (appSlug || 'pwa-app').toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 50);

    const manifestJson = JSON.stringify({
      name: appName || 'PWA App',
      short_name: (appName || 'PWA').slice(0, 12),
      theme_color: manifest?.theme_color || '#0059ff',
      background_color: manifest?.background_color || '#ffffff',
      display: manifest?.display || 'standalone',
      orientation: manifest?.orientation || 'portrait',
      start_url: '/',
      icons: [],
    }, null, 2);

    // Minimal service worker for offline PWA support
    const swJs = `
const CACHE = 'pwa-${appSlug}-${Date.now()}';
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      try {
        const net = await fetch(e.request);
        if (e.request.method === 'GET' && net.ok) cache.put(e.request, net.clone());
        return net;
      } catch {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        if (e.request.mode === 'navigate') return cache.match('/index.html');
        throw new Error('offline');
      }
    })
  );
});
`.trim();

    // Register the service worker + manifest in the HTML head
    const fullHtml = html.includes('<head>')
      ? html.replace('<head>', `<head>\n    <link rel="manifest" href="/manifest.json">\n    <meta name="theme-color" content="${manifest?.theme_color || '#0059ff'}">\n    <script>navigator.serviceWorker&&navigator.serviceWorker.register('/sw.js')</script>`)
      : html;

    const files = [
      { file: 'index.html', data: fullHtml },
      { file: 'manifest.json', data: manifestJson },
      { file: 'sw.js', data: swJs },
      {
        file: 'vercel.json',
        data: JSON.stringify({
          cleanUrls: true,
          headers: [
            { source: '/(.*)', headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }] },
            { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }] },
          ],
        }, null, 2),
      },
    ];

    // ── Deploy to Vercel ───────────────────────────────────────────────
    const deployRes = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: projectName,
        files,
        projectSettings: { framework: null, buildCommand: null, outputDirectory: '.' },
        target: 'production',
      }),
    });

    if (!deployRes.ok) {
      const errText = await deployRes.text();
      console.error('pwaPublishLive Vercel error:', deployRes.status, errText);
      if (buildId) {
        await svc.entities.AppBuild.update(buildId, { status: 'failed', build_log: `Vercel ${deployRes.status}: ${errText.slice(0, 500)}` }).catch(() => {});
      }
      return Response.json({ error: `Vercel API error: ${deployRes.status}`, details: errText.slice(0, 500) }, { status: 502 });
    }

    const deployment = await deployRes.json();
    const liveUrl = deployment.url ? `https://${deployment.url}` : null;

    // ── Update the AppBuild record ─────────────────────────────────────
    if (buildId) {
      await svc.entities.AppBuild.update(buildId, {
        status: 'published',
        published_url: liveUrl,
        build_log: `Deployed ${new Date().toISOString()} — deployment ${deployment.id}`,
        manifest: manifest || undefined,
        nav_config: navConfig || undefined,
      }).catch(() => {});
    }

    // ── Fire-and-forget Google sync (indexing) ─────────────────────────
    if (liveUrl) {
      waitUntil(runGoogleSyncAsync(base44, liveUrl));
    }

    return Response.json({
      success: true,
      url: liveUrl,
      deployment_id: deployment.id,
      build_id: buildId || null,
      message: 'PWA published live. Google indexing submitted.',
    });
  } catch (error) {
    console.error('pwaPublishLive error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Fire-and-forget: submit the new URL to indexers + sitemap + Search Console
async function runGoogleSyncAsync(base44: any, liveUrl: string) {
  try {
    await Promise.allSettled([
      base44.functions.invoke('submitToIndexers', { url: liveUrl }),
      base44.functions.invoke('pingIndexNow', { url: liveUrl }),
      base44.functions.invoke('generateSitemap', { domain: liveUrl }),
      base44.functions.invoke('addSearchConsoleProperty', { url: liveUrl }),
    ]);
  } catch (e) {
    console.error('pwaPublishLive Google sync failed:', e.message);
  }
}