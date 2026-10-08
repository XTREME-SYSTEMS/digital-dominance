import { getSessionId } from "@/lib/tracking";

const KEY = "gf_estimator";
const ATTR_FIRST_KEY = "gf_attribution_first";
const ATTR_LAST_KEY = "gf_attribution_last";

export function loadDraft() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

export function saveDraft(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function clearDraft() {
  localStorage.removeItem(KEY);
}

function readSessionJson(key) {
  try { return JSON.parse(sessionStorage.getItem(key)) || null; } catch { return null; }
}

function writeSessionJson(key, value) {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function buildTouch() {
  const p = new URLSearchParams(window.location.search);
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
  const utm = Object.fromEntries(keys.map((k) => [k, p.get(k) || ""]));
  return {
    ...utm,
    referrer: document.referrer || "",
    landing_page: window.location.pathname,
    captured_at: new Date().toISOString(),
  };
}

export function captureAttribution() {
  const session_id = getSessionId();
  const current = buildTouch();
  const hasCurrentUtm = Object.keys(current)
    .filter((k) => k.startsWith("utm_"))
    .some((k) => current[k]);

  let first = readSessionJson(ATTR_FIRST_KEY);
  if (!first) {
    first = current;
    writeSessionJson(ATTR_FIRST_KEY, first);
  }

  const previousLast = readSessionJson(ATTR_LAST_KEY);
  const last = hasCurrentUtm || !previousLast
    ? current
    : {
        ...previousLast,
        referrer: current.referrer || previousLast.referrer || "",
        landing_page: current.landing_page,
        captured_at: current.captured_at,
      };
  writeSessionJson(ATTR_LAST_KEY, last);

  const primary = hasCurrentUtm ? last : first;
  const lead_source = primary.utm_source
    ? "paid"
    : /google\.|bing\.|yahoo\.|duckduckgo\./i.test(primary.referrer || "")
      ? "organic"
      : "website";

  return {
    session_id,
    site_id: window.location.hostname,
    build_sha: import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA || import.meta.env.VITE_GIT_COMMIT_SHA || "",
    deployment_id: import.meta.env.VITE_VERCEL_DEPLOYMENT_ID || "",

    // Backward-compatible primary fields.
    utm_source: primary.utm_source || "",
    utm_medium: primary.utm_medium || "",
    utm_campaign: primary.utm_campaign || "",
    utm_term: primary.utm_term || "",
    utm_content: primary.utm_content || "",
    referrer: primary.referrer || "",
    landing_page: first.landing_page || current.landing_page,
    lead_source,

    // Explicit first/last touch fields for DDV3 attribution.
    first_referrer: first.referrer || "",
    first_landing_page: first.landing_page || "",
    first_utm_source: first.utm_source || "",
    first_utm_medium: first.utm_medium || "",
    first_utm_campaign: first.utm_campaign || "",
    first_utm_term: first.utm_term || "",
    first_utm_content: first.utm_content || "",

    last_referrer: last.referrer || "",
    last_landing_page: last.landing_page || "",
    last_utm_source: last.utm_source || "",
    last_utm_medium: last.utm_medium || "",
    last_utm_campaign: last.utm_campaign || "",
    last_utm_term: last.utm_term || "",
    last_utm_content: last.utm_content || "",

    conversion_page: window.location.pathname,
    attribution_captured_at: new Date().toISOString(),
  };
}
