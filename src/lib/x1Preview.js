import { useEffect, useMemo, useState } from 'react';
import { industryKeyForLabel, industryServices } from '@/data/industryCatalog';
import { applyIndustryImages, industryImageSet } from '@/lib/industryImageMandate';

const SCRIPT_URL = `${import.meta.env.BASE_URL || '/'}x1/x1.js`;

/**
 * The ten universal website layout styles, mapped from the catalogue's design
 * keys. One renderer draws all ten, so every layout style looks like itself.
 */
const DESIGN_LAYOUTS = {
  signature: 'split-screen',
  immersive: 'fullscreen-hero',
  editorial: 'magazine-editorial',
  bento: 'bento-grid',
  concierge: 'f-pattern-sidebar',
  portfolio: 'asymmetrical-masonry',
  minimal: 'centered-hero',
  directory: 'card-grid',
  story: 'storytelling',
  comparison: 'z-pattern',
};

export const LAYOUT_NAMES = {
  'split-screen': 'Split-Screen',
  'fullscreen-hero': 'Full-Screen Hero',
  'magazine-editorial': 'Magazine / Editorial',
  'bento-grid': 'Bento Grid',
  'f-pattern-sidebar': 'F-Pattern / Sidebar',
  'asymmetrical-masonry': 'Asymmetrical / Masonry',
  'centered-hero': 'Centered Hero',
  'card-grid': 'Card-Based Grid',
  storytelling: 'Single-Column Storytelling',
  'z-pattern': 'Z-Pattern',
};

let loading = null;

export function loadLayoutRenderer() {
  if (globalThis.X1UniversalSite) return Promise.resolve(globalThis.X1UniversalSite);
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_URL;
      script.async = true;
      script.onload = () => (globalThis.X1UniversalSite
        ? resolve(globalThis.X1UniversalSite)
        : reject(new Error('The layout renderer did not start')));
      script.onerror = () => reject(new Error('The layout renderer could not be loaded'));
      document.head.appendChild(script);
    });
  }
  return loading;
}

export function layoutForTemplate(template) {
  const manifest = template?.sections?.find(section => section.section_type === 'manifest')?.config;
  return DESIGN_LAYOUTS[manifest?.design_key] || 'split-screen';
}

export function layoutNameForTemplate(template) {
  return LAYOUT_NAMES[layoutForTemplate(template)] || 'Split-Screen';
}

/** A believable brief for the public gallery, drawn from the template's own industry. */
export function galleryBrief(template) {
  const niche = template?.niche || 'Local Services';
  const listed = industryServices(industryKeyForLabel(niche));
  return {
    businessName: niche,
    industry: niche,
    tagline: `${niche} done right the first time.`,
    description: `${niche} services for homes and businesses in your area.`,
    location: 'Your local service area',
    services: listed.length ? listed : undefined,
    ctaLabel: 'Request a Quote',
    draft: true,
  };
}

export function openHtmlInBrowser(html) {
  if (!html) return;
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/** Renders one layout style from a brief, reloading whenever the brief changes. */
export function useLayoutHtml(template, brief, layoutId) {
  const [renderer, setRenderer] = useState(() => globalThis.X1UniversalSite || null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let live = true;
    loadLayoutRenderer()
      .then(instance => { if (live) setRenderer(instance); })
      .catch(e => { if (live) setError(e.message); });
    return () => { live = false; };
  }, []);

  const layout = layoutId || layoutForTemplate(template);
  const briefKey = JSON.stringify(brief || {});

  // The industry drives the imagery: the template's own niche wins, then the brief's industry.
  const imageSet = useMemo(
    () => industryImageSet(template?.niche || template?.industry || brief?.industry),
    [template?.niche, template?.industry, brief?.industry],
  );

  const html = useMemo(() => {
    if (!renderer) return null;
    try {
      return applyIndustryImages(renderer.renderSite(JSON.parse(briefKey), layout), imageSet);
    } catch (e) {
      return null;
    }
  }, [renderer, briefKey, layout, imageSet]);

  return { html, error, layout, imageSet };
}