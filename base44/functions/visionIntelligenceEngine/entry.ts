import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// ═══════════════════════════════════════════════════════════════
// visionIntelligenceEngine — Unified initial intelligence gathering.
// Integrates patterns from Vision Cortex:
//   1. visionSweep      — scan Product Hunt, Reddit, HN, X for opportunities
//   2. deepDiscovery    — competitive intelligence for a niche
//   3. generateStrategy — 10 strategies with financial predictions
//   4. simulateOutcomes — 3-scenario (conservative/base/aggressive) forecast
//   5. councilRecommend — multi-agent council deliberation + recommendation
//
// All messy, complicated code stays here in the background.
// The UI just calls this and gets clean results.
// ═══════════════════════════════════════════════════════════════

const str = (v, max) => String(v ?? '').slice(0, max);
const arr = (v, max, itemMax) => Array.isArray(v) ? v.slice(0, max).map((s) => str(s, itemMax)) : [];
const num = (v) => Number(v) || 0;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { action, vision, niche, count, strategy } = body;
    const core = base44.asServiceRole.integrations.Core;

    // ── ACTION: sweep — scan for opportunities ──
    if (action === 'sweep') {
      const sweepCount = Math.min(Number(count) || 20, 30);
      const res = await core.InvokeLLM({
        prompt: `You are VISION, the scout of an autonomous business operating system. Today is ${new Date().toUTCString()}. Use live web search to surface the ${sweepCount} highest-leverage, launchable business opportunities available right now.

Scan: Product Hunt launches, Reddit (r/SaaS, r/Entrepreneur, r/sidehustle), Hacker News, X/Twitter trends, emerging AI tools, underserved niches, painful problems with real demand, and gaps left by incumbents.

For EACH opportunity capture:
- title, one_liner, industry, sub_industry
- problem (the real pain), solution (what gets built)
- target_users (who pays)
- rank (1 = best), score (0-100), probability_of_success (0-100)
- launch_cost_usd, est_monthly_profit_usd, est_annual_revenue_usd
- time_to_launch_days, trend_signal (why now), moat (defensibility)
- hidden_opportunity (the non-obvious edge)
- tech_stack (array), monetization (array), risks (array)
- source_urls (array of real URLs)

Return JSON: { "opportunities": [ ...${sweepCount} items ] }
Be rigorous: real demand only, no vapor. Cite real sources.`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            opportunities: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  one_liner: { type: 'string' },
                  industry: { type: 'string' },
                  problem: { type: 'string' },
                  solution: { type: 'string' },
                  target_users: { type: 'string' },
                  rank: { type: 'number' },
                  score: { type: 'number' },
                  probability_of_success: { type: 'number' },
                  launch_cost_usd: { type: 'number' },
                  est_monthly_profit_usd: { type: 'number' },
                  est_annual_revenue_usd: { type: 'number' },
                  time_to_launch_days: { type: 'number' },
                  trend_signal: { type: 'string' },
                  moat: { type: 'string' },
                  hidden_opportunity: { type: 'string' },
                  tech_stack: { type: 'array', items: { type: 'string' } },
                  monetization: { type: 'array', items: { type: 'string' } },
                  risks: { type: 'array', items: { type: 'string' } },
                  source_urls: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
      });

      const opportunities = (res.opportunities || []).slice(0, sweepCount).map((it, i) => ({
        title: str(it.title, 200),
        one_liner: str(it.one_liner, 300),
        industry: str(it.industry, 80),
        problem: str(it.problem, 1000),
        solution: str(it.solution, 1000),
        target_users: str(it.target_users, 300),
        rank: num(it.rank) || i + 1,
        score: num(it.score),
        probability_of_success: num(it.probability_of_success),
        launch_cost_usd: num(it.launch_cost_usd),
        est_monthly_profit_usd: num(it.est_monthly_profit_usd),
        est_annual_revenue_usd: num(it.est_annual_revenue_usd),
        time_to_launch_days: num(it.time_to_launch_days),
        trend_signal: str(it.trend_signal, 500),
        moat: str(it.moat, 500),
        hidden_opportunity: str(it.hidden_opportunity, 500),
        tech_stack: arr(it.tech_stack, 8, 100),
        monetization: arr(it.monetization, 6, 200),
        risks: arr(it.risks, 6, 300),
        source_urls: arr(it.source_urls, 8, 500),
      }));

      return Response.json({ ok: true, action: 'sweep', count: opportunities.length, opportunities });
    }

    // ── ACTION: discover — competitive intelligence for a niche ──
    if (action === 'discover') {
      if (!niche) return Response.json({ error: 'niche required' }, { status: 400 });
      const res = await core.InvokeLLM({
        prompt: `You are a strategic business analyst and competitive intelligence expert. Research the top 5 competitors in the "${niche}" industry.

For each competitor provide: name, url, pricing, strength, weakness, market_share_estimate.
Also provide: total_addressable_market, growth_rate, recommended_positioning, financial_projection_12mo, top_3_risks.

Return JSON with competitors array, total_addressable_market, growth_rate, recommended_positioning, financial_projection_12mo, top_3_risks.`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            competitors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' }, url: { type: 'string' },
                  pricing: { type: 'string' }, strength: { type: 'string' },
                  weakness: { type: 'string' }, market_share_estimate: { type: 'string' },
                },
              },
            },
            total_addressable_market: { type: 'string' },
            growth_rate: { type: 'string' },
            recommended_positioning: { type: 'string' },
            financial_projection_12mo: { type: 'string' },
            top_3_risks: { type: 'array', items: { type: 'string' } },
          },
        },
      });

      return Response.json({
        ok: true, action: 'discover', niche,
        competitors: arr(res.competitors, 5, 500).map((c) => ({
          name: str(c.name, 200), url: str(c.url, 500), pricing: str(c.pricing, 300),
          strength: str(c.strength, 500), weakness: str(c.weakness, 500),
          market_share_estimate: str(c.market_share_estimate, 100),
        })),
        total_addressable_market: str(res.total_addressable_market, 500),
        growth_rate: str(res.growth_rate, 200),
        recommended_positioning: str(res.recommended_positioning, 1000),
        financial_projection_12mo: str(res.financial_projection_12mo, 1000),
        top_3_risks: arr(res.top_3_risks, 3, 500),
      });
    }

    // ── ACTION: strategize — 10 strategies with financial predictions ──
    if (action === 'strategize') {
      if (!vision) return Response.json({ error: 'vision required' }, { status: 400 });
      const res = await core.InvokeLLM({
        prompt: `You are STRATEGY, the cold strategic operator. The user's vision: "${vision}".
Generate 10 distinct, realistic, launchable strategies to realize this vision. Each must be specific — not generic. Vary across risk, capital, speed, and angle.

For each strategy include:
- name, angle (how it leverages the vision), monetization, channel
- automation_level (low|med|high)
- est_12m_revenue_usd, build_cost_usd, fit_score (0-100)
- financial_prediction: { monthly_revenue_year1, monthly_revenue_year2, break_even_month, margin_pct, cac_payback_months }

Return JSON: { "strategies": [ ...10 items ] }
All 10 must have complete financial predictions. Vary channels; no near-duplicates.`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            strategies: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' }, angle: { type: 'string' },
                  monetization: { type: 'string' }, channel: { type: 'string' },
                  automation_level: { type: 'string' },
                  est_12m_revenue_usd: { type: 'number' },
                  build_cost_usd: { type: 'number' },
                  fit_score: { type: 'number' },
                  financial_prediction: {
                    type: 'object',
                    properties: {
                      monthly_revenue_year1: { type: 'number' },
                      monthly_revenue_year2: { type: 'number' },
                      break_even_month: { type: 'number' },
                      margin_pct: { type: 'number' },
                      cac_payback_months: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        },
      });

      const strategies = (res.strategies || []).slice(0, 10).map((s, i) => ({
        name: str(s.name, 200), angle: str(s.angle, 500),
        monetization: str(s.monetization, 300), channel: str(s.channel, 100),
        automation_level: str(s.automation_level, 10),
        est_12m_revenue_usd: num(s.est_12m_revenue_usd),
        build_cost_usd: num(s.build_cost_usd),
        fit_score: num(s.fit_score),
        financial_prediction: {
          monthly_revenue_year1: num(s.financial_prediction?.monthly_revenue_year1),
          monthly_revenue_year2: num(s.financial_prediction?.monthly_revenue_year2),
          break_even_month: num(s.financial_prediction?.break_even_month),
          margin_pct: num(s.financial_prediction?.margin_pct),
          cac_payback_months: num(s.financial_prediction?.cac_payback_months),
        },
      }));

      return Response.json({ ok: true, action: 'strategize', count: strategies.length, strategies });
    }

    // ── ACTION: simulate — 3-scenario financial forecast ──
    if (action === 'simulate') {
      if (!strategy) return Response.json({ error: 'strategy required' }, { status: 400 });
      const res = await core.InvokeLLM({
        prompt: `You are a rigorous financial simulation engine. Simulate 3 distinct outcomes for this business strategy:
${JSON.stringify(strategy)}

Generate exactly 3 scenarios: "conservative" (things go slower/worse), "base" (realistic), "aggressive" (things go better/faster).
For EACH scenario produce:
- probability (0-100), assumptions (3 key assumptions)
- timeline: 12 monthly entries with month (1-12), revenue, cost, profit, cumulative
- summary (one sentence on the outcome)
Be realistic with numbers — no vanity. Cumulative is the running sum of profit.
Return JSON: { "outcomes": [ {scenario, probability, assumptions, timeline, summary}, ...3 ] }`,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            outcomes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  scenario: { type: 'string' },
                  probability: { type: 'number' },
                  assumptions: { type: 'array', items: { type: 'string' } },
                  timeline: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        month: { type: 'number' },
                        revenue: { type: 'number' },
                        cost: { type: 'number' },
                        profit: { type: 'number' },
                        cumulative: { type: 'number' },
                      },
                    },
                  },
                  summary: { type: 'string' },
                },
              },
            },
          },
        },
      });

      return Response.json({ ok: true, action: 'simulate', outcomes: res.outcomes || [] });
    }

    // ── ACTION: council — multi-agent council deliberation + recommendation ──
    if (action === 'council') {
      const councilPrompt = `You are the Xtreme Vision Council — an anti-hierarchical multi-agent council deliberating on the best path forward for this vision:

VISION: ${vision || 'Build a fully autonomous, AI-powered digital business system'}

The council members are:
- VISION (the scout): surfaces opportunities, identifies trends
- STRATEGY (the operator): reverse-engineers competitors, builds moats
- QUANT (the predictor): stress-tests financials, quantifies risk
- SAGE (the advisor): grounds decisions in universal principles
- PRIMUS (the architect): designs the autonomous build plan

Deliberate as a council. Each member contributes from their expertise, challenges the others constructively, and the council converges on a single actionable recommendation.

Return JSON:
{
  "transcript": [ { "author": "member name", "content": "their contribution", "kind": "insight|challenge|support|warning" } ],
  "recommendation": { "strategy": "the recommended approach", "reason": "why the council chose this", "probability_of_success": 0-100, "key_risks": ["risk1", "risk2"], "next_steps": ["step1", "step2", "step3"] }
}`;
      const res = await core.InvokeLLM({
        prompt: councilPrompt,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            transcript: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  author: { type: 'string' },
                  content: { type: 'string' },
                  kind: { type: 'string' },
                },
              },
            },
            recommendation: {
              type: 'object',
              properties: {
                strategy: { type: 'string' },
                reason: { type: 'string' },
                probability_of_success: { type: 'number' },
                key_risks: { type: 'array', items: { type: 'string' } },
                next_steps: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      });

      return Response.json({
        ok: true, action: 'council',
        transcript: arr(res.transcript, 20, 2000).map((t) => ({
          author: str(t.author, 100), content: str(t.content, 2000), kind: str(t.kind, 50),
        })),
        recommendation: {
          strategy: str(res.recommendation?.strategy, 500),
          reason: str(res.recommendation?.reason, 2000),
          probability_of_success: num(res.recommendation?.probability_of_success),
          key_risks: arr(res.recommendation?.key_risks, 5, 500),
          next_steps: arr(res.recommendation?.next_steps, 10, 500),
        },
      });
    }

    return Response.json({ error: 'Unknown action. Use: sweep, discover, strategize, simulate, council' }, { status: 400 });
  } catch (error) {
    console.error('visionIntelligenceEngine error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}