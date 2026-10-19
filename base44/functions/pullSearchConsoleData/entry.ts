import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { logStep } from "../../shared/sopLog.ts";

// Search Console data puller — Alpha Prime Phase 6B
// P0 FIX: Removed hardcoded epoxygaragefloorestimate.com
// P0 FIX: Uses CanonicalSiteRegistry for domain identity
// P0 FIX: Uses ["page","query"] dimensions together (not separate)
// P0 FIX: Does not attach global top_queries to individual pages
// P0 FIX: URL inspection uses canonical URLs from CanonicalLocationRegistry
// P0 FIX: Never uses sites[0] — exact match only or BLOCKED

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("google_search_console");
    const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };

    // 1. Read canonical domain from CanonicalSiteRegistry
    const registryResults = await base44.asServiceRole.entities.CanonicalSiteRegistry.list(1);
    const registry = registryResults[0];
    if (!registry || !registry.canonical_domain) {
      return Response.json({
        error: "BLOCKED: CanonicalSiteRegistry has no canonical_domain",
        data_quarantine: true,
      }, { status: 503 });
    }
    const canonicalDomain = registry.canonical_domain.toLowerCase();
    const canonicalProtocol = registry.canonical_protocol || "https";
    const canonicalBase = `${canonicalProtocol}://${canonicalDomain}`;

    // 2. Enumerate ALL Search Console properties (read-only)
    const sitesRes = await fetch("https://www.googleapis.com/webmasters/v3/sites", { headers });
    const sitesData = await sitesRes.json();
    if (!sitesRes.ok) return Response.json({ error: "Search Console sites list failed", detail: sitesData }, { status: 502 });
    const sites = sitesData.siteEntry || [];

    // 3. Select exact match using deterministic precedence — NEVER sites[0]
    let matchedProperty = null;
    let matchType = null;

    // Precedence 1: sc-domain:epoxyquotenearme.com
    const scDomain = sites.find(s => s.siteUrl.toLowerCase() === `sc-domain:${canonicalDomain}`);
    if (scDomain) {
      matchedProperty = scDomain;
      matchType = "sc-domain";
    }

    // Precedence 2: exact URL-prefix property for https://epoxyquotenearme.com/
    if (!matchedProperty) {
      const urlPrefix = sites.find(s => s.siteUrl.toLowerCase() === `${canonicalBase}/`);
      if (urlPrefix) {
        matchedProperty = urlPrefix;
        matchType = "url-prefix";
      }
    }

    // Diagnostic mode is strictly read-only: enumerate the available properties,
    // show the deterministic exact match, and exit before registry/content writes.
    if (body.action === "diagnose") {
      return Response.json({
        ok: Boolean(matchedProperty),
        diagnostic_only: true,
        canonicalDomain,
        canonicalBase,
        registry_property: registry.google_search_console_property || null,
        expected_properties: [
          `sc-domain:${canonicalDomain}`,
          `${canonicalBase}/`,
        ],
        matched_property: matchedProperty?.siteUrl || null,
        match_type: matchType,
        available_properties: sites.map((s) => ({
          url: s.siteUrl,
          permission: s.permissionLevel,
        })),
      });
    }

    // Precedence 3: BLOCKED — do not silently use a different property
    if (!matchedProperty) {
      await base44.asServiceRole.entities.CanonicalSiteRegistry.update(registry.id, {
        google_search_console_property: "BLOCKED_NOT_FOUND",
      });
      return Response.json({
        error: `BLOCKED: No exact Search Console property found for ${canonicalDomain}`,
        available_properties: sites.map(s => ({ url: s.siteUrl, permission: s.permissionLevel })),
        remediation: `Add and verify sc-domain:${canonicalDomain} or URL-prefix ${canonicalBase}/ at https://search.google.com/search-console`,
      }, { status: 404 });
    }

    const siteUrl = matchedProperty.siteUrl;
    const enc = encodeURIComponent(siteUrl);

    // Persist verified property to CanonicalSiteRegistry
    await base44.asServiceRole.entities.CanonicalSiteRegistry.update(registry.id, {
      google_search_console_property: siteUrl,
    });

    // 4. Search analytics — last 28 days with ["page","query"] dimensions TOGETHER
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 27);
    const fmt = (d) => d.toISOString().slice(0, 10);

    const allRows = [];
    let startRow = 0;
    const rowLimit = 5000;
    // Deterministic pagination
    while (true) {
      const analyticsRes = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${enc}/searchAnalytics/query`, {
        method: "POST", headers,
        body: JSON.stringify({
          startDate: fmt(start),
          endDate: fmt(end),
          dimensions: ["page", "query"],
          rowLimit,
          startRow,
        }),
      });
      const analyticsData = await analyticsRes.json();
      const rows = analyticsData.rows || [];
      allRows.push(...rows);
      if (rows.length < rowLimit) break;
      startRow += rowLimit;
    }

    // Group by page — each page gets its OWN queries (not global)
    const pageMap = new Map();
    for (const row of allRows) {
      const pageUrl = row.keys[0];
      const query = row.keys[1];
      if (!pageMap.has(pageUrl)) {
        pageMap.set(pageUrl, {
          queries: [],
          impressions: 0,
          clicks: 0,
          positionSum: 0,
          queryCount: 0,
        });
      }
      const entry = pageMap.get(pageUrl);
      entry.queries.push({
        query,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      });
      entry.impressions += row.impressions;
      entry.clicks += row.clicks;
      entry.positionSum += row.position * row.impressions;
      entry.queryCount++;
    }

    // Sort queries per page by impressions (descending)
    for (const entry of pageMap.values()) {
      entry.queries.sort((a, b) => b.impressions - a.impressions);
    }

    // 5. Persist per-page performance with PAGE-SPECIFIC queries to SeoContent
    const existing = await base44.asServiceRole.entities.SeoContent.list(200);
    const byRoute = new Map(existing.map((r) => [r.route, r]));

    for (const [pageUrl, entry] of pageMap) {
      let path = pageUrl.replace(canonicalBase, "");
      if (path && !path.startsWith("/")) path = "/" + path;
      if (!path) path = "/";

      const perf = {
        canonical_url: pageUrl,
        impressions: entry.impressions,
        clicks: entry.clicks,
        ctr: entry.impressions > 0 ? entry.clicks / entry.impressions : 0,
        avg_position: entry.impressions > 0 ? entry.positionSum / entry.impressions : 0,
        snapshot_at: new Date().toISOString(),
        top_queries: entry.queries.slice(0, 10),
        data_state: "page_query_attributed",
        property_id: siteUrl,
        date_range: { start: fmt(start), end: fmt(end) },
        retrieved_at: new Date().toISOString(),
      };

      const rec = byRoute.get(path);
      if (rec) {
        await base44.asServiceRole.entities.SeoContent.update(rec.id, { performance_snapshot: perf });
      } else {
        const created = await base44.asServiceRole.entities.SeoContent.create({
          route: path,
          performance_snapshot: perf,
          version: 1,
        });
        byRoute.set(path, created);
      }
    }

    // 6. URL inspection for canonical URLs from CanonicalLocationRegistry (not hardcoded paths)
    const registryLocations = await base44.asServiceRole.entities.CanonicalLocationRegistry.list(50);
    const inspections = [];
    for (const loc of registryLocations) {
      const inspectionUrl = loc.canonical_url;
      if (!inspectionUrl) continue;
      try {
        const ir = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
          method: "POST", headers,
          body: JSON.stringify({ inspectionUrl, siteUrl, languageCode: "en-US" }),
        });
        const idata = await ir.json();
        const insp = idata.inspectionResult || {};
        const isr = insp.indexStatusResult || {};
        inspections.push({
          inspection_url: inspectionUrl,
          property_id: siteUrl,
          verdict: isr.verdict || "NOT_INSPECTED",
          coverage_state: isr.coverageState || "UNKNOWN",
          indexing_state: isr.indexingState || "UNKNOWN",
          last_crawl_time: isr.lastCrawlTime || null,
          google_canonical: isr.googleCanonical || null,
          user_canonical: isr.userCanonical || null,
          robots_state: isr.robotsTxtState || "UNKNOWN",
          inspection_timestamp: new Date().toISOString(),
        });
      } catch (e) {
        inspections.push({
          inspection_url: inspectionUrl,
          property_id: siteUrl,
          verdict: "API_ERROR",
          error: e.message,
          inspection_timestamp: new Date().toISOString(),
        });
      }
    }

    // 7. Totals
    const totals = Array.from(pageMap.values()).reduce((acc, entry) => ({
      impressions: acc.impressions + entry.impressions,
      clicks: acc.clicks + entry.clicks,
      pages: acc.pages + 1,
    }), { impressions: 0, clicks: 0, pages: 0 });

    await logStep(base44, {
      category: "seo",
      action: "Pulled Search Console data with page/query attribution",
      detail: `${totals.impressions} impressions, ${totals.clicks} clicks, ${totals.pages} pages, ${inspections.length} inspections`,
      source: "pullSearchConsoleData",
    });

    return Response.json({
      ok: true,
      siteUrl,
      matchType,
      canonicalDomain,
      pulledAt: new Date().toISOString(),
      totals: {
        impressions: totals.impressions,
        clicks: totals.clicks,
        pages: totals.pages,
      },
      pages: Array.from(pageMap.entries()).map(([url, entry]) => ({
        canonical_url: url,
        path: url.replace(canonicalBase, "") || "/",
        impressions: entry.impressions,
        clicks: entry.clicks,
        page_specific_queries: entry.queries.slice(0, 5).map(q => q.query),
      })),
      inspections,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}