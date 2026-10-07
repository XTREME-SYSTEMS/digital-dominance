import { createClientFromRequest } from "npm:@base44/sdk@0.8.48";
import { waitUntil } from "base44:runtime";

// XPS SITE INGESTOR
// Crawls xtremepolishingsystems.com end-to-end: pages, images, color charts,
// products, and content. Stores everything in IngestedWebsite records for
// the Universal Template Studio to use when building brand templates.

const XPS_BASE = "https://xtremepolishingsystems.com";

// Key pages to crawl — covers the main site structure
const SEED_PAGES = [
  { path: "/", label: "Homepage", type: "homepage" },
  { path: "/pages/locations", label: "Locations", type: "locations" },
  { path: "/pages/shop-by-system-metallic", label: "Metallic Systems", type: "system" },
  { path: "/pages/epoxy-flake-floor-system", label: "Flake Systems", type: "system" },
  { path: "/collections/epoxy-floor-coatings", label: "Epoxy Coatings", type: "collection" },
  { path: "/collections/flake-flooring-epoxy-coating", label: "Flake Flooring", type: "collection" },
  { path: "/collections/decorative-concrete-dyes-stains", label: "Dyes & Stains", type: "collection" },
  { path: "/collections/grinding-polishing-machines", label: "Machines", type: "collection" },
  { path: "/collections/all", label: "All Products", type: "collection" },
];

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; XPSIngestor/1.0)" },
      redirect: "follow",
    });
    if (!res.ok) return { ok: false, status: res.status, text: "" };
    const text = await res.text();
    return { ok: true, status: res.status, text };
  } catch (e) {
    return { ok: false, status: 0, text: "", error: e.message };
  }
}

// Extract all image URLs from an HTML page (Shopify CDN images)
function extractImages(html, baseUrl) {
  const images = new Set();
  // Match src="..." and data-src="..." in img tags
  const imgRegex = /<(?:img|source)[^>]+(?:src|data-src|data-original)=["']([^"']+)["']/gi;
  let m;
  while ((m = imgRegex.exec(html)) !== null) {
    let url = m[1];
    if (!url) continue;
    // Resolve relative URLs
    if (url.startsWith("//")) url = "https:" + url;
    else if (url.startsWith("/")) url = XPS_BASE + url;
    else if (!url.startsWith("http")) continue;
    // Only keep Shopify CDN and product images
    if (url.includes("xtremepolishingsystems.com") || url.includes("shopify.com") || url.includes("loox.io")) {
      // Strip query params for dedup but keep the base image
      const clean = url.split("?")[0];
      images.add(clean);
    }
  }
  // Also extract from CSS background-image and og:image meta
  const bgRegex = /background-image:\s*url\(["']?([^"')]+)["']?\)/gi;
  while ((m = bgRegex.exec(html)) !== null) {
    let url = m[1];
    if (url.startsWith("//")) url = "https:" + url;
    else if (url.startsWith("/")) url = XPS_BASE + url;
    if (url.includes("xtremepolishingsystems.com")) images.add(url.split("?")[0]);
  }
  const ogRegex = /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i;
  const og = ogRegex.exec(html);
  if (og) images.add(og[1].split("?")[0]);
  return [...images];
}

// Extract product cards from a Shopify collection page
function extractProducts(html) {
  const products = [];
  // Shopify product links: /products/slug
  const prodRegex = /href="\/products\/([a-z0-9-]+)"/gi;
  const seen = new Set();
  let m;
  while ((m = prodRegex.exec(html)) !== null) {
    const slug = m[1];
    if (seen.has(slug)) continue;
    seen.add(slug);
    products.push({ slug, url: `${XPS_BASE}/products/${slug}` });
  }
  return products;
}

// Extract page title and meta description
function extractMeta(html) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const descMatch = html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i);
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  return {
    title: titleMatch ? titleMatch[1].trim() : "",
    description: descMatch ? descMatch[1].trim() : "",
    h1: h1Match ? h1Match[1].trim() : "",
  };
}

// Extract color chart images specifically (ColorCard pattern)
function extractColorCharts(html) {
  const charts = new Set();
  const regex = /(https?:\/\/[^\s"']+ColorCard[^\s"']+\.(?:jpg|jpeg|png|webp))/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    charts.add(m[1].split("?")[0]);
  }
  return [...charts];
}

// Extract all internal links for further crawling
function extractLinks(html) {
  const links = new Set();
  const regex = /href="\/(pages\/[^"']+)"/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    links.add("/" + m[1]);
  }
  const collRegex = /href="\/(collections\/[^"']+)"/gi;
  while ((m = collRegex.exec(html)) !== null) {
    links.add("/" + m[1]);
  }
  return [...links];
}

async function crawlPage(base44, page, depth = 0) {
  const url = XPS_BASE + page.path;
  console.log(`[XPS Ingestor] Crawling: ${url}`);
  const res = await fetchPage(url);
  if (!res.ok) {
    return { page, ok: false, error: `HTTP ${res.status}` };
  }
  const html = res.text;
  const meta = extractMeta(html);
  const images = extractImages(html, url);
  const products = extractProducts(html);
  const colorCharts = extractColorCharts(html);
  const links = depth < 1 ? extractLinks(html) : [];

  return { page, ok: true, meta, images, products, colorCharts, links, htmlLength: html.length };
}

async function runIngestion(base44, userId, options) {
  const { maxPages = 15, includeColorCharts = true } = options || {};
  const svc = base44.asServiceRole;

  const websiteId = `XPS-INGEST-${Date.now()}`;
  const record = await svc.entities.IngestedWebsite.create({
    owner_id: userId,
    website_id: websiteId,
    source_name: "xtremepolishingsystems.com",
    source_url: XPS_BASE,
    industry: "epoxy_flooring",
    template_type: "full_site",
    stage: "ingesting",
    created_at: new Date().toISOString(),
  });

  // Run the crawl asynchronously
  waitUntil((async () => {
    try {
      const allImages = new Set();
      const allColorCharts = new Set();
      const allProducts = new Set();
      const pageResults = [];
      const crawled = new Set();
      const queue = [...SEED_PAGES];

      while (queue.length > 0 && pageResults.length < maxPages) {
        const page = queue.shift();
        const urlKey = page.path;
        if (crawled.has(urlKey)) continue;
        crawled.add(urlKey);

        const result = await crawlPage(base44, page, pageResults.length === 0 ? 0 : 1);
        pageResults.push(result);

        if (result.ok) {
          result.images.forEach((img) => allImages.add(img));
          result.colorCharts.forEach((cc) => allColorCharts.add(cc));
          result.products.forEach((p) => allProducts.add(p.url));
          // Queue discovered links
          if (result.links) {
            for (const link of result.links) {
              if (!crawled.has(link) && queue.length < maxPages * 2) {
                queue.push({ path: link, label: link, type: "discovered" });
              }
            }
          }
        }
        // Small delay to be polite
        await new Promise((r) => setTimeout(r, 300));
      }

      const imageList = [...allImages];
      const colorChartList = [...allColorCharts];
      const productList = [...allProducts];

      const organized = {
        total_pages: pageResults.length,
        pages: pageResults.map((r) => ({
          path: r.page.path,
          label: r.page.label,
          type: r.page.type,
          ok: r.ok,
          title: r.meta?.title || "",
          description: r.meta?.description || "",
          h1: r.meta?.h1 || "",
          image_count: r.images?.length || 0,
          product_count: r.products?.length || 0,
          color_chart_count: r.colorCharts?.length || 0,
        })),
        images: imageList.slice(0, 500),
        color_charts: colorChartList,
        products: productList.slice(0, 200).map((url) => {
          const slug = url.split("/products/")[1];
          return { slug, url, name: slug?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "" };
        }),
        stats: {
          total_images: imageList.length,
          total_color_charts: colorChartList.length,
          total_products: productList.length,
          total_pages_crawled: pageResults.length,
        },
      };

      await svc.entities.IngestedWebsite.update(record.id, {
        raw_content: JSON.stringify(pageResults.map((r) => ({ path: r.page.path, meta: r.meta, ok: r.ok })).slice(0, 50)).slice(0, 49000),
        cleaned_content: JSON.stringify(organized.pages).slice(0, 49000),
        parsed_structure: JSON.stringify({ stats: organized.stats }).slice(0, 29000),
        organized_content: JSON.stringify(organized).slice(0, 49000),
        stage: "completed",
        processed_at: new Date().toISOString(),
        screenshot_url: imageList[0] || "",
      });

      console.log(`[XPS Ingestor] Complete: ${organized.stats.total_images} images, ${organized.stats.total_color_charts} color charts, ${organized.stats.total_products} products`);
    } catch (e) {
      console.error("[XPS Ingestor] Pipeline failed:", e.message);
      try {
        await svc.entities.IngestedWebsite.update(record.id, {
          stage: "failed",
          error_log: e.message?.slice(0, 4900) || "Unknown error",
          processed_at: new Date().toISOString(),
        });
      } catch { /* ignore */ }
    }
  })());

  return { ok: true, website_id: websiteId, message: "XPS site ingestion started — crawling pages, images, color charts, and products" };
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Admin access required" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || "start";

    if (action === "start") {
      return Response.json(await runIngestion(base44, user.id, body));
    }

    if (action === "status") {
      const page = await base44.asServiceRole.entities.IngestedWebsite.filter(
        { source_name: "xtremepolishingsystems.com" },
        { sort: "-created_date", limit: 5 }
      );
      return Response.json({ records: page.items || [] });
    }

    if (action === "get") {
      const { website_id } = body;
      if (!website_id) return Response.json({ error: "website_id required" }, { status: 400 });
      const rec = await base44.asServiceRole.entities.IngestedWebsite.filter({ website_id });
      return Response.json({ record: (rec.items || [])[0] || null });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error("[XPS Ingestor] Error:", e);
    return Response.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}