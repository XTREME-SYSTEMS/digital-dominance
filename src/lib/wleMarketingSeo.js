/**
 * Explicitly separate the Website Launch Engine storefront from the epoxy
 * donor SEO. Never use unverified contractor rating, reviews or address here.
 * A production canonical URL must be supplied and verified by the site owner.
 */
export const WLE_MARKETING_ROUTES = Object.freeze({
  '/': {
    title: 'Unlimited Websites | AI Website Launch Engine',
    description: 'Explore premium website templates across 20 industries, choose a design and prepare your website launch with Strategic Minds AI.',
  },
  '/launch-engine': {
    title: 'Website Launch Engine | Unlimited Websites',
    description: 'Explore the Website Launch Engine, browse premium industry website concepts and prepare a review-gated launch plan.',
  },
  '/pricing': {
    title: 'Website Launch Pricing | Unlimited Websites',
    description: 'Explore website launch options and request details about premium website design, templates and ongoing support.',
  },
  '/templates': {
    title: 'Premium Website Templates | Unlimited Websites',
    description: 'Browse 200 compiled website concepts across 20 industries and 10 distinct design approaches. Examples are previews, not published business sites.',
  },
});
export function isWleMarketingRoute(path) {
  return Object.prototype.hasOwnProperty.call(WLE_MARKETING_ROUTES,path);
}
export function wleMarketingCanonical(path, configuredUrl) {
  if (!isWleMarketingRoute(path) || !configuredUrl || typeof configuredUrl !== 'string') return null;
  try {
    const url = new URL(configuredUrl);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
        (url.pathname !== '/' && url.pathname !== '')) return null;
    if (url.hostname === 'epoxyquotenearme.com' || url.hostname.endsWith('.vercel.app')) return null;
    return url.origin + path;
  } catch { return null; }
}
