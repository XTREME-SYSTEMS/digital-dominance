import assert from "node:assert/strict";
import {
  DDV3_DIMENSION_WEIGHTS,
  DDV3_SCORE_VERSION,
  scoreOpportunityEvidence,
} from "../base44/shared/ddv3OpportunityScoring.js";

const dimensions = Object.keys(DDV3_DIMENSION_WEIGHTS);
const make = (signal_type, source_class, normalized_score = 100, extra = {}) => ({
  signal_type,
  source_class,
  normalized_score,
  confidence: 100,
  verification_state: "operator_verified",
  status: "active",
  ...extra,
});

assert.equal(
  Object.values(DDV3_DIMENSION_WEIGHTS).reduce((a, b) => a + b, 0),
  100,
  "Dimension weights must sum to 100"
);

const hypothesisOnly = scoreOpportunityEvidence(
  dimensions.map((d) => make(d, "MODEL_ESTIMATE"))
);
assert.equal(hypothesisOnly.score_version, DDV3_SCORE_VERSION);
assert.equal(hypothesisOnly.evidence_coverage_pct, 100);
assert.equal(hypothesisOnly.evidence_state, "hypothesis");
assert.equal(hypothesisOnly.automation_eligibility, "research_only");
assert.ok(hypothesisOnly.decision_score < 40, "Model-only evidence must be strongly discounted");

const assumptionOnly = scoreOpportunityEvidence(
  dimensions.map((d) => make(d, "OPERATOR_ASSUMPTION"))
);
assert.equal(assumptionOnly.evidence_state, "hypothesis");
assert.equal(assumptionOnly.automation_eligibility, "research_only");

const authoritative = scoreOpportunityEvidence(
  dimensions.map((d) => make(d, "AUTHORITATIVE_PUBLIC"))
);
assert.equal(authoritative.evidence_state, "verified");
assert.equal(authoritative.automation_eligibility, "preview_candidate");
assert.ok(authoritative.decision_score >= 60 && authoritative.decision_score < 75);

const firstParty = scoreOpportunityEvidence(
  dimensions.map((d) => make(d, "FIRST_PARTY"))
);
assert.equal(firstParty.evidence_state, "verified");
assert.equal(firstParty.automation_eligibility, "release_candidate");
assert.ok(firstParty.decision_score >= 75);

const missingSafety = scoreOpportunityEvidence(
  dimensions
    .filter((d) => !["compliance_ease", "fulfillment"].includes(d))
    .map((d) => make(d, "FIRST_PARTY"))
);
assert.equal(missingSafety.automation_eligibility, "research_only");

const hypothesisField = scoreOpportunityEvidence([
  make("overall_hypothesis", "MODEL_ESTIMATE", 100),
]);
assert.equal(hypothesisField.decision_score, 0);
assert.equal(hypothesisField.evidence_coverage_pct, 0);
assert.equal(hypothesisField.automation_eligibility, "research_only");

const expired = scoreOpportunityEvidence([
  ...dimensions.map((d) => make(d, "FIRST_PARTY", 100, { expires_at: "2020-01-01T00:00:00.000Z" })),
]);
assert.equal(expired.decision_score, 0);
assert.equal(expired.evidence_count, 0);

const disputed = scoreOpportunityEvidence([
  ...dimensions.map((d) => make(d, "FIRST_PARTY", 100, { status: "disputed" })),
]);
assert.equal(disputed.decision_score, 0);
assert.equal(disputed.evidence_count, 0);

console.log("PASS | DDV3 scoring weights sum to 100");
console.log("PASS | Model-only evidence remains hypothesis/research-only");
console.log("PASS | Operator assumptions remain hypothesis/research-only");
console.log("PASS | Authoritative public evidence can reach preview, not release without first-party economics");
console.log("PASS | Strong first-party evidence can become release_candidate");
console.log("PASS | Missing compliance/fulfillment blocks preview eligibility");
console.log("PASS | overall_hypothesis never contributes to deterministic decision score");
console.log("PASS | expired evidence is ignored");
console.log("PASS | disputed evidence is ignored");
console.log("\nDDV3 evidence regression: 9/9 passed");
