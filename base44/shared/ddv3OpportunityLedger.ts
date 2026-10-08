import { scoreOpportunityEvidence } from "./ddv3OpportunityScoring.ts";

export async function recomputeOpportunityV3(svc: any, opportunityId: string) {
  const opportunity = await svc.entities.Opportunity.get(opportunityId);
  if (!opportunity) throw new Error("Opportunity not found");

  const evidence = await svc.entities.OpportunityEvidence.filter(
    { opportunity_id: opportunityId },
    "-retrieved_at",
    500
  );

  const result = scoreOpportunityEvidence(evidence || []);
  await svc.entities.Opportunity.update(opportunityId, {
    decision_score: result.decision_score,
    evidence_coverage_pct: result.evidence_coverage_pct,
    evidence_quality_score: result.evidence_quality_score,
    evidence_count: result.evidence_count,
    evidence_state: result.evidence_state,
    automation_eligibility: result.automation_eligibility,
    score_version: result.score_version,
    score_breakdown: JSON.stringify(result.score_breakdown).slice(0, 5000),
    last_scored_at: new Date().toISOString(),
  });

  return result;
}
