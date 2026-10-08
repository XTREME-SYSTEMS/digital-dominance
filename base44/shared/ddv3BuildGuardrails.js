export const DDV3_BUILD_POLICY_VERSION = "ddv3-preview-build-v1";
export const DDV3_DEFAULT_PILOT_PAGE_LIMIT = 25;

const ALLOWED_PAGE_TYPES = new Set([
  "home", "service", "pricing", "process", "proof", "faq", "contact", "location", "resource",
]);

const ALLOWED_INDEX_STATES = new Set([
  "noindex_until_validated",
  "eligible_after_preview_validation",
  "blocked",
]);

function cleanPath(path) {
  const raw = String(path || "").trim();
  if (!raw) return "";
  const withSlash = raw.startsWith("/") ? raw : "/" + raw;
  return withSlash.replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/";
}

function hasUsefulValue(page) {
  const values = Array.isArray(page?.unique_value_requirements)
    ? page.unique_value_requirements.map((x) => String(x || "").trim()).filter(Boolean)
    : [];
  return values.length >= 2;
}

export function validatePreviewBuildPlan(plan, options = {}) {
  const errors = [];
  const warnings = [];
  const pages = Array.isArray(plan?.page_specs) ? plan.page_specs : [];
  const pilotLimit = Math.min(
    Math.max(Number(plan?.pilot_page_limit || DDV3_DEFAULT_PILOT_PAGE_LIMIT), 1),
    DDV3_DEFAULT_PILOT_PAGE_LIMIT
  );

  if (plan?.build_mode !== "preview_only") {
    errors.push("BUILD_MODE_MUST_BE_PREVIEW_ONLY");
  }
  if (plan?.release_authorized === true) {
    errors.push("PLANNER_CANNOT_AUTHORIZE_RELEASE");
  }
  if (plan?.schema_policy !== "visible_content_only") {
    errors.push("SCHEMA_MUST_MATCH_VISIBLE_CONTENT");
  }
  if (plan?.canonical_policy !== "self_canonical") {
    errors.push("SELF_CANONICAL_POLICY_REQUIRED");
  }
  if (plan?.robots_policy !== "noindex_until_preview_validated") {
    errors.push("ROBOTS_MUST_DEFAULT_NOINDEX");
  }
  if (!pages.length) {
    errors.push("NO_PAGE_SPECS");
  }
  if (pages.length > pilotLimit) {
    errors.push("PILOT_PAGE_LIMIT_EXCEEDED");
  }

  const seenPaths = new Set();
  for (const [index, page] of pages.entries()) {
    const path = cleanPath(page?.path);
    const prefix = `PAGE_${index + 1}`;

    if (!path) errors.push(`${prefix}_PATH_REQUIRED`);
    if (path && seenPaths.has(path)) errors.push(`${prefix}_DUPLICATE_PATH`);
    if (path) seenPaths.add(path);

    if (!ALLOWED_PAGE_TYPES.has(page?.page_type)) {
      errors.push(`${prefix}_UNSUPPORTED_PAGE_TYPE`);
    }
    if (!ALLOWED_INDEX_STATES.has(page?.index_eligibility)) {
      errors.push(`${prefix}_INVALID_INDEX_STATE`);
    }
    if (page?.index_eligibility === "eligible_after_preview_validation" && plan?.validation_state !== "passed") {
      errors.push(`${prefix}_INDEX_ELIGIBILITY_PREMATURE`);
    }
    if (!hasUsefulValue(page)) {
      errors.push(`${prefix}_INSUFFICIENT_UNIQUE_VALUE`);
    }

    if (page?.canonical_path && cleanPath(page.canonical_path) !== path) {
      errors.push(`${prefix}_CANONICAL_PATH_MISMATCH`);
    }

    const schemas = Array.isArray(page?.visible_schema_types) ? page.visible_schema_types : [];
    if (schemas.some((schema) => /LocalBusiness|Organization/i.test(String(schema))) &&
        page?.presence_claim === "none") {
      warnings.push(`${prefix}_SCHEMA_REQUIRES_VISIBLE_BUSINESS_CONTEXT`);
    }

    if (page?.page_type === "location") {
      if (!plan?.canonical_location_id) errors.push(`${prefix}_LOCATION_REGISTRY_REQUIRED`);
      if (plan?.serviceability_verified !== true) errors.push(`${prefix}_SERVICEABILITY_REQUIRED`);
      if (Number(plan?.local_value_score || 0) < 70) errors.push(`${prefix}_LOCAL_VALUE_BELOW_70`);
      if (page?.presence_claim === "verified_physical_location" && options.physicalLocationVerified !== true) {
        errors.push(`${prefix}_UNVERIFIED_PHYSICAL_LOCATION_CLAIM`);
      }
      if (page?.presence_claim === "none") {
        errors.push(`${prefix}_LOCATION_PRESENCE_TYPE_REQUIRED`);
      }
    }

    const evidenceIds = Array.isArray(page?.evidence_ids) ? page.evidence_ids.filter(Boolean) : [];
    if (["location", "service", "pricing", "proof"].includes(page?.page_type) && !evidenceIds.length) {
      warnings.push(`${prefix}_NO_DIRECT_EVIDENCE_IDS`);
    }
  }

  const proofRequirements = Array.isArray(plan?.proof_requirements)
    ? plan.proof_requirements.map((x) => String(x || "").trim()).filter(Boolean)
    : [];
  if (proofRequirements.length < 2) {
    errors.push("PROOF_REQUIREMENTS_INSUFFICIENT");
  }

  if (!["preview_candidate", "release_candidate"].includes(options.opportunityEligibility)) {
    errors.push("OPPORTUNITY_NOT_ELIGIBLE_FOR_PREVIEW_PLAN");
  }

  if (Number(options.evidenceCoveragePct || 0) < 55) {
    errors.push("EVIDENCE_COVERAGE_BELOW_55");
  }

  const blocked =
    errors.some((x) => /LOCATION_|SERVICEABILITY|LOCAL_VALUE|PHYSICAL_LOCATION/.test(x)) ||
    errors.includes("OPPORTUNITY_NOT_ELIGIBLE_FOR_PREVIEW_PLAN") ||
    errors.includes("EVIDENCE_COVERAGE_BELOW_55");

  return {
    policy_version: DDV3_BUILD_POLICY_VERSION,
    valid: errors.length === 0,
    blocked,
    errors,
    warnings,
    page_count: pages.length,
    pilot_page_limit: pilotLimit,
  };
}
