import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { generateText } from '../../shared/aiGateway.ts';

// SMAI 101 Logo Generator — Generates 101 logo concept descriptions + rationales
// for a client based on their questionnaire + skip trace data.
// Uses Vercel AI Gateway text generation for the concept specs, then
// the vercelAiGateway function for actual image generation per concept.
export default async function(req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { client_id, business_name, industry, style_preference, color_preference, skip_trace_summary, batch_size } = body;

  if (!business_name) return Response.json({ error: 'business_name required' }, { status: 400 });

  const batchSize = Math.min(batch_size || 12, 101); // Generate in batches
  const runId = `LOGO-${Date.now()}`;
  console.log(`[smaiGenerate101Logos:${runId}] Generating ${batchSize} concepts for ${business_name}`);

  try {
    // Step 1: Generate concept specs via Vercel AI Gateway
    const prompt = `You are an expert brand designer and logo strategist.

Generate ${batchSize} unique logo concept specifications for:
- Business Name: ${business_name}
- Industry: ${industry || 'General'}
- Style Preference: ${style_preference || 'modern'}
- Color Preference: ${color_preference || 'warm'}
- Skip Trace Context: ${skip_trace_summary || 'No additional context available'}

For each concept, provide:
1. concept_number (1-${batchSize})
2. style (one of: wordmark, lettermark, emblem, mascot, abstract, monogram, combination)
3. color_scheme (descriptive name like "Electric Blue & Silver" or "Metallic Gold on Black")
4. description (1-2 sentence visual description of what the logo looks like)
5. rationale (1-2 sentences explaining why this concept fits this specific business based on their industry and context)

Make each concept DISTINCT — vary styles, color schemes, and approaches. Think like a top design agency pitching to a premium client.

Return as JSON: { "concepts": [{ "concept_number": 1, "style": "...", "color_scheme": "...", "description": "...", "rationale": "..." }, ...] }`;

    const { parsed, text } = await generateText({
      prompt,
      model: 'openai/gpt-5.4',
      response_json_schema: {
        type: 'object',
        properties: {
          concepts: { type: 'array', items: { type: 'object', properties: {
            concept_number: { type: 'number' },
            style: { type: 'string' },
            color_scheme: { type: 'string' },
            description: { type: 'string' },
            rationale: { type: 'string' }
          } } }
        }
      }
    });

    const conceptSpecs = (parsed?.concepts || []).slice(0, batchSize);
    console.log(`[smaiGenerate101Logos:${runId}] Generated ${conceptSpecs.length} concept specs`);

    // Step 2: Generate images for each concept via vercelAiGateway
    const results = [];
    for (const spec of conceptSpecs) {
      try {
        const imagePrompt = `Professional logo design for "${business_name}", ${industry || 'business'} company. Style: ${spec.style}. Color scheme: ${spec.color_scheme}. ${spec.description}. Clean, modern, high-quality vector-style logo on white background. No text watermark.`;
        
        const imgRes = await base44.functions.invoke('vercelAiGateway', {
          action: 'generateImage',
          prompt: imagePrompt
        }).catch(e => ({ error: e.message }));

        const imageUrl = imgRes?.data?.url || imgRes?.url || '';

        // Save to entity
        const conceptId = `${runId}-${spec.concept_number}`;
        const record = await base44.entities.SmaiLogoConcept.create({
          concept_id: conceptId,
          client_id: client_id || 'unknown',
          concept_number: spec.concept_number,
          style: spec.style,
          color_scheme: spec.color_scheme,
          image_url: imageUrl,
          description: spec.description,
          rationale: spec.rationale,
          batch_id: runId
        });

        results.push({
          concept_id: conceptId,
          concept_number: spec.concept_number,
          style: spec.style,
          color_scheme: spec.color_scheme,
          image_url: imageUrl,
          description: spec.description,
          rationale: spec.rationale,
          record_id: record.id
        });
      } catch (e) {
        console.error(`[smaiGenerate101Logos:${runId}] Concept ${spec.concept_number} failed: ${e.message}`);
        results.push({ concept_number: spec.concept_number, error: e.message });
      }
    }

    // Update client record
    if (client_id) {
      const existing = await base44.entities.SmaiClient.filter({ client_id }).catch(() => []);
      if (existing.length > 0) {
        await base44.entities.SmaiClient.update(existing[0].id, {
          logo_concepts_generated: true,
          logo_concept_count: results.filter(r => !r.error).length,
          onboarding_step: 'strategy_generation'
        });
      }
    }

    console.log(`[smaiGenerate101Logos:${runId}] Complete — ${results.filter(r => !r.error).length} logos generated`);

    return Response.json({
      ok: true,
      run_id: runId,
      concepts_generated: results.filter(r => !r.error).length,
      concepts_failed: results.filter(r => r.error).length,
      results,
      model: 'openai/gpt-5.4 + vercel-ai-gateway-image'
    });
  } catch (e) {
    console.error(`[smaiGenerate101Logos:${runId}] FAILED: ${e.message}`);
    return Response.json({ ok: false, error: e.message, run_id: runId }, { status: 500 });
  }
}