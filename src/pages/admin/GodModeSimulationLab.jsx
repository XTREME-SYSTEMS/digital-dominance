import React, { useState, useCallback } from "react";
import { Activity, Zap, Loader2, AlertCircle, TrendingUp, Target, Award, Layers, Cpu, CheckCircle2, BarChart3 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminSystemPage from "@/components/launch-engine-admin/AdminSystemPage";

export default function GodModeSimulationLab() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [assumptions, setAssumptions] = useState({
    budget: 1200, reserve_fraction: 0.2, base_build_cost: 75,
    monthly_impressions_per_site: 1000, organic_ctr: 0.04,
    lead_conversion: 0.04, lead_acceptance: 0.65, avg_lead_value: 85,
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
        action, assumptions, site_counts: siteCounts,
        conversion_cases: ["LOW", "CAUTIOUS", "BASE", "HIGH", "OPTIMISTIC"], draws,
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
    <AdminSystemPage
      eyebrow="MONTE CARLO · V1"
      title="God Mode Simulation Lab"
      description="Ingest workbook intelligence, run Monte Carlo simulations, generate portfolio recommendations."
      badge="◈ ACTIVE SYSTEM"
      stats={[
        ["Strategies", String(strategies.length)],
        ["Capabilities", String(capabilities.length)],
        ["Simulations run", String(simulations.length)],
        ["Monte Carlo draws", String(draws)],
      ]}
    >
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-4">
        <button onClick={() => runEngine("ingest")} disabled={!!loading} className="wle-action" style={{ background: "#7c3aed" }}>
          {loading === "ingest" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
          1. Ingest Workbook Data
        </button>
        <button onClick={() => runEngine("simulate")} disabled={!!loading} className="wle-action">
          {loading === "simulate" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
          2. Run Simulations
        </button>
        <button onClick={() => runEngine("full_pipeline")} disabled={!!loading} className="wle-action" style={{ background: "#16a34a" }}>
          {loading === "full_pipeline" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          3. Full Pipeline (Ingest + Simulate)
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Ingestion Status */}
      {result?.ingest && (
        <div className="rounded-lg border border-[#7c3aed]/30 bg-[#7c3aed]/5 p-5 mb-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-[#112940]"><Layers className="w-4 h-4 text-[#7c3aed]" /> Ingestion Complete</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-3xl font-extrabold text-[#7c3aed]">{result.ingest.strategies_total}</p>
              <p className="text-xs text-[#5b7288]">Strategies Loaded</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-extrabold text-[#7c3aed]">{result.ingest.capabilities_total}</p>
              <p className="text-xs text-[#5b7288]">Capabilities Loaded</p>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Recommendation */}
      {result?.portfolio_recommendation?.top_strategy && (
        <div className="rounded-lg border border-[#16a34a]/40 bg-[#16a34a]/5 p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-[#16a34a]" />
            <h3 className="font-bold text-sm text-[#112940]">Top Recommended Strategy</h3>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-lg font-extrabold text-[#16a34a]">{result.portfolio_recommendation.top_strategy.strategy_name}</p>
              <p className="text-xs text-[#607790] font-mono mt-1">{result.portfolio_recommendation.top_strategy.strategy_id} · {result.portfolio_recommendation.top_strategy.site_count} site(s) · {result.portfolio_recommendation.top_strategy.conversion_case}</p>
            </div>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div><p className="text-xl font-extrabold text-[#126fc8]">${result.portfolio_recommendation.top_strategy.cost_p50}</p><p className="text-[10px] text-[#607790]">Cost P50</p></div>
              <div><p className="text-xl font-extrabold text-[#16a34a]">${result.portfolio_recommendation.top_strategy.net_cash_12mo?.toLocaleString()}</p><p className="text-[10px] text-[#607790]">Net 12mo</p></div>
              <div><p className="text-xl font-extrabold text-[#d97706]">{result.portfolio_recommendation.top_strategy.payback_months}mo</p><p className="text-[10px] text-[#607790]">Payback</p></div>
              <div><p className="text-xl font-extrabold text-[#7c3aed]">{(result.portfolio_recommendation.top_strategy.budget_fit_probability * 100).toFixed(0)}%</p><p className="text-[10px] text-[#607790]">Budget Fit</p></div>
            </div>
          </div>
          {result.portfolio_recommendation.top_3?.length > 1 && (
            <div className="mt-4 pt-4 border-t border-[#e4edf5]">
              <p className="text-xs font-bold text-[#5b7288] uppercase mb-2">Runner-up Strategies</p>
              <div className="space-y-1">
                {result.portfolio_recommendation.top_3.slice(1).map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-[#112940]">{s.strategy_name}</span>
                    <span className="font-mono text-[#607790]">Net: ${s.net_cash_12mo?.toLocaleString()} · Payback: {s.payback_months}mo</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assumptions Editor */}
      <div className="rounded-lg border border-[#dce6f1] bg-white p-5 mb-4 space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-2 text-[#112940]"><Target className="w-4 h-4 text-[#126fc8]" /> Model Assumptions (editable)</h3>
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
        <div className="text-xs text-[#607790]">
          Budget after reserve: <b className="text-[#126fc8]">${budgetAfterReserve}</b> · Simulating {siteCounts.length * 5 * 10} scenarios per run
        </div>
      </div>

      {/* Strategy Tournament */}
      {strategies.length > 0 && (
        <div className="rounded-lg border border-[#dce6f1] bg-white p-5 mb-4">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-[#112940]"><TrendingUp className="w-4 h-4 text-[#126fc8]" /> Strategy Tournament ({strategies.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[#607790] border-b border-[#e4edf5]">
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
                  <tr key={s.id} className="border-b border-[#e4edf5] hover:bg-[#f8fbfe]">
                    <td className="py-2 px-2 font-mono text-[#126fc8]">{s.strategy_id}</td>
                    <td className="py-2 px-2 font-semibold text-[#112940]">{s.model_name}</td>
                    <td className="py-2 px-2 text-center text-[#16a34a]">{s.content_quality}/5</td>
                    <td className="py-2 px-2 text-center text-[#16a34a]">{s.practicality}/5</td>
                    <td className="py-2 px-2 text-center text-[#16a34a]">{s.buyer_fit}/5</td>
                    <td className="py-2 px-2 text-center text-[#16a34a]">{s.reusability}/5</td>
                    <td className="py-2 px-2 text-center font-mono text-[#d97706]">{s.cost_multiplier?.toFixed(2)}x</td>
                    <td className="py-2 px-2 text-center font-extrabold text-[#7c3aed]">{s.heuristic_points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Simulation Results */}
      {simulations.length > 0 && (
        <div className="rounded-lg border border-[#dce6f1] bg-white p-5 mb-4">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-[#112940]"><BarChart3 className="w-4 h-4 text-[#16a34a]" /> Simulation Results (BASE case, sorted by net 12mo)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[#607790] border-b border-[#e4edf5]">
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
                  <tr key={s.id} className="border-b border-[#e4edf5] hover:bg-[#f8fbfe]">
                    <td className="py-2 px-2 font-semibold text-[#112940] truncate max-w-[200px]">{s.strategy_name}</td>
                    <td className="py-2 px-2 text-center text-[#607790]">{s.site_count}</td>
                    <td className="py-2 px-2 text-center font-mono text-[#d97706]">${s.cost_p50}</td>
                    <td className="py-2 px-2 text-center font-mono text-[#126fc8]">${s.est_revenue_mo}</td>
                    <td className={"py-2 px-2 text-center font-mono font-bold " + (s.net_cash_12mo > 0 ? "text-[#16a34a]" : "text-red-600")}>${s.net_cash_12mo?.toLocaleString()}</td>
                    <td className="py-2 px-2 text-center font-mono text-[#607790]">{s.payback_months > 100 ? "—" : s.payback_months + "mo"}</td>
                    <td className="py-2 px-2 text-center font-mono text-[#607790]">{s.gross_margin_pct}%</td>
                    <td className="py-2 px-2 text-center">
                      <span className={"px-2 py-0.5 rounded font-semibold " + ((s.budget_fit_probability * 100) > 80 ? "bg-green-100 text-green-700" : (s.budget_fit_probability * 100) > 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>
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
        <div className="rounded-lg border border-[#dce6f1] bg-white p-5 mb-4">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-[#112940]"><CheckCircle2 className="w-4 h-4 text-[#7c3aed]" /> High-Leverage Capabilities ({capabilities.length})</h3>
          <div className="grid md:grid-cols-2 gap-2">
            {capabilities.map((c) => (
              <div key={c.id} className="rounded-lg border border-[#e4edf5] bg-[#f8fbfe] p-3 flex items-start gap-3">
                <span className={"text-[10px] font-bold px-2 py-0.5 rounded shrink-0 " + (c.priority === "Critical" ? "bg-red-100 text-red-700" : c.priority === "High" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-[#607790]")}>{c.priority}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#112940]">{c.capability_name}</p>
                  <p className="text-[10px] text-[#607790] mt-0.5">{c.domain}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      {!result && !loading && (
        <div className="mt-4">
          <h3 className="font-bold text-sm text-[#112940] mb-3">How it works — 3 steps:</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-[#5b7288]">
            <div className="flex items-start gap-2"><Layers className="w-4 h-4 text-[#7c3aed] mt-0.5 shrink-0" /><span><b className="text-[#112940]">Ingest</b> — Seeds 10 strategies and 30 high-leverage capabilities from the workbook intelligence suite</span></div>
            <div className="flex items-start gap-2"><Activity className="w-4 h-4 text-[#126fc8] mt-0.5 shrink-0" /><span><b className="text-[#112940]">Simulate</b> — Runs 500-draw Monte Carlo per strategy × site count × conversion case (250 scenarios total)</span></div>
            <div className="flex items-start gap-2"><Award className="w-4 h-4 text-[#16a34a] mt-0.5 shrink-0" /><span><b className="text-[#112940]">Recommend</b> — Scores and ranks strategies by budget fit, net cash, and payback speed</span></div>
          </div>
        </div>
      )}
    </AdminSystemPage>
  );
}

function AssumptionInput({ label, value, onChange, step }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-[#607790] uppercase tracking-wider mb-1 block">{label}</label>
      <input
        type="number"
        value={value}
        step={step || 1}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full h-9 px-2 rounded-lg bg-white border border-[#dce6f1] text-sm font-mono text-[#112940] focus:border-[#126fc8] outline-none"
      />
    </div>
  );
}