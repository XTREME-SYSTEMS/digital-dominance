import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Smartphone, Globe, ExternalLink, Loader2, CheckCircle2, AlertCircle,
  Clock, Search, RefreshCw, Settings, Rocket, Activity,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import AdminSystemPage from "@/components/launch-engine-admin/AdminSystemPage";

export default function PwaLaunchDashboard() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | published | building | failed

  const { data: builds = [], isLoading } = useQuery({
    queryKey: ["pwa-launch-dashboard"],
    queryFn: async () => {
      const page = await base44.entities.AppBuild.filter({ platform: "pwa" }, { sort: "-created_date", limit: 100 });
      return page.items || [];
    },
    refetchInterval: 15000, // auto-refresh every 15s
  });

  const filtered = builds.filter((b) => {
    const matchesSearch =
      !search ||
      b.app_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.app_slug?.toLowerCase().includes(search.toLowerCase()) ||
      b.published_url?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || b.status === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: builds.length,
    published: builds.filter((b) => b.status === "published").length,
    building: builds.filter((b) => b.status === "building" || b.status === "built").length,
    failed: builds.filter((b) => b.status === "failed").length,
  };

  return (
    <AdminSystemPage
      eyebrow="PWA FACTORY · LAUNCH DASHBOARD"
      title="PWA Launch Dashboard"
      description="Every site launched via the PWA App Factory — deployment state, indexing progress, and live management links."
      badge="◈ LIVE TRACKING"
      stats={[
        ["Total PWA Sites", String(stats.total)],
        ["Published Live", String(stats.published)],
        ["In Progress", String(stats.building)],
        ["Failed", String(stats.failed)],
      ]}
    >
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-[#607790]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, slug, or URL..."
            className="flex-1 h-9 px-3 rounded-lg border border-[#e4e4e7] text-sm text-[#112940] focus:border-[#126fc8] outline-none"
          />
        </div>
        <div className="flex gap-1.5">
          {["all", "published", "building", "failed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 h-9 rounded-lg text-xs font-bold border capitalize ${
                filter === f
                  ? "border-[#126fc8] text-[#126fc8] bg-[#126fc8]/5"
                  : "border-[#e4e4e7] text-[#607790] bg-white hover:border-[#126fc8]/40"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ["pwa-launch-dashboard"] })}
          className="h-9 px-3 rounded-lg border border-[#e4e4e7] text-xs font-bold text-[#607790] bg-white hover:border-[#126fc8]/40 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Builds Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#126fc8]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-[#607790]">
          <Smartphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No PWA sites found. Launch one from the PWA App Factory.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#e4edf5]">
          <table className="w-full text-sm">
            <thead className="bg-[#f8fbfe] border-b border-[#e4edf5]">
              <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-[#607790]">
                <th className="px-4 py-3">App Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Published URL</th>
                <th className="px-4 py-3">Indexing</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4edf5]">
              {filtered.map((b) => {
                const isPublished = b.status === "published";
                const isBuilding = b.status === "building" || b.status === "built";
                const isFailed = b.status === "failed";
                return (
                  <tr key={b.id} className="hover:bg-[#f8fbfe] transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-8 h-8 rounded-lg border border-[#e4e4e7] grid place-items-center shrink-0"
                          style={{ background: b.manifest?.theme_color || "#126fc8" }}
                        >
                          <Smartphone className="w-4 h-4 text-white" />
                        </span>
                        <div>
                          <p className="font-bold text-[#112940]">{b.app_name}</p>
                          <p className="text-[10px] font-mono text-[#8faec9]">/{b.app_slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3">
                      {b.published_url ? (
                        <a
                          href={b.published_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-bold text-[#126fc8] hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {b.published_url.replace("https://", "").slice(0, 35)}...
                        </a>
                      ) : (
                        <span className="text-xs text-[#8faec9]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isPublished ? (
                        <span className="flex items-center gap-1 text-xs text-[#16a34a]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Submitted
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-[#8faec9]">
                          <Clock className="w-3.5 h-3.5" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#607790]">
                      {b.created_date ? new Date(b.created_date).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {b.published_url && (
                          <a
                            href={b.published_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-7 px-2.5 rounded-lg bg-[#126fc8]/10 text-[#126fc8] text-xs font-bold hover:bg-[#126fc8]/20 flex items-center gap-1"
                          >
                            <Globe className="w-3 h-3" /> Open
                          </a>
                        )}
                        <button
                          onClick={() => {
                            window.location.href = `/admin/pwa-factory?load=${b.id}`;
                          }}
                          className="h-7 px-2.5 rounded-lg bg-gray-100 text-[#607790] text-xs font-bold hover:bg-gray-200 flex items-center gap-1"
                        >
                          <Settings className="w-3 h-3" /> Manage
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Info panel */}
      <div className="mt-4 rounded-lg border border-[#dce6f1] bg-[#f8fbfe] p-4">
        <div className="flex items-start gap-3">
          <Activity className="w-5 h-5 text-[#126fc8] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-[#112940]">Auto-Refresh Active</p>
            <p className="text-xs text-[#607790] mt-1">
              This dashboard refreshes every 15 seconds. Every new PWA launch automatically
              registers its Google Search Console property and submits to Google indexers.
              Click "Manage" to load any build back into the PWA App Factory for editing.
            </p>
          </div>
        </div>
      </div>
    </AdminSystemPage>
  );
}

function StatusBadge({ status }) {
  const styles = {
    published: "bg-green-100 text-green-700 border-green-200",
    building: "bg-blue-100 text-blue-700 border-blue-200",
    built: "bg-blue-100 text-blue-700 border-blue-200",
    queued: "bg-gray-100 text-gray-600 border-gray-200",
    failed: "bg-red-100 text-red-700 border-red-200",
  };
  const icons = {
    published: CheckCircle2,
    building: Loader2,
    built: Clock,
    queued: Clock,
    failed: AlertCircle,
  };
  const Icon = icons[status] || Clock;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${styles[status] || styles.queued}`}
    >
      <Icon className={`w-3 h-3 ${status === "building" ? "animate-spin" : ""}`} />
      {status}
    </span>
  );
}