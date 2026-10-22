import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

/**
 * siteImageConcepts — ten candidate photographs for one website.
 *
 * The owner picks the ones that fit; the picks become the page's photography.
 * Nothing about the business is invented: every shot is built from the trade and
 * the services they gave us, and the picker tells the owner the images are
 * AI-created so none of them is ever presented as a photo of real finished work.
 *
 * Public on purpose: the launch wizard is used by visitors who are not signed in.
 */

const SHOTS = [
  { style: 'Finished work — wide', subject: 'a wide shot of the completed result, clean, level and newly finished' },
  { style: 'Work in progress', subject: 'the work happening right now with tools and materials laid out, active and organised' },
  { style: 'Surface detail', subject: 'a close-up of the finished surface and its texture, shallow depth of field' },
  { style: 'Before and after', subject: 'the same area shown before and after the work, side by side in one frame' },
  { style: 'Equipment and setup', subject: 'the equipment and preparation staged and ready for the next job' },
  { style: 'Team at work', subject: 'two workers in plain workwear concentrating on the job' },
  { style: 'The property', subject: 'the exterior of a well-kept home with its garage or driveway in view' },
  { style: 'Premium upgrade', subject: 'the higher-end finish option shown in detail, refined and glossy' },
  { style: 'Handover', subject: 'the owner walking a customer through the finished space' },
  { style: 'Late-day exterior', subject: 'the finished space at dusk with warm light from the building' },
];

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const industry = String(body.industry || '').slice(0, 120);
    const sub = String(body.sub_industry || '').slice(0, 120);
    const services = Array.isArray(body.services) ? body.services.slice(0, 8).map(String) : [];
    const place = [body.city, body.state].map(v => String(v || '').trim()).filter(Boolean).join(', ');

    if (!industry) return Response.json({ error: 'industry is required' }, { status: 400 });

    const trade = sub ? `${industry} (${sub})` : industry;
    const context = [place && `in ${place}`, services.length && `they offer: ${services.join(', ')}`]
      .filter(Boolean).join('; ');

    const results = await Promise.allSettled(SHOTS.map(async shot => {
      const prompt = `Professional website photograph for a ${trade} business${context ? ` — ${context}` : ''}. Subject: ${shot.subject}. `
        + 'Photorealistic, natural daylight, sharp focus, believable materials and textures, a tidy real working environment. '
        + 'Landscape 16:9 composition with clear space on one side for headline text. '
        + 'No text, no logos, no watermarks, no brand signage, no licence plates, no visible faces on signage.';
      const res = await base44.integrations.Core.GenerateImage({ prompt });
      return { style: shot.style, url: res.url };
    }));

    const images = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    const failed = results.length - images.length;
    if (failed) console.error(`siteImageConcepts: ${failed} of ${SHOTS.length} images failed for ${industry}`);
    if (!images.length) return Response.json({ error: 'No images came back — try again' }, { status: 502 });

    return Response.json({ images, count: images.length, industry, ai_generated: true });
  } catch (error: any) {
    console.error('siteImageConcepts error:', error);
    return Response.json({ error: error.message || 'Image generation failed' }, { status: 500 });
  }
}