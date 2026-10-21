import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { buildBrandSitePages, SITE_PAGE_COUNT } from '../../shared/brandSitePages.js';

// PAGE PACK GENERATOR
// One click turns a completed BrandProfile (business details, palette, logo and
// industry discovery dossier) into a linked 5-7 page website pack: real pages,
// purpose-built imagery, shared branding and per-page SEO metadata.
// Every page is stored as a TemplateLibrary record tagged to the brand.

const SLOT_MATCHERS = [
  { key: 'hero', match: /hero|exterior|facade|street/i, fallback: 'wide establishing shot of a completed project at golden hour' },
  { key: 'services', match: /service|equipment|tool|process|work/i, fallback: 'crew working with professional equipment on site' },
  { key: 'about', match: /team|crew|about|owner|portrait/i, fallback: 'professional crew portrait in branded workwear' },
  { key: 'gallery1', match: /before|after|comparison/i, fallback: 'finished project detail showing preparation and finish quality' },
  { key: 'gallery2', match: /gallery|project|interior|detail/i, fallback: 'completed project photographed in natural daylight' },
  { key: 'gallery3', match: /texture|material|close|finish/i, fallback: 'close-up of the material texture and finish' },
];

function promptFor(slot: any, dossier: any, profile: any) {
  const prompts = Array.isArray(dossier?.image_prompts) ? dossier.image_prompts : [];
  const hit = prompts.find((p: any) => slot.match.test(`${p?.slot || ''} ${p?.prompt || ''}`));
  if (hit?.prompt) return hit.prompt;
  const label = profile.industry_label || profile.industry;
  const place = [profile.city, profile.state].filter(Boolean).join(', ');
  return `Ultra-lifelike professional commercial photograph for a ${label} company${place ? ` in ${place}` : ''}: ${slot.fallback}. Realistic materials and tools, natural lighting, shallow depth of field, no text, no logos, no watermarks, no people looking at camera.`;
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const profileId = body.profile_id;
    if (!profileId) return Response.json({ error: 'profile_id required' }, { status: 400 });

    const svc = base44.asServiceRole;
    const profile = await svc.entities.BrandProfile.get(profileId);
    if (!profile) return Response.json({ error: 'Brand profile not found' }, { status: 404 });
    if (profile.discovery_status !== 'ready') {
      return Response.json({ error: 'Industry discovery is still running for this brand. Give it a moment, then build.' }, { status: 409 });
    }

    const pageCount = Math.min(SITE_PAGE_COUNT.max, Math.max(SITE_PAGE_COUNT.min, Number(body.page_count) || SITE_PAGE_COUNT.default));
    const dossier = profile.discovery || {};

    // One purpose-built image per imagery slot, generated in parallel.
    const settled = await Promise.allSettled(SLOT_MATCHERS.map(async (slot) => {
      const res = await base44.integrations.Core.GenerateImage({ prompt: promptFor(slot, dossier, profile) });
      return { key: slot.key, url: res?.url || '' };
    }));
    const images: Record<string, string> = {};
    settled.forEach((r: any) => {
      if (r.status === 'fulfilled' && r.value?.url) images[r.value.key] = r.value.url;
      else if (r.status === 'rejected') console.error('Pack image generation failed:', r.reason?.message || r.reason);
    });

    const pages = buildBrandSitePages({ profile, images, pageCount });
    const packTag = `brand-${profile.id}`;
    const slugBase = String(profile.business_name || profile.industry || 'site')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32) || 'site';

    // Rebuilding replaces the previous pack for this brand.
    try {
      await svc.entities.TemplateLibrary.deleteMany({ tags: packTag });
    } catch (error: any) {
      console.error('Pack cleanup failed:', error.message);
    }

    const created = await svc.entities.TemplateLibrary.bulkCreate(pages.map((page, index) => ({
      name: `${profile.business_name} — ${page.title}`,
      slug: `${slugBase}-${page.key}`,
      category: page.category,
      niche: profile.industry,
      description: page.description.slice(0, 900),
      content: page.html,
      preview_image_url: images[page.preview_slot] || images.hero || '',
      tags: ['brand-site-pack', packTag, `page-${page.key}`],
      is_active: true,
      status: 'active',
      is_default: page.key === 'home',
      version: '1.0',
      author: 'Brand Setup Wizard',
      sort_order: index,
    })));

    const packPages = pages.map((page, index) => ({
      key: page.key,
      title: page.title,
      path: page.path,
      category: page.category,
      template_id: Array.isArray(created) ? created[index]?.id : undefined,
    }));

    await svc.entities.BrandProfile.update(profile.id, { pages: packPages, status: 'ready' });

    return Response.json({
      pages: packPages,
      image_count: Object.keys(images).length,
      pack_tag: packTag,
    });
  } catch (error: any) {
    console.error('Page pack generator error:', error);
    return Response.json({ error: error.message || 'Could not build the page pack' }, { status: 500 });
  }
}