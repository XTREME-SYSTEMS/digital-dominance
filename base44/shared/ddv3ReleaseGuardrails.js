export const DDV3_RELEASE_POLICY_VERSION = "ddv3-release-review-v1";

const REQUIRED_CORE_ACTIONS = new Set([
  "default_branch_merge",
  "production_deploy",
  "public_publish",
]);

const DEFERRED_PROTECTED_ACTIONS = new Set([
  "domain_binding",
  "indexing_request",
  "customer_messaging",
  "social_publish",
  "paid_provisioning",
]);

function clean(value) {
  return String(value || "").trim();
}

export function validateWebsiteReleaseReview({
  review,
  opportunity,
  plan,
  artifact,
  siteRegistry,
  approvalRequest = null,
}) {
  const errors = [];
  const warnings = [];

  if (!review) errors.push("RELEASE_REVIEW_REQUIRED");
  if (!opportunity) errors.push("OPPORTUNITY_REQUIRED");
  if (!plan) errors.push("BUILD_PLAN_REQUIRED");
  if (!artifact) errors.push("VALIDATED_PREVIEW_REQUIRED");

  if (review?.target_environment !== "production") {
    errors.push("TARGET_ENVIRONMENT_MUST_BE_PRODUCTION");
  }
  if (review?.release_authorized === true) {
    errors.push("PREPARATION_CANNOT_AUTHORIZE_RELEASE");
  }

  if (opportunity?.automation_eligibility !== "release_candidate") {
    errors.push("OPPORTUNITY_NOT_RELEASE_CANDIDATE");
  }
  if (opportunity?.evidence_state !== "verified") {
    errors.push("OPPORTUNITY_EVIDENCE_NOT_VERIFIED");
  }
  if (Number(opportunity?.evidence_coverage_pct || 0) < 80) {
    errors.push("OPPORTUNITY_EVIDENCE_COVERAGE_BELOW_80");
  }
  if (Number(opportunity?.evidence_quality_score || 0) < 70) {
    errors.push("OPPORTUNITY_EVIDENCE_QUALITY_BELOW_70");
  }

  if (plan?.status !== "preview_ready" || plan?.validation_state !== "passed") {
    errors.push("BUILD_PLAN_NOT_PREVIEW_READY");
  }
  if (plan?.release_authorized === true) {
    errors.push("BUILD_PLAN_RELEASE_FLAG_FORBIDDEN");
  }

  if (artifact?.status !== "validated" || artifact?.validation_state !== "passed") {
    errors.push("PREVIEW_ARTIFACT_NOT_VALIDATED");
  }
  if (artifact?.preview_only !== true || artifact?.is_public !== false) {
    errors.push("PREVIEW_ARTIFACT_PRIVACY_BOUNDARY_BROKEN");
  }
  if (artifact?.robots_policy !== "noindex") {
    errors.push("PREVIEW_ARTIFACT_MUST_REMAIN_NOINDEX");
  }

  const protectedActions = new Set(Array.isArray(review?.protected_actions) ? review.protected_actions : []);
  for (const action of REQUIRED_CORE_ACTIONS) {
    if (!protectedActions.has(action)) errors.push(`MISSING_PROTECTED_ACTION:${action}`);
  }

  const deferred = new Set(Array.isArray(review?.deferred_actions) ? review.deferred_actions : []);
  for (const action of deferred) {
    if (!DEFERRED_PROTECTED_ACTIONS.has(action)) {
      errors.push(`UNKNOWN_DEFERRED_ACTION:${action}`);
    }
  }

  const targetRepository = clean(review?.target_repository);
  const targetBranch = clean(review?.target_branch);
  const targetVercelProject = clean(review?.target_vercel_project);
  const targetDomain = clean(review?.target_domain).replace(/^https?:\/\//, "").replace(/\/+$/, "");

  if (!targetRepository) errors.push("TARGET_REPOSITORY_REQUIRED");
  if (!targetBranch) errors.push("TARGET_BRANCH_REQUIRED");
  if (!targetVercelProject) errors.push("TARGET_VERCEL_PROJECT_REQUIRED");
  if (!targetDomain) errors.push("TARGET_DOMAIN_REQUIRED");

  if (siteRegistry) {
    const canonicalDomain = clean(siteRegistry.canonical_domain).replace(/^https?:\/\//, "").replace(/\/+$/, "");
    const canonicalRepo = clean(siteRegistry.github_repository);
    const canonicalBranch = clean(siteRegistry.production_branch || "main");
    const canonicalProject = clean(siteRegistry.vercel_project);

    if (canonicalDomain && targetDomain !== canonicalDomain) errors.push("TARGET_DOMAIN_CANONICAL_MISMATCH");
    if (canonicalRepo && targetRepository !== canonicalRepo) errors.push("TARGET_REPOSITORY_CANONICAL_MISMATCH");
    if (canonicalBranch && targetBranch !== canonicalBranch) errors.push("TARGET_BRANCH_CANONICAL_MISMATCH");
    if (canonicalProject && targetVercelProject !== canonicalProject) errors.push("TARGET_VERCEL_PROJECT_CANONICAL_MISMATCH");
    if (siteRegistry.data_quarantine === true) errors.push("CANONICAL_SITE_DATA_QUARANTINED");
  } else {
    warnings.push("CANONICAL_SITE_REGISTRY_NOT_FOUND");
  }

  const rollback = clean(review?.rollback_plan);
  if (rollback.length < 40) errors.push("ROLLBACK_PLAN_INSUFFICIENT");

  let manifest = {};
  try { manifest = JSON.parse(review?.release_manifest || "{}"); } catch { errors.push("RELEASE_MANIFEST_INVALID_JSON"); }
  if (!manifest || typeof manifest !== "object") errors.push("RELEASE_MANIFEST_REQUIRED");
  if (!clean(manifest.source_branch)) errors.push("RELEASE_MANIFEST_SOURCE_BRANCH_REQUIRED");
  if (!clean(manifest.source_sha)) errors.push("RELEASE_MANIFEST_SOURCE_SHA_REQUIRED");
  if (!clean(manifest.preview_deployment_id)) errors.push("RELEASE_MANIFEST_PREVIEW_DEPLOYMENT_REQUIRED");
  if (manifest.production_mutation_performed === true) errors.push("RELEASE_MANIFEST_ALREADY_MUTATED_PRODUCTION");

  if (approvalRequest) {
    if (approvalRequest.risk_class !== "PROTECTED") errors.push("APPROVAL_RISK_CLASS_MUST_BE_PROTECTED");
    if (!["PENDING", "APPROVED", "DENIED", "EXPIRED"].includes(approvalRequest.status)) {
      errors.push("APPROVAL_STATUS_INVALID");
    }
  }

  return {
    policy_version: DDV3_RELEASE_POLICY_VERSION,
    valid: errors.length === 0,
    blocked: errors.length > 0,
    errors,
    warnings: [...new Set(warnings)],
    operator_approval_required: true,
    release_authorized: false,
  };
}
