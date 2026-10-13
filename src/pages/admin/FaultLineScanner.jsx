import React, { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search, Zap, Loader2, AlertCircle, Target, Bug, Globe, Shield,
  TrendingUp, CheckCircle2, XCircle, DollarSign, Brain, ExternalLink,
  Filter, ChevronDown, ChevronRight, Camera, Wrench, AlertTriangle,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";

const SEVERITY_COLORS = {
  critical: "text-red-400 bg-red-500/10 border-red-500/30",
  high: "text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/30",
  medium: "text-[#00a2ff] bg-[#00a2ff]/10 border-[#00a2ff]/30",
  low: "text-white/60 bg-white/5 border-white/10",
};

const CATEGORY_ICONS = {
  security: Shield,
  performance: TrendingUp,
  seo: Search,
  functionality: Bug,
  content: Globe,
  visual: Camera,
  interaction: Wrench,
  infrastructure: Globe,
  conversion: Target,
  accessibility: CheckCircle2,
};

export default function FaultLineScanner() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [singleUrl, setSingleUrl] = useState("");
  const [sentinel, setSentinel] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [expandedFindings, setExpandedFindings] = useState(new Set());

  const { data: findings = [], isLoading: findingsLoading } = useQuery({
    queryKey: ["faultline-findings"],
    queryFn: async () => {
      const page = await base44.entities.FaultLineFinding.filter({}, { sort: "-found_at", limit: 100 });
      return page.items || [];
    },
  });

  const runScan = useCallback(async (mode) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const payload = { mode, sentinel };
      if (mode === "site" && singleUrl) payload.url = singleUrl;
      const res = await base44.functions.invoke("faultLineScanner", payload);
      setResult(res.data);
      queryClient.invalidateQueries({ queryKey: ["faultline-findings"] });
    } catch (e) {
      setError(e.message || "Scan failed");
    } finally {
      setLoading(false);
    }
  }, [singleUrl, sentinel, queryClient]);

  const toggleExpand = (id) => {
    setExpandedFindings((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateStatus = async (id, status) => {
    await base44.entities.FaultLineFinding.update(id, { status });
    queryClient.invalidateQueries({ queryKey: ["faultline-findings"] });
  };

  const filtered = findings.filter((f) => {
    if (filterSeverity !== "all" && f.severity !== filterSeverity) return false;
    if (filterCategory !== "all" && f.category !== filterCategory) return false;
    return true;
  });

  const totalImpact = findings.reduce((s, f) => s + (f.annual_impact_max || 0), 0);
  const criticalCount = findings.filter((f) => f.severity === "critical").length;
  const highCount = findings.filter((f) => f.severity === "high").length;
  const openCount = findings.filter((f) => f.status === "open").length;

  return (
    <div className="min-h-screen bg-[#050508] text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00a2ff] to-[#0066cc] flex items-center justify-center">
            <Bug className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">FaultLine Scanner</h1>
            <p className="text-sm text-white/50">Autonomous deep problem discovery — cloud browser + forensic audit + sentinel root-cause analysis</p>
          </div>
        </div>

        {/* Scan Controls */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 md:items-end">
            <div className="flex-1">
              <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 block">Single Site URL (optional)</label>
              <input
                value={singleUrl}
                onChange={(e) => setSingleUrl(e.target.value)}
                placeholder="https://example.com — leave blank to scan all deployed sites"
                className="w-full bg-[#0a1220] border border-white/10 rounded-xl px-4 py-3 text-sm font-semibold focus:border-[#00a2ff] outline-none"
              />
            </div>
            <button
              onClick={() => runScan(singleUrl ? "site" : "all")}
              disabled={loading}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#00a2ff] to-[#0066cc] text-white font-bold text-sm flex items-center gap-2 hover:brightness-110 transition disabled:opacity-50 min-w-[200px] justify-center neon-green-hover"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
              {loading ? "Scanning..." : "Run Fault Line Scan"}
            </button>
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sentinel}
              onChange={(e) => setSentinel(e.target.checked)}
              className="w-5 h-5 rounded border-white/20 bg-[#0a1220] text-[#00a2ff] focus:ring-[#00a2ff] cursor-pointer"
            />
            <span className="text-sm font-semibold">
              Sentinel root-cause analysis + dollar impact quantification
              <span className="text-white/40 font-normal ml-2">— AI analyzes each finding for root cause, exact repair, and annual revenue impact</span>
            </span>
          </label>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/5 border border-red-500/20 rounded-xl p-3">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard icon={Bug} label="Total Findings" value={findings.length} color="#ef4444" />
          <StatCard icon={AlertTriangle} label="Critical" value={criticalCount} color="#dc2626" />
          <StatCard icon={AlertCircle} label="High Severity" value={highCount} color="#f97316" />
          <StatCard icon={DollarSign} label="Max Annual Impact" value={"$" + (totalImpact || 0).toLocaleString()} color="#22c55e" />
          <StatCard icon={CheckCircle2} label="Open Issues" value={openCount} color="#00a2ff" />
        </div>

        {/* Scan Result */}
        {result?.ok && (
          <div className="rounded-2xl border border-[#00a2ff]/20 bg-[#00a2ff]/5 p-6 space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
              Scan Complete — {result.scan_id}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-white/40">Sites Scanned:</span> <b>{result.sites_scanned}</b></div>
              <div><span className="text-white/40">Findings:</span> <b>{result.total_findings}</b></div>
              <div><span className="text-white/40">Saved:</span> <b>{result.saved_findings}</b></div>
              <div><span className="text-white/40">Elapsed:</span> <b>{(result.elapsed_ms / 1000).toFixed(1)}s</b></div>
            </div>
            {result.total_annual_impact_max > 0 && (
              <div className="text-sm text-[#22c55e]">
                <DollarSign className="w-4 h-4 inline" />
                Estimated max annual revenue impact: <b>${result.total_annual_impact_max.toLocaleString()}</b>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        {findings.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="w-4 h-4 text-white/40" />
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-[#0a1220] border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-[#00a2ff] outline-none"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-[#0a1220] border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-[#00a2ff] outline-none"
            >
              <option value="all">All Categories</option>
              <option value="security">Security</option>
              <option value="performance">Performance</option>
              <option value="seo">SEO</option>
              <option value="functionality">Functionality</option>
              <option value="content">Content</option>
              <option value="visual">Visual</option>
              <option value="conversion">Conversion</option>
              <option value="accessibility">Accessibility</option>
              <option value="infrastructure">Infrastructure</option>
            </select>
            <span className="text-sm text-white/40">{filtered.length} of {findings.length} findings</span>
          </div>
        )}

        {/* Findings List */}
        {findingsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-white/40" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            <Bug className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No findings yet. Run a scan to discover problems across your sites.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((f) => {
              const CatIcon = CATEGORY_ICONS[f.category] || Bug;
              const expanded = expandedFindings.has(f.id);
              return (
                <div key={f.id} className={"rounded-xl border p-4 " + (SEVERITY_COLORS[f.severity] || "border-white/10 bg-white/[0.02]")}>
                  <div className="flex items-start gap-3">
                    <button onClick={() => toggleExpand(f.id)} className="mt-1 text-white/40 hover:text-white">
                      {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <CatIcon className="w-5 h-5 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold">{f.title}</span>
                        <span className={"text-[10px] font-bold px-2 py-0.5 rounded uppercase " + (SEVERITY_COLORS[f.severity] || "")}>{f.severity}</span>
                        <span className="text-[10px] text-white/40 px-2 py-0.5 rounded bg-white/5">{f.category}</span>
                        {f.status !== "open" && (
                          <span className="text-[10px] text-white/40 px-2 py-0.5 rounded bg-white/5">{f.status}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-white/40 mt-1">
                        <a href={f.site_url} target="_blank" rel="noopener noreferrer" className="font-mono hover:text-[#00a2ff] flex items-center gap-1">
                          <Globe className="w-3 h-3" />{f.site_url?.replace("https://", "")}
                        </a>
                        <span>{f.scan_source}</span>
                        {f.annual_impact_max > 0 && (
                          <span className="text-[#22c55e] flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />${f.annual_impact_max.toLocaleString()}/yr
                          </span>
                        )}
                      </div>

                      {expanded && (
                        <div className="mt-3 space-y-2 text-sm">
                          {f.evidence && (
                            <div className="rounded-lg bg-black/30 p-3 text-xs font-mono text-white/60">{f.evidence}</div>
                          )}
                          {f.root_cause && (
                            <div>
                              <p className="text-xs font-bold text-white/50 uppercase mb-1 flex items-center gap-1"><Brain className="w-3 h-3" /> Root Cause</p>
                              <p className="text-white/70 text-xs">{f.root_cause}</p>
                            </div>
                          )}
                          {f.recommended_repair && (
                            <div>
                              <p className="text-xs font-bold text-white/50 uppercase mb-1 flex items-center gap-1"><Wrench className="w-3 h-3" /> Recommended Repair</p>
                              <p className="text-white/70 text-xs">{f.recommended_repair}</p>
                            </div>
                          )}
                          {f.screenshot_uri && (
                            <div>
                              <Link to="#" onClick={(e) => { e.preventDefault(); window.open(f.screenshot_uri, "_blank"); }} className="text-xs text-[#00a2ff] flex items-center gap-1 hover:underline">
                                <Camera className="w-3 h-3" /> View screenshot evidence
                              </Link>
                            </div>
                          )}
                          <div className="flex items-center gap-2 pt-2">
                            {f.status === "open" && (
                              <button onClick={() => updateStatus(f.id, "acknowledged")} className="text-xs px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/60">Acknowledge</button>
                            )}
                            {f.status === "acknowledged" && (
                              <button onClick={() => updateStatus(f.id, "repairing")} className="text-xs px-3 py-1 rounded-lg bg-[#00a2ff]/10 hover:bg-[#00a2ff]/20 text-[#00a2ff]">Mark Repairing</button>
                            )}
                            {f.status !== "resolved" && (
                              <button onClick={() => updateStatus(f.id, "resolved")} className="text-xs px-3 py-1 rounded-lg bg-[#22c55e]/10 hover:bg-[#22c55e]/20 text-[#22c55e]">Resolve</button>
                            )}
                            {f.confidence > 0 && (
                              <span className="text-xs text-white/30 ml-auto">Confidence: {f.confidence}%</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info */}
        {!result && !loading && findings.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-3">
            <h3 className="font-bold text-sm">What FaultLine finds — in hard-to-find places:</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-white/60">
              <div className="flex items-start gap-2"><Shield className="w-4 h-4 text-red-400 mt-0.5 shrink-0" /><span><b className="text-white">Security holes</b> — missing CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy headers</span></div>
              <div className="flex items-start gap-2"><Bug className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" /><span><b className="text-white">Broken functionality</b> — invisible buttons, dead links, broken images, forms without action or submit handlers</span></div>
              <div className="flex items-start gap-2"><TrendingUp className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" /><span><b className="text-white">Performance killers</b> — slow load times, poor LCP, layout shift (CLS), oversized DOM</span></div>
              <div className="flex items-start gap-2"><Search className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" /><span><b className="text-white">SEO gaps</b> — missing title, meta description, H1 issues, no schema, no canonical, thin content</span></div>
              <div className="flex items-start gap-2"><Target className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" /><span><b className="text-white">Conversion leaks</b> — no lead form, form without handler, no call-to-action</span></div>
              <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" /><span><b className="text-white">Accessibility failures</b> — images without alt text, buttons without ARIA labels</span></div>
              <div className="flex items-start gap-2"><Brain className="w-4 h-4 text-[#a855f7] mt-0.5 shrink-0" /><span><b className="text-white">Sentinel root-cause analysis</b> — AI identifies the underlying technical cause and produces a specific repair recommendation with exact file paths</span></div>
              <div className="flex items-start gap-2"><DollarSign className="w-4 h-4 text-[#22c55e] mt-0.5 shrink-0" /><span><b className="text-white">Dollar impact quantification</b> — each finding gets an estimated annual revenue impact so you can prioritize by cost</span></div>
            </div>
            <div className="text-xs text-white/40 pt-2 border-t border-white/5">
              Synced with the Shadow agent — say "run fault line" or "scan for problems" in chat to trigger it from there.
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