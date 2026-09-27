import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { logStep } from "../../shared/sopLog.ts";

const SITE = "https://epoxyquotenearme.com";

// Static priority pages with their SEO config.
const STATIC_PATHS = [
  "/", "/estimate", "/funnel", "/how-it-works", "/gallery", "/reviews",
  "/about", "/contact", "/locations", "/color-charts", "/guides", "/download",
  "/epoxy-garage-floor-cost", "/2-car-garage-epoxy-cost",
  "/3-car-garage-epoxy-cost", "/garage-floor-coating-cost",
  "/fl/pompano-beach",
];

function urlEntry(path, lastmod, priority, changefreq) {
  return `  <url>\n    <loc>${SITE}${path}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

// Generates a comprehensive, always-current sitemap XML from all indexable
// sources: static routes, programmatic location pages, and AI-generated
// content pages. Admin-triggered; the output can be copied into sitemap.xml
// or served directly to crawlers.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    // No admin gate — sitemap data is all public (published pages).
    // Allows both admin dashboard calls and workflow service-role calls.

    const now = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Fetch all published GeneratedPage entries for dynamic content URLs.
    const generated = await base44.asServiceRole.entities.GeneratedPage.list(500);
    const published = generated.filter((g) => g.status !== "draft");

    // Fetch CanonicalLocationRegistry — canonical 2-letter state code URLs only
    // Alpha Prime 6B fix: use registry instead of raw WebsiteTemplate URLs (which contain non-canonical state slugs)
    let locationRegistry: any[] = [];
    let skip = 0;
    while (true) {
      const batch: any[] = await base44.asServiceRole.entities.CanonicalLocationRegistry.list(500, skip);
      if (!batch || batch.length === 0) break;
      locationRegistry = locationRegistry.concat(batch);
      if (batch.length < 500) break;
      skip += 500;
    }

    const entries: string[] = [];
    const seenPaths = new Set<string>();

    // Static priority pages
    for (const path of STATIC_PATHS) {
      const priority = path === "/" ? "1.0" : "0.9";
      entries.push(urlEntry(path, now, priority, "weekly"));
      seenPaths.add(path);
    }

    // Location pages from CanonicalLocationRegistry — canonical 2-letter state code URLs only
    for (const loc of locationRegistry) {
      const path = loc.canonical_path;
      if (path && !seenPaths.has(path)) {
        entries.push(urlEntry(path, now, "0.8", "monthly"));
        seenPaths.add(path);
      }
    }

    // AI-generated content pages — use their updated_date for lastmod
    for (const g of published) {
      const path = `/${g.slug}`;
      if (seenPaths.has(path)) continue;
      const lastmod = (g.updated_date || g.created_date || now).split("T")[0];
      entries.push(urlEntry(path, lastmod, "0.7", "monthly"));
      seenPaths.add(path);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

    await logStep(base44, {
      category: "seo",
      action: "Generated dynamic sitemap",
      detail: `${entries.length} URLs (${STATIC_PATHS.length} static, ${locationRegistry.length} location, ${published.length} generated)`,
      source: "generateSitemap",
    });

    return new Response(xml, {
      status: 200,
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}