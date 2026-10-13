import React, { useState, useCallback } from "react";
import {
  Radar, Search, Target, Brain, Dices, Loader2, AlertCircle,
  TrendingUp, DollarSign, Zap, Award, ArrowUp, Globe, Shield,
  CheckCircle2, Sparkles, ChevronDown, ChevronRight, ExternalLink,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import AdminSystemPage from "@/components/launch-engine-admin/AdminSystemPage";

export default function VisionIntelligence() {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);
  const [vision, setVision] = useState("");
  const [niche, setNiche] = useState("");
  const [sweepResults, setSweepResults] = useState(null);
  const [discoverResults, setDiscoverResults] = useState(null);
  const [strategies, setStrategies] = useState(null);
  const [simulations, setSimulations] = useState(null);
  const [council, setCouncil] = useState(null);
  const [expanded, setExpanded] = useState(new Set(["stage-1"]));

  const toggle = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const run = useCallback(async (action, payload = {}) => {
    setLoading(action);
    setError(null);
    try {
      const res = await base44.functions.invoke("visionIntelligenceEngine", { action, ...payload });
      const data = res.data;
      if (action === 'sweep') setSweepResults(data);
      if (action === 'discover') setDiscoverResults(data);
      if (action === 'strategize') setStrategies(data);
      if (action === 'simulate') setSimulations(data);
      if (action === 'council') setCouncil(data);
    } catch (e) {
      setError(e.message || `${action} failed`);
    } finally {
      setLoading(null);
    }
  }, []);

  const fmt = (n) => "$" + (n || 0).toLocaleString();
  const scoreColor = (s) => s >= 80 ? "text-[#16a34a]" : s >= 60 ? "text-[#126fc8]" : s >= 40 ? "text-[#d97706]" : "text-red-600";

  return (
    <AdminSystemPage
      eyebrow="INTELLIGENCE GATHERING · V1"
      title="Vision Intelligence"
      description="Initial intelligence gathering — sweep, discover, strategize, simulate, and deliberate before building."
      badge="◈ ACTIVE SYSTEM"
      stats={[
        ["Pipeline stages", "5 stages"],
        ["Data sources", "Product Hunt · Reddit · HN · X"],
        ["Council agents", "5 deliberators"],
        ["Output", "Ranked opportunities + strategies"],
      ]}
    >
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Stage 1: Vision Sweep */}
      <StageCard num={1} icon={Radar} title="Vision Sweep" subtitle="Scan Product Hunt, Reddit, HN, X for live opportunities" accent="#126fc8" expanded={expanded} toggle={toggle}>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-bold text-[#5b7288] uppercase tracking-wider mb-1.5 block">Number of opportunities</label>
            <select
              value={niche || "20"}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full bg-white border border-[#dce6f1] rounded-lg px-4 py-3 text-sm font-semibold text-[#112940] focus:border-[#126fc8] outline-none"
            >
              <option value="10">10 opportunities</option>
              <option value="20">20 opportunities</option>
              <option value="30">30 opportunities</option>
            </select>
          </div>
          <button
            onClick={() => run('sweep', { count: Number(niche) || 20 })}
            disabled={loading === 'sweep'}
            className="wle-action"
          >
            {loading === 'sweep' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />}
            {loading === 'sweep' ? "Sweeping..." : "Sweep for Opportunities"}
          </button>
        </div>

        {sweepResults?.ok && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-[#5b7288]">{sweepResults.count} opportunities found</p>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {sweepResults.opportunities.map((opp, i) => (
                <div key={i} className="rounded-lg border border-[#e4edf5] bg-[#f8fbfe] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-[#8faec9]">#{opp.rank}</span>
                        <span className="text-sm font-bold text-[#112940]">{opp.title}</span>
                        <span className={`text-xs font-bold ${scoreColor(opp.score)}`}>{opp.score}/100</span>
                      </div>
                      <p className="text-xs text-[#5b7288] mt-1">{opp.one_liner}</p>
                      <div className="flex items-center gap-3 text-xs text-[#607790] mt-2 flex-wrap">
                        <span className="text-[#126fc8] font-semibold">{opp.industry}</span>
                        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{fmt(opp.est_monthly_profit_usd)}/mo</span>
                        <span>{opp.time_to_launch_days}d to launch</span>
                        <span className="text-[#16a34a] font-semibold">{opp.probability_of_success}% success</span>
                      </div>
                      {opp.trend_signal && <p className="text-xs text-[#607790] mt-1.5"><b className="text-[#112940]">Why now:</b> {opp.trend_signal}</p>}
                      {opp.source_urls?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {opp.source_urls.slice(0, 3).map((url, j) => (
                            <a key={j} href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#126fc8] hover:underline flex items-center gap-1">
                              <ExternalLink className="w-2.5 h-2.5" />{url.replace(/^https?:\/\//, '').slice(0, 40)}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </StageCard>

      {/* Stage 2: Deep Discovery */}
      <StageCard num={2} icon={Search} title="Deep Discovery Scan" subtitle="Competitive intelligence — top 5 competitors, TAM, positioning, risks" accent="#7c3aed" expanded={expanded} toggle={toggle}>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-bold text-[#5b7288] uppercase tracking-wider mb-1.5 block">Niche / Industry</label>
            <input
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="e.g. epoxy flooring, water damage restoration, roofing"
              className="w-full bg-white border border-[#dce6f1] rounded-lg px-4 py-3 text-sm font-semibold text-[#112940] focus:border-[#7c3aed] outline-none"
            />
          </div>
          <button
            onClick={() => niche && run('discover', { niche })}
            disabled={loading === 'discover' || !niche}
            className="wle-action"
            style={{ background: "#7c3aed" }}
          >
            {loading === 'discover' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading === 'discover' ? "Scanning..." : "Deep Scan"}
          </button>
        </div>

        {discoverResults?.ok && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-[#e4edf5] bg-white p-4">
                <p className="text-xs font-bold text-[#5b7288] uppercase tracking-wider mb-2">Total Addressable Market</p>
                <p className="text-sm text-[#112940]">{discoverResults.total_addressable_market}</p>
              </div>
              <div className="rounded-lg border border-[#e4edf5] bg-white p-4">
                <p className="text-xs font-bold text-[#5b7288] uppercase tracking-wider mb-2">Growth Rate</p>
                <p className="text-sm text-[#112940]">{discoverResults.growth_rate}</p>
              </div>
            </div>
            <div className="rounded-lg border border-[#16a34a]/30 bg-[#16a34a]/5 p-4">
              <p className="text-xs font-bold text-[#16a34a] uppercase tracking-wider mb-2">Recommended Positioning</p>
              <p className="text-sm text-[#112940]">{discoverResults.recommended_positioning}</p>
            </div>
            <div className="rounded-lg border border-[#126fc8]/30 bg-[#126fc8]/5 p-4">
              <p className="text-xs font-bold text-[#126fc8] uppercase tracking-wider mb-2">12-Month Financial Projection</p>
              <p className="text-sm text-[#112940]">{discoverResults.financial_projection_12mo}</p>
            </div>
            {discoverResults.competitors?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-[#5b7288] uppercase tracking-wider">Top Competitors</p>
                {discoverResults.competitors.map((c, i) => (
                  <div key={i} className="rounded-lg border border-[#e4edf5] bg-white p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#112940]">{c.name}</span>
                        {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-[#126fc8] hover:underline"><ExternalLink className="w-3 h-3" /></a>}
                      </div>
                      <span className="text-xs text-[#607790]">{c.market_share_estimate}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 text-xs">
                      <div><span className="text-[#607790]">Pricing:</span> <span className="text-[#112940]">{c.pricing}</span></div>
                      <div><span className="text-[#16a34a]">Strength:</span> <span className="text-[#112940]">{c.strength}</span></div>
                      <div><span className="text-red-500">Weakness:</span> <span className="text-[#112940]">{c.weakness}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {discoverResults.top_3_risks?.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">Top 3 Risks</p>
                <ul className="space-y-1">
                  {discoverResults.top_3_risks.map((r, i) => (
                    <li key={i} className="text-sm text-[#112940] flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">•</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </StageCard>

      {/* Stage 3: Strategize */}
      <StageCard num={3} icon={Target} title="Strategy Generation" subtitle="10 strategies with financial predictions — varied across risk, capital, speed" accent="#d97706" expanded={expanded} toggle={toggle}>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-bold text-[#5b7288] uppercase tracking-wider mb-1.5 block">Your Vision</label>
            <textarea
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              placeholder="e.g. Build an autonomous AI-powered epoxy flooring lead generation system that dominates local search"
              rows={2}
              className="w-full bg-white border border-[#dce6f1] rounded-lg px-4 py-3 text-sm font-semibold text-[#112940] focus:border-[#d97706] outline-none resize-none"
            />
          </div>
          <button
            onClick={() => vision && run('strategize', { vision })}
            disabled={loading === 'strategize' || !vision}
            className="wle-action"
            style={{ background: "#d97706" }}
          >
            {loading === 'strategize' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
            {loading === 'strategize' ? "Generating..." : "Generate Strategies"}
          </button>
        </div>

        {strategies?.ok && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-[#5b7288]">{strategies.count} strategies generated</p>
            {strategies.strategies.map((s, i) => (
              <div key={i} className="rounded-lg border border-[#e4edf5] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[#112940]">{s.name}</span>
                      <span className={`text-xs font-bold ${scoreColor(s.fit_score)}`}>{s.fit_score}/100 fit</span>
                      <span className="text-[10px] text-[#607790] px-2 py-0.5 rounded bg-[#f4f8fd] uppercase">{s.automation_level} auto</span>
                    </div>
                    <p className="text-xs text-[#5b7288] mt-1">{s.angle}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-xs">
                      <div><span className="text-[#607790]">12mo Rev:</span> <span className="text-[#16a34a] font-bold">{fmt(s.est_12m_revenue_usd)}</span></div>
                      <div><span className="text-[#607790]">Build Cost:</span> <span className="text-[#d97706]">{fmt(s.build_cost_usd)}</span></div>
                      <div><span className="text-[#607790]">Channel:</span> <span className="text-[#112940]">{s.channel}</span></div>
                      <div><span className="text-[#607790]">Monetization:</span> <span className="text-[#112940]">{s.monetization}</span></div>
                    </div>
                    {s.financial_prediction && (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2 text-xs pt-2 border-t border-[#e4edf5]">
                        <div><span className="text-[#607790]">Yr1 MRR:</span> <span className="text-[#112940]">{fmt(s.financial_prediction.monthly_revenue_year1)}</span></div>
                        <div><span className="text-[#607790]">Yr2 MRR:</span> <span className="text-[#112940]">{fmt(s.financial_prediction.monthly_revenue_year2)}</span></div>
                        <div><span className="text-[#607790]">Break-even:</span> <span className="text-[#112940]">Mo {s.financial_prediction.break_even_month}</span></div>
                        <div><span className="text-[#607790]">Margin:</span> <span className="text-[#112940]">{s.financial_prediction.margin_pct}%</span></div>
                        <div><span className="text-[#607790]">CAC Payback:</span> <span className="text-[#112940]">{s.financial_prediction.cac_payback_months}mo</span></div>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => run('simulate', { strategy: s })}
                  disabled={loading === 'simulate'}
                  className="mt-3 text-xs px-3 py-1.5 rounded-lg bg-[#16a34a]/10 hover:bg-[#16a34a]/20 text-[#16a34a] font-semibold flex items-center gap-1.5 transition"
                >
                  {loading === 'simulate' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Dices className="w-3 h-3" />}
                  Simulate Outcomes
                </button>
              </div>
            ))}
          </div>
        )}
      </StageCard>

      {/* Stage 4: Simulation */}
      {simulations?.ok && (
        <div className="rounded-lg border border-[#16a34a]/30 bg-[#16a34a]/5 p-6">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-[#112940]"><Dices className="w-4 h-4 text-[#16a34a]" /> 3-Scenario Financial Forecast</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {simulations.outcomes.map((outcome, i) => {
              const color = outcome.scenario === 'conservative' ? '#dc2626' : outcome.scenario === 'base' ? '#126fc8' : '#16a34a';
              const lastMonth = outcome.timeline?.[outcome.timeline.length - 1];
              return (
                <div key={i} className="rounded-lg border p-4 bg-white" style={{ borderColor: color + '40' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold capitalize" style={{ color }}>{outcome.scenario}</span>
                    <span className="text-xs text-[#607790]">{outcome.probability}% likely</span>
                  </div>
                  <p className="text-xs text-[#5b7288] mb-3">{outcome.summary}</p>
                  {lastMonth && (
                    <div className="text-xs space-y-1">
                      <div><span className="text-[#607790]">Month 12 Revenue:</span> <span className="font-bold" style={{ color }}>{fmt(lastMonth.revenue)}</span></div>
                      <div><span className="text-[#607790]">Cumulative Profit:</span> <span className="font-bold" style={{ color }}>{fmt(lastMonth.cumulative)}</span></div>
                    </div>
                  )}
                  {outcome.assumptions?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-[#e4edf5]">
                      <p className="text-[10px] text-[#607790] uppercase mb-1">Key Assumptions</p>
                      {outcome.assumptions.map((a, j) => (
                        <p key={j} className="text-[10px] text-[#5b7288]">• {a}</p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stage 5: Council Deliberation */}
      <StageCard num={5} icon={Brain} title="Council Deliberation" subtitle="Multi-agent council deliberates and recommends the best path forward" accent="#16a34a" expanded={expanded} toggle={toggle}>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-bold text-[#5b7288] uppercase tracking-wider mb-1.5 block">Vision for the council</label>
            <input
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              placeholder="Your vision statement (uses the one from Stage 3 if empty)"
              className="w-full bg-white border border-[#dce6f1] rounded-lg px-4 py-3 text-sm font-semibold text-[#112940] focus:border-[#16a34a] outline-none"
            />
          </div>
          <button
            onClick={() => run('council', { vision: vision || 'Build a fully autonomous, AI-powered digital business system' })}
            disabled={loading === 'council'}
            className="wle-action"
            style={{ background: "#16a34a" }}
          >
            {loading === 'council' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            {loading === 'council' ? "Deliberating..." : "Convene Council"}
          </button>
        </div>

        {council?.ok && (
          <div className="mt-4 space-y-4">
            {council.transcript?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-[#5b7288] uppercase tracking-wider">Council Transcript</p>
                {council.transcript.filter(t => t.author && t.content).map((t, i) => {
                  const kindColor = t.kind === 'challenge' ? 'text-red-500' : t.kind === 'warning' ? 'text-[#d97706]' : t.kind === 'support' ? 'text-[#16a34a]' : 'text-[#126fc8]';
                  return (
                    <div key={i} className="rounded-lg border border-[#e4edf5] bg-white p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-[#112940]">{t.author}</span>
                        <span className={`text-[10px] uppercase ${kindColor}`}>{t.kind}</span>
                      </div>
                      <p className="text-xs text-[#5b7288]">{t.content}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {council.recommendation && (
              <div className="rounded-lg border border-[#16a34a]/40 bg-[#16a34a]/5 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-5 h-5 text-[#16a34a]" />
                  <h3 className="font-bold text-sm text-[#16a34a]">Council Recommendation</h3>
                </div>
                <p className="text-sm font-bold text-[#112940] mb-2">{council.recommendation.strategy}</p>
                <p className="text-xs text-[#5b7288] mb-3">{council.recommendation.reason}</p>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-[#16a34a] font-bold">{council.recommendation.probability_of_success}% success probability</span>
                </div>
                {council.recommendation.key_risks?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-bold text-red-500 uppercase mb-1">Key Risks</p>
                    <ul className="space-y-0.5">
                      {council.recommendation.key_risks.map((r, i) => (
                        <li key={i} className="text-xs text-[#5b7288] flex items-start gap-1"><span className="text-red-500">•</span> {r}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {council.recommendation.next_steps?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-bold text-[#126fc8] uppercase mb-1">Next Steps</p>
                    <ul className="space-y-0.5">
                      {council.recommendation.next_steps.map((s, i) => (
                        <li key={i} className="text-xs text-[#5b7288] flex items-start gap-1"><span className="text-[#126fc8]">{i + 1}.</span> {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </StageCard>

      {/* Info */}
      {!sweepResults && !discoverResults && !strategies && !council && !loading && (
        <div className="mt-4">
          <h3 className="font-bold text-sm text-[#112940] mb-3">Initial Intelligence Gathering — 5-stage pipeline:</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-[#5b7288]">
            <div className="flex items-start gap-2"><Radar className="w-4 h-4 text-[#126fc8] mt-0.5 shrink-0" /><span><b className="text-[#112940]">Vision Sweep</b> — Scans Product Hunt, Reddit, HN, and X for live, ranked business opportunities with financial estimates</span></div>
            <div className="flex items-start gap-2"><Search className="w-4 h-4 text-[#7c3aed] mt-0.5 shrink-0" /><span><b className="text-[#112940]">Deep Discovery</b> — Competitive intelligence on any niche: top 5 competitors, TAM, growth rate, positioning, risks</span></div>
            <div className="flex items-start gap-2"><Target className="w-4 h-4 text-[#d97706] mt-0.5 shrink-0" /><span><b className="text-[#112940]">Strategy Generation</b> — 10 strategies with full financial predictions: 12-month revenue, build cost, break-even, margin, CAC payback</span></div>
            <div className="flex items-start gap-2"><Dices className="w-4 h-4 text-[#16a34a] mt-0.5 shrink-0" /><span><b className="text-[#112940]">Outcome Simulation</b> — 3-scenario forecast (conservative/base/aggressive) with 12-month monthly timelines</span></div>
            <div className="flex items-start gap-2"><Brain className="w-4 h-4 text-[#16a34a] mt-0.5 shrink-0" /><span><b className="text-[#112940]">Council Deliberation</b> — Multi-agent council (Vision, Strategy, Quant, Sage, Primus) deliberates and recommends the best path</span></div>
          </div>
        </div>
      )}
    </AdminSystemPage>
  );
}

function StageCard({ num, icon: Icon, title, subtitle, accent, expanded, toggle, children }) {
  const isExpanded = expanded.has(`stage-${num}`);
  return (
    <div className="rounded-lg border border-[#dce6f1] bg-white p-5 mb-4">
      <button onClick={() => toggle(`stage-${num}`)} className="flex items-center gap-3 w-full text-left">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: accent + '15', border: `1px solid ${accent}40` }}>
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold flex items-center gap-2 text-[#112940]">
            <span className="text-xs font-mono text-[#8faec9]">Stage {num}</span>
            {title}
          </h2>
          <p className="text-xs text-[#5b7288]">{subtitle}</p>
        </div>
        {isExpanded ? <ChevronDown className="w-4 h-4 text-[#8faec9]" /> : <ChevronRight className="w-4 h-4 text-[#8faec9]" />}
      </button>
      {isExpanded && <div className="mt-4">{children}</div>}
    </div>
  );
}