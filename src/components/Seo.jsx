import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { SEO_ROUTES, DEFAULT_SEO, buildJsonLd, SITE_URL, BUSINESS, applySeoSettings } from "@/lib/seoConfig";
import { base44 } from "@/api/base44Client";
import { trackEvent } from "@/lib/tracking";

// Module-level caches so we fetch once per session.
let overridesCache = null;
let overridesPromise = null;
async function loadOverrides() {
  if (overridesCache) return overridesCache;
  if (!overridesPromise) {
    overridesPromise = Promise.all([
      base44.entities.SeoContent.list(200).catch(() => []),
      base44.entities.GeneratedPage.list(200).catch(() => []),
    ]).then(([seoRows, genRows]) => {
      overridesCache = {};
      for (const r of seoRows) overridesCache[r.route] = r;
      // AI-generated pages act as SEO overrides keyed by their slug route.
      for (const g of genRows) {
        const path = "/" + g.slug;
        if (!overridesCache[path]) {
          overridesCache[path] = {
            route: path,
            title: g.title,
            description: g.meta_description,
            faq: g.faq,
          };
        }
      }
      return overridesCache;
    });
  }
  return overridesPromise;
}

let settingsCache = null;
let settingsPromise = null;
async function loadSettings() {
  if (settingsCache) return settingsCache;
  if (!settingsPromise) {
    settingsPromise = base44.entities.AppSettings.list(1)
      .then((rows) => { settingsCache = rows[0] || null; return settingsCache; })
      .catch(() => (settingsCache = null));
  }
  return settingsPromise;
}

export function bustSeoOverrides() {
  overridesCache = null;
  overridesPromise = null;
  settingsCache = null;
  settingsPromise = null;
}

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${CSS.escape(key)}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function removeCanonical() {
  document.head.querySelector('link[rel="canonical"]')?.remove();
}

function clearJsonLd() {
  document.head.querySelectorAll('script[data-seo="jsonld"]').forEach((s) => s.remove());
}

const NOINDEX_EXACT_PATHS = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/oauth/consent",
  "/app-onboarding",
  "/app-settings",
  "/elite",
  "/questionnaire",
  "/ThankYou",
  "/visualizer-test",
  "/portal",
  "/contractor",
  "/contractor/bid",
  "/smai/portal",
  "/smai/admin-portal",
]);

const NOINDEX_PREFIXES = [
  "/admin",
  "/results/",
  "/book/",
  "/booked/",
];

function shouldNoIndex(path) {
  return NOINDEX_EXACT_PATHS.has(path) || NOINDEX_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix));
}

// Route-aware SEO: applies matching meta tags + JSON-LD, with AI-optimized
// overrides from the SeoContent entity layered on top of the static config.
// Also injects the Google Search Console verification tag from AppSettings.
export default function RouteSeo() {
  const location = useLocation();
  const [overrides, setOverrides] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    loadOverrides().then(setOverrides);
    loadSettings().then(setSettings);
  }, []);

  useEffect(() => {
    if (!overrides) return;
    applySeoSettings(settings);
    const path = location.pathname;
    let cfg = SEO_ROUTES[path];
    if (!cfg) {
      const dynKey = Object.keys(SEO_ROUTES).find(
        (k) => k.includes(":") && path.startsWith(k.split(":")[0])
      );
      cfg = dynKey ? SEO_ROUTES[dynKey] : DEFAULT_SEO;
    }

    const ov = overrides[path];
    const title = (ov && ov.title) || cfg.title || DEFAULT_SEO.title;
    const desc = (ov && ov.description) || cfg.description || DEFAULT_SEO.description;
    const image = cfg.image || DEFAULT_SEO.image;
    const faq = (ov && ov.faq && ov.faq.length) ? ov.faq : cfg.faq;
    const merged = { ...cfg, title, description: desc, faq };

    const url = SITE_URL + path;
    document.title = title;
    const runtimeNotFound = document.documentElement.dataset.pageNotFound === "true";
    const noIndex = shouldNoIndex(path) || runtimeNotFound;
    setMeta("name", "description", desc);
    setMeta("name", "robots", noIndex ? "noindex, nofollow" : "index, follow");
    if (runtimeNotFound) removeCanonical();
    else setCanonical(url);

    // Google Search Console verification tag (injected from AppSettings)
    if (settings?.google_site_verification) {
      setMeta("name", "google-site-verification", settings.google_site_verification);
    }

    setMeta("property", "og:type", cfg.service ? "article" : "website");
    setMeta("property", "og:site_name", settings?.seo?.site_name || BUSINESS.name);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:url", url);
    setMeta("property", "og:image", image);

    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", desc);
    setMeta("name", "twitter:image", image);

    clearJsonLd();
    if (!noIndex) {
      const blocks = buildJsonLd(path, merged);
      blocks.forEach((obj) => {
        const s = document.createElement("script");
        s.type = "application/ld+json";
        s.setAttribute("data-seo", "jsonld");
        s.textContent = JSON.stringify(obj);
        document.head.appendChild(s);
      });
    }

    // Track page views on location routes (/{state}/{city}) for the location performance dashboard
    const locMatch = path.match(/^\/([a-z]{2})\/([a-z0-9-]+)/i);
    if (locMatch) {
      trackEvent("page_view", { path });
    }
  }, [location.pathname, overrides, settings]);

  return null;
}