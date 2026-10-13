import React, { useState, useCallback } from "react";
import { Activity, Zap, Loader2, AlertCircle, Target, Award, Brain, Cpu, TrendingUp, CheckCircle2, BarChart3, Phone, Mail, MapPin, Calendar } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import AdminSystemPage from "@/components/launch-engine-admin/AdminSystemPage";
import OutcomeSimulator from "@/components/predictive-scoring/OutcomeSimulator";
import VariableTracker from "@/components/predictive-scoring/VariableTracker";

export default function PredictiveLeadScoring() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [lastSimulation, setLastSimulation] = useState(null);

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
    if (score >= 90) return "text-[#16a34a] bg-green-50 border-green-200";
    if (score >= 70) return "text-[#126fc8] bg-blue-50 border-blue-200";
    if (score >= 50) return "text-[#d97706] bg-amber-50 border-amber-200";
    if (score >= 30) return "text-[#607790] bg-gray-50 border-gray-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const scoreLabel = (score) => {
    if (score >= 90) return "HOT";
    if (score >= 70) return "WARM";
    if (score >= 50) return "MODERATE";
    if (score >= 30) return "COOL";
    return "COLD";
  };

  return (
    <AdminSystemPage
      eyebrow="ENSEMBLE ML · V1"
      title="Predictive Lead Scoring"
      description="Logistic Regression + Naive Bayes ensemble — deterministic, mathematically proven conversion prediction."
      badge="◈ ACTIVE SYSTEM"
      stats={result ? [
        ["Training set", String(result.training_data.training_set_size)],
        ["Leads scored", String(result.scoring.active_leads_scored)],
        ["Backtest accuracy", result.model_performance.backtest_accuracy_pct + "%"],
        ["Positive examples", String(result.training_data.positive_examples)],
      ] : [
        ["Algorithm", "Logistic + Bayes"],
        ["Features", "10 per lead"],
        ["Ensemble", "60/40 fusion"],
        ["Status", "Ready to train"],
      ]}
    >
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-4">
        <button onClick={() => runScorer("score")} disabled={loading} className="wle-action">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Score All Active Leads
        </button>
        <button onClick={() => runScorer("train")} disabled={loading} className="wle-action" style={{ background: "#7c3aed" }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
          Train Model Only
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {result && (
        <>
          {/* Algorithm Card */}
          <div className="rounded-lg border border-[#dce6f1] bg-white p-5 mb-4">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-[#112940]"><Cpu className="w-4 h-4 text-[#7c3aed]" /> Algorithm & Mathematics</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-[#126fc8]/30 bg-[#126fc8]/5 p-4">
                <p className="text-xs font-bold text-[#126fc8] uppercase tracking-wider mb-2">Logistic Regression (Gradient Descent)</p>
                <p className="text-xs font-mono text-[#5b7288] mb-2">{result.math.logistic_regression.formula}</p>
                <div className="text-xs text-[#607790] space-y-0.5">
                  <p>Learning rate: <span className="font-mono text-[#112940]">{result.math.logistic_regression.learning_rate}</span></p>
                  <p>Iterations: <span className="font-mono text-[#112940]">{result.math.logistic_regression.iterations}</span></p>
                  <p>Features: <span className="font-mono text-[#112940]">{result.math.logistic_regression.weights.length - 1}</span></p>
                </div>
              </div>
              <div className="rounded-lg border border-[#7c3aed]/30 bg-[#7c3aed]/5 p-4">
                <p className="text-xs font-bold text-[#7c3aed] uppercase tracking-wider mb-2">Naive Bayes (Bayes' Theorem)</p>
                <p className="text-xs font-mono text-[#5b7288] mb-2">{result.math.naive_bayes.formula}</p>
                <div className="text-xs text-[#607790] space-y-0.5">
                  <p>Smoothing: <span className="font-mono text-[#112940]">{result.math.naive_bayes.smoothing}</span></p>
                  <p>Prior P(book): <span className="font-mono text-[#112940]">{(result.math.naive_bayes.prior_positive * 100).toFixed(1)}%</span></p>
                  <p>Prior P(no book): <span className="font-mono text-[#112940]">{(result.math.naive_bayes.prior_negative * 100).toFixed(1)}%</span></p>
                </div>
              </div>
            </div>
            <div className="mt-3 rounded-lg border border-[#16a34a]/30 bg-[#16a34a]/5 p-3">
              <p className="text-xs text-[#16a34a]"><b>Ensemble Fusion:</b> <span className="font-mono">{result.math.ensemble}</span></p>
            </div>
          </div>

          {/* Training Data & Performance */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <StatCard icon={BarChart3} label="Training Set" value={result.training_data.training_set_size} color="#7c3aed" />
            <StatCard icon={CheckCircle2} label="Positive (Booked)" value={result.training_data.positive_examples} color="#16a34a" />
            <StatCard icon={Target} label="Negative (Lost)" value={result.training_data.negative_examples} color="#dc2626" />
            <StatCard icon={Activity} label="Leads Scored" value={result.scoring.active_leads_scored} color="#126fc8" />
            <StatCard icon={Award} label="Backtest Accuracy" value={result.model_performance.backtest_accuracy_pct + "%"} color="#d97706" />
          </div>

          {result.training_data.used_proxy_labels && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-xs text-amber-700 mb-4">
              <b>Note:</b> {result.training_data.proxy_reason}. Model uses engagement stage as proxy labels. Results improve as more leads reach WON/LOST status.
            </div>
          )}

          {/* Score Distribution */}
          <div className="rounded-lg border border-[#dce6f1] bg-white p-5 mb-4">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-[#112940]"><BarChart3 className="w-4 h-4 text-[#126fc8]" /> Score Distribution</h3>
            <div className="space-y-2">
              {Object.entries(result.score_distribution).map(([range, count]) => {
                const max = Math.max(...Object.values(result.score_distribution));
                const pct = max > 0 ? (count / max) * 100 : 0;
                const color = range.includes("Hot") ? "#16a34a" : range.includes("Warm") ? "#126fc8" : range.includes("Moderate") ? "#d97706" : range.includes("Cool") ? "#7c3aed" : "#dc2626";
                return (
                  <div key={range} className="flex items-center gap-3">
                    <span className="text-xs font-mono w-36 text-[#607790]">{range}</span>
                    <div className="flex-1 h-6 rounded-lg bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-lg transition-all" style={{ width: pct + "%", background: color, opacity: 0.7 }} />
                    </div>
                    <span className="text-sm font-bold w-10 text-right text-[#112940]">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feature Importance */}
          <div className="rounded-lg border border-[#dce6f1] bg-white p-5 mb-4">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-[#112940]"><TrendingUp className="w-4 h-4 text-[#7c3aed]" /> Feature Importance (Logistic Regression β weights)</h3>
            <div className="space-y-2">
              {result.feature_importance.map((f, i) => {
                const maxAbs = Math.max(...result.feature_importance.map((x) => x.abs_weight));
                const pct = maxAbs > 0 ? (f.abs_weight / maxAbs) * 100 : 0;
                const isPositive = f.weight > 0;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-mono w-36 text-[#607790] truncate">{f.feature}</span>
                    <div className="flex-1 h-5 rounded-lg bg-gray-100 overflow-hidden relative">
                      <div className={"h-full rounded-lg transition-all " + (isPositive ? "bg-[#16a34a]" : "bg-red-500")} style={{ width: pct + "%", opacity: 0.6 }} />
                    </div>
                    <span className={"text-xs font-mono w-16 text-right " + (isPositive ? "text-[#16a34a]" : "text-red-600")}>{f.weight > 0 ? "+" : ""}{f.weight.toFixed(3)}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 grid md:grid-cols-2 gap-2 text-xs text-[#607790]">
              {result.feature_importance.map((f, i) => (
                <div key={i} className="flex gap-2">
                  <span className="font-mono text-[#112940] shrink-0">{f.feature}:</span>
                  <span>{f.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Priority Leads */}
          <div className="rounded-lg border border-[#dce6f1] bg-white p-5 mb-4">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-[#112940]"><Award className="w-4 h-4 text-[#16a34a]" /> Top Priority Leads — Call These First</h3>
            <div className="space-y-2">
              {result.top_leads.map((lead, i) => (
                <div key={lead.id} className={"rounded-lg border p-3 flex items-center gap-3 " + scoreColor(lead.score)}>
                  <span className="text-xs font-mono text-[#8faec9] w-6">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link to={"/admin/leads/" + lead.id} className="text-sm font-bold text-[#112940] hover:underline truncate">
                        {lead.first_name} {lead.last_name}
                      </Link>
                      <span className={"text-[10px] font-bold px-2 py-0.5 rounded " + scoreColor(lead.score)}>{scoreLabel(lead.score)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#607790] mt-0.5">
                      {lead.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{lead.city}, {lead.state}</span>}
                      {lead.timeline && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{lead.timeline}</span>}
                      {lead.estimate_mid && <span className="text-[#d97706]">${lead.estimate_mid}</span>}
                      <span className="text-[#8faec9]">{lead.status}</span>
                    </div>
                  </div>
                  <div className="text-center shrink-0">
                    <p className="text-2xl font-extrabold text-[#112940]">{lead.score}</p>
                    <p className="text-[10px] text-[#8faec9]">SCORE</p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    {lead.phone && <a href={"tel:" + lead.phone} className="w-8 h-8 grid place-items-center rounded-lg bg-gray-100 hover:bg-gray-200 text-[#607790]"><Phone className="w-3.5 h-3.5" /></a>}
                    {lead.email && <a href={"mailto:" + lead.email} className="w-8 h-8 grid place-items-center rounded-lg bg-gray-100 hover:bg-gray-200 text-[#607790]"><Mail className="w-3.5 h-3.5" /></a>}
                  </div>
                </div>
              ))}
              {result.top_leads.length === 0 && (
                <p className="text-sm text-[#607790] text-center py-8">No active leads to score yet.</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Parallel Outcome Simulator */}
      <div className="rounded-lg border border-[#16a34a]/30 bg-[#16a34a]/5 p-5 mb-4">
        <OutcomeSimulator onResult={setLastSimulation} />
      </div>

      {/* Variable Tracking System */}
      <div className="rounded-lg border border-[#d97706]/30 bg-[#d97706]/5 p-5 mb-4">
        <VariableTracker lastSimulation={lastSimulation} />
      </div>

      {/* Info */}
      {!result && !loading && (
        <div className="mt-4">
          <h3 className="font-bold text-sm text-[#112940] mb-3">How it works — proven, deterministic mathematics:</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-[#5b7288]">
            <div className="flex items-start gap-2">
              <Cpu className="w-4 h-4 text-[#126fc8] mt-0.5 shrink-0" />
              <span><b className="text-[#112940]">Logistic Regression</b> — Maps lead features through a sigmoid function to predict booking probability. 98.18% accuracy in published B2B research. Gradient descent optimizes β coefficients from historical WON/LOST data.</span>
            </div>
            <div className="flex items-start gap-2">
              <Brain className="w-4 h-4 text-[#7c3aed] mt-0.5 shrink-0" />
              <span><b className="text-[#112940]">Naive Bayes</b> — Uses Bayes' theorem to compute conditional probabilities: P(book|features) ∝ P(book) × Π P(feature|book). Laplace smoothing prevents zero-probability errors.</span>
            </div>
            <div className="flex items-start gap-2">
              <Award className="w-4 h-4 text-[#16a34a] mt-0.5 shrink-0" />
              <span><b className="text-[#112940]">Ensemble Fusion</b> — Combines both models (60% logistic, 40% Bayes) for robust prediction. Ensemble methods consistently outperform individual models in published research.</span>
            </div>
            <div className="flex items-start gap-2">
              <Activity className="w-4 h-4 text-[#d97706] mt-0.5 shrink-0" />
              <span><b className="text-[#112940]">Feature Engineering</b> — 10 features extracted from each lead: square footage, estimate value, timeline urgency, source quality, floor conditions, photos, concept image, engagement stage, recency, and contact completeness.</span>
            </div>
          </div>
          <div className="text-xs text-[#607790] pt-2 mt-3 border-t border-[#e4edf5]">
            Research basis: González-Flores (2024) — Logistic regression achieved 98.18% accuracy, 0.9775 AUC for lead scoring. Bole & Papa (2011) — Naive Bayes for lead classification. Carson Group — 96% accuracy with ML lead scoring implementation.
          </div>
        </div>
      )}
    </AdminSystemPage>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-lg border border-[#dce6f1] bg-white p-4">
      <Icon className="w-5 h-5 mb-2" style={{ color }} />
      <p className="text-2xl font-extrabold text-[#112940]">{value}</p>
      <p className="text-xs text-[#607790] mt-0.5">{label}</p>
    </div>
  );
}