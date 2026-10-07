// GPT PACK DESIGN CONSTITUTION — SOURCE OF TRUTH
// Version 1.0.0
// Any GPT/agent creating visual packs for Digital Dominance must satisfy this contract
// before a pack is accepted by Pack Sync V2.

export const PACK_DESIGN_CONSTITUTION_VERSION = "1.0.0";

export const VISUAL_PACK_TYPES = [
  "logo_pack",
  "brand_pack",
  "web_pack",
  "app_pack",
  "graphic_pack",
  "social_pack",
  "motion_pack",
  "pwa_pack",
  "component_pack",
  "design_system_pack",
] as const;

export const PACK_RESEARCH_REQUIREMENTS = {
  browser_required: true,
  benchmark_competitors_min: 3,
  source_urls_min: 6,
  keyword_rows_min: 10,
  retail_pricing_rows_min: 3,
  top_products_services_min: 5,
  design_patterns_min: 5,
  funnel_patterns_min: 3,
  freshness_hours_default: 24,
  mandatory_domains: [
    "industry",
    "competitors",
    "financials",
    "business_model",
    "niches",
    "trends",
    "keywords",
    "target_market",
    "retail_pricing",
    "top_products_services",
    "design_patterns",
    "funnel_patterns",
    "seo_aeo_geo",
  ],
};

export const PACK_GENERATION_REQUIREMENTS = {
  logo_pack: 10,
  brand_pack: 10,
  web_pack: 10,
  app_pack_when_requested: 10,
  selection_gate_required: true,
  regenerate_supported: true,
  accent_change_supported: true,
};

export const PACK_CONTENT_CONTRACTS = {
  logo_pack: [
    "primary_logo", "horizontal_logo", "stacked_logo", "icon_mark", "favicon",
    "one_color", "reversed", "transparent_background", "clear_space_rule",
    "minimum_size_rule", "vector_safe_geometry", "usage_do_dont",
  ],
  brand_pack: [
    "positioning", "audience_segments", "brand_archetype", "core_promise", "taglines",
    "color_palette_hex", "color_usage_rules", "typography_hierarchy", "fallback_fonts",
    "logo_usage", "gradients", "textures", "iconography", "photography_direction",
    "copy_voice", "usage_do_dont", "accessibility_notes", "print_usage", "digital_usage",
  ],
  web_pack: [
    "page_map", "homepage_sections", "mobile_layout", "tablet_layout", "desktop_layout",
    "pwa_behavior", "component_inventory", "component_variants", "form_logic",
    "trust_modules", "cta_map", "motion_states", "seo_modules", "schema_modules",
    "backend_dependencies", "analytics_events", "loading_states", "empty_states",
    "error_states", "accessibility", "acceptance_criteria", "reference_screenshots",
  ],
  app_pack: [
    "screen_map", "navigation_model", "mobile_layout", "tablet_layout", "desktop_layout",
    "pwa_shell", "auth_states", "data_model_bindings", "form_logic", "offline_behavior",
    "loading_states", "empty_states", "error_states", "notifications", "analytics_events",
    "accessibility", "operational_contract", "acceptance_criteria", "reference_screenshots",
  ],
  other_visual_pack: [
    "purpose", "asset_inventory", "dimensions", "safe_zones", "responsive_or_export_rules",
    "brand_bindings", "acceptance_criteria", "reference_screenshots",
  ],
};

export const PACK_QUALITY_GATES = {
  visual_score_min: 99,
  operational_score_required: 100,
  mobile_required: true,
  tablet_required: true,
  desktop_required: true,
  dark_mode_when_applicable: true,
  light_mode_when_applicable: true,
  accessibility_required: true,
  responsive_required: true,
  loading_empty_error_states_required: true,
  real_data_only_when_claimed: true,
  no_fake_reviews: true,
  no_fake_people_or_customers: true,
  no_unverified_metrics: true,
  source_provenance_required: true,
  independent_validator_required: true,
  bounded_repair_attempts: 3,
};

export const PACK_RESEARCH_SEQUENCE = [
  "resolve_intent_and_industry",
  "select_browser_executor",
  "discover_top_3_benchmark_systems",
  "browse_and_reverse_engineer_top_3",
  "research_industry",
  "research_competitors",
  "research_financials",
  "research_business_model",
  "research_niches",
  "research_trends",
  "research_search_demand_and_keywords",
  "research_target_market",
  "research_retail_pricing",
  "research_top_products_services",
  "extract_design_and_funnel_patterns",
  "compile_verified_claims_unknowns_and_sources",
  "score_research_gate",
  "only_then_generate_visual_packs",
];

export const PACK_DESIGN_CONSTITUTION = {
  constitution_version: PACK_DESIGN_CONSTITUTION_VERSION,
  name: "Strategic Minds AI / Digital Dominance GPT Pack Constitution",
  mission:
    "Research first, design second, build third, validate independently. GPT visuals become deterministic Base44 build inputs, not decorative screenshots.",
  research: PACK_RESEARCH_REQUIREMENTS,
  generation: PACK_GENERATION_REQUIREMENTS,
  quality: PACK_QUALITY_GATES,
  sequence: PACK_RESEARCH_SEQUENCE,
  pack_types: VISUAL_PACK_TYPES,
  pack_contracts: PACK_CONTENT_CONTRACTS,
  acceptance:
    "No visual pack is compliant without a READY PackResearchDossier. No implementation is certified until independent validation records visual >=99 and operational =100.",
};

export function requiredCountForPackType(packType: string, appRequested = false): number {
  const normalized = (packType || "").toLowerCase().replace(/[\\s-]+/g, "_");
  if (normalized === "logo_pack" || normalized === "logopack") return 10;
  if (normalized === "brand_pack" || normalized === "brandpack") return 10;
  if (normalized === "web_pack" || normalized === "webpack") return 10;
  if ((normalized === "app_pack" || normalized === "apppack") && appRequested) return 10;
  return 0;
}

export function packContentGateFailures(packType: string, qualityManifest: any): string[] {
  const normalized = (packType || "").toLowerCase().replace(/[\\s-]+/g, "_");
  const key = normalized === "logo_pack" ? "logo_pack"
    : normalized === "brand_pack" ? "brand_pack"
    : normalized === "web_pack" ? "web_pack"
    : normalized === "app_pack" ? "app_pack"
    : "other_visual_pack";
  const required = (PACK_CONTENT_CONTRACTS as any)[key] || [];
  if (!qualityManifest || typeof qualityManifest !== "object") return ["MISSING_QUALITY_MANIFEST"];
  const failures: string[] = [];
  for (const field of required) {
    const value = qualityManifest[field];
    const missing = value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
    if (missing) failures.push("MISSING_" + String(field).toUpperCase());
  }
  return failures;
}

export function researchGateFailures(dossier: any): string[] {
  const failures: string[] = [];
  if (!dossier) return ["MISSING_RESEARCH_DOSSIER"];
  if (dossier.research_status !== "ready") failures.push("RESEARCH_NOT_READY");
  if (!dossier.browser_executor) failures.push("BROWSER_RESEARCH_MISSING");
  if ((dossier.benchmark_competitors || []).length < PACK_RESEARCH_REQUIREMENTS.benchmark_competitors_min) failures.push("TOP_3_BENCHMARKS_MISSING");
  if ((dossier.source_urls || []).length < PACK_RESEARCH_REQUIREMENTS.source_urls_min) failures.push("INSUFFICIENT_SOURCE_PROVENANCE");
  if ((dossier.keyword_research || []).length < PACK_RESEARCH_REQUIREMENTS.keyword_rows_min) failures.push("KEYWORD_RESEARCH_INCOMPLETE");
  if ((dossier.retail_pricing || []).length < PACK_RESEARCH_REQUIREMENTS.retail_pricing_rows_min) failures.push("PRICING_RESEARCH_INCOMPLETE");
  if ((dossier.top_products_services || []).length < PACK_RESEARCH_REQUIREMENTS.top_products_services_min) failures.push("PRODUCT_SERVICE_RESEARCH_INCOMPLETE");
  if ((dossier.design_patterns || []).length < PACK_RESEARCH_REQUIREMENTS.design_patterns_min) failures.push("DESIGN_RESEARCH_INCOMPLETE");
  if ((dossier.funnel_patterns || []).length < PACK_RESEARCH_REQUIREMENTS.funnel_patterns_min) failures.push("FUNNEL_RESEARCH_INCOMPLETE");
  if (!dossier.industry_research || !Object.keys(dossier.industry_research).length) failures.push("INDUSTRY_RESEARCH_MISSING");
  if (!dossier.financial_research || !Object.keys(dossier.financial_research).length) failures.push("FINANCIAL_RESEARCH_MISSING");
  if (!dossier.business_model_research || !Object.keys(dossier.business_model_research).length) failures.push("BUSINESS_MODEL_RESEARCH_MISSING");
  if (!dossier.target_market || !Object.keys(dossier.target_market).length) failures.push("TARGET_MARKET_RESEARCH_MISSING");
  if (!dossier.seo_aeo_geo_findings || !Object.keys(dossier.seo_aeo_geo_findings).length) failures.push("SEO_AEO_GEO_RESEARCH_MISSING");
  if (dossier.expires_at && new Date(dossier.expires_at).getTime() <= Date.now()) failures.push("RESEARCH_STALE");
  return failures;
}
