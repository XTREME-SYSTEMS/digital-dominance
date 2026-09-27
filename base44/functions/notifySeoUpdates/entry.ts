import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { logStep } from '../../shared/sopLog.ts';

// Canonical SEO notifier. Production identity comes from CanonicalSiteRegistry;
// never fall back to the Base44 preview host for indexer/Search Console actions.
const FALLBACK_SITE = "https://epoxyquotenearme.com";
const INDEXNOW_KEY = "a3e6350908f1c2d4e6b8a0123456789a";

async function resolveCanonicalSite(svc: any): Promise<string> {
  try {
    const rows = await svc.entities.CanonicalSiteRegistry.list("-updated_date", 1);
    const reg = rows?.[0];
    if (reg?.canonical_domain) {
      const protocol = String(reg.canonical_protocol || "https").replace(/:$/, "");
      return `${protocol}://${String(reg.canonical_domain).replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
    }
  } catch (e: any) {
    console.error("[notifySeoUpdates] CanonicalSiteRegistry read failed:", e.message);
  }

  try {
    const settings = await svc.entities.AppSettings.list(1);
    const configured = settings?.[0]?.seo?.site_url;
    if (configured) {
      const url = String(configured).replace(/\/+$/, "");
      if (!url.includes(".base44.app")) return url;
    }
  } catch (e: any) {
    console.error("[notifySeoUpdates] AppSettings read failed:", e.message);
  }
  return FALLBACK_SITE;
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const windowMin = Number(body.window_minutes) || 35;

    const siteUrl = await resolveCanonicalSite(svc);
    const host = siteUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    if (!host || host.endsWith(".base44.app")) {
      return Response.json({ error: "Canonical custom domain unresolved; refusing indexer submission", site_url: siteUrl }, { status: 409 });
    }

    const since = new Date(Date.now() - windowMin * 60 * 1000).toISOString();
    const all = await svc.entities.SeoContent.list(700);
    const recent = all.filter((p: any) => {
      const upd = p.updated_date || p.created_date || "";
      return upd && upd >= since;
    });

    const urls = recent.map((p: any) => {
      const route = p.route || (p.slug ? `/${p.slug}` : "") || "";
      const clean = route.startsWith("/") ? route : `/${route}`;
      return `${siteUrl}${clean}`;
    }).filter((u: string) => u && u !== siteUrl + "/");

    let indexNow: any = { status: 0, ok: false, detail: "no urls" };
    if (urls.length) {
      const results: any[] = [];
      for (let i = 0; i < urls.length; i += 200) {
        const chunk = urls.slice(i, i + 200);
        try {
          const r = await fetch("https://api.indexnow.org/IndexNow", {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify({
              host,
              key: INDEXNOW_KEY,
              keyLocation: `${siteUrl}/${INDEXNOW_KEY}.txt`,
              urlList: chunk,
            }),
          });
          results.push({ status: r.status, ok: r.ok || r.status === 202, count: chunk.length });
        } catch (e: any) {
          results.push({ status: 0, ok: false, count: chunk.length, error: e.message });
        }
      }
      const okBatches = results.filter((r) => r.ok).length;
      indexNow = {
        status: results[0]?.status || 0,
        ok: okBatches > 0,
        detail: `${okBatches}/${results.length} batches ok (${results.map((r) => r.status).join(",")})`,
      };
    }

    let gsc: any = { status: 0, ok: false, detail: "skipped" };
    try {
      const conn = await svc.connectors.getConnection("google_search_console");
      if (conn?.accessToken) {
        const feedEnc = encodeURIComponent("sitemap.xml");
        const regRows = await svc.entities.CanonicalSiteRegistry.list("-updated_date", 1);
        const verifiedProperty = String(regRows?.[0]?.google_search_console_property || "").trim();
        const candidates = [
          verifiedProperty,
          `sc-domain:${host}`,
          siteUrl.endsWith("/") ? siteUrl : siteUrl + "/",
        ].filter((v, i, arr) => v && arr.indexOf(v) === i);

        for (const property of candidates) {
          const r = await fetch(
            `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/sitemaps/${feedEnc}`,
            { method: "PUT", headers: { Authorization: `Bearer ${conn.accessToken}` } }
          );
          if (r.ok) {
            gsc = { status: r.status, ok: true, detail: `sitemap submitted (${property})`, property };
            break;
          }
          gsc = {
            status: r.status,
            ok: false,
            detail: (await r.text().catch(() => "")).slice(0, 200),
            property,
          };
        }
      } else {
        gsc = { status: 0, ok: false, detail: "connector not connected" };
      }
    } catch (e: any) {
      gsc = { status: 0, ok: false, detail: e.message };
    }

    await logStep(base44, {
      category: "seo",
      action: "GSC + IndexNow notification for SEO updates",
      detail: `${recent.length} recently-updated page(s) in last ${windowMin} min · ${urls.length} URLs notified`,
      meta: `indexNow:${indexNow.status} gsc:${gsc.status} host:${host}`,
      source: "notifySeoUpdates",
    });

    return Response.json({
      ok: true,
      site_url: siteUrl,
      host,
      window_minutes: windowMin,
      recent_pages: recent.length,
      urls_notified: urls.length,
      sample_urls: urls.slice(0, 5),
      indexNow,
      gsc,
      notifiedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[notifySeoUpdates] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
