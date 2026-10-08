import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { createDDV3LearningSnapshot } from "../../shared/ddv3LearningSnapshot.ts";

export default async function(req: Request): Promise<Response> {
  try {
    if (req.method !== "POST") return Response.json({ error: "POST required" }, { status: 405 });
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const snapshot = await createDDV3LearningSnapshot(base44.asServiceRole, {
      periodDays: Math.min(Math.max(Number(body?.period_days) || 30, 1), 180),
      qualifiedLeadThreshold: Math.min(Math.max(Number(body?.qualified_lead_threshold) || 60, 0), 100),
      now: new Date(),
    });
    return Response.json({
      ok: true,
      snapshot,
      note: "First-party observation only. Recommendations never auto-execute."
    });
  } catch (error: any) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
