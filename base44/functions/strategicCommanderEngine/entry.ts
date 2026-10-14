import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const mode = body.mode || 'analyze';

    // Gather current platform state
    const [templates, sites, queue, targets, existingInitiatives] = await Promise.all([
      base44.entities.TemplateLibrary.filter({ is_active: true }, { limit: 50, fields: ['name', 'niche', 'category', 'is_default', 'conversion_rate', 'performance_score', 'preview_image_url'] }),
      base44.entities.SiteBank.filter({}, { limit: 50, fields: ['site_name', 'niche', 'target_city', 'target_state', 'status', 'site_url'] }),
      base44.entities.WebsiteQueue.filter({}, { limit: 50, fields: ['keyword', 'niche', 'target_city', 'status', 'priority', 'search_volume'] }),
      base44.entities.ProgrammaticTarget.filter({}, { limit: 20, fields: ['name', 'template_key', 'selected_states', 'total_sites', 'status'] }),
      base44.entities.StrategicInitiative.filter({}, { limit: 100, fields: ['title', 'category', 'priority', 'status', 'impact_score', 'roi_score'] })
    ]);

    const platformState = {
      templateCount: templates.items?.length || 0,
      templates: templates.items || [],
      siteCount: sites.items?.length || 0,
      sites: sites.items || [],
      queueCount: queue.items?.length || 0,
      queue: queue.items || [],
      targetCount: targets.items?.length || 0,
      targets: targets.items || [],
      existingInitiatives: existingInitiatives.items || [],
      liveSites: (sites.items || []).filter(s => s.status === 'live').length,
      queuedSites: (sites.items || []).filter(s => s.status === 'queued').length,
      nichesCovered: [...new Set((sites.items || []).map(s => s.niche).filter(Boolean))],
      statesCovered: [...new Set((sites.items || []).map(s => s.target_state).filter(Boolean))],
    };

    if (mode === 'analyze') {
      return await runAnalysis(base44, platformState, body);
    } else if (mode === 'research') {
      return await runResearch(base44, platformState, body);
    } else if (mode === 'full_strategy') {
      return await runFullStrategy(base44, platformState, body);
    } else if (mode === 'sync_check') {
      return await runSyncCheck(base44, platformState);
    } else {
      return Response.json({ error: 'Unknown mode: ' + mode }, { status: 400 });
    }
  } catch (error) {
    console.error('Strategic Commander error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function runAnalysis(base44, platformState, body) {
  const focusArea = body.focus_area || 'all';

  const prompt = `You are the Strategic Commander analyzing the "Unlimited Websites" platform — a programmatic website launch engine that mass-deploys contractor niche sites nationwide.

CURRENT PLATFORM STATE:
- Templates: ${platformState.templateCount} active templates
- Sites deployed: ${platformState.siteCount} total (${platformState.liveSites} live, ${platformState.queuedSites} queued)
- Niches covered: ${platformState.nichesCovered.join(', ') || 'none yet'}
- States covered: ${platformState.statesCovered.join(', ') || 'none yet'}
- Queue items: ${platformState.queueCount}
- Programmatic targets: ${platformState.targetCount}
- Existing strategic initiatives: ${platformState.existingInitiatives.length}

FOCUS AREA: ${focusArea}

Analyze this platform and identify the TOP 5 highest-impact strategic initiatives to make this a 10/10 system. For each initiative, provide:
1. title (short, actionable)
2. category (one of: template_quality, market_strategy, google_dominance, technology_edge, cost_optimization, customer_reach, competitive_intelligence, system_sync)
3. priority (critical/high/medium/low)
4. impact_score (0-100, how much value it creates)
5. effort_score (0-100, lower = easier)
6. description (2-3 sentences explaining what and why)
7. action_steps (array of 3-7 specific, concrete steps)
8. expected_outcome (what success looks like)
9. google_features (array of Google features this leverages, if any)
10. cost_estimate (free/low/medium/high)

Focus on initiatives that will:
- Make templates the absolute best possible (10/10 visual quality, conversion, SEO, speed)
- Enable nationwide launch at scale
- Get customers clicking and calling
- Keep technology 10 steps ahead of competitors
- Leverage every Google feature for maximum dominance
- Do it all as cheaply as possible

Return a JSON object with an "initiatives" array of exactly 5 items.`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
    response_json_schema: {
      type: 'object',
      properties: {
        initiatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              category: { type: 'string' },
              priority: { type: 'string' },
              impact_score: { type: 'number' },
              effort_score: { type: 'number' },
              description: { type: 'string' },
              action_steps: { type: 'array', items: { type: 'object', properties: { step: { type: 'string' } } } },
              expected_outcome: { type: 'string' },
              google_features: { type: 'array', items: { type: 'string' } },
              cost_estimate: { type: 'string' }
            }
          }
        }
      }
    }
  });

  // Save initiatives to the database
  const saved = [];
  for (let i = 0; i < result.initiatives.length; i++) {
    const init = result.initiatives[i];
    const roiScore = init.impact_score > 0 && init.effort_score > 0
      ? Math.round((init.impact_score / init.effort_score) * 50)
      : 50;
    const record = await base44.entities.StrategicInitiative.create({
      title: init.title,
      category: init.category,
      priority: init.priority,
      impact_score: init.impact_score,
      effort_score: init.effort_score,
      roi_score: Math.min(100, roiScore),
      status: 'identified',
      description: init.description,
      action_steps: (init.action_steps || []).map(s => ({ step: s.step, done: false })),
      expected_outcome: init.expected_outcome,
      google_features: init.google_features || [],
      cost_estimate: init.cost_estimate || 'low',
      initiative_id: `SI-${String(Date.now()).slice(-6)}-${i}`,
      assigned_agent: 'strategic_commander',
      tags: [focusArea !== 'all' ? focusArea : 'full_analysis']
    });
    saved.push(record);
  }

  return Response.json({ ok: true, data: { initiatives: saved, platformState: { templateCount: platformState.templateCount, siteCount: platformState.siteCount, liveSites: platformState.liveSites, nichesCovered: platformState.nichesCovered.length, statesCovered: platformState.statesCovered.length } } });
}

async function runResearch(base44, platformState, body) {
  const topic = body.topic || 'programmatic SEO for contractor niches 2025';

  const prompt = `Research the following topic for the "Unlimited Websites" platform (a programmatic website launch engine for contractor niches):

TOPIC: ${topic}

Current platform state: ${platformState.templateCount} templates, ${platformState.siteCount} sites, niches: ${platformState.nichesCovered.join(', ')}

Provide a deep research briefing with:
1. key_findings (array of 5-7 specific, actionable findings with evidence)
2. competitor_analysis (array of 3-5 top competitors with what they do well and gaps we can exploit)
3. google_opportunities (array of 3-5 specific Google features we should leverage and HOW)
4. quick_wins (array of 3-5 things we can do immediately for fast results)
5. long_term_plays (array of 3-5 strategic moves for sustained dominance)
6. cost_saving_ideas (array of 3-5 ways to do this more cheaply)

Be extremely specific and actionable. No vague advice.`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
    response_json_schema: {
      type: 'object',
      properties: {
        key_findings: { type: 'array', items: { type: 'object', properties: { finding: { type: 'string' }, evidence: { type: 'string' }, action: { type: 'string' } } } },
        competitor_analysis: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, url: { type: 'string' }, strengths: { type: 'string' }, gaps: { type: 'string' }, our_advantage: { type: 'string' } } } },
        google_opportunities: { type: 'array', items: { type: 'object', properties: { feature: { type: 'string' }, how_to_leverage: { type: 'string' }, expected_impact: { type: 'string' } } } },
        quick_wins: { type: 'array', items: { type: 'string' } },
        long_term_plays: { type: 'array', items: { type: 'string' } },
        cost_saving_ideas: { type: 'array', items: { type: 'string' } }
      }
    }
  });

  return Response.json({ ok: true, data: result });
}

async function runFullStrategy(base44, platformState, body) {
  // Run both analysis and research in one comprehensive pass
  const [analysisResult, researchResult] = await Promise.all([
    runAnalysis(base44, platformState, body),
    runResearch(base44, platformState, body)
  ]);

  const analysisData = await analysisResult.json();
  const researchData = await researchResult.json();

  return Response.json({
    ok: true,
    data: {
      initiatives: analysisData.data?.initiatives || [],
      research: researchData.data || {},
      platformState: analysisData.data?.platformState || {}
    }
  });
}

async function runSyncCheck(base44, platformState) {
  const issues = [];

  // Check template sync
  if (platformState.templateCount === 0) {
    issues.push({ area: 'templates', severity: 'critical', issue: 'No active templates found', action: 'Create templates immediately' });
  }

  // Check site deployment sync
  if (platformState.queuedSites > 0 && platformState.liveSites === 0) {
    issues.push({ area: 'deployment', severity: 'high', issue: `${platformState.queuedSites} sites queued but none live`, action: 'Deploy queued sites' });
  }

  // Check niche coverage
  if (platformState.nichesCovered.length < 5) {
    issues.push({ area: 'market', severity: 'medium', issue: `Only ${platformState.nichesCovered.length} niches covered`, action: 'Expand to more contractor niches' });
  }

  // Check state coverage
  if (platformState.statesCovered.length < 10) {
    issues.push({ area: 'geography', severity: 'medium', issue: `Only ${platformState.statesCovered.length} states covered`, action: 'Expand to more states' });
  }

  // Check initiative status
  const staleInitiatives = platformState.existingInitiatives.filter(i => i.status === 'identified' || i.status === 'researching');
  if (staleInitiatives.length > 5) {
    issues.push({ area: 'strategy', severity: 'low', issue: `${staleInitiatives.length} initiatives not yet executing`, action: 'Start executing top initiatives' });
  }

  return Response.json({
    ok: true,
    data: {
      syncStatus: issues.length === 0 ? 'all_synced' : 'needs_attention',
      issues,
      platformState: {
        templateCount: platformState.templateCount,
        siteCount: platformState.siteCount,
        liveSites: platformState.liveSites,
        queuedSites: platformState.queuedSites,
        nichesCovered: platformState.nichesCovered.length,
        statesCovered: platformState.statesCovered.length,
        initiativeCount: platformState.existingInitiatives.length
      }
    }
  });
}