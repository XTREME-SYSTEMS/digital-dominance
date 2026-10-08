import { createClientFromRequest } from "npm:@base44/sdk@0.8.48";
import { recomputeOpportunityV3 } from "../../shared/ddv3OpportunityLedger.ts";

export default async function(req: Request): Promise<Response> {
  try {
    if (req.method !== "POST") return Response.json({ error: "POST required" }, { status: 405 });

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const opportunityId = String(body?.opportunity_id || "").trim();
    if (!opportunityId) return Response.json({ error: "opportunity_id required" }, { status: 400 });

    const result = await recomputeOpportunityV3(base44.asServiceRole, opportunityId);
    return Response.json({ ok: true, opportunity_id: opportunityId, ...result });
  } catch (error: any) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
