import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Adds the explicitly requested or canonical production Search Console property.
// Never defaults to a legacy domain.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const rows = await svc.entities.CanonicalSiteRegistry.list("-updated_date", 1);
    const reg = rows?.[0];
    const domain = String(reg?.canonical_domain || "epoxyquotenearme.com")
      .replace(/^https?:\/\//, "")
      .replace(/\/+$/, "");
    const canonicalProperty = String(reg?.google_search_console_property || "").trim();
    const siteUrl = String(body?.siteUrl || canonicalProperty || `https://${domain}/`).trim();

    if (!siteUrl || siteUrl.includes("epoxygaragefloorestimate.com") || siteUrl.includes(".base44.app")) {
      return Response.json({ error: "Refusing non-canonical Search Console property", siteUrl }, { status: 409 });
    }

    const { accessToken } = await svc.connectors.getConnection("google_search_console");
    const res = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ siteUrl }),
    });
    const text = await res.text();
    let data: any; try { data = JSON.parse(text); } catch { data = text; }
    return Response.json({ ok: res.ok, status: res.status, siteUrl, data });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
