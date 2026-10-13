import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// ============================================================
// benchmarkVisualQualityCheck — Validates a generated image
// against the visual tokens extracted from the top 5 reverse-
// engineered benchmark sites for a given industry.
//
// Invoke: base44.functions.invoke('benchmarkVisualQualityCheck', {
//   imageUrl,       // URL of the generated image to validate
//   industryKey,    // industry category to match against
//   promptText,      // the prompt that generated the image (optional)
// })
//
// Returns: {
//   passed: boolean,
//   score: number (0-100),
//   checks: [{ name, passed, detail }],
//   feedback: string,
//   benchmarkCount: number,
//   visualStandards: object,
// }
// ============================================================

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json();
    const { imageUrl, industryKey, promptText } = body;

    if (!imageUrl) {
      return Response.json({ error: 'imageUrl is required' }, { status: 400 });
    }
    if (!industryKey) {
      return Response.json({ error: 'industryKey is required' }, { status: 400 });
    }

    const svc = base44.asServiceRole;

    // ── Load the top 5 captured benchmarks for this industry ──────────
    const benchmarkPage = await svc.entities.IndustryBenchmark.filter(
      { industry_key: industryKey, evidence_status: 'captured' },
      { limit: 5, sort: '-captured_at' }
    );
    const benchmarks = benchmarkPage.items || [];

    if (benchmarks.length === 0) {
      return Response.json({
        passed: false,
        score: 0,
        error: `No captured benchmarks found for industry: ${industryKey}. Run the reverse-engineer first.`,
        benchmarkCount: 0,
      });
    }

    // ── Aggregate visual tokens from all benchmark sites ──────────────
    const visualStandards = aggregateVisualTokens(benchmarks);

    // ── Run AI vision comparison ──────────────────────────────────────
    const evaluation = await runVisionComparison(svc, imageUrl, visualStandards, industryKey, promptText);

    return Response.json({
      passed: evaluation.score >= 75,
      score: evaluation.score,
      checks: evaluation.checks,
      feedback: evaluation.feedback,
      benchmarkCount: benchmarks.length,
      visualStandards,
      benchmarkSites: benchmarks.map((b: any) => ({ name: b.name, url: b.url })),
    });
  } catch (error: any) {
    console.error('benchmarkVisualQualityCheck error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ── Aggregate visual tokens from top 5 benchmark sites ──────────────
function aggregateVisualTokens(benchmarks: any[]) {
  const tokens: any = {
    colorPalettes: [],
    typographyStyles: [],
    imageryStyles: [],
    layoutPatterns: [],
    moodKeywords: [],
    qualityIndicators: [],
  };

  for (const b of benchmarks) {
    const vt = b.visual_tokens || {};
    if (vt.colorPalette) tokens.colorPalettes.push(vt.colorPalette);
    if (vt.typography) tokens.typographyStyles.push(vt.typography);
    if (vt.imageryStyle) tokens.imageryStyles.push(vt.imageryStyle);
    if (vt.layoutPattern) tokens.layoutPatterns.push(vt.layoutPattern);
    if (vt.mood) tokens.moodKeywords.push(vt.mood);
    if (vt.qualityIndicators) tokens.qualityIndicators.push(...(vt.qualityIndicators || []));

    // Also pull from capabilities if they contain visual info
    if (b.capabilities) {
      for (const cap of b.capabilities) {
        if (cap.category === 'visual' && cap.benefit) {
          tokens.qualityIndicators.push(cap.benefit);
        }
      }
    }
  }

  // Deduplicate
  tokens.qualityIndicators = [...new Set(tokens.qualityIndicators)].slice(0, 15);
  tokens.moodKeywords = [...new Set(tokens.moodKeywords)].slice(0, 10);

  return tokens;
}

// ── AI vision comparison against benchmark visual standards ──────────
async function runVisionComparison(svc: any, imageUrl: string, standards: any, industryKey: string, promptText?: string) {
  const standardsStr = JSON.stringify(standards).slice(0, 4000);

  const prompt = `You are an elite art director evaluating a generated image against the visual DNA of the top 5 highest-rated ${industryKey} websites in the US.

The image to evaluate: ${imageUrl}

The visual standards extracted from the top 5 benchmark sites:
${standardsStr}

${promptText ? `The prompt that generated this image: "${promptText}"` : ''}

Evaluate this image on these quality dimensions, scoring each 0-100:

1. photorealism: Does it look like a real professional photograph, not AI-generated or artificial?
2. industryMatch: Does the imagery match what top ${industryKey} websites use? (e.g. correct materials, settings, equipment, environments)
3. colorFidelity: Do the colors match the premium palette used by top benchmark sites?
4. compositionQuality: Is the composition professional — proper framing, depth of field, lighting, angles?
5. lightingQuality: Is the lighting natural, well-balanced, and high-end (not flat or harsh)?
6. detailSharpness: Is the image sharp, detailed, and high-resolution in appearance?
7. moodAlignment: Does the mood/feeling match the premium brand standards of top sites?
8. conversionAppeal: Would this image compel a visitor to trust and convert on a top-tier website?

Return as JSON:
{
  "score": <overall 0-100 weighted average>,
  "checks": [
    { "name": "photorealism", "passed": <true if 70+>, "score": <0-100>, "detail": "<brief feedback>" },
    ...one entry per dimension
  ],
  "feedback": "<2-3 sentence summary of quality and what to fix if anything>"
}

Be strict. This image must match the high-end style of the top 5 sites we reverse-engineered. Score below 75 means it should be rejected and regenerated.`;

  try {
    const res = await svc.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [imageUrl],
      response_json_schema: {
        type: 'object',
        properties: {
          score: { type: 'number' },
          checks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                passed: { type: 'boolean' },
                score: { type: 'number' },
                detail: { type: 'string' },
              },
            },
          },
          feedback: { type: 'string' },
        },
      },
    });

    // Normalize check format
    const checks = (res as any).checks?.map((c: any) => ({
      name: c.name,
      passed: c.passed,
      score: c.score,
      detail: c.detail,
    })) || [];

    return {
      score: (res as any).score || 0,
      checks,
      feedback: (res as any).feedback || '',
    };
  } catch (err: any) {
    console.error('Vision comparison error:', err.message);
    return {
      score: 0,
      checks: [],
      feedback: `Vision evaluation failed: ${err.message}`,
    };
  }
}