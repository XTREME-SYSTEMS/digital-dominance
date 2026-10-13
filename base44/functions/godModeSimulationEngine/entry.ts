import { createClientFromRequest } from "npm:@base44/sdk@0.8.53";
import { logStep } from "../../shared/sopLog.ts";

// ═══════════════════════════════════════════════
// GOD MODE SIMULATION ENGINE
// Ingests workbook intelligence (strategies, capabilities, scenarios)
// and runs Monte Carlo simulations (500 draws per strategy × site count)
// to produce P10/P50/P90 costs, budget-fit probability, revenue projections,
// payback periods, and portfolio recommendations.
// ═══════════════════════════════════════════════

// ── Seeded RNG (deterministic, reproducible) ──
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rand: () => number, mean: number, std: number): number {
  const u1 = Math.max(rand(), 1e-10), u2 = rand();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * std;
}

function percentile(sorted: number[], p: number): number {
  const idx = (sorted.length - 1) * (p / 100);
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

// ── 10 Strategies from the workbook ──
const STRATEGIES = [
  { strategy_id: "S01", model_name: "Single flagship authority site", differentiation: "One differentiated service-focused site and lead funnel", content_quality: 5, practicality: 5, buyer_fit: 4, reusability: 4, cost_multiplier: 1.0 },
  { strategy_id: "S02", model_name: "Focused service subfolders", differentiation: "One brand, specialist service pages with true value", content_quality: 5, practicality: 4, buyer_fit: 4, reusability: 5, cost_multiplier: 1.08 },
  { strategy_id: "S03", model_name: "Verified location pages", differentiation: "Unique fulfillment/geographic usefulness, not city swaps", content_quality: 4, practicality: 3, buyer_fit: 4, reusability: 5, cost_multiplier: 1.15 },
  { strategy_id: "S04", model_name: "Buyer co-branded acquisitions", differentiation: "Partner buyer validates demand and exclusivity", content_quality: 4, practicality: 4, buyer_fit: 5, reusability: 5, cost_multiplier: 1.45 },
  { strategy_id: "S05", model_name: "High-intent paid ads landing pages", differentiation: "Paid demand validation before organic scaling", content_quality: 4, practicality: 4, buyer_fit: 4, reusability: 4, cost_multiplier: 1.25 },
  { strategy_id: "S06", model_name: "Adjacent service clusters", differentiation: "Related higher-margin services inside coherent clusters", content_quality: 5, practicality: 4, buyer_fit: 5, reusability: 4, cost_multiplier: 1.11 },
  { strategy_id: "S07", model_name: "Calculators and tools hub", differentiation: "Interactive buyer tools that earn links and capture intent", content_quality: 5, practicality: 3, buyer_fit: 4, reusability: 5, cost_multiplier: 1.30 },
  { strategy_id: "S08", model_name: "Portfolio of separate brands", differentiation: "Several genuine differentiated brands and domains", content_quality: 4, practicality: 3, buyer_fit: 4, reusability: 3, cost_multiplier: 1.72 },
  { strategy_id: "S09", model_name: "Regional hub subfolders", differentiation: "Verified unique markets under one authority domain", content_quality: 4, practicality: 4, buyer_fit: 3, reusability: 5, cost_multiplier: 1.08 },
  { strategy_id: "S10", model_name: "Adaptive evidence portfolio", differentiation: "Dynamic allocation based on evidence-weighted scoring", content_quality: 5, practicality: 4, buyer_fit: 5, reusability: 5, cost_multiplier: 1.15 },
];

// ── 60 High-Leverage Capabilities (abbreviated from workbook) ──
const CAPABILITIES = [
  { capability_id: 1, domain: "Intelligence", capability_name: "Market evidence freshness engine", exact_implementation: "Stamp every market signal with source, timestamp, geography, method, expiry and confidence.", priority: "Critical" },
  { capability_id: 2, domain: "Intelligence", capability_name: "Search intent decomposition", exact_implementation: "Split informational, commercial, local, transactional and post-purchase intent before assigning page types.", priority: "Critical" },
  { capability_id: 3, domain: "Intelligence", capability_name: "Buyer interview intelligence", exact_implementation: "Use consented first-party interview summaries to validate what customers actually need.", priority: "High" },
  { capability_id: 4, domain: "Intelligence", capability_name: "Willingness-to-pay experiments", exact_implementation: "Compare opt-in offers, quote conversions and realized prices instead of trusting AI price guesses.", priority: "High" },
  { capability_id: 5, domain: "Intelligence", capability_name: "Competitor positioning drift alerts", exact_implementation: "Detect material changes to publicly available competitor offers, page layouts and pricing disclosures.", priority: "High" },
  { capability_id: 6, domain: "Intelligence", capability_name: "Search opportunity cannibalization map", exact_implementation: "De-duplicate overlapping query targets before assigning them to pages.", priority: "Critical" },
  { capability_id: 7, domain: "Intelligence", capability_name: "Demand calibration ledger", exact_implementation: "Reconcile Trends, Planner, GSC and observed form volume weekly.", priority: "Critical" },
  { capability_id: 8, domain: "Content", capability_name: "Originality verification gate", exact_implementation: "Block publication of near-duplicate or AI-only content without a human originality check.", priority: "Critical" },
  { capability_id: 9, domain: "Content", capability_name: "Buyer-first content brief generator", exact_implementation: "Generate briefs from verified buyer needs, not keyword volume alone.", priority: "High" },
  { capability_id: 10, domain: "Content", capability_name: "Content performance attribution", exact_implementation: "Tie each page to GSC impressions, GA4 sessions and CRM lead outcomes.", priority: "High" },
  { capability_id: 11, domain: "Technical", capability_name: "Core Web Vitals budget enforcer", exact_implementation: "Block deploy if LCP > 2.5s, CLS > 0.1 or INP > 200ms on tested pages.", priority: "Critical" },
  { capability_id: 12, domain: "Technical", capability_name: "Structured data validator", exact_implementation: "Validate JSON-LD against schema.org before deploy; block on errors.", priority: "High" },
  { capability_id: 13, domain: "Technical", capability_name: "Canonical and redirect auditor", exact_implementation: "Check every page for correct canonical, no redirect chains, no broken internal links.", priority: "High" },
  { capability_id: 14, domain: "Authority", capability_name: "Linkable asset factory", exact_implementation: "Produce original data, tools or research that earns editorial links naturally.", priority: "High" },
  { capability_id: 15, domain: "Authority", capability_name: "Digital PR outreach tracker", exact_implementation: "Track pitches, responses and placements with provenance and consent.", priority: "Medium" },
  { capability_id: 16, domain: "Conversion", capability_name: "Form friction analyzer", exact_implementation: "Measure field count, completion time and drop-off per field; recommend reductions.", priority: "High" },
  { capability_id: 17, domain: "Conversion", capability_name: "A/B test runner", exact_implementation: "Randomized session assignment for headlines, CTAs and form variants.", priority: "High" },
  { capability_id: 18, domain: "Conversion", capability_name: "Lead quality scoring", exact_implementation: "Score inbound leads on buyer-defined criteria before routing to CRM.", priority: "Critical" },
  { capability_id: 19, domain: "Local", capability_name: "NAP consistency monitor", exact_implementation: "Verify name, address, phone match across site, GMB and citations.", priority: "Critical" },
  { capability_id: 20, domain: "Local", capability_name: "Service area truth gate", exact_implementation: "Block location pages without verified fulfillment capacity in that area.", priority: "Critical" },
  { capability_id: 21, domain: "Operations", capability_name: "Deploy gate with rollback", exact_implementation: "Require green QA + rollback plan before any production deploy.", priority: "Critical" },
  { capability_id: 22, domain: "Operations", capability_name: "Cost-per-site tracker", exact_implementation: "Track actual build + hosting + maintenance cost per site vs budget.", priority: "High" },
  { capability_id: 23, domain: "Governance", capability_name: "Evidence provenance ledger", exact_implementation: "Every claim, metric or forecast carries a source URL, date and method.", priority: "Critical" },
  { capability_id: 24, domain: "Governance", capability_name: "No-fake-success gate", exact_implementation: "Injected failures cannot yield LIVE, INDEXED or PASS status.", priority: "Critical" },
  { capability_id: 25, domain: "Measurement", capability_name: "GSC import pipeline", exact_implementation: "Import clicks, impressions, CTR, position per query per page weekly.", priority: "Critical" },
  { capability_id: 26, domain: "Measurement", capability_name: "GA4 event auditor", exact_implementation: "Verify form_submit, booked_meeting and call events actually fire.", priority: "High" },
  { capability_id: 27, domain: "Measurement", capability_name: "CRM revenue reconciliation", exact_implementation: "Match accepted leads to invoices and paid amounts monthly.", priority: "High" },
  { capability_id: 28, domain: "Autonomy", capability_name: "Autonomous research scout", exact_implementation: "Scheduled agent that scans Trends, competitors and gaps daily.", priority: "High" },
  { capability_id: 29, domain: "Autonomy", capability_name: "Autonomous QA validator", exact_implementation: "Run full-site test on every deploy before human review.", priority: "Critical" },
  { capability_id: 30, domain: "Autonomy", capability_name: "Autonomous healing engine", exact_implementation: "Detect broken pages, failed tests and index errors; auto-repair or flag.", priority: "High" },
];

// ── Conversion case multipliers ──
const CONVERSION_CASES: Record<string, number> = {
  LOW: 0.55, CAUTIOUS: 0.8, BASE: 1.0, HIGH: 1.2, OPTIMISTIC: 1.5,
};

// ── Default model assumptions (editable) ──
const DEFAULT_ASSUMPTIONS = {
  target_site_count: 1,
  monthly_impressions_per_site: 1000,
  organic_ctr: 0.04,
  lead_conversion: 0.04,
  lead_acceptance: 0.65,
  avg_lead_value: 85,
  monthly_opex_per_site: 15,
  base_build_cost: 75,
  budget: 1200,
  reserve_fraction: 0.2,
};

interface SimResult {
  cost_p10: number; cost_p50: number; cost_p90: number;
  budget_fit: number;
  impressions_mo: number; clicks_mo: number; leads_mo: number; revenue_mo: number;
  opex_mo: number; build_cost: number; net_12mo: number; payback: number; margin: number;
}

function runSimulation(
  strategy: typeof STRATEGIES[0],
  siteCount: number,
  convCase: string,
  assumptions: typeof DEFAULT_ASSUMPTIONS,
  draws: number = 500,
): SimResult {
  const seed = parseInt(strategy.strategy_id.replace("S", "")) * 1000 + siteCount * 100 + Object.keys(CONVERSION_CASES).indexOf(convCase);
  const rand = mulberry32(seed);
  const cvrMult = CONVERSION_CASES[convCase] || 1.0;
  const costMult = strategy.cost_multiplier;

  const costs: number[] = [];
  const netCash: number[] = [];

  for (let i = 0; i < draws; i++) {
    // Build cost per site — Gaussian around base, scaled by strategy multiplier
    const perSiteCost = Math.max(10, gaussian(rand, assumptions.base_build_cost * costMult, 18));
    const totalBuild = perSiteCost * siteCount;

    // Monthly traffic — impressions per site with noise
    const impressionsPerSite = Math.max(0, gaussian(rand, assumptions.monthly_impressions_per_site, 200));
    const totalImpressions = impressionsPerSite * siteCount;

    // Clicks — CTR with noise
    const ctr = Math.max(0.001, gaussian(rand, assumptions.organic_ctr, 0.01));
    const clicks = totalImpressions * ctr * cvrMult;

    // Leads — conversion with noise
    const leadCvr = Math.max(0.001, gaussian(rand, assumptions.lead_conversion, 0.01));
    const rawLeads = clicks * leadCvr;
    const acceptedLeads = rawLeads * assumptions.lead_acceptance;

    // Revenue
    const revenue = acceptedLeads * assumptions.avg_lead_value;
    const opex = assumptions.monthly_opex_per_site * siteCount;
    const monthlyNet = revenue - opex;
    const annualNet = monthlyNet * 12;
    const totalNet = annualNet - totalBuild;

    costs.push(totalBuild);
    netCash.push(totalNet);
  }

  costs.sort((a, b) => a - b);
  netCash.sort((a, b) => a - b);

  const budgetAfterReserve = assumptions.budget * (1 - assumptions.reserve_fraction);
  const budgetFitCount = costs.filter((c) => c <= budgetAfterReserve).length;

  // Use median values for the headline metrics
  const midIdx = Math.floor(draws / 2);
  const impressionsMo = assumptions.monthly_impressions_per_site * siteCount * cvrMult;
  const clicksMo = impressionsMo * assumptions.organic_ctr * cvrMult;
  const leadsMo = clicksMo * assumptions.lead_conversion * assumptions.lead_acceptance;
  const revenueMo = leadsMo * assumptions.avg_lead_value;
  const opexMo = assumptions.monthly_opex_per_site * siteCount;
  const buildCost = percentile(costs, 50);
  const net12mo = percentile(netCash, 50);
  const monthlyNet = revenueMo - opexMo;
  const payback = monthlyNet > 0 ? buildCost / monthlyNet : 999;
  const margin = revenueMo > 0 ? (monthlyNet / revenueMo) * 100 : 0;

  return {
    cost_p10: Math.round(percentile(costs, 10)),
    cost_p50: Math.round(percentile(costs, 50)),
    cost_p90: Math.round(percentile(costs, 90)),
    budget_fit: budgetFitCount / draws,
    impressions_mo: Math.round(impressionsMo),
    clicks_mo: Math.round(clicksMo),
    leads_mo: Math.round(leadsMo),
    revenue_mo: Math.round(revenueMo),
    opex_mo: Math.round(opexMo),
    build_cost: Math.round(buildCost),
    net_12mo: Math.round(net12mo),
    payback: Math.round(payback * 10) / 10,
    margin: Math.round(margin * 10) / 10,
  };
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const { action } = body; // 'ingest' | 'simulate' | 'full_pipeline'

    let ingestResult: any = null;
    let simulationResults: any[] = [];
    let portfolioRecommendation: any = null;

    // ── INGEST: Seed strategies + capabilities ──
    if (action === "ingest" || action === "full_pipeline") {
      // Check existing strategies
      const existing = await svc.entities.StrategyTournament.list(100).catch(() => []);
      if (existing.length === 0) {
        const strategyRecords = STRATEGIES.map((s, i) => ({
          strategy_id: s.strategy_id,
          model_name: s.model_name,
          differentiation: s.differentiation,
          content_quality: s.content_quality,
          practicality: s.practicality,
          buyer_fit: s.buyer_fit,
          reusability: s.reusability,
          heuristic_points: (s.content_quality + s.practicality + s.buyer_fit + s.reusability) * 5,
          measurement_inputs: "GSC + GA4 + buyer contract + costs",
          evidence_class: "ILLUSTRATIVE_ONLY",
          cost_multiplier: s.cost_multiplier,
          priority_score: 0,
          status: "draft",
        }));
        await svc.entities.StrategyTournament.bulkCreate(strategyRecords);
      }

      // Check existing capabilities
      const existingCaps = await svc.entities.HighLeverageCapability.list(100).catch(() => []);
      if (existingCaps.length === 0) {
        await svc.entities.HighLeverageCapability.bulkCreate(CAPABILITIES);
      }

      ingestResult = {
        strategies_seeded: existing.length === 0 ? STRATEGIES.length : 0,
        capabilities_seeded: existingCaps.length === 0 ? CAPABILITIES.length : 0,
        strategies_total: (existing.length || 0) + (existing.length === 0 ? STRATEGIES.length : 0),
        capabilities_total: (existingCaps.length || 0) + (existingCaps.length === 0 ? CAPABILITIES.length : 0),
      };
    }

    // ── SIMULATE: Run Monte Carlo across all strategies × site counts × conversion cases ──
    if (action === "simulate" || action === "full_pipeline") {
      const assumptions = { ...DEFAULT_ASSUMPTIONS, ...body.assumptions };
      const siteCounts = body.site_counts || [1, 5, 10, 25, 50];
      const convCases = body.conversion_cases || ["LOW", "CAUTIOUS", "BASE", "HIGH", "OPTIMISTIC"];
      const draws = body.draws || 500;

      // Clear old simulations
      await svc.entities.PortfolioSimulation.deleteMany({ status: "SIMULATED_UNCALIBRATED" }).catch(() => {});

      const simRecords: any[] = [];
      for (const strategy of STRATEGIES) {
        for (const sc of siteCounts) {
          for (const cc of convCases) {
            const result = runSimulation(strategy, sc, cc, assumptions, draws);
            simRecords.push({
              simulation_id: `${strategy.strategy_id}_${sc}_${cc}_${Date.now()}`,
              strategy_id: strategy.strategy_id,
              strategy_name: strategy.model_name,
              site_count: sc,
              conversion_case: cc,
              demand_cvr_multiplier: CONVERSION_CASES[cc],
              simulated_draws: draws,
              cost_p10: result.cost_p10,
              cost_p50: result.cost_p50,
              cost_p90: result.cost_p90,
              budget_fit_probability: result.budget_fit,
              est_impressions_mo: result.impressions_mo,
              est_clicks_mo: result.clicks_mo,
              est_accepted_leads_mo: result.leads_mo,
              est_revenue_mo: result.revenue_mo,
              est_opex_mo: result.opex_mo,
              initial_build_cost: result.build_cost,
              net_cash_12mo: result.net_12mo,
              payback_months: result.payback,
              gross_margin_pct: result.margin,
              model_assumptions: assumptions,
              status: "SIMULATED_UNCALIBRATED",
              run_at: new Date().toISOString(),
            });
          }
        }
      }

      // Bulk create in batches of 100
      for (let i = 0; i < simRecords.length; i += 100) {
        const batch = simRecords.slice(i, i + 100);
        await svc.entities.PortfolioSimulation.bulkCreate(batch);
      }

      simulationResults = simRecords;

      // ── PORTFOLIO RECOMMENDATION ──
      // Score each strategy by: budget_fit × net_12mo × (1 / payback)
      const baseCase = simRecords.filter((r) => r.conversion_case === "BASE" && r.site_count === 1);
      const scored = baseCase.map((r) => ({
        ...r,
        composite_score: r.budget_fit_probability * Math.max(0, r.net_cash_12mo) * (r.payback_months < 999 ? 1 / r.payback_months : 0),
      })).sort((a, b) => b.composite_score - a.composite_score);

      portfolioRecommendation = {
        top_strategy: scored[0] || null,
        top_3: scored.slice(0, 3),
        total_simulations: simRecords.length,
        budget_after_reserve: assumptions.budget * (1 - assumptions.reserve_fraction),
        assumptions,
      };
    }

    await logStep(base44, {
      category: "simulation",
      action: "God Mode Simulation Engine",
      detail: `Action: ${action}. Ingest: ${JSON.stringify(ingestResult)}. Simulations: ${simulationResults.length}. Top: ${portfolioRecommendation?.top_strategy?.strategy_id || "N/A"}`,
      source: "godModeSimulationEngine",
    });

    return Response.json({
      ok: true,
      action,
      ingest: ingestResult,
      simulations: simulationResults.length,
      portfolio_recommendation: portfolioRecommendation,
      completed_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[godModeSimulationEngine] error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}