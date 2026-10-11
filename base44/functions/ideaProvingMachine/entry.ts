import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { generateText } from '../../shared/aiGateway.ts';

// ═══════════════════════════════════════════════════════════════════════════
// ideaProvingMachine — Autonomous idea generation and validation engine.
//
// Scans Google trends, GitHub trending repos, and market gaps using AI.
// Generates actionable opportunities and tells the operator what to build next.
//
// Runs on a Railway cron (every 6 hours) via railwayCronDispatcher:
//   0 */6 * * * → curl -X POST $DEPLOY_URL -H "x-cron-key: $CRON_KEY" -d '{"task":"idea_proving_machine"}'
//
// Actions:
//   scan     — Run the scan, generate ideas, store them (cron-triggered)
//   latest   — Return the latest 20 ideas
//   recommend — Return top new ideas sorted by priority
//   dismiss  — Mark an idea as reviewed
//   acted    — Mark an idea as acted_on (pipeline launched)
// ═══════════════════════════════════════════════════════════════════════════

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

const SCAN_PROMPT = `You are an autonomous idea-proving machine for a website factory that builds, brands, deploys, and scales industry-specific websites and digital presences.

Analyze current market trends and identify the TOP 10 most profitable opportunities RIGHT NOW. Draw from your knowledge of:
1. Google search trends — what services, problems, and products are people searching for
2. GitHub trending tools — new frameworks, AI tools, and technologies that could be leveraged
3. Market gaps — industries where existing websites are poor quality or nonexistent
4. High-demand home services with low digital competition
5. Emerging service industries that need websites
6. Trending products with search demand but poor online presence

For each opportunity, provide:
- title: Short, compelling name (2-5 words)
- category: "google_trend" | "github_trend" | "market_gap" | "service_opportunity" | "product_opportunity" | "emerging_tech"
- description: What the opportunity is and why it matters (2-3 sentences)
- evidence: Specific data, trends, or observations that support this (search volume, competition level, market size)
- recommended_action: Exactly what the user should do to capitalize — be specific and actionable (e.g., "Build a website for X niche in Y city, deploy to Vercel, sync Google, launch 50 programmatic city pages")
- priority: "critical" | "high" | "medium" | "low" — based on revenue potential × ease of execution
- potential_revenue: Estimated monthly revenue range (e.g., "$5K-15K/mo")
- competition_level: "low" | "medium" | "high" | "extreme"
- target_audience: Who the customers are
- keywords: 5-10 SEO keywords for this opportunity
- niche: The specific industry/niche

Focus on opportunities that a website factory could exploit immediately. Prioritize low-competition, high-demand opportunities.

Return your response as JSON with the structure: { "ideas": [{ "title": "", "category": "", "description": "", "evidence": "", "recommended_action": "", "priority": "", "potential_revenue": "", "competition_level": "", "target_audience": "", "keywords": [], "niche": "" }] }`;

export default async function(req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  const svc = base44.asServiceRole;

  let body: any = {};
  try { body = await req.json(); } catch {}

  const { action = 'scan' } = body;

  // ── latest / recommend: return stored ideas ──
  if (action === 'latest' || action === 'recommend') {
    const filter = action === 'recommend' ? { status: 'new' } : {};
    const records = await svc.entities.IdeaProvingRecord.filter(filter, {
      sort: '-created_date',
      limit: 20,
    });
    // Sort by priority for recommendations
    if (action === 'recommend' && Array.isArray(records)) {
      records.sort((a, b) => {
        const pa = PRIORITY_ORDER[a.priority as string] ?? 3;
        const pb = PRIORITY_ORDER[b.priority as string] ?? 3;
        return pa - pb;
      });
    }
    return Response.json({ ok: true, ideas: records });
  }

  // ── dismiss: mark idea as reviewed ──
  if (action === 'dismiss') {
    const { id } = body;
    if (!id) return Response.json({ ok: false, error: 'Missing id' }, { status: 400 });
    await svc.entities.IdeaProvingRecord.update(id, { status: 'reviewed' });
    return Response.json({ ok: true });
  }

  // ── acted: mark idea as acted on ──
  if (action === 'acted') {
    const { id } = body;
    if (!id) return Response.json({ ok: false, error: 'Missing id' }, { status: 400 });
    await svc.entities.IdeaProvingRecord.update(id, { status: 'acted_on', pipeline_launched: true });
    return Response.json({ ok: true });
  }

  // ── scan: generate new ideas ──
  if (action !== 'scan') {
    return Response.json({ ok: false, error: `Unknown action: ${action}` }, { status: 400 });
  }

  try {
    const { parsed } = await generateText({
      prompt: SCAN_PROMPT,
      response_json_schema: { type: 'object' },
    });

    const ideas = parsed?.ideas || [];
    if (!ideas.length) {
      return Response.json({ ok: false, error: 'AI returned no ideas' }, { status: 500 });
    }

    // Store ideas
    const now = new Date().toISOString();
    const stored = [];
    for (const idea of ideas) {
      const record = await svc.entities.IdeaProvingRecord.create({
        idea_id: `ipm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: idea.title || 'Untitled',
        category: idea.category || 'market_gap',
        description: idea.description || '',
        evidence: idea.evidence || '',
        recommended_action: idea.recommended_action || '',
        priority: idea.priority || 'medium',
        potential_revenue: idea.potential_revenue || 'Unknown',
        competition_level: idea.competition_level || 'medium',
        target_audience: idea.target_audience || 'Unknown',
        keywords: idea.keywords || [],
        niche: idea.niche || 'Unknown',
        source: 'ai_analysis',
        search_date: now,
        status: 'new',
      });
      stored.push(record);
    }

    // Sort by priority
    stored.sort((a, b) => {
      const pa = PRIORITY_ORDER[a.priority as string] ?? 3;
      const pb = PRIORITY_ORDER[b.priority as string] ?? 3;
      return pa - pb;
    });

    return Response.json({ ok: true, ideas: stored, count: stored.length });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Scan failed' },
      { status: 500 }
    );
  }
}