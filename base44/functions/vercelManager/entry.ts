import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { secrets } from 'base44:runtime';

// ════════════════════════════════════════════════════════════════
// vercelManager — Full Vercel API wrapper for project management,
// deployments, environment variables, domains, and DNS records.
//
// Auth: Vercel API token via Bearer header.
// Invoke: base44.functions.invoke('vercelManager', { action, ... })
// ════════════════════════════════════════════════════════════════

const VERCEL_BASE = 'https://api.vercel.com';

async function vercelFetch(path: string, method: string, token: string, body?: any, teamId?: string): Promise<any> {
  const sep = path.includes('?') ? '&' : '?';
  const fullPath = teamId ? `${path}${sep}teamId=${teamId}` : path;
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  const opts: RequestInit = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${VERCEL_BASE}${fullPath}`, opts);
  const text = await res.text();
  let parsed: any = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
  if (!res.ok) {
    return { _error: true, status: res.status, body: parsed };
  }
  return parsed;
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const token = secrets.get('VERCEL_API_TOKEN');
    if (!token) return Response.json({ error: 'VERCEL_API_TOKEN secret is not set' }, { status: 500 });

    const body = await req.json();
    const { action } = body;
    if (!action) return Response.json({ error: 'action is required' }, { status: 400 });
    const teamId = body.teamId;

    let result: any;

    switch (action) {
      // ── Projects ──
      case 'listProjects': {
        const limit = body.limit || 50;
        result = await vercelFetch(`/v9/projects?limit=${limit}`, 'GET', token, undefined, teamId);
        break;
      }
      case 'getProject': {
        if (!body.projectIdOrName) return Response.json({ error: 'projectIdOrName is required' }, { status: 400 });
        result = await vercelFetch(`/v9/projects/${encodeURIComponent(body.projectIdOrName)}`, 'GET', token, undefined, teamId);
        break;
      }
      case 'createProject': {
        if (!body.name) return Response.json({ error: 'name is required' }, { status: 400 });
        const projectBody: any = { name: body.name };
        if (body.framework) projectBody.framework = body.framework;
        if (body.buildCommand) projectBody.buildCommand = body.buildCommand;
        if (body.outputDirectory) projectBody.outputDirectory = body.outputDirectory;
        if (body.installCommand) projectBody.installCommand = body.installCommand;
        if (body.rootDirectory) projectBody.rootDirectory = body.rootDirectory;
        result = await vercelFetch(`/v11/projects`, 'POST', token, projectBody, teamId);
        break;
      }
      case 'deleteProject': {
        if (!body.projectIdOrName) return Response.json({ error: 'projectIdOrName is required' }, { status: 400 });
        result = await vercelFetch(`/v9/projects/${encodeURIComponent(body.projectIdOrName)}`, 'DELETE', token, undefined, teamId);
        break;
      }

      // ── Deployments ──
      case 'listDeployments': {
        const limit = body.limit || 20;
        let path = `/v6/deployments?limit=${limit}`;
        if (body.projectId) path += `&projectId=${body.projectId}`;
        if (body.app) path += `&app=${encodeURIComponent(body.app)}`;
        result = await vercelFetch(path, 'GET', token, undefined, teamId);
        break;
      }
      case 'getDeployment': {
        if (!body.deploymentId) return Response.json({ error: 'deploymentId is required' }, { status: 400 });
        result = await vercelFetch(`/v13/deployments/${encodeURIComponent(body.deploymentId)}`, 'GET', token, undefined, teamId);
        break;
      }
      case 'createPreviewDeployment': {
        if (!body.projectIdOrName || !body.name || !body.gitOrg || !body.gitRepo || !body.gitRef) {
          return Response.json({
            error: 'projectIdOrName, name, gitOrg, gitRepo, and gitRef are required',
          }, { status: 400 });
        }
        if (body.target || body.prod === true || body.production === true) {
          return Response.json({
            error: 'createPreviewDeployment is preview-only; production target is forbidden',
          }, { status: 403 });
        }
        const deployBody: any = {
          name: String(body.name),
          project: String(body.projectIdOrName),
          gitSource: {
            type: 'github',
            org: String(body.gitOrg),
            repo: String(body.gitRepo),
            ref: String(body.gitRef),
          },
          projectSettings: {
            framework: body.framework ?? 'vite',
            buildCommand: body.buildCommand ?? 'npm run build',
            installCommand: body.installCommand ?? 'npm ci',
            outputDirectory: body.outputDirectory ?? 'dist',
          },
          meta: {
            digitalDominancePreview: 'true',
            sourceBranch: String(body.gitRef),
          },
        };
        result = await vercelFetch('/v13/deployments', 'POST', token, deployBody, teamId);
        break;
      }
      case 'validateProtectedPreview': {
        if (!body.deploymentId || !body.deploymentUrl || !Array.isArray(body.paths)) {
          return Response.json({
            error: 'deploymentId, deploymentUrl, and paths[] are required',
          }, { status: 400 });
        }
        if (!String(body.deploymentId).startsWith('dpl_')) {
          return Response.json({ error: 'deploymentId must be a Vercel deployment id' }, { status: 400 });
        }
        const host = String(body.deploymentUrl).replace(/^https?:\/\//, '').replace(/\/$/, '');
        if (!host.endsWith('.vercel.app')) {
          return Response.json({ error: 'validation is restricted to vercel.app preview hosts' }, { status: 403 });
        }
        const paths = body.paths
          .map((p: any) => String(p))
          .filter((p: string) => p.startsWith('/'))
          .slice(0, 20);
        const ttl = Math.max(60, Math.min(Number(body.ttlSec || 120), 300));
        const bypass = await vercelFetch(
          `/aliases/${encodeURIComponent(body.deploymentId)}/protection-bypass`,
          'PATCH',
          token,
          { ttl },
          teamId
        );
        if (bypass && bypass._error) {
          result = bypass;
          break;
        }
        const bypassValue =
          bypass?.value ||
          bypass?.protectionBypass?.value ||
          bypass?.protectionBypass;
        if (!bypassValue || typeof bypassValue !== 'string') {
          return Response.json({ error: 'Vercel did not return a temporary protection bypass' }, { status: 502 });
        }

        const checks: any[] = [];
        for (const path of paths) {
          const sep = path.includes('?') ? '&' : '?';
          const url = `https://${host}${path}${sep}x-vercel-protection-bypass=${encodeURIComponent(bypassValue)}`;
          const resp = await fetch(url, { redirect: 'manual' });
          const text = await resp.text();
          const rawLocation = resp.headers.get('location');
          const safeLocation = rawLocation
            ? rawLocation
                .replace(/([?&])x-vercel-protection-bypass=[^&]+/i, '$1')
                .replace(/[?&]$/, '')
            : null;
          checks.push({
            path,
            status: resp.status,
            location: safeLocation,
            route: resp.headers.get('x-digital-dominance-route'),
            robots: resp.headers.get('x-robots-tag'),
            content_type: resp.headers.get('content-type'),
            body_has_noindex: /noindex/i.test(text),
            body_has_canonical: /rel=["']canonical["']/i.test(text),
          });
        }
        result = {
          validation_only: true,
          deployment_id: body.deploymentId,
          deployment_url: host,
          bypass_ttl_sec: ttl,
          checks,
        };
        break;
      }
      case 'inspectPreviewProtection': {
        if (!body.deploymentId) {
          return Response.json({ error: 'deploymentId is required' }, { status: 400 });
        }
        const aliasList = await vercelFetch(
          `/v2/deployments/${encodeURIComponent(body.deploymentId)}/aliases`,
          'GET',
          token,
          undefined,
          teamId
        );
        if (aliasList && aliasList._error) {
          result = aliasList;
          break;
        }
        const rawAliases = Array.isArray(aliasList?.aliases)
          ? aliasList.aliases
          : Array.isArray(aliasList)
            ? aliasList
            : [];
        const aliases: any[] = [];
        for (const item of rawAliases.slice(0, 10)) {
          const aliasName = String(item?.alias || item?.name || item?.uid || '');
          let detail: any = null;
          if (aliasName) {
            const fetched = await vercelFetch(
              `/v4/aliases/${encodeURIComponent(aliasName)}`,
              'GET',
              token,
              undefined,
              teamId
            );
            if (!(fetched && fetched._error)) detail = fetched;
          }
          const pb = detail?.protectionBypass ?? item?.protectionBypass;
          aliases.push({
            alias: item?.alias || item?.name || null,
            uid: item?.uid || item?.id || null,
            deployment_id: item?.deploymentId || item?.deployment?.id || null,
            detail_keys: detail ? Object.keys(detail).sort() : [],
            protection_bypass_present: Boolean(pb),
            protection_bypass_type: pb === null || pb === undefined ? null : typeof pb,
            protection_bypass_keys:
              pb && typeof pb === 'object' ? Object.keys(pb).sort() : [],
          });
        }
        result = {
          inspection_only: true,
          deployment_id: body.deploymentId,
          alias_count: aliases.length,
          aliases,
        };
        break;
      }
      case 'deleteDeployment': {
        if (!body.deploymentId) return Response.json({ error: 'deploymentId is required' }, { status: 400 });
        result = await vercelFetch(`/v13/deployments/${encodeURIComponent(body.deploymentId)}`, 'DELETE', token, undefined, teamId);
        break;
      }

      // ── Environment Variables ──
      case 'listEnvVars': {
        if (!body.projectIdOrName) return Response.json({ error: 'projectIdOrName is required' }, { status: 400 });
        result = await vercelFetch(`/v9/projects/${encodeURIComponent(body.projectIdOrName)}/env`, 'GET', token, undefined, teamId);
        break;
      }
      case 'createEnvVar': {
        if (!body.projectIdOrName || !body.key || body.value === undefined) {
          return Response.json({ error: 'projectIdOrName, key, and value are required' }, { status: 400 });
        }
        const envBody = {
          key: body.key,
          value: String(body.value),
          type: body.type || 'encrypted',
          target: body.target || ['production', 'preview', 'development'],
        };
        result = await vercelFetch(`/v10/projects/${encodeURIComponent(body.projectIdOrName)}/env`, 'POST', token, envBody, teamId);
        break;
      }
      case 'updateEnvVar': {
        if (!body.projectIdOrName || !body.envId || body.value === undefined) {
          return Response.json({ error: 'projectIdOrName, envId, and value are required' }, { status: 400 });
        }
        const envBody = {
          key: body.key,
          value: String(body.value),
          type: body.type || 'encrypted',
          target: body.target || ['production', 'preview', 'development'],
        };
        result = await vercelFetch(`/v9/projects/${encodeURIComponent(body.projectIdOrName)}/env/${body.envId}`, 'PATCH', token, envBody, teamId);
        break;
      }
      case 'deleteEnvVar': {
        if (!body.projectIdOrName || !body.envId) {
          return Response.json({ error: 'projectIdOrName and envId are required' }, { status: 400 });
        }
        result = await vercelFetch(`/v9/projects/${encodeURIComponent(body.projectIdOrName)}/env/${body.envId}`, 'DELETE', token, undefined, teamId);
        break;
      }

      // ── Domains (project-level) ──
      case 'listDomains': {
        if (!body.projectIdOrName) return Response.json({ error: 'projectIdOrName is required' }, { status: 400 });
        result = await vercelFetch(`/v9/projects/${encodeURIComponent(body.projectIdOrName)}/domains`, 'GET', token, undefined, teamId);
        break;
      }
      case 'addDomain': {
        if (!body.projectIdOrName || !body.domain) {
          return Response.json({ error: 'projectIdOrName and domain are required' }, { status: 400 });
        }
        const domainBody: any = { name: body.domain };
        if (body.redirect) domainBody.redirect = body.redirect;
        if (body.gitBranch) domainBody.gitBranch = body.gitBranch;
        result = await vercelFetch(`/v9/projects/${encodeURIComponent(body.projectIdOrName)}/domains`, 'POST', token, domainBody, teamId);
        break;
      }
      case 'removeDomain': {
        if (!body.projectIdOrName || !body.domain) {
          return Response.json({ error: 'projectIdOrName and domain are required' }, { status: 400 });
        }
        result = await vercelFetch(`/v9/projects/${encodeURIComponent(body.projectIdOrName)}/domains/${encodeURIComponent(body.domain)}`, 'DELETE', token, undefined, teamId);
        break;
      }
      case 'verifyDomain': {
        if (!body.projectIdOrName || !body.domain) {
          return Response.json({ error: 'projectIdOrName and domain are required' }, { status: 400 });
        }
        result = await vercelFetch(`/v9/projects/${encodeURIComponent(body.projectIdOrName)}/domains/${encodeURIComponent(body.domain)}/verify`, 'POST', token, undefined, teamId);
        break;
      }

      // ── DNS Records (Vercel-managed domains) ──
      case 'listDnsRecords': {
        if (!body.domain) return Response.json({ error: 'domain is required' }, { status: 400 });
        result = await vercelFetch(`/v4/domains/${encodeURIComponent(body.domain)}/records`, 'GET', token, undefined, teamId);
        break;
      }
      case 'createDnsRecord': {
        if (!body.domain || !body.type || !body.name || body.value === undefined) {
          return Response.json({ error: 'domain, type, name, and value are required' }, { status: 400 });
        }
        const dnsBody: any = { type: body.type, name: body.name, value: String(body.value) };
        if (body.ttl) dnsBody.ttl = body.ttl;
        if (body.priority !== undefined) dnsBody.priority = body.priority;
        result = await vercelFetch(`/v4/domains/${encodeURIComponent(body.domain)}/records`, 'POST', token, dnsBody, teamId);
        break;
      }
      case 'updateDnsRecord': {
        if (!body.domain || !body.recordId || !body.type || !body.name || body.value === undefined) {
          return Response.json({ error: 'domain, recordId, type, name, and value are required' }, { status: 400 });
        }
        const dnsBody: any = { type: body.type, name: body.name, value: String(body.value) };
        if (body.ttl) dnsBody.ttl = body.ttl;
        if (body.priority !== undefined) dnsBody.priority = body.priority;
        result = await vercelFetch(`/v4/records/${encodeURIComponent(body.recordId)}`, 'PATCH', token, dnsBody, teamId);
        break;
      }
      case 'deleteDnsRecord': {
        if (!body.domain || !body.recordId) {
          return Response.json({ error: 'domain and recordId are required' }, { status: 400 });
        }
        result = await vercelFetch(`/v4/records/${encodeURIComponent(body.recordId)}`, 'DELETE', token, undefined, teamId);
        break;
      }

      // ── User / Team info ──
      case 'getUser': {
        result = await vercelFetch(`/v2/user`, 'GET', token);
        break;
      }
      case 'listTeams': {
        result = await vercelFetch(`/v2/teams`, 'GET', token);
        break;
      }

      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    if (result && result._error) {
      console.error(`[vercelManager] ${action} failed:`, result.status, JSON.stringify(result.body).slice(0, 500));
      return Response.json({ error: `Vercel API error (${result.status})`, action, details: result.body }, { status: 502 });
    }

    return Response.json({ ok: true, action, result });
  } catch (error) {
    console.error('vercelManager error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}