import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// ============================================================
// GOD MODE — Deterministic Google Ranking Optimizer
// Uses a mathematical weighted-impact algorithm to generate the
// fastest path to Google's first page. Every action is scored by
// (factor_weight × score_gap) so the highest-impact moves are
// executed first. No LLM — pure deterministic computation.
// ============================================================

const FACTOR_META = {
  satisfying_content:  { weight: 24, label: "Consistent Publication of Satisfying Content", phase: 1, days: 7 },
  niche_expertise:     { weight: 14, label: "Niche Expertise", phase: 1, days: 5 },
  searcher_engagement: { weight: 13, label: "Searcher Engagement", phase: 2, days: 3 },
  keyword_title:       { weight: 12, label: "Keyword in Meta Title Tag", phase: 1, days: 1 },
  backlinks:           { weight: 12, label: "Backlinks", phase: 3, days: 30 },
  freshness:           { weight: 6,  label: "Freshness", phase: 2, days: 2 },
  trustworthiness:     { weight: 5,  label: "Trustworthiness", phase: 1, days: 2 },
  mobile_first:        { weight: 4,  label: "Mobile-First Website", phase: 1, days: 1 },
  link_diversity:      { weight: 3,  label: "Link Distribution Diversity", phase: 3, days: 21 },
  page_speed:          { weight: 2,  label: "Page Speed", phase: 1, days: 1 },
  brand_mentions:      { weight: 2,  label: "Brand Mentions", phase: 3, days: 14 },
  site_security:       { weight: 1,  label: "Site Security / SSL", phase: 1, days: 1 },
  internal_links:      { weight: 1,  label: "Internal Links", phase: 2, days: 2 },
  meta_description:    { weight: 1,  label: "Meta Description + Other", phase: 1, days: 1 },
};

const ACTIONS = {
  satisfying_content: "Publish 8 comprehensive 2,000+ word pages targeting hub keywords; add FAQ schema; implement weekly content calendar.",
  niche_expertise: "Create dedicated pages for every service × location permutation; add author bios with credentials; build topic clusters.",
  searcher_engagement: "Add click-to-call, live chat, video embeds, interactive cost calculators, and sticky mobile CTAs.",
  keyword_title: "Rewrite all title tags: primary keyword first, compelling hook, ≤60 chars; optimize H1s to match search intent.",
  backlinks: "Launch digital PR campaign; guest post on 10 industry sites; submit to 20 directories; target 50+ referring domains.",
  freshness: "Update all existing pages with current dates; publish weekly blog posts; add 'last updated' timestamps.",
  trustworthiness: "Add reviews schema, author bio pages, E-E-A-T signals, privacy policy, terms, and About page with team photos.",
  mobile_first: "Audit responsive design; add mobile sticky CTA; compress images; defer non-critical JS; target <2s mobile load.",
  link_diversity: "Diversify anchor text (branded 40%, partial 30%, exact 10%, generic 20%); build contextual links from diverse domains.",
  page_speed: "Optimize images (WebP), minify CSS/JS, enable lazy loading, use CDN, implement resource hints (preconnect, preload).",
  brand_mentions: "Launch PR campaign for 5+ industry publications; build social profiles on 4 platforms; get listed in industry directories.",
  site_security: "Enable SSL, HSTS, X-Frame-Options, X-Content-Type-Options, Content-Security-Policy headers.",
  internal_links: "Add breadcrumb navigation, related-posts sections, contextual links between hub and spoke pages (target 50+ internal links).",
  meta_description: "Write 120-160 char meta descriptions with primary keywords + compelling CTA for every page; add OG tags and Twitter cards.",
};

function estimateTimeToFirstPage(currentScore) {
  // Deterministic estimate: lower score = more time
  const gap = 95 - currentScore;
  if (gap <= 0) return "Already at first-page threshold";
  const weeks = Math.ceil(gap / 5) * 2; // each 5-point gap ≈ 2 weeks
  if (weeks <= 2) return "1-2 weeks";
  if (weeks <= 4) return "2-4 weeks";
  if (weeks <= 8) return "4-8 weeks";
  if (weeks <= 12) return "2-3 months";
  if (weeks <= 24) return "3-6 months";
  return "6+ months";
}

function projectScore(currentScore, phasesCompleted) {
  // Each phase completion adds a deterministic boost
  const boosts = [0, 12, 8, 6, 4]; // phase 1-4 diminishing returns
  let projected = currentScore;
  for (let i = 1; i <= phasesCompleted && i < boosts.length; i++) {
    projected += boosts[i];
  }
  return Math.min(100, Math.round(projected));
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { industry, currentScore, location, skipTraceData, benchmarkData } = await req.json();
    const score = currentScore?.score ?? 50;
    const breakdown = currentScore?.breakdown ?? {};

    // --- Deterministic prioritization: sort by (weight × score_gap) descending ---
    const actions = Object.entries(FACTOR_META)
      .map(([key, meta]) => {
        const currentFactorScore = breakdown[key]?.score ?? 0;
        const gap = 100 - currentFactorScore;
        const impact = Math.round(meta.weight * gap / 100 * 100) / 100;
        return {
          factor: meta.label,
          key,
          weight: meta.weight,
          current_score: currentFactorScore,
          gap,
          impact,
          phase: meta.phase,
          estimated_days: meta.days,
          action: ACTIONS[key],
        };
      })
      .filter(a => a.gap > 0)
      .sort((a, b) => b.impact - a.impact);

    // --- Phase grouping ---
    const phases = [
      {
        phase: 1,
        name: "Foundation & Compliance",
        duration: "Week 1-2",
        focus: "Fix all foundational issues: titles, meta, security, mobile, content depth, niche pages, trust signals.",
        actions: actions.filter(a => a.phase === 1),
        projected_score_after: projectScore(score, 1),
      },
      {
        phase: 2,
        name: "Engagement & Freshness",
        duration: "Week 3-4",
        focus: "Boost engagement signals, add fresh content, optimize internal linking, add interactive elements.",
        actions: actions.filter(a => a.phase === 2),
        projected_score_after: projectScore(score, 2),
      },
      {
        phase: 3,
        name: "Authority & Off-Page",
        duration: "Week 5-12",
        focus: "Build backlinks, diversify link profile, get brand mentions, PR campaigns, directory submissions.",
        actions: actions.filter(a => a.phase === 3),
        projected_score_after: projectScore(score, 3),
      },
      {
        phase: 4,
        name: "Sustained Dominance",
        duration: "Ongoing",
        focus: "Weekly content publishing, monthly content updates, continuous backlink building, brand mention monitoring.",
        actions: [{ factor: "Continuous Optimization", action: "Maintain weekly publishing cadence, update old content monthly, build 5+ new backlinks per month, monitor brand mentions.", impact: 0, phase: 4 }],
        projected_score_after: projectScore(score, 4),
      },
    ];

    // --- Deterministic projections ---
    const projectedFinal = projectScore(score, 4);
    const totalImpact = actions.reduce((sum, a) => sum + a.impact, 0);
    const timeToFirstPage = estimateTimeToFirstPage(score);

    // --- Page variation strategies for digital dominance ---
    const variations = [
      { name: "Location-Dominance Variation", strategy: "Create unique location pages for every city/county in service area with localized content, testimonials, and schema.", target_metric: "Local pack rankings" },
      { name: "Service-Depth Variation", strategy: "Create dedicated pages for every service sub-type with 2,000+ words, FAQ schema, and before/after galleries.", target_metric: "Service keyword rankings" },
      { name: "Question-Answer Variation", strategy: "Create FAQ hub pages answering 50+ industry questions with AEO-optimized schema for AI Overview capture.", target_metric: "AI Overview citations" },
    ];

    return Response.json({
      mode: "GOD_MODE_ACTIVATED",
      industry,
      location: location || "National",
      current_score: score,
      projected_score: projectedFinal,
      score_delta: projectedFinal - score,
      total_impact_available: Math.round(totalImpact * 100) / 100,
      time_to_first_page: timeToFirstPage,
      phases,
      prioritized_actions: actions,
      page_variations: variations,
      algorithm: "deterministic_weighted_impact_optimization_v1",
      competitors_analyzed: skipTraceData?.competitors?.length || 0,
      benchmark_enhanced: !!benchmarkData,
      activated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("godModeOptimizer error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}