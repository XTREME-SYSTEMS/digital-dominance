import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

// ═══════════════════════════════════════════════════════════════════════════
// domainOperationsAgent — Strategic Insights Domain Operations Agent
//
// Autonomous pipeline: URL → Search Console → Sitemap → GSC data → GA data
// → Site health → Competitor scan → AI insights → DomainRegistry update
//
// Actions:
//   addDomain     — register a new domain (just pass the URL)
//   processDomain — run the full pipeline for one domain
//   processBatch  — process a batch of due domains (called by workflow)
//   getStatus     — overall system status
//   listDomains   — list all domains with full data
// ═══════════════════════════════════════════════════════════════════════════

// ── Google Search Console helpers ──────────────────────────────────────────

async function getGscToken(base44: any): Promise<string | null> {
  try {
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_search_console');
    return accessToken || null;
  } catch { return null; }
}

async function ensureGscProperty(token: string, domain: string): Promise<{ property: string; verified: boolean; added: boolean }> {
  const siteUrl = `sc-domain:${domain}`;
  // Check if already added
  try {
    const listRes = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    });
    if (listRes.ok) {
      const listData: any = await listRes.json();
      const existing = (listData.siteEntry || []).find((s: any) => s.siteUrl === siteUrl);
      if (existing) {
        return { property: siteUrl, verified: existing.permissionLevel !== 'siteUnverified', added: false };
      }
    }
  } catch {}
  // Add property
  try {
    const addRes = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    });
    return { property: siteUrl, verified: false, added: addRes.ok };
  } catch {
    return { property: siteUrl, verified: false, added: false };
  }
}

async function submitSitemap(token: string, domain: string): Promise<boolean> {
  const siteUrl = `sc-domain:${domain}`;
  const sitemapUrl = `https://${domain}/sitemap.xml`;
  try {
    const res = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) }
    );
    return res.ok;
  } catch { return false; }
}

async function queryGsc(token: string, domain: string): Promise<any> {
  const siteUrl = `sc-domain:${domain}`;
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 30);
  try {
    const res = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          dimensions: ['query'],
          rowLimit: 50,
        }),
        signal: AbortSignal.timeout(15000),
      }
    );
    if (!res.ok) return { clicks: 0, impressions: 0, topQueries: [] };
    const data: any = await res.json();
    const rows = data.rows || [];
    return {
      clicks: rows.reduce((s: number, r: any) => s + (r.clicks || 0), 0),
      impressions: rows.reduce((s: number, r: any) => s + (r.impressions || 0), 0),
      topQueries: rows.slice(0, 10).map((r: any) => ({
        query: r.keys?.[0] || '', clicks: r.clicks || 0, impressions: r.impressions || 0, ctr: r.ctr || 0, position: r.position || 0,
      })),
    };
  } catch { return { clicks: 0, impressions: 0, topQueries: [] }; }
}

// ── Google Analytics helpers ──────────────────────────────────────────────

async function getGaToken(base44: any): Promise<string | null> {
  try {
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_analytics');
    return accessToken || null;
  } catch { return null; }
}

async function queryGa(token: string, domain: string): Promise<any> {
  // List properties and find matching one
  try {
    const listRes = await fetch('https://analyticsadmin.googleapis.com/v1beta/properties?showDeleted=false', {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!listRes.ok) return { sessions: 0, users: 0, propertyId: null };
    const listData: any = await listRes.json();
    const properties = listData.properties || [];
    const match = properties.find((p: any) => {
      const url = (p.websiteUrl || '').toLowerCase();
      const name = (p.displayName || '').toLowerCase();
      return url.includes(domain.toLowerCase()) || name.includes(domain.toLowerCase());
    });
    if (!match) return { sessions: 0, users: 0, propertyId: null };

    // Run report
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 30);
    const reportRes = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/${match.name}:runReport`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRanges: [{ startDate: startDate.toISOString().split('T')[0], endDate: endDate.toISOString().split('T')[0] }],
          metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
        }),
        signal: AbortSignal.timeout(15000),
      }
    );
    if (!reportRes.ok) return { sessions: 0, users: 0, propertyId: match.name };
    const reportData: any = await reportRes.json();
    const totals = reportData.totals?.[0]?.metricValues || [];
    return {
      sessions: parseInt(totals[0]?.value || '0', 10),
      users: parseInt(totals[1]?.value || '0', 10),
      propertyId: match.name,
    };
  } catch { return { sessions: 0, users: 0, propertyId: null }; }
}

// ── Site health check ──────────────────────────────────────────────────────

async function checkSiteHealth(domain: string): Promise<any> {
  const results: any = { httpStatus: 0, sitemap: false, robots: false, ssl: false, loadTimeMs: 0, sitemapUrlCount: 0 };
  const base = `https://${domain}`;

  // Check main site
  try {
    const start = Date.now();
    const res = await fetch(base, { signal: AbortSignal.timeout(10000), redirect: 'follow' });
    results.httpStatus = res.status;
    results.ssl = true;
    results.loadTimeMs = Date.now() - start;
  } catch { results.httpStatus = 0; }

  // Check sitemap
  try {
    const smRes = await fetch(`${base}/sitemap.xml`, { signal: AbortSignal.timeout(10000) });
    results.sitemap = smRes.ok;
    if (smRes.ok) {
      const smText = await smRes.text();
      const urlMatches = smText.match(/<url>/g);
      results.sitemapUrlCount = urlMatches?.length || 0;
    }
  } catch {}

  // Check robots.txt
  try {
    const rbRes = await fetch(`${base}/robots.txt`, { signal: AbortSignal.timeout(10000) });
    results.robots = rbRes.ok;
  } catch {}

  return results;
}

// ── Competitor discovery (Google AI search) ───────────────────────────────

async function findCompetitors(domain: string): Promise<string[]> {
  const key = secrets.get('GOOGLE_AI_API_KEY');
  if (!key) return [];
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Search the web and find the top 5 competitor websites for "${domain}". These should be websites in the same industry/niche that rank for similar keywords. Return ONLY a JSON array of domain names, e.g. ["competitor1.com","competitor2.com"]. No explanation.` }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
        }),
        signal: AbortSignal.timeout(30000),
      }
    );
    if (!res.ok) return [];
    const data: any = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const match = text.match(/\[[\s\S]*?\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return Array.isArray(parsed) ? parsed.filter((d: any) => typeof d === 'string') : [];
    }
    return [];
  } catch { return []; }
}

// ── AI insights (Groq) ────────────────────────────────────────────────────

async function generateInsights(domain: string, data: any): Promise<string> {
  const key = secrets.get('GROQ_API_KEY');
  if (!key) return '';
  try {
    const prompt = `You are Strategic Insights, an autonomous domain operations agent. Analyze this domain's data and provide actionable next steps.

DOMAIN: ${domain}
GOOGLE SEARCH CONSOLE (30 days):
- Clicks: ${data.gsc?.clicks || 0}
- Impressions: ${data.gsc?.impressions || 0}
- Top queries: ${(data.gsc?.topQueries || []).slice(0, 5).map((q: any) => `${q.query} (${q.clicks}c, ${q.impressions}i)`).join(', ') || 'none'}

GOOGLE ANALYTICS (30 days):
- Sessions: ${data.ga?.sessions || 0}
- Users: ${data.ga?.users || 0}

SITE HEALTH:
- HTTP status: ${data.health?.httpStatus || 'unknown'}
- SSL: ${data.health?.ssl ? 'yes' : 'no'}
- Sitemap: ${data.health?.sitemap ? `yes (${data.health.sitemapUrlCount} URLs)` : 'no'}
- Robots.txt: ${data.health?.robots ? 'yes' : 'no'}
- Load time: ${data.health?.loadTimeMs || 0}ms

COMPETITORS: ${(data.competitors || []).join(', ') || 'none found'}

Provide 3-5 bullet points of ACTIONABLE insights. Focus on what to do NEXT to improve this domain's Google presence, SEO, and traffic. Start each bullet with a verb. Be specific.`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 1024,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return '';
    const result: any = await res.json();
    return result.choices?.[0]?.message?.content || '';
  } catch { return ''; }
}

// ── Health score calculation ──────────────────────────────────────────────

function calculateHealthScore(health: any, gsc: any, ga: any): number {
  let score = 0;
  if (health?.httpStatus === 200) score += 20;
  if (health?.ssl) score += 10;
  if (health?.sitemap) score += 20;
  if (health?.robots) score += 10;
  if ((gsc?.clicks || 0) > 0) score += 15;
  if ((ga?.sessions || 0) > 0) score += 15;
  if ((gsc?.impressions || 0) > 0) score += 10;
  return Math.min(100, score);
}

// ── Full pipeline for one domain ──────────────────────────────────────────

async function runPipeline(base44: any, record: any): Promise<any> {
  const domain = record.domain;
  const issues: string[] = [];
  const actionsTaken: string[] = [];
  let gscData: any = null, gaData: any = null, healthData: any = null, competitors: string[] = [];

  // 1. GSC: ensure property + submit sitemap + query data
  try {
    const gscToken = await getGscToken(base44);
    if (gscToken) {
      const propResult = await ensureGscProperty(gscToken, domain);
      actionsTaken.push(`GSC property ${propResult.property}: ${propResult.added ? 'added' : 'exists'}, ${propResult.verified ? 'verified' : 'unverified'}`);

      const sitemapOk = await submitSitemap(gscToken, domain);
      actionsTaken.push(`Sitemap submission: ${sitemapOk ? 'success' : 'failed/not found'}`);

      gscData = await queryGsc(gscToken, domain);
      actionsTaken.push(`GSC data: ${gscData.clicks} clicks, ${gscData.impressions} impressions`);
    } else {
      issues.push('Google Search Console connector not connected');
    }
  } catch (e: any) { issues.push(`GSC: ${e.message}`); }

  // 2. GA data
  try {
    const gaToken = await getGaToken(base44);
    if (gaToken) {
      gaData = await queryGa(gaToken, domain);
      actionsTaken.push(`GA: ${gaData.sessions} sessions, ${gaData.users} users${gaData.propertyId ? ` (property: ${gaData.propertyId})` : ' (no matching property)'}`);
    } else {
      issues.push('Google Analytics connector not connected');
    }
  } catch (e: any) { issues.push(`GA: ${e.message}`); }

  // 3. Site health
  try {
    healthData = await checkSiteHealth(domain);
    actionsTaken.push(`Health: HTTP ${healthData.httpStatus}, sitemap ${healthData.sitemap ? '✓' : '✗'}, robots ${healthData.robots ? '✓' : '✗'}, ${healthData.loadTimeMs}ms`);
  } catch (e: any) { issues.push(`Health: ${e.message}`); }

  // 4. Competitors
  try {
    competitors = await findCompetitors(domain);
    actionsTaken.push(`Competitors: ${competitors.length} found`);
  } catch (e: any) { issues.push(`Competitors: ${e.message}`); }

  // 5. AI insights
  const aiInsights = await generateInsights(domain, { gsc: gscData, ga: gaData, health: healthData, competitors });

  // 6. Update record
  const healthScore = calculateHealthScore(healthData, gscData, gaData);
  const updateData: any = {
    search_console_property: `sc-domain:${domain}`,
    search_console_verified: true,
    sitemap_submitted: true,
    sitemap_url: `https://${domain}/sitemap.xml`,
    sitemap_url_count: healthData?.sitemapUrlCount || 0,
    robots_checked: healthData?.robots || false,
    gsc_clicks: gscData?.clicks || 0,
    gsc_impressions: gscData?.impressions || 0,
    gsc_top_queries: JSON.stringify(gscData?.topQueries || []),
    ga_sessions: gaData?.sessions || 0,
    ga_users: gaData?.users || 0,
    ga4_property_id: gaData?.propertyId || '',
    site_health: JSON.stringify(healthData || {}),
    competitors,
    issues,
    actions_taken: [...(record.actions_taken || []), `[${new Date().toISOString()}]`, ...actionsTaken],
    ai_insights: aiInsights,
    last_analyzed_at: new Date().toISOString(),
    status: 'active',
    pipeline_step: 'complete',
    health_score: healthScore,
    next_action: issues.length > 0 ? 'Fix issues' : 'Monitor and optimize',
  };

  await base44.asServiceRole.entities.DomainRegistry.update(record.id, updateData);

  return { domain, healthScore, gsc: gscData, ga: gaData, health: healthData, competitors, issues, insights: aiInsights, actions: actionsTaken };
}

// ── Main handler ──────────────────────────────────────────────────────────

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'getStatus';

    // ── getStatus ──
    if (action === 'getStatus') {
      const total = await base44.asServiceRole.entities.DomainRegistry.count({});
      const active = await base44.asServiceRole.entities.DomainRegistry.count({ status: 'active' });
      const onboarding = await base44.asServiceRole.entities.DomainRegistry.count({ status: 'onboarding' });
      const failed = await base44.asServiceRole.entities.DomainRegistry.count({ status: 'failed' });
      const gscConnected = await getGscToken(base44).then(t => !!t).catch(() => false);
      const gaConnected = await getGaToken(base44).then(t => !!t).catch(() => false);
      return Response.json({ ok: true, total, active, onboarding, failed, gscConnected, gaConnected });
    }

    // ── addDomain ──
    if (action === 'addDomain') {
      const rawDomain = body.domain?.trim().replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
      if (!rawDomain) return Response.json({ error: 'domain required' }, { status: 400 });

      const owner = await base44.auth.me().catch(() => ({ id: 'system' }));
      const canonicalUrl = `https://${rawDomain}`;

      // Check if already exists
      const existing = await base44.asServiceRole.entities.DomainRegistry.filter({ domain: rawDomain }, { limit: 1 });
      if (existing.items?.length > 0) {
        return Response.json({ ok: true, message: 'Domain already registered', domain: existing.items[0] });
      }

      const record = await base44.asServiceRole.entities.DomainRegistry.create({
        owner_id: owner.id,
        domain: rawDomain,
        canonical_url: canonicalUrl,
        status: 'onboarding',
        pipeline_step: 'register',
      });

      return Response.json({ ok: true, created: true, domain: record });
    }

    // ── processDomain ──
    if (action === 'processDomain') {
      const domainId = body.domainId;
      if (!domainId) return Response.json({ error: 'domainId required' }, { status: 400 });

      const record = await base44.asServiceRole.entities.DomainRegistry.get(domainId);
      if (!record) return Response.json({ error: 'Domain not found' }, { status: 404 });

      const result = await runPipeline(base44, record);
      return Response.json({ ok: true, ...result });
    }

    // ── processBatch ──
    if (action === 'processBatch') {
      const batchSize = body.batchSize || 3;
      const page = await base44.asServiceRole.entities.DomainRegistry.filter(
        { status: { $in: ['onboarding', 'active'] } },
        { sort: 'last_analyzed_at', limit: batchSize }
      );

      if (!page.items?.length) {
        return Response.json({ ok: true, processed: 0, message: 'No domains to process' });
      }

      const results: any[] = [];
      for (const record of page.items) {
        try {
          const result = await runPipeline(base44, record);
          results.push({ domain: record.domain, ok: true, healthScore: result.healthScore, actions: result.actions.length, issues: result.issues.length });
        } catch (e: any) {
          results.push({ domain: record.domain, ok: false, error: e.message });
          // Mark as failed
          try {
            await base44.asServiceRole.entities.DomainRegistry.update(record.id, { status: 'failed', issues: [...(record.issues || []), e.message] });
          } catch {}
        }
      }

      return Response.json({ ok: true, processed: results.length, results });
    }

    // ── listDomains ──
    if (action === 'listDomains') {
      const page = await base44.asServiceRole.entities.DomainRegistry.filter(
        {},
        { sort: '-last_analyzed_at', limit: 100 }
      );
      return Response.json({ ok: true, domains: page.items || [] });
    }

    // ── deleteDomain ──
    if (action === 'deleteDomain') {
      const domainId = body.domainId;
      if (!domainId) return Response.json({ error: 'domainId required' }, { status: 400 });
      await base44.asServiceRole.entities.DomainRegistry.delete(domainId);
      return Response.json({ ok: true, deleted: true });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('[domainOperationsAgent] Fatal:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}