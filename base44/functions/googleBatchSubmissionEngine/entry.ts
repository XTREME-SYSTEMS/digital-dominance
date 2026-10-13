import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { logStep } from "../../shared/sopLog.ts";

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
        });
      }
    }
    return properties;
  } catch {
    return [];
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
    const { mode } = body; // 'all' | 'canonical_only' | undefined = all

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
    if (gaToken) {
      ga4Properties = await listGA4Properties(gaToken);
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
      results,
      completed_at: new Date().toISOString(),
    };

    await logStep(base44, {
      category: "seo",
      action: "Google batch submission engine",
      detail: `${sitemapsGenerated} sitemaps, ${gscSubmitted} GSC submissions, ${indexNowSubmitted} IndexNow pings, ${totalUrls} total URLs, ${ga4Properties.length} GA4 properties`,
      source: "googleBatchSubmissionEngine",
    });

    return Response.json(summary);
  } catch (error: any) {
    console.error("[googleBatchSubmissionEngine] error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}