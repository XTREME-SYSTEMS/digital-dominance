export const DDV3_PREVIEW_POLICY_VERSION = "ddv3-private-preview-v1";

function cleanPath(path) {
  const raw = String(path || "").trim();
  if (!raw) return "";
  const withSlash = raw.startsWith("/") ? raw : "/" + raw;
  return withSlash.replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/";
}

function combinedText(section) {
  return [
    section?.heading,
    section?.body,
    ...(Array.isArray(section?.bullets) ? section.bullets : []),
  ].filter(Boolean).join(" ");
}

function riskyClaim(text) {
  const value = String(text || "");
  return (
    /\$|%/.test(value) ||
    /\b\d+(?:\.\d+)?\s*(?:years?|days?|hours?|minutes?|miles?|reviews?|stars?|customers?|projects?|locations?|leads?|sales?)\b/i.test(value) ||
    /\b(?:#\s*1|number\s*one|best|top[- ]rated|award[- ]winning|guarantee(?:d)?|licensed|insured|certified|five[- ]star|5[- ]star)\b/i.test(value)
  );
}

function physicalLocationClaim(text) {
  return /\b(?:our office|located in|visit us|headquartered|showroom at|office at|store at)\b/i.test(String(text || ""));
}

export function validateWebsitePreviewArtifact(artifact, plan, evidenceRows = [], options = {}) {
  const errors = [];
  const warnings = [];

  if (artifact?.preview_only !== true) errors.push("ARTIFACT_MUST_BE_PREVIEW_ONLY");
  if (artifact?.is_public !== false) errors.push("ARTIFACT_MUST_BE_PRIVATE");
  if (artifact?.robots_policy !== "noindex") errors.push("PREVIEW_MUST_BE_NOINDEX");
  if (plan?.validation_state !== "passed" || plan?.status !== "validated_for_preview") {
    errors.push("BUILD_PLAN_NOT_VALIDATED_FOR_PREVIEW");
  }
  if (plan?.release_authorized === true) errors.push("BUILD_PLAN_RELEASE_AUTHORIZATION_FORBIDDEN");

  const plannedPages = Array.isArray(plan?.page_specs) ? plan.page_specs : [];
  const pages = Array.isArray(artifact?.pages) ? artifact.pages : [];
  const plannedByPath = new Map(plannedPages.map((p) => [cleanPath(p.path), p]));
  const actualPaths = new Set();

  if (pages.length !== plannedPages.length) {
    errors.push("PREVIEW_PAGE_COUNT_MISMATCH");
  }

  const evidenceMap = new Map((evidenceRows || []).map((row) => [row.evidence_id, row]));
  if (plan?.canonical_location_id) {
    evidenceMap.set(`registry:${plan.canonical_location_id}`, {
      evidence_id: `registry:${plan.canonical_location_id}`,
      source_class: "AUTHORITATIVE_PUBLIC",
      status: "active",
      verification_state: "operator_verified",
    });
  }

  for (const [pageIndex, page] of pages.entries()) {
    const path = cleanPath(page?.path);
    const prefix = `PAGE_${pageIndex + 1}`;
    const planned = plannedByPath.get(path);

    if (!planned) {
      errors.push(`${prefix}_UNPLANNED_PATH`);
      continue;
    }
    if (actualPaths.has(path)) errors.push(`${prefix}_DUPLICATE_PATH`);
    actualPaths.add(path);

    if (page?.page_type !== planned.page_type) errors.push(`${prefix}_PAGE_TYPE_MISMATCH`);
    if (!String(page?.title || "").trim()) errors.push(`${prefix}_TITLE_REQUIRED`);
    if (!String(page?.h1 || "").trim()) errors.push(`${prefix}_H1_REQUIRED`);

    const sections = Array.isArray(page?.sections) ? page.sections : [];
    if (sections.length < 2) errors.push(`${prefix}_INSUFFICIENT_SECTIONS`);

    for (const [sectionIndex, section] of sections.entries()) {
      const sPrefix = `${prefix}_SECTION_${sectionIndex + 1}`;
      const text = combinedText(section);
      const evidenceIds = Array.isArray(section?.claim_evidence_ids)
        ? section.claim_evidence_ids.filter(Boolean)
        : [];

      if (!String(section?.heading || "").trim() && !String(section?.body || "").trim()) {
        errors.push(`${sPrefix}_EMPTY_SECTION`);
      }

      for (const id of evidenceIds) {
        if (!evidenceMap.has(id)) errors.push(`${sPrefix}_UNKNOWN_EVIDENCE_ID`);
      }

      if (section?.claim_class === "evidence_backed" && !evidenceIds.length) {
        errors.push(`${sPrefix}_EVIDENCE_BACKED_WITHOUT_EVIDENCE`);
      }

      if (riskyClaim(text) && !evidenceIds.length) {
        errors.push(`${sPrefix}_RISKY_CLAIM_WITHOUT_EVIDENCE`);
      }

      if (section?.section_type === "proof") {
        const supporting = evidenceIds.map((id) => evidenceMap.get(id)).filter(Boolean);
        if (!supporting.some((row) => row?.source_class === "FIRST_PARTY")) {
          errors.push(`${sPrefix}_PROOF_REQUIRES_FIRST_PARTY_EVIDENCE`);
        }
      }

      if (page?.page_type === "location" && physicalLocationClaim(text) && options.physicalLocationVerified !== true) {
        errors.push(`${sPrefix}_UNVERIFIED_PHYSICAL_LOCATION_COPY`);
      }

      if (section?.claim_class === "placeholder" && riskyClaim(text)) {
        errors.push(`${sPrefix}_PLACEHOLDER_CANNOT_MAKE_RISKY_CLAIM`);
      }
    }
  }

  for (const path of plannedByPath.keys()) {
    if (!actualPaths.has(path)) errors.push(`MISSING_PLANNED_PAGE:${path}`);
  }

  const sourceIds = new Set(Array.isArray(artifact?.source_evidence_ids) ? artifact.source_evidence_ids : []);
  for (const page of pages) {
    for (const section of page.sections || []) {
      for (const id of section.claim_evidence_ids || []) {
        if (!sourceIds.has(id) && !String(id).startsWith("registry:")) {
          warnings.push(`CLAIM_EVIDENCE_NOT_IN_ARTIFACT_SOURCE_SET:${id}`);
        }
      }
    }
  }

  return {
    policy_version: DDV3_PREVIEW_POLICY_VERSION,
    valid: errors.length === 0,
    blocked: errors.length > 0,
    errors,
    warnings: [...new Set(warnings)],
    page_count: pages.length,
  };
}
