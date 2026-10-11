import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { generateText } from '../../shared/aiGateway.ts';

// SMAI Skip Trace — Comprehensive client research engine.
// Searches public information, social media, and business data to build
// a complete profile of the client for AI strategy generation.
// Uses Vercel AI Gateway (bypasses Base44 integration credits).
export default async function(req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { client_id, full_name, business_name, business_url, email, phone, address } = body;

  if (!full_name && !business_name) {
    return Response.json({ error: 'full_name or business_name required' }, { status: 400 });
  }

  const runId = `SKIP-${Date.now()}`;
  console.log(`[smaiSkipTrace:${runId}] Starting trace for ${full_name} / ${business_name}`);

  try {
    // Use Vercel AI Gateway with web search context (gemini_3_flash supports add_context_from_internet)
    const prompt = `You are an expert skip tracer and business intelligence analyst.

Research the following individual and their business using all available public information:

PERSON:
- Full Name: ${full_name || 'N/A'}
- Email: ${email || 'N/A'}
- Phone: ${phone || 'N/A'}
- Address: ${address || 'N/A'}

BUSINESS:
- Business Name: ${business_name || 'N/A'}
- Business URL: ${business_url || 'N/A'}

Provide a comprehensive analysis including:
1. SOCIAL MEDIA PROFILES — List all social media accounts found (Facebook, Instagram, LinkedIn, X/Twitter, TikTok, YouTube, Google Business Profile) with URLs and follower counts if available
2. PUBLIC INFORMATION SUMMARY — Summary of their online presence, reputation, and visibility
3. BUSINESS ANALYSIS — What their business does, how long they've been operating, market position
4. IDENTIFIED GAPS — Specific gaps in their digital presence (missing social platforms, poor website, no reviews, no SEO, etc.)
5. IDENTIFIED PROBLEMS — Specific problems that our AI system can solve for them
6. COMPETITIVE LANDSCAPE — Key competitors and how they compare
7. OPPORTUNITY AREAS — Where they can gain the most ground with AI-powered digital dominance

Return as JSON with this exact schema:
{
  "social_profiles": [{"platform": "string", "url": "string", "followers": number, "notes": "string"}],
  "public_info_summary": "string",
  "business_analysis": "string",
  "identified_gaps": ["string"],
  "identified_problems": ["string"],
  "competitive_landscape": "string",
  "opportunity_areas": ["string"]
}`;

    const { parsed, text } = await generateText({
      prompt,
      model: 'google/gemini-3-flash',
      response_json_schema: {
        type: 'object',
        properties: {
          social_profiles: { type: 'array', items: { type: 'object', properties: {
            platform: { type: 'string' }, url: { type: 'string' }, followers: { type: 'number' }, notes: { type: 'string' }
          } } },
          public_info_summary: { type: 'string' },
          business_analysis: { type: 'string' },
          identified_gaps: { type: 'array', items: { type: 'string' } },
          identified_problems: { type: 'array', items: { type: 'string' } },
          competitive_landscape: { type: 'string' },
          opportunity_areas: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    const result = parsed || JSON.parse(text || '{}');

    // Update the client record if client_id provided
    if (client_id) {
      const existing = await base44.entities.SmaiClient.filter({ client_id }).catch(() => []);
      if (existing.length > 0) {
        await base44.entities.SmaiClient.update(existing[0].id, {
          skip_trace_completed: true,
          skip_trace_summary: result.public_info_summary || '',
          social_profiles: result.social_profiles || [],
          public_info_summary: result.public_info_summary || '',
          identified_gaps: result.identified_gaps || [],
          identified_problems: result.identified_problems || [],
          onboarding_step: 'logo_generation'
        });
      }
    }

    console.log(`[smaiSkipTrace:${runId}] Trace complete — ${result.identified_gaps?.length || 0} gaps, ${result.identified_problems?.length || 0} problems`);

    return Response.json({
      ok: true,
      run_id: runId,
      result,
      model: 'google/gemini-3-flash'
    });
  } catch (e) {
    console.error(`[smaiSkipTrace:${runId}] FAILED: ${e.message}`);
    return Response.json({ ok: false, error: e.message, run_id: runId }, { status: 500 });
  }
}