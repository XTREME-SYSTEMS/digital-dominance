import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

// ─────────────────────────────────────────────────────────────────────────────
// socialStudio — Autonomous social media engine for Facebook.
//
// Uses the Vercel AI Gateway (InvokeLLM) for scroll-stopping content generation
// (captions, hashtags, SEO + AEO keywords) and GenerateImage / GenerateVideo
// for visual assets (photos, flyers, short videos). Publishes to Facebook Pages
// via the facebook_pages connector. The "autoRun" action is the cron entry point
// (publishes due posts + tops up the queue) — invoked 3x daily by the
// "Social Media Autopilot" workflow.
//
// Actions:
//   listPages        — list managed Facebook Pages
//   generateContent  — AI caption + hashtags + SEO/AEO keywords (InvokeLLM)
//   generateImage    — scroll-stopping image (GenerateImage)
//   generateVideo    — short vertical video (GenerateVideo)
//   generateFlyer    — promotional flyer / banner (GenerateImage)
//   autoGenerate     — full pipeline → creates a scheduled SocialPost
//   schedulePost     — create a manually-authored scheduled post
//   publishPost      — publish one post to Facebook by id
//   autoPublishDue   — publish all scheduled posts whose time has come
//   autoRun          — cron entry: publish due + top up queue (no auth)
//   list / update / delete
//
// Invoke: base44.functions.invoke('socialStudio', { action, ...params })
// ─────────────────────────────────────────────────────────────────────────────

import { generateText } from '../../shared/aiGateway.ts';
import { generateIndependentVideo } from '../../shared/videoGateway.ts';

const FB_GRAPH = 'https://graph.facebook.com/v25.0';

const CONTENT_THEMES: Record<string, { label: string; desc: string }> = {
  before_after: { label: 'Before & After', desc: 'Showcase a dramatic garage floor transformation' },
  testimonial: { label: 'Customer Testimonial', desc: 'Share a 5-star review story' },
  educational: { label: 'Educational', desc: 'Teach homeowners about epoxy benefits' },
  promotion: { label: 'Promotion', desc: 'Promote a free estimate or special offer' },
  faq: { label: 'FAQ', desc: 'Answer a common homeowner question' },
  tip: { label: 'Pro Tip', desc: 'Quick maintenance or design tip' },
  behind_scenes: { label: 'Behind the Scenes', desc: 'Show the installation process' },
  trend: { label: 'Trend / Style', desc: 'Highlight a popular color or finish' },
};

const THEME_KEYS = Object.keys(CONTENT_THEMES);

// ── Helpers ──

function buildContentPrompt(theme: string): string {
  const meta = CONTENT_THEMES[theme] || CONTENT_THEMES.educational;
  return `You are an elite social media content strategist for Xtreme Polishing Systems, a premium epoxy & polyaspartic garage floor coating company serving homeowners across the US.

Create a scroll-stopping Facebook post for the theme: "${meta.label}" — ${meta.desc}.

REQUIREMENTS:
- First line must STOP THE SCROLL: a bold question, surprising fact, or punchy hook.
- 2-4 short, punchy paragraphs (no walls of text). Use line breaks.
- Include a clear CTA (e.g. "Get your free estimate", "See our color charts", "Tap to book").
- 8-15 relevant hashtags (garage flooring, epoxy, home improvement, local SEO).
- 5-10 SEO keywords for Google search.
- 5-10 AEO (Answer Engine Optimization) keywords — natural-language questions people ask ChatGPT, Perplexity, and Google AI Overviews (e.g. "how much does epoxy garage flooring cost", "best garage floor coating near me", "is epoxy flooring worth it").
- A detailed media_prompt: a vivid description for an AI image/video generator that creates a scroll-stopping visual for this post (photorealistic, dramatic lighting, premium aesthetic).

COMPANY FACTS (ground truth — do not invent beyond these):
- Brand: Xtreme Polishing Systems — premium epoxy & polyaspartic garage floor coatings.
- 15+ years experience, national brand, lifetime warranty on premium systems.
- Phone: 1-833-700-1239. Website: epoxyquotenearme.com
- Services: garage floor coating, patio, commercial floors. Free estimates.

Return ONLY valid JSON.`;
}

async function generateContentInternal(svc: any, theme: string, model?: string): Promise<any> {
  const { parsed: llmRes } = await generateText({
    prompt: buildContentPrompt(theme),
    model: model || 'claude-sonnet-5',
    response_json_schema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'The full Facebook post text — scroll-stopping, with line breaks' },
        hashtags: { type: 'array', items: { type: 'string' } },
        seo_keywords: { type: 'array', items: { type: 'string' } },
        aeo_keywords: { type: 'array', items: { type: 'string' } },
        media_prompt: { type: 'string', description: 'Detailed prompt for an AI image/video generator' },
        cta: { type: 'string' },
      },
      required: ['content', 'hashtags', 'seo_keywords', 'aeo_keywords', 'media_prompt'],
    },
  });
  return llmRes;
}

async function generateMediaInternal(base44: any, svc: any, mediaType: string, prompt: string): Promise<{ url: string | null; type: string }> {
  if (!prompt || mediaType === 'none') return { url: null, type: 'none' };
  try {
    if (mediaType === 'video') {
      const res = await generateIndependentVideo(base44, {
        prompt: `${prompt}. Vertical 9:16, cinematic, scroll-stopping, premium, high detail.`,
        duration: 6,
        aspect_ratio: '9:16',
        generate_audio: false,
      });
      return { url: res.url, type: 'video' };
    }
    if (mediaType === 'flyer') {
      const res = await base44.functions.invoke('vercelAiGateway', {
        action: 'generateImage',
        prompt: `Professional promotional social media flyer design. ${prompt}. Bold headline text area at top, brand colors black and metallic gold, high contrast, 4:5 vertical format, scroll-stopping graphic.`,
      });
      return { url: res?.data?.urls?.[0] || null, type: 'flyer' };
    }
    // image (default)
    const res = await base44.functions.invoke('vercelAiGateway', {
      action: 'generateImage',
      prompt: `${prompt}. Photorealistic, dramatic lighting, premium aesthetic, high detail, scroll-stopping.`,
    });
    return { url: res?.data?.urls?.[0] || null, type: 'image' };
  } catch (e) {
    return { url: null, type: 'none' };
  }
}

// Next available 9am/1pm/5pm ET slot (13:00/17:00/21:00 UTC ≈ EDT) not already taken.
function nextSlotUTC(existingIso: string[]): string {
  const slotHours = [13, 17, 21];
  const taken = new Set((existingIso || []).map((t) => new Date(t).toISOString().slice(0, 16)));
  const now = new Date();
  for (let day = 0; day < 14; day++) {
    for (const h of slotHours) {
      const slot = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + day, h, 0, 0));
      if (slot.getTime() <= now.getTime() + 60000) continue;
      if (!taken.has(slot.toISOString().slice(0, 16))) return slot.toISOString();
    }
  }
  return new Date(Date.now() + 2 * 86400000).toISOString();
}

async function getPageToken(svc: any, pageId: string): Promise<string> {
  const { accessToken } = await svc.connectors.getConnection('facebook_pages');
  const res = await fetch(`${FB_GRAPH}/me/accounts?fields=id,access_token,name`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json();
  const page = (data.data || []).find((p: any) => p.id === pageId);
  if (!page) throw new Error('Facebook Page not found or not managed by the connected account');
  return page.access_token;
}

async function publishPostInternal(svc: any, post: any): Promise<{ fb_post_id: string; fb_permalink: string }> {
  const pageToken = await getPageToken(svc, post.page_id);
  const message = `${post.content}\n\n${(post.hashtags || []).map((h: string) => `#${h.replace(/\s+/g, '')}`).join(' ')}`;

  let fbResult: any;
  if (post.media_url && post.media_type === 'video') {
    const fbRes = await fetch(`${FB_GRAPH}/${post.page_id}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: message, file_url: post.media_url, access_token: pageToken }),
      signal: AbortSignal.timeout(60000),
    });
    fbResult = await fbRes.json();
    if (!fbRes.ok) throw new Error(fbResult.error?.message || 'Facebook video publish failed');
    return { fb_post_id: String(fbResult.id || ''), fb_permalink: '' };
  } else if (post.media_url && (post.media_type === 'image' || post.media_type === 'flyer')) {
    const fbRes = await fetch(`${FB_GRAPH}/${post.page_id}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, url: post.media_url, access_token: pageToken }),
      signal: AbortSignal.timeout(30000),
    });
    fbResult = await fbRes.json();
    if (!fbRes.ok) throw new Error(fbResult.error?.message || 'Facebook photo publish failed');
    const postId = fbResult.post_id || fbResult.id;
    return { fb_post_id: String(postId || ''), fb_permalink: postId ? `${FB_GRAPH}/${postId}` : '' };
  } else {
    const fbRes = await fetch(`${FB_GRAPH}/${post.page_id}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, access_token: pageToken }),
      signal: AbortSignal.timeout(15000),
    });
    fbResult = await fbRes.json();
    if (!fbRes.ok) throw new Error(fbResult.error?.message || 'Facebook feed publish failed');
    return { fb_post_id: String(fbResult.id || ''), fb_permalink: fbResult.id ? `${FB_GRAPH}/${fbResult.id}` : '' };
  }
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'list';

    // autoRun is the cron entry point — no user session available.
    if (action !== 'autoRun') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    switch (action) {
      case 'listPages': {
        const { accessToken } = await svc.connectors.getConnection('facebook_pages');
        const res = await fetch(`${FB_GRAPH}/me/accounts?fields=id,name,access_token,picture.width(64).height(64)`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(15000),
        });
        const data = await res.json();
        return Response.json({ ok: true, pages: data.data || [] });
      }

      case 'generateContent': {
        const theme = body.theme && CONTENT_THEMES[body.theme] ? body.theme : 'educational';
        const result = await generateContentInternal(svc, theme, body.model);
        return Response.json({ ok: true, content: result, theme, themeMeta: CONTENT_THEMES[theme] });
      }

      case 'generateImage': {
        if (!body.prompt) return Response.json({ error: 'prompt is required' }, { status: 400 });
        const { url, type } = await generateMediaInternal(base44, svc, 'image', body.prompt);
        return Response.json({ ok: true, url, type });
      }

      case 'generateVideo': {
        if (!body.prompt) return Response.json({ error: 'prompt is required' }, { status: 400 });
        const { url, type } = await generateMediaInternal(base44, svc, 'video', body.prompt);
        return Response.json({ ok: true, url, type });
      }

      case 'generateFlyer': {
        if (!body.prompt) return Response.json({ error: 'prompt is required' }, { status: 400 });
        const { url, type } = await generateMediaInternal(base44, svc, 'flyer', body.prompt);
        return Response.json({ ok: true, url, type });
      }

      case 'autoGenerate': {
        const theme = body.theme && CONTENT_THEMES[body.theme] ? body.theme : THEME_KEYS[Math.floor(Math.random() * THEME_KEYS.length)];
        const mediaType = body.mediaType || 'image';
        const contentRes = await generateContentInternal(svc, theme, body.model);
        const c = contentRes || {};
        const { url: mediaUrl, type: actualMediaType } = await generateMediaInternal(base44, svc, mediaType, c.media_prompt);

        // schedule at next available slot (or provided time)
        let scheduledAt = body.scheduledAt;
        if (!scheduledAt) {
          const existing = await svc.entities.SocialPost.filter({ status: 'scheduled' });
          scheduledAt = nextSlotUTC(existing.map((p: any) => p.scheduled_at).filter(Boolean));
        }

        const post = await svc.entities.SocialPost.create({
          content: c.content || '',
          hashtags: c.hashtags || [],
          seo_keywords: c.seo_keywords || [],
          aeo_keywords: c.aeo_keywords || [],
          content_theme: theme,
          media_type: actualMediaType,
          media_url: mediaUrl,
          media_prompt: c.media_prompt || '',
          platform: 'facebook',
          page_id: body.pageId || null,
          page_name: body.pageName || null,
          status: 'scheduled',
          scheduled_at: scheduledAt,
          auto_generated: true,
          created_by_name: 'system',
        });
        return Response.json({ ok: true, post });
      }

      case 'schedulePost': {
        if (!body.content) return Response.json({ error: 'content is required' }, { status: 400 });
        if (!body.scheduledAt) return Response.json({ error: 'scheduledAt is required' }, { status: 400 });
        const post = await svc.entities.SocialPost.create({
          content: body.content,
          hashtags: body.hashtags || [],
          seo_keywords: body.seoKeywords || [],
          aeo_keywords: body.aeoKeywords || [],
          content_theme: body.theme || 'educational',
          media_type: body.mediaType || 'none',
          media_url: body.mediaUrl || null,
          media_prompt: body.mediaPrompt || '',
          platform: 'facebook',
          page_id: body.pageId || null,
          page_name: body.pageName || null,
          status: 'scheduled',
          scheduled_at: body.scheduledAt,
          auto_generated: false,
          created_by_name: body.createdByName || 'admin',
        });
        return Response.json({ ok: true, post });
      }

      case 'publishPost': {
        if (!body.id) return Response.json({ error: 'id is required' }, { status: 400 });
        const post = await svc.entities.SocialPost.get(body.id);
        if (!post) return Response.json({ error: 'Post not found' }, { status: 404 });
        if (!post.page_id) return Response.json({ error: 'No Facebook Page selected on this post' }, { status: 400 });
        await svc.entities.SocialPost.update(body.id, { status: 'publishing' });
        try {
          const { fb_post_id, fb_permalink } = await publishPostInternal(svc, post);
          await svc.entities.SocialPost.update(body.id, {
            status: 'published',
            published_at: new Date().toISOString(),
            fb_post_id,
            fb_permalink,
            error: '',
          });
          return Response.json({ ok: true, fb_post_id, fb_permalink });
        } catch (err: any) {
          await svc.entities.SocialPost.update(body.id, { status: 'failed', error: err.message });
          return Response.json({ error: err.message }, { status: 500 });
        }
      }

      case 'autoPublishDue': {
        const now = new Date().toISOString();
        const due = await svc.entities.SocialPost.filter({ status: 'scheduled' });
        const toPublish = due.filter((p: any) => p.page_id && p.scheduled_at && p.scheduled_at <= now);
        const results: any[] = [];
        for (const post of toPublish) {
          try {
            await svc.entities.SocialPost.update(post.id, { status: 'publishing' });
            const { fb_post_id, fb_permalink } = await publishPostInternal(svc, post);
            await svc.entities.SocialPost.update(post.id, {
              status: 'published',
              published_at: new Date().toISOString(),
              fb_post_id,
              fb_permalink,
            });
            results.push({ id: post.id, ok: true, fb_post_id });
          } catch (err: any) {
            await svc.entities.SocialPost.update(post.id, { status: 'failed', error: err.message });
            results.push({ id: post.id, ok: false, error: err.message });
          }
        }
        return Response.json({ ok: true, published: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, results });
      }

      case 'autoRun': {
        // CRON ENTRY POINT — publish due posts, then top up the queue.
        const now = new Date().toISOString();

        // 1. Publish everything due
        const due = await svc.entities.SocialPost.filter({ status: 'scheduled' });
        const toPublish = due.filter((p: any) => p.page_id && p.scheduled_at && p.scheduled_at <= now);
        let published = 0, failed = 0;
        for (const post of toPublish) {
          try {
            await svc.entities.SocialPost.update(post.id, { status: 'publishing' });
            const { fb_post_id, fb_permalink } = await publishPostInternal(svc, post);
            await svc.entities.SocialPost.update(post.id, {
              status: 'published', published_at: now, fb_post_id, fb_permalink, error: '',
            });
            published++;
          } catch (err: any) {
            await svc.entities.SocialPost.update(post.id, { status: 'failed', error: err.message });
            failed++;
          }
        }

        // 2. Top up the queue — keep at least 9 scheduled posts (3 days × 3/day)
        const stillScheduled = await svc.entities.SocialPost.filter({ status: 'scheduled' });
        const target = 9;
        const existingTimes = stillScheduled.map((p: any) => p.scheduled_at).filter(Boolean);
        const generated: any[] = [];
        while (existingTimes.length < target) {
          try {
            const theme = THEME_KEYS[existingTimes.length % THEME_KEYS.length];
            const contentRes = await generateContentInternal(svc, theme);
            const c = contentRes || {};
            const { url: mediaUrl, type: mediaType } = await generateMediaInternal(base44, svc, 'image', c.media_prompt);
            const slot = nextSlotUTC(existingTimes);
            existingTimes.push(slot);
            const post = await svc.entities.SocialPost.create({
              content: c.content || '',
              hashtags: c.hashtags || [],
              seo_keywords: c.seo_keywords || [],
              aeo_keywords: c.aeo_keywords || [],
              content_theme: theme,
              media_type: mediaType,
              media_url: mediaUrl,
              media_prompt: c.media_prompt || '',
              platform: 'facebook',
              page_id: body.pageId || null,
              status: 'scheduled',
              scheduled_at: slot,
              auto_generated: true,
              created_by_name: 'autopilot',
            });
            generated.push({ id: post.id, theme, slot });
          } catch (e: any) {
            break; // don't loop forever on integration errors
          }
        }

        return Response.json({ ok: true, published, failed, generated: generated.length, queue: existingTimes.length });
      }

      case 'list': {
        const posts = await svc.entities.SocialPost.list('-created_date', body.limit || 100);
        return Response.json({ ok: true, posts, themes: CONTENT_THEMES });
      }

      case 'update': {
        if (!body.id) return Response.json({ error: 'id is required' }, { status: 400 });
        await svc.entities.SocialPost.update(body.id, body.data || {});
        return Response.json({ ok: true });
      }

      case 'delete': {
        if (!body.id) return Response.json({ error: 'id is required' }, { status: 400 });
        await svc.entities.SocialPost.delete(body.id);
        return Response.json({ ok: true });
      }

      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('[socialStudio] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}