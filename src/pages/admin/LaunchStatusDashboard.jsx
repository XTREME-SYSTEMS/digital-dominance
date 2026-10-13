import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Rocket, Globe, CheckCircle2, AlertCircle, Loader2, Search,
  TrendingUp, Zap, ExternalLink, ChevronDown, ChevronRight,
  Activity, Target, Award, RefreshCw, MapPin, Clock, BarChart3,
  Search as SearchIcon, Eye, MousePointerClick,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import AdminSystemPage from "@/components/launch-engine-admin/AdminSystemPage";

const BATCH_STATUS_COLORS = {
  queued: "bg-gray-100 text-gray-700 border-gray-200",
  orchestrating: "bg-blue-50 text-[#126fc8] border-blue-200",
  deploying: "bg-indigo-50 text-indigo-700 border-indigo-200",
  validating: "bg-amber-50 text-[#d97706] border-amber-200",
  scoring: "bg-purple-50 text-purple-700 border-purple-200",
  complete: "bg-green-50 text-[#16a34a] border-green-200",
  failed: "bg-red-50 text-red-600 border-red-200",
};

const SITE_STATUS_COLORS = {
  queued: "bg-gray-100 text-gray-600",
  researching: "bg-blue-50 text-[#126fc8]",
  generating: "bg-indigo-50 text-indigo-600",
  deploying: "bg-amber-50 text-[#d97706]",
  live: "bg-green-50 text-[#16a34a]",
  monitoring: "bg-emerald-50 text-emerald-700",
  optimizing: "bg-purple-50 text-purple-700",
  archived: "bg-gray-100 text-gray-500",
};

export default function LaunchStatusDashboard() {
  const [expandedBatch, setExpandedBatch] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ["mass-launch-batches"],
    queryFn: async () => {
      const page = await base44.entities.MassLaunchBatch.filter({}, { sort: "-created_at", limit: 100 });
      return page.items || [];
    },
    refetchInterval: 10000,
  });

  const { data: allSites = [] } = useQuery({
    queryKey: ["launch-dashboard-sites"],
    queryFn: async () => {
      const page = await base44.entities.WebsiteQueue.filter(
        { status: { $in: ["queued", "generating", "deploying", "live", "monitoring"] } },
        { sort: "-deployed_at", limit: 500 }
      );
      return page.items || [];
    },
    refetchInterval: 10000,
  });

  const filtered = batches.filter((b) => {
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        b.batch_id?.toLowerCase().includes(q) ||
        b.template_name?.toLowerCase().includes(q) ||
        b.template_key?.toLowerCase().includes(q) ||
        b.domain_base?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalSites = batches.reduce((s, b) => s + (b.total_sites || 0), 0);
  const totalDeployed = batches.reduce((s, b) => s + (b.sites_deployed || 0), 0);
  const totalValidated = batches.reduce((s, b) => s + (b.sites_validated || 0), 0);
  const totalFailed = batches.reduce((s, b) => s + (b.sites_failed || 0), 0);
  const liveSites = allSites.filter((s) => s.status === "live" || s.status === "monitoring").length;
  const avgScore = batches.length > 0
    ? Math.round(batches.reduce((s, b) => s + (b.average_google_score || 0), 0) / batches.length)
    : 0;
  const activeBatches = batches.filter((b) => ["orchestrating", "deploying", "validating", "scoring", "queued"].includes(b.status)).length;

  // GSC fleet stats — pulled by the autonomous agent
  const gscIndexed = allSites.filter((s) => s.indexing_status === "INDEXING_STATE_INDEXED" || s.indexing_status === "INDEXED").length;
  const gscPending = allSites.filter((s) => s.indexing_status && s.indexing_status !== "INDEXING_STATE_INDEXED" && s.indexing_status !== "INDEXED" && s.indexing_status !== "UNKNOWN").length;
  const totalImpressions = allSites.reduce((s, site) => s + (site.search_impressions || 0), 0);
  const totalClicks = allSites.reduce((s, site) => s + (site.search_clicks || 0), 0);

  const sitesForBatch = (batch) => {
    const ids = batch.queue_item_ids || [];
    if (ids.length === 0) return [];
    return allSites.filter((s) => ids.includes(s.id));
  };

  const progressPct = (b) => {
    if (!b.total_sites) return 0;
    return Math.min(100, Math.round(((b.sites_built || 0) / b.total_sites) * 100));
  };

  return (
    <AdminSystemPage
      eyebrow="FLEET TELEMETRY · LIVE"
      title="Launch Status Dashboard"
      description="Real-time tracking of every mass site launch — deployment state, indexing progress, and live URLs across the entire fleet."
      badge="◈ LIVE MONITOR"
      stats={[
        ["Active batches", String(activeBatches)],
        ["Total sites launched", String(totalDeployed)],
        ["Live & monitoring", String(liveSites)],
        ["Avg Google score", avgScore + "/100"],
      ]}
    >
      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        <SummaryCard icon={Rocket} label="Total Batches" value={batches.length} color="#126fc8" />
        <SummaryCard icon={Globe} label="Total Sites" value={totalSites} color="#7c3aed" />
        <SummaryCard icon={CheckCircle2} label="Deployed" value={totalDeployed} color="#16a34a" />
        <SummaryCard icon={Activity} label="Live Now" value={liveSites} color="#0d9488" />
        <SummaryCard icon={SearchIcon} label="GSC Indexed" value={gscIndexed} color="#16a34a" />
        <SummaryCard icon={BarChart3} label="Search Impressions" value={totalImpressions.toLocaleString()} color="#d97706" />
      </div>

      {/* GSC performance strip */}
      {(totalImpressions > 0 || totalClicks > 0 || gscIndexed > 0) && (
        <div className="rounded-lg border border-[#dce6f1] bg-gradient-to-r from-[#f8fbfe] to-[#f0f7ff] p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <SearchIcon className="w-4 h-4 text-[#126fc8]" />
            <h3 className="text-sm font-bold text-[#112940]">Google Search Console — Fleet Performance</h3>
            <span className="text-[10px] text-[#8faec9] ml-auto">Auto-pulled by autonomous agent</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <GscMetric icon={CheckCircle2} label="Indexed Sites" value={gscIndexed} color="#16a34a" />
            <GscMetric icon={Clock} label="Pending Index" value={gscPending} color="#d97706" />
            <GscMetric icon={Eye} label="Impressions (28d)" value={totalImpressions.toLocaleString()} color="#126fc8" />
            <GscMetric icon={MousePointerClick} label="Clicks (28d)" value={totalClicks.toLocaleString()} color="#7c3aed" />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-[#8faec9] shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by batch ID, template, or domain..."
            className="flex-1 h-9 px-3 rounded-lg border border-[#dce6f1] text-sm text-[#112940] focus:border-[#126fc8] outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border border-[#dce6f1] text-sm text-[#112940] focus:border-[#126fc8] outline-none bg-white"
        >
          <option value="all">All Statuses</option>
          <option value="queued">Queued</option>
          <option value="orchestrating">Orchestrating</option>
          <option value="deploying">Deploying</option>
          <option value="validating">Validating</option>
          <option value="scoring">Scoring</option>
          <option value="complete">Complete</option>
          <option value="failed">Failed</option>
        </select>
        <div className="flex items-center gap-1.5 text-xs text-[#8faec9]">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "3s" }} />
          Auto-refresh 10s
        </div>
        <Link to="/admin/mass-launch" className="wle-action" style={{ background: "#16a34a" }}>
          <Rocket className="w-4 h-4" /> New Launch
        </Link>
      </div>

      {/* Batch list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#607790]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#607790]">
          <Rocket className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No launch batches found. Start a new mass launch to see live tracking here.</p>
          <Link to="/admin/mass-launch" className="inline-flex items-center gap-1.5 mt-3 text-[#126fc8] font-bold text-sm hover:underline">
            <Rocket className="w-4 h-4" /> Go to Mass Launch Console
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => {
            const expanded = expandedBatch === b.id;
            const sites = expanded ? sitesForBatch(b) : [];
            const pct = progressPct(b);
            const isActive = ["orchestrating", "deploying", "validating", "scoring"].includes(b.status);
            return (
              <div key={b.id} className="rounded-lg border border-[#dce6f1] bg-white overflow-hidden">
                {/* Batch header */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => setExpandedBatch(expanded ? null : b.id)}
                      className="mt-1 text-[#8faec9] hover:text-[#112940] shrink-0"
                    >
                      {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-bold text-[#112940]">{b.template_name || b.template_key}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${BATCH_STATUS_COLORS[b.status] || BATCH_STATUS_COLORS.queued}`}>
                          {b.status}
                        </span>
                        {isActive && (
                          <span className="flex items-center gap-1 text-[10px] text-[#126fc8] font-bold">
                            <Loader2 className="w-3 h-3 animate-spin" /> {b.current_step || "processing"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#607790] flex-wrap">
                        <span className="font-mono">{b.batch_id?.slice(0, 24)}…</span>
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" /> {b.domain_base || "—"}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {(b.selected_states || []).length} states · {(b.selected_cities || []).length} cities
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {b.created_at ? new Date(b.created_at).toLocaleString() : "—"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-extrabold text-[#112940]">{b.sites_deployed || 0}<span className="text-sm text-[#8faec9]">/{b.total_sites || 0}</span></p>
                      <p className="text-[10px] text-[#607790] uppercase tracking-wider">Deployed</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] text-[#607790] mb-1">
                      <span>Build progress</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${b.status === "failed" ? "bg-red-400" : b.status === "complete" ? "bg-[#16a34a]" : "bg-gradient-to-r from-[#126fc8] to-[#0d9488]"}`}
                        style={{ width: pct + "%" }}
                      />
                    </div>
                  </div>

                  {/* Sub-stats */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3">
                    <MiniStat label="Built" value={b.sites_built || 0} color="#126fc8" />
                    <MiniStat label="Validated" value={b.sites_validated || 0} color="#16a34a" />
                    <MiniStat label="Scored" value={b.sites_scored || 0} color="#7c3aed" />
                    <MiniStat label="Failed" value={b.sites_failed || 0} color="#dc2626" />
                    <MiniStat label="Avg Score" value={(b.average_google_score || 0) + "/100"} color="#d97706" />
                  </div>
                </div>

                {/* Expanded site list */}
                {expanded && (
                  <div className="border-t border-[#e4edf5] bg-[#f8fbfe] p-4">
                    <h4 className="text-xs font-bold text-[#5b7288] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5" /> Individual Sites ({sites.length})
                    </h4>
                    {sites.length === 0 ? (
                      <p className="text-sm text-[#607790] py-4 text-center">No site records found for this batch.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-80 overflow-y-auto">
                        {sites.map((s) => (
                          <div key={s.id} className="flex items-center gap-3 rounded-lg bg-white border border-[#e4edf5] px-3 py-2">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${SITE_STATUS_COLORS[s.status] || "bg-gray-100 text-gray-600"}`}>
                              {s.status}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-[#112940] truncate">
                                {s.target_city}, {s.target_state}
                              </p>
                              <p className="text-[10px] text-[#8faec9] font-mono truncate">{s.domain}</p>
                            </div>
                            {/* GSC indexing badge */}
                            {s.indexing_status && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                s.indexing_status === "INDEXING_STATE_INDEXED" || s.indexing_status === "INDEXED"
                                  ? "bg-green-50 text-[#16a34a]"
                                  : "bg-amber-50 text-[#d97706]"
                              }`} title={s.indexing_status}>
                                {s.indexing_status === "INDEXING_STATE_INDEXED" || s.indexing_status === "INDEXED" ? "Indexed" : "Pending"}
                              </span>
                            )}
                            {/* GSC search performance */}
                            {(s.search_impressions > 0 || s.search_clicks > 0) && (
                              <span className="text-[9px] text-[#607790] shrink-0 flex items-center gap-1.5">
                                <span className="flex items-center gap-0.5" title="Impressions"><Eye className="w-2.5 h-2.5" />{s.search_impressions || 0}</span>
                                <span className="flex items-center gap-0.5" title="Clicks"><MousePointerClick className="w-2.5 h-2.5" />{s.search_clicks || 0}</span>
                              </span>
                            )}
                            {s.traffic_score > 0 && (
                              <span className="text-[10px] font-bold text-[#d97706] shrink-0">{s.traffic_score}/100</span>
                            )}
                            {s.generated_url && (
                              <a
                                href={s.generated_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[10px] text-[#126fc8] font-bold hover:underline shrink-0"
                              >
                                <ExternalLink className="w-3 h-3" /> Open
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminSystemPage>
  );
}

function SummaryCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-lg border border-[#dce6f1] bg-white p-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg grid place-items-center shrink-0" style={{ background: color + "15", color }}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div>
        <p className="text-xl font-extrabold text-[#112940] leading-none">{value}</p>
        <p className="text-[10px] text-[#607790] mt-1">{label}</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div className="rounded-lg bg-gray-50 border border-[#e4edf5] px-2.5 py-1.5 text-center">
      <p className="text-sm font-extrabold" style={{ color }}>{value}</p>
      <p className="text-[9px] text-[#607790] uppercase tracking-wider">{label}</p>
    </div>
  );
}

function GscMetric({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-white border border-[#e4edf5] px-3 py-2">
      <div className="w-7 h-7 rounded-lg grid place-items-center shrink-0" style={{ background: color + "15", color }}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div>
        <p className="text-base font-extrabold text-[#112940] leading-none">{value}</p>
        <p className="text-[9px] text-[#607790] mt-0.5">{label}</p>
      </div>
    </div>
  );
}