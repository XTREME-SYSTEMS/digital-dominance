import { INDUSTRY_IMAGES, normalizeNiche } from '@/lib/industryImageRegistry';
import { HOMEPAGE_INDUSTRY_IMAGES } from '@/data/homeIndustryImages';

/**
 * INDUSTRY IMAGE MANDATE
 *
 * Every template preview must show the selected industry's own approved
 * photography — never decorative art only, never a generic stand-in, never
 * another industry's photos.
 *
 * Rules:
 *  1. Image slots in a rendered template are filled from the industry's
 *     approved image set (the same registry the backend image mandate uses).
 *  2. Fail closed: an industry with no approved image set shows an explicit
 *     "needs image review" panel instead of a substitute photo.
 *  3. No new image URLs are invented here — the registry and the homepage
 *     registry are the only sources.
 */

const POSITIONS = ['50% 50%', '50% 30%', '50% 70%', '30% 50%', '72% 50%', '50% 58%'];

const MANDATE_CSS = `
.artwork.artifact-photo{margin:0;background:#0d1522;padding:0}
.artwork.artifact-photo img,.index-photo img{width:100%;height:100%;object-fit:cover;display:block}
.index-photo{margin:34px 0 0;border-radius:20px;overflow:hidden;background:#0d1522}
.index-photo img{height:clamp(220px,34vw,430px)}
.artwork.artifact-missing,.index-photo.artifact-missing{display:grid;place-items:center;padding:26px;background:#0d1522;border:1px dashed #ff8f7a55;color:#dfe6f2;font-size:.82rem;text-align:center;line-height:1.5}
.artwork.artifact-missing strong,.index-photo.artifact-missing strong{display:block;font-size:.92rem;letter-spacing:.14em;text-transform:uppercase;color:#ff8f7a;margin-bottom:7px}
`;

const slug = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const escapeAttr = value => String(value || '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The approved image set for one industry, or a fail-closed empty set. */
export function industryImageSet(industry) {
  const key = normalizeNiche(industry);
  const registry = INDUSTRY_IMAGES[key];
  const approved = key !== 'default' && !!registry?.url && registry.url !== INDUSTRY_IMAGES.default.url;

  const images = [];
  if (approved) {
    images.push(registry.url);
    const homepage = HOMEPAGE_INDUSTRY_IMAGES.find(entry =>
      normalizeNiche(entry.niche) === key
      || normalizeNiche(entry.label) === key
      || slug(entry.id) === slug(key));
    if (homepage?.image_url && !images.includes(homepage.image_url)) images.push(homepage.image_url);
  }

  return {
    key,
    approved: approved && images.length > 0,
    label: registry?.label || (industry ? String(industry) : 'This industry'),
    images,
  };
}

function photoFigure(set, index, className) {
  const url = set.images[index % set.images.length];
  const alt = `${set.label} — ${set.key.replace(/_/g, ' ')} work`;
  return `<figure class="${className}"><img src="${escapeAttr(url)}" alt="${escapeAttr(alt)}" loading="lazy" style="object-position:${POSITIONS[index % POSITIONS.length]}" /></figure>`;
}

function missingBlock(set, className) {
  return `<div class="${className}"><div><strong>Needs image review</strong>No approved ${escapeAttr(set.label)} photography yet. This preview will not substitute another industry's photos.</div></div>`;
}

/** Fills every image slot of a rendered layout with the mandated photography. */
export function applyIndustryImages(html, set) {
  if (!html || !set) return html;

  let index = 0;
  const next = (className) => {
    const block = set.approved ? photoFigure(set, index, className) : missingBlock(set, className);
    index += 1;
    return block;
  };

  // 1. Replace the layout's decorative art panels with the industry's photography.
  let output = html.replace(/<div class="artwork [a-z-]+" aria-hidden="true">[\s\S]*?<\/div><\/div>/g,
    () => next(set.approved ? 'artwork artifact-photo' : 'artwork artifact-missing'));

  // 2. Layouts whose hero carries no art panel still get real photography in the hero.
  if (index === 0) {
    const heroStart = output.search(/<section[^>]*>/);
    const heroClose = heroStart === -1 ? -1 : output.indexOf('</section>', heroStart);
    if (heroClose !== -1) {
      const band = next('index-photo');
      output = `${output.slice(0, heroClose)}${band}${output.slice(heroClose)}`;
      index += 1;
    }
  }

  if (index === 0) return html;

  const style = `<style>${MANDATE_CSS}</style>`;
  const headClose = output.indexOf('</head>');
  return headClose === -1 ? `${style}${output}` : `${output.slice(0, headClose)}${style}${output.slice(headClose)}`;
}