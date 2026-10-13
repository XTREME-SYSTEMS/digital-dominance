import { suppressLeadEmail } from "../../shared/leadEmailSafety.ts";
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { lead_id, sequence_day } = body;

    if (!lead_id) return Response.json({ error: 'lead_id is required' }, { status: 400 });

    const lead = await base44.asServiceRole.entities.Lead.get(lead_id).catch(() => null);
    if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 });
    if (suppressLeadEmail(lead, body.to_email)) {
      return Response.json({ ok: true, sent: false, skipped: true, reason: "nonproduction_lead" });
    }

    const email = lead.email;
    if (!email) return Response.json({ error: 'Lead has no email' }, { status: 400 });

    const day = sequence_day || 3;
    const name = lead.name || 'there';

    // Verified competitive advantage (researched 2026-10-13):
    // No competitor launches hundreds/thousands of FULL websites in under an hour.
    // Programmatic SEO tools create PAGES, not full sites. AI builders make ONE site at a time.
    const variants = {
      3: {
        subject: `${name}, we can launch hundreds of websites while others build one`,
        body: `Hi ${name},\n\nYou reached out about launching a website for your ${lead.service || 'business'}. I wanted to share something no other provider can match.\n\nWhile every other website builder — from Wix to Framer to Hostinger — builds ONE website at a time, our system launches HUNDREDS of full, quality websites simultaneously. Not pages. Not templates. Full, deployed, live websites — each with its own URL, each optimized for Google's first page, each validated as visible and live.\n\nI verified this claim through market research: programmatic SEO tools create pages at scale, but none create full websites. AI builders create one site at a time. We are the only platform that mass-launches complete websites with autonomous operation.\n\nWhat this means for you:\n- Dominate every city in your market — not just one location\n- Each site runs autonomously 24/7 — no manual SEO, no manual updates\n- Guaranteed validation — every site is verified live and functional\n- AI-optimized CRM follows up with every lead automatically\n\nCall me: (866) 571-1174\nOr reply to this email.\n\nTo your success,\nJeremy\nStrategic Minds AI\njeremy@strategicmindsai.com`,
      },
      6: {
        subject: `Your competitors can't do this, ${name}`,
        body: `Hi ${name},\n\nI want to be direct: no other website company can do what we do.\n\nI researched every major platform. Here's what I found:\n- Wix, Squarespace, Framer: one site at a time, manual builds\n- Programmatic SEO tools (WP Zinc, Concurate): create PAGES, not full websites\n- AI builders (Hostinger, Replit): one site per build, no mass deployment\n- No competitor launches hundreds of full, quality, live websites simultaneously\n\nOur system is different because it's not a website builder. It's a digital dominance engine:\n- Mass-launches hundreds of full websites — each with its own URL\n- Autonomous super agents operate every site 24/7\n- Guaranteed live validation on every site\n- Eden Skye AI receptionist handles every call and inquiry\n- AI-optimized CRM with 3-day follow-up sequences\n\nDon't settle for one website when you could dominate your entire market.\n\nCall (866) 571-1174 or reply now.\n\nTo your success,\nJeremy\nStrategic Minds AI`,
      },
      9: {
        subject: `The only platform that can, ${name}`,
        body: `Hi ${name},\n\nThis is my final follow-up.\n\nI don't want to be pushy, but I'd hate to see you settle for an ordinary website when mass market dominance is within reach.\n\nWe are the only platform that can launch hundreds of full, quality, live websites simultaneously. No competitor matches this. I verified it through market research — it's not a claim, it's a fact.\n\nIf you're ready to dominate your market — not just exist in it — call me at (866) 571-1174.\n\nIf not, I wish you the best.\n\nTo your success,\nJeremy\nStrategic Minds AI\njeremy@strategicmindsai.com`,
      },
    };

    const variant = variants[day] || variants[3];

    const sendResult = await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      subject: variant.subject,
      body: variant.body,
      from_name: 'Strategic Minds AI',
    });

    try {
      await base44.asServiceRole.entities.Lead.update(lead_id, {
        follow_up_status: 'sent',
        last_sent_at: new Date().toISOString(),
        follow_up_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      });
    } catch (e) { /* non-fatal */ }

    return Response.json({ sent: true, lead_id, sequence_day: day, email });
  } catch (error) {
    console.error('crmFollowUpSender error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}