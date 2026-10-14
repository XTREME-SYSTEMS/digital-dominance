// Digital Dominance tenant-domain policy (pure logic, no DNS writes).
// Keep customer preview hosts separate from index-eligible local directory pages.

export const FACTORY_ROOT = 'unlimitedwebsites.net';

const RESERVED_HOSTS = new Set([
  'www', 'app', 'admin', 'api', 'auth', 'demo', 'docs', 'help', 'mail',
  'preview', 'staging', 'static', 'assets', 'status', 'support', 'billing',
]);
const HOST_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function normalizeHostname(input) {
  if (typeof input !== 'string') return null;
  const value = input.trim();
  if (!value || /[\s@\\]/.test(value)) return null;
  let url;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  if (!['http:', 'https:'].includes(url.protocol)) return null;
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (!host || host.length > 253) return null;
  if (!host.split('.').every((label) => HOST_LABEL.test(label))) return null;
  return host;
}

export function normalizeTenantSlug(input) {
  if (typeof input !== 'string') return null;
  const slug = input.trim().toLowerCase();
  if (!HOST_LABEL.test(slug) || RESERVED_HOSTS.has(slug)) return null;
  return slug;
}

export function createPreviewUrl(slug, root = FACTORY_ROOT) {
  const tenant = normalizeTenantSlug(slug);
  const domain = normalizeHostname(root);
  if (!tenant || !domain || domain.split('.').length < 2) return null;
  return `https://${tenant}.${domain}/`;
}

// All tenant subdomains are inert until a registered/approved record exists.
// This prevents wildcard DNS from turning arbitrary hostnames into public sites.
export function resolveFactoryHost(input, siteRegistry = [], root = FACTORY_ROOT) {
  const host = normalizeHostname(input);
  const domain = normalizeHostname(root);
  if (!host || !domain) return { kind: 'invalid', allowed: false };
  if (host === domain) return { kind: 'apex', allowed: true, canonicalUrl: `https://www.${domain}/` };
  if (host === `www.${domain}`) return { kind: 'marketing', allowed: true, canonicalUrl: `https://www.${domain}/` };
  if (!host.endsWith(`.${domain}`)) return { kind: 'external', allowed: false };
  const label = host.slice(0, -domain.length - 1);
  if (!label || label.includes('.')) return { kind: 'unmapped', allowed: false };
  if (RESERVED_HOSTS.has(label)) return { kind: 'reserved', allowed: false };
  if (!normalizeTenantSlug(label)) return { kind: 'invalid', allowed: false };
  const record = Array.isArray(siteRegistry) && siteRegistry.find((r) =>
    r && normalizeHostname(r.hostname) === host && r.status === 'approved' &&
    typeof r.siteId === 'string' && r.siteId.length > 0
  );
  if (!record) return { kind: 'unmapped', allowed: false, hostname: host };
  return { kind: 'tenant', allowed: true, hostname: host, siteId: record.siteId, indexable: false };
}

// A record is not indexable because it has a city name, a URL, or a sync receipt.
export function evaluateIndexEligibility(proof = {}) {
  const required = [
    'realBusinessVerified', 'originalContentVerified', 'serviceAreaVerified',
    'deploymentVerified', 'independentQaPassed', 'ownerApproved',
  ];
  const missing = required.filter((name) => proof[name] !== true);
  return { eligible: missing.length === 0, missing };
}

// Example of an owned-directory URL: location paths stay on one discoverable property.
// Do not generate any NearMe.com URL without separate owner-authorization evidence.
export function createDirectoryPath({ service, state, city, ownershipVerified = false } = {}) {
  if (!ownershipVerified) return null;
  const pathPart = (input) => typeof input === 'string'
    ? input.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    : '';
  const segments = [service, state, city].map(pathPart);
  if (segments.some((value) => !value)) return null;
  return `/${segments.join('/')}`;
}
