import { suppressLeadEmail } from "../../shared/leadEmailSafety.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { buildMime, base64Url } from "../../shared/gmailMime.ts";
import { buildReviewEmail, reviewSubject } from "../../shared/reviewEmail.ts";
import { logStep } from "../../shared/sopLog.ts";

// Sends a branded Google review request email to a won lead via Gmail.
// Called automatically by the Review Request workflow (3 days after a lead
// is marked WON, with a 5-day follow-up), or manually from the admin.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { lead_id, stage } = body;
    if (!lead_id) return Response.json({ error: "lead_id required" }, { status: 400 });

    const lead = await base44.asServiceRole.entities.Lead.get(lead_id);
    if (!lead) return Response.json({ error: "Lead not found" }, { status: 404 });
    if (suppressLeadEmail(lead, body.to_email)) {
      return Response.json({ ok: true, sent: false, skipped: true, reason: "nonproduction_lead" });
    }
    if (!lead.email) return Response.json({ error: "Lead has no email" }, { status: 400 });

    const settingsList = await base44.asServiceRole.entities.AppSettings.list(1);
    const settings = settingsList[0] || {};

    const st = stage || "initial";
    const subject = reviewSubject(st, lead);
    const html = buildReviewEmail(st, lead, settings);

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

    const mimeBytes = buildMime({ from, to: lead.email, subject, html, inline: [] });
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
        to_email: lead.email,
        subject,
        type: st === "followup" ? "review_request:followup" : "review_request",
        message_id: result.id,
        status: "sent",
      });
    } catch {}

    await logStep(base44, {
      category: "lead",
      action: "Sent review request email",
      detail: `${st} request to ${lead.email} (lead ${lead.id})`,
      source: "sendReviewRequest",
    });

    return Response.json({ ok: true, messageId: result.id, stage: st, to: lead.email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}