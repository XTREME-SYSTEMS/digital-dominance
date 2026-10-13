import React, { useState, useCallback } from "react";
import { Search, Globe, BarChart3, Zap, CheckCircle2, XCircle, AlertCircle, Loader2, FileText, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function GoogleBatchSubmission() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("all");

  const runBatch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke("googleBatchSubmissionEngine", { mode });
      setResult(res.data);
    } catch (e) {
      setError(e.message || "Failed to run batch submission");
    } finally {
      setLoading(false);
    }
  }, [mode]);

  return (
    <div className="min-h-screen bg-[#050508] text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00a2ff] to-[#0066cc] flex items-center justify-center">
            <Search className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Google Batch Submission Engine</h1>
            <p className="text-sm text-white/50">Generate all sitemaps, submit to Search Console, ping IndexNow, and list GA4 properties — all at once</p>
          </div>
        </div>

        {/* Connector Status */}
        {result && (
          <div className="grid grid-cols-2 gap-4">
            <div className={`rounded-xl border p-4 ${result.gsc_connected ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
              <div className="flex items-center gap-2">
                {result.gsc_connected ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
                <span className="font-bold text-sm">Google Search Console</span>
              </div>
              <p className="text-xs text-white/50 mt-1">{result.gsc_connected ? "Connected — sitemaps submitted" : "Not connected — sitemap submission skipped"}</p>
            </div>
            <div className={`rounded-xl border p-4 ${result.ga_connected ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
              <div className="flex items-center gap-2">
                {result.ga_connected ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
                <span className="font-bold text-sm">Google Analytics</span>
              </div>
              <p className="text-xs text-white/50 mt-1">{result.ga_connected ? `Connected — ${result.ga4_properties_found} properties found` : "Not connected — GA4 listing skipped"}</p>
            </div>
          </div>
        )}

        {/* Control Panel */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 md:items-end">
            <div className="flex-1">
              <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 block">Scope</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full bg-[#0a1220] border border-white/10 rounded-xl px-4 py-3 text-sm font-semibold focus:border-[#00a2ff] outline-none"
              >
                <option value="all">All deployed sites (WebsiteQueue + Canonical)</option>
                <option value="canonical_only">Canonical site only</option>
              </select>
            </div>
            <button
              onClick={runBatch}
              disabled={loading}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#00a2ff] to-[#0066cc] text-white font-bold text-sm flex items-center gap-2 hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px] justify-center"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
              {loading ? "Submitting..." : "Submit Everything"}
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {result && !result.ok && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
            <p className="text-amber-400 font-bold">{result.message || "No sites found"}</p>
          </div>
        )}

        {result?.ok && (
          <>
            {/* Summary Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard icon={Globe} label="Sites Processed" value={result.total_sites_processed} color="#00a2ff" />
              <StatCard icon={FileText} label="Sitemaps Generated" value={result.sitemaps_generated} color="#22c55e" />
              <StatCard icon={Search} label="GSC Submitted" value={result.gsc_sitemaps_submitted} color="#a855f7" />
              <StatCard icon={Zap} label="IndexNow Pings" value={result.index_now_submitted} color="#f59e0b" />
              <StatCard icon={BarChart3} label="GA4 Properties" value={result.ga4_properties_found} color="#ec4899" />
            </div>

            {/* Total URLs */}
            <div className="rounded-2xl border border-[#00a2ff]/20 bg-[#00a2ff]/5 p-6 text-center">
              <p className="text-4xl font-extrabold text-[#00a2ff]">{result.total_urls_across_all_sites?.toLocaleString()}</p>
              <p className="text-sm text-white/50 mt-1">Total URLs submitted across all sites</p>
            </div>

            {/* GA4 Properties */}
            {result.ga4_properties?.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#ec4899]" />
                  GA4 Properties
                </h3>
                <div className="space-y-2">
                  {result.ga4_properties.map((prop) => (
                    <div key={prop.property_id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2">
                      <div>
                        <p className="text-sm font-semibold">{prop.display_name}</p>
                        <p className="text-xs text-white/40">{prop.account}</p>
                      </div>
                      <span className="text-xs font-mono text-white/40">{prop.property_id}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Per-Site Results */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h3 className="font-bold text-sm mb-4">Per-Site Results</h3>
              <div className="space-y-3">
                {result.results?.map((r, i) => (
                  <div key={i} className={`rounded-xl border p-4 ${r.skipped ? "border-white/5 bg-white/[0.01]" : "border-white/10 bg-white/[0.03]"}`}>
                    {r.skipped ? (
                      <div className="flex items-center gap-2 text-white/40 text-sm">
                        <XCircle className="w-4 h-4" />
                        <span className="font-mono">{r.site}</span>
                        <span className="text-xs">— {r.reason}</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 min-w-0">
                            <Globe className="w-4 h-4 text-[#00a2ff] flex-shrink-0" />
                            <a href={r.sitemap} target="_blank" rel="noopener noreferrer" className="text-sm font-mono font-semibold text-[#00a2ff] hover:underline truncate">
                              {r.domain}
                            </a>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-white/50">{r.url_count} URLs</span>
                            <StatusBadge ok={r.index_now?.central?.ok || r.index_now?.yandex?.ok} label="IndexNow" />
                            <StatusBadge ok={r.search_console?.ok} label="GSC" />
                          </div>
                        </div>
                        {r.search_console?.error && (
                          <p className="text-xs text-red-400/70">GSC error: {r.search_console.error}</p>
                        )}
                        {r.sample_urls?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {r.sample_urls.slice(0, 3).map((u, j) => (
                              <span key={j} className="text-[10px] font-mono text-white/30 bg-white/5 px-2 py-0.5 rounded truncate max-w-[200px]">
                                {u.replace("https://", "")}
                              </span>
                            ))}
                            {r.url_count > 3 && <span className="text-[10px] text-white/30">+{r.url_count - 3} more</span>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Info Panel */}
        {!result && !loading && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-3">
            <h3 className="font-bold text-sm">What this does — all in one click:</h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm text-white/60">
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-[#22c55e] mt-0.5 flex-shrink-0" />
                <span><b className="text-white">Sitemap Generation</b> — builds XML sitemaps for every live site with all static, location, and generated page URLs</span>
              </div>
              <div className="flex items-start gap-2">
                <Search className="w-4 h-4 text-[#a855f7] mt-0.5 flex-shrink-0" />
                <span><b className="text-white">Search Console Submission</b> — adds each site as a property and submits its sitemap via the GSC API</span>
              </div>
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-[#f59e0b] mt-0.5 flex-shrink-0" />
                <span><b className="text-white">IndexNow Ping</b> — pings Bing, Yandex, and central IndexNow with every URL for instant discovery</span>
              </div>
              <div className="flex items-start gap-2">
                <BarChart3 className="w-4 h-4 text-[#ec4899] mt-0.5 flex-shrink-0" />
                <span><b className="text-white">GA4 Property Listing</b> — lists all existing GA4 properties so you can see what's tracked</span>
              </div>
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
      <p className="text-2xl font-extrabold">{value ?? 0}</p>
      <p className="text-xs text-white/40 mt-0.5">{label}</p>
    </div>
  );
}

function StatusBadge({ ok, label }) {
  if (ok === true) return <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 font-semibold">{label} ✓</span>;
  if (ok === false) return <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 font-semibold">{label} ✗</span>;
  return <span className="px-2 py-0.5 rounded bg-white/5 text-white/40 font-semibold">{label} —</span>;
}