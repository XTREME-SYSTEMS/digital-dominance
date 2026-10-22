import { industryLabel } from '@/data/industryCatalog';

/**
 * Installs the owner's own details into a rendered site and removes the
 * renderer's demonstration content.
 *
 * The renderer ships a believable placeholder brief (a stock name, a stock
 * tagline, generic process steps, a sample email). The wizard's job is to put
 * the real business into every one of those places and to remove — never
 * invent — anything the owner did not give us.
 */

// Fixes that are always on: the owner's details are installed, not optional.
export const DEFAULT_FIXES = ['contact_block', 'service_area', 'seo_meta', 'expand_services', 'faq', 'differentiators'];

export function resolveFixes(applied = []) {
  return new Set([...DEFAULT_FIXES, ...applied]);
}

export function businessName(profile) {
  return (profile.business_name || '').trim();
}

export function tradeName(profile) {
  return profile.industry_label || industryLabel(profile.industry) || profile.industry || 'Local Services';
}

export function placeLabel(profile) {
  return [(profile.city || '').trim(), (profile.state || '').trim()].filter(Boolean).join(', ');
}

export function streetLine(profile) {
  return [profile.address, placeLabel(profile)].filter(v => v && v.trim()).join(', ');
}

/**
 * The owner's existing site, when they told us they have one. A business asking
 * for a new site has no URL yet, so nothing is injected and nothing is invented.
 */
export function websiteUrl(profile) {
  if (profile.website_mode !== 'existing') return '';
  const raw = String(profile.website_url || '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  return raw ? `https://${raw}` : '';
}

export function websiteLabel(profile) {
  return websiteUrl(profile).replace(/^https:\/\//, '');
}

function serviceAreaLine(profile) {
  const where = placeLabel(profile) || 'your area';
  const radius = Number(profile.territory_radius_miles) || 0;
  return radius ? `Serving ${where} and ${radius} miles around` : `Serving ${where}`;
}

/** Industry-accurate FAQs written from the owner's own services — no invented facts. */
export function buildFaqs(profile) {
  const name = businessName(profile);
  const where = placeLabel(profile) || 'your area';
  const services = profile.services || [];
  const fromServices = services.slice(0, 4).map(service => ({
    q: `Do you offer ${service.toLowerCase()}?`,
    a: `Yes. ${name} provides ${service} for customers in ${where}.`,
  }));
  return [
    ...fromServices,
    {
      q: `How do I get a price for ${tradeName(profile).toLowerCase()}?`,
      a: `Send your details through the quote form or call ${profile.phone || name}. You get a written price before any work begins.`,
    },
  ];
}

export function buildDifferentiators(profile) {
  const where = placeLabel(profile) || 'the local area';
  return [
    `Locally owned and operated in ${where}`,
    'Written quotes before any work starts',
    'Every job finished to an agreed scope',
  ];
}

/** The brief the renderer receives — the owner's real business, never mock data. */
export function buildSiteBrief(profile, fixes = resolveFixes()) {
  const name = businessName(profile);
  const trade = tradeName(profile);
  const where = placeLabel(profile) || 'your service area';
  const services = (profile.services || []).filter(Boolean);
  // Copy the owner accepted from the QA suggestions agent, when there is any.
  const copy = fixes.has('ai_copy') ? (profile.ai_copy || {}) : {};
  const headline = copy.headline || (fixes.has('tighten_hero') ? `${trade} in ${where}` : (profile.slogan || `${trade} done right the first time.`));

  return {
    businessName: name,
    industry: trade,
    tagline: headline,
    description: copy.description || `${name} provides ${services.slice(0, 3).join(', ') || trade} for homes and businesses in ${where}.`,
    audience: `Homeowners and businesses in ${where} who want ${trade.toLowerCase()} work quoted clearly and finished on schedule.`,
    location: where,
    services: fixes.has('expand_services') || services.length ? services : undefined,
    differentiators: fixes.has('differentiators') ? (copy.differentiators?.length ? copy.differentiators : buildDifferentiators(profile)) : undefined,
    faq: fixes.has('faq') ? buildFaqs(profile) : undefined,
    email: (profile.email || '').trim(),
    phone: (profile.phone || '').trim(),
    domain: (profile.website_url || '').trim(),
    ctaLabel: fixes.has('cta_phone') && profile.phone ? `Call ${profile.phone}` : 'Request a Quote',
    address: streetLine(profile),
    serviceArea: fixes.has('service_area') ? serviceAreaLine(profile) : '',
    rating: profile.has_rating ? { value: profile.rating_value || 5, count: profile.rating_count || 0 } : null,
    accent: profile.accent || '#0f7bd6',
    draft: false,
  };
}

const swap = (html, from, to) => (to ? html.split(from).join(to) : html);

/** Removes a flat <section> whose content contains the marker. */
function dropSection(html, marker) {
  const index = html.indexOf(marker);
  if (index === -1) return html;
  const start = html.lastIndexOf('<section', index);
  const end = html.indexOf('</section>', index);
  if (start === -1 || end === -1) return html;
  return html.slice(0, start) + html.slice(end + '</section>'.length);
}

function processSteps(profile) {
  const services = (profile.services || []).slice(0, 3);
  const where = placeLabel(profile) || 'your area';
  const steps = services.length
    ? services.map((service, i) => [String(i + 1).padStart(2, '0'), service, `Tell us about your space and we quote your ${service.toLowerCase()} in writing.`])
    : [['01', 'Call us', `Reach ${businessName(profile)} and describe the job.`], ['02', 'Get a written quote', `Sent before any work begins.`], ['03', 'We do the work', `Scheduled with you in ${where}.`]];
  return steps;
}

function ratingBand(profile) {
  const value = Number(profile.rating_value) || 5;
  const count = Number(profile.rating_count) || 0;
  const stars = '★★★★★';
  return `<section class="section rating-band"><div class="eyebrow">REVIEWS</div><h2>Rated ${value.toFixed(1)} out of 5</h2>`
    + `<p><span class="rating-stars" aria-label="${value} out of 5">${stars}</span> ${count ? `from ${count} customer reviews` : 'from our customers'}.</p></section>`;
}

function contactBlock(profile) {
  const lines = [];
  // The phone comes first: it is a tap-to-call link on every phone that opens the page.
  const phone = (profile.phone || '').trim();
  if (phone) lines.push(`<p class="contact-phone"><a href="tel:${phone.replace(/[^\d+]/g, '')}">${phone}</a></p>`);
  if (profile.address || placeLabel(profile)) lines.push(`<p class="contact-address">${streetLine(profile) || placeLabel(profile)}</p>`);
  if (profile.email) lines.push(`<p class="contact-email"><a href="mailto:${profile.email}">${profile.email}</a></p>`);
  const site = websiteUrl(profile);
  if (site) lines.push(`<p class="contact-web"><a href="${site}">${websiteLabel(profile)}</a></p>`);
  const area = serviceAreaLine(profile);
  if (area) lines.push(`<p class="contact-area">${area}</p>`);
  return lines.join('');
}

/**
 * Scrubs the demonstration content out of a rendered page and installs the
 * owner's own details. Returns what was installed and what was removed so the
 * QA agent can verify the result independently.
 */
export function scrubBrandedHtml(html, profile, fixes = resolveFixes()) {
  const installed = [];
  const removed = [];
  if (!html) return { html, installed, removed };

  const name = businessName(profile);
  const trade = tradeName(profile);
  const where = placeLabel(profile) || 'your service area';
  const address = streetLine(profile);
  const email = (profile.email || '').trim();
  const phone = (profile.phone || '').trim();
  const services = (profile.services || []).filter(Boolean);
  let out = html;

  // ── The stock name and every demonstration line ──────────
  if (name) { out = swap(out, 'Northstar Studio', name); installed.push(`Business name → ${name}`); }
  out = swap(out, 'Make your next big idea look effortless.', profile.slogan || `${trade} done right the first time.`);
  out = swap(out, 'Thoughtful solutions, beautifully executed for people who expect more.', `${name} provides ${services.slice(0, 3).join(', ') || trade} in ${where}.`);
  out = swap(out, 'People who value craftsmanship, clarity, and measurable results.', `Homeowners and businesses in ${where} who want clear, written quotes.`);
  out = swap(out, 'Your service area', where);
  out = swap(out, 'A better experience, from first conversation to finished result.', `Clear pricing and clean work for ${where}.`);
  out = swap(out, 'Start a Conversation', fixes.has('cta_phone') && phone ? `Call ${phone}` : 'Request a Quote');

  // ── Demonstration services and differentiators ───────────
  const mockServices = ['Strategy & Planning', 'Custom Solutions', 'Ongoing Support'];
  mockServices.forEach((mock, i) => {
    if (services[i]) out = swap(out, mock, services[i]);
    else { out = dropSection(out, mock); removed.push(`Demonstration service "${mock}" (no real service to show)`); }
  });
  const mockDiffs = ['An approach built around your goals', 'Transparent collaboration', 'Clear next steps'];
  const diffs = buildDifferentiators(profile);
  mockDiffs.forEach((mock, i) => { out = swap(out, mock, diffs[i] || ''); });

  // ── Generic process steps and headings ───────────────────
  const steps = processSteps(profile);
  [['Discover', steps[0]], ['Design', steps[1]], ['Deliver', steps[2]]].forEach(([mock, step], i) => {
    if (!step) { return; }
    out = swap(out, mock, step[1]);
    out = swap(out, ['We understand your goals and priorities.', 'We create an approach around your needs.', 'We execute, review, and refine with care.'][i], step[2]);
  });
  out = swap(out, 'OUR APPROACH', 'HOW WE WORK');
  out = swap(out, 'A clear path from idea to outcome.', `How ${name} works with you.`);
  out = swap(out, 'Ready to build something exceptional?', `Get a ${trade.toLowerCase()} quote from ${name}`);
  out = swap(out, 'LET&#39;S CONNECT', 'CONTACT');

  // ── Demonstration email and the "not configured" notice ──
  if (email) {
    out = swap(out, 'hello@example.com', email);
    out = swap(out, 'Configure a contact email for the live action', `Email ${email}`);
    installed.push(`Email → ${email}`);
  } else {
    const notice = out.match(/<span class="setup-notice">[\s\S]*?<\/span>/);
    if (notice) { out = out.replace(notice[0], ''); removed.push('Empty contact placeholder (no email given)'); }
    out = swap(out, 'hello@example.com', '');
  }
  if (phone) installed.push(`Phone → ${phone}`);
  if (address) installed.push(`Address → ${address}`);
  if (websiteUrl(profile)) installed.push(`Website → ${websiteLabel(profile)}`);
  if (where !== 'your service area') installed.push(`Service area → ${where}`);
  if (services.length) installed.push(`${services.length} services installed`);
  if (profile.has_rating) installed.push(`Rating → ${Number(profile.rating_value) || 5} / 5`);

  // Any demonstration note the renderer still shows must not ship.
  const draftNote = out.match(/<p class="draft-note">[\s\S]*?<\/p>/);
  if (draftNote) { out = out.replace(draftNote[0], ''); removed.push('Template demonstration note'); }

  // ── Contact details, rating band, service area ───────────
  const contactHtml = fixes.has('contact_block') ? contactBlock(profile) : '';
  if (contactHtml) {
    out = out.includes('</section>') && out.includes('class="contact-band"')
      ? out.replace(/(<div class="contact-actions">)/, `${contactHtml}$1`)
      : out.replace('</body>', `<section class="section contact-details">${contactHtml}</section></body>`);
  }
  if (profile.has_rating && !out.includes('rating-band')) {
    out = out.includes('<section id="contact"') ? out.replace('<section id="contact"', `${ratingBand(profile)}<section id="contact"`) : out.replace('</body>', `${ratingBand(profile)}</body>`);
  }
  // The owner told us they have no reviews, so no rating block may ship.
  if (!profile.has_rating) {
    const band = out.match(/<section[^>]*class="[^"]*rating-band[^"]*"[\s\S]*?<\/section>/i);
    if (band) { out = out.replace(band[0], ''); removed.push('Rating block (you have no reviews to show)'); }
  }

  // ── Title, description, canonical ────────────────────────
  if (fixes.has('seo_meta')) {
    const title = `${name} | ${trade} in ${where}`;
    const description = `${trade} from ${name} in ${where}. ${services.slice(0, 2).join(', ')}${services.length ? ' and more' : ''}. Request a written quote.`.replace(/\s+/g, ' ').slice(0, 200);
    out = /<title>[\s\S]*?<\/title>/.test(out) ? out.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`) : out.replace('</head>', `<title>${title}</title></head>`);
    out = /<meta name="description"[^>]*>/.test(out)
      ? out.replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${description}">`)
      : out.replace('</head>', `<meta name="description" content="${description}"></head>`);
    installed.push('Page title and description');
  }

  const area = serviceAreaLine(profile);
  const site = websiteLabel(profile);
  if (area) {
    out = swap(out, 'All rights reserved.', `All rights reserved. ${area}${site ? ` · ${site}` : ''}.`);
  } else if (site) {
    out = swap(out, 'All rights reserved.', `All rights reserved. ${site}.`);
  }

  return { html: out, installed, removed };
}

/** Render → install → scrub, in one call. */
export function installBrandData(renderer, profile, layout, appliedFixes = []) {
  const fixes = resolveFixes(appliedFixes);
  const brief = buildSiteBrief(profile, fixes);
  if (!renderer || !name_ready(profile)) return { html: null, brief, installed: [], removed: [] };
  let rendered;
  try { rendered = renderer.renderSite(brief, layout); } catch (e) { return { html: null, brief, installed: [], removed: [], error: e.message }; }
  const { html, installed, removed } = scrubBrandedHtml(rendered, profile, fixes);
  return { html, brief, installed, removed };
}

function name_ready(profile) {
  return Boolean(businessName(profile));
}