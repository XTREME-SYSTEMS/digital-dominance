import { INDUSTRY_IMAGES, normalizeNiche } from '@/lib/industryImageRegistry';
import { HOMEPAGE_INDUSTRY_IMAGES } from '@/data/homeIndustryImages';

/**
 * INDUSTRY IMAGE MANDATE
 *
 * Every template preview must show the photography the finished website itself
 * uses for that industry — never decorative art only, never a generic stand-in,
 * never another industry's photos, and never a dead URL that leaves a blank
 * panel (the cause of the all-black template step: 22 of 36 registry URLs had
 * gone 404, so every slot fell back to its dark surface).
 *
 * Image source order (first available wins):
 *   1. The template's own site image — the exact asset the built site renders.
 *   2. The approved homepage registry image for the niche.
 *   3. The canonical industry registry image (all Base44-hosted, verified live).
 *   4. Nothing → the slot is flagged "needs image review" rather than substituted.
 *
 * Every image is resolved through one deterministic path, so the wizard, the
 * gallery and the delivered site can never disagree.
 */

const POSITIONS = ['50% 50%', '50% 30%', '50% 70%', '30% 50%', '72% 50%', '50% 58%'];

const MANDATE_CSS = `
.artwork.artifact-photo{margin:0;background:#0d1522;padding:0}
.artwork.artifact-photo img,.index-photo img{width:100%;height:100%;object-fit:cover;display:block}
.index-photo{margin:34px 0 0;border-radius:20px;overflow:hidden;background:#0d1522}
.index-photo img{height:clamp(220px,34vw,480px)}
.artwork.artifact-missing,.index-photo.artifact-missing{display:grid;place-items:center;padding:26px;background:#0d1522;border:1px dashed #ff8f7a55;color:#dfe6f2;font-size:.82rem;text-align:center;line-height:1.5}
.artwork.artifact-missing strong,.index-photo.artifact-missing strong{display:block;font-size:.92rem;letter-spacing:.14em;text-transform:uppercase;color:#ff8f7a;margin-bottom:7px}
`;

const strip = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const escapeAttr = value => String(value || '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** True when the URL is the app's own hosted asset (never a third-party guess). */
export const isSiteAsset = url => /^https:\/\/media\.base44\.com\//.test(String(url || ''));

/**
 * The approved image set for one industry.
 * `templateImage` is the image the template itself renders (highest priority).
 */
export function industryImageSet(industry, templateImage) {
  const key = normalizeNiche(industry);
  const registry = INDUSTRY_IMAGES[key];
  const images = [];

  const add = (url) => {
    if (typeof url === 'string' && /^https:\/\//.test(url) && !images.includes(url)) images.push(url);
  };

  add(templateImage);

  const homepage = HOMEPAGE_INDUSTRY_IMAGES.find(entry =>
    strip(entry.id) === strip(key)
    || normalizeNiche(entry.niche) === key
    || normalizeNiche(entry.label) === key);
  if (homepage) add(homepage.image_url);

  // The registry's generic entry is never a substitute for a real industry.
  if (key !== 'default') add(registry?.url);

  return {
    key,
    images,
    approved: images.length > 0,
    label: registry?.label || (industry ? String(industry) : 'This industry'),
  };
}

function photoFigure(set, index, className) {
  const url = set.images[index % set.images.length];
  const alt = `${set.label} — ${set.key.replace(/_/g, ' ')} work`;
  return `<figure class="${className}"><img src="${escapeAttr(url)}" alt="${escapeAttr(alt)}" loading="lazy" style="object-position:${POSITIONS[index % POSITIONS.length]}" /></figure>`;
}

function missingBlock(set, className) {
  return `<div class="${className}"><div><strong>Needs image review</strong>No approved ${escapeAttr(set.label)} photography is on file, so this slot will not borrow another industry's photos.</div></div>`;
}

/**
 * Replaces every artwork block with the mandated photography.
 * Walks the markup with a nested-div counter so a replacement can never spill
 * past the artwork element and gut the layout.
 */
function replaceArtworkBlocks(html, render) {
  const openTag = /<div class="artwork [a-z-]+" aria-hidden="true">/g;
  const divTag = /<\/?div\b[^>]*>/g;
  let output = '';
  let cursor = 0;
  let index = 0;
  let match;

  while ((match = openTag.exec(html))) {
    const blockStart = match.index;
    divTag.lastIndex = match.index + match[0].length;
    let depth = 1;
    let end = -1;
    let step;
    while ((step = divTag.exec(html))) {
      depth += step[0].startsWith('</') ? -1 : 1;
      if (depth === 0) { end = step.index + step[0].length; break; }
    }
    if (end === -1) break;

    output += html.slice(cursor, blockStart) + render(index);
    cursor = end;
    index += 1;
    openTag.lastIndex = end;
  }

  return { html: output + html.slice(cursor), count: index };
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

  // 1. The layout's art panel is its hero image — give it the industry's photography.
  const replaced = replaceArtworkBlocks(html, () => next(set.approved ? 'artwork artifact-photo' : 'artwork artifact-missing'));
  let output = replaced.html;
  index = replaced.count;

  // 2. Layouts whose hero carries no art panel still get real photography there.
  if (index === 0 && set.approved) {
    const heroStart = output.search(/<section[^>]*>/);
    const heroClose = heroStart === -1 ? -1 : output.indexOf('</section>', heroStart);
    if (heroClose !== -1) {
      output = `${output.slice(0, heroClose)}${next('index-photo')}${output.slice(heroClose)}`;
      index += 1;
    }
  }

  if (index === 0) return html;

  const headClose = output.indexOf('</head>');
  return headClose === -1 ? output : `${output.slice(0, headClose)}<style>${MANDATE_CSS}</style>${output.slice(headClose)}`;
}