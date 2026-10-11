import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { generateText } from '../../shared/aiGateway.ts';

// SMAI Strategy Generator — Generates comprehensive business, system, and website
// strategies based on the client's questionnaire + skip trace data.
// Uses Vercel AI Gateway (bypasses Base44 integration credits).
export default async function(req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { client_id, business_name, industry, questionnaire_answers, skip_trace_data } = body;

  if (!business_name) return Response.json({ error: 'business_name required' }, { status: 400 });

  const runId = `STRAT-${Date.now()}`;
  console.log(`[smaiGenerateStrategies:${runId}] Generating strategies for ${business_name}`);

  try {
    const prompt = `You are a world-class business strategist and digital dominance expert.

Generate comprehensive strategies for:
- Business: ${business_name}
- Industry: ${industry || 'General'}
- Questionnaire Answers: ${JSON.stringify(questionnaire_answers || {})}
- Skip Trace Findings:
  - Gaps: ${JSON.stringify(skip_trace_data?.identified_gaps || [])}
  - Problems: ${JSON.stringify(skip_trace_data?.identified_problems || [])}
  - Social Profiles: ${JSON.stringify(skip_trace_data?.social_profiles || [])}
  - Competitive Landscape: ${skip_trace_data?.competitive_landscape || 'N/A'}

Generate strategies across these categories:
1. BUSINESS_STRATEGY — Overall business direction and positioning
2. SYSTEM_ARCHITECTURE — What systems/tools they need
3. WEBSITE_DESIGN — Website approach and key pages
4. MARKETING_FUNNEL — Lead generation and conversion funnel
5. SOCIAL_MEDIA — Social media automation strategy
6. SEO_DOMINANCE — Programmatic SEO and local SEO plan
7. BRAND_POSITIONING — How to differentiate from competitors
8. REVENUE_OPTIMIZATION — Pricing and revenue growth tactics

For each strategy provide:
- category (from the list above)
- title (short, punchy)
- description (2-3 sentences)
- rationale (why this fits THIS client specifically, referencing their gaps/problems)
- priority (critical/high/medium/low)
- estimated_impact (e.g. "+30% leads in 90 days")
- implementation_steps (3-5 actionable steps)

Return as JSON: { "strategies": [...] }`;

    const { parsed, text } = await generateText({
      prompt,
      model: 'openai/gpt-5.4',
      response_json_schema: {
        type: 'object',
        properties: {
          strategies: { type: 'array', items: { type: 'object', properties: {
            category: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            rationale: { type: 'string' },
            priority: { type: 'string' },
            estimated_impact: { type: 'string' },
            implementation_steps: { type: 'array', items: { type: 'string' } }
          } } }
        }
      }
    });

    const strategies = parsed?.strategies || [];

    // Save to entities
    const saved = [];
    for (let i = 0; i < strategies.length; i++) {
      try {
        const s = strategies[i];
        const strategyId = `${runId}-${i + 1}`;
        const record = await base44.entities.SmaiStrategy.create({
          strategy_id: strategyId,
          client_id: client_id || 'unknown',
          strategy_number: i + 1,
          category: s.category?.toLowerCase().replace(/ /g, '_') || 'business_strategy',
          title: s.title,
          description: s.description,
          rationale: s.rationale,
          priority: s.priority || 'medium',
          estimated_impact: s.estimated_impact || '',
          implementation_steps: s.implementation_steps || [],
          batch_id: runId
        });
        saved.push({ ...s, strategy_id: strategyId, record_id: record.id });
      } catch (e) {
        console.error(`[smaiGenerateStrategies:${runId}] Strategy ${i + 1} save failed: ${e.message}`);
      }
    }

    // Update client record
    if (client_id) {
      const existing = await base44.entities.SmaiClient.filter({ client_id }).catch(() => []);
      if (existing.length > 0) {
        await base44.entities.SmaiClient.update(existing[0].id, {
          strategy_count: saved.length,
          onboarding_step: 'complete',
          status: 'active'
        });
      }
    }

    console.log(`[smaiGenerateStrategies:${runId}] Complete — ${saved.length} strategies saved`);

    return Response.json({
      ok: true,
      run_id: runId,
      strategies_generated: saved.length,
      strategies: saved,
      model: 'openai/gpt-5.4'
    });
  } catch (e) {
    console.error(`[smaiGenerateStrategies:${runId}] FAILED: ${e.message}`);
    return Response.json({ ok: false, error: e.message, run_id: runId }, { status: 500 });
  }
}