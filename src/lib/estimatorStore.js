const KEY = "gf_estimator";

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

export function captureAttribution() {
  const p = new URLSearchParams(window.location.search);
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
  const current = Object.fromEntries(keys.map(k => [k, p.get(k) || ""]));
  let previous = null;
  try { previous = JSON.parse(sessionStorage.getItem("gf_attribution")); } catch {}
  const hasUtm = keys.some(k => current[k]);
  const value = previous && !hasUtm ? previous : {
    ...current,
    referrer: document.referrer || "",
    landing_page: window.location.pathname,
    lead_source: hasUtm ? "paid" : "website"
  };
  try { sessionStorage.setItem("gf_attribution", JSON.stringify(value)); } catch {}
  return value;
}