import React, { useState, useCallback } from "react";
import {
  Radar, Search, Target, Brain, Dices, Loader2, AlertCircle,
  TrendingUp, DollarSign, Zap, Award, ArrowUp, Globe, Shield,
  CheckCircle2, Sparkles, ChevronDown, ChevronRight, ExternalLink,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const ARCHETYPES = [
  'SaaS / software tools',
  'Content / media / creator economy',
  'E-commerce / DTC / physical products',
  'Marketplace / platform / network',
  'AI tools / automation agents',
  'Services / consulting / agency',
  'Community / membership / subscription',
];

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
  const [expanded, setExpanded] = useState(new Set());

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
  const scoreColor = (s) => s >= 80 ? "text-[#22c55e]" : s >= 60 ? "text-[#00a2ff]" : s >= 40 ? "text-[#f59e0b]" : "text-red-400";

  return (
    <div className="min-h-screen bg-[#050508] text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00a2ff] to-[#0066cc] flex items-center justify-center">
            <Radar className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight font-heading">Vision Intelligence</h1>
            <p className="text-sm text-white/50 font-body">Initial intelligence gathering — sweep, discover, strategize, simulate, and deliberate before building</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/5 border border-red-500/20 rounded-xl p-3">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {/* Stage 1: Vision Sweep */}
        <StageCard num={1} icon={Radar} title="Vision Sweep" subtitle="Scan Product Hunt, Reddit, HN, X for live opportunities" accent="#00a2ff" expanded={expanded} toggle={toggle}>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5 block">Number of opportunities</label>
              <select
                value={niche || "20"}
                onChange={(e) => setNiche(e.target.value)}
                className="w-full bg-[#0a1220] border border-white/10 rounded-xl px-4 py-3 text-sm font-semibold focus:border-[#00a2ff] outline-none"
              >
                <option value="10">10 opportunities</option>
                <option value="20">20 opportunities</option>
                <option value="30">30 opportunities</option>
              </select>
            </div>
            <button
              onClick={() => run('sweep', { count: Number(niche) || 20 })}
              disabled={loading === 'sweep'}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#00a2ff] to-[#0066cc] text-white font-bold text-sm flex items-center gap-2 hover:brightness-110 transition disabled:opacity-50 neon-green-hover"
            >
              {loading === 'sweep' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />}
              {loading === 'sweep' ? "Sweeping..." : "Sweep for Opportunities"}
            </button>
          </div>

          {sweepResults?.ok && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-white/40">{sweepResults.count} opportunities found</p>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {sweepResults.opportunities.map((opp, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-[#0a1220] p-4 neon-green-hover">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono text-white/30">#{opp.rank}</span>
                          <span className="text-sm font-bold">{opp.title}</span>
                          <span className={`text-xs font-bold ${scoreColor(opp.score)}`}>{opp.score}/100</span>
                        </div>
                        <p className="text-xs text-white/50 mt-1">{opp.one_liner}</p>
                        <div className="flex items-center gap-3 text-xs text-white/40 mt-2 flex-wrap">
                          <span className="text-[#00a2ff]">{opp.industry}</span>
                          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{fmt(opp.est_monthly_profit_usd)}/mo</span>
                          <span>{opp.time_to_launch_days}d to launch</span>
                          <span className="text-[#22c55e]">{opp.probability_of_success}% success</span>
                        </div>
                        {opp.trend_signal && <p className="text-xs text-white/40 mt-1.5"><b className="text-white/60">Why now:</b> {opp.trend_signal}</p>}
                        {opp.source_urls?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {opp.source_urls.slice(0, 3).map((url, j) => (
                              <a key={j} href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#00a2ff] hover:underline flex items-center gap-1">
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
        <StageCard num={2} icon={Search} title="Deep Discovery Scan" subtitle="Competitive intelligence — top 5 competitors, TAM, positioning, risks" accent="#a855f7" expanded={expanded} toggle={toggle}>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5 block">Niche / Industry</label>
              <input
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g. epoxy flooring, water damage restoration, roofing"
                className="w-full bg-[#0a1220] border border-white/10 rounded-xl px-4 py-3 text-sm font-semibold focus:border-[#a855f7] outline-none"
              />
            </div>
            <button
              onClick={() => niche && run('discover', { niche })}
              disabled={loading === 'discover' || !niche}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#a855f7] to-[#7c3aed] text-white font-bold text-sm flex items-center gap-2 hover:brightness-110 transition disabled:opacity-50 neon-green-hover"
            >
              {loading === 'discover' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading === 'discover' ? "Scanning..." : "Deep Scan"}
            </button>
          </div>

          {discoverResults?.ok && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/10 bg-[#0a1220] p-4">
                  <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Total Addressable Market</p>
                  <p className="text-sm text-white/80">{discoverResults.total_addressable_market}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0a1220] p-4">
                  <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Growth Rate</p>
                  <p className="text-sm text-white/80">{discoverResults.growth_rate}</p>
                </div>
              </div>
              <div className="rounded-xl border border-[#22c55e]/20 bg-[#22c55e]/5 p-4">
                <p className="text-xs font-bold text-[#22c55e] uppercase tracking-wider mb-2">Recommended Positioning</p>
                <p className="text-sm text-white/80">{discoverResults.recommended_positioning}</p>
              </div>
              <div className="rounded-xl border border-[#00a2ff]/20 bg-[#00a2ff]/5 p-4">
                <p className="text-xs font-bold text-[#00a2ff] uppercase tracking-wider mb-2">12-Month Financial Projection</p>
                <p className="text-sm text-white/80">{discoverResults.financial_projection_12mo}</p>
              </div>
              {discoverResults.competitors?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-white/50 uppercase tracking-wider">Top Competitors</p>
                  {discoverResults.competitors.map((c, i) => (
                    <div key={i} className="rounded-xl border border-white/10 bg-[#0a1220] p-4 neon-green-hover">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{c.name}</span>
                          {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-[#00a2ff] hover:underline"><ExternalLink className="w-3 h-3" /></a>}
                        </div>
                        <span className="text-xs text-white/40">{c.market_share_estimate}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 text-xs">
                        <div><span className="text-white/40">Pricing:</span> <span className="text-white/70">{c.pricing}</span></div>
                        <div><span className="text-[#22c55e]">Strength:</span> <span className="text-white/70">{c.strength}</span></div>
                        <div><span className="text-red-400">Weakness:</span> <span className="text-white/70">{c.weakness}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {discoverResults.top_3_risks?.length > 0 && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">Top 3 Risks</p>
                  <ul className="space-y-1">
                    {discoverResults.top_3_risks.map((r, i) => (
                      <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                        <span className="text-red-400 mt-0.5">•</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </StageCard>

        {/* Stage 3: Strategize */}
        <StageCard num={3} icon={Target} title="Strategy Generation" subtitle="10 strategies with financial predictions — varied across risk, capital, speed" accent="#f59e0b" expanded={expanded} toggle={toggle}>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5 block">Your Vision</label>
              <textarea
                value={vision}
                onChange={(e) => setVision(e.target.value)}
                placeholder="e.g. Build an autonomous AI-powered epoxy flooring lead generation system that dominates local search"
                rows={2}
                className="w-full bg-[#0a1220] border border-white/10 rounded-xl px-4 py-3 text-sm font-semibold focus:border-[#f59e0b] outline-none resize-none"
              />
            </div>
            <button
              onClick={() => vision && run('strategize', { vision })}
              disabled={loading === 'strategize' || !vision}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white font-bold text-sm flex items-center gap-2 hover:brightness-110 transition disabled:opacity-50 neon-green-hover"
            >
              {loading === 'strategize' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
              {loading === 'strategize' ? "Generating..." : "Generate Strategies"}
            </button>
          </div>

          {strategies?.ok && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-white/40">{strategies.count} strategies generated</p>
              {strategies.strategies.map((s, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-[#0a1220] p-4 neon-green-hover">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold">{s.name}</span>
                        <span className={`text-xs font-bold ${scoreColor(s.fit_score)}`}>{s.fit_score}/100 fit</span>
                        <span className="text-[10px] text-white/40 px-2 py-0.5 rounded bg-white/5 uppercase">{s.automation_level} auto</span>
                      </div>
                      <p className="text-xs text-white/50 mt-1">{s.angle}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-xs">
                        <div><span className="text-white/40">12mo Rev:</span> <span className="text-[#22c55e] font-bold">{fmt(s.est_12m_revenue_usd)}</span></div>
                        <div><span className="text-white/40">Build Cost:</span> <span className="text-[#f59e0b]">{fmt(s.build_cost_usd)}</span></div>
                        <div><span className="text-white/40">Channel:</span> <span className="text-white/70">{s.channel}</span></div>
                        <div><span className="text-white/40">Monetization:</span> <span className="text-white/70">{s.monetization}</span></div>
                      </div>
                      {s.financial_prediction && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2 text-xs pt-2 border-t border-white/5">
                          <div><span className="text-white/40">Yr1 MRR:</span> <span className="text-white/70">{fmt(s.financial_prediction.monthly_revenue_year1)}</span></div>
                          <div><span className="text-white/40">Yr2 MRR:</span> <span className="text-white/70">{fmt(s.financial_prediction.monthly_revenue_year2)}</span></div>
                          <div><span className="text-white/40">Break-even:</span> <span className="text-white/70">Mo {s.financial_prediction.break_even_month}</span></div>
                          <div><span className="text-white/40">Margin:</span> <span className="text-white/70">{s.financial_prediction.margin_pct}%</span></div>
                          <div><span className="text-white/40">CAC Payback:</span> <span className="text-white/70">{s.financial_prediction.cac_payback_months}mo</span></div>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => run('simulate', { strategy: s })}
                    disabled={loading === 'simulate'}
                    className="mt-3 text-xs px-3 py-1.5 rounded-lg bg-[#22c55e]/10 hover:bg-[#22c55e]/20 text-[#22c55e] font-semibold flex items-center gap-1.5 transition"
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
          <div className="rounded-2xl border border-[#22c55e]/20 bg-[#0a1220] p-6">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><Dices className="w-4 h-4 text-[#22c55e]" /> 3-Scenario Financial Forecast</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {simulations.outcomes.map((outcome, i) => {
                const color = outcome.scenario === 'conservative' ? '#ef4444' : outcome.scenario === 'base' ? '#00a2ff' : '#22c55e';
                const lastMonth = outcome.timeline?.[outcome.timeline.length - 1];
                return (
                  <div key={i} className="rounded-xl border p-4" style={{ borderColor: color + '30', background: color + '08' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold capitalize" style={{ color }}>{outcome.scenario}</span>
                      <span className="text-xs text-white/40">{outcome.probability}% likely</span>
                    </div>
                    <p className="text-xs text-white/50 mb-3">{outcome.summary}</p>
                    {lastMonth && (
                      <div className="text-xs space-y-1">
                        <div><span className="text-white/40">Month 12 Revenue:</span> <span className="font-bold" style={{ color }}>{fmt(lastMonth.revenue)}</span></div>
                        <div><span className="text-white/40">Cumulative Profit:</span> <span className="font-bold" style={{ color }}>{fmt(lastMonth.cumulative)}</span></div>
                      </div>
                    )}
                    {outcome.assumptions?.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/5">
                        <p className="text-[10px] text-white/40 uppercase mb-1">Key Assumptions</p>
                        {outcome.assumptions.map((a, j) => (
                          <p key={j} className="text-[10px] text-white/50">• {a}</p>
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
        <StageCard num={5} icon={Brain} title="Council Deliberation" subtitle="Multi-agent council deliberates and recommends the best path forward" accent="#22c55e" expanded={expanded} toggle={toggle}>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5 block">Vision for the council</label>
              <input
                value={vision}
                onChange={(e) => setVision(e.target.value)}
                placeholder="Your vision statement (uses the one from Stage 3 if empty)"
                className="w-full bg-[#0a1220] border border-white/10 rounded-xl px-4 py-3 text-sm font-semibold focus:border-[#22c55e] outline-none"
              />
            </div>
            <button
              onClick={() => run('council', { vision: vision || 'Build a fully autonomous, AI-powered digital business system' })}
              disabled={loading === 'council'}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white font-bold text-sm flex items-center gap-2 hover:brightness-110 transition disabled:opacity-50 neon-green-hover"
            >
              {loading === 'council' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              {loading === 'council' ? "Deliberating..." : "Convene Council"}
            </button>
          </div>

          {council?.ok && (
            <div className="mt-4 space-y-4">
              {/* Transcript */}
              {council.transcript?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-white/50 uppercase tracking-wider">Council Transcript</p>
                  {council.transcript.map((t, i) => {
                    const kindColor = t.kind === 'challenge' ? 'text-red-400' : t.kind === 'warning' ? 'text-[#f59e0b]' : t.kind === 'support' ? 'text-[#22c55e]' : 'text-[#00a2ff]';
                    return (
                      <div key={i} className="rounded-xl border border-white/10 bg-[#0a1220] p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-white/80">{t.author}</span>
                          <span className={`text-[10px] uppercase ${kindColor}`}>{t.kind}</span>
                        </div>
                        <p className="text-xs text-white/60">{t.content}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Recommendation */}
              {council.recommendation && (
                <div className="rounded-2xl border border-[#22c55e]/30 bg-[#22c55e]/5 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-5 h-5 text-[#22c55e]" />
                    <h3 className="font-bold text-sm text-[#22c55e]">Council Recommendation</h3>
                  </div>
                  <p className="text-sm font-bold text-white mb-2">{council.recommendation.strategy}</p>
                  <p className="text-xs text-white/60 mb-3">{council.recommendation.reason}</p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-[#22c55e] font-bold">{council.recommendation.probability_of_success}% success probability</span>
                  </div>
                  {council.recommendation.key_risks?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-bold text-red-400 uppercase mb-1">Key Risks</p>
                      <ul className="space-y-0.5">
                        {council.recommendation.key_risks.map((r, i) => (
                          <li key={i} className="text-xs text-white/60 flex items-start gap-1"><span className="text-red-400">•</span> {r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {council.recommendation.next_steps?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-bold text-[#00a2ff] uppercase mb-1">Next Steps</p>
                      <ul className="space-y-0.5">
                        {council.recommendation.next_steps.map((s, i) => (
                          <li key={i} className="text-xs text-white/60 flex items-start gap-1"><span className="text-[#00a2ff]">{i + 1}.</span> {s}</li>
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
          <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-6 space-y-3">
            <h3 className="font-bold text-sm">Initial Intelligence Gathering — 5-stage pipeline:</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-white/60">
              <div className="flex items-start gap-2"><Radar className="w-4 h-4 text-[#00a2ff] mt-0.5 shrink-0" /><span><b className="text-white">Vision Sweep</b> — Scans Product Hunt, Reddit, HN, and X for live, ranked business opportunities with financial estimates</span></div>
              <div className="flex items-start gap-2"><Search className="w-4 h-4 text-[#a855f7] mt-0.5 shrink-0" /><span><b className="text-white">Deep Discovery</b> — Competitive intelligence on any niche: top 5 competitors, TAM, growth rate, positioning, risks</span></div>
              <div className="flex items-start gap-2"><Target className="w-4 h-4 text-[#f59e0b] mt-0.5 shrink-0" /><span><b className="text-white">Strategy Generation</b> — 10 strategies with full financial predictions: 12-month revenue, build cost, break-even, margin, CAC payback</span></div>
              <div className="flex items-start gap-2"><Dices className="w-4 h-4 text-[#22c55e] mt-0.5 shrink-0" /><span><b className="text-white">Outcome Simulation</b> — 3-scenario forecast (conservative/base/aggressive) with 12-month monthly timelines</span></div>
              <div className="flex items-start gap-2"><Brain className="w-4 h-4 text-[#22c55e] mt-0.5 shrink-0" /><span><b className="text-white">Council Deliberation</b> — Multi-agent council (Vision, Strategy, Quant, Sage, Primus) deliberates and recommends the best path</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StageCard({ num, icon: Icon, title, subtitle, accent, expanded, toggle, children }) {
  const isExpanded = expanded.has(`stage-${num}`);
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-6">
      <button onClick={() => toggle(`stage-${num}`)} className="flex items-center gap-3 w-full text-left">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: accent + '20', border: `1px solid ${accent}40` }}>
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <span className="text-xs font-mono text-white/30">Stage {num}</span>
            {title}
          </h2>
          <p className="text-xs text-white/40">{subtitle}</p>
        </div>
        {isExpanded ? <ChevronDown className="w-4 h-4 text-white/40" /> : <ChevronRight className="w-4 h-4 text-white/40" />}
      </button>
      {isExpanded && <div className="mt-4">{children}</div>}
    </div>
  );
}