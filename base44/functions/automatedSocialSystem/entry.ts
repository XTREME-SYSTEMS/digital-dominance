import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Automated Social Media System — generates complete social media packs for
// multiple sites at once. Each pack includes:
// 1. 10 branded social media template images (profile, cover, stories, posts)
// 2. A 30-day content calendar with captions, platforms, and best posting times
// Uses InvokeLLM for content generation and GenerateImage for template images.

const PLATFORMS = ["Instagram", "Facebook", "Google Business", "YouTube"];
const CONTENT_TYPES = ["Educational", "Promotional", "Behind-the-Scenes", "Customer Story", "Tips & Tricks", "Special Offer", "Community", "FAQ"];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const sites = body.sites || [];

    if (!sites.length) {
      return Response.json({ error: "No sites provided" }, { status: 400 });
    }

    const results = [];

    for (const site of sites) {
      try {
        const niche = site.niche || "local service business";
        const siteName = site.site_name || "Untitled Site";
        const location = [site.target_city, site.target_state].filter(Boolean).join(", ");
        const siteUrl = site.site_url || "";

        // Generate 30-day content calendar using InvokeLLM
        const calendarRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `You are a social media manager for a ${niche} business in ${location}. The business name is "${siteName}"${siteUrl ? ` and the website is ${siteUrl}` : ""}.

Generate a 30-day social media content calendar. For each day, provide:
1. platform: One of ${PLATFORMS.join(", ")}
2. type: Content type (Educational, Promotional, Behind-the-Scenes, Customer Story, Tips & Tricks, Special Offer, Community, FAQ)
3. caption: A compelling 1-3 sentence caption with relevant hashtags
4. bestTime: Best posting time (e.g., "9:00 AM", "12:30 PM", "6:00 PM")

Guidelines:
- Rotate platforms evenly across the 30 days
- Mix content types for engagement
- Include location-specific references where natural
- Use industry-relevant hashtags
- Keep captions engaging and action-oriented
- Vary posting times for optimal reach

Return JSON with a "calendar" array of 30 objects.`,
          response_json_schema: {
            type: "object",
            properties: {
              calendar: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    platform: { type: "string" },
                    type: { type: "string" },
                    caption: { type: "string" },
                    bestTime: { type: "string" },
                  },
                },
              },
            },
          },
        });

        const calendar = calendarRes?.calendar || [];

        // Generate 5 branded template images (limit to 5 to save credits)
        const templateTypes = [
          { label: "Profile Picture", prompt: `Professional profile picture for a ${niche} business in ${location}, clean modern design, circular logo style` },
          { label: "Cover Photo", prompt: `Professional social media cover photo for a ${niche} business in ${location}, wide banner format, showcasing services` },
          { label: "Story Template", prompt: `Instagram story template for a ${niche} business, vertical format, engaging design with space for text overlay` },
          { label: "Post Template", prompt: `Social media post template for a ${niche} business, square format, professional service showcase` },
          { label: "Promo Graphic", prompt: `Promotional graphic for a ${niche} business in ${location}, special offer style, eye-catching design` },
        ];

        const templates = [];
        for (const t of templateTypes) {
          try {
            const imgRes = await base44.asServiceRole.integrations.Core.GenerateImage({
              prompt: t.prompt,
            });
            templates.push({ label: t.label, url: imgRes?.url || "" });
          } catch (e) {
            console.log("Template image generation failed:", e.message);
            templates.push({ label: t.label, url: "" });
          }
        }

        results.push({
          siteId: site.id,
          site_name: siteName,
          niche,
          location,
          site_url: siteUrl,
          templates,
          calendar,
        });
      } catch (e) {
        console.error(`Social media generation failed for site ${site.site_name}:`, e.message);
        results.push({
          siteId: site.id,
          site_name: site.site_name,
          niche: site.niche,
          templates: [],
          calendar: [],
          error: e.message,
        });
      }
    }

    return Response.json({ ok: true, data: { results } });
  } catch (error) {
    console.error("automatedSocialSystem error", error?.message || error);
    return Response.json({ error: error?.message || "server error" }, { status: 500 });
  }
}