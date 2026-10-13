import assert from "node:assert/strict";
import {
  DDV3_BUILD_POLICY_VERSION,
  DDV3_DEFAULT_PILOT_PAGE_LIMIT,
  validatePreviewBuildPlan,
} from "../base44/shared/ddv3BuildGuardrails.js";

const validBase = {
  policy_version: DDV3_BUILD_POLICY_VERSION,
  build_mode: "preview_only",
  release_authorized: false,
  schema_policy: "visible_content_only",
  canonical_policy: "self_canonical",
  robots_policy: "noindex_until_preview_validated",
  pilot_page_limit: DDV3_DEFAULT_PILOT_PAGE_LIMIT,
  validation_state: "unvalidated",
  proof_requirements: [
    "Only verified proof may appear.",
    "Every numeric claim retains evidence provenance.",
  ],
  page_specs: [
    {
      path: "/",
      page_type: "home",
      canonical_path: "/",
      index_eligibility: "noindex_until_validated",
      presence_claim: "none",
      unique_value_requirements: ["Evidence-backed buyer problem", "Useful conversion tool"],
      evidence_ids: ["oev_1"],
      visible_schema_types: ["WebSite"],
    },
    {
      path: "/services/test-service",
      page_type: "service",
      canonical_path: "/services/test-service",
      index_eligibility: "noindex_until_validated",
      presence_claim: "none",
      unique_value_requirements: ["Verified service scope", "Fulfillment constraints"],
      evidence_ids: ["oev_2"],
      visible_schema_types: ["Service"],
    },
  ],
};

const valid = validatePreviewBuildPlan(validBase, {
  opportunityEligibility: "preview_candidate",
  evidenceCoveragePct: 80,
});
assert.equal(valid.valid, true);
assert.equal(valid.blocked, false);

const productionMode = validatePreviewBuildPlan(
  { ...validBase, build_mode: "production" },
  { opportunityEligibility: "release_candidate", evidenceCoveragePct: 100 }
);
assert.ok(productionMode.errors.includes("BUILD_MODE_MUST_BE_PREVIEW_ONLY"));
assert.equal(productionMode.blocked, true);

const releaseSelfAuth = validatePreviewBuildPlan(
  { ...validBase, release_authorized: true },
  { opportunityEligibility: "release_candidate", evidenceCoveragePct: 100 }
);
assert.ok(releaseSelfAuth.errors.includes("PLANNER_CANNOT_AUTHORIZE_RELEASE"));
assert.equal(releaseSelfAuth.blocked, true);

const prematureIndex = validatePreviewBuildPlan(
  {
    ...validBase,
    page_specs: validBase.page_specs.map((p, i) =>
      i === 0 ? { ...p, index_eligibility: "eligible_after_preview_validation" } : p
    ),
  },
  { opportunityEligibility: "preview_candidate", evidenceCoveragePct: 80 }
);
assert.ok(prematureIndex.errors.includes("PAGE_1_INDEX_ELIGIBILITY_PREMATURE"));
assert.equal(prematureIndex.blocked, true);

const thin = validatePreviewBuildPlan(
  {
    ...validBase,
    page_specs: [
      { ...validBase.page_specs[0], unique_value_requirements: ["Only one generic bullet"] },
    ],
  },
  { opportunityEligibility: "preview_candidate", evidenceCoveragePct: 80 }
);
assert.ok(thin.errors.includes("PAGE_1_INSUFFICIENT_UNIQUE_VALUE"));

const duplicatePath = validatePreviewBuildPlan(
  {
    ...validBase,
    page_specs: [
      validBase.page_specs[0],
      { ...validBase.page_specs[1], path: "/", canonical_path: "/" },
    ],
  },
  { opportunityEligibility: "preview_candidate", evidenceCoveragePct: 80 }
);
assert.ok(duplicatePath.errors.includes("PAGE_2_DUPLICATE_PATH"));

const locationWithoutProof = validatePreviewBuildPlan(
  {
    ...validBase,
    canonical_location_id: "",
    serviceability_verified: false,
    local_value_score: 20,
    page_specs: [
      ...validBase.page_specs,
      {
        path: "/fl/test-city",
        page_type: "location",
        canonical_path: "/fl/test-city",
        index_eligibility: "noindex_until_validated",
        presence_claim: "service_area_only",
        unique_value_requirements: ["Verified serviceability", "Local project constraints"],
        evidence_ids: ["oev_local"],
        visible_schema_types: ["Service"],
      },
    ],
  },
  { opportunityEligibility: "preview_candidate", evidenceCoveragePct: 80 }
);
assert.ok(locationWithoutProof.errors.includes("PAGE_3_LOCATION_REGISTRY_REQUIRED"));
assert.ok(locationWithoutProof.errors.includes("PAGE_3_SERVICEABILITY_REQUIRED"));
assert.ok(locationWithoutProof.errors.includes("PAGE_3_LOCAL_VALUE_BELOW_70"));

const fakeOffice = validatePreviewBuildPlan(
  {
    ...validBase,
    canonical_location_id: "fl-test-city",
    serviceability_verified: true,
    local_value_score: 90,
    page_specs: [
      ...validBase.page_specs,
      {
        path: "/fl/test-city",
        page_type: "location",
        canonical_path: "/fl/test-city",
        index_eligibility: "noindex_until_validated",
        presence_claim: "verified_physical_location",
        unique_value_requirements: ["Verified serviceability", "Local project constraints"],
        evidence_ids: ["oev_local"],
        visible_schema_types: ["LocalBusiness"],
      },
    ],
  },
  { opportunityEligibility: "preview_candidate", evidenceCoveragePct: 80, physicalLocationVerified: false }
);
assert.ok(fakeOffice.errors.includes("PAGE_3_UNVERIFIED_PHYSICAL_LOCATION_CLAIM"));

const weakOpportunity = validatePreviewBuildPlan(validBase, {
  opportunityEligibility: "research_only",
  evidenceCoveragePct: 20,
});
assert.ok(weakOpportunity.errors.includes("OPPORTUNITY_NOT_ELIGIBLE_FOR_PREVIEW_PLAN"));
assert.ok(weakOpportunity.errors.includes("EVIDENCE_COVERAGE_BELOW_55"));
assert.equal(weakOpportunity.blocked, true);

const tooMany = validatePreviewBuildPlan(
  {
    ...validBase,
    page_specs: Array.from({ length: 26 }, (_, i) => ({
      ...validBase.page_specs[0],
      path: i === 0 ? "/" : `/resource-${i}`,
      canonical_path: i === 0 ? "/" : `/resource-${i}`,
      page_type: i === 0 ? "home" : "resource",
    })),
  },
  { opportunityEligibility: "preview_candidate", evidenceCoveragePct: 80 }
);
assert.ok(tooMany.errors.includes("PILOT_PAGE_LIMIT_EXCEEDED"));

console.log("PASS | preview-only valid plan");
console.log("PASS | production build mode rejected");
console.log("PASS | planner cannot self-authorize release");
console.log("PASS | indexing cannot be enabled before preview validation");
console.log("PASS | thin pages rejected");
console.log("PASS | duplicate paths rejected");
console.log("PASS | unverified local pages rejected");
console.log("PASS | fake physical location claim rejected");
console.log("PASS | weak opportunities blocked");
console.log("PASS | pilot page count capped at 25");
console.log("\nDDV3 build-plan regression: 10/10 passed");
