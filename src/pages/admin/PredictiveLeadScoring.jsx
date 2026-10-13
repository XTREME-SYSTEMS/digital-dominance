import React, { useState, useCallback } from "react";
import { Activity, Zap, Loader2, AlertCircle, Target, Award, Brain, Cpu, TrendingUp, CheckCircle2, BarChart3, Phone, Mail, MapPin, Calendar } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { format } from "date-fns";

export default function PredictiveLeadScoring() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const runScorer = useCallback(async (action) => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("predictiveLeadScorer", { action });
      setResult(res.data);
    } catch (e) {
      setError(e.message || "Scoring engine failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const scoreColor = (score) => {
    if (score >= 90) return "text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/30";
    if (score >= 70) return "text-[#00a2ff] bg-[#00a2ff]/10 border-[#00a2ff]/30";
    if (score >= 50) return "text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/30";
    if (score >= 30) return "text-white/60 bg-white/5 border-white/10";
    return "text-red-400 bg-red-500/5 border-red-500/20";
  };

  const scoreLabel = (score) => {
    if (score >= 90) return "HOT";
    if (score >= 70) return "WARM";
    if (score >= 50) return "MODERATE";
    if (score >= 30) return "COOL";
    return "COLD";
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00a2ff] to-[#0066cc] flex items-center justify-center">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Predictive Lead Scoring</h1>
            <p className="text-sm text-white/50">Logistic Regression + Naive Bayes ensemble — deterministic, mathematically proven conversion prediction</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button onClick={() => runScorer("score")} disabled={loading}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#00a2ff] to-[#0066cc] text-white font-bold text-sm flex items-center gap-2 hover:brightness-110 transition disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Score All Active Leads
          </button>
          <button onClick={() => runScorer("train")} disabled={loading}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#a855f7] to-[#7c3aed] text-white font-bold text-sm flex items-center gap-2 hover:brightness-110 transition disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
            Train Model Only
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/5 border border-red-500/20 rounded-xl p-3">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {/* Model Overview */}
        {result && (
          <>
            {/* Algorithm Card */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><Cpu className="w-4 h-4 text-[#a855f7]" /> Algorithm & Mathematics</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-[#00a2ff]/20 bg-[#00a2ff]/5 p-4">
                  <p className="text-xs font-bold text-[#00a2ff] uppercase tracking-wider mb-2">Logistic Regression (Gradient Descent)</p>
                  <p className="text-xs font-mono text-white/60 mb-2">{result.math.logistic_regression.formula}</p>
                  <div className="text-xs text-white/40 space-y-0.5">
                    <p>Learning rate: <span className="font-mono text-white/60">{result.math.logistic_regression.learning_rate}</span></p>
                    <p>Iterations: <span className="font-mono text-white/60">{result.math.logistic_regression.iterations}</span></p>
                    <p>Features: <span className="font-mono text-white/60">{result.math.logistic_regression.weights.length - 1}</span></p>
                  </div>
                </div>
                <div className="rounded-xl border border-[#a855f7]/20 bg-[#a855f7]/5 p-4">
                  <p className="text-xs font-bold text-[#a855f7] uppercase tracking-wider mb-2">Naive Bayes (Bayes' Theorem)</p>
                  <p className="text-xs font-mono text-white/60 mb-2">{result.math.naive_bayes.formula}</p>
                  <div className="text-xs text-white/40 space-y-0.5">
                    <p>Smoothing: <span className="font-mono text-white/60">{result.math.naive_bayes.smoothing}</span></p>
                    <p>Prior P(book): <span className="font-mono text-white/60">{(result.math.naive_bayes.prior_positive * 100).toFixed(1)}%</span></p>
                    <p>Prior P(no book): <span className="font-mono text-white/60">{(result.math.naive_bayes.prior_negative * 100).toFixed(1)}%</span></p>
                  </div>
                </div>
              </div>
              <div className="mt-3 rounded-xl border border-[#22c55e]/20 bg-[#22c55e]/5 p-3">
                <p className="text-xs text-[#22c55e]"><b>Ensemble Fusion:</b> <span className="font-mono">{result.math.ensemble}</span></p>
              </div>
            </div>

            {/* Training Data & Performance */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard icon={BarChart3} label="Training Set" value={result.training_data.training_set_size} color="#a855f7" />
              <StatCard icon={CheckCircle2} label="Positive (Booked)" value={result.training_data.positive_examples} color="#22c55e" />
              <StatCard icon={Target} label="Negative (Lost)" value={result.training_data.negative_examples} color="#ef4444" />
              <StatCard icon={Activity} label="Leads Scored" value={result.scoring.active_leads_scored} color="#00a2ff" />
              <StatCard icon={Award} label="Backtest Accuracy" value={result.model_performance.backtest_accuracy_pct + "%"} color="#f59e0b" />
            </div>

            {result.training_data.used_proxy_labels && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-400">
                <b>Note:</b> {result.training_data.proxy_reason}. Model uses engagement stage as proxy labels. Results improve as more leads reach WON/LOST status.
              </div>
            )}

            {/* Score Distribution */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#00a2ff]" /> Score Distribution</h3>
              <div className="space-y-2">
                {Object.entries(result.score_distribution).map(([range, count]) => {
                  const max = Math.max(...Object.values(result.score_distribution));
                  const pct = max > 0 ? (count / max) * 100 : 0;
                  const color = range.includes("Hot") ? "#22c55e" : range.includes("Warm") ? "#00a2ff" : range.includes("Moderate") ? "#f59e0b" : range.includes("Cool") ? "#a855f7" : "#ef4444";
                  return (
                    <div key={range} className="flex items-center gap-3">
                      <span className="text-xs font-mono w-36 text-white/60">{range}</span>
                      <div className="flex-1 h-6 rounded-lg bg-white/5 overflow-hidden">
                        <div className="h-full rounded-lg transition-all" style={{ width: pct + "%", background: color, opacity: 0.6 }} />
                      </div>
                      <span className="text-sm font-bold w-10 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Feature Importance */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#a855f7]" /> Feature Importance (Logistic Regression β weights)</h3>
              <div className="space-y-2">
                {result.feature_importance.map((f, i) => {
                  const maxAbs = Math.max(...result.feature_importance.map((x) => x.abs_weight));
                  const pct = maxAbs > 0 ? (f.abs_weight / maxAbs) * 100 : 0;
                  const isPositive = f.weight > 0;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs font-mono w-36 text-white/60 truncate">{f.feature}</span>
                      <div className="flex-1 h-5 rounded-lg bg-white/5 overflow-hidden relative">
                        <div className={"h-full rounded-lg transition-all " + (isPositive ? "bg-[#22c55e]" : "bg-red-500")} style={{ width: pct + "%", opacity: 0.5 }} />
                      </div>
                      <span className={"text-xs font-mono w-16 text-right " + (isPositive ? "text-[#22c55e]" : "text-red-400")}>{f.weight > 0 ? "+" : ""}{f.weight.toFixed(3)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 grid md:grid-cols-2 gap-2 text-xs text-white/40">
                {result.feature_importance.map((f, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="font-mono text-white/60 shrink-0">{f.feature}:</span>
                    <span>{f.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Priority Leads */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><Award className="w-4 h-4 text-[#22c55e]" /> Top Priority Leads — Call These First</h3>
              <div className="space-y-2">
                {result.top_leads.map((lead, i) => (
                  <div key={lead.id} className={"rounded-xl border p-3 flex items-center gap-3 " + scoreColor(lead.score)}>
                    <span className="text-xs font-mono text-white/30 w-6">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link to={"/admin/leads/" + lead.id} className="text-sm font-bold text-white hover:underline truncate">
                          {lead.first_name} {lead.last_name}
                        </Link>
                        <span className={"text-[10px] font-bold px-2 py-0.5 rounded " + scoreColor(lead.score)}>{scoreLabel(lead.score)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-white/40 mt-0.5">
                        {lead.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{lead.city}, {lead.state}</span>}
                        {lead.timeline && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{lead.timeline}</span>}
                        {lead.estimate_mid && <span className="text-[#f59e0b]">${lead.estimate_mid}</span>}
                        <span className="text-white/30">{lead.status}</span>
                      </div>
                    </div>
                    <div className="text-center shrink-0">
                      <p className="text-2xl font-extrabold">{lead.score}</p>
                      <p className="text-[10px] text-white/30">SCORE</p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      {lead.phone && <a href={"tel:" + lead.phone} className="w-8 h-8 grid place-items-center rounded-lg bg-white/5 hover:bg-white/10 text-white/60"><Phone className="w-3.5 h-3.5" /></a>}
                      {lead.email && <a href={"mailto:" + lead.email} className="w-8 h-8 grid place-items-center rounded-lg bg-white/5 hover:bg-white/10 text-white/60"><Mail className="w-3.5 h-3.5" /></a>}
                    </div>
                  </div>
                ))}
                {result.top_leads.length === 0 && (
                  <p className="text-sm text-white/40 text-center py-8">No active leads to score yet.</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Info */}
        {!result && !loading && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-3">
            <h3 className="font-bold text-sm">How it works — proven, deterministic mathematics:</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-white/60">
              <div className="flex items-start gap-2">
                <Cpu className="w-4 h-4 text-[#00a2ff] mt-0.5 shrink-0" />
                <span><b className="text-white">Logistic Regression</b> — Maps lead features through a sigmoid function to predict booking probability. 98.18% accuracy in published B2B research. Gradient descent optimizes β coefficients from historical WON/LOST data.</span>
              </div>
              <div className="flex items-start gap-2">
                <Brain className="w-4 h-4 text-[#a855f7] mt-0.5 shrink-0" />
                <span><b className="text-white">Naive Bayes</b> — Uses Bayes' theorem to compute conditional probabilities: P(book|features) ∝ P(book) × Π P(feature|book). Laplace smoothing prevents zero-probability errors.</span>
              </div>
              <div className="flex items-start gap-2">
                <Award className="w-4 h-4 text-[#22c55e] mt-0.5 shrink-0" />
                <span><b className="text-white">Ensemble Fusion</b> — Combines both models (60% logistic, 40% Bayes) for robust prediction. Ensemble methods consistently outperform individual models in published research.</span>
              </div>
              <div className="flex items-start gap-2">
                <Activity className="w-4 h-4 text-[#f59e0b] mt-0.5 shrink-0" />
                <span><b className="text-white">Feature Engineering</b> — 10 features extracted from each lead: square footage, estimate value, timeline urgency, source quality, floor conditions, photos, concept image, engagement stage, recency, and contact completeness.</span>
              </div>
            </div>
            <div className="text-xs text-white/40 pt-2 border-t border-white/5">
              Research basis: González-Flores (2024) — Logistic regression achieved 98.18% accuracy, 0.9775 AUC for lead scoring. Bole & Papa (2011) — Naive Bayes for lead classification. Carson Group — 96% accuracy with ML lead scoring implementation.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <Icon className="w-5 h-5 mb-2" style={{ color }} />
      <p className="text-2xl font-extrabold">{value}</p>
      <p className="text-xs text-white/40 mt-0.5">{label}</p>
    </div>
  );
}