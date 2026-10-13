import React, { useState, useCallback } from "react";
import { Dices, Loader2, AlertCircle, TrendingUp, DollarSign, Target, Award, Zap, ArrowUp, ArrowDown, Activity } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function OutcomeSimulator({ onResult }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [numSims, setNumSims] = useState(500);
  const [costPerLead, setCostPerLead] = useState(45);
  const [overheadPerBooking, setOverheadPerBooking] = useState(150);

  const runSimulation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("leadOutcomeSimulator", {
        simulations: numSims,
        cost_per_lead: costPerLead,
        overhead_per_booking: overheadPerBooking,
      });
      setResult(res.data);
      if (onResult) onResult(res.data);
    } catch (e) {
      setError(e.message || "Simulation failed");
    } finally {
      setLoading(false);
    }
  }, [numSims, costPerLead, overheadPerBooking, onResult]);

  const fmt = (n) => "$" + (n || 0).toLocaleString();

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center">
          <Dices className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold tracking-tight">Parallel Outcome Simulator</h2>
          <p className="text-xs text-white/50">Monte Carlo engine — runs hundreds of scenarios across your lead pool, surfaces the most favorable outcomes</p>
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5 block">Simulations</label>
            <select value={numSims} onChange={(e) => setNumSims(Number(e.target.value))}
              className="w-full bg-[#0a1220] border border-white/10 rounded-xl px-3 py-2.5 text-sm font-semibold focus:border-[#22c55e] outline-none">
              <option value={100}>100 scenarios</option>
              <option value={500}>500 scenarios</option>
              <option value={1000}>1,000 scenarios</option>
              <option value={2000}>2,000 scenarios</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5 block">Cost / Lead</label>
            <input type="number" value={costPerLead} onChange={(e) => setCostPerLead(Number(e.target.value))}
              className="w-full bg-[#0a1220] border border-white/10 rounded-xl px-3 py-2.5 text-sm font-semibold focus:border-[#22c55e] outline-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5 block">Overhead / Booking</label>
            <input type="number" value={overheadPerBooking} onChange={(e) => setOverheadPerBooking(Number(e.target.value))}
              className="w-full bg-[#0a1220] border border-white/10 rounded-xl px-3 py-2.5 text-sm font-semibold focus:border-[#22c55e] outline-none" />
          </div>
          <div className="flex items-end">
            <button onClick={runSimulation} disabled={loading}
              className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white font-bold text-sm flex items-center justify-center gap-2 hover:brightness-110 transition disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Dices className="w-4 h-4" />}
              {loading ? "Simulating..." : "Run Simulation"}
            </button>
          </div>
        </div>
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/5 border border-red-500/20 rounded-xl p-3">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
      </div>

      {/* Results */}
      {result?.ok && result.most_favorable && (
        <>
          {/* Summary Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-[#22c55e]/20 bg-[#22c55e]/5 p-4">
              <DollarSign className="w-5 h-5 text-[#22c55e] mb-2" />
              <p className="text-2xl font-extrabold text-[#22c55e]">{fmt(result.distribution.net_revenue.p90)}</p>
              <p className="text-xs text-white/40 mt-0.5">P90 Net Revenue (favorable)</p>
            </div>
            <div className="rounded-xl border border-[#00a2ff]/20 bg-[#00a2ff]/5 p-4">
              <Target className="w-5 h-5 text-[#00a2ff] mb-2" />
              <p className="text-2xl font-extrabold text-[#00a2ff]">{result.distribution.bookings.p90}</p>
              <p className="text-xs text-white/40 mt-0.5">P90 Bookings (favorable)</p>
            </div>
            <div className="rounded-xl border border-[#a855f7]/20 bg-[#a855f7]/5 p-4">
              <Activity className="w-5 h-5 text-[#a855f7] mb-2" />
              <p className="text-2xl font-extrabold text-[#a855f7]">{result.distribution.conversion_rate.p90}%</p>
              <p className="text-xs text-white/40 mt-0.5">P90 Conversion Rate</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <Dices className="w-5 h-5 text-white/60 mb-2" />
              <p className="text-2xl font-extrabold">{result.simulations_run}</p>
              <p className="text-xs text-white/40 mt-0.5">Scenarios Run on {result.leads_simulated} Leads</p>
            </div>
          </div>

          {/* Distribution Chart */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#22c55e]" /> Net Revenue Distribution (all {result.simulations_run} scenarios)</h3>
            <div className="space-y-3">
              {[
                { label: "Worst (P10)", value: result.distribution.net_revenue.p10, color: "#ef4444" },
                { label: "P25", value: result.distribution.net_revenue.p25, color: "#f59e0b" },
                { label: "Median (P50)", value: result.distribution.net_revenue.p50, color: "#00a2ff" },
                { label: "P75", value: result.distribution.net_revenue.p75, color: "#a855f7" },
                { label: "Best (P90)", value: result.distribution.net_revenue.p90, color: "#22c55e" },
              ].map((row) => {
                const max = Math.max(...Object.values(result.distribution.net_revenue).filter((v) => typeof v === "number"));
                const min = Math.min(...Object.values(result.distribution.net_revenue).filter((v) => typeof v === "number"));
                const range = max - min || 1;
                const pct = max > 0 ? ((row.value - min) / range) * 100 : 0;
                return (
                  <div key={row.label} className="flex items-center gap-3">
                    <span className="text-xs font-mono w-28 text-white/60">{row.label}</span>
                    <div className="flex-1 h-7 rounded-lg bg-white/5 overflow-hidden">
                      <div className="h-full rounded-lg transition-all flex items-center pl-2" style={{ width: Math.max(pct, 5) + "%", background: row.color, opacity: 0.6 }}>
                        <span className="text-[10px] font-bold text-white/90">{fmt(row.value)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/5 text-xs text-white/40">
              <div>Mean: <span className="font-mono text-white/60">{fmt(result.distribution.net_revenue.mean)}</span></div>
              <div>Min: <span className="font-mono text-red-400">{fmt(result.distribution.net_revenue.min)}</span></div>
              <div>Max: <span className="font-mono text-[#22c55e]">{fmt(result.distribution.net_revenue.max)}</span></div>
            </div>
          </div>

          {/* Recommendations */}
          {result.recommendations?.length > 0 && (
            <div className="rounded-2xl border border-[#22c55e]/20 bg-[#22c55e]/5 p-6">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-[#22c55e]" /> Strategy Recommendations (from favorable outcomes)</h3>
              <ul className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                    <ArrowUp className="w-4 h-4 text-[#22c55e] mt-0.5 shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Favorable Parameters */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><Award className="w-4 h-4 text-[#22c55e]" /> Common Parameters in Top 10 Favorable Outcomes</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <ParamCard label="Hot Lead CVR" value={result.favorable_params.avg_hot_cvr + "%"} />
              <ParamCard label="Warm Lead CVR" value={result.favorable_params.avg_warm_cvr + "%"} />
              <ParamCard label="Deal Size Mult" value={result.favorable_params.avg_deal_mult + "x"} />
              <ParamCard label="Follow-up Speed" value={result.favorable_params.avg_followup_speed + "h"} />
              <ParamCard label="Source Boost" value={result.favorable_params.avg_source_boost + "x"} />
            </div>
          </div>

          {/* Top 10 Most Favorable Outcomes */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><Award className="w-4 h-4 text-[#22c55e]" /> Top 10 Most Favorable Outcomes</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-white/40 text-xs uppercase">
                  <tr>
                    <th className="text-left font-medium px-3 py-2">#</th>
                    <th className="text-right font-medium px-3 py-2">Net Rev</th>
                    <th className="text-right font-medium px-3 py-2">Bookings</th>
                    <th className="text-right font-medium px-3 py-2">CVR</th>
                    <th className="text-right font-medium px-3 py-2">Avg Deal</th>
                    <th className="text-right font-medium px-3 py-2">ROI</th>
                    <th className="text-right font-medium px-3 py-2">Hot CVR</th>
                    <th className="text-right font-medium px-3 py-2">Deal Mult</th>
                    <th className="text-right font-medium px-3 py-2">Follow-up</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {result.most_favorable.map((r) => (
                    <tr key={r.rank} className="hover:bg-white/[0.02]">
                      <td className="px-3 py-2.5 font-bold text-[#22c55e]">{r.rank}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-[#22c55e]">{fmt(r.net_revenue)}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{r.total_bookings}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{r.conversion_rate.toFixed(1)}%</td>
                      <td className="px-3 py-2.5 text-right font-mono text-[#f59e0b]">{fmt(r.avg_deal_size)}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{r.roi}%</td>
                      <td className="px-3 py-2.5 text-right font-mono text-white/60">{r.params.hot_cvr}%</td>
                      <td className="px-3 py-2.5 text-right font-mono text-white/60">{r.params.avg_deal_mult}x</td>
                      <td className="px-3 py-2.5 text-right font-mono text-white/60">{r.params.followup_speed}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!result && !loading && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-3">
          <h3 className="font-bold text-sm">How the parallel simulator works:</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-white/60">
            <div className="flex items-start gap-2">
              <Dices className="w-4 h-4 text-[#22c55e] mt-0.5 shrink-0" />
              <span><b className="text-white">Monte Carlo Method</b> — Runs hundreds of scenarios, each sampling different conversion rates, deal sizes, and follow-up speeds from probability distributions (Beta, Normal). Every lead is probabilistically booked or lost per scenario.</span>
            </div>
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-[#00a2ff] mt-0.5 shrink-0" />
              <span><b className="text-white">Outcome Ranking</b> — All scenarios are ranked by net revenue. The top 10 most favorable outcomes are surfaced with the exact parameters that produced them, so you can replicate the winning conditions.</span>
            </div>
            <div className="flex items-start gap-2">
              <Target className="w-4 h-4 text-[#a855f7] mt-0.5 shrink-0" />
              <span><b className="text-white">Distribution Analysis</b> — P10 through P90 percentiles show the full range of possible outcomes, from worst case to best case. P90 is your favorable target.</span>
            </div>
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-[#f59e0b] mt-0.5 shrink-0" />
              <span><b className="text-white">Actionable Recommendations</b> — The engine extracts common patterns from the top outcomes and tells you exactly what to do: follow-up speed, source prioritization, upsell targets.</span>
            </div>
          </div>
          <div className="text-xs text-white/40 pt-2 border-t border-white/5">
            Research basis: Metropolis & Ulam (1947) — Monte Carlo method. Beta distributions model conversion rate uncertainty. Box-Muller transform for normal sampling. Percentile analysis for outcome ranking.
          </div>
        </div>
      )}
    </div>
  );
}

function ParamCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center">
      <p className="text-lg font-extrabold text-[#22c55e]">{value}</p>
      <p className="text-[10px] text-white/40 mt-0.5 uppercase tracking-wider">{label}</p>
    </div>
  );
}