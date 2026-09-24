// ═══════════════════════════════════════════════════════════════════════════
// visionEngine — AI-Assisted Vision → 10 Strategies → Names + URLs → Agents
//
// Pipeline:
//   1. ASSIST     — AI helps articulate the user's rough idea into a full vision
//   2. STRATEGIES — Generates 10 strategies with business names, URLs, recommendations
//   3. CHECK_DOMAINS — Checks domain availability via GoDaddy
//   4. REGENERATE — Regenerates strategies with a different angle
//
// All LLM calls use web search for real-time market data.
// Domain availability checked via GoDaddy API.
// ═══════════════════════════════════════════════════════════════════════════

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { secrets } from 'base44:runtime';
import { invokeIndependentAi } from '../../shared/independentCore.ts';

const GODADDY_BASE = 'https://api.godaddy.com/v1';

// ── Check a single domain's availability via GoDaddy ──────────────────────
async function checkDomainAvailability(domain: string): Promise<{ domain: string; available: boolean; price?: number }> {
  const token = secrets.get('GODADDY_API_KEY');
  if (!token) return { domain, available: false };

  try {
    const res = await fetch(`${GODADDY_BASE}/domains/available?domain=${encodeURIComponent(domain)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    if (!res.ok) return { domain, available: false };
    const data = await res.json();
    return {
      domain,
      available: data.available === true,
      price: data.price ? (data.price / 1000000) : undefined,
    };
  } catch {
    return { domain, available: false };
  }
}

// ── Check multiple domains in parallel ─────────────────────────────────────
async function checkMultipleDomains(domains: string[]): Promise<Record<string, { available: boolean; price?: number }>> {
  const unique = [...new Set(domains.filter(d => d && d.includes('.')))];
  const results = await Promise.all(unique.map(d => checkDomainAvailability(d)));
  const map: Record<string, { available: boolean; price?: number }> = {};
  for (const r of results) {
    map[r.domain] = { available: r.available, price: r.price };
  }
  return map;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════════

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'assist';

    switch (action) {

      // ── ASSIST: AI helps articulate the vision ──────────────────────────
      case 'assist': {
        if (!body.raw_idea && !body.vision) {
          return Response.json({ error: 'raw_idea or vision required' }, { status: 400 });
        }

        const rawIdea = body.raw_idea || body.vision;
        const feedback = body.feedback || ''; // User's feedback on previous attempt

        const prompt = `You are a visionary business architect helping the user fully articulate their vision for an autonomous business system.

USER'S RAW IDEA: "${rawIdea}"
${feedback ? `USER FEEDBACK ON PREVIOUS VERSION: "${feedback}"` : ''}

Help the user articulate a complete, compelling vision. Your response should:

1. **Refined Vision** — A polished 3-5 sentence vision statement that captures their intent, scope, and ambition
2. **Target Market** — Who this system serves and how
3. **Core Capabilities** — The key things the system must do
4. **Scale & Scope** — How big, how fast, how autonomous
5. **Success Metrics** — How they'll know it's working
6. **Differentiation** — What makes this unique vs. competitors
7. **Clarifying Questions** — 3-5 questions that would help refine further (if anything is ambiguous)

Write it as a compelling, confident vision document that a CEO would approve. Be specific and ambitious. Use the user's own language and intent — don't invent things they didn't ask for.

Return as JSON:
{
  "refined_vision": "string (3-5 sentences)",
  "target_market": "string",
  "core_capabilities": ["string"],
  "scale_scope": "string",
  "success_metrics": ["string"],
  "differentiation": "string",
  "clarifying_questions": ["string"]
}`;

        const result = await invokeIndependentAi(base44, {
          prompt,
          response_json_schema: {
            type: 'object',
            properties: {
              refined_vision: { type: 'string' },
              target_market: { type: 'string' },
              core_capabilities: { type: 'array', items: { type: 'string' } },
              scale_scope: { type: 'string' },
              success_metrics: { type: 'array', items: { type: 'string' } },
              differentiation: { type: 'string' },
              clarifying_questions: { type: 'array', items: { type: 'string' } },
            },
          },
        });

        return Response.json({ ok: true, ...result });
      }

      // ── STRATEGIES: Generate 10 strategies with names + URLs ───────────
      case 'strategies': {
        if (!body.vision) return Response.json({ error: 'vision required' }, { status: 400 });

        const vision = body.vision as string;
        const angle = body.angle || ''; // Optional angle for regeneration
        const excludeNames = body.exclude_names || []; // Names to avoid on regenerate

        const prompt = `You are a master business strategist. The user has an approved vision. Generate 10 DISTINCT, actionable strategies to execute that vision.

APPROVED VISION: "${vision}"
${angle ? `STRATEGIC ANGLE FOR THIS GENERATION: "${angle}"` : ''}
${excludeNames.length > 0 ? `AVOID THESE NAMES (already rejected): ${excludeNames.join(', ')}` : ''}

For each strategy, provide:
1. **strategy_name** — A memorable name for this strategy (e.g., "The Franchise Flood", "Authority Stack", "Geo-Grid Domination")
2. **summary** — 2-3 sentence summary of the approach
3. **business_name** — A specific, brandable business name for this strategy
4. **business_name_alt** — An alternative brandable name
5. **domain_suggestions** — 3 domain name suggestions (full domains like "mybrand.com")
6. **recommended_niche** — The specific niche/industry to target
7. **target_cities** — 3-5 target cities for initial launch
8. **key_differentiator** — What makes this strategy win vs. competitors
9. **monetization** — How this strategy makes money
10. **time_to_market** — Estimated time to first revenue
11. **difficulty** — "low", "medium", or "high"
12. **estimated_monthly_revenue** — Conservative estimate at 6 months
13. **recommended_agents** — Which agent types are most critical (orchestrator, seo_agent, social_media, lead_gen, etc.)
14. **why_it_works** — 1-2 sentences on why this strategy will succeed

Make each strategy genuinely different — different niches, different approaches, different scales. Don't just rephrase the same idea 10 times.

Return as JSON:
{
  "strategies": [
    {
      "strategy_name": "string",
      "summary": "string",
      "business_name": "string",
      "business_name_alt": "string",
      "domain_suggestions": ["string (full domain)"],
      "recommended_niche": "string",
      "target_cities": ["string"],
      "key_differentiator": "string",
      "monetization": "string",
      "time_to_market": "string",
      "difficulty": "low|medium|high",
      "estimated_monthly_revenue": "string",
      "recommended_agents": ["string"],
      "why_it_works": "string"
    }
  ]
}`;

        const result = await invokeIndependentAi(base44, {
          prompt,
          response_json_schema: {
            type: 'object',
            properties: {
              strategies: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    strategy_name: { type: 'string' },
                    summary: { type: 'string' },
                    business_name: { type: 'string' },
                    business_name_alt: { type: 'string' },
                    domain_suggestions: { type: 'array', items: { type: 'string' } },
                    recommended_niche: { type: 'string' },
                    target_cities: { type: 'array', items: { type: 'string' } },
                    key_differentiator: { type: 'string' },
                    monetization: { type: 'string' },
                    time_to_market: { type: 'string' },
                    difficulty: { type: 'string' },
                    estimated_monthly_revenue: { type: 'string' },
                    recommended_agents: { type: 'array', items: { type: 'string' } },
                    why_it_works: { type: 'string' },
                  },
                },
              },
            },
          },
        });

        const strategies = (result as any).strategies || [];

        // Check domain availability for all suggested domains
        const allDomains: string[] = [];
        for (const s of strategies) {
          allDomains.push(...(s.domain_suggestions || []));
        }
        const domainAvailability = await checkMultipleDomains(allDomains);

        // Attach availability to each strategy
        for (const s of strategies) {
          s.domain_status = (s.domain_suggestions || []).map((d: string) => ({
            domain: d,
            available: domainAvailability[d]?.available ?? false,
            price: domainAvailability[d]?.price,
          }));
        }

        return Response.json({
          ok: true,
          vision,
          strategies,
          count: strategies.length,
        });
      }

      // ── CHECK_DOMAINS: Check availability for a list of domains ────────
      case 'check_domains': {
        if (!body.domains || !Array.isArray(body.domains)) {
          return Response.json({ error: 'domains array required' }, { status: 400 });
        }
        const availability = await checkMultipleDomains(body.domains);
        return Response.json({ ok: true, results: availability });
      }

      // ── GENERATE_NAMES: Generate more business names for a strategy ────
      case 'generate_names': {
        if (!body.vision || !body.strategy_name) {
          return Response.json({ error: 'vision and strategy_name required' }, { status: 400 });
        }

        const exclude = body.exclude_names || [];
        const prompt = `Generate 10 brandable business names for this strategy.

VISION: "${body.vision}"
STRATEGY: "${body.strategy_name}"
${exclude.length > 0 ? `AVOID: ${exclude.join(', ')}` : ''}

Requirements:
- Must be brandable, memorable, and professional
- Must work as a domain name (no special characters)
- Should convey trust and authority for the target industry
- Include the .com domain suggestion for each

Return as JSON:
{
  "names": [
    {
      "name": "string",
      "domain": "string (full domain like name.com)",
      "rationale": "string (why this name works)"
    }
  ]
}`;

        const result = await invokeIndependentAi(base44, {
          prompt,
          response_json_schema: {
            type: 'object',
            properties: {
              names: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    domain: { type: 'string' },
                    rationale: { type: 'string' },
                  },
                },
              },
            },
          },
        });

        const names = (result as any).names || [];

        // Check domain availability
        const domains = names.map((n: any) => n.domain).filter(Boolean);
        const availability = await checkMultipleDomains(domains);
        for (const n of names) {
          n.available = availability[n.domain]?.available ?? false;
          n.price = availability[n.domain]?.price;
        }

        return Response.json({ ok: true, names });
      }

      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('[visionEngine] Error:', error.message);
    return Response.json({ error: error.message }, { status: error.status === 503 ? 503 : 500 });
  }
}