import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { secrets } from 'base44:runtime';
import { engine } from '../../shared/cloudBrowser.ts';

// ─────────────────────────────────────────────────────────────────────────────
// siteDirectEditor — UNIFIED DIRECT SITE EDITING. Zero limitations.
//
// The agent's single entry point for pushing LIVE changes to ANY site:
//   - Self-deployed sites (GitHub repo → Vercel auto-deploy)
//   - External CMS admin panels (Shopify, WordPress, Wix, custom) via cloud browser
//   - Direct Vercel deploys of arbitrary files
//   - Code Studio page updates pushed live
//
// Invoke: base44.functions.invoke('siteDirectEditor', { action, ... })
// ─────────────────────────────────────────────────────────────────────────────

const GH = (token: string) => ({
  Authorization: `token ${token}`,
  Accept: 'application/vnd.github.v3+json',
  'Content-Type': 'application/json',
  'User-Agent': 'epoxy-site-editor',
});

async function ghGetFileSha(token: string, repo: string, path: string, branch: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`, {
      headers: GH(token),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.sha || null;
  } catch {
    return null;
  }
}

async function ghPutFile(token: string, repo: string, path: string, content: string, branch: string, sha: string | null, message: string): Promise<any> {
  const body: any = { message: message || `edit: ${path}`, content: btoa(unescape(encodeURIComponent(content))), branch };
  if (sha) body.sha = sha;
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: GH(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub PUT ${res.status} for ${path}: ${err}`);
  }
  return res.json();
}

async function ghDeleteFile(token: string, repo: string, path: string, branch: string, message: string): Promise<any> {
  const sha = await ghGetFileSha(token, repo, path, branch);
  if (!sha) throw new Error(`File not found: ${path}`);
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: 'DELETE',
    headers: GH(token),
    body: JSON.stringify({ message: message || `delete: ${path}`, sha, branch }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub DELETE ${res.status} for ${path}: ${err}`);
  }
  return res.json();
}

async function ghGetTree(token: string, repo: string, branch: string): Promise<string[]> {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1`, {
      headers: GH(token),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.tree || []).filter((t: any) => t.type === 'blob').map((t: any) => t.path);
  } catch {
    return [];
  }
}

async function vercelDeployFiles(token: string, projectName: string, files: any[]): Promise<any> {
  const res = await fetch('https://api.vercel.com/v13/deployments', {
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
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Vercel deploy ${res.status}: ${err}`);
  }
  return res.json();
}

// Cloud browser — drive an external CMS admin panel step by step
async function browserEdit(steps: any[]): Promise<any[]> {
  const sess = await engine('/sessions', 'POST', { usePool: true });
  const sid = sess?.sessionId;
  if (!sid) throw new Error('cloud browser engine returned no sessionId');
  const results: any[] = [];
  try {
    for (const step of steps) {
      const { action_type, value, selector, options } = step;
      let payload: any = { action_type, value };
      if (selector) payload.selector = selector;
      if (options) payload.options = options;
      const r = await engine(`/sessions/${sid}/execute`, 'POST', payload).catch((e: any) => ({ error: e.message }));
      results.push({ step: action_type, value, result: r?.data || r?.screenshot || r?.error || 'ok' });
    }
  } finally {
    await engine(`/sessions/${sid}`, 'DELETE').catch(() => {});
  }
  return results;
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json();
    const { action } = body;
    const svc = base44.asServiceRole;

    switch (action) {
      // ── EDIT A FILE IN THE GITHUB REPO (auto-deploys to Vercel) ──
      case 'edit_file': {
        const token = secrets.get('GITHUB_TOKEN');
        const repo = secrets.get('GITHUB_REPO');
        if (!token || !repo) return Response.json({ error: 'GITHUB_TOKEN / GITHUB_REPO secrets not set' }, { status: 500 });
        const { path, content, commit_message, branch } = body;
        if (!path || content === undefined) return Response.json({ error: 'path and content required' }, { status: 400 });
        const br = branch || 'main';
        const sha = await ghGetFileSha(token, repo, path, br);
        const result = await ghPutFile(token, repo, path, content, br, sha, commit_message);
        return Response.json({
          success: true,
          path,
          commit: result.commit?.sha || result.content?.sha,
          message: `File ${sha ? 'updated' : 'created'}: ${path}`,
          auto_deploy: 'Vercel will auto-deploy from this commit if the repo is connected to a Vercel project.',
        });
      }

      // ── DELETE A FILE FROM THE GITHUB REPO ──
      case 'delete_file': {
        const token = secrets.get('GITHUB_TOKEN');
        const repo = secrets.get('GITHUB_REPO');
        if (!token || !repo) return Response.json({ error: 'GITHUB_TOKEN / GITHUB_REPO secrets not set' }, { status: 500 });
        const { path, commit_message, branch } = body;
        if (!path) return Response.json({ error: 'path required' }, { status: 400 });
        const br = branch || 'main';
        const result = await ghDeleteFile(token, repo, path, br, commit_message);
        return Response.json({ success: true, path, commit: result.commit?.sha, message: `File deleted: ${path}` });
      }

      // ── LIST ALL FILES IN THE REPO ──
      case 'list_files': {
        const token = secrets.get('GITHUB_TOKEN');
        const repo = secrets.get('GITHUB_REPO');
        if (!token || !repo) return Response.json({ error: 'GITHUB_TOKEN / GITHUB_REPO secrets not set' }, { status: 500 });
        const { branch } = body;
        const files = await ghGetTree(token, repo, branch || 'main');
        return Response.json({ success: true, repo, files, count: files.length });
      }

      // ── DIRECT VERCEL DEPLOY OF ARBITRARY FILES ──
      case 'deploy': {
        const token = secrets.get('VERCEL_API_TOKEN');
        const projectName = secrets.get('VERCEL_PROJECT_NAME') || 'epoxy-garage-code-studio';
        if (!token) return Response.json({ error: 'VERCEL_API_TOKEN secret not set' }, { status: 500 });
        const { files, deploy_project_name } = body;
        if (!files || !Array.isArray(files) || files.length === 0) {
          return Response.json({ error: 'files array required (each: { file, data })' }, { status: 400 });
        }
        const deployment = await vercelDeployFiles(token, deploy_project_name || projectName, files);
        return Response.json({
          success: true,
          deployment_id: deployment.id,
          url: deployment.url ? `https://${deployment.url}` : null,
          inspect_url: deployment.inspectorUrl || null,
          files_count: files.length,
        });
      }

      // ── DRIVE AN EXTERNAL CMS ADMIN PANEL VIA CLOUD BROWSER ──
      // steps: [{ action_type, value, selector, options }]
      // action_type: 'goto' | 'click' | 'type' | 'scroll' | 'wait' | 'evaluate' | 'screenshot' | 'ai_extract'
      case 'browser_edit': {
        const { steps } = body;
        if (!steps || !Array.isArray(steps) || steps.length === 0) {
          return Response.json({ error: 'steps array required. Each: { action_type, value?, selector?, options? }. Types: goto, click, type, scroll, wait, evaluate, screenshot, ai_extract' }, { status: 400 });
        }
        const results = await browserEdit(steps);
        return Response.json({ success: true, steps_executed: results.length, results });
      }

      // ── UPDATE A CODE STUDIO PAGE AND PUSH IT LIVE (GitHub + Vercel) ──
      case 'update_page': {
        const token = secrets.get('GITHUB_TOKEN');
        const repo = secrets.get('GITHUB_REPO');
        const vercelToken = secrets.get('VERCEL_API_TOKEN');
        const projectName = secrets.get('VERCEL_PROJECT_NAME') || 'epoxy-garage-code-studio';
        const { page_id, slug, title, sections, seo_title, seo_description, is_public, status, push_live } = body;

        if (!page_id && !slug) return Response.json({ error: 'page_id or slug required' }, { status: 400 });

        // Find the page
        let page;
        if (page_id) {
          page = await svc.entities.DynamicPage.get(page_id);
        } else {
          const found = await svc.entities.DynamicPage.filter({ slug });
          page = found[0];
        }
        if (!page) return Response.json({ error: 'DynamicPage not found' }, { status: 404 });

        // Update fields
        const updates: any = {};
        if (title !== undefined) updates.title = title;
        if (sections !== undefined) updates.sections = sections;
        if (seo_title !== undefined) updates.seo_title = seo_title;
        if (seo_description !== undefined) updates.seo_description = seo_description;
        if (is_public !== undefined) updates.is_public = is_public;
        if (status !== undefined) updates.status = status;

        const updated = Object.keys(updates).length > 0
          ? await svc.entities.DynamicPage.update(page.id, updates)
          : page;

        // Push to GitHub + Vercel if requested
        let pushResult = null;
        if (push_live !== false && token && repo) {
          const branch = 'main';
          const path = `pages/${updated.slug}.json`;
          const content = JSON.stringify(updated, null, 2);
          const sha = await ghGetFileSha(token, repo, path, branch);
          await ghPutFile(token, repo, path, content, branch, sha, `update page: ${updated.slug}`);
          pushResult = { github: true, path };

          if (vercelToken) {
            // Also do a direct Vercel deploy of all published pages
            try {
              const allPages = await svc.entities.DynamicPage.filter({ status: 'published', is_public: true });
              const codeBlocks = await svc.entities.CodeBlock.filter({ active: true });
              const globalCss = codeBlocks.filter((b: any) => b.type === 'css' && b.scope === 'global').map((b: any) => b.content).join('\n');
              const globalJs = codeBlocks.filter((b: any) => b.type === 'js' && b.scope === 'global').map((b: any) => b.content).join('\n');
              const files: any[] = [];
              for (const p of allPages) {
                const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${p.seo_title || p.title}</title><meta name="description" content="${(p.seo_description || '').replace(/"/g, '&quot;')}"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:sans-serif}${globalCss}</style></head><body>${(p.sections || []).map((s: any) => `<section>${JSON.stringify(s.props || {})}</section>`).join('')}<script>${globalJs}</script></body></html>`;
                files.push({ file: `p/${p.slug}.html`, data: html });
              }
              const deployment = await vercelDeployFiles(vercelToken, projectName, files);
              pushResult.vercel = { url: deployment.url ? `https://${deployment.url}` : null, id: deployment.id };
            } catch (e: any) {
              pushResult.vercel_error = e.message;
            }
          }
        }

        return Response.json({ success: true, page: updated, push_result: pushResult });
      }

      // ── GET CURRENT STATE OF A SITE ──
      case 'get_site_state': {
        const { project_name } = body;
        const [pages, codeBlocks] = await Promise.all([
          svc.entities.DynamicPage.filter({ status: 'published' }).catch(() => []),
          svc.entities.CodeBlock.filter({ active: true }).catch(() => []),
        ]);

        let vercelState = null;
        const vercelToken = secrets.get('VERCEL_API_TOKEN');
        if (vercelToken && project_name) {
          try {
            const res = await fetch(`https://api.vercel.com/v6/deployments?app=${project_name}&limit=1&target=production`, {
              headers: { Authorization: `Bearer ${vercelToken}` },
              signal: AbortSignal.timeout(10000),
            });
            if (res.ok) {
              const data = await res.json();
              vercelState = (data.deployments || [])[0] || null;
            }
          } catch {}
        }

        let repoFiles: string[] = [];
        const ghToken = secrets.get('GITHUB_TOKEN');
        const repo = secrets.get('GITHUB_REPO');
        if (ghToken && repo) {
          repoFiles = await ghGetTree(ghToken, repo, 'main');
        }

        return Response.json({
          success: true,
          pages: pages.map((p: any) => ({ id: p.id, slug: p.slug, title: p.title, status: p.status, is_public: p.is_public })),
          code_blocks: codeBlocks.map((b: any) => ({ id: b.id, name: b.name, type: b.type, scope: b.scope, active: b.active })),
          repo_files: repoFiles,
          repo,
          latest_vercel_deployment: vercelState ? { id: vercelState.id, url: vercelState.url, state: vercelState.state, created: vercelState.created } : null,
        });
      }

      // ── LIST ALL SITES THE SYSTEM CONTROLS ──
      case 'list_sites': {
        const templates = await svc.entities.WebsiteTemplate.list().catch(() => []);
        const domains = await svc.entities.DomainStrategy.filter({ status: 'live' }).catch(() => []);
        return Response.json({
          success: true,
          site_templates: templates.map((t: any) => ({ id: t.id, name: t.name, domain: t.domain, status: t.status, live_url: t.live_url })),
          live_domains: domains.map((d: any) => ({ id: d.id, domain: d.domain, live_url: d.live_url, niche: d.niche })),
          total: templates.length + domains.length,
        });
      }

      // ── CAPABILITY MANIFEST — so the agent knows exactly what it can do ──
      case 'capabilities': {
        return Response.json({
          success: true,
          capabilities: {
            direct_file_edit: 'Edit/create/delete any file in the GitHub repo. Vercel auto-deploys on commit.',
            direct_vercel_deploy: 'Deploy arbitrary files directly to Vercel, bypassing GitHub.',
            external_cms_edit: 'Drive any external admin panel (Shopify, WordPress, Wix, custom CMS) via the cloud browser — navigate, click, type, scroll, wait, evaluate JS, screenshot, extract content.',
            code_studio_live: 'Update any DynamicPage record and push it live to GitHub + Vercel in one call.',
            site_state: 'Inspect current pages, code blocks, repo files, and latest Vercel deployment for any site.',
            site_list: 'List all site templates and live domains the system controls.',
          },
          secrets_available: {
            GITHUB_TOKEN: !!secrets.get('GITHUB_TOKEN'),
            GITHUB_REPO: !!secrets.get('GITHUB_REPO'),
            VERCEL_API_TOKEN: !!secrets.get('VERCEL_API_TOKEN'),
            VERCEL_PROJECT_NAME: !!secrets.get('VERCEL_PROJECT_NAME'),
            CLOUD_BROWSER_ENGINE_URL: !!secrets.get('CLOUD_BROWSER_ENGINE_URL'),
            ENGINE_API_KEY: !!secrets.get('ENGINE_API_KEY'),
          },
          message: 'These operations are implemented. Secret presence is configuration only, not verified provider authorization. GitHub changes target the configured external repository; they do not edit this hosted Base44 app. Report live success only after the relevant write and deployment have succeeded.',
        });
      }

      default:
        return Response.json({
          error: `Unknown action: ${action}`,
          available_actions: ['edit_file', 'delete_file', 'list_files', 'deploy', 'browser_edit', 'update_page', 'get_site_state', 'list_sites', 'capabilities'],
        }, { status: 400 });
    }
  } catch (error) {
    console.error('siteDirectEditor error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}