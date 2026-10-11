import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { generateText } from '../../shared/aiGateway.ts';

// ─────────────────────────────────────────────────────────────────────────────
// responsiveImageOptimizer — AI-powered responsive image optimization.
//
// Uses the Vercel AI Gateway (independent of Base44 credits) with a vision
// model to analyze design images and determine the optimal display config
// for desktop (16:9) and mobile (9:16) viewports.
//
// Actions:
//   optimize     — Analyze a single image, return responsive config
//   batchOptimize — Analyze multiple images at once
// ─────────────────────────────────────────────────────────────────────────────

const OPTIMIZATION_PROMPT = `You are a responsive design expert. Analyze this design image and determine the optimal way to display it as a full-screen background on both desktop (16:9 landscape) and mobile (9:16 portrait) viewports.

Consider:
1. FOCAL POINT: Where is the most important content (logo, headline, CTA button)? Give x/y as 0-1 percentages.
2. OBJECT POSITION: What CSS object-position value keeps the most important content visible when cropped? (e.g. "center center", "center top", "left center")
3. TREATMENT: Should the image use "cover" (fills screen, crops overflow) or "contain" (shows full image, letterboxes with bg_color)?
4. BACKGROUND COLOR: What hex color matches the image edges for letterboxing?
5. SCALE: Should the image be scaled up (>1.0) to make text readable on smaller screens? Mobile often needs 1.1-1.3x zoom.
6. KEY CONTENT: What areas must never be cropped?

Return ONLY a JSON object with this exact structure:
{
  "focal_point_x": 0.5,
  "focal_point_y": 0.4,
  "object_position_desktop": "center center",
  "object_position_mobile": "center top",
  "treatment_desktop": "cover",
  "treatment_mobile": "cover",
  "bg_color": "#000000",
  "scale_desktop": 1.0,
  "scale_mobile": 1.15,
  "analysis": "Brief description of the image composition and content layout",
  "recommendation": "How to best display this on desktop vs mobile"
}`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    focal_point_x: { type: 'number' },
    focal_point_y: { type: 'number' },
    object_position_desktop: { type: 'string' },
    object_position_mobile: { type: 'string' },
    treatment_desktop: { type: 'string' },
    treatment_mobile: { type: 'string' },
    bg_color: { type: 'string' },
    scale_desktop: { type: 'number' },
    scale_mobile: { type: 'number' },
    analysis: { type: 'string' },
    recommendation: { type: 'string' },
  },
};

async function optimizeImage(imageUrl: string) {
  const result = await generateText({
    prompt: OPTIMIZATION_PROMPT,
    model: 'openai/gpt-5.4',
    file_urls: [imageUrl],
    response_json_schema: RESPONSE_SCHEMA,
  });

  // Ensure numeric fields are numbers
  const c = result.parsed || {};
  return {
    image_url: imageUrl,
    config: {
      focal_point_x: Number(c.focal_point_x) || 0.5,
      focal_point_y: Number(c.focal_point_y) || 0.5,
      object_position_desktop: c.object_position_desktop || 'center center',
      object_position_mobile: c.object_position_mobile || 'center center',
      treatment_desktop: c.treatment_desktop || 'cover',
      treatment_mobile: c.treatment_mobile || 'cover',
      bg_color: c.bg_color || '#000000',
      scale_desktop: Number(c.scale_desktop) || 1,
      scale_mobile: Number(c.scale_mobile) || 1,
      analysis: c.analysis || '',
      recommendation: c.recommendation || '',
    },
    model: result.model,
  };
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    if (action === 'optimize') {
      const { image_url } = body;
      if (!image_url) return Response.json({ error: 'image_url required' }, { status: 400 });

      try {
        const result = await optimizeImage(image_url);
        return Response.json({ ok: true, ...result });
      } catch (err: any) {
        return Response.json({ error: `Optimization failed: ${err.message}` }, { status: 500 });
      }
    }

    if (action === 'batchOptimize') {
      const { image_urls } = body;
      if (!Array.isArray(image_urls)) return Response.json({ error: 'image_urls array required' }, { status: 400 });

      const results = [];
      for (const url of image_urls) {
        try {
          const result = await optimizeImage(url);
          results.push(result);
        } catch (err: any) {
          results.push({ image_url: url, error: err.message });
        }
      }
      return Response.json({ ok: true, results });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('[responsiveImageOptimizer] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}