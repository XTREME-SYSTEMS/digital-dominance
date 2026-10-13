import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Globe, Smartphone, LayoutGrid, Server, Activity, CheckCircle2,
  AlertCircle, Loader2, Clock, XCircle, Search, RefreshCw,
  ExternalLink, Zap, TrendingUp, Shield, MapPin,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import AdminSystemPage from "@/components/launch-engine-admin/AdminSystemPage";

// ── Status helpers ──────────────────────────────────────────────────────
const DEPLOY_STYLES = {
  deployed: "bg-green-50 text-[#16a34a] border-green-200",
  published: "bg-green-50 text-[#16a34a] border-green-200",
  live: "bg-green-50 text-[#16a34a] border-green-200",
  monitoring: "bg-emerald-50 text-emerald-700 border-emerald-200",
  deploying: "bg-blue-50 text-[#126fc8] border-blue-200",
  building: "bg-blue-50 text-[#126fc8] border-blue-200",
  built: "bg-amber-50 text-[#d97706] border-amber-200",
  queued: "bg-gray-100 text-gray-500 border-gray-200",
  generating: "bg-indigo-50 text-indigo-600 border-indigo-200",
  researching: "bg-indigo-50 text-indigo-600 border-indigo-200",
  failed: "bg-red-50 text-red-600 border-red-200",
  pending: "bg-gray-100 text-gray-500 border-gray-200",
};

const HEALTH_STYLES = {
  healthy: { color: "#16a34a", icon: CheckCircle2, label: "Healthy" },
  degraded: { color: "#d97706", icon: AlertCircle, label: "Degraded" },
  unhealthy: { color: "#dc2626", icon: XCircle, label: "Unhealthy" },
  unknown: { color: "#8faec9", icon: Clock, label: "Unknown" },
};

function DeployBadge({ status }) {
  const cls = DEPLOY_STYLES[status] || DEPLOY_STYLES.queued;
  const Icon = status === "deploying" || status === "building" || status === "generating"
    ? Loader2
    : status === "failed"
    ? AlertCircle
    : status === "live" || status === "deployed" || status === "published" || status === "monitoring"
    ? CheckCircle2
    : Clock;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>
      <Icon className={`w-3 h-3 ${status === "deploying" || status === "building" || status === "generating" ? "animate-spin" : ""}`} />
      {status}
    </span>
  );
}

function HealthBadge({ status, score }) {
  const h = HEALTH_STYLES[status] || HEALTH_STYLES.unknown;
  const Icon = h.icon;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold" style={{ color: h.color }}>
      <Icon className="w-3 h-3" /> {h.label}
      {score > 0 && <span className="ml-0.5">({score})</span>}
    </span>
  );
}

function IndexBadge({ submitted }) {
  return submitted ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#16a34a]">
      <CheckCircle2 className="w-3 h-3" /> Submitted
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8faec9]">
      <Clock className="w-3 h-3" /> Pending
    </span>
  );
}

// ── Source icon ─────────────────────────────────────────────────────────
const SOURCE_ICONS = {
  pwa: Smartphone,
  template: LayoutGrid,
  mass_launch: Globe,
  canonical: Server,
};
const SOURCE_COLORS = {
  pwa: "#126fc8",
  template: "#7c3aed",
  mass_launch: "#0d9488",
  canonical: "#d97706",
};
const SOURCE_LABELS = {
  pwa: "PWA Factory",
  template: "Template Studio",
  mass_launch: "Mass Launch",
  canonical: "Canonical",
};

export default function SiteInventory() {
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // ── Pull from all four site sources in parallel ─────────────────────
  const { data: pwaBuilds = [], isLoading: pwaLoading } = useQuery({
    queryKey: ["inventory-pwa"],
    queryFn: async () => {
      const page = await base44.entities.AppBuild.filter({ platform: "pwa" }, { sort: "-created_date", limit: 200 });
      return (page.items || []).map((b) => ({
        id: b.id,
        name: b.app_name,
        slug: b.app_slug,
        source: "pwa",
        status: b.status,
        url: b.published_url,
        healthStatus: b.status === "published" ? "healthy" : "unknown",
        healthScore: b.status === "published" ? 100 : 0,
        indexingSubmitted: b.status === "published",
        createdAt: b.created_date,
        meta: `${b.manifest?.display || "standalone"} · ${b.nav_config?.length || 0} nav`,
      }));
    },
    refetchInterval: 15000,
  });

  const { data: templateDeploys = [], isLoading: tplLoading } = useQuery({
    queryKey: ["inventory-template-deploys"],
    queryFn: async () => {
      const page = await base44.entities.DeploymentRecord.filter(
        { target_environment: "vercel", status: { $in: ["deployed", "deploying", "failed", "monitoring"] } },
        { sort: "-deployed_at", limit: 200 }
      );
      return (page.items || []).map((d) => ({
        id: d.id,
        name: d.task_description?.replace("Template Studio deploy: ", "") || "Template Site",
        slug: d.deployment_id,
        source: "template",
        status: d.status,
        url: d.vercel_url,
        healthStatus: d.health_status || "unknown",
        healthScore: d.health_score || 0,
        indexingSubmitted: d.status === "deployed",
        createdAt: d.created_at,
        deployedAt: d.deployed_at,
        meta: d.target_environment,
      }));
    },
    refetchInterval: 15000,
  });

  const { data: massLaunchSites = [], isLoading: mlLoading } = useQuery({
    queryKey: ["inventory-mass-launch"],
    queryFn: async () => {
      const page = await base44.entities.WebsiteQueue.filter(
        { status: { $in: ["live", "monitoring", "deploying", "generating", "optimizing"] } },
        { sort: "-deployed_at", limit: 500 }
      );
      return (page.items || []).map((s) => ({
        id: s.id,
        name: `${s.target_city || s.keyword || "Site"}, ${s.target_state || ""}`,
        slug: s.domain || s.keyword,
        source: "mass_launch",
        status: s.status,
        url: s.generated_url,
        healthStatus: s.status === "live" ? "healthy" : s.status === "monitoring" ? "healthy" : "unknown",
        healthScore: s.traffic_score || 0,
        indexingSubmitted: s.status === "live" || s.status === "monitoring",
        createdAt: s.deployed_at,
        meta: `${s.niche} · SEO ${s.seo_score || 0}/100`,
      }));
    },
    refetchInterval: 15000,
  });

  const { data: canonicalSites = [], isLoading: canonLoading } = useQuery({
    queryKey: ["inventory-canonical"],
    queryFn: async () => {
      const page = await base44.entities.CanonicalSiteRegistry.filter({}, { limit: 100 });
      return (page.items || []).map((c) => ({
        id: c.id,
        name: c.canonical_domain,
        slug: c.canonical_domain,
        source: "canonical",
        status: c.active_environment === "production" ? "live" : "pending",
        url: `https://${c.canonical_domain}`,
        healthStatus: c.current_health_score > 70 ? "healthy" : c.current_health_score > 0 ? "degraded" : "unknown",
        healthScore: c.current_health_score || 0,
        indexingSubmitted: !!c.google_search_console_property,
        createdAt: c.last_source_truth_sync,
        meta: `GSC: ${c.google_search_console_property ? "✓" : "✗"} · GA4: ${c.ga4_property_id ? "✓" : "✗"}`,
      }));
    },
    refetchInterval: 15000,
  });

  const allSites = useMemo(
    () => [...pwaBuilds, ...templateDeploys, ...massLaunchSites, ...canonicalSites],
    [pwaBuilds, templateDeploys, massLaunchSites, canonicalSites]
  );

  const filtered = useMemo(() => {
    return allSites.filter((s) => {
      if (sourceFilter !== "all" && s.source !== sourceFilter) return false;
      if (statusFilter !== "all") {
        if (statusFilter === "live" && !["live", "deployed", "published", "monitoring"].includes(s.status)) return false;
        if (statusFilter === "building" && !["building", "deploying", "generating", "researching", "built", "queued"].includes(s.status)) return false;
        if (statusFilter === "failed" && s.status !== "failed") return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return s.name?.toLowerCase().includes(q) || s.slug?.toLowerCase().includes(q) || s.url?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allSites, sourceFilter, statusFilter, search]);

  // ── Summary stats ────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const live = allSites.filter((s) => ["live", "deployed", "published", "monitoring"].includes(s.status)).length;
    const building = allSites.filter((s) => ["building", "deploying", "generating", "researching", "built", "queued"].includes(s.status)).length;
    const failed = allSites.filter((s) => s.status === "failed").length;
    const healthy = allSites.filter((s) => s.healthStatus === "healthy").length;
    return { total: allSites.length, live, building, failed, healthy };
  }, [allSites]);

  const isLoading = pwaLoading || tplLoading || mlLoading || canonLoading;

  return (
    <AdminSystemPage
      eyebrow="CENTRALIZED FLEET · LIVE"
      title="Site Inventory"
      description="Every launched site across PWA Factory, Template Studio, Mass Launch, and Canonical domains — deployment, indexing, and live health in one place."
      badge="◈ LIVE FLEET"
      stats={[
        ["Total sites", String(stats.total)],
        ["Live now", String(stats.live)],
        ["Healthy", String(stats.healthy)],
        ["Building", String(stats.building)],
      ]}
    >
      {/* Source breakdown cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { key: "pwa", count: pwaBuilds.length, loading: pwaLoading },
          { key: "template", count: templateDeploys.length, loading: tplLoading },
          { key: "mass_launch", count: massLaunchSites.length, loading: mlLoading },
          { key: "canonical", count: canonicalSites.length, loading: canonLoading },
        ].map(({ key, count, loading }) => {
          const Icon = SOURCE_ICONS[key];
          const color = SOURCE_COLORS[key];
          return (
            <button
              key={key}
              onClick={() => setSourceFilter(sourceFilter === key ? "all" : key)}
              className={`rounded-lg border p-3 flex items-center gap-3 transition ${
                sourceFilter === key ? "border-[#126fc8] bg-[#126fc8]/5" : "border-[#dce6f1] bg-white hover:border-[#126fc8]/40"
              }`}
            >
              <div className="w-9 h-9 rounded-lg grid place-items-center shrink-0" style={{ background: color + "15", color }}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <div className="text-left">
                <p className="text-xl font-extrabold text-[#112940] leading-none">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : count}
                </p>
                <p className="text-[10px] text-[#607790] mt-1">{SOURCE_LABELS[key]}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-[#8faec9] shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, slug, or URL..."
            className="flex-1 h-9 px-3 rounded-lg border border-[#dce6f1] text-sm text-[#112940] focus:border-[#126fc8] outline-none"
          />
        </div>
        <div className="flex gap-1.5">
          {["all", "live", "building", "failed"].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 h-9 rounded-lg text-xs font-bold border capitalize ${
                statusFilter === f
                  ? "border-[#126fc8] text-[#126fc8] bg-[#126fc8]/5"
                  : "border-[#e4e4e7] text-[#607790] bg-white hover:border-[#126fc8]/40"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#8faec9]">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "3s" }} />
          Auto-refresh 15s
        </div>
      </div>

      {/* Unified site table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#126fc8]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#607790]">
          <Globe className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No sites found matching your filters.</p>
          <p className="text-xs mt-1">Launch sites from the PWA App Factory, Template Studio, or Mass Launch Console to see them here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#e4edf5]">
          <table className="w-full text-sm">
            <thead className="bg-[#f8fbfe] border-b border-[#e4edf5]">
              <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-[#607790]">
                <th className="px-4 py-3">Site</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Deployment</th>
                <th className="px-4 py-3">Indexing</th>
                <th className="px-4 py-3">Health</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4edf5]">
              {filtered.map((s) => {
                const SrcIcon = SOURCE_ICONS[s.source];
                const srcColor = SOURCE_COLORS[s.source];
                return (
                  <tr key={`${s.source}-${s.id}`} className="hover:bg-[#f8fbfe] transition">
                    {/* Site name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg grid place-items-center shrink-0" style={{ background: srcColor + "15", color: srcColor }}>
                          <SrcIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[#112940] truncate">{s.name}</p>
                          <p className="text-[10px] font-mono text-[#8faec9] truncate">{s.meta}</p>
                        </div>
                      </div>
                    </td>
                    {/* Source */}
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: srcColor + "15", color: srcColor }}>
                        {SOURCE_LABELS[s.source]}
                      </span>
                    </td>
                    {/* Deployment status */}
                    <td className="px-4 py-3">
                      <DeployBadge status={s.status} />
                    </td>
                    {/* Indexing */}
                    <td className="px-4 py-3">
                      <IndexBadge submitted={s.indexingSubmitted} />
                    </td>
                    {/* Health */}
                    <td className="px-4 py-3">
                      <HealthBadge status={s.healthStatus} score={s.healthScore} />
                    </td>
                    {/* Created */}
                    <td className="px-4 py-3 text-xs text-[#607790]">
                      {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "—"}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {s.url && (
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-7 px-2.5 rounded-lg bg-[#126fc8]/10 text-[#126fc8] text-xs font-bold hover:bg-[#126fc8]/20 flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" /> Open
                          </a>
                        )}
                        {s.source === "pwa" && (
                          <Link
                            to="/admin/pwa-factory"
                            className="h-7 px-2.5 rounded-lg bg-gray-100 text-[#607790] text-xs font-bold hover:bg-gray-200 flex items-center gap-1"
                          >
                            <Smartphone className="w-3 h-3" /> Edit
                          </Link>
                        )}
                        {s.source === "mass_launch" && (
                          <Link
                            to={`/admin/site-project/${s.id}`}
                            className="h-7 px-2.5 rounded-lg bg-gray-100 text-[#607790] text-xs font-bold hover:bg-gray-200 flex items-center gap-1"
                          >
                            <MapPin className="w-3 h-3" /> View
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer info */}
      <div className="mt-4 rounded-lg border border-[#dce6f1] bg-[#f8fbfe] p-4">
        <div className="flex items-start gap-3">
          <Activity className="w-5 h-5 text-[#126fc8] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-[#112940]">Centralized Fleet Monitoring</p>
            <p className="text-xs text-[#607790] mt-1">
              This page aggregates every launched site from all deployment sources. Data auto-refreshes every 15 seconds.
              Every new publish triggers Google Search Console registration, sitemap generation, and indexer submission automatically.
            </p>
            <div className="flex flex-wrap gap-3 mt-3">
              <Link to="/admin/pwa-factory" className="text-xs font-bold text-[#126fc8] hover:underline flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5" /> PWA Factory
              </Link>
              <Link to="/admin" className="text-xs font-bold text-[#126fc8] hover:underline flex items-center gap-1">
                <LayoutGrid className="w-3.5 h-3.5" /> Template Studio
              </Link>
              <Link to="/admin/mass-launch" className="text-xs font-bold text-[#126fc8] hover:underline flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> Mass Launch
              </Link>
              <Link to="/admin/launch-status" className="text-xs font-bold text-[#126fc8] hover:underline flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Launch Status
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminSystemPage>
  );
}