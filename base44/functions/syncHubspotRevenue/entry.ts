import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

function isAuthorizedCron(req: Request) {
  const expected = Deno.env.get("RAILWAY_CRON_KEY") || Deno.env.get("ENGINE_API_KEY") || "";
  const supplied = req.headers.get("x-cron-key") || "";
  return Boolean(expected && supplied && supplied === expected);
}

export default async function(req: Request): Promise<Response> {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "POST required" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);

    let admin = false;
    try {
      const user = await base44.auth.me();
      admin = user?.role === "admin";
    } catch {}

    if (!admin && !isAuthorizedCron(req)) {
      return Response.json({ error: "Admin or approved cron authorization required" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const requestedLeadId = String(body?.lead_id || "").trim();
    const limit = Math.min(Math.max(Number(body?.limit) || 100, 1), 250);
    const svc = base44.asServiceRole;

    let leads: any[] = [];
    if (requestedLeadId) {
      const lead = await svc.entities.Lead.get(requestedLeadId);
      if (lead) leads = [lead];
    } else {
      const all = await svc.entities.Lead.list("-updated_date", 500);
      leads = (all || []).filter((lead: any) => lead.hubspot_deal_id).slice(0, limit);
    }

    const { accessToken } = await svc.connectors.getConnection("hubspot");
    const headers = { Authorization: `Bearer ${accessToken}` };

    let checked = 0;
    let closedWon = 0;
    let updated = 0;
    let skippedNoDeal = 0;
    const errors: Array<{ lead_id: string; code: string }> = [];

    for (const lead of leads) {
      const dealId = String(lead.hubspot_deal_id || "").trim();
      if (!dealId) {
        skippedNoDeal++;
        continue;
      }

      checked++;
      try {
        const url = new URL(`https://api.hubapi.com/crm/v3/objects/deals/${encodeURIComponent(dealId)}`);
        url.searchParams.set("properties", "dealstage,amount,closedate,hs_is_closed_won");

        const res = await fetch(url, { headers });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          errors.push({ lead_id: lead.id, code: `HUBSPOT_${res.status}` });
          continue;
        }

        const props = data?.properties || {};
        const isWon = props.hs_is_closed_won === "true" || props.dealstage === "closedwon";
        if (!isWon) continue;

        closedWon++;
        const amount = Number(props.amount);
        const patch: Record<string, any> = {
          status: "WON",
          hubspot_deal_id: String(data.id || dealId),
          revenue_source: "hubspot",
          revenue_evidence_class: "closed_won_booked",
          revenue_synced_at: new Date().toISOString(),
        };

        if (Number.isFinite(amount) && amount >= 0) {
          // HubSpot deal amount is booked closed-won value, not proof of cash collection.
          patch.won_value = amount;
        }
        if (props.closedate) patch.closed_won_at = props.closedate;

        await svc.entities.Lead.update(lead.id, patch);
        updated++;
      } catch {
        errors.push({ lead_id: lead.id, code: "SYNC_EXCEPTION" });
      }
    }

    return Response.json({
      ok: errors.length === 0,
      checked,
      closed_won: closedWon,
      updated,
      skipped_no_deal: skippedNoDeal,
      errors,
      evidence_class: "closed_won_booked",
      note: "HubSpot deal amount is treated as booked closed-won value, not collected cash revenue.",
    });
  } catch (error: any) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
