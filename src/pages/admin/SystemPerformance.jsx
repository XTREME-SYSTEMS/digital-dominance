import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, RefreshCw, Loader2, AlertCircle, Search, TrendingUp, Globe, Users, MousePointer, Eye, ShoppingCart, Calendar, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SystemPerformance() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('systemPerformanceSync', { action: 'getDashboard' });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const syncNow = async () => {
    setSyncing(true);
    setError(null);
    try {
      await base44.functions.invoke('systemPerformanceSync', { action: 'sync' });
      await loadDashboard();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
    setSyncing(false);
  };

  // Parse snapshots into structured data
  const snapshots = data?.snapshots || [];
  const gscData = snapshots.filter(s => s.metric_name === 'gsc_clicks' || s.metric_name === 'gsc_impressions');
  const gaData = snapshots.filter(s => s.metric_name === 'ga_sessions' || s.metric_name === 'ga_users');
  const godaddyCount = snapshots.find(s => s.metric_name === 'godaddy_domains')?.value || 0;
  const leadGrowth = data?.leadGrowth || [];
  const leadStatus = data?.leadStatusBreakdown || [];

  // Group GSC by domain
  const gscByDomain = {};
  for (const s of gscData) {
    if (!gscByDomain[s.source]) gscByDomain[s.source] = {};
    gscByDomain[s.source][s.metric_name] = s.value;
  }

  // Group GA by domain
  const gaByDomain = {};
  for (const s of gaData) {
    if (!gaByDomain[s.source]) gaByDomain[s.source] = {};
    gaByDomain[s.source][s.metric_name] = s.value;
  }

  const targetDomains = ['strategicmindsai.com', 'xtremepolishingsystems.com', 'nationalconcretepolishing.net'];
  const lastSync = data?.lastSync ? new Date(data.lastSync).toLocaleString() : 'Never';

  // Format lead growth for chart
  const leadChartData = leadGrowth.map(r => ({
    month: r._id?.substring(0, 7) || 'Unknown',
    leads: r.count,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-stone-900 flex items-center gap-3">
            <Activity className="h-7 w-7 text-amber-600" />
            System Performance
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Unified dashboard: Google Search Console, Google Analytics, GoDaddy, and lead growth — synced daily, free connectors.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-400">Last sync: {lastSync}</span>
          <button
            onClick={syncNow}
            disabled={syncing}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2 text-sm font-bold text-stone-950 hover:bg-amber-400 transition disabled:opacity-50"
          >
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>

      {/* Target domains */}
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Tracking Properties</p>
        <div className="flex flex-wrap gap-2">
          {targetDomains.map(d => (
            <span key={d} className="text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <Globe className="h-3 w-3" /> {d}
            </span>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* ═══ LEAD GROWTH CHART ═══ */}
          <div className="rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2 mb-1">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Monthly Lead Growth — Last Quarter
            </h2>
            <p className="text-xs text-stone-400 mb-4">New opportunities captured per month from the questionnaire/estimator funnel</p>
            {leadChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={leadChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="leads" fill="#D4AF37" radius={[8, 8, 0, 0]} name="New Leads" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-stone-400 py-8 text-center">No lead data yet — sync to populate</p>
            )}

            {/* Lead status breakdown */}
            {leadStatus.length > 0 && (
              <div className="mt-4 pt-4 border-t border-stone-100">
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Lead Status Breakdown</p>
                <div className="flex flex-wrap gap-2">
                  {leadStatus.map((s, i) => (
                    <span key={i} className="text-xs bg-stone-100 text-stone-700 px-3 py-1.5 rounded-lg">
                      <span className="font-semibold">{s.status || 'Unknown'}</span>: {s.count}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ═══ GOOGLE SEARCH CONSOLE ═══ */}
          <div className="rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2 mb-4">
              <Search className="h-5 w-5 text-blue-600" />
              Google Search Console — Top Queries (Last 28 Days)
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {targetDomains.map(domain => {
                const gsc = gscByDomain[domain];
                return (
                  <div key={domain} className="rounded-lg border border-stone-200 p-4">
                    <p className="text-xs font-bold text-stone-600 mb-2 truncate">{domain}</p>
                    {gsc ? (
                      <>
                        <div className="flex gap-3 mb-3">
                          <div className="flex items-center gap-1.5">
                            <MousePointer className="h-3.5 w-3.5 text-green-600" />
                            <span className="text-lg font-black text-stone-900">{gsc.gsc_clicks || 0}</span>
                            <span className="text-xs text-stone-400">clicks</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Eye className="h-3.5 w-3.5 text-blue-600" />
                            <span className="text-lg font-black text-stone-900">{gsc.gsc_impressions || 0}</span>
                            <span className="text-xs text-stone-400">impr</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-amber-600">Not found in GSC — add & verify this property in Search Console</p>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-stone-400 mt-3">
              Run a full sync to see per-query breakdowns (clicks, impressions, CTR, position) for each property.
            </p>
          </div>

          {/* ═══ GOOGLE ANALYTICS ═══ */}
          <div className="rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-amber-600" />
              Google Analytics — Traffic Overview (Last 30 Days)
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {targetDomains.map(domain => {
                const ga = gaByDomain[domain];
                return (
                  <div key={domain} className="rounded-lg border border-stone-200 p-4">
                    <p className="text-xs font-bold text-stone-600 mb-3 truncate">{domain}</p>
                    {ga ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-stone-400 flex items-center gap-1"><Users className="h-3 w-3" /> Sessions</span>
                          <span className="text-lg font-black text-stone-900">{ga.ga_sessions || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-stone-400 flex items-center gap-1"><Users className="h-3 w-3" /> Users</span>
                          <span className="text-lg font-black text-stone-900">{ga.ga_users || 0}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-600">Not found in GA — link this domain's GA4 property</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══ GODADDY ═══ */}
          <div className="rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2 mb-4">
              <ShoppingCart className="h-5 w-5 text-purple-600" />
              GoDaddy Domain Portfolio
            </h2>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl font-black text-stone-900">{godaddyCount}</span>
              <span className="text-sm text-stone-400">total domains registered</span>
            </div>
            <p className="text-xs text-stone-400">
              GoDaddy is wired into the NearMe Intelligence engine — available nearme/nearyou domains can be auto-purchased for high-score geographies.
            </p>
            <a
              href="/admin/nearme-intelligence"
              className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:underline mt-3"
            >
              <ExternalLink className="h-3 w-3" /> Go to NearMe Intelligence to purchase domains
            </a>
          </div>
        </>
      )}
    </div>
  );
}