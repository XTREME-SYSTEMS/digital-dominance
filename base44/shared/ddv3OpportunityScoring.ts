export const DDV3_SCORE_VERSION = "ddv3-opportunity-v1";

export const DDV3_DIMENSION_WEIGHTS: Record<string, number> = {
  urgency: 12,
  buyer_value: 14,
  repeat_demand: 8,
  buyer_density: 8,
  compliance_ease: 8,
  fulfillment: 10,
  cpc_proxy: 5,
  cpl_proxy: 5,
  demand: 10,
  serp_opportunity: 5,
  first_party_conversion: 7,
  first_party_revenue: 8,
};

const SOURCE_WEIGHT: Record<string, number> = {
  FIRST_PARTY: 1.0,
  AUTHORITATIVE_PUBLIC: 0.9,
  VERIFIED_THIRD_PARTY: 0.75,
  MODEL_ESTIMATE: 0.35,
  OPERATOR_ASSUMPTION: 0.25,
  UNKNOWN: 0.15,
};

const VERIFICATION_WEIGHT: Record<string, number> = {
  retrieved: 0.75,
  corroborated: 0.9,
  operator_verified: 1.0,
  disputed: 0,
  expired: 0,
};

function clamp(value: number, low = 0, high = 100) {
  return Math.max(low, Math.min(high, value));
}

function isExpired(evidence: any, nowMs: number) {
  if (evidence?.status === "expired" || evidence?.verification_state === "expired") return true;
  if (!evidence?.expires_at) return false;
  const expires = Date.parse(evidence.expires_at);
  return Number.isFinite(expires) && expires <= nowMs;
}

function qualityFor(evidence: any) {
  const source = SOURCE_WEIGHT[evidence?.source_class] ?? SOURCE_WEIGHT.UNKNOWN;
  const verification = VERIFICATION_WEIGHT[evidence?.verification_state] ?? VERIFICATION_WEIGHT.retrieved;
  const confidence = clamp(Number(evidence?.confidence) || 0) / 100;
  return source * verification * confidence;
}

export function scoreOpportunityEvidence(evidenceRows: any[], now = new Date()) {
  const nowMs = now.getTime();
  const active = (evidenceRows || []).filter((row) =>
    row?.status !== "disputed" &&
    row?.verification_state !== "disputed" &&
    !isExpired(row, nowMs)
  );

  const breakdown: Record<string, any> = {};
  let decisionScore = 0;
  let coverageWeight = 0;
  let qualityWeight = 0;

  for (const [dimension, weight] of Object.entries(DDV3_DIMENSION_WEIGHTS)) {
    const rows = active.filter((row) =>
      row?.signal_type === dimension &&
      Number.isFinite(Number(row?.normalized_score))
    );

    if (!rows.length) {
      breakdown[dimension] = {
        weight,
        evidence_count: 0,
        raw_score: 0,
        evidence_quality: 0,
        adjusted_score: 0,
      };
      continue;
    }

    const scored = rows.map((row) => ({
      raw: clamp(Number(row.normalized_score)),
      quality: qualityFor(row),
      source_class: row.source_class,
    })).filter((row) => row.quality > 0);

    const qualitySum = scored.reduce((sum, row) => sum + row.quality, 0);
    if (!qualitySum) continue;

    const rawScore = scored.reduce((sum, row) => sum + row.raw * row.quality, 0) / qualitySum;
    const corroboration = Math.min(1, qualitySum / 1.25);
    const adjustedScore = clamp(rawScore * corroboration);
    const evidenceQuality = clamp(corroboration * 100);

    breakdown[dimension] = {
      weight,
      evidence_count: scored.length,
      raw_score: Math.round(rawScore * 10) / 10,
      evidence_quality: Math.round(evidenceQuality * 10) / 10,
      adjusted_score: Math.round(adjustedScore * 10) / 10,
      source_classes: [...new Set(scored.map((row) => row.source_class))],
    };

    decisionScore += weight * adjustedScore / 100;
    coverageWeight += weight;
    qualityWeight += weight * corroboration;
  }

  const coveragePct = clamp(coverageWeight);
  const evidenceQualityScore = coverageWeight > 0
    ? clamp((qualityWeight / coverageWeight) * 100)
    : 0;

  const hasNonModelEvidence = active.some((row) =>
    !["MODEL_ESTIMATE", "OPERATOR_ASSUMPTION", "UNKNOWN"].includes(row?.source_class)
  );
  const hasHighAuthorityEvidence = active.some((row) =>
    ["FIRST_PARTY", "AUTHORITATIVE_PUBLIC"].includes(row?.source_class)
  );
  const hasFirstPartyEconomics = active.some((row) =>
    row?.source_class === "FIRST_PARTY" &&
    ["first_party_conversion", "first_party_revenue"].includes(row?.signal_type)
  );

  let evidenceState = "hypothesis";
  if (hasNonModelEvidence && coveragePct >= 30) evidenceState = "partially_verified";
  if (hasHighAuthorityEvidence && coveragePct >= 80 && evidenceQualityScore >= 70) evidenceState = "verified";

  const compliance = breakdown.compliance_ease?.adjusted_score || 0;
  const fulfillment = breakdown.fulfillment?.adjusted_score || 0;

  let automationEligibility = "research_only";
  if (
    decisionScore >= 60 &&
    coveragePct >= 55 &&
    compliance >= 60 &&
    fulfillment >= 60
  ) {
    automationEligibility = "preview_candidate";
  }
  if (
    decisionScore >= 75 &&
    coveragePct >= 80 &&
    evidenceState === "verified" &&
    compliance >= 70 &&
    fulfillment >= 70 &&
    hasFirstPartyEconomics
  ) {
    automationEligibility = "release_candidate";
  }

  return {
    score_version: DDV3_SCORE_VERSION,
    decision_score: Math.round(clamp(decisionScore) * 10) / 10,
    evidence_coverage_pct: Math.round(coveragePct * 10) / 10,
    evidence_quality_score: Math.round(evidenceQualityScore * 10) / 10,
    evidence_count: active.length,
    evidence_state: evidenceState,
    automation_eligibility: automationEligibility,
    score_breakdown: breakdown,
  };
}
