import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import EpoxyContractorTemplate from "@/components/seo/EpoxyContractorTemplate";
import PageNotFound from "@/lib/PageNotFound";
import { base44 } from "@/api/base44Client";
import {
  SEO_LOCATIONS,
  citySlug,
  locationSeoConfig,
} from "@/lib/seoConfig";

// ── Comprehensive US state + Canadian province mapping ──────────────────────
// Alpha Prime Canonical URL Grammar: /{2-letter-state}/{city-slug}
// Full-state-name URLs redirect to 2-letter-code URLs (e.g. /florida/miami → /fl/miami)
const STATE_MAP = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan",
  MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
  NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota",
  OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
  WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  ON: "Ontario", AB: "Alberta", BC: "British Columbia",
};

// Reverse: full state name slug → 2-letter code
const STATE_SLUG_TO_CODE = {};
for (const [code, name] of Object.entries(STATE_MAP)) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  STATE_SLUG_TO_CODE[slug] = code;
}

const slugify = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Resolve a state URL segment to { code, name, needsRedirect }
function resolveState(segment) {
  const s = (segment || "").toLowerCase();
  // Direct 2-letter code match
  for (const [code, name] of Object.entries(STATE_MAP)) {
    if (code.toLowerCase() === s) return { code, name, needsRedirect: false };
  }
  // Full state name slug → redirect to 2-letter code
  if (STATE_SLUG_TO_CODE[s]) {
    const code = STATE_SLUG_TO_CODE[s];
    return { code, name: STATE_MAP[code], needsRedirect: true };
  }
  return null;
}

export default function LocationSeoPage() {
  const { state, citySlug: slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [pageData, setPageData] = useState(null);

  const resolved = resolveState(state);

  useEffect(() => {
    if (!resolved) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    // Redirect legacy full-state-name URLs with a full document navigation.
    // Base44's SPA shell may return HTTP 200 before React runs, so mark the
    // legacy URL noindex and point its canonical at the destination first.
    if (resolved.needsRedirect) {
      const canonicalPath = `/${resolved.code.toLowerCase()}/${slug}`;
      const canonicalUrl = `https://epoxyquotenearme.com${canonicalPath}`;

      let robots = document.head.querySelector('meta[name="robots"]');
      if (!robots) {
        robots = document.createElement("meta");
        robots.setAttribute("name", "robots");
        document.head.appendChild(robots);
      }
      robots.setAttribute("content", "noindex, follow");

      let canonical = document.head.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.setAttribute("rel", "canonical");
        document.head.appendChild(canonical);
      }
      canonical.setAttribute("href", canonicalUrl);

      window.location.replace(canonicalPath);
      return;
    }

    const { code: stateCode, name: stateName } = resolved;

    // 1. Check if it's a real XPS store location (static, always available)
    const loc = SEO_LOCATIONS.find(
      (l) => l.state === stateCode && citySlug(l.city) === slug
    );

    if (loc) {
      const cfg = locationSeoConfig(loc);
      setPageData({ loc, cfg, stateName });
      setLoading(false);
      return;
    }

    // 2. Check CanonicalLocationRegistry for approved locations
    // Only approved locations get pages — unknown slugs get 404 (no synthetic pages)
    const locationId = `${stateCode.toLowerCase()}-${slug}`;
    base44.entities.CanonicalLocationRegistry.filter({ location_id: locationId }, "-created_date", 1)
      .then((results) => {
        if (results && results.length > 0) {
          const reg = results[0];
          const approvedLoc = { city: reg.canonical_city, state: reg.state_abbreviation || stateCode };
          const cfg = locationSeoConfig(approvedLoc);
          setPageData({ loc: approvedLoc, cfg, stateName: reg.canonical_state || stateName, registry: reg });
        } else {
          // Not in registry → 404 (not a synthetic page)
          setNotFound(true);
        }
        setLoading(false);
      })
      .catch(() => {
        // Registry query failed → 404 (fail closed, do not manufacture synthetic pages)
        setNotFound(true);
        setLoading(false);
      });
  }, [state, slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-8 h-8 border-4 border-stone-200 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!resolved || notFound || !pageData) return <PageNotFound />;

  return (
    <EpoxyContractorTemplate
      city={pageData.loc.city}
      stateCode={pageData.loc.state}
      stateName={pageData.stateName}
      seoConfig={pageData.cfg}
    />
  );
}