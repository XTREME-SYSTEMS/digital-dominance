import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Rocket, Play, Pause, Zap, Loader2, RefreshCw, CheckCircle2,
  AlertCircle, Globe, MapPin, Infinity as InfinityIcon,
  Layers, TrendingUp, Sheet, Database, Target, Sparkles,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminSystemPage from "@/components/launch-engine-admin/AdminSystemPage";
import TemplateRenderCard from "@/components/launch-control/TemplateRenderCard";
import { NATIONAL_CITIES, REGIONS, HIGH_PRIORITY_CITIES } from "@/data/nationalCities";

export default function LaunchControlCenter() {
  const queryClient = useQueryClient();
  const [selectedTemplateIds, setSelectedTemplateIds] = useState(new Set());
  const [selectedCities, setSelectedCities] = useState(
    new Set(HIGH_PRIORITY_CITIES.map((c) => `${c.city}, ${c.state}`))
  );
  const [regionFilter, setRegionFilter] = useState("all");
  const [nicheFilter, setNicheFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [infiniteMode, setInfiniteMode] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState(null);
  const [batchCount, setBatchCount] = useState(0);
  const infiniteRef = useRef(null);

  // ── Load templates ──
  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ["launch-control-templates"],
    queryFn: async () => {
      const res = await base44.entities.TemplateLibrary.filter(
        { is_active: true, status: "active", category: "homepage" },
        { sort: "sort_order", limit: 100 }
      );
      return res.items || res || [];
    },
  });
  const templates = templatesData || [];

  // ── Load site bank stats ──
  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ["launch-control-stats"],
    queryFn: async () => (await base44.functions.invoke("siteBankOrchestrator", { action: "getStats" })).data,
    refetchInterval: 5000,
  });
  const stats = statsData?.stats || {};

  // ── Load recent sites for queue view ──
  const { data: recentSitesData } = useQuery({
    queryKey: ["launch-control-recent"],
    queryFn: async () => {
      const res = await base44.entities.SiteBank.filter(
        {},
        { sort: "-launched_at", limit: 30 }
      );
      return res.items || res || [];
    },
    refetchInterval: 5000,
  });
  const recentSites = recentSitesData || [];

  // ── Deploy count per template ──
  const deployCounts = {};
  for (const s of recentSites) {
    if (s.template_id) deployCounts[s.template_id] = (deployCounts[s.template_id] || 0) + 1;
  }

  // ── Filtered templates ──
  const filteredTemplates = templates.filter((t) => {
    if (nicheFilter !== "all" && t.niche !== nicheFilter) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.niche?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const niches = [...new Set(templates.map((t) => t.niche).filter(Boolean))].sort();

  // ── Toggle template selection ──
  const toggleTemplate = (template) => {
    setSelectedTemplateIds((prev) => {
      const next = new Set(prev);
      if (next.has(template.id)) next.delete(template.id);
      else next.add(template.id);
      return next;
    });
  };

  const selectAll = () => setSelectedTemplateIds(new Set(filteredTemplates.map((t) => t.id)));
  const deselectAll = () => setSelectedTemplateIds(new Set());

  // ── Toggle city selection ──
  const toggleCity = (cityKey) => {
    setSelectedCities((prev) => {
      const next = new Set(prev);
      if (next.has(cityKey)) next.delete(cityKey);
      else next.add(cityKey);
      return next;
    });
  };

  const selectRegion = (region) => {
    const regionCities = NATIONAL_CITIES.filter((c) => c.region === region).map((c) => `${c.city}, ${c.state}`);
    setSelectedCities((prev) => new Set([...prev, ...regionCities]));
  };

  // ── Launch a batch ──
  const launchBatch = useCallback(async () => {
    const templateIds = Array.from(selectedTemplateIds);
    const locations = Array.from(selectedCities).map((key) => {
      const [city, state] = key.split(", ");
      return { city, state };
    });

    if (templateIds.length === 0) {
      setError("Select at least one template to launch.");
      return;
    }
    if (locations.length === 0) {
      setError("Select at least one city to target.");
      return;
    }

    setLaunching(true);
    setError(null);
    try {
      const batchId = `control-${Date.now()}`;
      const res = await base44.functions.invoke("siteBankOrchestrator", {
        action: "launchBatch",
        template_ids: templateIds,
        locations,
        batch_id: batchId,
      });
      setLastResult(res.data);
      setBatchCount((c) => c + 1);
      refetchStats();
      queryClient.invalidateQueries({ queryKey: ["launch-control-recent"] });
    } catch (e) {
      setError(e.message || "Launch failed.");
    } finally {
      setLaunching(false);
    }
  }, [selectedTemplateIds, selectedCities, refetchStats, queryClient]);

  // ── Infinite mode loop ──
  useEffect(() => {
    if (!infiniteMode) {
      if (infiniteRef.current) clearTimeout(infiniteRef.current);
      return;
    }
    const runInfinite = async () => {
      await launchBatch();
      infiniteRef.current = setTimeout(runInfinite, 10000); // 10s between batches
    };
    runInfinite();
    return () => {
      if (infiniteRef.current) clearTimeout(infiniteRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [infiniteMode]);

  // ── Sync to Google Sheets ──
  const syncToSheets = async () => {
    setSyncing(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("backlinkSheetsLogger", {
        action: "syncSiteInventory",
      });
      setLastResult({ sheetsSync: res.data });
    } catch (e) {
      // Fallback: try a direct sync
      try {
        const allSites = await base44.entities.SiteBank.filter(
          { status: { $ne: "archived" } },
          { sort: "-launched_at", limit: 500 }
        );
        const sites = allSites.items || allSites || [];
        setLastResult({
          sheetsSync: {
            message: "Retrieved site inventory for sync",
            total_sites: sites.length,
            live: sites.filter((s) => s.status === "live" || s.status === "synced").length,
          },
        });
      } catch (e2) {
        setError(e2.message || "Sheet sync failed.");
      }
    } finally {
      setSyncing(false);
    }
  };

  // ── Queue progress ──
  const queued = recentSites.filter((s) => s.status === "queued").length;
  const deploying = recentSites.filter((s) => s.status === "deploying").length;
  const live = recentSites.filter((s) => s.status === "live" || s.status === "synced").length;
  const totalSites = stats.total_sites || 0;
  const totalLive = stats.live_sites || 0;
  const totalBacklinks = stats.total_backlinks || 0;

  return (
    <AdminSystemPage
      eyebrow="CENTRAL COMMAND · V1"
      title="Launch Control Center"
      description="Master control for bulk website deployment. Select templates, choose cities, launch at infinite scale."
      badge="◈ LIVE COMMAND"
      stats={[
        ["Total Sites", String(totalSites)],
        ["Live Sites", String(totalLive)],
        ["Backlinks", String(totalBacklinks)],
        ["Templates", String(templates.length)],
      ]}
    >
      {/* ── Control Bar ── */}
      <div className="rounded-xl border-2 border-[#126fc8]/20 bg-gradient-to-r from-[#126fc8]/5 to-transparent p-4 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${infiniteMode ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
            <span className="text-sm font-bold text-[#112940]">
              {infiniteMode ? "INFINITE MODE ACTIVE" : "Manual Mode"}
            </span>
            {batchCount > 0 && (
              <span className="text-xs text-[#607790]">
                {batchCount} batch{batchCount !== 1 ? "es" : ""} launched this session
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Infinite toggle */}
            <button
              onClick={() => setInfiniteMode(!infiniteMode)}
              disabled={launching && !infiniteMode}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${
                infiniteMode
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-gradient-to-r from-[#126fc8] to-[#309afb] text-white hover:opacity-90"
              } disabled:opacity-50`}
            >
              {infiniteMode ? <Pause className="h-4 w-4" /> : <InfinityIcon className="h-4 w-4" />}
              {infiniteMode ? "STOP INFINITE" : "INFINITE MODE"}
            </button>

            {/* Manual launch */}
            <button
              onClick={launchBatch}
              disabled={launching || infiniteMode || selectedTemplateIds.size === 0}
              className="flex items-center gap-2 rounded-lg bg-[#16a34a] px-4 py-2 text-sm font-bold text-white hover:bg-[#15803d] transition disabled:opacity-50"
            >
              {launching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
              Launch {selectedTemplateIds.size} × {selectedCities.size} = {selectedTemplateIds.size * selectedCities.size} sites
            </button>

            {/* Sheets sync */}
            <button
              onClick={syncToSheets}
              disabled={syncing}
              className="flex items-center gap-2 rounded-lg border border-[#dce6f1] bg-white px-4 py-2 text-sm font-bold text-[#112940] hover:border-[#126fc8] transition disabled:opacity-50"
            >
              {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sheet className="h-4 w-4 text-green-600" />}
              Sync to Sheets
            </button>

            <button
              onClick={() => { refetchStats(); queryClient.invalidateQueries({ queryKey: ["launch-control-recent"] }); }}
              className="flex items-center gap-2 rounded-lg border border-[#dce6f1] bg-white px-3 py-2 text-sm font-bold text-[#607790] hover:border-[#126fc8] transition"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Queue Progress ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <QueueCard label="Queued" value={queued} icon={Layers} color="text-amber-600" bg="bg-amber-50" />
        <QueueCard label="Deploying" value={deploying} icon={Loader2} color="text-blue-600" bg="bg-blue-50" />
        <QueueCard label="Live (recent)" value={live} icon={CheckCircle2} color="text-green-600" bg="bg-green-50" />
        <QueueCard label="Total Backlinks" value={totalBacklinks} icon={TrendingUp} color="text-[#126fc8]" bg="bg-[#126fc8]/5" />
      </div>

      {/* Progress bar */}
      <div className="rounded-xl border border-[#dce6f1] bg-white p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-[#607790] uppercase tracking-wider">Deployment Pipeline</span>
          <span className="text-xs font-mono text-[#112940]">
            {totalLive} / {totalSites} live ({totalSites > 0 ? Math.round((totalLive / totalSites) * 100) : 0}%)
          </span>
        </div>
        <div className="h-3 rounded-full bg-[#e4edf5] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#126fc8] to-[#309afb] transition-all duration-500"
            style={{ width: `${totalSites > 0 ? (totalLive / totalSites) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* ── Last result ── */}
      {lastResult && !lastResult.sheetsSync && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <h3 className="text-sm font-bold text-green-800">Batch Launched Successfully</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <ResultStat label="Sites Created" value={lastResult.sites_created} />
            <ResultStat label="Backlinks Built" value={lastResult.backlinks_built} />
            <ResultStat label="GPT Sync Events" value={lastResult.gpt_sync_events} />
            <ResultStat label="Skipped (existing)" value={lastResult.sites_skipped_existing} />
          </div>
        </div>
      )}
      {lastResult?.sheetsSync && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-4 mb-4">
          <div className="flex items-center gap-2">
            <Sheet className="h-4 w-4 text-green-600" />
            <span className="text-sm font-bold text-green-800">
              {lastResult.sheetsSync.message || "Synced"} — {lastResult.sheetsSync.total_sites || 0} sites ({lastResult.sheetsSync.live || 0} live)
            </span>
          </div>
        </div>
      )}

      {/* ── Template Library ── */}
      <div className="rounded-xl border border-[#dce6f1] bg-white p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#112940] flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#126fc8]" />
            Template Library
            <span className="text-xs font-normal text-[#607790]">
              {filteredTemplates.length} templates · {selectedTemplateIds.size} selected
            </span>
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={selectAll} className="text-xs font-bold text-[#126fc8] hover:underline">
              Select All
            </button>
            <span className="text-[#dce6f1]">|</span>
            <button onClick={deselectAll} className="text-xs font-bold text-[#607790] hover:underline">
              Clear
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 px-3 rounded-lg bg-[#f8fbfe] border border-[#dce6f1] text-sm text-[#112940] outline-none focus:border-[#126fc8] w-48"
          />
          <select
            value={nicheFilter}
            onChange={(e) => setNicheFilter(e.target.value)}
            className="h-9 px-3 rounded-lg bg-[#f8fbfe] border border-[#dce6f1] text-sm text-[#112940] outline-none focus:border-[#126fc8]"
          >
            <option value="all">All Niches</option>
            {niches.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {/* Template grid */}
        {templatesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#126fc8]" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredTemplates.map((t) => (
              <TemplateRenderCard
                key={t.id}
                template={t}
                selected={selectedTemplateIds.has(t.id)}
                onToggle={toggleTemplate}
                deployed={deployCounts[t.id] || 0}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── City Targeting ── */}
      <div className="rounded-xl border border-[#dce6f1] bg-white p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#112940] flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#126fc8]" />
            Target Cities
            <span className="text-xs font-normal text-[#607790]">{selectedCities.size} selected</span>
          </h3>
          <div className="flex items-center gap-2">
            {REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => selectRegion(r)}
                className="text-[10px] font-bold text-[#126fc8] bg-[#126fc8]/10 px-2 py-1 rounded hover:bg-[#126fc8]/20 transition"
              >
                + {r}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
          {NATIONAL_CITIES.map((c) => {
            const key = `${c.city}, ${c.state}`;
            const active = selectedCities.has(key);
            return (
              <button
                key={key}
                onClick={() => toggleCity(key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "bg-[#126fc8] text-white"
                    : "bg-[#f8fbfe] text-[#607790] border border-[#dce6f1] hover:border-[#126fc8]/50"
                }`}
              >
                {active && <CheckCircle2 className="h-3 w-3" />}
                {c.city}, {c.state}
                {c.priority === "high" && !active && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Recent Queue ── */}
      <div className="rounded-xl border border-[#dce6f1] bg-white p-4">
        <h3 className="text-sm font-bold text-[#112940] flex items-center gap-2 mb-3">
          <Globe className="h-4 w-4 text-[#126fc8]" />
          Recent Launch Queue
          <span className="text-xs font-normal text-[#607790]">{recentSites.length} recent</span>
        </h3>
        {recentSites.length === 0 ? (
          <div className="text-center py-8 text-sm text-[#607790]">No sites yet. Launch a batch to see them appear here.</div>
        ) : (
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {recentSites.slice(0, 20).map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-lg border border-[#e4edf5] bg-[#f8fbfe] px-3 py-2">
                <span className={`h-2 w-2 rounded-full shrink-0 ${
                  s.status === "live" || s.status === "synced" ? "bg-green-500" :
                  s.status === "deploying" ? "bg-blue-500 animate-pulse" :
                  s.status === "queued" ? "bg-amber-400" : "bg-gray-300"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#112940] truncate">{s.site_name}</p>
                  <p className="text-[10px] text-[#607790] truncate">{s.site_url}</p>
                </div>
                <span className="text-[10px] font-bold text-[#607790] capitalize shrink-0">{s.status}</span>
                {s.site_url && (s.status === "live" || s.status === "synced") && (
                  <a
                    href={s.site_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-[#126fc8] hover:underline shrink-0"
                  >
                    Visit →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Infinite mode warning ── */}
      {infiniteMode && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#126fc8] to-[#309afb] px-5 py-3 text-white shadow-2xl">
          <div className="h-3 w-3 rounded-full bg-white animate-pulse" />
          <div>
            <p className="text-sm font-bold">Infinite Mode Running</p>
            <p className="text-[10px] opacity-80">
              {selectedTemplateIds.size} templates × {selectedCities.size} cities = {selectedTemplateIds.size * selectedCities.size} sites/batch
            </p>
          </div>
          <button
            onClick={() => setInfiniteMode(false)}
            className="ml-2 rounded-lg bg-white/20 px-3 py-1 text-xs font-bold hover:bg-white/30"
          >
            STOP
          </button>
        </div>
      )}
    </AdminSystemPage>
  );
}

function QueueCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className={`rounded-xl border border-[#dce6f1] ${bg} p-4`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#607790]">{label}</span>
      </div>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function ResultStat({ label, value }) {
  return (
    <div className="text-center">
      <p className="text-xl font-extrabold text-green-700">{value}</p>
      <p className="text-[10px] text-green-600">{label}</p>
    </div>
  );
}