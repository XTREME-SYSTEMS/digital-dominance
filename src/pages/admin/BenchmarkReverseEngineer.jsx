import React, { useState } from "react";
import { Diamond, Loader2, CheckCircle2, AlertCircle, Search, ChevronDown, ChevronRight, Eye, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AdminSystemPage from "@/components/launch-engine-admin/AdminSystemPage";
import { TOP_20_INDUSTRIES } from "@/data/topIndustries";

export default function BenchmarkReverseEngineer() {
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [expandedSites, setExpandedSites] = useState({});
  const [vqcImageUrl, setVqcImageUrl] = useState("");
  const [vqcRunning, setVqcRunning] = useState(false);
  const [vqcResult, setVqcResult] = useState(null);
  const [vqcError, setVqcError] = useState(null);

  const runVisualCheck = async () => {
    if (!vqcImageUrl || !selectedIndustry) return;
    setVqcRunning(true);
    setVqcError(null);
    setVqcResult(null);
    try {
      const res = await base44.functions.invoke("benchmarkVisualQualityCheck", {
        imageUrl: vqcImageUrl,
        industryKey: selectedIndustry.id,
      });
      setVqcResult(res.data);
    } catch (err) {
      setVqcError(err.message || "Visual quality check failed");
    } finally {
      setVqcRunning(false);
    }
  };

  const run = async () => {
    if (!selectedIndustry) return;
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke("benchmarkReverseEngineer", {
        industryKey: selectedIndustry.id,
        maxSites: 5,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.message || "Failed to run reverse engineering");
    } finally {
      setRunning(false);
    }
  };

  return (
    <AdminSystemPage
      eyebrow="BENCHMARK SYSTEM · REVERSE ENGINEER"
      title="Top 5 Website Layout Reverse-Engineer"
      description="Finds the top 5 rated best websites in every category, reverse-engineers their layouts, validates against best practices, and stores the DNA for template generation."
      badge="◈ ACTIVE SYSTEM"
      stats={[
        ["Industry Categories", "20"],
        ["Sites Per Category", "5"],
        ["Validation Gate", "70+"],
        ["Visual Gate", vqcResult ? `${vqcResult.score}/100` : "75+"],
      ]}
    >
      {/* Industry Selector */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-[#112940] mb-3">1. Select Industry Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {TOP_20_INDUSTRIES.map((ind, i) => {
            const active = selectedIndustry?.id === ind.id;
            return (
              <button
                key={ind.id}
                onClick={() => setSelectedIndustry(ind)}
                className={`text-left rounded-lg border p-2.5 transition ${active ? "border-[#126fc8] bg-[#126fc8]/5 ring-2 ring-[#126fc8]/20" : "border-[#e4e4e7] bg-white hover:border-[#126fc8]/40"}`}
              >
                <span className="text-[10px] font-mono text-[#8faec9]">#{String(i + 1).padStart(2, "0")}</span>
                <p className="text-xs font-bold text-[#112940] leading-tight mt-0.5">{ind.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Run Button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={run}
          disabled={!selectedIndustry || running}
          className="wle-action flex items-center gap-2"
          style={{ background: "linear-gradient(135deg, #126fc8, #0d9488)" }}
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Diamond className="w-4 h-4" />}
          {running ? "Reverse-Engineering..." : "Reverse-Engineer Top 5 Layouts"}
        </button>
        {selectedIndustry && (
          <span className="text-sm text-[#607790]">
            Target: <strong className="text-[#112940]">{selectedIndustry.label}</strong>
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg bg-[#f8fbfe] border border-[#e4edf5] p-3">
              <p className="text-[10px] font-bold text-[#607790] uppercase">Sites Found</p>
              <p className="text-2xl font-black text-[#112940]">{result.sitesFound}</p>
            </div>
            <div className="rounded-lg bg-green-50 border border-green-200 p-3">
              <p className="text-[10px] font-bold text-green-700 uppercase">Captured</p>
              <p className="text-2xl font-black text-green-700">{result.sitesCaptured}</p>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-[10px] font-bold text-amber-700 uppercase">Blocked</p>
              <p className="text-2xl font-black text-amber-700">{result.sitesBlocked}</p>
            </div>
            <div className="rounded-lg bg-[#126fc8]/5 border border-[#126fc8]/20 p-3">
              <p className="text-[10px] font-bold text-[#126fc8] uppercase">Validation Score</p>
              <p className="text-2xl font-black text-[#126fc8]">{result.validation?.score || 0}/100</p>
            </div>
          </div>

          {/* Validation */}
          {result.validation && (
            <div className={`rounded-lg border p-4 ${result.validation.passed ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
              <div className="flex items-center gap-2 mb-2">
                {result.validation.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                )}
                <p className={`font-bold ${result.validation.passed ? "text-green-700" : "text-amber-700"}`}>
                  Validation {result.validation.passed ? "PASSED" : "NEEDS IMPROVEMENT"}
                </p>
              </div>
              <p className="text-sm text-[#607790]">{result.validation.notes}</p>
              {result.validation.checks && (
                <ul className="mt-2 space-y-1">
                  {result.validation.checks.map((check, i) => (
                    <li key={i} className="text-xs text-[#607790]">{check}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Layout DNA */}
          {result.layoutDNA && (
            <div className="rounded-lg border border-[#e4edf5] bg-white p-4">
              <h4 className="text-sm font-bold text-[#112940] mb-3">Extracted Layout DNA</h4>
              <div className="grid md:grid-cols-2 gap-3 text-xs">
                {result.layoutDNA.heroPattern && (
                  <div>
                    <p className="font-bold text-[#607790] uppercase text-[10px]">Hero Pattern</p>
                    <p className="text-[#112940]">{result.layoutDNA.heroPattern}</p>
                  </div>
                )}
                {result.layoutDNA.navPattern && (
                  <div>
                    <p className="font-bold text-[#607790] uppercase text-[10px]">Nav Pattern</p>
                    <p className="text-[#112940]">{result.layoutDNA.navPattern}</p>
                  </div>
                )}
                {result.layoutDNA.ctaPattern && (
                  <div>
                    <p className="font-bold text-[#607790] uppercase text-[10px]">CTA Pattern</p>
                    <p className="text-[#112940]">{result.layoutDNA.ctaPattern}</p>
                  </div>
                )}
                {result.layoutDNA.colorStrategy && (
                  <div>
                    <p className="font-bold text-[#607790] uppercase text-[10px]">Color Strategy</p>
                    <p className="text-[#112940]">{result.layoutDNA.colorStrategy}</p>
                  </div>
                )}
                {result.layoutDNA.commonSections && (
                  <div className="md:col-span-2">
                    <p className="font-bold text-[#607790] uppercase text-[10px]">Common Sections</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {result.layoutDNA.commonSections.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-[#126fc8]/10 text-[#126fc8] text-[10px] font-bold">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {result.layoutDNA.conversionElements && (
                  <div className="md:col-span-2">
                    <p className="font-bold text-[#607790] uppercase text-[10px]">Conversion Elements</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {result.layoutDNA.conversionElements.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {result.layoutDNA.recommendations && (
                  <div className="md:col-span-2">
                    <p className="font-bold text-[#607790] uppercase text-[10px]">Recommendations</p>
                    <p className="text-[#112940] mt-1">{result.layoutDNA.recommendations}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Per-site results */}
          {result.results && result.results.length > 0 && (
            <div className="rounded-lg border border-[#e4edf5] bg-white p-4">
              <h4 className="text-sm font-bold text-[#112940] mb-3">Per-Site Capture Results</h4>
              <div className="space-y-2">
                {result.results.map((r, i) => {
                  const expanded = expandedSites[i] || false;
                  return (
                    <div key={i} className="rounded-lg border border-[#e4edf5] overflow-hidden">
                      <button
                        onClick={() => setExpandedSites((p) => ({ ...p, [i]: !p[i] }))}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#f8fbfe] transition"
                      >
                        {expanded ? <ChevronDown className="w-4 h-4 text-[#8faec9]" /> : <ChevronRight className="w-4 h-4 text-[#8faec9]" />}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === "captured" ? "bg-green-100 text-green-700" : r.status === "blocked" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                          {r.status}
                        </span>
                        <span className="text-xs font-bold text-[#112940] flex-1 text-left truncate">{r.name || r.url}</span>
                        <span className="text-[10px] font-mono text-[#8faec9] truncate">{r.url}</span>
                      </button>
                      {expanded && (
                        <div className="px-3 pb-3 text-xs text-[#607790]">
                          {r.error && <p className="text-red-600">Error: {r.error}</p>}
                          {r.capture && (
                            <pre className="text-[10px] font-mono bg-[#f8fbfe] rounded p-2 overflow-x-auto">
                              {JSON.stringify(r.capture, null, 2)}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Visual Quality Gate */}
      <div className="rounded-lg border border-[#dce6f1] bg-white p-4 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-5 h-5 text-[#126fc8]" />
          <h3 className="text-sm font-bold text-[#112940]">Visual Quality Gate</h3>
          <span className="text-[10px] text-[#8faec9] ml-auto">
            Forces images to match the high-end style of the top 5 reverse-engineered sites
          </span>
        </div>
        <p className="text-xs text-[#607790] mb-3">
          Paste any generated image URL to validate it against the visual DNA extracted from the top 5
          {selectedIndustry ? ` ${selectedIndustry.label}` : ""} benchmark sites. Images scoring below 75 are rejected.
        </p>
        <div className="flex items-center gap-2 mb-3">
          <input
            value={vqcImageUrl}
            onChange={(e) => setVqcImageUrl(e.target.value)}
            placeholder="https://...image-url.png"
            className="flex-1 h-9 px-3 rounded-lg border border-[#dce6f1] text-sm text-[#112940] focus:border-[#126fc8] outline-none"
          />
          <button
            onClick={runVisualCheck}
            disabled={!vqcImageUrl || !selectedIndustry || vqcRunning}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#126fc8] text-white text-xs font-bold hover:bg-[#0d58a8] disabled:opacity-40 transition"
          >
            {vqcRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
            {vqcRunning ? "Evaluating..." : "Run Visual Check"}
          </button>
        </div>
        {!selectedIndustry && (
          <p className="text-[10px] text-[#d97706]">Select an industry category above first.</p>
        )}
        {vqcError && (
          <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg p-2.5 mb-3">
            <AlertCircle className="w-3.5 h-3.5" /> {vqcError}
          </div>
        )}
        {vqcResult && (
          <div className="space-y-3">
            {/* Score banner */}
            <div className={`rounded-lg border p-3 ${vqcResult.passed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
              <div className="flex items-center gap-2">
                {vqcResult.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-[#16a34a]" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                <span className={`text-sm font-bold ${vqcResult.passed ? "text-[#16a34a]" : "text-red-600"}`}>
                  {vqcResult.passed ? "PASSED" : "REJECTED"} — Score: {vqcResult.score}/100
                </span>
                <span className="text-[10px] text-[#607790] ml-auto">
                  Validated against {vqcResult.benchmarkCount} benchmark sites
                </span>
              </div>
              {vqcResult.feedback && (
                <p className="text-xs text-[#607790] mt-2">{vqcResult.feedback}</p>
              )}
            </div>

            {/* Per-dimension scores */}
            {vqcResult.checks && vqcResult.checks.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {vqcResult.checks.map((check, i) => (
                  <div
                    key={i}
                    className={`rounded-lg border p-2.5 ${check.passed ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}`}
                  >
                    <div className="flex items-center gap-1.5">
                      {check.passed ? (
                        <CheckCircle2 className="w-3 h-3 text-[#16a34a]" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-red-500" />
                      )}
                      <span className="text-[10px] font-bold text-[#112940]">{check.name}</span>
                    </div>
                    <p className="text-lg font-black text-[#112940] mt-1">{check.score}</p>
                    {check.detail && (
                      <p className="text-[9px] text-[#607790] mt-0.5 line-clamp-2">{check.detail}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Benchmark sites used */}
            {vqcResult.benchmarkSites && vqcResult.benchmarkSites.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-[10px] font-bold text-[#607790] uppercase">Validated against:</span>
                {vqcResult.benchmarkSites.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-[#126fc8] font-bold hover:underline"
                  >
                    {s.name}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminSystemPage>
  );
}