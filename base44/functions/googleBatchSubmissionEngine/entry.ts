import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { logStep } from "../../shared/sopLog.ts";
import { isEngineConfigured, createSession, navigate, evaluate, closeSession, cleanStaleSessions } from "../../shared/cloudBrowserEngine.ts";

// ═══════════════════════════════════════════════
// GOOGLE BATCH SUBMISSION ENGINE
// Generates all sitemaps, submits to Search Console,
// pings IndexNow, and lists GA4 properties — ALL AT ONCE
// across every deployed/live site in the fleet.
// ═══════════════════════════════════════════════

const INDEXNOW_KEY = "a3e6350908f1c2d4e6b8a0123456789a";
const GA_ADMIN_URL = "https://analyticsadmin.googleapis.com/v1beta";
const GSC_URL = "https://www.googleapis.com/webmasters/v3";

const STATIC_PATHS = [
  "/", "/estimate", "/funnel", "/how-it-works", "/gallery", "/reviews",
  "/about", "/contact", "/locations", "/color-charts", "/guides", "/download",
  "/epoxy-garage-floor-cost", "/2-car-garage-epoxy-cost",
  "/3-car-garage-epoxy-cost", "/garage-floor-coating-cost",
];

function normalizeDomain(url: string): string {
  return String(url || "")
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "")
    .trim();
}

function buildSiteUrl(site: any): string | null {
  const raw = site.generated_url || (site.domain?.startsWith("http") ? site.domain : `https://${site.domain}`);
  if (!raw) return null;
  const d = normalizeDomain(raw);
  if (!d || d.includes(".base44.app") || d.includes("localhost") || d.includes("epoxygaragefloorestimate.com")) return null;
  return `https://${d}`;
}

function buildSitemapXml(siteUrl: string, paths: string[]): string {
  const now = new Date().toISOString().split("T")[0];
  const entries = paths.map((p) => {
    const priority = p === "/" ? "1.0" : p.startsWith("/fl/") ? "0.8" : "0.9";
    const loc = p === "/" ? `${siteUrl}/` : `${siteUrl}${p}`;
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>`;
}

async function getAllSiteUrls(svc: any, siteUrl: string): Promise<string[]> {
  const urls = new Set<string>();
  for (const p of STATIC_PATHS) {
    urls.add(p === "/" ? `${siteUrl}/` : `${siteUrl}${p}`);
  }

  // Location pages
  try {
    const locs = await svc.entities.CanonicalLocationRegistry.list(500);
    for (const loc of locs || []) {
      const path = String(loc.canonical_path || "").trim();
      if (path && /^\/[a-z]{2}\/[a-z0-9-]+$/i.test(path)) {
        urls.add(`${siteUrl}${path}`);
      }
    }
  } catch {}

  // Generated pages
  try {
    const pages = await svc.entities.GeneratedPage.list(500);
    for (const g of pages || []) {
      if (g.status === "draft" || !g.slug) continue;
      urls.add(`${siteUrl}/${String(g.slug).replace(/^\/+/, "")}`);
    }
  } catch {}

  return [...urls];
}

async function pingIndexNow(siteUrl: string, urls: string[]) {
  const host = siteUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const payload = {
    host,
    key: INDEXNOW_KEY,
    keyLocation: `${siteUrl}/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  };
  const post = async (endpoint: string) => {
    try {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });
      return { status: r.status, ok: r.ok || r.status === 202 };
    } catch (e: any) {
      return { status: 0, ok: false, error: e.message };
    }
  };
  const [central, yandex] = await Promise.all([
    post("https://api.indexnow.org/IndexNow"),
    post("https://yandex.com/indexnow"),
  ]);
  return { central, yandex };
}

async function submitSitemapToGSC(accessToken: string, siteUrl: string) {
  const sitemapPath = "sitemap.xml";
  const feedpath = encodeURIComponent(sitemapPath);
  const encodedSite = encodeURIComponent(`${siteUrl}/`);
  try {
    // Add property first
    await fetch(`${GSC_URL}/sites/${encodedSite}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ siteUrl: `${siteUrl}/` }),
      signal: AbortSignal.timeout(10000),
    }).catch(() => {});
    // Submit sitemap
    const res = await fetch(`${GSC_URL}/sites/${encodedSite}/sitemaps/${feedpath}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ path: sitemapPath, type: "sitemap", feedpath: sitemapPath }),
      signal: AbortSignal.timeout(10000),
    });
    const text = await res.text();
    let data: any; try { data = JSON.parse(text); } catch { data = text; }
    return { ok: res.ok || res.status === 204, status: res.status, data };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

async function listGA4Properties(accessToken: string) {
  try {
    const res = await fetch(`${GA_ADMIN_URL}/accountSummaries`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();
    const properties: any[] = [];
    for (const acc of data.accountSummaries || []) {
      for (const prop of acc.propertySummaries || []) {
        properties.push({
          property_id: prop.property.replace("properties/", ""),
          display_name: prop.displayName,
          account: acc.displayName,
          parent: acc.account,
        });
      }
    }
    return properties;
  } catch {
    return [];
  }
}

// List GA4 accounts (needed to create properties — requires a parent account)
async function listGA4Accounts(accessToken: string): Promise<any[]> {
  try {
    const res = await fetch(`${GA_ADMIN_URL}/accounts`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();
    return (data.accounts || []).map((a: any) => ({
      name: a.name, // "accounts/123456"
      displayName: a.displayName,
    }));
  } catch {
    return [];
  }
}

// Create a GA4 property for a site under the given account parent
async function createGA4Property(accessToken: string, accountParent: string, siteUrl: string, displayName: string) {
  const host = normalizeDomain(siteUrl);
  try {
    const res = await fetch(`${GA_ADMIN_URL}/properties`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        parent: accountParent,
        displayName: displayName.slice(0, 80) || host,
        url: siteUrl,
        industryCategory: "CONSTRUCTION",
        timeZone: "America/New_York",
      }),
      signal: AbortSignal.timeout(20000),
    });
    const text = await res.text();
    let data: any; try { data = JSON.parse(text); } catch { data = text; }
    return { ok: res.ok || res.status === 200, status: res.status, data };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

// ═══════════════════════════════════════════════
// GOOGLE TRENDS SEARCH via Cloud Browser
// Navigates to Google Trends explore page, extracts
// interest-over-time, related queries and related topics
// for a keyword (name) and a URL.
// ═══════════════════════════════════════════════

async function searchGoogleTrends(query: string): Promise<any> {
  if (!isEngineConfigured()) {
    return { ok: false, error: "Cloud browser engine not configured" };
  }
  let sessionId: string | null = null;
  try {
    sessionId = await createSession({ timeout_ms: 60000 });
    const trendsUrl = `https://trends.google.com/trends/explore?q=${encodeURIComponent(query)}&geo=US`;
    await navigate(sessionId, trendsUrl);

    // Wait for the trends widgets to render (they load asynchronously)
    await new Promise((r) => setTimeout(r, 4000));

    // Extract interest-over-time, related queries, and related topics via JS
    const script = `JSON.stringify((function() {
      var result = { query: ${JSON.stringify(query)}, interest_over_time: [], related_queries: [], related_topics: [], title: document.title || '' };
      // Interest over time chart — try to grab the numbers from the sparkline/points
      try {
        var iotWidgets = document.querySelectorAll('[widget-name="TIMESERIES"]');
        if (iotWidgets.length > 0) {
          var pts = iotWidgets[0].querySelectorAll('rect, circle');
          var vals = [];
          for (var i = 0; i < pts.length; i++) {
            var v = pts[i].getAttribute('aria-label') || pts[i].getAttribute('data-value');
            if (v) vals.push(v);
          }
          result.interest_over_time = vals.slice(0, 52);
        }
      } catch(e) { result.iot_error = e.message; }
      // Related queries
      try {
        var rqWidgets = document.querySelectorAll('[widget-name="RELATED_QUERIES"]');
        if (rqWidgets.length > 0) {
          var rows = rqWidgets[0].querySelectorAll('tr, [role="row"]');
          for (var i = 0; i < Math.min(rows.length, 15); i++) {
            var cells = rows[i].querySelectorAll('td, [role="cell"]');
            if (cells.length >= 2) {
              result.related_queries.push({
                query: (cells[1].textContent || '').trim(),
                value: (cells[0].textContent || '').trim()
              });
            }
          }
        }
      } catch(e) { result.rq_error = e.message; }
      // Related topics
      try {
        var rtWidgets = document.querySelectorAll('[widget-name="RELATED_TOPICS"]');
        if (rtWidgets.length > 0) {
          var rows = rtWidgets[0].querySelectorAll('tr, [role="row"]');
          for (var i = 0; i < Math.min(rows.length, 15); i++) {
            var cells = rows[i].querySelectorAll('td, [role="cell"]');
            if (cells.length >= 2) {
              result.related_topics.push({
                topic: (cells[1].textContent || '').trim(),
                value: (cells[0].textContent || '').trim()
              });
            }
          }
        }
      } catch(e) { result.rt_error = e.message; }
      return result;
    })())`;

    const evalRes = await evaluate(sessionId, script);
    const rawStr = evalRes.data || evalRes.result || "";
    const data = typeof rawStr === "string" ? JSON.parse(rawStr) : rawStr;
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e.message };
  } finally {
    if (sessionId) await closeSession(sessionId);
  }
}

// Use GPT (InvokeLLM) to synthesize raw Trends data into actionable insights
async function analyzeTrendsWithGPT(svc: any, siteUrl: string, keyword: string, nameTrends: any, urlTrends: any): Promise<any> {
  try {
    const prompt = `You are an SEO and market intelligence analyst. Analyze the following Google Trends data for a website and its primary keyword. Provide a concise, actionable intelligence brief.

SITE: ${siteUrl}
KEYWORD: ${keyword || normalizeDomain(siteUrl)}

GOOGLE TRENDS — NAME SEARCH (${keyword || normalizeDomain(siteUrl)}):
${JSON.stringify(nameTrends?.data || nameTrends || {}).slice(0, 3000)}

GOOGLE TRENDS — URL SEARCH (${normalizeDomain(siteUrl)}):
${JSON.stringify(urlTrends?.data || urlTrends || {}).slice(0, 3000)}

Produce a JSON object with these fields:
- "interest_summary": one sentence on whether interest is rising, falling, or flat
- "top_related_queries": array of up to 5 related search queries (strings)
- "top_related_topics": array of up to 5 related topics (strings)
- "seasonality": one sentence on any seasonal pattern visible
- "opportunity": one sentence on the biggest content or SEO opportunity
- "risk": one sentence on any risk or declining trend
- "recommended_actions": array of up to 3 concrete next actions for this site`;

    const res = await svc.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          interest_summary: { type: "string" },
          top_related_queries: { type: "array", items: { type: "string" } },
          top_related_topics: { type: "array", items: { type: "string" } },
          seasonality: { type: "string" },
          opportunity: { type: "string" },
          risk: { type: "string" },
          recommended_actions: { type: "array", items: { type: "string" } },
        },
      },
    });
    return res;
  } catch (e: any) {
    return { error: e.message };
  }
}

async function processSite(svc: any, site: any, gscToken: string, gaToken: string) {
  const siteUrl = buildSiteUrl(site);
  if (!siteUrl) {
    return { site: site.domain || site.keyword || "unknown", skipped: true, reason: "Invalid or non-canonical URL" };
  }

  const urls = await getAllSiteUrls(svc, siteUrl);
  const sitemapXml = buildSitemapXml(siteUrl, STATIC_PATHS.concat(
    urls.filter((u) => u.startsWith(siteUrl) && !STATIC_PATHS.includes(u.replace(siteUrl, "") === "/" ? "/" : u.replace(siteUrl, "")))
      .map((u) => u.replace(siteUrl, ""))
      .filter((p) => p && p !== "/")
  ));

  // Run all submissions in parallel for this site
  const [indexNow, gscSitemap] = await Promise.all([
    pingIndexNow(siteUrl, urls),
    submitSitemapToGSC(gscToken, siteUrl),
  ]);

  return {
    site: siteUrl,
    domain: normalizeDomain(siteUrl),
    keyword: site.keyword || null,
    sitemap: `${siteUrl}/sitemap.xml`,
    sitemap_xml_length: sitemapXml.length,
    url_count: urls.length,
    index_now: indexNow,
    search_console: gscSitemap,
    sample_urls: urls.slice(0, 5),
  };
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const { mode, provision_ga4, trends_search } = body; // mode: 'all' | 'canonical_only'; provision_ga4: create GA4 properties; trends_search: Google Trends name+URL via cloud browser + GPT synthesis

    // Get tokens (both may not be connected — handle gracefully)
    let gscToken: string | null = null;
    let gaToken: string | null = null;
    try { gscToken = (await svc.connectors.getConnection("google_search_console")).accessToken; } catch {}
    try { gaToken = (await svc.connectors.getConnection("google_analytics")).accessToken; } catch {}

    // Collect all sites to process
    const sites: any[] = [];

    // Always include the canonical site from CanonicalSiteRegistry
    try {
      const reg = await svc.entities.CanonicalSiteRegistry.list("-updated_date", 1);
      if (reg?.[0]?.canonical_domain) {
        const domain = normalizeDomain(reg[0].canonical_domain);
        if (domain && !domain.includes(".base44.app")) {
          sites.push({ domain, generated_url: `https://${domain}`, keyword: "Canonical site" });
        }
      }
    } catch {}

    // Add all live/monitoring sites from WebsiteQueue
    if (mode !== "canonical_only") {
      const queue = await svc.entities.WebsiteQueue.filter(
        { status: { $in: ["live", "monitoring"] } },
        { limit: 500, sort: "-deployed_at" }
      ).catch(() => ({ items: [] }));
      for (const s of (queue.items || [])) {
        const url = buildSiteUrl(s);
        if (url && !sites.some((x) => normalizeDomain(x.generated_url || x.domain) === normalizeDomain(url))) {
          sites.push(s);
        }
      }
    }

    if (sites.length === 0) {
      return Response.json({
        ok: false,
        message: "No live sites found to process. Deploy sites first via Mass Launch or add a CanonicalSiteRegistry entry.",
        gsc_connected: !!gscToken,
        ga_connected: !!gaToken,
      });
    }

    // Process sites in parallel batches of 6
    const BATCH_SIZE = 6;
    const results: any[] = [];
    for (let i = 0; i < sites.length; i += BATCH_SIZE) {
      const batch = sites.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.allSettled(
        batch.map((site) => processSite(svc, site, gscToken || "", gaToken || ""))
      );
      for (const r of batchResults) {
        if (r.status === "fulfilled") results.push(r.value);
        else results.push({ site: "unknown", error: r.reason?.message || "Failed" });
      }
    }

    // GA4 properties listing (one call, not per site)
    let ga4Properties: any[] = [];
    let ga4Accounts: any[] = [];
    let ga4Provisioned: any[] = [];
    let ga4ProvisionErrors: any[] = [];
    if (gaToken) {
      ga4Properties = await listGA4Properties(gaToken);
      if (provision_ga4) {
        ga4Accounts = await listGA4Accounts(gaToken);
        if (ga4Accounts.length === 0) {
          ga4ProvisionErrors.push({ error: "No GA4 accounts found — create a Google Analytics account first at analytics.google.com" });
        } else {
          const accountParent = ga4Accounts[0].name; // use first account
          const existingUrls = new Set(
            ga4Properties.map((p) => normalizeDomain(p.display_name).toLowerCase())
          );
          // Provision a property for each site that doesn't already have one
          const provisionResults = await Promise.allSettled(
            results
              .filter((r) => !r.skipped && r.site && !existingUrls.has(normalizeDomain(r.site).toLowerCase()))
              .map(async (r) => {
                const created = await createGA4Property(gaToken, accountParent, r.site, r.domain || r.keyword || normalizeDomain(r.site));
                return { site: r.site, ...created };
              })
          );
          for (const pr of provisionResults) {
            if (pr.status === "fulfilled") {
              if (pr.value.ok) ga4Provisioned.push(pr.value);
              else ga4ProvisionErrors.push(pr.value);
            } else {
              ga4ProvisionErrors.push({ error: pr.reason?.message || "Unknown" });
            }
          }
          // Re-list to include newly created
          ga4Properties = await listGA4Properties(gaToken);
        }
      }
    }

    // Google Trends search (name + URL) via cloud browser + GPT synthesis
    let trendsResults: any[] = [];
    let trendsErrors: any[] = [];
    if (trends_search) {
      if (!isEngineConfigured()) {
        trendsErrors.push({ error: "Cloud browser engine not configured — set CLOUD_BROWSER_ENGINE_URL and ENGINE_API_KEY secrets" });
      } else {
        // Clean stale sessions first to avoid resource exhaustion
        try { await cleanStaleSessions(); } catch {}
        // Process trends sequentially (cloud browser has limited session capacity)
        for (const r of results) {
          if (r.skipped || !r.site) continue;
          const domain = normalizeDomain(r.site);
          const keyword = r.keyword || domain;
          try {
            const [nameTrends, urlTrends] = await Promise.all([
              searchGoogleTrends(keyword),
              searchGoogleTrends(domain),
            ]);
            const gptAnalysis = await analyzeTrendsWithGPT(svc, r.site, keyword, nameTrends, urlTrends);
            trendsResults.push({
              site: r.site,
              domain,
              keyword,
              name_search: nameTrends,
              url_search: urlTrends,
              gpt_analysis: gptAnalysis,
            });
          } catch (e: any) {
            trendsErrors.push({ site: r.site, error: e.message });
          }
        }
      }
    }

    // Compile summary
    const sitemapsGenerated = results.filter((r) => r.sitemap).length;
    const indexNowSubmitted = results.filter((r) => r.index_now?.central?.ok || r.index_now?.yandex?.ok).length;
    const gscSubmitted = results.filter((r) => r.search_console?.ok).length;
    const totalUrls = results.reduce((sum, r) => sum + (r.url_count || 0), 0);
    const skipped = results.filter((r) => r.skipped).length;

    const summary = {
      ok: true,
      mode: mode || "all",
      provision_ga4: !!provision_ga4,
      trends_search: !!trends_search,
      gsc_connected: !!gscToken,
      ga_connected: !!gaToken,
      total_sites_processed: results.length,
      total_sites_skipped: skipped,
      sitemaps_generated: sitemapsGenerated,
      index_now_submitted: indexNowSubmitted,
      gsc_sitemaps_submitted: gscSubmitted,
      total_urls_across_all_sites: totalUrls,
      ga4_properties_found: ga4Properties.length,
      ga4_properties: ga4Properties,
      ga4_accounts: ga4Accounts,
      ga4_provisioned_count: ga4Provisioned.length,
      ga4_provision_errors: ga4ProvisionErrors,
      trends_results_count: trendsResults.length,
      trends_results: trendsResults,
      trends_errors: trendsErrors,
      results,
      completed_at: new Date().toISOString(),
    };

    await logStep(base44, {
      category: "seo",
      action: "Google batch submission engine",
      detail: `${sitemapsGenerated} sitemaps, ${gscSubmitted} GSC submissions, ${indexNowSubmitted} IndexNow pings, ${totalUrls} total URLs, ${ga4Properties.length} GA4 properties${provision_ga4 ? `, ${ga4Provisioned.length} GA4 provisioned` : ""}${trends_search ? `, ${trendsResults.length} Trends searches` : ""}`,
      source: "googleBatchSubmissionEngine",
    });

    return Response.json(summary);
  } catch (error: any) {
    console.error("[googleBatchSubmissionEngine] error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}