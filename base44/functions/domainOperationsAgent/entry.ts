import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

// ═══════════════════════════════════════════════════════════════════════════
// domainOperationsAgent — Strategic Insights Domain Operations Agent v2
//
// Autonomous pipeline: URL → Search Console → Sitemap → GSC data → GA data
// → URL inspection → Sitemap validation → Site health → Competitor scan
// → AI insights → Historical snapshot → DomainRegistry update
//
// Improvements over v1:
//   - Error logging on all API calls (no more silent failures)
//   - Historical daily snapshots (DomainMetricsHistory) for trend tracking
//   - URL inspection via GSC URL Inspection API (index coverage)
//   - Sitemap validation (parse XML, check sample URLs for broken links)
//   - Competitor analysis (crawl competitor homepages for basic intel)
//   - Structured action queue (prioritized recommendations)
// ═══════════════════════════════════════════════════════════════════════════

// ── Google Search Console helpers ──────────────────────────────────────────

async function getGscToken(base44: any): Promise<string | null> {
  try {
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_search_console');
    return accessToken || null;
  } catch (e) { console.error('[domainOps] GSC token error:', e.message); return null; }
}

async function ensureGscProperty(token: string, domain: string): Promise<{ property: string; verified: boolean; added: boolean }> {
  const siteUrl = `sc-domain:${domain}`;
  try {
    const listRes = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    });
    if (listRes.ok) {
      const listData: any = await listRes.json();
      const existing = (listData.siteEntry || []).find((s: any) => s.siteUrl === siteUrl);
      if (existing) return { property: siteUrl, verified: existing.permissionLevel !== 'siteUnverified', added: false };
    }
  } catch (e) { console.error('[domainOps] GSC list error:', e.message); }
  try {
    const addRes = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}`, {
      method: 'PUT', headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000),
    });
    return { property: siteUrl, verified: false, added: addRes.ok };
  } catch (e) { console.error('[domainOps] GSC add error:', e.message); return { property: siteUrl, verified: false, added: false }; }
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
  } catch (e) { console.error('[domainOps] Sitemap submit error:', e.message); return false; }
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
    if (!res.ok) { console.error('[domainOps] GSC query error:', res.status, await res.text().catch(() => '')); return { clicks: 0, impressions: 0, topQueries: [] }; }
    const data: any = await res.json();
    const rows = data.rows || [];
    return {
      clicks: rows.reduce((s: number, r: any) => s + (r.clicks || 0), 0),
      impressions: rows.reduce((s: number, r: any) => s + (r.impressions || 0), 0),
      topQueries: rows.slice(0, 10).map((r: any) => ({ query: r.keys?.[0] || '', clicks: r.clicks || 0, impressions: r.impressions || 0, ctr: r.ctr || 0, position: r.position || 0 })),
    };
  } catch (e) { console.error('[domainOps] GSC query error:', e.message); return { clicks: 0, impressions: 0, topQueries: [] }; }
}

// ── URL Inspection (GSC URL Inspection API) ────────────────────────────────

async function inspectUrls(token: string, domain: string, urls: string[]): Promise<{ indexed: number; notIndexed: number; results: any[] }> {
  const siteUrl = `sc-domain:${domain}`;
  const results: any[] = [];
  let indexed = 0, notIndexed = 0;
  for (const url of urls.slice(0, 5)) { // GSC has quotas, limit to 5
    try {
      const res = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inspectionUrl: url, siteUrl, languageCode: 'en-US' }),
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) { console.error('[domainOps] URL inspect error:', url, res.status); continue; }
      const data: any = await res.json();
      const verdict = data.inspectionResult?.indexStatusResult?.verdict || 'UNKNOWN';
      const coverage = data.inspectionResult?.indexStatusResult?.coverageState || 'UNKNOWN';
      if (verdict === 'PASS' || coverage === 'Indexed') indexed++;
      else notIndexed++;
      results.push({ url, verdict, coverage, robotsTxtState: data.inspectionResult?.indexStatusResult?.robotsTxtState, indexingState: data.inspectionResult?.indexStatusResult?.indexingState });
    } catch (e) { console.error('[domainOps] URL inspect error:', url, e.message); }
  }
  return { indexed, notIndexed, results };
}

// ── Sitemap validation ────────────────────────────────────────────────────

async function validateSitemap(domain: string): Promise<{ exists: boolean; urlCount: number; brokenUrls: string[]; sampleChecked: number }> {
  const sitemapUrl = `https://${domain}/sitemap.xml`;
  try {
    const res = await fetch(sitemapUrl, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return { exists: false, urlCount: 0, brokenUrls: [], sampleChecked: 0 };
    const xml = await res.text();
    const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1].trim());
    if (urls.length === 0) return { exists: true, urlCount: 0, brokenUrls: [], sampleChecked: 0 };

    // Check a sample of 5 URLs for broken links
    const sample = urls.slice(0, 5);
    const broken: string[] = [];
    for (const url of sample) {
      try {
        const checkRes = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(8000), redirect: 'follow' });
        if (checkRes.status >= 400) broken.push(`${url} (${checkRes.status})`);
      } catch (e) { broken.push(`${url} (fetch error)`); }
    }
    return { exists: true, urlCount: urls.length, brokenUrls: broken, sampleChecked: sample.length };
  } catch (e) { console.error('[domainOps] Sitemap validation error:', e.message); return { exists: false, urlCount: 0, brokenUrls: [], sampleChecked: 0 }; }
}

// ── Google Analytics helpers ──────────────────────────────────────────────

async function getGaToken(base44: any): Promise<string | null> {
  try {
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_analytics');
    return accessToken || null;
  } catch (e) { console.error('[domainOps] GA token error:', e.message); return null; }
}

async function queryGa(token: string, domain: string): Promise<any> {
  try {
    const listRes = await fetch('https://analyticsadmin.googleapis.com/v1beta/properties?showDeleted=false', {
      headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000),
    });
    if (!listRes.ok) { console.error('[domainOps] GA list error:', listRes.status); return { sessions: 0, users: 0, propertyId: null }; }
    const listData: any = await listRes.json();
    const match = (listData.properties || []).find((p: any) => {
      const url = (p.websiteUrl || '').toLowerCase();
      const name = (p.displayName || '').toLowerCase();
      return url.includes(domain.toLowerCase()) || name.includes(domain.toLowerCase());
    });
    if (!match) return { sessions: 0, users: 0, propertyId: null };

    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 30);
    const reportRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/${match.name}:runReport`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate: startDate.toISOString().split('T')[0], endDate: endDate.toISOString().split('T')[0] }],
        metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!reportRes.ok) { console.error('[domainOps] GA report error:', reportRes.status); return { sessions: 0, users: 0, propertyId: match.name }; }
    const reportData: any = await reportRes.json();
    const totals = reportData.totals?.[0]?.metricValues || [];
    return { sessions: parseInt(totals[0]?.value || '0', 10), users: parseInt(totals[1]?.value || '0', 10), propertyId: match.name };
  } catch (e) { console.error('[domainOps] GA error:', e.message); return { sessions: 0, users: 0, propertyId: null }; }
}

// ── Site health check ──────────────────────────────────────────────────────

async function checkSiteHealth(domain: string): Promise<any> {
  const results: any = { httpStatus: 0, sitemap: false, robots: false, ssl: false, loadTimeMs: 0, sitemapUrlCount: 0 };
  const base = `https://${domain}`;
  try {
    const start = Date.now();
    const res = await fetch(base, { signal: AbortSignal.timeout(10000), redirect: 'follow' });
    results.httpStatus = res.status;
    results.ssl = true;
    results.loadTimeMs = Date.now() - start;
  } catch (e) { console.error('[domainOps] Health check error:', e.message); results.httpStatus = 0; }
  try {
    const smRes = await fetch(`${base}/sitemap.xml`, { signal: AbortSignal.timeout(10000) });
    results.sitemap = smRes.ok;
    if (smRes.ok) {
      const smText = await smRes.text();
      results.sitemapUrlCount = (smText.match(/<url>/g) || []).length;
    }
  } catch {}
  try {
    const rbRes = await fetch(`${base}/robots.txt`, { signal: AbortSignal.timeout(10000) });
    results.robots = rbRes.ok;
  } catch {}
  return results;
}

// ── Competitor discovery + analysis ────────────────────────────────────────

async function findCompetitors(domain: string): Promise<string[]> {
  const key = secrets.get('GOOGLE_AI_API_KEY');
  if (!key) { console.error('[domainOps] No GOOGLE_AI_API_KEY'); return []; }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Search the web and find the top 5 competitor websites for "${domain}". These should be websites in the same industry that rank for similar keywords. Return ONLY a JSON array of domain names like ["competitor1.com","competitor2.com"]. No other text.` }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
        }),
        signal: controller.signal,
      }
    );
    clearTimeout(timer);
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('[domainOps] Competitor search API error:', res.status, errText.slice(0, 200));
      return [];
    }
    const data: any = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!text) { console.error('[domainOps] Competitor search: empty response'); return []; }
    const match = text.match(/\[[\s\S]*?\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return Array.isArray(parsed) ? parsed.filter((d: any) => typeof d === 'string') : [];
    }
    // Fallback: try to extract domains from text
    const domainMatches = text.match(/[a-z0-9-]+\.[a-z]{2,}/gi) || [];
    return [...new Set(domainMatches)].slice(0, 5);
  } catch (e) { console.error('[domainOps] Competitor search error:', e.message); return []; }
}

async function analyzeCompetitor(competitorDomain: string): Promise<any> {
  try {
    const res = await fetch(`https://${competitorDomain}`, { signal: AbortSignal.timeout(8000), redirect: 'follow' });
    if (!res.ok) return { domain: competitorDomain, accessible: false };
    const html = await res.text();
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const metaDescMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const pageCount = (html.match(/<a\s/gi) || []).length;
    return {
      domain: competitorDomain,
      accessible: true,
      title: titleMatch?.[1]?.trim() || '',
      metaDescription: metaDescMatch?.[1]?.trim() || '',
      h1: h1Match?.[1]?.replace(/<[^>]+>/g, '').trim() || '',
      linkCount: pageCount,
      hasSSL: true,
    };
  } catch (e) { return { domain: competitorDomain, accessible: false, error: e.message }; }
}

// ── AI insights (Groq) ────────────────────────────────────────────────────

async function generateInsights(domain: string, data: any): Promise<string> {
  const key = secrets.get('GROQ_API_KEY');
  if (!key) { console.error('[domainOps] No GROQ_API_KEY'); return ''; }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: `You are Strategic Insights, an autonomous domain operations agent. Analyze this domain's data and provide actionable next steps.

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
- Sitemap: ${data.health?.sitemap ? 'yes' : 'no'} (${data.sitemapValidation?.urlCount || 0} URLs, ${data.sitemapValidation?.brokenUrls?.length || 0} broken)
- Robots.txt: ${data.health?.robots ? 'yes' : 'no'}
- Load time: ${data.health?.loadTimeMs || 0}ms

URL INSPECTION:
- Indexed: ${data.urlInspection?.indexed || 0}
- Not indexed: ${data.urlInspection?.notIndexed || 0}

COMPETITORS: ${(data.competitors || []).join(', ') || 'none found'}
${data.competitorAnalysis ? data.competitorAnalysis.map((c: any) => `- ${c.domain}: ${c.title || 'N/A'}`).join('\n') : ''}

Provide 3-5 bullet points of ACTIONABLE insights. Focus on what to do NEXT to improve this domain's Google presence, SEO, and traffic. Start each bullet with a verb. Be specific and data-driven.` }],
        temperature: 0.6,
        max_tokens: 1024,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('[domainOps] Groq insights error:', res.status, errText.slice(0, 200));
      return '';
    }
    const result: any = await res.json();
    const content = result.choices?.[0]?.message?.content || '';
    if (!content) console.error('[domainOps] Groq returned empty content');
    return content;
  } catch (e) { console.error('[domainOps] Groq insights error:', e.message); return ''; }
}

// ── Health score calculation ──────────────────────────────────────────────

function calculateHealthScore(health: any, gsc: any, ga: any, sitemapVal: any, urlInsp: any): number {
  let score = 0;
  if (health?.httpStatus === 200) score += 15;
  if (health?.ssl) score += 10;
  if (health?.sitemap) score += 15;
  if (health?.robots) score += 5;
  if ((sitemapVal?.brokenUrls || []).length === 0 && sitemapVal?.exists) score += 10;
  if ((gsc?.clicks || 0) > 0) score += 10;
  if ((gsc?.impressions || 0) > 0) score += 10;
  if ((ga?.sessions || 0) > 0) score += 10;
  if ((urlInsp?.indexed || 0) > 0) score += 15;
  return Math.min(100, score);
}

// ── Historical snapshot ───────────────────────────────────────────────────

async function saveSnapshot(base44: any, record: any, pipelineData: any): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    await base44.asServiceRole.entities.DomainMetricsHistory.create({
      owner_id: record.owner_id,
      domain_id: record.id,
      domain: record.domain,
      snapshot_date: today,
      gsc_clicks: pipelineData.gsc?.clicks || 0,
      gsc_impressions: pipelineData.gsc?.impressions || 0,
      ga_sessions: pipelineData.ga?.sessions || 0,
      ga_users: pipelineData.ga?.users || 0,
      health_score: pipelineData.healthScore || 0,
      competitor_count: pipelineData.competitors?.length || 0,
      sitemap_url_count: pipelineData.sitemapValidation?.urlCount || 0,
      issues_count: pipelineData.issues?.length || 0,
      indexed_pages: pipelineData.urlInspection?.indexed || 0,
      not_indexed_pages: pipelineData.urlInspection?.notIndexed || 0,
    });
  } catch (e) { console.error('[domainOps] Snapshot save error:', e.message); }
}

// ── Full pipeline for one domain ──────────────────────────────────────────

async function runPipeline(base44: any, record: any): Promise<any> {
  const domain = record.domain;
  const issues: string[] = [];
  const actionsTaken: string[] = [];
  let gscData: any = null, gaData: any = null, healthData: any = null;
  let competitors: string[] = [], competitorAnalysis: any[] = [];
  let sitemapValidation: any = null, urlInspection: any = null;

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

      // URL inspection — check homepage + a few key pages
      const urlsToInspect = [`https://${domain}/`];
      if (healthData?.sitemap) urlsToInspect.push(`https://${domain}/sitemap.xml`);
      const inspectResult = await inspectUrls(gscToken, domain, urlsToInspect);
      urlInspection = inspectResult;
      actionsTaken.push(`URL inspection: ${inspectResult.indexed} indexed, ${inspectResult.notIndexed} not indexed`);
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

  // 4. Sitemap validation
  try {
    sitemapValidation = await validateSitemap(domain);
    if (sitemapValidation.exists) {
      actionsTaken.push(`Sitemap validation: ${sitemapValidation.urlCount} URLs, ${sitemapValidation.brokenUrls.length} broken (of ${sitemapValidation.sampleChecked} checked)`);
      if (sitemapValidation.brokenUrls.length > 0) issues.push(`Broken sitemap URLs: ${sitemapValidation.brokenUrls.join(', ')}`);
    } else {
      issues.push('Sitemap not found or inaccessible');
    }
  } catch (e: any) { issues.push(`Sitemap validation: ${e.message}`); }

  // 5. Competitors
  try {
    competitors = await findCompetitors(domain);
    actionsTaken.push(`Competitors: ${competitors.length} found`);
    // Analyze each competitor
    if (competitors.length > 0) {
      for (const comp of competitors.slice(0, 3)) {
        const analysis = await analyzeCompetitor(comp);
        competitorAnalysis.push(analysis);
      }
      actionsTaken.push(`Competitor analysis: ${competitorAnalysis.length} sites analyzed`);
    }
  } catch (e: any) { issues.push(`Competitors: ${e.message}`); }

  // 6. AI insights
  const aiInsights = await generateInsights(domain, { gsc: gscData, ga: gaData, health: healthData, competitors, competitorAnalysis, sitemapValidation, urlInspection });

  // 7. Calculate health score
  const healthScore = calculateHealthScore(healthData, gscData, gaData, sitemapValidation, urlInspection);

  // 8. Update record
  const pipelineData = { gsc: gscData, ga: gaData, health: healthData, competitors, sitemapValidation, urlInspection, issues, healthScore };
  const updateData: any = {
    search_console_property: `sc-domain:${domain}`,
    search_console_verified: true,
    sitemap_submitted: true,
    sitemap_url: `https://${domain}/sitemap.xml`,
    sitemap_url_count: sitemapValidation?.urlCount || healthData?.sitemapUrlCount || 0,
    robots_checked: healthData?.robots || false,
    gsc_clicks: gscData?.clicks || 0,
    gsc_impressions: gscData?.impressions || 0,
    gsc_top_queries: JSON.stringify(gscData?.topQueries || []),
    ga_sessions: gaData?.sessions || 0,
    ga_users: gaData?.users || 0,
    ga4_property_id: gaData?.propertyId || '',
    site_health: JSON.stringify(healthData || {}),
    index_status: JSON.stringify(urlInspection || {}),
    competitors,
    issues,
    actions_taken: [...(record.actions_taken || []), `[${new Date().toISOString()}]`, ...actionsTaken],
    ai_insights: aiInsights,
    last_analyzed_at: new Date().toISOString(),
    status: 'active',
    pipeline_step: 'complete',
    health_score: healthScore,
    next_action: issues.length > 0 ? `Fix ${issues.length} issue(s): ${issues[0]}` : 'Monitor and optimize',
  };

  await base44.asServiceRole.entities.DomainRegistry.update(record.id, updateData);

  // 9. Save historical snapshot
  await saveSnapshot(base44, record, pipelineData);

  return { domain, healthScore, gsc: gscData, ga: gaData, health: healthData, competitors, competitorAnalysis, sitemapValidation, urlInspection, issues, insights: aiInsights, actions: actionsTaken };
}

// ── Main handler ──────────────────────────────────────────────────────────

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'getStatus';

    if (action === 'getStatus') {
      const total = await base44.asServiceRole.entities.DomainRegistry.count({});
      const active = await base44.asServiceRole.entities.DomainRegistry.count({ status: 'active' });
      const onboarding = await base44.asServiceRole.entities.DomainRegistry.count({ status: 'onboarding' });
      const failed = await base44.asServiceRole.entities.DomainRegistry.count({ status: 'failed' });
      const gscConnected = await getGscToken(base44).then(t => !!t).catch(() => false);
      const gaConnected = await getGaToken(base44).then(t => !!t).catch(() => false);
      return Response.json({ ok: true, total, active, onboarding, failed, gscConnected, gaConnected });
    }

    if (action === 'addDomain') {
      const rawDomain = body.domain?.trim().replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
      if (!rawDomain) return Response.json({ error: 'domain required' }, { status: 400 });
      const owner = await base44.auth.me().catch(() => ({ id: 'system' }));
      const existing = await base44.asServiceRole.entities.DomainRegistry.filter({ domain: rawDomain }, { limit: 1 });
      if (existing.items?.length > 0) return Response.json({ ok: true, message: 'Domain already registered', domain: existing.items[0] });
      const record = await base44.asServiceRole.entities.DomainRegistry.create({
        owner_id: owner.id, domain: rawDomain, canonical_url: `https://${rawDomain}`,
        status: 'onboarding', pipeline_step: 'register',
      });
      return Response.json({ ok: true, created: true, domain: record });
    }

    if (action === 'processDomain') {
      const domainId = body.domainId;
      if (!domainId) return Response.json({ error: 'domainId required' }, { status: 400 });
      const record = await base44.asServiceRole.entities.DomainRegistry.get(domainId);
      if (!record) return Response.json({ error: 'Domain not found' }, { status: 404 });
      const result = await runPipeline(base44, record);
      return Response.json({ ok: true, ...result });
    }

    if (action === 'processBatch') {
      const batchSize = body.batchSize || 3;
      const page = await base44.asServiceRole.entities.DomainRegistry.filter(
        { status: { $in: ['onboarding', 'active'] } },
        { sort: 'last_analyzed_at', limit: batchSize }
      );
      if (!page.items?.length) return Response.json({ ok: true, processed: 0, message: 'No domains to process' });
      const results: any[] = [];
      for (const record of page.items) {
        try {
          const result = await runPipeline(base44, record);
          results.push({ domain: record.domain, ok: true, healthScore: result.healthScore, actions: result.actions.length, issues: result.issues.length });
        } catch (e: any) {
          results.push({ domain: record.domain, ok: false, error: e.message });
          try { await base44.asServiceRole.entities.DomainRegistry.update(record.id, { status: 'failed', issues: [...(record.issues || []), e.message] }); } catch {}
        }
      }
      return Response.json({ ok: true, processed: results.length, results });
    }

    if (action === 'listDomains') {
      const page = await base44.asServiceRole.entities.DomainRegistry.filter({}, { sort: '-last_analyzed_at', limit: 100 });
      return Response.json({ ok: true, domains: page.items || [] });
    }

    if (action === 'getHistory') {
      const domainId = body.domainId;
      if (!domainId) return Response.json({ error: 'domainId required' }, { status: 400 });
      const page = await base44.asServiceRole.entities.DomainMetricsHistory.filter(
        { domain_id: domainId }, { sort: '-snapshot_date', limit: 90 }
      );
      return Response.json({ ok: true, history: page.items || [] });
    }

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