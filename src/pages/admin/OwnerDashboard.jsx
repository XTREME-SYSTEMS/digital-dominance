import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { base44 } from '@/api/base44Client';
import {
  TrendingUp, Users, ShoppingCart, Search, Globe, Calendar, DollarSign,
  Activity, ArrowUpRight, Loader2, AlertCircle, MapPin, Zap, Award,
  MousePointer, Eye, Building2, RefreshCw
} from 'lucide-react';
import KpiCard from '@/components/owner-dashboard/KpiCard';

const TARGET_DOMAINS = ['strategicmindsai.com', 'xtremepolishingsystems.com', 'nationalconcretepolishing.net'];
const STATUS_COLORS = ['#D4AF37', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

export default function OwnerDashboard() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      // 1. Performance sync dashboard data (GSC, GA, GoDaddy, lead snapshots)
      const perfRes = await base44.functions.invoke('systemPerformanceSync', { action: 'getDashboard' });
      const perf = perfRes.data;

      // 2. NearMe Intelligence status
      const nearMeRes = await base44.functions.invoke('nearMeIntelligenceEngine', { action: 'status' });
      const nearMe = nearMeRes.data;

      // 3. Lead counts
      const totalLeads = await base44.entities.Lead.count({});

      // 4. Lead growth by month (last quarter)
      const leadAgg = await base44.entities.Lead.aggregate({
        dateBucket: { field: 'created_date', unit: 'month' },
        sort: '_id', limit: 3,
      });
      const leadGrowth = (leadAgg.rows || []).map(r => ({
        month: r._id?.substring(0, 7) || 'Unknown',
        leads: r.count,
      }));
      const thisMonthLeads = leadGrowth.length > 0 ? leadGrowth[leadGrowth.length - 1].leads : 0;
      const lastMonthLeads = leadGrowth.length > 1 ? leadGrowth[leadGrowth.length - 2].leads : 0;
      const growthPct = lastMonthLeads > 0 ? Math.round(((thisMonthLeads - lastMonthLeads) / lastMonthLeads) * 100) : 0;

      // 5. Lead status breakdown
      const statusAgg = await base44.entities.Lead.aggregate({
        groupBy: 'status', sort: '-count', limit: 20,
      });

      // 6. Recent leads
      const { items: recentLeads } = await base44.entities.Lead.filter(
        {},
        { sort: '-created_date', limit: 5, fields: ['first_name', 'last_name', 'email', 'city', 'state', 'status', 'created_date'] }
      );

      // 7. Top NearMe geographies by market score
      const { items: topGeos } = await base44.entities.NearMeIntelligence.filter(
        { scan_status: 'complete' },
        { sort: '-market_score', limit: 5, fields: ['geo_name', 'state_code', 'market_score', 'available_domains'] }
      );

      // 8. Parse snapshots
      const snapshots = perf?.snapshots || [];
      const gscByDomain = {};
      const gaByDomain = {};
      for (const s of snapshots) {
        if (s.metric_name === 'gsc_clicks' || s.metric_name === 'gsc_impressions') {
          if (!gscByDomain[s.source]) gscByDomain[s.source] = {};
          gscByDomain[s.source][s.metric_name] = s.value;
        }
        if (s.metric_name === 'ga_sessions' || s.metric_name === 'ga_users') {
          if (!gaByDomain[s.source]) gaByDomain[s.source] = {};
          gaByDomain[s.source][s.metric_name] = s.value;
        }
      }
      const godaddyCount = snapshots.find(s => s.metric_name === 'godaddy_domains')?.value || 0;

      // 9. Total GSC clicks across all properties
      const totalGscClicks = Object.values(gscByDomain).reduce((sum, d) => sum + (d.gsc_clicks || 0), 0);
      const totalGaSessions = Object.values(gaByDomain).reduce((sum, d) => sum + (d.ga_sessions || 0), 0);

      setData({
        totalLeads,
        thisMonthLeads,
        lastMonthLeads,
        growthPct,
        leadGrowth,
        leadStatus: statusAgg.rows || [],
        recentLeads,
        topGeos,
        nearMe,
        gscByDomain,
        gaByDomain,
        godaddyCount,
        totalGscClicks,
        totalGaSessions,
        lastSync: perf?.lastSync,
      });
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const syncNow = async () => {
    setSyncing(true);
    try {
      await base44.functions.invoke('systemPerformanceSync', { action: 'sync' });
      await base44.functions.invoke('nearMeIntelligenceEngine', { action: 'syncGoDaddyStatus' });
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
    setSyncing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  const d = data;
  const lastSyncStr = d.lastSync ? new Date(d.lastSync).toLocaleString() : 'Never';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-stone-900 flex items-center gap-3">
            <Award className="h-7 w-7 text-amber-600" />
            Owner Dashboard
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Executive overview — leads, traffic, domains, and market intelligence in one view.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-400">Last sync: {lastSyncStr}</span>
          <button
            onClick={syncNow}
            disabled={syncing}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2 text-sm font-bold text-stone-950 hover:bg-amber-400 transition disabled:opacity-50"
          >
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {syncing ? 'Syncing...' : 'Sync All'}
          </button>
        </div>
      </div>

      {/* ═══ KPI CARDS ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={Users}
          label="Total Leads"
          value={d.totalLeads}
          sublabel={`${d.thisMonthLeads} this month`}
          color="text-green-600"
          accent="bg-green-50"
        />
        <KpiCard
          icon={TrendingUp}
          label="Monthly Growth"
          value={`${d.growthPct >= 0 ? '+' : ''}${d.growthPct}%`}
          sublabel={`vs last month`}
          color={d.growthPct >= 0 ? 'text-green-600' : 'text-red-600'}
          accent={d.growthPct >= 0 ? 'bg-green-50' : 'bg-red-50'}
        />
        <KpiCard
          icon={ShoppingCart}
          label="GoDaddy Domains"
          value={d.godaddyCount}
          sublabel="registered"
          color="text-purple-600"
          accent="bg-purple-50"
        />
        <KpiCard
          icon={Search}
          label="GSC Clicks (30d)"
          value={d.totalGscClicks}
          sublabel="across 3 properties"
          color="text-blue-600"
          accent="bg-blue-50"
        />
      </div>

      {/* ═══ LEAD GROWTH CHART ═══ */}
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2 mb-1">
          <TrendingUp className="h-5 w-5 text-green-600" />
          Monthly Lead Growth — Last Quarter
        </h2>
        <p className="text-xs text-stone-400 mb-4">New opportunities captured per month from the questionnaire & estimator funnel</p>
        {d.leadGrowth.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={d.leadGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fontWeight: 600 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4', fontSize: '13px' }}
                formatter={(v) => [`${v} leads`, 'New Leads']}
              />
              <Bar dataKey="leads" fill="#D4AF37" radius={[8, 8, 0, 0]} name="New Leads" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-stone-400 py-12 text-center">No lead data yet — sync to populate</p>
        )}
      </div>

      {/* ═══ TWO COLUMN: Lead Status + Top Markets ═══ */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Lead Status Breakdown */}
        <div className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-amber-600" />
            Lead Status Breakdown
          </h2>
          {d.leadStatus.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={d.leadStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                  >
                    {d.leadStatus.map((_, i) => (
                      <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v} leads`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {d.leadStatus.slice(0, 8).map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: STATUS_COLORS[i % STATUS_COLORS.length] }} />
                      <span className="text-stone-600 font-medium">{s.status || 'Unknown'}</span>
                    </div>
                    <span className="font-bold text-stone-900">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-stone-400 py-8 text-center">No leads yet</p>
          )}
        </div>

        {/* Top NearMe Markets */}
        <div className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-blue-600" />
            Top Market Opportunities
          </h2>
          {d.topGeos.length > 0 ? (
            <div className="space-y-3">
              {d.topGeos.map((geo, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-stone-100">
                  <div>
                    <p className="text-sm font-bold text-stone-800">{geo.geo_name}, {geo.state_code}</p>
                    <p className="text-xs text-stone-400">
                      {geo.available_domains?.length || 0} domains available
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${geo.market_score}%` }}
                      />
                    </div>
                    <span className="text-sm font-black text-stone-900">{geo.market_score}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-400 py-8 text-center">No markets scanned yet</p>
          )}
          <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between text-sm">
            <span className="text-stone-500">
              {d.nearMe?.complete || 0} / {d.nearMe?.total || 0} geographies scanned
            </span>
            <span className="text-green-600 font-semibold">
              {d.nearMe?.withAvailable || 0} with available domains
            </span>
          </div>
        </div>
      </div>

      {/* ═══ GOOGLE PERFORMANCE PER DOMAIN ═══ */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* GSC per domain */}
        <div className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2 mb-4">
            <Search className="h-5 w-5 text-blue-600" />
            Google Search Console — Per Property
          </h2>
          <div className="space-y-3">
            {TARGET_DOMAINS.map(domain => {
              const gsc = d.gscByDomain[domain];
              return (
                <div key={domain} className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-stone-100">
                  <span className="text-xs font-mono text-stone-600 truncate flex-1">{domain}</span>
                  {gsc ? (
                    <div className="flex items-center gap-4 ml-3">
                      <span className="text-sm flex items-center gap-1">
                        <MousePointer className="h-3.5 w-3.5 text-green-600" />
                        <span className="font-bold text-stone-900">{gsc.gsc_clicks || 0}</span>
                      </span>
                      <span className="text-sm flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5 text-blue-600" />
                        <span className="font-bold text-stone-900">{gsc.gsc_impressions || 0}</span>
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-amber-600 ml-3">Not connected</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* GA per domain */}
        <div className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-amber-600" />
            Google Analytics — Per Property
          </h2>
          <div className="space-y-3">
            {TARGET_DOMAINS.map(domain => {
              const ga = d.gaByDomain[domain];
              return (
                <div key={domain} className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-stone-100">
                  <span className="text-xs font-mono text-stone-600 truncate flex-1">{domain}</span>
                  {ga ? (
                    <div className="flex items-center gap-4 ml-3">
                      <span className="text-sm flex items-center gap-1">
                        <Activity className="h-3.5 w-3.5 text-purple-600" />
                        <span className="font-bold text-stone-900">{ga.ga_sessions || 0}</span>
                        <span className="text-xs text-stone-400">sessions</span>
                      </span>
                      <span className="text-sm flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-green-600" />
                        <span className="font-bold text-stone-900">{ga.ga_users || 0}</span>
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-amber-600 ml-3">Not connected</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ RECENT LEADS ═══ */}
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-green-600" />
          Recent Leads
        </h2>
        {d.recentLeads.length > 0 ? (
          <div className="space-y-2">
            {d.recentLeads.map((lead, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-stone-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 grid place-items-center text-xs font-bold text-amber-700">
                    {(lead.first_name?.[0] || '?').toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-800">
                      {lead.first_name} {lead.last_name}
                    </p>
                    <p className="text-xs text-stone-400">
                      {lead.city ? `${lead.city}, ${lead.state || ''}` : lead.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-50 text-blue-700">
                    {lead.status || 'NEW'}
                  </span>
                  <span className="text-xs text-stone-400">
                    {lead.created_date ? new Date(lead.created_date).toLocaleDateString() : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-stone-400 py-8 text-center">No leads yet</p>
        )}
      </div>

      {/* ═══ QUICK LINKS ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickLink to="/admin/nearme-intelligence" icon={Globe} label="NearMe Intelligence" />
        <QuickLink to="/admin/system-performance" icon={Activity} label="System Performance" />
        <QuickLink to="/admin/leads" icon={Users} label="All Leads" />
        <QuickLink to="/admin/pipeline" icon={Zap} label="Pipeline" />
      </div>
    </div>
  );
}

function QuickLink({ to, icon: Icon, label }) {
  return (
    <a
      href={to}
      className="flex items-center gap-3 p-4 rounded-xl border border-stone-200 bg-white hover:border-amber-500 hover:shadow-md transition-all group"
    >
      <Icon className="h-5 w-5 text-stone-400 group-hover:text-amber-600 transition" />
      <span className="text-sm font-semibold text-stone-700 group-hover:text-amber-700 transition">{label}</span>
      <ArrowUpRight className="h-4 w-4 text-stone-300 group-hover:text-amber-500 ml-auto transition" />
    </a>
  );
}