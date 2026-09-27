import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

async function getAccessToken(base44: any) {
  const list = await base44.asServiceRole.entities.AppSettings.list(1);
  const refreshToken = list[0]?.google_refresh_token;
  if (!refreshToken) throw new Error("Google refresh token not set — connect the verifier first");
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Token refresh failed");
  return data.access_token;
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const registry = await svc.entities.CanonicalSiteRegistry.list("-updated_date", 1);
    const domain = String(registry?.[0]?.canonical_domain || "epoxyquotenearme.com")
      .replace(/^https?:\/\//, "")
      .replace(/\/+$/, "");
    const siteUrl = `https://${domain}`;
    const accessToken = await getAccessToken(base44);

    const tokenRes = await fetch("https://www.googleapis.com/siteVerification/v1/token?verificationMethod=META", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ site: { type: "SITE", identifier: siteUrl } }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.token) return Response.json({ error: "getToken failed", detail: tokenData }, { status: 502 });
    const verifyToken = tokenData.token;

    const list = await svc.entities.AppSettings.list(1);
    const s = list[0];
    if (s?.id) await svc.entities.AppSettings.update(s.id, { google_site_verification: verifyToken });
    else await svc.entities.AppSettings.create({ google_site_verification: verifyToken });

    const insRes = await fetch("https://www.googleapis.com/siteVerification/v1/webResource?verificationMethod=META", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ site: { type: "SITE", identifier: siteUrl } }),
    });
    const insData = await insRes.json();
    const verified = insRes.ok && !!insData?.ownershipLevel;

    let added = null;
    if (verified) {
      const addRes = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ siteUrl }),
      });
      added = addRes.ok;
    }

    // Verification tokens are credentials-like proof material; never echo them.
    return Response.json({ ok: true, verified, siteUrl, insertResponse: insData, added });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
