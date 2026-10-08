import { createClientFromRequest } from "npm:@base44/sdk@0.8.48";
import { recomputeOpportunityV3 } from "../../shared/ddv3OpportunityLedger.ts";

const SIGNALS = new Set([
  "urgency","buyer_value","repeat_demand","buyer_density","compliance_ease",
  "fulfillment","cpc_proxy","cpl_proxy","demand","serp_opportunity",
  "first_party_conversion","first_party_revenue","competitor","trend","overall_hypothesis"
]);

const SOURCE_CLASSES = new Set([
  "FIRST_PARTY","AUTHORITATIVE_PUBLIC","VERIFIED_THIRD_PARTY",
  "MODEL_ESTIMATE","OPERATOR_ASSUMPTION","UNKNOWN"
]);

async function stableEvidenceId(parts: string[]) {
  const input = new TextEncoder().encode(parts.join("|"));
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", input));
  return "oev_" + Array.from(digest.slice(0, 12)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

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
    const signalType = String(body?.signal_type || "").trim();
    const sourceClass = String(body?.source_class || "UNKNOWN").trim().toUpperCase();

    if (!opportunityId) return Response.json({ error: "opportunity_id required" }, { status: 400 });
    if (!SIGNALS.has(signalType)) return Response.json({ error: "Unsupported signal_type" }, { status: 400 });
    if (!SOURCE_CLASSES.has(sourceClass)) return Response.json({ error: "Unsupported source_class" }, { status: 400 });

    const sourceUrl = String(body?.source_url || "").trim();
    if (["AUTHORITATIVE_PUBLIC","VERIFIED_THIRD_PARTY"].includes(sourceClass) && !sourceUrl) {
      return Response.json({ error: "source_url required for external evidence" }, { status: 400 });
    }

    const normalized = body?.normalized_score;
    if (normalized != null && (!Number.isFinite(Number(normalized)) || Number(normalized) < 0 || Number(normalized) > 100)) {
      return Response.json({ error: "normalized_score must be 0-100" }, { status: 400 });
    }

    const confidence = Math.max(0, Math.min(100, Number(body?.confidence ?? 50)));
    const observedAt = body?.observed_at || new Date().toISOString();
    const metricName = String(body?.metric_name || "").slice(0, 300);

    const svc = base44.asServiceRole;
    const opportunity = await svc.entities.Opportunity.get(opportunityId);
    if (!opportunity) return Response.json({ error: "Opportunity not found" }, { status: 404 });

    const evidenceId = String(body?.evidence_id || "") || await stableEvidenceId([
      opportunityId,
      signalType,
      sourceClass,
      sourceUrl,
      metricName,
      String(observedAt),
    ]);

    const payload: Record<string, any> = {
      evidence_id: evidenceId,
      opportunity_id: opportunityId,
      signal_type: signalType,
      source_class: sourceClass,
      verification_state: body?.verification_state || "retrieved",
      source_url: sourceUrl,
      source_name: String(body?.source_name || "").slice(0, 300),
      source_title: String(body?.source_title || "").slice(0, 500),
      observed_at: observedAt,
      retrieved_at: new Date().toISOString(),
      expires_at: body?.expires_at || null,
      geography: String(body?.geography || "").slice(0, 300),
      service: String(body?.service || "").slice(0, 300),
      intent: String(body?.intent || "").slice(0, 120),
      metric_name: metricName,
      metric_value: body?.metric_value == null ? null : Number(body.metric_value),
      metric_unit: String(body?.metric_unit || "").slice(0, 120),
      confidence,
      evidence_summary: String(body?.evidence_summary || "").slice(0, 3000),
      raw_evidence: String(body?.raw_evidence || "").slice(0, 5000),
      verified_by: String(body?.verified_by || user.email || user.id).slice(0, 300),
      status: body?.status || "active",
      tags: Array.isArray(body?.tags) ? body.tags.slice(0, 25).map((x: any) => String(x).slice(0, 120)) : [],
    };
    if (normalized != null) payload.normalized_score = Number(normalized);

    const existing = await svc.entities.OpportunityEvidence.filter({ evidence_id: evidenceId }, "-retrieved_at", 1);
    const evidence = existing?.[0]
      ? await svc.entities.OpportunityEvidence.update(existing[0].id, payload)
      : await svc.entities.OpportunityEvidence.create(payload);

    const score = await recomputeOpportunityV3(svc, opportunityId);
    return Response.json({
      ok: true,
      evidence_id: evidence.evidence_id,
      opportunity_id: opportunityId,
      score,
    });
  } catch (error: any) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
