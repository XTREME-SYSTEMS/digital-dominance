import React, { useState, useCallback } from "react";
import { Activity, Zap, Loader2, AlertCircle, TrendingUp, Target, Award, Layers, Cpu, CheckCircle2, BarChart3 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function GodModeSimulationLab() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [assumptions, setAssumptions] = useState({
    budget: 1200,
    reserve_fraction: 0.2,
    base_build_cost: 75,
    monthly_impressions_per_site: 1000,
    organic_ctr: 0.04,
    lead_conversion: 0.04,
    lead_acceptance: 0.65,
    avg_lead_value: 85,
    monthly_opex_per_site: 15,
  });
  const [siteCounts] = useState([1, 5, 10, 25, 50]);
  const [draws, setDraws] = useState(500);

  const { data: strategies = [] } = useQuery({
    queryKey: ["strategy-tournament"],
    queryFn: () => base44.entities.StrategyTournament.list("priority_score", 20),
  });

  const { data: capabilities = [] } = useQuery({
    queryKey: ["high-leverage-capabilities"],
    queryFn: () => base44.entities.HighLeverageCapability.list("capability_id", 100),
  });

  const { data: simulations = [] } = useQuery({
    queryKey: ["portfolio-simulations"],
    queryFn: () => base44.entities.PortfolioSimulation.filter({ conversion_case: "BASE" }, { sort: "-net_cash_12mo", limit: 50 }),
  });

  const runEngine = useCallback(async (action) => {
    setLoading(action);
    setError(null);
    try {
      const res = await base44.functions.invoke("godModeSimulationEngine", {
        action,
        assumptions,
        site_counts: siteCounts,
        conversion_cases: ["LOW", "CAUTIOUS", "BASE", "HIGH", "OPTIMISTIC"],
        draws,
      });
      setResult(res.data);
      queryClient.invalidateQueries({ queryKey: ["strategy-tournament"] });
      queryClient.invalidateQueries({ queryKey: ["high-leverage-capabilities"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio-simulations"] });
    } catch (e) {
      setError(e.message || "Engine failed");
    } finally {
      setLoading(null);
    }
  }, [assumptions, siteCounts, draws, queryClient]);

  const budgetAfterReserve = Math.round(assumptions.budget * (1 - assumptions.reserve_fraction));

  return (
    <div className="min-h-screen bg-[#050508] text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00a2ff] to-[#0066cc] flex items-center justify-center">
            <Cpu className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">God Mode Simulation Lab</h1>
            <p className="text-sm text-white/50">Ingest workbook intelligence, run Monte Carlo simulations, generate portfolio recommendations</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button onClick={() => runEngine("ingest")} disabled={!!loading}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#a855f7] to-[#7c3aed] text-white font-bold text-sm flex items-center gap-2 hover:brightness-110 transition disabled:opacity-50">
            {loading === "ingest" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
            1. Ingest Workbook Data
          </button>
          <button onClick={() => runEngine("simulate")} disabled={!!loading}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#00a2ff] to-[#0066cc] text-white font-bold text-sm flex items-center gap-2 hover:brightness-110 transition disabled:opacity-50">
            {loading === "simulate" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
            2. Run Simulations
          </button>
          <button onClick={() => runEngine("full_pipeline")} disabled={!!loading}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white font-bold text-sm flex items-center gap-2 hover:brightness-110 transition disabled:opacity-50">
            {loading === "full_pipeline" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            3. Full Pipeline (Ingest + Simulate)
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/5 border border-red-500/20 rounded-xl p-3">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {/* Ingestion Status */}
        {result?.ingest && (
          <div className="rounded-2xl border border-[#a855f7]/20 bg-[#a855f7]/5 p-6">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Layers className="w-4 h-4 text-[#a855f7]" /> Ingestion Complete</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-3xl font-extrabold text-[#a855f7]">{result.ingest.strategies_total}</p>
                <p className="text-xs text-white/50">Strategies Loaded</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-extrabold text-[#a855f7]">{result.ingest.capabilities_total}</p>
                <p className="text-xs text-white/50">Capabilities Loaded</p>
              </div>
            </div>
          </div>
        )}

        {/* Portfolio Recommendation */}
        {result?.portfolio_recommendation?.top_strategy && (
          <div className="rounded-2xl border border-[#22c55e]/30 bg-gradient-to-br from-[#22c55e]/10 to-transparent p-6">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-[#22c55e]" />
              <h3 className="font-bold text-sm">Top Recommended Strategy</h3>
            </div>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-lg font-extrabold text-[#22c55e]">{result.portfolio_recommendation.top_strategy.strategy_name}</p>
                <p className="text-xs text-white/50 font-mono mt-1">{result.portfolio_recommendation.top_strategy.strategy_id} · {result.portfolio_recommendation.top_strategy.site_count} site(s) · {result.portfolio_recommendation.top_strategy.conversion_case}</p>
              </div>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div><p className="text-xl font-extrabold text-[#00a2ff]">${result.portfolio_recommendation.top_strategy.cost_p50}</p><p className="text-[10px] text-white/40">Cost P50</p></div>
                <div><p className="text-xl font-extrabold text-[#22c55e]">${result.portfolio_recommendation.top_strategy.net_cash_12mo?.toLocaleString()}</p><p className="text-[10px] text-white/40">Net 12mo</p></div>
                <div><p className="text-xl font-extrabold text-[#f59e0b]">{result.portfolio_recommendation.top_strategy.payback_months}mo</p><p className="text-[10px] text-white/40">Payback</p></div>
                <div><p className="text-xl font-extrabold text-[#a855f7]">{(result.portfolio_recommendation.top_strategy.budget_fit_probability * 100).toFixed(0)}%</p><p className="text-[10px] text-white/40">Budget Fit</p></div>
              </div>
            </div>
            {result.portfolio_recommendation.top_3?.length > 1 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs font-bold text-white/50 uppercase mb-2">Runner-up Strategies</p>
                <div className="space-y-1">
                  {result.portfolio_recommendation.top_3.slice(1).map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-white/70">{s.strategy_name}</span>
                      <span className="font-mono text-white/40">Net: ${s.net_cash_12mo?.toLocaleString()} · Payback: {s.payback_months}mo</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Assumptions Editor */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-2"><Target className="w-4 h-4 text-[#00a2ff]" /> Model Assumptions (editable)</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <AssumptionInput label="Budget ($)" value={assumptions.budget} onChange={(v) => setAssumptions({ ...assumptions, budget: v })} />
            <AssumptionInput label="Reserve %" value={assumptions.reserve_fraction} step={0.05} onChange={(v) => setAssumptions({ ...assumptions, reserve_fraction: v })} />
            <AssumptionInput label="Build Cost/Site ($)" value={assumptions.base_build_cost} onChange={(v) => setAssumptions({ ...assumptions, base_build_cost: v })} />
            <AssumptionInput label="Impressions/Site/mo" value={assumptions.monthly_impressions_per_site} onChange={(v) => setAssumptions({ ...assumptions, monthly_impressions_per_site: v })} />
            <AssumptionInput label="Organic CTR" value={assumptions.organic_ctr} step={0.01} onChange={(v) => setAssumptions({ ...assumptions, organic_ctr: v })} />
            <AssumptionInput label="Lead Conversion" value={assumptions.lead_conversion} step={0.01} onChange={(v) => setAssumptions({ ...assumptions, lead_conversion: v })} />
            <AssumptionInput label="Lead Acceptance" value={assumptions.lead_acceptance} step={0.05} onChange={(v) => setAssumptions({ ...assumptions, lead_acceptance: v })} />
            <AssumptionInput label="Avg Lead Value ($)" value={assumptions.avg_lead_value} onChange={(v) => setAssumptions({ ...assumptions, avg_lead_value: v })} />
            <AssumptionInput label="Opex/Site/mo ($)" value={assumptions.monthly_opex_per_site} onChange={(v) => setAssumptions({ ...assumptions, monthly_opex_per_site: v })} />
            <AssumptionInput label="Monte Carlo Draws" value={draws} onChange={(v) => setDraws(v)} />
          </div>
          <div className="text-xs text-white/40">
            Budget after reserve: <b className="text-[#00a2ff]">${budgetAfterReserve}</b> · Simulating {siteCounts.length * 5 * 10} scenarios per run
          </div>
        </div>

        {/* Strategy Tournament */}
        {strategies.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#00a2ff]" /> Strategy Tournament ({strategies.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-white/40 border-b border-white/10">
                    <th className="text-left py-2 px-2">ID</th>
                    <th className="text-left py-2 px-2">Model</th>
                    <th className="text-center py-2 px-2">Content</th>
                    <th className="text-center py-2 px-2">Practical</th>
                    <th className="text-center py-2 px-2">Buyer Fit</th>
                    <th className="text-center py-2 px-2">Reuse</th>
                    <th className="text-center py-2 px-2">Cost Mult</th>
                    <th className="text-center py-2 px-2">Heuristic</th>
                  </tr>
                </thead>
                <tbody>
                  {strategies.map((s) => (
                    <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-2 px-2 font-mono text-[#00a2ff]">{s.strategy_id}</td>
                      <td className="py-2 px-2 font-semibold">{s.model_name}</td>
                      <td className="py-2 px-2 text-center text-[#22c55e]">{s.content_quality}/5</td>
                      <td className="py-2 px-2 text-center text-[#22c55e]">{s.practicality}/5</td>
                      <td className="py-2 px-2 text-center text-[#22c55e]">{s.buyer_fit}/5</td>
                      <td className="py-2 px-2 text-center text-[#22c55e]">{s.reusability}/5</td>
                      <td className="py-2 px-2 text-center font-mono text-[#f59e0b]">{s.cost_multiplier?.toFixed(2)}x</td>
                      <td className="py-2 px-2 text-center font-extrabold text-[#a855f7]">{s.heuristic_points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Simulation Results */}
        {simulations.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#22c55e]" /> Simulation Results (BASE case, sorted by net 12mo)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-white/40 border-b border-white/10">
                    <th className="text-left py-2 px-2">Strategy</th>
                    <th className="text-center py-2 px-2">Sites</th>
                    <th className="text-center py-2 px-2">Cost P50</th>
                    <th className="text-center py-2 px-2">Revenue/mo</th>
                    <th className="text-center py-2 px-2">Net 12mo</th>
                    <th className="text-center py-2 px-2">Payback</th>
                    <th className="text-center py-2 px-2">Margin</th>
                    <th className="text-center py-2 px-2">Budget Fit</th>
                  </tr>
                </thead>
                <tbody>
                  {simulations.slice(0, 20).map((s) => (
                    <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-2 px-2 font-semibold truncate max-w-[200px]">{s.strategy_name}</td>
                      <td className="py-2 px-2 text-center">{s.site_count}</td>
                      <td className="py-2 px-2 text-center font-mono text-[#f59e0b]">${s.cost_p50}</td>
                      <td className="py-2 px-2 text-center font-mono text-[#00a2ff]">${s.est_revenue_mo}</td>
                      <td className={"py-2 px-2 text-center font-mono font-bold " + (s.net_cash_12mo > 0 ? "text-[#22c55e]" : "text-red-400")}>${s.net_cash_12mo?.toLocaleString()}</td>
                      <td className="py-2 px-2 text-center font-mono">{s.payback_months > 100 ? "—" : s.payback_months + "mo"}</td>
                      <td className="py-2 px-2 text-center font-mono">{s.gross_margin_pct}%</td>
                      <td className="py-2 px-2 text-center">
                        <span className={"px-2 py-0.5 rounded font-semibold " + ((s.budget_fit_probability * 100) > 80 ? "bg-green-500/10 text-green-400" : (s.budget_fit_probability * 100) > 50 ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400")}>
                          {(s.budget_fit_probability * 100).toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Capabilities */}
        {capabilities.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#a855f7]" /> High-Leverage Capabilities ({capabilities.length})</h3>
            <div className="grid md:grid-cols-2 gap-2">
              {capabilities.map((c) => (
                <div key={c.id} className="rounded-lg border border-white/5 bg-white/[0.02] p-3 flex items-start gap-3">
                  <span className={"text-[10px] font-bold px-2 py-0.5 rounded shrink-0 " + (c.priority === "Critical" ? "bg-red-500/10 text-red-400" : c.priority === "High" ? "bg-amber-500/10 text-amber-400" : "bg-white/5 text-white/40")}>{c.priority}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">{c.capability_name}</p>
                    <p className="text-[10px] text-white/40 mt-0.5">{c.domain}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        {!result && !loading && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-3">
            <h3 className="font-bold text-sm">How it works — 3 steps:</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-white/60">
              <div className="flex items-start gap-2"><Layers className="w-4 h-4 text-[#a855f7] mt-0.5 shrink-0" /><span><b className="text-white">Ingest</b> — Seeds 10 strategies and 30 high-leverage capabilities from the workbook intelligence suite</span></div>
              <div className="flex items-start gap-2"><Activity className="w-4 h-4 text-[#00a2ff] mt-0.5 shrink-0" /><span><b className="text-white">Simulate</b> — Runs 500-draw Monte Carlo per strategy × site count × conversion case (250 scenarios total)</span></div>
              <div className="flex items-start gap-2"><Award className="w-4 h-4 text-[#22c55e] mt-0.5 shrink-0" /><span><b className="text-white">Recommend</b> — Scores and ranks strategies by budget fit, net cash, and payback speed</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AssumptionInput({ label, value, onChange, step }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1 block">{label}</label>
      <input
        type="number"
        value={value}
        step={step || 1}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full h-9 px-2 rounded-lg bg-[#0a1220] border border-white/10 text-sm font-mono focus:border-[#00a2ff] outline-none"
      />
    </div>
  );
}