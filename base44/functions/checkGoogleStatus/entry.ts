import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Read-only Search Console property check against the canonical production identity.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const { accessToken } = await svc.connectors.getConnection("google_search_console");

    const registry = await svc.entities.CanonicalSiteRegistry.list("-updated_date", 1);
    const reg = registry?.[0];
    const domain = String(reg?.canonical_domain || "epoxyquotenearme.com")
      .replace(/^https?:\/\//, "")
      .replace(/\/+$/, "")
      .toLowerCase();
    const expectedDomainProperty = `sc-domain:${domain}`;
    const expectedPrefix = `https://${domain}/`;
    const configuredProperty = String(reg?.google_search_console_property || "").trim();

    let accountEmail = null;
    try {
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (userRes.ok) accountEmail = (await userRes.json()).email || null;
    } catch {}

    const res = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (!res.ok) return Response.json({ error: "Search Console not reachable", detail: data }, { status: 502 });

    const sites = data.siteEntry || [];
    const exact = sites.find((s: any) => {
      const value = String(s.siteUrl || "").toLowerCase();
      return value === configuredProperty.toLowerCase() || value === expectedDomainProperty || value === expectedPrefix;
    });

    return Response.json({
      connected: true,
      accountEmail,
      canonicalDomain: domain,
      configuredProperty: configuredProperty || null,
      propertyFound: !!exact,
      siteUrl: exact?.siteUrl || null,
      permissionLevel: exact?.permissionLevel || null,
      allSites: sites.map((s: any) => ({ siteUrl: s.siteUrl, permissionLevel: s.permissionLevel })),
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
