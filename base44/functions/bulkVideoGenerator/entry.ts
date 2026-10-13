import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Bulk Video Generator — generates AI video concept packs for multiple
// templates at once. Each concept includes a thumbnail image, title,
// description, and production script. Uses InvokeLLM for concept generation
// and GenerateImage for thumbnails.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const templates = body.templates || [];

    if (!templates.length) {
      return Response.json({ error: "No templates provided" }, { status: 400 });
    }

    const results = [];

    // Process each template — generate 5 video concepts per template
    for (const template of templates) {
      try {
        const niche = template.niche || "local service business";
        const name = template.name || "Untitled Template";

        // Generate 5 video concepts using InvokeLLM
        const conceptRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `You are a professional video producer for ${niche} marketing. Generate 5 short-form video concepts for a website template called "${name}".

For each concept, provide:
1. title: A catchy 3-5 word video title
2. description: 1-2 sentence description of what the video shows
3. script: A 15-30 second production script with scene directions
4. videoPrompt: A detailed AI video generation prompt (visual description, camera movement, lighting, mood, style)
5. thumbnailPrompt: A detailed AI image generation prompt for the video thumbnail

The videos should be:
- Professional and high-quality
- Relevant to the ${niche} industry
- Engaging for potential customers
- Suitable for website hero sections and social media
- 15-30 seconds in length

Return JSON with a "concepts" array of 5 objects.`,
          response_json_schema: {
            type: "object",
            properties: {
              concepts: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    script: { type: "string" },
                    videoPrompt: { type: "string" },
                    thumbnailPrompt: { type: "string" },
                  },
                },
              },
            },
          },
        });

        const concepts = conceptRes?.concepts || [];

        // Generate thumbnail images for each concept (limit to 3 to save credits)
        for (let i = 0; i < Math.min(concepts.length, 3); i++) {
          const c = concepts[i];
          if (!c.id) c.id = `concept-${i}`;
          try {
            const imgRes = await base44.asServiceRole.integrations.Core.GenerateImage({
              prompt: c.thumbnailPrompt || `Professional marketing thumbnail for ${niche} business video, cinematic lighting, high quality, 16:9 aspect ratio`,
            });
            c.thumbnailUrl = imgRes?.url || "";
          } catch (e) {
            console.log("Thumbnail generation failed:", e.message);
            c.thumbnailUrl = "";
          }
        }

        // Ensure all concepts have IDs
        concepts.forEach((c, i) => {
          if (!c.id) c.id = `concept-${i}`;
        });

        results.push({
          templateId: template.id,
          templateName: name,
          niche,
          concepts,
        });
      } catch (e) {
        console.error(`Video generation failed for template ${template.name}:`, e.message);
        results.push({
          templateId: template.id,
          templateName: template.name,
          niche: template.niche,
          concepts: [],
          error: e.message,
        });
      }
    }

    return Response.json({ ok: true, data: { results } });
  } catch (error) {
    console.error("bulkVideoGenerator error", error?.message || error);
    return Response.json({ error: error?.message || "server error" }, { status: 500 });
  }
}