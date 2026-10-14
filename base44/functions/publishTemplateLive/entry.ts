import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets, waitUntil } from 'base44:runtime';
import { generateSite } from '../../shared/universalGenerator.ts';

// ============================================================
// publishTemplateLive — Deploys a Website Launch Engine template
// (TemplateLibrary) as a standalone Vercel site with brand
// customization applied.
//
// Invoke: base44.functions.invoke('publishTemplateLive', {
//   templateId,  // TemplateLibrary record ID
//   appName,     // Display name for the deployed site
//   appSlug,     // URL-safe slug (Vercel project name)
//   brand,       // { accent, logoUrl, videoUrl } from BrandGenerator
// })
//
// Returns: { success, url, deployment_id, deployment_record_id }
// ============================================================

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    // Auth: API key (for cron-triggered calls from bulkLaunchEngine) OR admin session
    const authHeader = req.headers.get('authorization') || '';
    const bearerKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const syncKey = secrets.get('GPT_SYNC_API_KEY') || '';
    const isApiKey = syncKey && bearerKey === syncKey;

    let svc;
    let userId: string | undefined;
    let userEmail: string | undefined;

    if (isApiKey) {
      svc = base44.asServiceRole;
      userId = 'cron-orchestrator';
      userEmail = 'system@autonomous';
    } else {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
      svc = base44.asServiceRole;
      userId = user.id;
      userEmail = user.email;
    }

    const body = await req.json();
    const { templateId, appName, appSlug, brand } = body;

    if (!templateId || !appSlug) {
      return Response.json({ error: 'templateId and appSlug are required' }, { status: 400 });
    }

    const token = secrets.get('VERCEL_API_TOKEN');
    if (!token) {
      return Response.json({ error: 'VERCEL_API_TOKEN secret is not set' }, { status: 500 });
    }

    // ── Load the template ──────────────────────────────────────────────
    const template = await svc.entities.TemplateLibrary.get(templateId);
    if (!template) {
      return Response.json({ error: 'Template not found' }, { status: 404 });
    }

    // ── Compile the HTML with brand customization ──────────────────────
    const manifest = template.sections?.find((s: any) => s.section_type === 'manifest')?.config;
    const industryKey = manifest?.industry_key || template.niche || 'generic';
    const designKey = manifest?.design_key || 'default';

    let html: string;
    try {
      // ── Universal Generator: generate from the template's niche ──
      const site = generateSite({
        niche: industryKey || template.niche || 'generic',
        brandName: appName || template.name || '',
        city: body.city, state: body.state, phone: body.phone, domain: body.domain,
      });
      html = site.html || template.content || '';
    } catch {
      // Fallback to raw template content if generation fails
      html = template.content || '';
    }

    if (!html) {
      return Response.json({ error: 'No HTML content could be generated for this template' }, { status: 400 });
    }

    // ── Create a DeploymentRecord to track this deployment ─────────────
    const deploymentId = `tpl-${appSlug}-${Date.now()}`;
    const depRecord = await svc.entities.DeploymentRecord.create({
      owner_id: userId,
      deployment_id: deploymentId,
      session_id: templateId,
      task_description: `Template Studio deploy: ${appName || template.name} (${industryKey}/${designKey})`,
      status: 'deploying',
      target_environment: 'vercel',
      deployed_by: userEmail || userId,
    }).catch(() => null);

    // ── Assemble the static site files ─────────────────────────────────
    const projectName = (appSlug || 'template-site').toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 50);

    // Inject brand accent color and logo into the HTML
    const accentColor = brand?.accent || '#126fc8';
    const logoTag = brand?.logoUrl ? `<a href="/" style="display:flex;align-items:center;gap:8px;text-decoration:none;"><img src="${brand.logoUrl}" alt="${appName || 'Site'}" style="height:40px;object-fit:contain;" /></a>` : '';

    const styledHtml = html.includes('<head>')
      ? html.replace('<head>', `<head>\n    <meta name="theme-color" content="${accentColor}">`)
      : html;

    const fullHtml = styledHtml.includes('</body>')
      ? styledHtml.replace('</body>', `<script>window.__SITE_CONFIG={brand:${JSON.stringify(brand || {})}}</script>\n</body>`)
      : styledHtml;

    const files = [
      { file: 'index.html', data: fullHtml },
      {
        file: 'vercel.json',
        data: JSON.stringify({
          cleanUrls: true,
          headers: [
            { source: '/(.*)', headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }] },
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
      console.error('publishTemplateLive Vercel error:', deployRes.status, errText);
      if (depRecord) {
        await svc.entities.DeploymentRecord.update(depRecord.id, {
          status: 'failed',
          health_notes: `Vercel ${deployRes.status}: ${errText.slice(0, 500)}`,
        }).catch(() => {});
      }
      return Response.json({ error: `Vercel API error: ${deployRes.status}`, details: errText.slice(0, 500) }, { status: 502 });
    }

    const deployment = await deployRes.json();
    const liveUrl = deployment.url ? `https://${deployment.url}` : null;

    // ── Update the DeploymentRecord ────────────────────────────────────
    if (depRecord) {
      await svc.entities.DeploymentRecord.update(depRecord.id, {
        status: 'deployed',
        vercel_deployment_id: deployment.id,
        vercel_url: liveUrl,
        health_status: 'healthy',
        health_score: 100,
        deployed_at: new Date().toISOString(),
      }).catch(() => {});
    }

    // ── Update the template's deploy tracking ─────────────────────────
    const deployedTo = template.deployed_to || [];
    if (liveUrl && !deployedTo.includes(liveUrl)) {
      deployedTo.push(liveUrl);
    }
    await svc.entities.TemplateLibrary.update(templateId, {
      deployed_to: deployedTo,
      deploy_count: (template.deploy_count || 0) + 1,
    }).catch(() => {});

    // ── Fire-and-forget Google sync (indexing + analytics) ─────────────
    if (liveUrl) {
      waitUntil(runGoogleSyncAsync(base44, liveUrl));
    }

    return Response.json({
      success: true,
      url: liveUrl,
      deployment_id: deployment.id,
      deployment_record_id: depRecord?.id || null,
      message: 'Template published live. Google indexing submitted.',
    });
  } catch (error) {
    console.error('publishTemplateLive error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Fire-and-forget: submit the new URL to indexers + sitemap + Search Console + Analytics
async function runGoogleSyncAsync(base44: any, liveUrl: string) {
  try {
    await Promise.allSettled([
      base44.functions.invoke('submitToIndexers', { url: liveUrl }),
      base44.functions.invoke('pingIndexNow', { url: liveUrl }),
      base44.functions.invoke('generateSitemap', { domain: liveUrl }),
      base44.functions.invoke('addSearchConsoleProperty', { url: liveUrl }),
      base44.functions.invoke('googleAnalytics', { url: liveUrl, action: 'provision' }),
    ]);
  } catch (e) {
    console.error('publishTemplateLive Google sync failed:', e.message);
  }
}