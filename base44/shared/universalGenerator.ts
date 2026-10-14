/**
 * Universal Generator — Single entry point for all site/template/content generation.
 *
 * Every generation pipeline in the system (stockTemplateFactory, publishTemplateLive,
 * massLaunchOrchestrator, generateSeoPage, bulkLaunchEngine, autonomousVisualOrchestrator)
 * calls this module instead of each running its own ad-hoc generation logic.
 *
 * Pipeline:
 *   1. Resolve the niche profile (visualTemplateEngine)
 *   2. Pick a layout variant (templateLayoutVariants A/B/C)
 *   3. Attach the APEX donor pattern profile (apexDonorRegistry)
 *   4. Inject location/brand overrides if provided
 *   5. Return { html, meta, profile }
 *
 * This guarantees visual diversity, niche-accurate content, and consistent
 * structure across every site the platform launches.
 */

import { generateTemplateHtml, getSupportedNiches } from "./visualTemplateEngine.ts";
import { getVisualTemplateProfile } from "./apexDonorRegistry.ts";

export interface GenerateSiteOptions {
  niche: string;
  brandName?: string;
  city?: string;
  state?: string;
  phone?: string;
  domain?: string;
  layoutOverride?: number; // 1 | 2 | 3 — force a specific layout variant
}

export interface GeneratedSite {
  html: string;
  niche: string;
  brandName: string;
  meta: {
    title: string;
    description: string;
    keywords: string[];
    og_title: string;
  };
  profile: ReturnType<typeof getVisualTemplateProfile>;
  supportedNiches: string[];
}

function esc(s: string): string {
  return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function injectLocation(html: string, opts: GenerateSiteOptions): string {
  if (!opts.city && !opts.state && !opts.phone && !opts.domain) return html;

  let out = html;

  // Inject city/state into the title tag
  const locStr = [opts.city, opts.state].filter(Boolean).join(", ");
  if (locStr) {
    out = out.replace(/<title>([^<]*)<\/title>/, (m, inner) => {
      if (inner.includes(locStr)) return m;
      return `<title>${esc(inner)} — ${esc(locStr)}</title>`;
    });
  }

  // Inject phone number override
  if (opts.phone) {
    out = out.replace(/(\(555\)\s*\d{3}-\d{4})/g, esc(opts.phone));
  }

  // Inject domain into footer copyright
  if (opts.domain) {
    out = out.replace(/&copy; 2026 ([^<.]+)/, (m, brand) => `&copy; 2026 ${esc(brand)}`);
  }

  return out;
}

/**
 * Generate a complete site/template from a niche.
 * This is THE function every generation pipeline should call.
 */
export function generateSite(opts: GenerateSiteOptions): GeneratedSite {
  const niche = (opts.niche || "generic").toLowerCase().replace(/ /g, "_");
  const brandName = opts.brandName || "";

  // 1. Generate the base HTML with layout variants
  const html = generateTemplateHtml(niche, brandName);

  // 2. Get the APEX donor pattern profile
  const profile = getVisualTemplateProfile(niche);

  // 3. Inject location/brand overrides
  const finalHtml = injectLocation(html, opts);

  // 4. Build meta from the profile
  const locStr = [opts.city, opts.state].filter(Boolean).join(", ");
  const meta = {
    title: brandName
      ? `${brandName}${locStr ? ` — ${locStr}` : ""}`
      : `${niche.replace(/_/g, " ")}${locStr ? ` — ${locStr}` : ""}`,
    description: `Explore ${niche.replace(/_/g, " ")} services${locStr ? ` in ${locStr}` : ""}, compare options, and request details directly from providers.`,
    keywords: [niche.replace(/_/g, " "), opts.city, opts.state].filter(Boolean),
    og_title: brandName || `${niche.replace(/_/g, " ")} Services`,
  };

  return {
    html: finalHtml,
    niche,
    brandName,
    meta,
    profile,
    supportedNiches: getSupportedNiches(),
  };
}

/**
 * Generate just the HTML (lightweight — for pipelines that only need the markup).
 */
export function generateSiteHtml(niche: string, brandName?: string, opts?: Partial<GenerateSiteOptions>): string {
  return generateSite({ niche, brandName, ...opts }).html;
}

/**
 * Get the visual profile for a niche (for pipelines that need pattern metadata
 * without generating full HTML).
 */
export function getNicheProfile(niche: string) {
  return getVisualTemplateProfile(niche);
}

export { getSupportedNiches };