import assert from "node:assert/strict";
import fs from "node:fs";
import { validateWebsitePreviewArtifact } from "../base44/shared/ddv3PreviewGuardrails.js";

const plan = {
  id: "plan_1",
  status: "validated_for_preview",
  validation_state: "passed",
  release_authorized: false,
  canonical_location_id: "",
  page_specs: [
    { path: "/", page_type: "home" },
    { path: "/proof", page_type: "proof" },
  ],
};

const evidence = [
  {
    evidence_id: "oev_first",
    source_class: "FIRST_PARTY",
    status: "active",
    verification_state: "operator_verified",
  },
  {
    evidence_id: "oev_third",
    source_class: "VERIFIED_THIRD_PARTY",
    status: "active",
    verification_state: "corroborated",
  },
];

const section = (overrides = {}) => ({
  section_type: "text",
  heading: "Useful information",
  body: "Clear service guidance for buyers.",
  bullets: ["What to expect", "Questions to ask"],
  claim_class: "generic",
  claim_evidence_ids: [],
  ...overrides,
});

const validArtifact = {
  artifact_id: "wpv_1",
  preview_only: true,
  is_public: false,
  robots_policy: "noindex",
  source_evidence_ids: ["oev_first", "oev_third"],
  pages: [
    {
      path: "/",
      page_type: "home",
      title: "Service Preview",
      h1: "A clearer way to evaluate your options",
      sections: [
        section({ section_type: "hero", heading: "Understand the service before you decide" }),
        section({ section_type: "benefits", heading: "What this page helps you compare" }),
      ],
    },
    {
      path: "/proof",
      page_type: "proof",
      title: "Verified Proof",
      h1: "Evidence you can inspect",
      sections: [
        section({
          section_type: "proof",
          heading: "Verified first-party evidence",
          body: "This proof section is grounded in retained first-party evidence.",
          claim_class: "evidence_backed",
          claim_evidence_ids: ["oev_first"],
        }),
        section({ heading: "How proof is evaluated" }),
      ],
    },
  ],
};

const valid = validateWebsitePreviewArtifact(validArtifact, plan, evidence);
assert.equal(valid.valid, true);
assert.equal(valid.blocked, false);

const publicArtifact = validateWebsitePreviewArtifact(
  { ...validArtifact, is_public: true },
  plan,
  evidence
);
assert.ok(publicArtifact.errors.includes("ARTIFACT_MUST_BE_PRIVATE"));

const notPreview = validateWebsitePreviewArtifact(
  { ...validArtifact, preview_only: false },
  plan,
  evidence
);
assert.ok(notPreview.errors.includes("ARTIFACT_MUST_BE_PREVIEW_ONLY"));

const wrongRobots = validateWebsitePreviewArtifact(
  { ...validArtifact, robots_policy: "index" },
  plan,
  evidence
);
assert.ok(wrongRobots.errors.includes("PREVIEW_MUST_BE_NOINDEX"));

const unvalidatedPlan = validateWebsitePreviewArtifact(
  validArtifact,
  { ...plan, status: "spec_ready", validation_state: "unvalidated" },
  evidence
);
assert.ok(unvalidatedPlan.errors.includes("BUILD_PLAN_NOT_VALIDATED_FOR_PREVIEW"));

const missingPlanned = validateWebsitePreviewArtifact(
  { ...validArtifact, pages: [validArtifact.pages[0]] },
  plan,
  evidence
);
assert.ok(missingPlanned.errors.includes("PREVIEW_PAGE_COUNT_MISMATCH"));
assert.ok(missingPlanned.errors.includes("MISSING_PLANNED_PAGE:/proof"));

const unplanned = validateWebsitePreviewArtifact(
  {
    ...validArtifact,
    pages: [
      validArtifact.pages[0],
      { ...validArtifact.pages[1], path: "/surprise" },
    ],
  },
  plan,
  evidence
);
assert.ok(unplanned.errors.includes("PAGE_2_UNPLANNED_PATH"));

const evidenceClassWithoutIds = validateWebsitePreviewArtifact(
  {
    ...validArtifact,
    pages: validArtifact.pages.map((page, pageIndex) => pageIndex === 0 ? {
      ...page,
      sections: [
        section({
          section_type: "hero",
          heading: "Evidence-backed claim",
          claim_class: "evidence_backed",
          claim_evidence_ids: [],
        }),
        page.sections[1],
      ],
    } : page),
  },
  plan,
  evidence
);
assert.ok(evidenceClassWithoutIds.errors.includes("PAGE_1_SECTION_1_EVIDENCE_BACKED_WITHOUT_EVIDENCE"));

const riskyWithoutEvidence = validateWebsitePreviewArtifact(
  {
    ...validArtifact,
    pages: validArtifact.pages.map((page, pageIndex) => pageIndex === 0 ? {
      ...page,
      sections: [
        section({
          section_type: "hero",
          heading: "Projects from $4,000",
          body: "Installation can be completed in 2 days.",
        }),
        page.sections[1],
      ],
    } : page),
  },
  plan,
  evidence
);
assert.ok(riskyWithoutEvidence.errors.includes("PAGE_1_SECTION_1_RISKY_CLAIM_WITHOUT_EVIDENCE"));

const proofThirdPartyOnly = validateWebsitePreviewArtifact(
  {
    ...validArtifact,
    pages: validArtifact.pages.map((page, pageIndex) => pageIndex === 1 ? {
      ...page,
      sections: [
        section({
          section_type: "proof",
          heading: "Third-party only proof",
          body: "This section cites third-party evidence only.",
          claim_class: "evidence_backed",
          claim_evidence_ids: ["oev_third"],
        }),
        page.sections[1],
      ],
    } : page),
  },
  plan,
  evidence
);
assert.ok(proofThirdPartyOnly.errors.includes("PAGE_2_SECTION_1_PROOF_REQUIRES_FIRST_PARTY_EVIDENCE"));

const proofFirstParty = validateWebsitePreviewArtifact(validArtifact, plan, evidence);
assert.equal(
  proofFirstParty.errors.some((x) => x.includes("PROOF_REQUIRES_FIRST_PARTY_EVIDENCE")),
  false
);

const locationPlan = {
  ...plan,
  canonical_location_id: "fl-test-city",
  page_specs: [
    { path: "/", page_type: "home" },
    { path: "/fl/test-city", page_type: "location" },
  ],
};
const locationArtifact = {
  ...validArtifact,
  source_evidence_ids: ["oev_first"],
  pages: [
    validArtifact.pages[0],
    {
      path: "/fl/test-city",
      page_type: "location",
      title: "Test City Service Area",
      h1: "Service for Test City",
      sections: [
        section({
          section_type: "hero",
          heading: "Visit our office in Test City",
          body: "Our office is ready to serve local buyers.",
          claim_class: "evidence_backed",
          claim_evidence_ids: ["registry:fl-test-city"],
        }),
        section({ heading: "Local service guidance" }),
      ],
    },
  ],
};
const fakeOffice = validateWebsitePreviewArtifact(
  locationArtifact,
  locationPlan,
  evidence,
  { physicalLocationVerified: false }
);
assert.ok(fakeOffice.errors.includes("PAGE_2_SECTION_1_UNVERIFIED_PHYSICAL_LOCATION_COPY"));

const unknownEvidence = validateWebsitePreviewArtifact(
  {
    ...validArtifact,
    pages: validArtifact.pages.map((page, pageIndex) => pageIndex === 0 ? {
      ...page,
      sections: [
        section({
          section_type: "hero",
          heading: "Grounded service claim",
          claim_class: "evidence_backed",
          claim_evidence_ids: ["oev_does_not_exist"],
        }),
        page.sections[1],
      ],
    } : page),
  },
  plan,
  evidence
);
assert.ok(unknownEvidence.errors.includes("PAGE_1_SECTION_1_UNKNOWN_EVIDENCE_ID"));

console.log("PASS | valid private preview artifact");
console.log("PASS | public preview rejected");
console.log("PASS | non-preview artifact rejected");
console.log("PASS | robots other than noindex rejected");
console.log("PASS | unvalidated build plan rejected");
console.log("PASS | missing planned page rejected");
console.log("PASS | unplanned path rejected");
console.log("PASS | evidence-backed claim without evidence rejected");
console.log("PASS | risky price/duration claim without evidence rejected");
console.log("PASS | proof requires first-party evidence");
console.log("PASS | proof with first-party evidence accepted");
console.log("PASS | unverified physical office language rejected");
console.log("PASS | unknown evidence ID rejected");

const vercel = JSON.parse(fs.readFileSync("vercel.json", "utf8"));
assert.ok(
  vercel.rewrites?.some((rule) =>
    rule.source === "/admin/ddv3-preview/:path*" &&
    rule.destination === "/index.html"
  ),
  "Private preview deep links must rewrite to index.html"
);
assert.ok(
  vercel.headers?.some((rule) =>
    rule.source === "/admin/ddv3-preview/:path*" &&
    rule.headers?.some((header) =>
      header.key === "X-Robots-Tag" &&
      /noindex/i.test(header.value || "")
    )
  ),
  "Private preview deep links must be noindex at the Vercel edge"
);

console.log("PASS | private preview deep links rewrite to the SPA shell");
console.log("PASS | private preview deep links carry edge noindex");
console.log("\nDDV3 private preview regression: 15/15 passed");
