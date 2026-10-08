import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { secrets } from 'base44:runtime';
import { completeGateway } from '../../shared/aiGateway.ts';
import { withRetry } from '../../shared/resilience.ts';

// ═══════════════════════════════════════════════════════════════════════════
// independentSocialGenerator — Generates social media posts WITHOUT Base44 credits.
//
// Routes all AI generation through Vercel AI Gateway.
// Supports Facebook, Instagram, X/Twitter, LinkedIn, TikTok, Google Business.
// Creates SocialSchedule records ready for publishing.
// ═══════════════════════════════════════════════════════════════════════════

const PLATFORM_CONFIG: Record<string, { maxLength: number; hashtagStyle: string; tone: string }> = {
  facebook: { maxLength: 5000, hashtagStyle: 'sparse', tone: 'conversational' },
  instagram: { maxLength: 2200, hashtagStyle: 'heavy', tone: 'visual-first' },
  x_twitter: { maxLength: 280, hashtagStyle: 'minimal', tone: 'punchy' },
  linkedin: { maxLength: 3000, hashtagStyle: 'professional', tone: 'professional' },
  tiktok: { maxLength: 150, hashtagStyle: 'trending', tone: 'casual' },
  google_business: { maxLength: 750, hashtagStyle: 'none', tone: 'informative' },
};

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // ── generatePost: Generate a social media post via Vercel AI Gateway ──
    if (action === 'generatePost') {
      const { platform, topic, site_id, tone, hashtags, media_urls } = body;
      if (!platform || !topic) {
        return Response.json({ error: 'platform and topic required' }, { status: 400 });
      }

      const config = PLATFORM_CONFIG[platform];
      if (!config) {
        return Response.json({ error: `Unsupported platform: ${platform}` }, { status: 400 });
      }

      const prompt = `Create a ${platform} post about: "${topic}".
Tone: ${tone || config.tone}
Max length: ${config.maxLength} characters
Hashtag style: ${config.hashtagStyle}
${hashtags ? `Include these hashtags: ${hashtags}` : ''}

Return ONLY the post text, no explanation or meta-commentary.`;

      const result = await withRetry(
        async () => {
          return await completeGateway({
            model: 'anthropic/claude-opus-4.7',
            messages: [{ role: 'user', content: prompt }],
          });
        },
        { maxAttempts: 2, retryableErrors: ['timeout', '5xx'] }
      );

      const postText = (result.text || '').slice(0, config.maxLength);

      // Create a SocialSchedule record
      let scheduleId: string | null = null;
      try {
        const schedule = await base44.entities.SocialSchedule.create({
          schedule_id: `sched-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          site_id: site_id || null,
          platform,
          post_type: media_urls?.length ? 'image' : 'text',
          content_text: postText,
          media_urls: media_urls || [],
          hashtags: (postText.match(/#\w+/g) || []).map((h: string) => h),
          auto_generated: true,
          status: 'draft',
        });
        scheduleId = schedule.id;
      } catch { /* best-effort */ }

      return Response.json({
        ok: true,
        platform,
        post_text: postText,
        schedule_id: scheduleId,
        model: result.model,
        independent: true, // did NOT use Base44 credits
      });
    }

    // ── generateBatch: Generate posts for multiple platforms ──
    if (action === 'generateBatch') {
      const { topic, platforms, site_id } = body;
      if (!topic || !Array.isArray(platforms)) {
        return Response.json({ error: 'topic and platforms array required' }, { status: 400 });
      }

      const results: any[] = [];
      for (const platform of platforms) {
        const config = PLATFORM_CONFIG[platform];
        if (!config) continue;

        try {
          const prompt = `Create a ${platform} post about: "${topic}".
Tone: ${config.tone}. Max ${config.maxLength} chars. Return ONLY the post text.`;

          const result = await completeGateway({
            model: 'anthropic/claude-opus-4.7',
            messages: [{ role: 'user', content: prompt }],
          });

          results.push({
            platform,
            post_text: (result.text || '').slice(0, config.maxLength),
            independent: true,
          });
        } catch (err) {
          results.push({ platform, error: err.message });
        }
      }

      return Response.json({ ok: true, posts: results, independent: true });
    }

    // ── schedulePost: Schedule a generated post for publishing ──
    if (action === 'schedulePost') {
      const { schedule_id, scheduled_at } = body;
      if (!schedule_id) return Response.json({ error: 'schedule_id required' }, { status: 400 });

      try {
        const updated = await base44.entities.SocialSchedule.update(schedule_id, {
          scheduled_at: scheduled_at || new Date(Date.now() + 3600000).toISOString(),
          status: 'scheduled',
        });
        return Response.json({ ok: true, schedule: updated, independent: true });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
      }
    }

    // ── status ──
    if (action === 'status') {
      return Response.json({
        ok: true,
        independent: !!secrets.get('VERCEL_AI_GATEWAY_API_KEY'),
        platforms: Object.keys(PLATFORM_CONFIG),
        billing: 'Vercel AI Gateway (NOT Base44 credits)',
      });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('[independentSocialGenerator] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}