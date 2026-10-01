import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { base44 } from '@/api/base44Client';
import {
  TrendingUp, Users, ShoppingCart, Search, Globe, Calendar, DollarSign,
  Activity, ArrowUpRight, Loader2, AlertCircle, MapPin, Zap, Award,
  MousePointer, Eye, Building2, RefreshCw, LayoutDashboard, ExternalLink,
  BarChart3, LineChart as LineIcon, Server
} from 'lucide-react';
import KpiCard from '@/components/owner-dashboard/KpiCard';
import GoDaddyDomainManager from '@/components/nearme/GoDaddyDomainManager';
import ScanMap from '@/components/nearme/ScanMap';

const TARGET_DOMAINS = ['strategicmindsai.com', 'xtremepolishingsystems.com', 'nationalconcretepolishing.net'];
const PUBLISHED_URL = 'https://epoxyquotenearme.base44.app';
const STATUS_COLORS = ['#D4AF37', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

export default function OwnerDashboard() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [chartType, setChartType] = useState('bar');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const perfRes = await base44.functions.invoke('systemPerformanceSync', { action: 'getDashboard' });
      const perf = perfRes.data;
      const nearMeRes = await base44.functions.invoke('nearMeIntelligenceEngine', { action: 'status' });
      const nearMe = nearMeRes.data;
      const totalLeads = await base44.entities.Lead.count({});
      const leadAgg = await base44.entities.Lead.aggregate({ dateBucket: { field: 'created_date', unit: 'month' }, sort: '_id', limit: 3 });
      const leadGrowth = (leadAgg.rows || []).map(r => ({ month: r._id?.substring(0, 7) || 'Unknown', leads: r.count }));
      const thisMonthLeads = leadGrowth.length > 0 ? leadGrowth[leadGrowth.length - 1].leads : 0;
      const lastMonthLeads = leadGrowth.length > 1 ? leadGrowth[leadGrowth.length - 2].leads : 0;
      const growthPct = lastMonthLeads > 0 ? Math.round(((thisMonthLeads - lastMonthLeads) / lastMonthLeads) * 100) : 0;
      const statusAgg = await base44.entities.Lead.aggregate({ groupBy: 'status', sort: '-count', limit: 20 });
      const { items: recentLeads } = await base44.entities.Lead.filter({}, { sort: '-created_date', limit: 10, fields: ['first_name', 'last_name', 'email', 'city', 'state', 'status', 'created_date', 'lead_source'] });
      const { items: topGeos } = await base44.entities.NearMeIntelligence.filter({ scan_status: 'complete' }, { sort: '-market_score', limit: 10, fields: ['geo_name', 'state_code', 'market_score', 'available_domains', 'geo_type'] });
      const { items: allGeos } = await base44.entities.NearMeIntelligence.filter({}, { sort: '-market_score', limit: 200, fields: ['geo_name', 'state_code', 'geo_type', 'scan_status', 'market_score', 'available_domains'] });

      const snapshots = perf?.snapshots || [];
      const gscByDomain = {}, gaByDomain = {};
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
      const totalGscClicks = Object.values(gscByDomain).reduce((sum, d) => sum + (d.gsc_clicks || 0), 0);
      const totalGaSessions = Object.values(gaByDomain).reduce((sum, d) => sum + (d.ga_sessions || 0), 0);

      setData({ totalLeads, thisMonthLeads, lastMonthLeads, growthPct, leadGrowth, leadStatus: statusAgg.rows || [], recentLeads, topGeos, allGeos, nearMe, gscByDomain, gaByDomain, godaddyCount, totalGscClicks, totalGaSessions, lastSync: perf?.lastSync });
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

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 text-amber-500 animate-spin" /></div>;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3"><AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" /><p className="text-sm text-red-700">{error}</p></div>;

  const d = data;
  const lastSyncStr = d.lastSync ? new Date(d.lastSync).toLocaleString() : 'Never';
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'traffic', label: 'Traffic', icon: TrendingUp },
    { id: 'domains', label: 'Domains', icon: Globe },
    { id: 'markets', label: 'Markets', icon: MapPin },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-stone-900 flex items-center gap-3">
            <Award className="h-7 w-7 text-amber-600" /> Founder Dashboard
          </h1>
          <p className="text-sm text-stone-500 mt-1">Complete executive view — leads, traffic, domains, markets, and all URLs in one place.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-400">Last sync: {lastSyncStr}</span>
          <button onClick={syncNow} disabled={syncing} className="flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2 text-sm font-bold text-stone-950 hover:bg-amber-400 transition disabled:opacity-50">
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {syncing ? 'Syncing...' : 'Sync All'}
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-stone-200 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition ${
            activeTab === t.id ? 'border-amber-500 text-amber-600' : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}>
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ OVERVIEW TAB ═══ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard icon={Users} label="Total Leads" value={d.totalLeads} sublabel={`${d.thisMonthLeads} this month`} color="text-green-600" accent="bg-green-50" />
            <KpiCard icon={TrendingUp} label="Monthly Growth" value={`${d.growthPct >= 0 ? '+' : ''}${d.growthPct}%`} sublabel="vs last month" color={d.growthPct >= 0 ? 'text-green-600' : 'text-red-600'} accent={d.growthPct >= 0 ? 'bg-green-50' : 'bg-red-50'} />
            <KpiCard icon={ShoppingCart} label="GoDaddy Domains" value={d.godaddyCount} sublabel="registered" color="text-purple-600" accent="bg-purple-50" />
            <KpiCard icon={Search} label="GSC Clicks (30d)" value={d.totalGscClicks} sublabel="across 3 properties" color="text-blue-600" accent="bg-blue-50" />
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2 mb-1"><TrendingUp className="h-5 w-5 text-green-600" />Monthly Lead Growth — Last Quarter</h2>
            <p className="text-xs text-stone-400 mb-4">New opportunities captured per month from the questionnaire & estimator funnel</p>
            {d.leadGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={d.leadGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fontWeight: 600 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4', fontSize: '13px' }} formatter={(v) => [`${v} leads`, 'New Leads']} />
                  <Bar dataKey="leads" fill="#D4AF37" radius={[8, 8, 0, 0]} name="New Leads" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-stone-400 py-12 text-center">No lead data yet</p>}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-stone-200 bg-white p-6">
              <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2 mb-4"><Activity className="h-5 w-5 text-amber-600" />Lead Status Breakdown</h2>
              {d.leadStatus.length > 0 ? (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart><Pie data={d.leadStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>{d.leadStatus.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}</Pie><Tooltip formatter={(v, n) => [`${v} leads`, n]} /></PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-1.5">{d.leadStatus.slice(0, 8).map((s, i) => (<div key={i} className="flex items-center justify-between text-sm"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ background: STATUS_COLORS[i % STATUS_COLORS.length] }} /><span className="text-stone-600 font-medium">{s.status || 'Unknown'}</span></div><span className="font-bold text-stone-900">{s.count}</span></div>))}</div>
                </div>
              ) : <p className="text-sm text-stone-400 py-8 text-center">No leads yet</p>}
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-6">
              <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2 mb-4"><Users className="h-5 w-5 text-green-600" />Recent Leads</h2>
              {d.recentLeads.length > 0 ? (
                <div className="space-y-2">{d.recentLeads.slice(0, 5).map((lead, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-stone-50 border border-stone-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-amber-100 grid place-items-center text-xs font-bold text-amber-700">{(lead.first_name?.[0] || '?').toUpperCase()}</div>
                      <div><p className="text-sm font-semibold text-stone-800">{lead.first_name} {lead.last_name}</p><p className="text-xs text-stone-400">{lead.city ? `${lead.city}, ${lead.state || ''}` : lead.email}</p></div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">{lead.status || 'NEW'}</span>
                  </div>
                ))}</div>
              ) : <p className="text-sm text-stone-400 py-8 text-center">No leads yet</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <QuickLink to="/admin/nearme-intelligence" icon={Globe} label="NearMe Intelligence" />
            <QuickLink to="/admin/system-performance" icon={Activity} label="System Performance" />
            <QuickLink to="/admin/leads" icon={Users} label="All Leads" />
            <QuickLink to="/admin/pipeline" icon={Zap} label="Pipeline" />
          </div>
        </div>
      )}

      {/* ═══ LEADS TAB ═══ */}
      {activeTab === 'leads' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard icon={Users} label="Total Leads" value={d.totalLeads} color="text-green-600" accent="bg-green-50" />
            <KpiCard icon={Calendar} label="This Month" value={d.thisMonthLeads} color="text-amber-600" accent="bg-amber-50" />
            <KpiCard icon={TrendingUp} label="Growth" value={`${d.growthPct >= 0 ? '+' : ''}${d.growthPct}%`} sublabel="vs last month" color={d.growthPct >= 0 ? 'text-green-600' : 'text-red-600'} accent={d.growthPct >= 0 ? 'bg-green-50' : 'bg-red-50'} />
            <KpiCard icon={Activity} label="Status Types" value={d.leadStatus.length} sublabel="different stages" color="text-blue-600" accent="bg-blue-50" />
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-green-600" />Lead Growth Trend — Last Quarter</h2>
              <div className="flex items-center gap-1">
                <button onClick={() => setChartType('bar')} className={`p-1.5 rounded-lg transition ${chartType === 'bar' ? 'bg-amber-500 text-stone-950' : 'bg-white border border-stone-300 text-stone-500'}`}><BarChart3 className="h-4 w-4" /></button>
                <button onClick={() => setChartType('line')} className={`p-1.5 rounded-lg transition ${chartType === 'line' ? 'bg-amber-500 text-stone-950' : 'bg-white border border-stone-300 text-stone-500'}`}><LineIcon className="h-4 w-4" /></button>
              </div>
            </div>
            {d.leadGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                {chartType === 'bar' ? (
                  <BarChart data={d.leadGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 13, fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4', fontSize: '13px' }} formatter={(v) => [`${v} leads`, 'New Leads']} />
                    <Bar dataKey="leads" fill="#D4AF37" radius={[8, 8, 0, 0]} name="New Leads" />
                  </BarChart>
                ) : (
                  <LineChart data={d.leadGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 13, fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4', fontSize: '13px' }} formatter={(v) => [`${v} leads`, 'New Leads']} />
                    <Line type="monotone" dataKey="leads" stroke="#D4AF37" strokeWidth={3} dot={{ r: 6, fill: '#D4AF37' }} name="New Leads" />
                  </LineChart>
                )}
              </ResponsiveContainer>
            ) : <p className="text-sm text-stone-400 py-16 text-center">No lead data yet — sync to populate</p>}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-stone-200 bg-white p-6">
              <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2 mb-4"><Activity className="h-5 w-5 text-amber-600" />Lead Status Breakdown</h2>
              {d.leadStatus.length > 0 ? (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width={200} height={200}>
                    <PieChart><Pie data={d.leadStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>{d.leadStatus.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}</Pie><Tooltip formatter={(v, n) => [`${v} leads`, n]} /></PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">{d.leadStatus.map((s, i) => (<div key={i} className="flex items-center justify-between text-sm"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ background: STATUS_COLORS[i % STATUS_COLORS.length] }} /><span className="text-stone-600 font-medium">{s.status || 'Unknown'}</span></div><span className="font-bold text-stone-900">{s.count}</span></div>))}</div>
                </div>
              ) : <p className="text-sm text-stone-400 py-8 text-center">No leads yet</p>}
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-6">
              <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2 mb-4"><Users className="h-5 w-5 text-green-600" />Recent Leads (10)</h2>
              {d.recentLeads.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto">{d.recentLeads.map((lead, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-stone-50 border border-stone-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-amber-100 grid place-items-center text-xs font-bold text-amber-700">{(lead.first_name?.[0] || '?').toUpperCase()}</div>
                      <div><p className="text-sm font-semibold text-stone-800">{lead.first_name} {lead.last_name}</p><p className="text-xs text-stone-400">{lead.city ? `${lead.city}, ${lead.state || ''}` : lead.email}</p></div>
                    </div>
                    <div className="flex items-center gap-2"><span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">{lead.status || 'NEW'}</span><span className="text-xs text-stone-400">{lead.created_date ? new Date(lead.created_date).toLocaleDateString() : ''}</span></div>
                  </div>
                ))}</div>
              ) : <p className="text-sm text-stone-400 py-8 text-center">No leads yet</p>}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TRAFFIC TAB ═══ */}
      {activeTab === 'traffic' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard icon={MousePointer} label="GSC Clicks" value={d.totalGscClicks} sublabel="30 days" color="text-green-600" accent="bg-green-50" />
            <KpiCard icon={Eye} label="GSC Impressions" value={Object.values(d.gscByDomain).reduce((s, d) => s + (d.gsc_impressions || 0), 0)} sublabel="30 days" color="text-blue-600" accent="bg-blue-50" />
            <KpiCard icon={Activity} label="GA Sessions" value={d.totalGaSessions} sublabel="30 days" color="text-purple-600" accent="bg-purple-50" />
            <KpiCard icon={Users} label="GA Users" value={Object.values(d.gaByDomain).reduce((s, d) => s + (d.ga_users || 0), 0)} sublabel="30 days" color="text-amber-600" accent="bg-amber-50" />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-stone-200 bg-white p-6">
              <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2 mb-4"><Search className="h-5 w-5 text-blue-600" />Google Search Console — Per Property</h2>
              <div className="space-y-3">{TARGET_DOMAINS.map(domain => {
                const gsc = d.gscByDomain[domain];
                return (
                  <div key={domain} className="p-3 rounded-lg bg-stone-50 border border-stone-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-stone-600 truncate flex-1">{domain}</span>
                      {gsc ? <span className="text-xs text-green-600 font-semibold ml-2">Connected</span> : <span className="text-xs text-amber-600 ml-2">Not connected</span>}
                    </div>
                    {gsc && (
                      <div className="flex items-center gap-4">
                        <span className="text-sm flex items-center gap-1"><MousePointer className="h-3.5 w-3.5 text-green-600" /><span className="font-bold text-stone-900">{gsc.gsc_clicks || 0}</span><span className="text-xs text-stone-400">clicks</span></span>
                        <span className="text-sm flex items-center gap-1"><Eye className="h-3.5 w-3.5 text-blue-600" /><span className="font-bold text-stone-900">{gsc.gsc_impressions || 0}</span><span className="text-xs text-stone-400">impressions</span></span>
                      </div>
                    )}
                  </div>
                );
              })}</div>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-6">
              <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2 mb-4"><TrendingUp className="h-5 w-5 text-amber-600" />Google Analytics — Per Property</h2>
              <div className="space-y-3">{TARGET_DOMAINS.map(domain => {
                const ga = d.gaByDomain[domain];
                return (
                  <div key={domain} className="p-3 rounded-lg bg-stone-50 border border-stone-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-stone-600 truncate flex-1">{domain}</span>
                      {ga ? <span className="text-xs text-green-600 font-semibold ml-2">Connected</span> : <span className="text-xs text-amber-600 ml-2">Not connected</span>}
                    </div>
                    {ga && (
                      <div className="flex items-center gap-4">
                        <span className="text-sm flex items-center gap-1"><Activity className="h-3.5 w-3.5 text-purple-600" /><span className="font-bold text-stone-900">{ga.ga_sessions || 0}</span><span className="text-xs text-stone-400">sessions</span></span>
                        <span className="text-sm flex items-center gap-1"><Users className="h-3.5 w-3.5 text-green-600" /><span className="font-bold text-stone-900">{ga.ga_users || 0}</span><span className="text-xs text-stone-400">users</span></span>
                      </div>
                    )}
                  </div>
                );
              })}</div>
            </div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-700">
              <strong>⚠ Action needed:</strong> Google Analytics properties are not yet linked for any domain. Create GA4 properties in Google Analytics and the daily sync will automatically pick them up.
            </p>
          </div>
        </div>
      )}

      {/* ═══ DOMAINS TAB ═══ */}
      {activeTab === 'domains' && (
        <div className="space-y-6">
          {/* All URLs section */}
          <div className="rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2 mb-4"><Globe className="h-5 w-5 text-purple-600" />All URLs & Properties</h2>
            <div className="space-y-3">
              <UrlRow label="Published App" url={PUBLISHED_URL} badge="Live" />
              {TARGET_DOMAINS.map(domain => (
                <UrlRow key={domain} label="Tracking Domain" url={`https://${domain}`} badge={d.gscByDomain[domain] ? 'GSC ✓' : 'GSC ✗'} />
              ))}
            </div>
          </div>
          {/* GoDaddy Domain Manager */}
          <GoDaddyDomainManager />
        </div>
      )}

      {/* ═══ MARKETS TAB ═══ */}
      {activeTab === 'markets' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard icon={MapPin} label="Total Geos" value={d.nearMe?.total || 0} color="text-stone-700" accent="bg-stone-50" />
            <KpiCard icon={TrendingUp} label="Scanned" value={d.nearMe?.complete || 0} sublabel="complete" color="text-green-600" accent="bg-green-50" />
            <KpiCard icon={Loader2} label="Pending" value={d.nearMe?.pending || 0} color="text-amber-600" accent="bg-amber-50" />
            <KpiCard icon={Globe} label="Available Domains" value={d.nearMe?.withAvailable || 0} sublabel="geos with domains" color="text-blue-600" accent="bg-blue-50" />
          </div>
          {/* Coverage Map */}
          <div className="rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2 mb-4"><MapPin className="h-5 w-5 text-blue-600" />Coverage Map — Scanned Geographies</h2>
            {d.allGeos?.length > 0 ? <ScanMap geos={d.allGeos} /> : <p className="text-sm text-stone-400 py-8 text-center">No geographies scanned yet</p>}
          </div>
          {/* Top Markets */}
          <div className="rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2 mb-4"><Award className="h-5 w-5 text-amber-600" />Top Market Opportunities</h2>
            {d.topGeos.length > 0 ? (
              <div className="space-y-2">{d.topGeos.map((geo, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-stone-100">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-100 grid place-items-center text-xs font-bold text-amber-700">{i + 1}</span>
                    <div><p className="text-sm font-bold text-stone-800">{geo.geo_name}, {geo.state_code}</p><p className="text-xs text-stone-400">{geo.available_domains?.length || 0} domains available · {geo.geo_type}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-stone-200 rounded-full overflow-hidden"><div className="h-full bg-amber-500 rounded-full" style={{ width: `${geo.market_score}%` }} /></div>
                    <span className="text-sm font-black text-stone-900 w-8 text-right">{geo.market_score}</span>
                  </div>
                </div>
              ))}</div>
            ) : <p className="text-sm text-stone-400 py-8 text-center">No markets scanned yet</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function QuickLink({ to, icon: Icon, label }) {
  return (
    <a href={to} className="flex items-center gap-3 p-4 rounded-xl border border-stone-200 bg-white hover:border-amber-500 hover:shadow-md transition-all group">
      <Icon className="h-5 w-5 text-stone-400 group-hover:text-amber-600 transition" />
      <span className="text-sm font-semibold text-stone-700 group-hover:text-amber-700 transition">{label}</span>
      <ArrowUpRight className="h-4 w-4 text-stone-300 group-hover:text-amber-500 ml-auto transition" />
    </a>
  );
}

function UrlRow({ label, url, badge }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-stone-100">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-xs font-bold text-stone-400 uppercase tracking-wide w-28 shrink-0">{label}</span>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-mono text-blue-600 hover:underline truncate flex items-center gap-1">
          {url}<ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      </div>
      <span className={`text-xs font-bold px-2 py-1 rounded ml-2 shrink-0 ${badge === 'Live' ? 'bg-green-50 text-green-700' : badge.includes('✓') ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{badge}</span>
    </div>
  );
}