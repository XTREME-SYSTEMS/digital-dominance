import { createClientFromRequest } from "npm:@base44/sdk@0.8.48";
import {
  DDV3_BUILD_POLICY_VERSION,
  validatePreviewBuildPlan,
} from "../../shared/ddv3BuildGuardrails.js";

function slugify(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

function normalize(value: string) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function isNationalGeography(value: string) {
  return ["", "national", "nationwide", "usa", "us", "united states", "all"].includes(normalize(value));
}

async function stablePlanId(opportunityId: string, policyVersion: string) {
  const digest = new Uint8Array(await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${opportunityId}|${policyVersion}`)
  ));
  return "wbp_" + Array.from(digest.slice(0, 12)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function evidenceIdsFor(rows: any[], signalTypes: string[]) {
  return (rows || [])
    .filter((row) => signalTypes.includes(row.signal_type) && row.status !== "expired" && row.status !== "disputed")
    .map((row) => row.evidence_id)
    .filter(Boolean)
    .slice(0, 20);
}

function findCanonicalLocation(locations: any[], geography: string) {
  const geo = normalize(geography);
  if (!geo || isNationalGeography(geography)) return null;

  const exact = (locations || []).filter((loc) => {
    const city = normalize(loc.canonical_city);
    const state = normalize(loc.canonical_state);
    const abbr = normalize(loc.state_abbreviation);
    const candidates = new Set([
      city,
      `${city}, ${state}`,
      `${city}, ${abbr}`,
      `${city} ${state}`,
      `${city} ${abbr}`,
    ].filter(Boolean));
    return candidates.has(geo);
  });

  return exact.length === 1 ? exact[0] : null;
}

function page(path: string, pageType: string, query: string, intent: string, values: string[], evidenceIds: string[], extras: any = {}) {
  return {
    path,
    page_type: pageType,
    primary_query: query,
    search_intent: intent,
    canonical_path: path,
    index_eligibility: "noindex_until_validated",
    presence_claim: "none",
    unique_value_requirements: values,
    evidence_ids: evidenceIds,
    visible_schema_types: [],
    ...extras,
  };
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
    if (!opportunityId) return Response.json({ error: "opportunity_id required" }, { status: 400 });

    const svc = base44.asServiceRole;
    const opportunity = await svc.entities.Opportunity.get(opportunityId);
    if (!opportunity) return Response.json({ error: "Opportunity not found" }, { status: 404 });

    const evidenceRows = await svc.entities.OpportunityEvidence.filter(
      { opportunity_id: opportunityId },
      "-retrieved_at",
      500
    );

    const locations = await svc.entities.CanonicalLocationRegistry.list(500).catch(() => []);
    const geography = String(body?.geography || opportunity.geography || "").trim();
    const matchedLocation = findCanonicalLocation(locations || [], geography);

    const assumptions: string[] = [];
    const blockers: string[] = [];

    let primaryService = String(body?.primary_service || opportunity.service || "").trim();
    if (!primaryService) {
      primaryService = String(opportunity.title || "").trim();
      if (primaryService) assumptions.push("Primary service label derived from opportunity title and must be confirmed before preview rendering.");
    }
    if (!primaryService) blockers.push("MISSING_PRIMARY_SERVICE");

    const buyerArchetype = String(body?.buyer_archetype || opportunity.buyer_archetype || opportunity.buyer || "").trim();
    if (!buyerArchetype) assumptions.push("Buyer archetype is not yet specified.");

    const intent = String(body?.intent || opportunity.intent || "unknown").trim() || "unknown";
    const serviceSlug = slugify(primaryService || "service");

    const demandEvidence = evidenceIdsFor(evidenceRows, ["demand", "trend", "serp_opportunity", "buyer_value"]);
    const fulfillmentEvidence = evidenceIdsFor(evidenceRows, ["fulfillment", "first_party_conversion", "first_party_revenue"]);
    const economicsEvidence = evidenceIdsFor(evidenceRows, ["buyer_value", "first_party_revenue", "cpc_proxy", "cpl_proxy"]);
    const proofEvidence = evidenceIdsFor(evidenceRows, ["first_party_conversion", "first_party_revenue"]);
    const allEvidenceIds = (evidenceRows || []).map((row) => row.evidence_id).filter(Boolean).slice(0, 100);

    const pages: any[] = [
      page(
        "/",
        "home",
        primaryService,
        intent,
        [
          "Explain the buyer problem and service outcome using only evidence-backed claims.",
          "Show a useful next step or tool, not a keyword-only landing experience.",
          "Make all service-area and availability statements visibly consistent with verified fulfillment."
        ],
        [...new Set([...demandEvidence, ...fulfillmentEvidence])].slice(0, 20),
        { visible_schema_types: ["WebSite"] }
      ),
      page(
        `/services/${serviceSlug}`,
        "service",
        primaryService,
        intent,
        [
          "Describe scope, exclusions, process, and who the service is appropriate for.",
          "Include evidence-backed fulfillment constraints and real buyer decision criteria.",
          "Avoid unsupported superlatives, guarantees, or fabricated local proof."
        ],
        [...new Set([...demandEvidence, ...fulfillmentEvidence])].slice(0, 20),
        { visible_schema_types: ["Service"] }
      ),
      page(
        "/pricing",
        "pricing",
        `${primaryService} cost`,
        "commercial",
        [
          "Show only verified pricing, ranges, or estimation methodology; label estimates clearly.",
          "Explain the major cost drivers so the page is useful even when exact pricing varies."
        ],
        economicsEvidence,
        { visible_schema_types: ["WebPage"] }
      ),
      page(
        "/how-it-works",
        "process",
        `${primaryService} process`,
        "informational",
        [
          "Explain the real fulfillment workflow from inquiry through completion.",
          "State prerequisites, timing dependencies, and customer responsibilities without invented promises."
        ],
        fulfillmentEvidence,
        { visible_schema_types: ["HowTo"] }
      ),
      page(
        "/faq",
        "faq",
        `${primaryService} questions`,
        "informational",
        [
          "Answer recurring buyer questions derived from evidence and first-party sales/support knowledge.",
          "Keep answers materially useful and avoid repeating the same text from other pages."
        ],
        demandEvidence,
        { visible_schema_types: ["FAQPage"] }
      ),
      page(
        "/contact",
        "contact",
        `${primaryService} quote`,
        "transactional",
        [
          "Provide clear contact and qualification options without fake urgency.",
          "State consent, response expectations, and service-area constraints accurately."
        ],
        fulfillmentEvidence,
        { visible_schema_types: ["ContactPage"] }
      ),
    ];

    if (proofEvidence.length) {
      pages.splice(4, 0, page(
        "/proof",
        "proof",
        `${primaryService} results`,
        "commercial",
        [
          "Use only verified first-party projects, reviews, outcomes, credentials, or measurable results.",
          "Every numeric result or testimonial must retain evidence provenance and cannot be fabricated."
        ],
        proofEvidence,
        { visible_schema_types: ["CollectionPage"] }
      ));
    }

    let canonicalLocationId = "";
    let serviceabilityVerified = false;
    let localValueScore = 0;

    if (!isNationalGeography(geography)) {
      if (!matchedLocation) {
        blockers.push("CANONICAL_LOCATION_NOT_EXACTLY_RESOLVED");
      } else {
        canonicalLocationId = matchedLocation.location_id || "";
        localValueScore = Number(matchedLocation.local_value_score || 0);
        serviceabilityVerified =
          matchedLocation.serviceability_status === "serviceable" &&
          matchedLocation.validation_status === "passed" &&
          localValueScore >= 70;

        if (!serviceabilityVerified) blockers.push("LOCATION_NOT_VERIFIED_SERVICEABLE");

        const localEvidence = [
          ...demandEvidence,
          `registry:${matchedLocation.location_id}`,
        ].filter(Boolean);

        pages.push(page(
          matchedLocation.canonical_path,
          "location",
          `${primaryService} ${matchedLocation.canonical_city} ${matchedLocation.state_abbreviation || matchedLocation.canonical_state || ""}`.trim(),
          "transactional",
          [
            "Provide verified service-area availability and routing details for this exact market.",
            "Include materially useful local constraints, process details, or project considerations beyond city-name substitution.",
            "Never imply a physical office, local staff, reviews, or completed jobs unless separately verified."
          ],
          localEvidence,
          {
            presence_claim: "service_area_only",
            visible_schema_types: ["Service", "WebPage"],
          }
        ));
      }
    }

    const planId = await stablePlanId(opportunityId, DDV3_BUILD_POLICY_VERSION);
    const basePlan = {
      plan_id: planId,
      opportunity_id: opportunityId,
      policy_version: DDV3_BUILD_POLICY_VERSION,
      status: "draft",
      build_mode: "preview_only",
      release_authorized: false,
      primary_service: primaryService,
      intent,
      geography,
      buyer_archetype: buyerArchetype,
      proposed_domain: String(body?.proposed_domain || "").trim(),
      domain_verified: false,
      opportunity_decision_score: Number(opportunity.decision_score || 0),
      opportunity_evidence_state: opportunity.evidence_state || "hypothesis",
      opportunity_evidence_coverage_pct: Number(opportunity.evidence_coverage_pct || 0),
      source_evidence_ids: allEvidenceIds,
      canonical_location_id: canonicalLocationId,
      serviceability_verified: serviceabilityVerified,
      local_value_score: localValueScore,
      page_specs: pages,
      proof_requirements: [
        "No fabricated reviews, customers, projects, locations, awards, certifications, rankings, metrics, or testimonials.",
        "Every numeric or comparative claim must retain an evidence reference and freshness date.",
        "Location pages may claim only verified service-area coverage unless a physical location is independently verified.",
        "Structured data must describe visible page content and must not imply facts absent from the page."
      ],
      schema_policy: "visible_content_only",
      canonical_policy: "self_canonical",
      robots_policy: "noindex_until_preview_validated",
      pilot_page_limit: 25,
      validation_state: "unvalidated",
      validation_errors: [],
      validation_warnings: [],
      assumptions,
      blockers,
      created_at: new Date().toISOString(),
    };

    const preflight = validatePreviewBuildPlan(basePlan, {
      opportunityEligibility: opportunity.automation_eligibility,
      evidenceCoveragePct: opportunity.evidence_coverage_pct,
      physicalLocationVerified: false,
    });

    const finalBlockers = [...new Set([...blockers, ...preflight.errors])];
    basePlan.blockers = finalBlockers;
    basePlan.validation_errors = preflight.errors;
    basePlan.validation_warnings = preflight.warnings;
    basePlan.status = finalBlockers.length ? "blocked" : "spec_ready";

    const existing = await svc.entities.WebsiteBuildPlan.filter({ plan_id: planId }, "-created_at", 1);
    const plan = existing?.[0]
      ? await svc.entities.WebsiteBuildPlan.update(existing[0].id, basePlan)
      : await svc.entities.WebsiteBuildPlan.create(basePlan);

    await svc.entities.Opportunity.update(opportunityId, {
      build_plan_id: plan.id,
      build_plan_status: basePlan.status,
      build_plan_policy_version: DDV3_BUILD_POLICY_VERSION,
      updated_at: new Date().toISOString(),
    });

    return Response.json({
      ok: true,
      opportunity_id: opportunityId,
      build_plan_id: plan.id,
      plan_id: planId,
      status: basePlan.status,
      preflight_valid: preflight.valid,
      blockers: finalBlockers,
      warnings: preflight.warnings,
      assumptions,
      page_count: pages.length,
      release_authorized: false,
      build_mode: "preview_only",
      note: "This function creates a preview-only plan. It cannot deploy, publish, buy domains, submit indexing, or authorize release.",
    });
  } catch (error: any) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
