import React, { useState, useEffect } from "react";
import { Rocket, Shield, Brain, Globe, TrendingUp, Loader2, Check, X, ExternalLink, Zap, Activity, MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function SiteCommandCenter() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [sites, setSites] = useState([]);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.MassLaunchBatch.filter({}, { sort: '-created_date', limit: 50 });
      setBatches(res.items || res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectBatch = async (batch) => {
    setSelectedBatch(batch);
    setSitesLoading(true);
    setValidationResult(null);
    try {
      const res = await base44.entities.WebsiteQueue.filter(
        { id: { $in: batch.queue_item_ids || [] } },
        { sort: '-created_date', limit: 500 }
      );
      setSites(res.items || res);
    } catch (err) {
      console.error(err);
    } finally {
      setSitesLoading(false);
    }
  };

  const validateBatch = async () => {
    if (!selectedBatch) return;
    setValidating(true);
    try {
      const res = await base44.functions.invoke("siteLaunchValidator", { batchId: selectedBatch.batch_id });
      setValidationResult(res.data);
      // Refresh sites
      const sres = await base44.entities.WebsiteQueue.filter(
        { id: { $in: selectedBatch.queue_item_ids || [] } },
        { sort: '-created_date', limit: 500 }
      );
      setSites(sres.items || sres);
    } catch (err) {
      console.error(err);
    } finally {
      setValidating(false);
    }
  };

  const enhanceSite = async (site) => {
    try {
      await base44.functions.invoke("optimizeSeo", {
        url: site.generated_url || site.domain,
        city: site.target_city,
        state: site.target_state,
      });
      // Refresh
      selectBatch(selectedBatch);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const totalSites = batches.reduce((sum, b) => sum + (b.total_sites || 0), 0);
  const totalDeployed = batches.reduce((sum, b) => sum + (b.sites_deployed || 0), 0);
  const totalValidated = batches.reduce((sum, b) => sum + (b.sites_validated || 0), 0);
  const avgScore = batches.length > 0
    ? Math.round(batches.reduce((sum, b) => sum + (b.average_google_score || 0), 0) / batches.length)
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-stone-950 via-amber-950 to-stone-900 p-6 text-white border border-amber-500/30">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 grid place-items-center">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Site Command Center</h1>
            <p className="text-stone-400 text-sm">Every launched site — locations, validation, analytics, agents, Google scores</p>
          </div>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Rocket} label="Total Sites" value={totalSites} color="amber" />
        <StatCard icon={Globe} label="Deployed" value={totalDeployed} color="emerald" />
        <StatCard icon={Check} label="Validated" value={totalValidated} color="blue" />
        <StatCard icon={TrendingUp} label="Avg Google Score" value={`${avgScore}/100`} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Batch List */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-sm font-bold text-stone-800">Launch Batches</h2>
          {batches.length === 0 ? (
            <div className="rounded-xl border border-stone-200 bg-white p-6 text-center text-sm text-stone-500">
              No batches yet. Launch sites from the Mass Launch Console.
            </div>
          ) : (
            batches.map((b) => (
              <button
                key={b.id}
                onClick={() => selectBatch(b)}
                className={`w-full text-left rounded-xl border p-4 transition ${
                  selectedBatch?.id === b.id
                    ? "border-amber-500 bg-amber-50"
                    : "border-stone-200 bg-white hover:border-stone-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-stone-800">{b.template_name || b.template_key}</span>
                  <StatusBadge status={b.status} />
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {(b.selected_states || []).slice(0, 6).map((s) => (
                    <span key={s} className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold text-stone-600">{s}</span>
                  ))}
                  {(b.selected_states || []).length > 6 && (
                    <span className="text-[10px] text-stone-400">+{(b.selected_states || []).length - 6}</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span>{b.total_sites} sites</span>
                  <span className="font-bold text-amber-600">{b.average_google_score || 0}/100</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-stone-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all"
                    style={{ width: `${Math.min(100, ((b.sites_deployed || 0) / Math.max(1, b.total_sites)) * 100)}%` }}
                  />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Site Details */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedBatch ? (
            <div className="rounded-xl border border-stone-200 bg-white p-12 text-center text-stone-400">
              <Globe className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Select a batch to view all launched sites</p>
            </div>
          ) : (
            <>
              {/* Batch header */}
              <div className="rounded-xl border border-stone-200 bg-white p-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-stone-800">{selectedBatch.template_name}</h2>
                  <p className="text-xs text-stone-500">
                    {selectedBatch.total_sites} sites · {selectedBatch.sites_deployed || 0} deployed · {selectedBatch.sites_validated || 0} validated
                  </p>
                </div>
                <button
                  onClick={validateBatch}
                  disabled={validating}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-stone-900 hover:bg-amber-400 disabled:opacity-40 flex items-center gap-2"
                >
                  {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                  Validate & Score All
                </button>
              </div>

              {/* Validation result */}
              {validationResult && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="h-5 w-5 text-emerald-600" />
                    <span className="font-bold text-emerald-800">
                      {validationResult.passed}/{validationResult.total_sites} passed · Avg {validationResult.average_google_score}/100
                    </span>
                  </div>
                  <p className="text-sm text-emerald-700">{validationResult.message}</p>
                </div>
              )}

              {/* Sites list */}
              {sitesLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                </div>
              ) : (
                <div className="space-y-2">
                  {sites.map((site) => {
                    const score = site.traffic_score || 0;
                    const scoreColor = score >= 90 ? "text-emerald-600" : score >= 70 ? "text-amber-600" : "text-red-500";
                    const url = site.generated_url || (site.domain ? `https://${site.domain}` : null);
                    return (
                      <div key={site.id} className="rounded-xl border border-stone-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <MapPin className="h-4 w-4 text-stone-400 shrink-0" />
                              <span className="font-bold text-stone-800 text-sm">{site.target_city}, {site.target_state}</span>
                              <SiteStatusBadge status={site.status} />
                            </div>
                            <p className="text-xs text-stone-500 truncate">{site.keyword}</p>
                            {url && (
                              <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1">
                                {url} <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            {site.assigned_agent && (
                              <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
                                <Brain className="h-3 w-3" /> Agent: {site.assigned_agent}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <div className={`text-2xl font-black ${scoreColor}`}>{score}</div>
                            <div className="text-[10px] text-stone-400 font-semibold uppercase">Google Score</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-stone-100">
                          <div className="flex items-center gap-3 text-xs">
                            <ScorePill label="SEO" value={site.seo_score} />
                            <ScorePill label="AEO" value={site.aeo_score} />
                            <ScorePill label="Traffic" value={site.traffic_score} />
                          </div>
                          <button
                            onClick={() => enhanceSite(site)}
                            className="ml-auto rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-bold text-amber-600 hover:bg-amber-50 flex items-center gap-1"
                          >
                            <Zap className="h-3 w-3" /> Enhance
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-200",
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <Icon className="h-5 w-5 mb-2" />
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs font-semibold opacity-70">{label}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    queued: "bg-stone-100 text-stone-600",
    orchestrating: "bg-blue-100 text-blue-700",
    deploying: "bg-amber-100 text-amber-700",
    validating: "bg-purple-100 text-purple-700",
    scoring: "bg-indigo-100 text-indigo-700",
    complete: "bg-emerald-100 text-emerald-700",
    failed: "bg-red-100 text-red-700",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${styles[status] || styles.queued}`}>{status}</span>;
}

function SiteStatusBadge({ status }) {
  const styles = {
    queued: "bg-stone-100 text-stone-500",
    researching: "bg-blue-100 text-blue-600",
    generating: "bg-amber-100 text-amber-700",
    deploying: "bg-orange-100 text-orange-700",
    live: "bg-emerald-100 text-emerald-700",
    monitoring: "bg-emerald-100 text-emerald-700",
    optimizing: "bg-purple-100 text-purple-700",
    archived: "bg-stone-100 text-stone-400",
  };
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${styles[status] || styles.queued}`}>{status}</span>;
}

function ScorePill({ label, value }) {
  const v = value || 0;
  const color = v >= 80 ? "text-emerald-600" : v >= 60 ? "text-amber-600" : "text-red-500";
  return (
    <span className="flex items-center gap-1">
      <span className="text-stone-400 font-semibold">{label}:</span>
      <span className={`font-bold ${color}`}>{v}</span>
    </span>
  );
}