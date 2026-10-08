import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

/**
 * Bind all FunnelEvent rows for a browser session to the lead created from
 * that same session. This closes the DDV3 session -> lead attribution gap.
 *
 * Safety:
 * - the Lead must already contain the same session_id;
 * - events already bound to another lead are never overwritten;
 * - no PII is returned.
 */
export default async function(req: Request): Promise<Response> {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "POST required" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const leadId = String(body?.lead_id || "").trim();
    const sessionId = String(body?.session_id || "").trim();

    if (!leadId || !sessionId) {
      return Response.json({ error: "lead_id and session_id are required" }, { status: 400 });
    }

    const svc = base44.asServiceRole;
    const lead = await svc.entities.Lead.get(leadId);
    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    if (!lead.session_id || lead.session_id !== sessionId) {
      return Response.json({
        error: "Session mismatch",
        code: "SESSION_BINDING_REJECTED",
      }, { status: 409 });
    }

    const events = await svc.entities.FunnelEvent.filter(
      { session_id: sessionId },
      "-created_date",
      500
    );

    let bound = 0;
    let alreadyBound = 0;
    let conflict = 0;

    for (const event of events || []) {
      if (event.lead_id === leadId) {
        alreadyBound++;
        continue;
      }
      if (event.lead_id && event.lead_id !== leadId) {
        conflict++;
        continue;
      }
      await svc.entities.FunnelEvent.update(event.id, { lead_id: leadId });
      bound++;
    }

    return Response.json({
      ok: true,
      lead_id: leadId,
      session_id: sessionId,
      events_seen: events?.length || 0,
      events_bound: bound,
      already_bound: alreadyBound,
      conflicts_skipped: conflict,
    });
  } catch (error: any) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
