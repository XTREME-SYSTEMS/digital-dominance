import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Image as ImageIcon, Trophy, Gauge } from "lucide-react";

export default function ImageValidationDashboard() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [benchmarks, setBenchmarks] = useState(null);
  const [activeTab, setActiveTab] = useState("audit");

  const runAudit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("imageCategoryValidator", { action: "audit", fullScan: true });
      setReport(res.data);
    } catch (e) {
      setError(e.message || "Audit failed");
    } finally {
      setLoading(false);
    }
  };

  const runBenchmark = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("imageCategoryValidator", { action: "benchmark" });
      setBenchmarks(res.data);
    } catch (e) {
      setError(e.message || "Benchmark check failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAudit();
  }, []);

  return (
    <div className="min-h-screen bg-[#050508] p-6 text-white">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold">
              <Shield className="h-7 w-7 text-[#00a2ff]" />
              Image Validation & Benchmark Dashboard
            </h1>
            <p className="mt-1 text-sm text-white/50">
              Independent validator ensuring every category image is unique, accurate, and benchmark-aligned
            </p>
          </div>
          <button
            onClick={runAudit}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-[#00a2ff] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#0088dd] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Auditing..." : "Run Full Audit"}
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-white/10">
          {[
            { id: "audit", label: "Audit Results", icon: Shield },
            { id: "benchmarks", label: "Benchmark Comparison", icon: Trophy },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === "benchmarks" && !benchmarks) runBenchmark();
                }}
                className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "border-[#00a2ff] text-[#00a2ff]"
                    : "border-transparent text-white/40 hover:text-white/70"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Audit Tab */}
        {activeTab === "audit" && report && (
          <>
            {/* Summary Stats */}
            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard icon={CheckCircle2} label="Passed" value={report.passed} color="text-green-400" />
              <StatCard icon={XCircle} label="Failed" value={report.failed} color="text-red-400" />
              <StatCard icon={Gauge} label="Avg Score" value={`${report.avgScore}%`} color="text-[#00a2ff]" />
              <StatCard icon={AlertTriangle} label="Cross-Niche Duplicates" value={report.crossNicheDuplicates} color="text-amber-400" />
            </div>

            {/* Cross-niche duplicates */}
            {report.duplicateDetails && report.duplicateDetails.length > 0 && (
              <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  Images Reused Across Niches ({report.duplicateDetails.length})
                </h3>
                <div className="space-y-2">
                  {report.duplicateDetails.slice(0, 10).map((dup, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs text-white/60">
                      <ImageIcon className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{dup.url}</span>
                      <span className="flex-shrink-0 text-amber-400">→ {dup.niches.join(" | ")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Per-niche results */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {report.audits?.map((audit) => (
                <div
                  key={audit.niche}
                  className={`rounded-xl border p-4 transition ${
                    audit.passed
                      ? "border-green-500/20 bg-green-500/5"
                      : "border-red-500/20 bg-red-500/5"
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-bold capitalize">{audit.niche.replace(/_/g, " ")}</span>
                    {audit.passed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-400" />
                    )}
                  </div>

                  {/* Scores */}
                  <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
                    <ScoreBar label="Uniqueness" score={audit.uniquenessScore} />
                    <ScoreBar label="Accuracy" score={audit.accuracyScore} />
                  </div>

                  {/* Overall */}
                  <div className="mb-3 flex items-center justify-between text-xs">
                    <span className="text-white/40">Overall</span>
                    <span className={`font-bold ${audit.overallScore >= 80 ? "text-green-400" : "text-red-400"}`}>
                      {audit.overallScore}%
                    </span>
                  </div>

                  {/* Issues */}
                  {audit.issues && audit.issues.length > 0 && (
                    <div className="space-y-1">
                      {audit.issues.slice(0, 3).map((issue, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs text-amber-400/70">
                          <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                          {issue}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Preview image */}
                  <div className="mt-3 overflow-hidden rounded-lg border border-white/10">
                    <img src={audit.registryImage} alt={audit.niche} className="h-24 w-full object-cover" loading="lazy" />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Benchmark Tab */}
        {activeTab === "benchmarks" && benchmarks && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <StatCard icon={Trophy} label="Niches w/ Benchmarks" value={benchmarks.nichesWithBenchmarks} color="text-[#00a2ff]" />
              <StatCard icon={AlertTriangle} label="Missing Benchmarks" value={benchmarks.nichesMissingBenchmarks?.length || 0} color="text-amber-400" />
              <StatCard icon={ImageIcon} label="Total Niches" value={benchmarks.totalNiches} color="text-white/60" />
            </div>

            {benchmarks.nichesMissingBenchmarks && benchmarks.nichesMissingBenchmarks.length > 0 && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                <h3 className="mb-2 text-sm font-bold text-amber-400">Niches Missing Benchmark Captures</h3>
                <div className="flex flex-wrap gap-2">
                  {benchmarks.nichesMissingBenchmarks.map((n) => (
                    <span key={n} className="rounded-md bg-amber-500/10 px-2 py-1 text-xs text-amber-300">
                      {n.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {benchmarks.report?.map((item) => (
                <div key={item.niche} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-bold capitalize">{item.niche.replace(/_/g, " ")}</span>
                    {item.hasBenchmark ? (
                      <span className="rounded-md bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
                        {item.benchmarkCount} benchmark{item.benchmarkCount > 1 ? "s" : ""}
                      </span>
                    ) : (
                      <span className="rounded-md bg-red-500/20 px-2 py-0.5 text-xs text-red-400">No benchmark</span>
                    )}
                  </div>
                  <div className="overflow-hidden rounded-lg border border-white/10">
                    <img src={item.registryImage} alt={item.niche} className="h-32 w-full object-cover" loading="lazy" />
                  </div>
                  {item.benchmarkScreenshots && item.benchmarkScreenshots.length > 0 && (
                    <div className="mt-2 text-xs text-white/40">
                      {item.benchmarkScreenshots.length} benchmark screenshot(s) captured
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && !report && (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-[#00a2ff]" />
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mb-1 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-xs text-white/40">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function ScoreBar({ label, score }) {
  const color = score >= 90 ? "text-green-400" : score >= 70 ? "text-amber-400" : "text-red-400";
  const bg = score >= 90 ? "bg-green-400" : score >= 70 ? "bg-amber-400" : "bg-red-400";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-white/40">{label}</span>
        <span className={`font-bold ${color}`}>{score}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full ${bg} transition-all`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}