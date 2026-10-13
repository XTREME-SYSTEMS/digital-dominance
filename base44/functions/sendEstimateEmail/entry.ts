import { suppressLeadEmail } from "../../shared/leadEmailSafety.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { buildMime, base64Url } from "../../shared/gmailMime.ts";
import { estimateEmailHtml, estimateSubject } from "../../shared/estimateEmail.ts";
import { GALLERY_IMAGES } from "../../shared/companyContent.ts";

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { lead_id, floor_image_url, pdf_url, origin, preview, to_email } = body;

    const settingsList = await base44.asServiceRole.entities.AppSettings.list(1);
    const settings = settingsList[0] || {};
    const appOrigin = origin || "https://epoxygaragefloorestimate.com";

    // ---- PREVIEW: return the rendered HTML without sending ----
    if (preview) {
      let lead = body.lead;
      if (!lead && lead_id) {
        try {
          lead = await base44.asServiceRole.entities.Lead.get(lead_id);
        } catch {}
      }
      if (!lead) {
        lead = {
          id: "preview",
          first_name: "Homeowner",
          estimate_low: 3080,
          estimate_mid: 3520,
          estimate_high: 4048,
          package_options: (settings.packages || []).map((p, i) => ({
            tier: p.tier,
            name: p.name,
            low: 3000 + i * 400,
            high: 3400 + i * 400,
            description: p.description,
          })),
        };
      }
      const html = estimateEmailHtml(lead, settings, appOrigin, !!floor_image_url);
      return Response.json({ subject: estimateSubject(lead), html });
    }

    // ---- SEND ----
    if (!lead_id) return Response.json({ error: "lead_id required" }, { status: 400 });
    const lead = await base44.asServiceRole.entities.Lead.get(lead_id);
    if (!lead) return Response.json({ error: "Lead not found" }, { status: 404 });
    if (suppressLeadEmail(lead, body.to_email)) {
      return Response.json({ ok: true, sent: false, skipped: true, reason: "nonproduction_lead" });
    }
    const recipient = to_email || lead.email;
    if (!recipient) return Response.json({ error: "No recipient email address" }, { status: 400 });

    // Fetch the floor image (if provided) to embed inline
    let inline = [];
    if (floor_image_url) {
      try {
        const r = await fetch(floor_image_url);
        if (r.ok) {
          const bytes = new Uint8Array(await r.arrayBuffer());
          const type = r.headers.get("content-type") || "image/png";
          inline.push({ cid: "floor-image", type, bytes });
        }
      } catch {}
    }

    // Fetch real XPS transformation photos to embed inline in the gallery
    const gallery = [];
    for (let i = 0; i < GALLERY_IMAGES.length; i++) {
      const g = GALLERY_IMAGES[i];
      try {
        const r = await fetch(g.url, { headers: { "User-Agent": "Mozilla/5.0" } });
        if (r.ok) {
          const bytes = new Uint8Array(await r.arrayBuffer());
          const type = r.headers.get("content-type") || "image/jpeg";
          const cid = `gallery-${i + 1}`;
          inline.push({ cid, type, bytes });
          gallery.push({ cid, alt: g.alt, caption: g.caption });
        }
      } catch {}
    }

    const hasFloor = inline.some((x) => x.cid === "floor-image");
    const html = estimateEmailHtml(lead, settings, appOrigin, hasFloor, gallery);
    const subject = estimateSubject(lead);

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("gmail");

    // Use the connected Gmail account's address as the From
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

    const attachments = [];
    if (pdf_url) {
      try {
        const r = await fetch(pdf_url);
        if (r.ok) {
          const bytes = new Uint8Array(await r.arrayBuffer());
          attachments.push({ filename: "Garage-Floor-Estimate.pdf", type: "application/pdf", bytes });
        }
      } catch {}
    }
    const mimeBytes = buildMime({ from, to: recipient, subject, html, inline, attachments });
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
        type: "estimate",
        message_id: result.id,
        status: "sent",
      });
    } catch {}

    return Response.json({ ok: true, messageId: result.id, to: recipient, from: fromEmail });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}