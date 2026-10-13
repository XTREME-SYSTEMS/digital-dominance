import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// ============================================================
// automatedPromptTester — The autonomous agent that automatically
// tests image generation prompts, evaluates their quality, and
// maintains the PromptLibrary. Runs on a 12-hour cron schedule.
//
// Pipeline:
//   1. Selects prompts that are untested or stale (tested_at is
//      null or older than 7 days), prioritizing active prompts.
//   2. Generates a test image using GenerateImage integration.
//   3. Sends the image + prompt to InvokeLLM for quality scoring
//      on a 0-100 rubric (photorealism, composition, lighting,
//      color accuracy, prompt adherence).
//   4. Updates the PromptLibrary record with quality_score,
//      test_image_url, test_notes, tested_at, test_count.
//   5. Auto-features prompts scoring 85+ and deactivates prompts
//      that score below 50 across 3+ consecutive tests.
//
// Invoke: base44.functions.invoke('automatedPromptTester', {
//   maxPrompts?,     // Max prompts to test this run (default: 5)
//   promptId?,       // Test a specific prompt by ID
//   skipGenerate?,   // Skip image generation (evaluation only)
// })
// ============================================================

const STALE_DAYS = 7;
const MAX_PROMPTS_PER_RUN = 5;
const FEATURE_THRESHOLD = 85;
const DEACTIVATE_THRESHOLD = 50;
const DEACTIVATE_MIN_TESTS = 3;

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const maxPrompts = body.maxPrompts || MAX_PROMPTS_PER_RUN;
    const svc = base44.asServiceRole;

    // ── 1. SELECT PROMPTS TO TEST ───────────────────────────
    let promptsToTest: any[] = [];

    if (body.promptId) {
      // Test a specific prompt
      const p = await svc.entities.PromptLibrary.get(body.promptId);
      if (p) promptsToTest = [p];
    } else {
      // Select untested or stale active prompts
      const staleCutoff = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000).toISOString();
      const page = await svc.entities.PromptLibrary.filter(
        {
          is_active: true,
          $or: [
            { tested_at: { $exists: false } },
            { tested_at: null },
            { tested_at: { $lt: staleCutoff } },
          ],
        },
        { sort: 'tested_at', limit: maxPrompts }
      );
      promptsToTest = page.items || [];
    }

    if (promptsToTest.length === 0) {
      return Response.json({
        ok: true,
        summary: { tested: 0, message: 'No prompts need testing — all up to date.' },
      });
    }

    const results: any[] = [];

    // ── 2-4. TEST EACH PROMPT ───────────────────────────────
    for (const prompt of promptsToTest) {
      try {
        let imageUrl = prompt.test_image_url;

        // Generate test image (unless skipped)
        if (!body.skipGenerate) {
          const genRes = await svc.integrations.Core.GenerateImage({
            prompt: prompt.prompt_text,
          });
          imageUrl = genRes?.url || imageUrl;
        }

        // Evaluate quality with LLM
        let qualityScore = 0;
        let testNotes = '';

        if (imageUrl) {
          const evalRes = await svc.integrations.Core.InvokeLLM({
            prompt: `You are an expert art director evaluating an AI-generated image for a website template.

PROMPT USED: "${prompt.prompt_text}"
CATEGORY: ${prompt.category}
INDUSTRY: ${prompt.industry || 'general'}

Evaluate the generated image on these criteria (0-100 each):
1. PHOTOREALISM: How photorealistic and lifelike does it look?
2. COMPOSITION: Is the framing, balance, and visual flow strong?
3. LIGHTING: Is the lighting natural and professional?
4. COLOR_ACCURACY: Are colors vivid, accurate, and well-balanced?
5. PROMPT_ADHERENCE: Does the image match what the prompt asked for?

Return a JSON object with:
- overall_score: number (0-100, the average of all criteria)
- photorealism: number
- composition: number
- lighting: number
- color_accuracy: number
- prompt_adherence: number
- verdict: "approve" | "revise" | "reject"
- notes: string (2-3 sentences explaining the score)

Be strict but fair. Only approve images that look genuinely professional.`,
            response_json_schema: {
              type: 'object',
              properties: {
                overall_score: { type: 'number' },
                photorealism: { type: 'number' },
                composition: { type: 'number' },
                lighting: { type: 'number' },
                color_accuracy: { type: 'number' },
                prompt_adherence: { type: 'number' },
                verdict: { type: 'string' },
                notes: { type: 'string' },
              },
            },
          });

          qualityScore = evalRes?.overall_score || 0;
          testNotes = evalRes?.notes || '';
        }

        // ── 5. UPDATE PROMPT RECORD ─────────────────────────
        const newTestCount = (prompt.test_count || 0) + 1;
        const updates: any = {
          quality_score: qualityScore,
          test_image_url: imageUrl,
          test_notes: testNotes,
          tested_at: new Date().toISOString(),
          test_count: newTestCount,
        };

        // Auto-feature high-scoring prompts
        if (qualityScore >= FEATURE_THRESHOLD) {
          updates.is_featured = true;
        }

        // Deactivate consistently poor prompts
        if (qualityScore < DEACTIVATE_THRESHOLD && newTestCount >= DEACTIVATE_MIN_TESTS) {
          updates.is_active = false;
          updates.is_featured = false;
        }

        await svc.entities.PromptLibrary.update(prompt.id, updates);

        results.push({
          id: prompt.id,
          title: prompt.title,
          score: qualityScore,
          verdict: testNotes.slice(0, 100),
          featured: qualityScore >= FEATURE_THRESHOLD,
          deactivated: qualityScore < DEACTIVATE_THRESHOLD && newTestCount >= DEACTIVATE_MIN_TESTS,
        });
      } catch (err: any) {
        results.push({
          id: prompt.id,
          title: prompt.title,
          error: err.message,
        });
      }
    }

    const featured = results.filter((r) => r.featured).length;
    const deactivated = results.filter((r) => r.deactivated).length;

    return Response.json({
      ok: true,
      summary: {
        tested: results.length,
        featured,
        deactivated,
        results,
      },
    });
  } catch (error: any) {
    console.error('automatedPromptTester error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}