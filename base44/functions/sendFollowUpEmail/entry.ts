import { suppressLeadEmail } from "../../shared/leadEmailSafety.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { buildMime, base64Url } from "../../shared/gmailMime.ts";
import { buildFollowUp, followUpSubject } from "../../shared/followUpEmails.ts";
import { GALLERY_IMAGES } from "../../shared/companyContent.ts";

// Leads in these statuses are already engaged or closed — skip the promo drip.
const SKIP_STATUSES = [
  "WON",
  "LOST",
  "CONSULTATION BOOKED",
  "CONSULTATION COMPLETED",
  "IN-HOME ESTIMATE BOOKED",
  "IN-HOME ESTIMATE COMPLETED",
  "PROPOSAL SENT",
];

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { lead_id, stage, origin, to_email } = body;
    if (!lead_id || !stage) return Response.json({ error: "lead_id and stage required" }, { status: 400 });

    const lead = await base44.asServiceRole.entities.Lead.get(lead_id);
    if (!lead) return Response.json({ error: "Lead not found" }, { status: 404 });
    if (suppressLeadEmail(lead, body.to_email)) {
      return Response.json({ ok: true, sent: false, skipped: true, reason: "nonproduction_lead" });
    }

    // Don't send promos to leads who already booked or closed out.
    if (SKIP_STATUSES.includes(lead.status)) {
      return Response.json({ ok: true, skipped: true, reason: "converted", stage, status: lead.status });
    }

    const recipient = to_email || lead.email;
    if (!recipient) return Response.json({ error: "No recipient email" }, { status: 400 });

    const settingsList = await base44.asServiceRole.entities.AppSettings.list(1);
    const settings = settingsList[0] || {};
    const appOrigin = origin || "https://epoxygaragefloorestimate.com";

    const subject = followUpSubject(stage, lead);

    // Embed one real transformation photo inline
    let inline = [];
    try {
      const g = GALLERY_IMAGES[0];
      const r = await fetch(g.url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (r.ok) {
        const bytes = new Uint8Array(await r.arrayBuffer());
        const type = r.headers.get("content-type") || "image/jpeg";
        inline.push({ cid: "hero", type, bytes });
      }
    } catch {}

    const html = buildFollowUp(stage, lead, settings, appOrigin, inline.length > 0);

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("gmail");

    let fromEmail = "jeremy@xtremepolishingsystems.com";
    try {
      const prof = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const pd = await prof.json();
      if (pd.emailAddress) fromEmail = pd.emailAddress;
    } catch {}
    const fromName = settings.public_business_name || "EpoxyGarageFloorEstimate.com";
    const from = `${fromName} <${fromEmail}>`;

    const mimeBytes = buildMime({ from, to: recipient, subject, html, inline });
    const raw = base64Url(mimeBytes);
    const sendRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ raw }),
    });
    const result = await sendRes.json();
    if (!sendRes.ok) return Response.json({ error: "Gmail send failed", detail: result }, { status: 502 });

    try {
      await base44.asServiceRole.entities.EmailLog.create({
        lead_id: lead.id,
        to_email: recipient,
        subject,
        type: `followup:${stage}`,
        message_id: result.id,
        status: "sent",
      });
    } catch {}

    return Response.json({ ok: true, messageId: result.id, stage, to: recipient });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}