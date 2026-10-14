import { STOCK_INDUSTRIES } from './stockIndustries.js';
import { STOCK_DESIGNS } from './stockDesigns.js';
import { compileStockTemplate, escapeHtml } from './stockTemplateCompiler.js';

// Shared, deterministic HTML compiler for a single NOINDEX site preview.
// This does not publish a business, capture leads, or prove service coverage.
const LEGACY_EPoxy_ALIASES = Object.freeze({
  epoxy_garage: 'epoxy_flooring',
  garage_coating: 'epoxy_flooring',
});

function required(value, label, maxLength = 90) {
  if (typeof value !== 'string') throw new TypeError(label + ' must be a string');
  const cleaned = value.trim();
  if (!cleaned || cleaned.length > maxLength || /[<>\r\n]/.test(cleaned)) {
    throw new TypeError('Invalid ' + label);
  }
  return cleaned;
}

function safeDraft(value, limit = 1400) {
  return escapeHtml(typeof value === 'string' ? value.slice(0, limit) : '');
}

export function compileSitePreview(input) {
  if (!input || typeof input !== 'object') throw new TypeError('Site input required');
  const siteId = required(input.siteId, 'siteId', 128);
  const city = required(input.city, 'city');
  const state = required(input.state, 'state', 40);
  const templateKey = required(input.templateKey, 'templateKey', 80);
  const industryKey = LEGACY_EPoxy_ALIASES[templateKey] || templateKey;
  const industry = STOCK_INDUSTRIES.find((item) => item.key === industryKey);
  if (!industry) throw new TypeError('Unsupported industry: ' + templateKey);
  const designKey = input.designKey || 'signature';
  const design = STOCK_DESIGNS.find((item) => item.key === designKey);
  if (!design) throw new TypeError('Unsupported design: ' + designKey);

  const e = escapeHtml;
  const content = input.content && typeof input.content === 'object' ? input.content : {};
  const displayName = industry.label + ' | ' + city + ', ' + state + ' | Preview';
  const baseHtml = compileStockTemplate(industry, design, { name: displayName });
  const intro = safeDraft(content.intro);
  const local = safeDraft(content.local_content, 1800);
  const draftServices = Array.isArray(content.services) ? content.services.slice(0, 5) : [];
  const servicesHtml = draftServices.map((item) =>
    '<article class="card"><h3>' + safeDraft(item?.name, 100) + '</h3><p>' +
    safeDraft(item?.description, 500) + '</p></article>'
  ).join('');
  const draftSection = '<section id="site-preview-draft" class="section" data-dd-site-id="' + e(siteId) + '">' +
    '<div class="wrap"><span class="eyebrow">Location-specific, unpublished draft</span>' +
    '<h2>' + e(city) + ', ' + e(state) + ' | ' + e(industry.label) + '</h2>' +
    '<p class="notice">Isolated NOINDEX preview. Local claims, service coverage, prices, credentials and generated text require owner verification. This is not a live service provider. Lead submissions are not connected.</p>' +
    (intro ? '<p>' + intro + '</p>' : '') +
    (local ? '<p>' + local + '</p>' : '') +
    (servicesHtml ? '<div class="grid">' + servicesHtml + '</div>' : '') +
    '</div></section>';
  const siteMeta = '<meta name="dd-site-id" content="' + e(siteId) + '">' +
    '<meta name="dd-template-key" content="' + e(templateKey) + '">' +
    '<meta name="dd-preview-location" content="' + e(city + ', ' + state) + '">' +
    '<meta name="robots" content="noindex,nofollow,noarchive">';
  const faviconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
    '<rect width="64" height="64" rx="12" fill="#193e48"/>' +
    '<text x="32" y="43" fill="white" text-anchor="middle" font-size="26"' +
    ' font-family="Arial">DD</text></svg>';
  const favicon = '<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,' +
    encodeURIComponent(faviconSvg) + '">';
  const html = baseHtml.replace('<head>', '<head>' + favicon + siteMeta)
    .replace('</main>', draftSection + '</main>');
  return {
    html,
    manifest: {
      site_id: siteId,
      template_key: templateKey,
      design_key: design.key,
      industry_key: industryKey,
      city,
      state,
      release_state: 'PREVIEW_ONLY',
      lead_capture: 'NOT_CONNECTED',
    },
  };
}
