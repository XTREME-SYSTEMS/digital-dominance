import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { lead_id, sequence_day } = body;

    if (!lead_id) return Response.json({ error: 'lead_id is required' }, { status: 400 });

    const lead = await base44.asServiceRole.entities.Lead.get(lead_id).catch(() => null);
    if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 });

    const email = lead.email;
    if (!email) return Response.json({ error: 'Lead has no email' }, { status: 400 });

    const day = sequence_day || 3;
    const name = lead.name || 'there';

    const variants = {
      3: {
        subject: `${name}, your website launch is waiting...`,
        body: `Hi ${name},\n\nYou reached out a few days ago about launching a website for your ${lead.service || 'business'}. I wanted to personally follow up — because the difference between businesses that dominate their market and those that fade into the background comes down to one decision: acting now.\n\nOur AI-powered system doesn't just build websites. It engineers digital dominance — scanning your top 5 competitors, enhancing every page to outperform them, and optimizing for Google's first page automatically.\n\nEvery site we launch includes:\n- Full competitive intelligence (your competitors' pricing, SEO, and funnel strategies — exposed)\n- AI-enhanced content that outperforms competitors on every ranking signal\n- God Mode optimization — the fastest mathematical path to Google's first page\n- Autonomous 24/7 operation — no manual SEO work required\n\nAre you ready to see what dominance looks like for your business?\n\nCall me: (866) 571-1174\nOr reply to this email and I'll personally respond.\n\nTo your success,\nJeremy\nStrategic Minds AI\njeremy@strategicmindsai.com`,
      },
      6: {
        subject: `Your competitors are already moving, ${name}`,
        body: `Hi ${name},\n\nI wanted to share something important: every day without a dominant online presence, you're losing leads to competitors who moved first.\n\nOur system doesn't just match competitors — it outperforms them. We scan the top 5 in your industry, extract their pricing and SEO strategies, then engineer a site that beats them on every Google ranking signal.\n\nThe result? Your business shows up first. Your phone rings. Your calendar fills.\n\nHere's what makes us different from every other provider:\n- Autonomous super agents run your digital business 24/7\n- Guaranteed site validation — every page is verified live and functional\n- AI-optimized CRM that follows up with every lead automatically\n- Eden Skye, our AI receptionist, handles every call and inquiry\n\nDon't let another week pass while competitors take your market share.\n\nCall (866) 571-1174 or reply now.\n\nTo your success,\nJeremy\nStrategic Minds AI`,
      },
      9: {
        subject: `Last chance: your market is waiting, ${name}`,
        body: `Hi ${name},\n\nThis is my final follow-up about your website launch.\n\nI don't want to be pushy, but I'd hate to see you settle for an ordinary website when dominance is within reach.\n\nOur system is different because it's not a website builder — it's a digital business engine. It builds, optimizes, validates, and operates your entire online presence autonomously.\n\nIf you're ready to see what it looks like when your business dominates its market, call me at (866) 571-1174.\n\nIf not, no worries — I wish you the best with whatever you choose.\n\nTo your success,\nJeremy\nStrategic Minds AI\njeremy@strategicmindsai.com`,
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