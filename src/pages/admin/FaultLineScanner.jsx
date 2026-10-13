import React, { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search, Zap, Loader2, AlertCircle, Target, Bug, Globe, Shield,
  TrendingUp, CheckCircle2, XCircle, DollarSign, Brain, ExternalLink,
  Filter, ChevronDown, ChevronRight, Camera, Wrench, AlertTriangle,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import AdminSystemPage from "@/components/launch-engine-admin/AdminSystemPage";

const SEVERITY_COLORS = {
  critical: "text-red-600 bg-red-50 border-red-200",
  high: "text-[#d97706] bg-amber-50 border-amber-200",
  medium: "text-[#126fc8] bg-blue-50 border-blue-200",
  low: "text-[#607790] bg-gray-50 border-gray-200",
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
    <AdminSystemPage
      eyebrow="AUTONOMOUS DISCOVERY · V1"
      title="FaultLine Scanner"
      description="Autonomous deep problem discovery — cloud browser + forensic audit + sentinel root-cause analysis."
      badge="◈ ACTIVE SYSTEM"
      stats={[
        ["Total findings", String(findings.length)],
        ["Critical", String(criticalCount)],
        ["High severity", String(highCount)],
        ["Max annual impact", "$" + (totalImpact || 0).toLocaleString()],
      ]}
    >
      {/* Scan Controls */}
      <div className="rounded-lg border border-[#dce6f1] bg-white p-5 mb-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 md:items-end">
          <div className="flex-1">
            <label className="text-xs font-bold text-[#5b7288] uppercase tracking-wider mb-2 block">Single Site URL (optional)</label>
            <input
              value={singleUrl}
              onChange={(e) => setSingleUrl(e.target.value)}
              placeholder="https://example.com — leave blank to scan all deployed sites"
              className="w-full bg-white border border-[#dce6f1] rounded-lg px-4 py-3 text-sm font-semibold text-[#112940] focus:border-[#126fc8] outline-none"
            />
          </div>
          <button
            onClick={() => runScan(singleUrl ? "site" : "all")}
            disabled={loading}
            className="wle-action"
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
            className="w-5 h-5 rounded border-[#dce6f1] text-[#126fc8] focus:ring-[#126fc8] cursor-pointer"
          />
          <span className="text-sm font-semibold text-[#112940]">
            Sentinel root-cause analysis + dollar impact quantification
            <span className="text-[#607790] font-normal ml-2">— AI analyzes each finding for root cause, exact repair, and annual revenue impact</span>
          </span>
        </label>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
      </div>

      {/* Scan Result */}
      {result?.ok && (
        <div className="rounded-lg border border-[#126fc8]/30 bg-[#126fc8]/5 p-5 mb-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2 text-[#112940]">
            <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
            Scan Complete — {result.scan_id}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-[#607790]">Sites Scanned:</span> <b className="text-[#112940]">{result.sites_scanned}</b></div>
            <div><span className="text-[#607790]">Findings:</span> <b className="text-[#112940]">{result.total_findings}</b></div>
            <div><span className="text-[#607790]">Saved:</span> <b className="text-[#112940]">{result.saved_findings}</b></div>
            <div><span className="text-[#607790]">Elapsed:</span> <b className="text-[#112940]">{(result.elapsed_ms / 1000).toFixed(1)}s</b></div>
          </div>
          {result.total_annual_impact_max > 0 && (
            <div className="text-sm text-[#16a34a]">
              <DollarSign className="w-4 h-4 inline" />
              Estimated max annual revenue impact: <b>${result.total_annual_impact_max.toLocaleString()}</b>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      {findings.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Filter className="w-4 h-4 text-[#607790]" />
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-white border border-[#dce6f1] rounded-lg px-3 py-2 text-sm text-[#112940] focus:border-[#126fc8] outline-none"
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
            className="bg-white border border-[#dce6f1] rounded-lg px-3 py-2 text-sm text-[#112940] focus:border-[#126fc8] outline-none"
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
          <span className="text-sm text-[#607790]">{filtered.length} of {findings.length} findings</span>
        </div>
      )}

      {/* Findings List */}
      {findingsLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#607790]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#607790]">
          <Bug className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No findings yet. Run a scan to discover problems across your sites.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((f) => {
            const CatIcon = CATEGORY_ICONS[f.category] || Bug;
            const expanded = expandedFindings.has(f.id);
            return (
              <div key={f.id} className={"rounded-lg border p-4 " + (SEVERITY_COLORS[f.severity] || "border-[#dce6f1] bg-white")}>
                <div className="flex items-start gap-3">
                  <button onClick={() => toggleExpand(f.id)} className="mt-1 text-[#607790] hover:text-[#112940]">
                    {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <CatIcon className="w-5 h-5 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[#112940]">{f.title}</span>
                      <span className={"text-[10px] font-bold px-2 py-0.5 rounded uppercase " + (SEVERITY_COLORS[f.severity] || "")}>{f.severity}</span>
                      <span className="text-[10px] text-[#607790] px-2 py-0.5 rounded bg-gray-50">{f.category}</span>
                      {f.status !== "open" && (
                        <span className="text-[10px] text-[#607790] px-2 py-0.5 rounded bg-gray-50">{f.status}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#607790] mt-1">
                      <a href={f.site_url} target="_blank" rel="noopener noreferrer" className="font-mono hover:text-[#126fc8] flex items-center gap-1">
                        <Globe className="w-3 h-3" />{f.site_url?.replace("https://", "")}
                      </a>
                      <span>{f.scan_source}</span>
                      {f.annual_impact_max > 0 && (
                        <span className="text-[#16a34a] flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />${f.annual_impact_max.toLocaleString()}/yr
                        </span>
                      )}
                    </div>

                    {expanded && (
                      <div className="mt-3 space-y-2 text-sm">
                        {f.evidence && (
                          <div className="rounded-lg bg-gray-50 p-3 text-xs font-mono text-[#607790]">{f.evidence}</div>
                        )}
                        {f.root_cause && (
                          <div>
                            <p className="text-xs font-bold text-[#5b7288] uppercase mb-1 flex items-center gap-1"><Brain className="w-3 h-3" /> Root Cause</p>
                            <p className="text-[#112940] text-xs">{f.root_cause}</p>
                          </div>
                        )}
                        {f.recommended_repair && (
                          <div>
                            <p className="text-xs font-bold text-[#5b7288] uppercase mb-1 flex items-center gap-1"><Wrench className="w-3 h-3" /> Recommended Repair</p>
                            <p className="text-[#112940] text-xs">{f.recommended_repair}</p>
                          </div>
                        )}
                        {f.screenshot_uri && (
                          <div>
                            <Link to="#" onClick={(e) => { e.preventDefault(); window.open(f.screenshot_uri, "_blank"); }} className="text-xs text-[#126fc8] flex items-center gap-1 hover:underline">
                              <Camera className="w-3 h-3" /> View screenshot evidence
                            </Link>
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-2">
                          {f.status === "open" && (
                            <button onClick={() => updateStatus(f.id, "acknowledged")} className="text-xs px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#607790]">Acknowledge</button>
                          )}
                          {f.status === "acknowledged" && (
                            <button onClick={() => updateStatus(f.id, "repairing")} className="text-xs px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#126fc8]">Mark Repairing</button>
                          )}
                          {f.status !== "resolved" && (
                            <button onClick={() => updateStatus(f.id, "resolved")} className="text-xs px-3 py-1 rounded-lg bg-green-50 hover:bg-green-100 text-[#16a34a]">Resolve</button>
                          )}
                          {f.confidence > 0 && (
                            <span className="text-xs text-[#8faec9] ml-auto">Confidence: {f.confidence}%</span>
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
        <div className="mt-4">
          <h3 className="font-bold text-sm text-[#112940] mb-3">What FaultLine finds — in hard-to-find places:</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-[#5b7288]">
            <div className="flex items-start gap-2"><Shield className="w-4 h-4 text-red-500 mt-0.5 shrink-0" /><span><b className="text-[#112940]">Security holes</b> — missing CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy headers</span></div>
            <div className="flex items-start gap-2"><Bug className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" /><span><b className="text-[#112940]">Broken functionality</b> — invisible buttons, dead links, broken images, forms without action or submit handlers</span></div>
            <div className="flex items-start gap-2"><TrendingUp className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" /><span><b className="text-[#112940]">Performance killers</b> — slow load times, poor LCP, layout shift (CLS), oversized DOM</span></div>
            <div className="flex items-start gap-2"><Search className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" /><span><b className="text-[#112940]">SEO gaps</b> — missing title, meta description, H1 issues, no schema, no canonical, thin content</span></div>
            <div className="flex items-start gap-2"><Target className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" /><span><b className="text-[#112940]">Conversion leaks</b> — no lead form, form without handler, no call-to-action</span></div>
            <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /><span><b className="text-[#112940]">Accessibility failures</b> — images without alt text, buttons without ARIA labels</span></div>
            <div className="flex items-start gap-2"><Brain className="w-4 h-4 text-[#7c3aed] mt-0.5 shrink-0" /><span><b className="text-[#112940]">Sentinel root-cause analysis</b> — AI identifies the underlying technical cause and produces a specific repair recommendation with exact file paths</span></div>
            <div className="flex items-start gap-2"><DollarSign className="w-4 h-4 text-[#16a34a] mt-0.5 shrink-0" /><span><b className="text-[#112940]">Dollar impact quantification</b> — each finding gets an estimated annual revenue impact so you can prioritize by cost</span></div>
          </div>
        </div>
      )}
    </AdminSystemPage>
  );
}