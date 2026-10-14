import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { secrets } from 'base44:runtime';
import { compileSitePreview } from '../../shared/sitePreviewCompiler.js';

// ─────────────────────────────────────────────────────────────────────────────
// vercelDeploy — Deploys the Code Studio content (DynamicPages + CodeBlocks)
// as a static site to Vercel, independent of the Base44 platform.
//
// Invoke: base44.functions.invoke('vercelDeploy', {})
// ─────────────────────────────────────────────────────────────────────────────

function renderSection(section: any): string {
  const p = section.props || {};
  switch (section.type) {
    case 'hero': {
      const bg = p.background_image ? `background-image:url('${p.background_image}');background-size:cover;background-position:center;` : '';
      return `<section style="padding:80px 20px;text-align:center;color:#fff;background:${bg || 'linear-gradient(135deg,#1a1a2e,#16213e)'};border-radius:0;">
        <div style="max-width:800px;margin:0 auto;">
          <h1 style="font-size:2.5rem;margin:0 0 16px;">${p.heading || ''}</h1>
          <p style="font-size:1.2rem;opacity:.9;margin:0 0 24px;">${p.subheading || ''}</p>
          ${p.cta_text ? `<a href="${p.cta_link || '#'}" style="display:inline-block;padding:14px 32px;background:#D4AF37;color:#1a1a1a;text-decoration:none;font-weight:700;border-radius:8px;">${p.cta_text}</a>` : ''}
        </div>
      </section>`;
    }
    case 'text':
      return `<section style="max-width:800px;margin:0 auto;padding:60px 20px;"><h2 style="font-size:1.8rem;margin:0 0 16px;">${p.heading || ''}</h2><div style="font-size:1rem;line-height:1.7;color:#444;">${p.body || ''}</div></section>`;
    case 'gallery': {
      const imgs = (p.images || []).map((url: string) => `<img src="${url}" style="width:100%;border-radius:8px;" />`).join('');
      return `<section style="max-width:1000px;margin:0 auto;padding:60px 20px;"><h2 style="text-align:center;font-size:1.8rem;margin:0 0 24px;">${p.heading || 'Gallery'}</h2><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px;">${imgs}</div></section>`;
    }
    case 'cta':
      return `<section style="padding:60px 20px;text-align:center;background:#D4AF37;color:#1a1a1a;"><h2 style="font-size:2rem;margin:0 0 16px;">${p.heading || ''}</h2><p style="margin:0 0 24px;">${p.body || ''}</p><a href="${p.button_link || '#'}" style="display:inline-block;padding:14px 32px;background:#1a1a1a;color:#fff;text-decoration:none;font-weight:700;border-radius:8px;">${p.button_text || 'Get Started'}</a></section>`;
    case 'faq': {
      const items = (p.items || []).map((item: any) => `<details style="border:1px solid #e4e4e7;border-radius:8px;padding:16px;margin-bottom:8px;"><summary style="font-weight:700;cursor:pointer;">${item.question || ''}</summary><p style="margin:8px 0 0;color:#555;">${item.answer || ''}</p></details>`).join('');
      return `<section style="max-width:800px;margin:0 auto;padding:60px 20px;"><h2 style="font-size:1.8rem;margin:0 0 24px;">${p.heading || 'FAQ'}</h2>${items}</section>`;
    }
    case 'testimonials': {
      const items = (p.items || []).map((item: any) => `<div style="border:1px solid #e4e4e7;border-radius:12px;padding:20px;"><p style="font-style:italic;color:#444;">"${item.quote || ''}"</p><p style="font-weight:700;margin:8px 0 0;">${item.name || ''}</p></div>`).join('');
      return `<section style="max-width:800px;margin:0 auto;padding:60px 20px;"><h2 style="font-size:1.8rem;margin:0 0 24px;">${p.heading || 'Testimonials'}</h2><div style="display:grid;gap:16px;">${items}</div></section>`;
    }
    case 'html':
      return `<section style="max-width:1000px;margin:0 auto;padding:60px 20px;">${p.html || p.content || ''}</section>`;
    case 'form':
      return `<section style="max-width:600px;margin:0 auto;padding:60px 20px;"><h2 style="font-size:1.8rem;margin:0 0 24px;">${p.heading || 'Contact'}</h2><form style="display:grid;gap:12px;"><input type="text" placeholder="Name" style="padding:12px;border:1px solid #e4e4e7;border-radius:8px;" /><input type="email" placeholder="Email" style="padding:12px;border:1px solid #e4e4e7;border-radius:8px;" /><textarea placeholder="Message" rows="4" style="padding:12px;border:1px solid #e4e4e7;border-radius:8px;"></textarea><button type="submit" style="padding:14px;background:#D4AF37;color:#1a1a1a;border:0;border-radius:8px;font-weight:700;">${p.button_text || 'Submit'}</button></form></section>`;
    case 'spacer':
      return `<div style="height:${p.height || 40}px;"></div>`;
    default:
      return '';
  }
}

function generatePageHtml(page: any, cssBlocks: string, jsBlocks: string): string {
  const sections = (page.sections || []).map(renderSection).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${page.seo_title || page.title}</title>
<meta name="description" content="${(page.seo_description || '').replace(/"/g, '&quot;')}">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a;background:#fff;}
img{max-width:100%;}
a{color:inherit;}
${cssBlocks}
</style>
</head>
<body>
${sections}
<script>${jsBlocks}</script>
</body>
</html>`;
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const token = secrets.get('VERCEL_API_TOKEN');
    const projectName = secrets.get('VERCEL_PROJECT_NAME') || 'epoxy-garage-code-studio';
    if (!token) return Response.json({ error: 'VERCEL_API_TOKEN secret is not set' }, { status: 500 });

    // A mass-launch request must never invoke the legacy global Code Studio
    // production deploy. Build ONE site from ONE approved template and location.
    const payload = await req.clone().json().catch(() => ({}));
    if (payload.mode === 'site_preview') {
      if (payload.target || payload.publish === true || payload.production === true) {
        return Response.json({ error: 'Site preview mode cannot publish' }, { status: 400 });
      }
      let compiled;
      try {
        compiled = compileSitePreview(payload);
      } catch (error) {
        return Response.json({ error: String(error.message || error) }, { status: 400 });
      }
      // A new Vercel project's FIRST deployment may be forced to production.
      // Use only the already verified Digital Dominance project and team.
      // Project/team IDs are non-secret stable provider resource identifiers.
      const previewProjectId = secrets.get('VERCEL_SITE_PREVIEW_PROJECT_ID') ||
        'prj_mgySytKyeK5i9DwnQDRGHVjyenrz';
      const previewTeamId = secrets.get('VERCEL_TEAM_ID') ||
        'team_aFdds8lsbHMwe2ip4aQdbQ3d';
      const scope = '?teamId=' + encodeURIComponent(previewTeamId);
      const authHeaders = { Authorization: 'Bearer ' + token };
      const [projectRes, historyRes] = await Promise.all([
        fetch('https://api.vercel.com/v9/projects/' + encodeURIComponent(previewProjectId) + scope,
          { headers: authHeaders }),
        fetch('https://api.vercel.com/v6/deployments' + scope +
          '&projectId=' + encodeURIComponent(previewProjectId) + '&limit=10&target=production',
          { headers: authHeaders }),
      ]);
      if (!projectRes.ok || !historyRes.ok) {
        return Response.json({ success: false, release_ready: false,
          error: 'Preview project could not be verified in the approved Vercel team' },
          { status: 503 });
      }
      const previewProject = await projectRes.json();
      const history = await historyRes.json();
      if (previewProject?.id !== previewProjectId ||
          !Array.isArray(history.deployments) ||
          !history.deployments.some((item: any) =>
            item.target === 'production' && item.readyState === 'READY')) {
        return Response.json({ success: false, release_ready: false,
          error: 'Existing READY production baseline required to prevent first-deploy auto-promotion' },
          { status: 409 });
      }
      const files = [
        { file: 'index.html', data: compiled.html },
        { file: 'robots.txt', data: 'User-agent: *\nDisallow: /\n' },
        {
          file: 'vercel.json',
          data: JSON.stringify({
            framework: null,
            buildCommand: 'echo static-preview-ready',
            installCommand: '',
            outputDirectory: '.',
            headers: [{
              source: '/(.*)',
              headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
            }],
          }),
        },
      ];
      const deployRes = await fetch('https://api.vercel.com/v13/deployments' + scope, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: previewProject.name,
          project: previewProjectId,
          files,
          projectSettings: {
            framework: null, buildCommand: 'echo static-preview-ready',
            installCommand: '', outputDirectory: '.',
          },
          // Existing project and omitted target ensure isolated PREVIEW.
          meta: {
            dd_site_id: compiled.manifest.site_id,
            dd_template_key: compiled.manifest.template_key,
            dd_location: compiled.manifest.city + ', ' + compiled.manifest.state,
            dd_release_state: 'PREVIEW_ONLY',
          },
        }),
      });
      if (!deployRes.ok) {
        console.error('Site preview Vercel API request failed:', deployRes.status);
        return Response.json({
          success: false, preview_only: true, release_ready: false,
          error: 'Vercel rejected preview deployment',
          upstream_status: deployRes.status,
        }, { status: 502 });
      }
      const deployment = await deployRes.json();
      if (deployment.target === 'production') {
        return Response.json({ success: false, release_ready: false,
          error: 'Vercel unexpectedly classified an isolated preview as production' },
          { status: 409 });
      }
      const host = typeof deployment.url === 'string' ? deployment.url : '';
      if (typeof deployment.id !== 'string' || !deployment.id.startsWith('dpl_') ||
          !/^[a-z0-9-]+\.vercel\.app$/i.test(host)) {
        return Response.json({
          success: false, preview_only: true, release_ready: false,
          error: 'Vercel did not provide an immutable deployment receipt',
        }, { status: 502 });
      }
      return Response.json({
        success: true,
        status: 'accepted_pending_independent_validation',
        preview_only: true,
        release_ready: false,
        deployment_id: deployment.id,
        url: 'https://' + host,
        site_id: compiled.manifest.site_id,
        template_key: compiled.manifest.template_key,
        design_key: compiled.manifest.design_key,
        location: compiled.manifest.city + ', ' + compiled.manifest.state,
        lead_capture: 'NOT_CONNECTED',
      });
    }

    const svc = base44.asServiceRole;
    const pages = await svc.entities.DynamicPage.filter({ status: 'published', is_public: true });
    const codeBlocks = await svc.entities.CodeBlock.filter({ active: true });

    const globalCss = codeBlocks.filter((b: any) => b.type === 'css' && b.scope === 'global').map((b: any) => b.content).join('\n');
    const globalJs = codeBlocks.filter((b: any) => b.type === 'js' && b.scope === 'global').map((b: any) => b.content).join('\n');

    const files: any[] = [];

    // Generate index.html — landing on the first published page or a directory listing
    if (pages.length > 0) {
      files.push({ file: 'index.html', data: generatePageHtml(pages[0], globalCss, globalJs) });
    } else {
      files.push({ file: 'index.html', data: '<!DOCTYPE html><html><head><title>Code Studio</title></head><body><h1>No published pages yet</h1></body></html>' });
    }

    // Generate each published page
    for (const page of pages) {
      const pageCss = codeBlocks.filter((b: any) => b.type === 'css' && b.scope === 'page' && b.page_path === `/p/${page.slug}`).map((b: any) => b.content).join('\n');
      const pageJs = codeBlocks.filter((b: any) => b.type === 'js' && b.scope === 'page' && b.page_path === `/p/${page.slug}`).map((b: any) => b.content).join('\n');
      files.push({ file: `p/${page.slug}.html`, data: generatePageHtml(page, globalCss + '\n' + pageCss, globalJs + '\n' + pageJs) });
    }

    // Add vercel.json for routing
    files.push({
      file: 'vercel.json',
      data: JSON.stringify({ rewrites: pages.map((p: any) => ({ source: `/p/${p.slug}`, destination: `/p/${p.slug}.html` })) }, null, 2)
    });

    // Create the deployment
    const deployRes = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
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
      return Response.json({ error: `Vercel API error: ${deployRes.status}`, details: errText }, { status: 502 });
    }

    const deployment = await deployRes.json();
    return Response.json({
      success: true,
      deployment_id: deployment.id,
      url: deployment.url ? `https://${deployment.url}` : null,
      inspect_url: deployment.inspectorUrl || null,
      pages_deployed: pages.length,
      files_count: files.length,
    });
  } catch (error) {
    console.error('vercelDeploy error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}