import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { logStep } from "../../shared/sopLog.ts";

const SITE = "https://epoxyquotenearme.com";
const INDEXNOW_KEY = "a3e6350908f1c2d4e6b8a0123456789a";
const HOST = "epoxyquotenearme.com";

// Lightweight IndexNow ping — accepts a single URL or array of URLs and
// submits them to IndexNow (the protocol Bing, Yandex, Seznam & Naver use
// for real-time URL discovery). Called automatically by the Sitemap
// Auto-Update workflow whenever a new GeneratedPage is created, so search
// engines know about the new page within minutes instead of waiting for
// the next crawl cycle.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Accept either { url: "..." } or { urls: [...] }
    let urls: string[] = [];
    if (body.url) urls = [body.url];
    else if (body.urls && Array.isArray(body.urls)) urls = body.urls;
    else return Response.json({ error: "Provide 'url' or 'urls'" }, { status: 400 });

    // DDV3 only permits the canonical production host and only released,
    // evidence-eligible GeneratedPage records. Static/location submissions are
    // handled by submitToIndexers, which has its own eligibility filters.
    urls = urls.filter((u) => u && u.startsWith(SITE + "/"));
    if (!urls.length) return Response.json({ error: "No valid canonical URLs" }, { status: 400 });

    const approvedUrls: string[] = [];
    for (const candidate of urls) {
      const parsed = new URL(candidate);
      const slug = parsed.pathname.replace(/^\/+|\/+$/g, "");
      if (!slug) continue;

      const rows = await base44.asServiceRole.entities.GeneratedPage.filter({ slug }, "-updated_date", 1);
      const page = (rows?.items || rows || [])[0];
      const eligible =
        page?.status === "published" &&
        page?.index_eligible !== false &&
        page?.sitemap_eligible !== false &&
        page?.release_authorized !== false;
      if (eligible) approvedUrls.push(candidate);
    }

    if (!approvedUrls.length) {
      return Response.json({
        error: "No released/index-eligible GeneratedPage URLs",
        code: "DDV3_INDEX_ELIGIBILITY_REQUIRED"
      }, { status: 409 });
    }

    const payload = {
      host: HOST,
      key: INDEXNOW_KEY,
      keyLocation: `https://epoxyquotenearme.com/${INDEXNOW_KEY}.txt`,
      urlList: approvedUrls,
    };

    const post = async (endpoint: string) => {
      try {
        const r = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify(payload),
        });
        return { status: r.status, ok: r.ok || r.status === 202 };
      } catch (e) {
        return { status: 0, ok: false, error: e.message };
      }
    };

    const [central, yandex] = await Promise.all([
      post("https://api.indexnow.org/IndexNow"),
      post("https://yandex.com/indexnow"),
    ]);

    await logStep(base44, {
      category: "seo",
      action: "IndexNow ping for new page",
      detail: `${approvedUrls.length} released URL(s): ${approvedUrls.join(", ")}`,
      meta: `central:${central.status} yandex:${yandex.status}`,
      source: "pingIndexNow",
    });

    return Response.json({
      ok: true,
      urls: approvedUrls.length,
      indexNow: central,
      yandex,
      pingedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}