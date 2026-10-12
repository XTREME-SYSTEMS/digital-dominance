/**
 * North America geography and Google-index eligibility guardrails.
 * Markets are RESEARCH CANDIDATES by default, not serviceable sites.
 * No routes, DNS, pages, sitemaps, or public publications are created here.
 */
export const GEOGRAPHIES = Object.freeze({
  US: Object.freeze({
    regionType: "county_or_equivalent",
    officialSource: "U.S. Census Bureau, 2025 Gazetteer county files",
    sourceUrl: "https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.2025.html",
  }),
  CA: Object.freeze({
    regionType: "census_division",
    officialSource: "Statistics Canada, Standard Geographical Classification 2021",
    sourceUrl: "https://www.statcan.gc.ca/en/subjects/standard/sgc/2021/introduction",
  }),
  MX: Object.freeze({
    regionType: "municipio",
    officialSource: "INEGI, Catálogo Único de Claves Geoestadísticas",
    sourceUrl: "https://www.inegi.org.mx/app/ageeml/default.html",
  }),
});

const POSTAL_FORMATS = Object.freeze({
  US: /^[0-9]{5}(?:-[0-9]{4})?$/,
  CA: /^[A-Z][0-9][A-Z][ ]?[0-9][A-Z][0-9]$/,
  MX: /^[0-9]{5}$/,
});

export function normalizePostalCode(country, value) {
  const code = String(value ?? "").trim().toUpperCase().replace(/\s+/g, " ");
  if (country === "CA") {
    const compact = code.replace(/ /g, "");
    if (!/^[A-Z][0-9][A-Z][0-9][A-Z][0-9]$/.test(compact)) return "";
    return compact.slice(0, 3) + " " + compact.slice(3);
  }
  return code;
}

export function isValidPostalCode(country, value) {
  if (!Object.prototype.hasOwnProperty.call(GEOGRAPHIES, country)) return false;
  return POSTAL_FORMATS[country].test(normalizePostalCode(country, value));
}

export function createMarketCandidate({ country, governmentId, name, region }) {
  if (!GEOGRAPHIES[country]) throw new Error("Unsupported geography");
  if (![governmentId, name, region].every((x) => String(x ?? "").trim())) {
    throw new Error("Government identifier, name and region are required");
  }
  return {
    key: country + ":" + String(governmentId).trim(),
    country,
    governmentId: String(governmentId).trim(),
    name: String(name).trim(),
    region: String(region).trim(),
    geographyType: GEOGRAPHIES[country].regionType,
    officialSource: GEOGRAPHIES[country].sourceUrl,
    lifecycle: "DISCOVERED",
    verifiedServiceArea: false,
    uniqueLocalValueReviewed: false,
    leadRoutingTested: false,
    independentQaPassed: false,
    approvedForRelease: false,
    noindex: true,
    publishedUrl: null,
    receipts: {},
  };
}

/** A market is NOT ready simply because a city/county exists in a CSV. */
export function checkMarketIndexEligibility(market) {
  const blockers = [];
  if (!market || !GEOGRAPHIES[market.country]) blockers.push("official_geography_required");
  if (!market?.governmentId || !market?.officialSource) blockers.push("source_provenance_required");
  if (market?.verifiedServiceArea !== true) blockers.push("real_coverage_proof_required");
  if (market?.uniqueLocalValueReviewed !== true) blockers.push("independent_originality_review_required");
  if (market?.leadRoutingTested !== true) blockers.push("working_local_lead_routing_required");
  if (market?.independentQaPassed !== true) blockers.push("independent_http_visual_policy_qa_required");
  if (market?.approvedForRelease !== true) blockers.push("operator_release_approval_required");
  if (!market?.publishedUrl || !/^https:\/\/[^/\s]+\/.+/.test(market.publishedUrl)) blockers.push("verified_canonical_url_required");
  if (!market?.receipts?.qa || !market?.receipts?.approval || !market?.receipts?.coverage) blockers.push("immutable_receipts_required");
  return { eligible: blockers.length === 0, blockers };
}

/** Never emit speculative locations in the public XML sitemap. */
export function indexableMarketUrls(markets) {
  if (!Array.isArray(markets)) throw new TypeError("Markets must be an array");
  return [...new Set(markets.filter((m) => checkMarketIndexEligibility(m).eligible && m.noindex === false).map((m) => m.publishedUrl))];
}
