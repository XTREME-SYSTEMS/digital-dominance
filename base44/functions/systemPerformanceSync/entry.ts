import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

// ═══════════════════════════════════════════════════════════════════════════
// systemPerformanceSync — Daily unified performance sync for 3 properties.
//
// Uses FREE Google connectors (OAuth) + GoDaddy API key — NO Base44 credits.
// Pulls: Google Search Console (top queries), Google Analytics (traffic),
//        GoDaddy (domain portfolio), Lead entity (monthly growth).
// Stores snapshots in AnalyticsSnapshot entity for the dashboard to read.
//
// Target domains:
//   strategicmindsai.com, xtremepolishingsystems.com, nationalconcretepolishing.net
// ═══════════════════════════════════════════════════════════════════════════

const TARGET_DOMAINS = [
  'strategicmindsai.com',
  'xtremepolishingsystems.com',
  'nationalconcretepolishing.net',
];

const GSC_BASE = 'https://www.googleapis.com/webmasters/v3';
const GA_ADMIN = 'https://analyticsadmin.googleapis.com/v1beta';
const GA_DATA = 'https://analyticsdata.googleapis.com/v1beta';
const GODADDY_BASE = 'https://api.godaddy.com/v1';

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'sync';

    // ── STATUS ──
    if (action === 'status') {
      const lastSync = await base44.asServiceRole.entities.AnalyticsSnapshot.filter(
        { metric_name: 'system_sync_complete' },
        { sort: '-recorded_at', limit: 1 }
      );
      return Response.json({
        ok: true,
        targetDomains: TARGET_DOMAINS,
        lastSync: lastSync.items?.[0]?.recorded_at || null,
      });
    }

    // ── SYNC (daily automated) ──
    if (action === 'sync') {
      const now = new Date().toISOString();
      const results: any = { gsc: [], ga: [], godaddy: null, leads: null, errors: [] };

      // ═══ 1. Google Search Console ═══
      try {
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_search_console');
        const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

        const sitesRes = await fetch(`${GSC_BASE}/sites`, { headers });
        const sitesData = await sitesRes.json();
        const allSites = sitesData.siteEntry || [];

        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 27);
        const fmt = (d: Date) => d.toISOString().slice(0, 10);

        for (const domain of TARGET_DOMAINS) {
          const matching = allSites.filter((s: any) => {
            const url = s.siteUrl.toLowerCase();
            return url === `sc-domain:${domain}` || url === `https://${domain}/` || url === `https://www.${domain}/`;
          });

          if (matching.length === 0) {
            results.gsc.push({ domain, status: 'not_found' });
            continue;
          }

          const siteUrl = matching[0].siteUrl;
          const enc = encodeURIComponent(siteUrl);

          const analyticsRes = await fetch(`${GSC_BASE}/sites/${enc}/searchAnalytics/query`, {
            method: 'POST', headers,
            body: JSON.stringify({
              startDate: fmt(start), endDate: fmt(end),
              dimensions: ['query'], rowLimit: 100,
            }),
          });
          const analyticsData = await analyticsRes.json();
          const rows = analyticsData.rows || [];

          const topQueries = rows.slice(0, 20).map((r: any) => ({
            query: r.keys[0], clicks: r.clicks, impressions: r.impressions,
            ctr: r.ctr, position: r.position,
          }));

          const totalClicks = rows.reduce((s: number, r: any) => s + r.clicks, 0);
          const totalImpressions = rows.reduce((s: number, r: any) => s + r.impressions, 0);

          results.gsc.push({ domain, siteUrl, totalClicks, totalImpressions, topQueries });

          await base44.asServiceRole.entities.AnalyticsSnapshot.create({
            metric_name: 'gsc_clicks', metric_type: 'count', value: totalClicks,
            period: '30d', source: domain, recorded_at: now,
          });
          await base44.asServiceRole.entities.AnalyticsSnapshot.create({
            metric_name: 'gsc_impressions', metric_type: 'count', value: totalImpressions,
            period: '30d', source: domain, recorded_at: now,
          });
        }
      } catch (err: any) {
        results.errors.push(`GSC: ${err.message}`);
      }

      // ═══ 2. Google Analytics ═══
      try {
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_analytics');
        const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

        const adminRes = await fetch(`${GA_ADMIN}/accountSummaries`, { headers });
        const adminData = await adminRes.json();
        const allProperties: any[] = [];
        for (const acc of adminData.accountSummaries || []) {
          for (const prop of acc.propertySummaries || []) {
            allProperties.push({
              property_id: prop.property.replace('properties/', ''),
              display_name: prop.displayName,
            });
          }
        }

        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 29);
        const fmt = (d: Date) => d.toISOString().split('T')[0];

        for (const domain of TARGET_DOMAINS) {
          const domainKey = domain.replace(/\.(com|net|org)$/, '');
          const matching = allProperties.filter((p: any) =>
            p.display_name.toLowerCase().includes(domainKey) ||
            p.display_name.toLowerCase().includes(domain)
          );

          if (matching.length === 0) {
            results.ga.push({ domain, status: 'not_found' });
            continue;
          }

          const propertyId = matching[0].property_id;

          // Overview
          const overviewRes = await fetch(`${GA_DATA}/properties/${propertyId}:runReport`, {
            method: 'POST', headers,
            body: JSON.stringify({
              dateRanges: [{ startDate: fmt(start), endDate: fmt(end) }],
              metrics: [
                { name: 'sessions' }, { name: 'totalUsers' },
                { name: 'screenPageViews' }, { name: 'newUsers' },
              ],
            }),
          });
          const overviewData = await overviewRes.json();
          const totals = overviewData.rows?.[0]?.metricValues || [];

          // Daily traffic
          const dailyRes = await fetch(`${GA_DATA}/properties/${propertyId}:runReport`, {
            method: 'POST', headers,
            body: JSON.stringify({
              dateRanges: [{ startDate: fmt(start), endDate: fmt(end) }],
              dimensions: [{ name: 'date' }],
              metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'screenPageViews' }],
              orderBys: [{ dimension: { dimensionName: 'date' } }],
              limit: 30,
            }),
          });
          const dailyData = await dailyRes.json();
          const daily = (dailyData.rows || []).map((r: any) => ({
            date: r.dimensionValues[0].value,
            sessions: Number(r.metricValues[0]?.value || 0),
            users: Number(r.metricValues[1]?.value || 0),
            page_views: Number(r.metricValues[2]?.value || 0),
          }));

          const overview = {
            sessions: Number(totals[0]?.value || 0),
            users: Number(totals[1]?.value || 0),
            page_views: Number(totals[2]?.value || 0),
            new_users: Number(totals[3]?.value || 0),
          };

          results.ga.push({ domain, propertyId, displayName: matching[0].display_name, overview, daily });

          await base44.asServiceRole.entities.AnalyticsSnapshot.create({
            metric_name: 'ga_sessions', metric_type: 'count', value: overview.sessions,
            period: '30d', source: domain, recorded_at: now,
          });
          await base44.asServiceRole.entities.AnalyticsSnapshot.create({
            metric_name: 'ga_users', metric_type: 'count', value: overview.users,
            period: '30d', source: domain, recorded_at: now,
          });
        }
      } catch (err: any) {
        results.errors.push(`GA: ${err.message}`);
      }

      // ═══ 3. GoDaddy domain portfolio ═══
      try {
        const token = secrets.get('GODADDY_API_KEY');
        if (token) {
          const gdRes = await fetch(`${GODADDY_BASE}/domains`, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          });
          if (gdRes.ok) {
            const domains = await gdRes.json();
            results.godaddy = {
              total: domains.length,
              domains: domains.map((d: any) => ({
                domain: d.domain, status: d.status, expires: d.expires, renewAuto: d.renewAuto,
              })),
            };
            await base44.asServiceRole.entities.AnalyticsSnapshot.create({
              metric_name: 'godaddy_domains', metric_type: 'count', value: domains.length,
              period: '1d', source: 'godaddy', recorded_at: now,
            });
          }
        }
      } catch (err: any) {
        results.errors.push(`GoDaddy: ${err.message}`);
      }

      // ═══ 4. Lead growth — last 3 months ═══
      try {
        const leadAgg = await base44.asServiceRole.entities.Lead.aggregate({
          dateBucket: { field: 'created_date', unit: 'month' },
          sort: '_id',
          limit: 3,
        });
        results.leads = { monthly: leadAgg.rows || [] };

        const currentMonth = (leadAgg.rows || []).slice(-1)[0]?.count || 0;
        await base44.asServiceRole.entities.AnalyticsSnapshot.create({
          metric_name: 'leads_monthly', metric_type: 'count', value: currentMonth,
          period: '30d', source: 'lead_entity', recorded_at: now,
        });

        // Lead status breakdown
        const statusAgg = await base44.asServiceRole.entities.Lead.aggregate({
          groupBy: 'status', sort: '-count', limit: 20,
        });
        results.leads.statusBreakdown = statusAgg.rows || [];
      } catch (err: any) {
        results.errors.push(`Leads: ${err.message}`);
      }

      // Mark sync complete
      await base44.asServiceRole.entities.AnalyticsSnapshot.create({
        metric_name: 'system_sync_complete', metric_type: 'count', value: 1,
        period: '1d', source: 'system', recorded_at: now,
      });

      return Response.json({ ok: true, syncedAt: now, targetDomains: TARGET_DOMAINS, results });
    }

    // ── GET DASHBOARD DATA (read for UI) ──
    if (action === 'getDashboard') {
      // Latest sync snapshots (last 24h)
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const snapshots = await base44.asServiceRole.entities.AnalyticsSnapshot.filter(
        { recorded_at: { $gte: since } },
        { sort: '-recorded_at', limit: 200 }
      );

      // Lead growth — last 3 months
      const leadAgg = await base44.asServiceRole.entities.Lead.aggregate({
        dateBucket: { field: 'created_date', unit: 'month' },
        sort: '_id', limit: 3,
      });

      // Lead status breakdown
      const statusAgg = await base44.asServiceRole.entities.Lead.aggregate({
        groupBy: 'status', sort: '-count', limit: 20,
      });

      // Last sync time
      const lastSync = await base44.asServiceRole.entities.AnalyticsSnapshot.filter(
        { metric_name: 'system_sync_complete' },
        { sort: '-recorded_at', limit: 1 }
      );

      return Response.json({
        ok: true,
        lastSync: lastSync.items?.[0]?.recorded_at || null,
        snapshots: snapshots.items || [],
        leadGrowth: leadAgg.rows || [],
        leadStatusBreakdown: statusAgg.rows || [],
      });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('[systemPerformanceSync] Fatal:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}