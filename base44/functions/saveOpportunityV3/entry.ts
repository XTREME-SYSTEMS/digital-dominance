import { createClientFromRequest } from "npm:@base44/sdk@0.8.48";
import { recomputeOpportunityV3 } from "../../shared/ddv3OpportunityLedger.ts";

async function stableEvidenceId(parts: string[]) {
  const input = new TextEncoder().encode(parts.join("|"));
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", input));
  return "oev_" + Array.from(digest.slice(0, 12)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function scannerSignal(scanner: string) {
  if (/competitor|saturation/.test(scanner)) return "competitor";
  if (/trend|github|social/.test(scanner)) return "trend";
  if (/demand|craigslist/.test(scanner)) return "demand";
  return "trend";
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
    const finding = body?.finding || {};
    const scannerSource = String(body?.scanner_source || "unknown").slice(0, 160);
    const scannerLabel = String(body?.scanner_label || scannerSource).slice(0, 240);
    const searchedAt = body?.searched_at || new Date().toISOString();

    if (!String(finding?.title || "").trim()) {
      return Response.json({ error: "finding.title is required" }, { status: 400 });
    }

    const hypothesisScore = Number.isFinite(Number(finding?.score))
      ? Math.max(0, Math.min(10, Number(finding.score)))
      : 0;

    const svc = base44.asServiceRole;
    const opportunity = await svc.entities.Opportunity.create({
      owner_id: user.id,
      title: String(finding.title).slice(0, 500),
      description: String(finding.description || "").slice(0, 5000),
      problem: String(finding.problem || "").slice(0, 5000),
      buyer: String(finding.buyer || "").slice(0, 500),
      buyer_archetype: String(finding.buyer || "").slice(0, 500),
      app_idea: String(finding.app_idea || "").slice(0, 5000),
      monetization: String(finding.monetization || "").slice(0, 2000),
      evidence: String(finding.evidence || "").slice(0, 3000),
      source_url: String(finding.url || finding.repo_url || finding.post_url || "").slice(0, 2000),
      scanner_source: scannerSource,
      scanner_label: scannerLabel,
      score: hypothesisScore,
      hypothesis_score: hypothesisScore,
      decision_score: 0,
      evidence_state: "hypothesis",
      automation_eligibility: "research_only",
      status: "saved",
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const citations = Array.isArray(finding?.citations) ? finding.citations.slice(0, 10) : [];
    const createdEvidence: any[] = [];

    for (const citation of citations) {
      const sourceUrl = String(citation?.url || "").trim();
      if (!sourceUrl) continue;

      const evidenceId = await stableEvidenceId([
        opportunity.id,
        scannerSource,
        sourceUrl,
        String(searchedAt).slice(0, 10),
      ]);

      const row = await svc.entities.OpportunityEvidence.create({
        evidence_id: evidenceId,
        opportunity_id: opportunity.id,
        signal_type: scannerSignal(scannerSource),
        source_class: "VERIFIED_THIRD_PARTY",
        verification_state: "retrieved",
        source_url: sourceUrl,
        source_name: String(citation?.source || "").slice(0, 300),
        source_title: String(citation?.title || "").slice(0, 500),
        observed_at: searchedAt,
        retrieved_at: new Date().toISOString(),
        confidence: 65,
        evidence_summary: String(finding.evidence || finding.description || "").slice(0, 3000),
        verified_by: "opportunityIntelligenceEngine",
        status: "active",
        tags: ["scanner_evidence", scannerSource],
      });
      createdEvidence.push(row);
    }

    // Preserve the scanner score explicitly as MODEL_ESTIMATE. It is intentionally
    // excluded from deterministic scored dimensions and cannot certify demand.
    if (hypothesisScore > 0) {
      const modelEvidenceId = await stableEvidenceId([
        opportunity.id,
        "MODEL_ESTIMATE",
        scannerSource,
        "hypothesis_score",
      ]);
      createdEvidence.push(await svc.entities.OpportunityEvidence.create({
        evidence_id: modelEvidenceId,
        opportunity_id: opportunity.id,
        signal_type: "overall_hypothesis",
        source_class: "MODEL_ESTIMATE",
        verification_state: "retrieved",
        observed_at: searchedAt,
        retrieved_at: new Date().toISOString(),
        metric_name: "scanner_hypothesis_score",
        metric_value: hypothesisScore,
        metric_unit: "0-10",
        normalized_score: hypothesisScore * 10,
        confidence: 40,
        evidence_summary: "AI-generated opportunity hypothesis score. Not validated demand or revenue evidence.",
        verified_by: "opportunityIntelligenceEngine",
        status: "active",
        tags: ["hypothesis_only", scannerSource],
      }));
    }

    const score = await recomputeOpportunityV3(svc, opportunity.id);

    return Response.json({
      ok: true,
      opportunity_id: opportunity.id,
      evidence_records: createdEvidence.length,
      evidence_state: score.evidence_state,
      decision_score: score.decision_score,
      automation_eligibility: score.automation_eligibility,
      note: "Scanner/model scores remain hypotheses until scored evidence is recorded.",
    });
  } catch (error: any) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
