import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { logStep } from "../../shared/sopLog.ts";

const FALLBACK_SITE = "https://epoxyquotenearme.com";
const INDEXNOW_KEY = "a3e6350908f1c2d4e6b8a0123456789a";

const STATIC_PATHS = [
  "/", "/estimate", "/funnel", "/how-it-works", "/gallery", "/reviews",
  "/about", "/contact", "/locations", "/color-charts", "/guides", "/download",
  "/epoxy-garage-floor-cost", "/2-car-garage-epoxy-cost",
  "/3-car-garage-epoxy-cost", "/garage-floor-coating-cost", "/fl/pompano-beach",
];

async function canonicalSite(svc: any): Promise<string> {
  try {
    const rows = await svc.entities.CanonicalSiteRegistry.list("-updated_date", 1);
    const reg = rows?.[0];
    if (reg?.canonical_domain) {
      const protocol = String(reg.canonical_protocol || "https").replace(/:$/, "");
      return `${protocol}://${String(reg.canonical_domain).replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
    }
  } catch {}
  return FALLBACK_SITE;
}

async function buildCanonicalUrls(svc: any, site: string): Promise<string[]> {
  const urls = new Set(STATIC_PATHS.map((path) => `${site}${path === "/" ? "/" : path}`));

  try {
    const locations = await svc.entities.CanonicalLocationRegistry.list(500);
    for (const loc of locations || []) {
      const eligible =
        loc.content_status === "published" &&
        loc.validation_status === "passed" &&
        loc.serviceability_status === "serviceable" &&
        Number(loc.local_value_score || 0) >= 70;
      if (!eligible) continue;
      const path = String(loc.canonical_path || "").trim();
      const url = String(loc.canonical_url || "").trim();
      if (url.startsWith(site + "/")) urls.add(url.replace(/\/+$/, ""));
      else if (/^\/[a-z]{2}\/[a-z0-9-]+$/i.test(path)) urls.add(`${site}${path}`);
    }
  } catch {}

  try {
    const pages = await svc.entities.GeneratedPage.list("-updated_date", 500);
    for (const page of pages || []) {
      const eligible =
        page?.status === "published" &&
        page?.index_eligible !== false &&
        page?.sitemap_eligible !== false &&
        page?.release_authorized !== false;
      if (!eligible || !page?.slug) continue;
      const slug = String(page.slug).replace(/^\/+/, "");
      urls.add(`${site}/${slug}`);
    }
  } catch {}

  return [...urls].filter((url) =>
    url.startsWith(site) &&
    !url.includes(".base44.app") &&
    !url.includes("epoxygaragefloorestimate.com")
  );
}

async function indexNowPost(endpoint: string, site: string, urls: string[]) {
  const host = site.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  try {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key: INDEXNOW_KEY,
        keyLocation: `${site}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      }),
    });
    return { status: r.status, ok: r.ok || r.status === 202 };
  } catch (e: any) {
    return { status: 0, ok: false, error: e.message };
  }
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const site = await canonicalSite(svc);
    if (!site || site.includes(".base44.app") || site.includes("epoxygaragefloorestimate.com")) {
      return Response.json({ error: "Canonical production site unresolved; refusing submission", site }, { status: 409 });
    }

    const urls = await buildCanonicalUrls(svc, site);
    const [central, yandex] = await Promise.all([
      indexNowPost("https://api.indexnow.org/IndexNow", site, urls),
      indexNowPost("https://yandex.com/indexnow", site, urls),
    ]);

    await logStep(base44, {
      category: "seo",
      action: "Submitted canonical URLs to indexers",
      detail: `${urls.length} canonical URLs via IndexNow`,
      meta: `central:${central.status} yandex:${yandex.status} host:${site}`,
      source: "submitToIndexers",
    });

    return Response.json({
      ok: true,
      urls: urls.length,
      sitemap: `${site}/sitemap.xml`,
      sample_urls: urls.slice(0, 10),
      indexNow: central,
      yandex,
      submittedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
