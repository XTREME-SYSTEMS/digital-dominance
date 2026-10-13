import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// ============================================================
// searchConsoleStatus — Pulls Google Search Console indexing
// status and search performance for ANY deployed URL.
//
// Invoke: base44.functions.invoke('searchConsoleStatus', {
//   url,           // The deployed site URL to check
//   days?,         // Lookback window (default 28)
// })
//
// Returns: {
//   url,
//   property_found: boolean,
//   indexing: { verdict, coverage_state, indexing_state, last_crawl_time },
//   performance: { impressions, clicks, ctr, avg_position, top_queries },
// }
// ============================================================

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { url, days = 28 } = body;

    if (!url) return Response.json({ error: 'url is required' }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_search_console');
    if (!accessToken) return Response.json({ error: 'Google Search Console connector not authorized' }, { status: 503 });

    const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // Parse the URL to extract domain
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return Response.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const domain = parsedUrl.hostname.toLowerCase();
    const protocol = parsedUrl.protocol.replace(':', '');
    const siteBaseUrl = `${protocol}://${domain}/`;

    // 1. List all Search Console properties to find a match
    const sitesRes = await fetch('https://www.googleapis.com/webmasters/v3/sites', { headers });
    if (!sitesRes.ok) {
      const err = await sitesRes.text();
      return Response.json({ error: 'Search Console API error', details: err.slice(0, 500) }, { status: 502 });
    }
    const sitesData = await sitesRes.json();
    const sites = sitesData.siteEntry || [];

    // Find matching property: sc-domain: first, then URL-prefix
    let matchedProperty = sites.find((s: any) =>
      s.siteUrl.toLowerCase() === `sc-domain:${domain}`
    ) || sites.find((s: any) =>
      s.siteUrl.toLowerCase() === siteBaseUrl.toLowerCase()
    );

    // If no exact match, try to find a property that covers this domain
    if (!matchedProperty) {
      matchedProperty = sites.find((s: any) => {
        const propUrl = s.siteUrl.toLowerCase();
        return propUrl.includes(domain) || domain.includes(propUrl.replace('sc-domain:', '').replace('https://', '').replace('http://', '').replace('/', ''));
      });
    }

    if (!matchedProperty) {
      return Response.json({
        url,
        property_found: false,
        indexing: { verdict: 'NO_PROPERTY', coverage_state: 'No Search Console property found for this domain' },
        performance: { impressions: 0, clicks: 0, ctr: 0, avg_position: 0, top_queries: [] },
        message: `No Search Console property found for ${domain}. The autonomous agent will provision one.`,
      });
    }

    const siteUrl = matchedProperty.siteUrl;
    const enc = encodeURIComponent(siteUrl);

    // 2. URL Inspection — indexing status
    let indexing: any = { verdict: 'UNKNOWN', coverage_state: 'UNKNOWN', indexing_state: 'UNKNOWN' };
    try {
      const inspRes = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
        method: 'POST',
        headers,
        body: JSON.stringify({ inspectionUrl: url, siteUrl, languageCode: 'en-US' }),
      });
      if (inspRes.ok) {
        const inspData = await inspRes.json();
        const isr = inspData.inspectionResult?.indexStatusResult || {};
        indexing = {
          verdict: isr.verdict || 'UNKNOWN',
          coverage_state: isr.coverageState || 'UNKNOWN',
          indexing_state: isr.indexingState || 'UNKNOWN',
          last_crawl_time: isr.lastCrawlTime || null,
          google_canonical: isr.googleCanonical || null,
          robots_state: isr.robotsTxtState || 'UNKNOWN',
        };
      }
    } catch (e) {
      indexing = { verdict: 'API_ERROR', error: e.message };
    }

    // 3. Search Analytics — performance for this URL over the lookback window
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    let performance: any = { impressions: 0, clicks: 0, ctr: 0, avg_position: 0, top_queries: [] };
    try {
      const analyticsRes = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${enc}/searchAnalytics/query`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          startDate: fmt(start),
          endDate: fmt(end),
          dimensions: ['query'],
          dimensionFilterGroups: [{
            groupType: 'and',
            filters: [{ dimension: 'page', operator: 'equals', expression: url }],
          }],
          rowLimit: 25,
        }),
      });

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        const rows = analyticsData.rows || [];
        let totalImpressions = 0, totalClicks = 0, positionSum = 0, positionCount = 0;
        for (const row of rows) {
          totalImpressions += row.impressions;
          totalClicks += row.clicks;
          positionSum += row.position * row.impressions;
          positionCount += row.impressions;
        }
        performance = {
          impressions: totalImpressions,
          clicks: totalClicks,
          ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) : 0,
          avg_position: positionCount > 0 ? (positionSum / positionCount) : 0,
          top_queries: rows.slice(0, 10).map((r: any) => ({
            query: r.keys[0],
            clicks: r.clicks,
            impressions: r.impressions,
            ctr: r.ctr,
            position: r.position,
          })),
          date_range: { start: fmt(start), end: fmt(end) },
        };
      }
    } catch (e) {
      performance = { error: e.message };
    }

    return Response.json({
      url,
      property_found: true,
      property_url: siteUrl,
      indexing,
      performance,
      pulled_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('searchConsoleStatus error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}