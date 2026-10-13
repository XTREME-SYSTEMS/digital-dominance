import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Rocket, Link2, Tag, RefreshCw, Zap, Loader2, Globe, MapPin, CheckCircle2, Clock, TrendingUp, Database, Activity } from "lucide-react";

export default function SiteBankAutomation() {
  const queryClient = useQueryClient();
  const [launching, setLaunching] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [backlinking, setBacklinking] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [filterNiche, setFilterNiche] = useState("");
  const [filterState, setFilterState] = useState("");

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["site-bank-stats"],
    queryFn: async () => (await base44.functions.invoke("siteBankOrchestrator", { action: "getStats" })).data,
    refetchInterval: 15000,
  });

  const { data: sitesData, isLoading: sitesLoading } = useQuery({
    queryKey: ["site-bank-list", filterNiche, filterState],
    queryFn: async () => {
      const args = { action: "listSites", limit: 50 };
      if (filterNiche) args.niche = filterNiche;
      if (filterState) args.state = filterState;
      return (await base44.functions.invoke("siteBankOrchestrator", args)).data;
    },
    refetchInterval: 15000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["site-bank-stats"] });
    queryClient.invalidateQueries({ queryKey: ["site-bank-list"] });
  };

  const handleLaunch = async () => {
    setLaunching(true); setError(null); setResult(null);
    try {
      const res = await base44.functions.invoke("siteBankOrchestrator", { action: "launchBatch" });
      setResult(res.data);
      refresh();
    } catch (e) { setError(e.message); }
    finally { setLaunching(false); }
  };

  const handleSync = async () => {
    setSyncing(true); setError(null);
    try {
      const res = await base44.functions.invoke("siteBankOrchestrator", { action: "syncToGpt" });
      setResult({ sync_result: res.data });
      refresh();
    } catch (e) { setError(e.message); }
    finally { setSyncing(false); }
  };

  const handleBacklinks = async () => {
    setBacklinking(true); setError(null);
    try {
      const res = await base44.functions.invoke("siteBankOrchestrator", { action: "buildBacklinks", all: true });
      setResult({ backlink_result: res.data });
      refresh();
    } catch (e) { setError(e.message); }
    finally { setBacklinking(false); }
  };

  const stats = statsData?.stats || {};
  const byNiche = statsData?.by_niche || {};
  const byState = statsData?.by_state || {};
  const batches = statsData?.recent_batches || [];
  const sites = sitesData?.sites || [];

  return (
    <div className="wle-content" style={{ background: "var(--launch-admin-canvas)" }}>
      {/* Hero */}
      <div className="wle-hero">
        <div>
          <div className="wle-eyebrow">CREDIT-FREE AUTOMATION</div>
          <h1>Site Bank Automation</h1>
          <p>Deterministic autonomous launch system. No integration credits consumed — pure entity logic, backlink networks, tagging, and GPT sync. Runs on cron every 6 hours.</p>
        </div>
        <div className="wle-hero-badge">
          <Database className="h-5 w-5" style={{ color: "var(--launch-admin-primary)" }} />
          <span className="ml-2 text-sm font-bold" style={{ color: "var(--launch-admin-text)" }}>Zero Credits</span>
        </div>
      </div>

      {/* Stats */}
      <div className="wle-stats">
        <div className="wle-stat">
          <small>Total Sites</small>
          <strong>{stats.total_sites || 0}</strong>
        </div>
        <div className="wle-stat">
          <small>Live / Synced</small>
          <strong style={{ color: "var(--launch-admin-primary)" }}>{stats.synced_sites || 0}</strong>
        </div>
        <div className="wle-stat">
          <small>Total Backlinks</small>
          <strong>{stats.total_backlinks || 0}</strong>
        </div>
        <div className="wle-stat">
          <small>Avg Links/Site</small>
          <strong>{stats.avg_backlinks_per_site || 0}</strong>
        </div>
      </div>

      {/* Action buttons */}
      <div className="wle-panels">
        <section className="wle-panel" style={{ gridColumn: "1 / -1" }}>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button onClick={handleLaunch} disabled={launching}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 transition"
              style={{ background: "var(--launch-admin-primary)" }}>
              {launching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
              Launch New Batch
            </button>
            <button onClick={handleSync} disabled={syncing}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold disabled:opacity-50 transition border"
              style={{ borderColor: "var(--launch-admin-border)", color: "var(--launch-admin-text)" }}>
              {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Sync Unsynced to GPT
            </button>
            <button onClick={handleBacklinks} disabled={backlinking}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold disabled:opacity-50 transition border"
              style={{ borderColor: "var(--launch-admin-border)", color: "var(--launch-admin-text)" }}>
              {backlinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              Rebuild Backlink Network
            </button>
            <button onClick={refresh}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition border ml-auto"
              style={{ borderColor: "var(--launch-admin-border)", color: "var(--launch-admin-muted)" }}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>

          {error && (
            <div className="rounded-lg border p-3 text-sm mb-4" style={{ borderColor: "#fca5a5", background: "#fef2f2", color: "#dc2626" }}>
              {error}
            </div>
          )}

          {result && (
            <div className="rounded-lg border p-4 mb-4" style={{ borderColor: "var(--launch-admin-border)", background: "var(--launch-admin-surface)" }}>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4" style={{ color: "#16a34a" }} />
                <span className="text-sm font-bold" style={{ color: "var(--launch-admin-heading)" }}>Last Operation Result</span>
              </div>
              <pre className="text-xs font-mono whitespace-pre-wrap" style={{ color: "var(--launch-admin-muted)" }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          {/* By Niche breakdown */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="text-sm font-bold mb-2 flex items-center gap-1.5" style={{ color: "var(--launch-admin-heading)" }}>
                <Tag className="h-4 w-4" /> By Niche
              </h3>
              <div className="space-y-1.5">
                {Object.entries(byNiche).sort((a, b) => b[1].count - a[1].count).map(([niche, data]) => (
                  <div key={niche} className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs"
                    style={{ borderColor: "var(--launch-admin-border)", background: "var(--launch-admin-surface)" }}>
                    <span className="font-bold capitalize" style={{ color: "var(--launch-admin-text)" }}>
                      {niche.replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center gap-3" style={{ color: "var(--launch-admin-muted)" }}>
                      <span>{data.count} sites</span>
                      <span className="flex items-center gap-1"><Link2 className="h-3 w-3" />{data.backlinks}</span>
                      <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" style={{ color: "#16a34a" }} />{data.synced}</span>
                    </div>
                  </div>
                ))}
                {Object.keys(byNiche).length === 0 && (
                  <p className="text-xs text-center py-4" style={{ color: "var(--launch-admin-muted)" }}>No sites yet. Launch a batch to start.</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold mb-2 flex items-center gap-1.5" style={{ color: "var(--launch-admin-heading)" }}>
                <MapPin className="h-4 w-4" /> By State
              </h3>
              <div className="space-y-1.5">
                {Object.entries(byState).sort((a, b) => b[1].count - a[1].count).map(([state, data]) => (
                  <div key={state} className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs"
                    style={{ borderColor: "var(--launch-admin-border)", background: "var(--launch-admin-surface)" }}>
                    <span className="font-bold uppercase" style={{ color: "var(--launch-admin-text)" }}>{state}</span>
                    <div className="flex items-center gap-3" style={{ color: "var(--launch-admin-muted)" }}>
                      <span>{data.count} sites</span>
                      <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" style={{ color: "#16a34a" }} />{data.synced}</span>
                    </div>
                  </div>
                ))}
                {Object.keys(byState).length === 0 && (
                  <p className="text-xs text-center py-4" style={{ color: "var(--launch-admin-muted)" }}>No sites yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent batches */}
          {batches.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-bold mb-2 flex items-center gap-1.5" style={{ color: "var(--launch-admin-heading)" }}>
                <Activity className="h-4 w-4" /> Recent Batches
              </h3>
              <div className="flex flex-wrap gap-2">
                {batches.map(b => (
                  <div key={b.batch_id} className="rounded-lg border px-3 py-2 text-xs"
                    style={{ borderColor: "var(--launch-admin-border)", background: "var(--launch-admin-surface)" }}>
                    <span className="font-mono font-bold" style={{ color: "var(--launch-admin-text)" }}>{b.batch_id}</span>
                    <span className="ml-2" style={{ color: "var(--launch-admin-muted)" }}>
                      {b.count} sites · {b.synced} synced
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Sites table */}
      <div className="wle-panels">
        <section className="wle-panel" style={{ gridColumn: "1 / -1" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--launch-admin-heading)" }}>
              <Globe className="h-5 w-5" style={{ color: "var(--launch-admin-primary)" }} /> Site Bank Registry
            </h2>
            <div className="flex gap-2">
              <input value={filterNiche} onChange={(e) => setFilterNiche(e.target.value)} placeholder="Filter niche..."
                className="rounded-lg border px-3 py-1.5 text-xs outline-none"
                style={{ borderColor: "var(--launch-admin-border)", background: "var(--launch-admin-surface)", color: "var(--launch-admin-text)" }}
              />
              <input value={filterState} onChange={(e) => setFilterState(e.target.value)} placeholder="Filter state..."
                className="rounded-lg border px-3 py-1.5 text-xs outline-none"
                style={{ borderColor: "var(--launch-admin-border)", background: "var(--launch-admin-surface)", color: "var(--launch-admin-text)" }}
              />
            </div>
          </div>

          {sitesLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--launch-admin-primary)" }} /></div>
          ) : sites.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "var(--launch-admin-muted)" }}>
              No sites in the bank yet. Click "Launch New Batch" to start the autonomous system.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--launch-admin-border)" }}>
                    <th className="text-left py-2 px-2 font-bold" style={{ color: "var(--launch-admin-muted)" }}>Site</th>
                    <th className="text-left py-2 px-2 font-bold" style={{ color: "var(--launch-admin-muted)" }}>Niche</th>
                    <th className="text-left py-2 px-2 font-bold" style={{ color: "var(--launch-admin-muted)" }}>Location</th>
                    <th className="text-left py-2 px-2 font-bold" style={{ color: "var(--launch-admin-muted)" }}>Tags</th>
                    <th className="text-center py-2 px-2 font-bold" style={{ color: "var(--launch-admin-muted)" }}>Backlinks</th>
                    <th className="text-center py-2 px-2 font-bold" style={{ color: "var(--launch-admin-muted)" }}>Inbound</th>
                    <th className="text-center py-2 px-2 font-bold" style={{ color: "var(--launch-admin-muted)" }}>GPT Sync</th>
                    <th className="text-center py-2 px-2 font-bold" style={{ color: "var(--launch-admin-muted)" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sites.map(site => (
                    <tr key={site.id} style={{ borderBottom: "1px solid var(--launch-admin-border)" }}>
                      <td className="py-2 px-2">
                        <div className="font-bold" style={{ color: "var(--launch-admin-text)" }}>{site.site_name}</div>
                        <a href={site.site_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono hover:underline" style={{ color: "var(--launch-admin-primary)" }}>
                          {site.domain}
                        </a>
                      </td>
                      <td className="py-2 px-2 capitalize" style={{ color: "var(--launch-admin-text)" }}>{site.niche?.replace(/_/g, ' ')}</td>
                      <td className="py-2 px-2" style={{ color: "var(--launch-admin-muted)" }}>
                        {site.target_city ? `${site.target_city}, ${site.target_state}` : site.target_state || '—'}
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(site.tags || []).slice(0, 3).map(tag => (
                            <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                              style={{ background: "var(--launch-admin-canvas)", color: "var(--launch-admin-muted)" }}>
                              {tag}
                            </span>
                          ))}
                          {(site.tags || []).length > 3 && <span className="text-[9px]" style={{ color: "var(--launch-admin-muted)" }}>+{site.tags.length - 3}</span>}
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className="font-bold" style={{ color: "var(--launch-admin-text)" }}>{site.backlinks?.length || 0}</span>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className="font-bold" style={{ color: "var(--launch-admin-text)" }}>{site.inbound_link_count || 0}</span>
                      </td>
                      <td className="py-2 px-2 text-center">
                        {site.gpt_synced ? (
                          <CheckCircle2 className="h-4 w-4 mx-auto" style={{ color: "#16a34a" }} />
                        ) : (
                          <Clock className="h-4 w-4 mx-auto" style={{ color: "#d97706" }} />
                        )}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                          style={{
                            background: site.status === 'synced' ? '#dcfce7' : site.status === 'live' ? '#dbeafe' : '#fef3c7',
                            color: site.status === 'synced' ? '#16a34a' : site.status === 'live' ? '#2563eb' : '#d97706'
                          }}>
                          {site.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}