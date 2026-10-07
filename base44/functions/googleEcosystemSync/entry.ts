import { createClientFromRequest } from "npm:@base44/sdk@0.8.48";

// Google Ecosystem Sync — multi-domain Search Console + Analytics + Contacts
// Supports BOTH epoxyquotenearme.com (Xtreme Polishing) AND strategicmindsai.com (Strategic Minds AI)

const DOMAINS = {
  xtreme: {
    name: "Xtreme Polishing Systems",
    domain: "epoxygaragefloorestimate.com",
    property_match: "epoxygaragefloorestimate",
  },
  strategic_minds: {
    name: "Strategic Minds AI",
    domain: "strategicmindsadvisory.com",
    property_match: "strategicmindsadvisory",
  },
};

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { action, domain_key, days = 28 } = body;

    switch (action) {
      // ── STATUS: Check all Google connectors and properties ──
      case "status": {
        const results = {};

        // Check Search Console
        try {
          const { accessToken } = await base44.asServiceRole.connectors.getConnection("google_search_console");
          const scRes = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const scData = await scRes.json();
          results.search_console = {
            connected: true,
            properties: (scData.siteEntry || []).map((s) => ({
              url: s.siteUrl,
              permission: s.permissionLevel,
            })),
          };
        } catch (e) {
          results.search_console = { connected: false, error: e.message };
        }

        // Check Analytics
        try {
          const { accessToken } = await base44.asServiceRole.connectors.getConnection("google_analytics");
          const gaRes = await fetch("https://analyticsadmin.googleapis.com/v1beta/accountSummaries", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const gaData = await gaRes.json();
          results.analytics = {
            connected: true,
            properties: [],
          };
          for (const acc of gaData.accountSummaries || []) {
            for (const prop of acc.propertySummaries || []) {
              results.analytics.properties.push({
                property_id: prop.property.replace("properties/", ""),
                display_name: prop.displayName,
                account: acc.displayName,
              });
            }
          }
        } catch (e) {
          results.analytics = { connected: false, error: e.message };
        }

        // Check Contacts
        try {
          const { accessToken } = await base44.asServiceRole.connectors.getConnection("google_contacts");
          const cRes = await fetch("https://people.googleapis.com/v1/people/me/connections?pageSize=1&personFields=names", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const cData = await cRes.json();
          results.contacts = {
            connected: true,
            total_people: cData.totalItems || 0,
          };
        } catch (e) {
          results.contacts = { connected: false, error: e.message };
        }

        // Check Calendar
        try {
          const { accessToken } = await base44.asServiceRole.connectors.getConnection("googlecalendar");
          results.calendar = { connected: true };
        } catch (e) {
          results.calendar = { connected: false, error: e.message };
        }

        // Check Gmail
        try {
          const { accessToken } = await base44.asServiceRole.connectors.getConnection("gmail");
          results.gmail = { connected: true };
        } catch (e) {
          results.gmail = { connected: false, error: e.message };
        }

        // Check Drive
        try {
          const { accessToken } = await base44.asServiceRole.connectors.getConnection("googledrive");
          results.drive = { connected: true };
        } catch (e) {
          results.drive = { connected: false, error: e.message };
        }

        // Check Tasks
        try {
          const { accessToken } = await base44.asServiceRole.connectors.getConnection("googletasks");
          results.tasks = { connected: true };
        } catch (e) {
          results.tasks = { connected: false, error: e.message };
        }

        // Check Sheets
        try {
          const { accessToken } = await base44.asServiceRole.connectors.getConnection("googlesheets");
          results.sheets = { connected: true };
        } catch (e) {
          results.sheets = { connected: false, error: e.message };
        }

        // Check Docs
        try {
          const { accessToken } = await base44.asServiceRole.connectors.getConnection("googledocs");
          results.docs = { connected: true };
        } catch (e) {
          results.docs = { connected: false, error: e.message };
        }

        return Response.json({ ok: true, connectors: results, domains: DOMAINS });
      }

      // ── SEARCH CONSOLE: Pull data for a specific domain ──
      case "pullSearchConsole": {
        const domainConfig = DOMAINS[domain_key];
        if (!domainConfig) return Response.json({ error: "Invalid domain_key" }, { status: 400 });

        const { accessToken } = await base44.asServiceRole.connectors.getConnection("google_search_console");
        const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };

        // List all properties
        const sitesRes = await fetch("https://www.googleapis.com/webmasters/v3/sites", { headers });
        const sitesData = await sitesRes.json();
        const sites = sitesData.siteEntry || [];

        // Find matching property
        const matched = sites.find((s) =>
          s.siteUrl.toLowerCase().includes(domainConfig.property_match)
        );

        if (!matched) {
          return Response.json({
            error: `No Search Console property found for ${domainConfig.domain}`,
            available: sites.map((s) => s.siteUrl),
          }, { status: 404 });
        }

        const siteUrl = matched.siteUrl;
        const enc = encodeURIComponent(siteUrl);

        // Pull search analytics — last N days
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - (days - 1));
        const fmt = (d) => d.toISOString().slice(0, 10);

        const analyticsRes = await fetch(
          `https://www.googleapis.com/webmasters/v3/sites/${enc}/searchAnalytics/query`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              startDate: fmt(start),
              endDate: fmt(end),
              dimensions: ["query"],
              rowLimit: 1000,
            }),
          }
        );
        const analyticsData = await analyticsRes.json();
        const rows = analyticsData.rows || [];

        // Also pull by page
        const pageRes = await fetch(
          `https://www.googleapis.com/webmasters/v3/sites/${enc}/searchAnalytics/query`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              startDate: fmt(start),
              endDate: fmt(end),
              dimensions: ["page"],
              rowLimit: 1000,
            }),
          }
        );
        const pageData = await pageRes.json();
        const pageRows = pageData.rows || [];

        const totals = rows.reduce(
          (acc, r) => ({
            impressions: acc.impressions + r.impressions,
            clicks: acc.clicks + r.clicks,
          }),
          { impressions: 0, clicks: 0 }
        );

        return Response.json({
          ok: true,
          domain: domainConfig.domain,
          siteUrl,
          date_range: { start: fmt(start), end: fmt(end) },
          totals,
          top_queries: rows.slice(0, 20).map((r) => ({
            query: r.keys[0],
            clicks: r.clicks,
            impressions: r.impressions,
            ctr: r.ctr,
            position: r.position,
          })),
          top_pages: pageRows.slice(0, 20).map((r) => ({
            page: r.keys[0],
            clicks: r.clicks,
            impressions: r.impressions,
            ctr: r.ctr,
            position: r.position,
          })),
        });
      }

      // ── ANALYTICS: Pull GA4 data for a property ──
      case "pullAnalytics": {
        const { property_id } = body;
        if (!property_id) return Response.json({ error: "property_id required" }, { status: 400 });

        const { accessToken } = await base44.asServiceRole.connectors.getConnection("google_analytics");
        const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };

        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - (days - 1));
        const fmt = (d) => d.toISOString().split("T")[0];

        // Overview
        const overviewRes = await fetch(
          `https://analyticsdata.googleapis.com/v1beta/properties/${property_id}:runReport`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              dateRanges: [{ startDate: fmt(start), endDate: fmt(end) }],
              metrics: [
                { name: "sessions" },
                { name: "totalUsers" },
                { name: "screenPageViews" },
                { name: "newUsers" },
                { name: "conversions" },
              ],
            }),
          }
        );
        const overviewData = await overviewRes.json();
        const totals = overviewData.rows?.[0]?.metricValues || [];

        // Daily traffic
        const dailyRes = await fetch(
          `https://analyticsdata.googleapis.com/v1beta/properties/${property_id}:runReport`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              dateRanges: [{ startDate: fmt(start), endDate: fmt(end) }],
              dimensions: [{ name: "date" }],
              metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "screenPageViews" }],
              orderBys: [{ dimension: { dimensionName: "date" } }],
              limit: 365,
            }),
          }
        );
        const dailyData = await dailyRes.json();
        const daily = (dailyData.rows || []).map((r) => ({
          date: r.dimensionValues[0].value,
          sessions: Number(r.metricValues[0].value || 0),
          users: Number(r.metricValues[1].value || 0),
          page_views: Number(r.metricValues[2].value || 0),
        }));

        // Top pages
        const pagesRes = await fetch(
          `https://analyticsdata.googleapis.com/v1beta/properties/${property_id}:runReport`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              dateRanges: [{ startDate: fmt(start), endDate: fmt(end) }],
              dimensions: [{ name: "pagePath" }],
              metrics: [{ name: "screenPageViews" }, { name: "sessions" }],
              orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
              limit: 20,
            }),
          }
        );
        const pagesData = await pagesRes.json();
        const pages = (pagesData.rows || []).map((r) => ({
          path: r.dimensionValues[0].value,
          page_views: Number(r.metricValues[0].value || 0),
          sessions: Number(r.metricValues[1].value || 0),
        }));

        // Traffic sources
        const sourcesRes = await fetch(
          `https://analyticsdata.googleapis.com/v1beta/properties/${property_id}:runReport`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              dateRanges: [{ startDate: fmt(start), endDate: fmt(end) }],
              dimensions: [{ name: "sessionDefaultChannelGroup" }],
              metrics: [{ name: "sessions" }, { name: "totalUsers" }],
              orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
              limit: 10,
            }),
          }
        );
        const sourcesData = await sourcesRes.json();
        const sources = (sourcesData.rows || []).map((r) => ({
          channel: r.dimensionValues[0].value,
          sessions: Number(r.metricValues[0].value || 0),
          users: Number(r.metricValues[1].value || 0),
        }));

        return Response.json({
          ok: true,
          property_id,
          date_range: { start: fmt(start), end: fmt(end) },
          overview: {
            sessions: Number(totals[0]?.value || 0),
            users: Number(totals[1]?.value || 0),
            page_views: Number(totals[2]?.value || 0),
            new_users: Number(totals[3]?.value || 0),
            conversions: Number(totals[4]?.value || 0),
          },
          daily,
          pages,
          sources,
        });
      }

      // ── CONTACTS: Sync leads to Google Contacts ──
      case "syncContacts": {
        const { accessToken } = await base44.asServiceRole.connectors.getConnection("google_contacts");
        const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };

        // Get leads that haven't been synced yet
        const leads = await base44.entities.Lead.list(100);
        let synced = 0;
        let skipped = 0;
        let errors = 0;

        for (const lead of leads) {
          if (!lead.email) {
            skipped++;
            continue;
          }

          // Check if contact already exists by email
          try {
            const searchRes = await fetch(
              `https://people.googleapis.com/v1/people:searchContacts?query=${encodeURIComponent(lead.email)}&readMask=emailAddresses,names`,
              { headers }
            );
            const searchData = await searchRes.json();
            if (searchData.results && searchData.results.length > 0) {
              skipped++;
              continue;
            }
          } catch {
            // Search might fail, proceed with create
          }

          // Create contact
          try {
            const createRes = await fetch("https://people.googleapis.com/v1/people:createContact", {
              method: "POST",
              headers,
              body: JSON.stringify({
                names: [
                  {
                    givenName: lead.first_name || "",
                    familyName: lead.last_name || "",
                  },
                ],
                emailAddresses: [{ value: lead.email, type: "WORK" }],
                phoneNumbers: lead.phone ? [{ value: lead.phone, type: "WORK" }] : [],
                organizations: [
                  {
                    title: "Lead",
                    department: lead.lead_type || "homeowner",
                  },
                ],
              }),
            });
            if (createRes.ok) {
              synced++;
            } else {
              errors++;
            }
          } catch (e) {
            errors++;
          }
        }

        return Response.json({
          ok: true,
          synced,
          skipped,
          errors,
          total: leads.length,
        });
      }

      // ── CONTACTS: List all contacts ──
      case "listContacts": {
        const { accessToken } = await base44.asServiceRole.connectors.getConnection("google_contacts");
        const { page_size = 50 } = body;

        const res = await fetch(
          `https://people.googleapis.com/v1/people/me/connections?pageSize=${page_size}&personFields=names,emailAddresses,phoneNumbers,organizations`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        const data = await res.json();

        return Response.json({
          ok: true,
          total: data.totalItems || 0,
          contacts: (data.connections || []).map((c) => ({
            resource_name: c.resourceName,
            name: c.names?.[0]?.displayName || "",
            email: c.emailAddresses?.[0]?.value || "",
            phone: c.phoneNumbers?.[0]?.value || "",
            organization: c.organizations?.[0]?.name || "",
          })),
        });
      }

      // ── TASKS: List task lists ──
      case "listTaskLists": {
        const { accessToken } = await base44.asServiceRole.connectors.getConnection("googletasks");
        const res = await fetch("https://tasks.googleapis.com/tasks/v1/users/@me/lists", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        return Response.json({
          ok: true,
          task_lists: (data.items || []).map((t) => ({
            id: t.id,
            title: t.title,
            updated: t.updated,
          })),
        });
      }

      // ── VAULT: Seed all Google credentials ──
      case "seedVault": {
        const googleSecrets = [
          { name: "Google Cloud Credentials JSON", category: "credential", service: "google_cloud", key_name: "GOOGLE_CREDENTIALS_JSON", is_secret: true },
          { name: "Google AI API Key", category: "api_key", service: "google_ai", key_name: "GOOGLE_AI_API_KEY", is_secret: true },
          { name: "Google OAuth Client ID", category: "credential", service: "google_oauth", key_name: "GOOGLE_CLIENT_ID", is_secret: false },
          { name: "Google OAuth Client Secret", category: "credential", service: "google_oauth", key_name: "GOOGLE_CLIENT_SECRET", is_secret: true },
          { name: "Search Console Connector", category: "sync_config", service: "google_search_console", key_name: "google_search_console", is_secret: false },
          { name: "Analytics Connector", category: "sync_config", service: "google_analytics", key_name: "google_analytics", is_secret: false },
          { name: "Contacts Connector", category: "sync_config", service: "google_contacts", key_name: "google_contacts", is_secret: false },
          { name: "Calendar Connector", category: "sync_config", service: "googlecalendar", key_name: "googlecalendar", is_secret: false },
          { name: "Gmail Connector", category: "sync_config", service: "gmail", key_name: "gmail", is_secret: false },
          { name: "Drive Connector", category: "sync_config", service: "googledrive", key_name: "googledrive", is_secret: false },
          { name: "Tasks Connector", category: "sync_config", service: "googletasks", key_name: "googletasks", is_secret: false },
          { name: "Sheets Connector", category: "sync_config", service: "googlesheets", key_name: "googlesheets", is_secret: false },
          { name: "Docs Connector", category: "sync_config", service: "googledocs", key_name: "googledocs", is_secret: false },
          { name: "Slides Connector", category: "sync_config", service: "googleslides", key_name: "googleslides", is_secret: false },
          { name: "Forms Connector", category: "sync_config", service: "googleforms", key_name: "googleforms", is_secret: false },
          { name: "Photos Connector", category: "sync_config", service: "google_photos", key_name: "google_photos", is_secret: false },
          { name: "Meet Connector", category: "sync_config", service: "googlemeet", key_name: "googlemeet", is_secret: false },
          { name: "BigQuery Connector", category: "sync_config", service: "googlebigquery", key_name: "googlebigquery", is_secret: false },
          { name: "Classroom Connector", category: "sync_config", service: "google_classroom", key_name: "google_classroom", is_secret: false },
        ];

        // Check existing vault entries
        const existing = await base44.entities.VaultEntry.list(200);
        const existingNames = new Set(existing.map((e) => e.name));

        const toCreate = googleSecrets.filter((s) => !existingNames.has(s.name));
        if (toCreate.length > 0) {
          await base44.entities.VaultEntry.bulkCreate(
            toCreate.map((s) => ({
              ...s,
              active: true,
              notes: `Auto-seeded by Google Ecosystem Sync — ${s.service}`,
            }))
          );
        }

        return Response.json({
          ok: true,
          seeded: toCreate.length,
          already_existed: googleSecrets.length - toCreate.length,
          total: googleSecrets.length,
        });
      }

      default:
        return Response.json({ error: "Unknown action. Use: status, pullSearchConsole, pullAnalytics, syncContacts, listContacts, listTaskLists, seedVault" }, { status: 400 });
    }
  } catch (error) {
    console.error("[googleEcosystemSync] error:", error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}