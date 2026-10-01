import React, { useState, useEffect, useCallback } from 'react';
import { Globe, Loader2, CheckCircle2, AlertCircle, RefreshCw, Database, TrendingUp, MapPin, Sparkles, ChevronDown, ChevronRight, ExternalLink, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const TOTAL_BATCHES = 20;
const BATCH_SIZE = 5;

export default function NearMeIntelligence() {
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState(null);
  const [geos, setGeos] = useState([]);
  const [selectedGeo, setSelectedGeo] = useState(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResults, setScanResults] = useState([]);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [expandedRows, setExpandedRows] = useState(new Set());

  const loadStatus = useCallback(async () => {
    try {
      const res = await base44.functions.invoke('nearMeIntelligenceEngine', { action: 'status' });
      setStatus(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  }, []);

  const loadGeos = useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await base44.entities.NearMeIntelligence.filter(
        filter === 'pending' ? { scan_status: 'pending' } :
        filter === 'complete' ? { scan_status: 'complete' } :
        filter === 'available' ? { available_domains: { $exists: true, $ne: [] } } : {},
        { sort: '-market_score', limit: 100 }
      );
      setGeos(items || []);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => { loadStatus(); }, [loadStatus]);
  useEffect(() => { loadGeos(); }, [loadGeos]);

  const seedGeographies = async () => {
    setSeeding(true);
    setError(null);
    try {
      await base44.functions.invoke('nearMeIntelligenceEngine', { action: 'seed' });
      await loadStatus();
      await loadGeos();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
    setSeeding(false);
  };

  const runFullScan = async () => {
    setScanning(true);
    setError(null);
    setScanResults([]);
    setScanProgress(0);

    for (let i = 0; i < TOTAL_BATCHES; i++) {
      setScanProgress(i);
      try {
        const res = await base44.functions.invoke('nearMeIntelligenceEngine', {
          action: 'scanBatch',
          batchIndex: i,
          totalBatches: TOTAL_BATCHES,
          batchSize: BATCH_SIZE,
        });
        if (res.data.results) setScanResults((prev) => [...prev, ...res.data.results]);
        if (res.data.complete) break;
      } catch (err) {
        setError(`Batch ${i + 1} failed: ${err.response?.data?.error || err.message}`);
        break;
      }
    }

    setScanProgress(TOTAL_BATCHES);
    setScanning(false);
    await loadStatus();
    await loadGeos();
  };

  const refreshInsights = async () => {
    setRefreshing(true);
    try {
      await base44.functions.invoke('nearMeIntelligenceEngine', { action: 'refreshInsights', limit: 20 });
      await loadGeos();
    } catch (err) {
      setError(err.message);
    }
    setRefreshing(false);
  };

  const toggleRow = (id) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const pendingPct = status ? Math.round((status.complete / status.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-stone-900 flex items-center gap-3">
            <Globe className="h-7 w-7 text-amber-600" />
            NearMe Intelligence Engine
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Deterministic system: seeds all US states + top 50 cities, scans nearme.com/nearyou.com domains, finds businesses, pulls keywords, generates strategic plans — saved to your Drive folder.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={seedGeographies}
            disabled={seeding}
            className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:border-amber-500 hover:text-amber-600 transition disabled:opacity-50"
          >
            {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
            Seed Geographies
          </button>
          <button
            onClick={refreshInsights}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:border-amber-500 hover:text-amber-600 transition disabled:opacity-50"
          >
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Refresh Insights
          </button>
          <button
            onClick={runFullScan}
            disabled={scanning}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2 text-sm font-bold text-stone-950 hover:bg-amber-400 transition disabled:opacity-50"
          >
            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {scanning ? `Scanning ${scanProgress}/${TOTAL_BATCHES}...` : 'Run Full Scan'}
          </button>
        </div>
      </div>

      {/* Status cards */}
      {status && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard icon={MapPin} label="Total Geos" value={status.total} color="text-stone-700" />
          <StatCard icon={CheckCircle2} label="Scanned" value={status.complete} color="text-green-600" />
          <StatCard icon={Loader2} label="Pending" value={status.pending} color="text-amber-600" />
          <StatCard icon={Globe} label="With Available Domains" value={status.withAvailable} color="text-blue-600" />
          <StatCard icon={TrendingUp} label="Progress" value={`${pendingPct}%`} color="text-purple-600" />
        </div>
      )}

      {/* Scan progress */}
      {scanning && (
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
            <p className="text-sm font-semibold text-stone-700">
              Processing batch {scanProgress + 1} of {TOTAL_BATCHES} — scanning {BATCH_SIZE} geographies per batch
            </p>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: TOTAL_BATCHES }).map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  i < scanProgress ? 'bg-green-500' : i === scanProgress ? 'bg-amber-500' : 'bg-stone-200'
                }`}
              />
            ))}
          </div>
          {scanResults.length > 0 && (
            <p className="text-xs text-stone-500 mt-2">{scanResults.length} geographies scanned so far</p>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {['all', 'complete', 'pending', 'available'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition ${
              filter === f ? 'bg-stone-900 text-white' : 'bg-white border border-stone-300 text-stone-600 hover:border-stone-400'
            }`}
          >
            {f === 'available' ? 'Available Domains' : f}
          </button>
        ))}
      </div>

      {/* Geography table */}
      <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-amber-500 animate-spin" />
          </div>
        ) : geos.length === 0 ? (
          <div className="p-12 text-center">
            <Database className="h-10 w-10 text-stone-300 mx-auto mb-3" />
            <p className="text-sm text-stone-500 mb-4">No geographies yet. Click "Seed Geographies" to initialize the system.</p>
            <button
              onClick={seedGeographies}
              disabled={seeding}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2 text-sm font-bold text-stone-950 hover:bg-amber-400"
            >
              {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
              Seed 100 Geographies Now
            </button>
          </div>
        ) : (
          <div className="divide-y divide-stone-100 max-h-[600px] overflow-y-auto">
            {geos.map((geo) => {
              const expanded = expandedRows.has(geo.id);
              const hasData = geo.scan_status === 'complete';
              return (
                <div key={geo.id} className="hover:bg-stone-50">
                  <button
                    onClick={() => hasData && toggleRow(geo.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                  >
                    {hasData ? (
                      expanded ? <ChevronDown className="h-4 w-4 text-stone-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-stone-400 shrink-0" />
                    ) : (
                      <div className="w-4 shrink-0" />
                    )}
                    <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded ${
                      geo.geo_type === 'state' ? 'bg-purple-100 text-purple-700' :
                      geo.geo_type === 'city' ? 'bg-blue-100 text-blue-700' : 'bg-stone-100 text-stone-600'
                    }`}>
                      {geo.geo_type}
                    </span>
                    <span className="font-semibold text-stone-800 flex-1 truncate">{geo.geo_name}, {geo.state_code}</span>
                    {geo.population > 0 && <span className="text-xs text-stone-400 hidden sm:inline">pop {geo.population.toLocaleString()}</span>}
                    {geo.available_domains?.length > 0 && (
                      <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                        {geo.available_domains.length} available
                      </span>
                    )}
                    {geo.businesses?.length > 0 && (
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded hidden sm:inline">
                        {geo.businesses.length} businesses
                      </span>
                    )}
                    {hasData ? (
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                        Score: {geo.market_score}
                      </span>
                    ) : geo.scan_status === 'pending' ? (
                      <span className="text-xs text-stone-400">Pending</span>
                    ) : (
                      <span className="text-xs text-red-500">Failed</span>
                    )}
                  </button>

                  {/* Expanded detail */}
                  {expanded && hasData && (
                    <div className="px-4 pb-4 space-y-4 bg-stone-50/50">
                      {/* Proactive insights */}
                      {geo.proactive_insights && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                          <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5" /> AI Says: Do This Now
                          </p>
                          <p className="text-sm text-stone-700 whitespace-pre-wrap">{geo.proactive_insights}</p>
                        </div>
                      )}

                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Available domains */}
                        <div>
                          <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Available Domains to Buy</p>
                          {geo.available_domains?.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {geo.available_domains.slice(0, 15).map((d) => (
                                <span key={d} className="text-xs font-mono bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded">
                                  {d}
                                </span>
                              ))}
                              {geo.available_domains.length > 15 && (
                                <span className="text-xs text-stone-400">+{geo.available_domains.length - 15} more</span>
                              )}
                            </div>
                          ) : <p className="text-xs text-stone-400">None available</p>}
                        </div>

                        {/* Registered domains */}
                        <div>
                          <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Registered NearMe/NearYou Domains</p>
                          <div className="flex flex-wrap gap-1.5">
                            {[...(geo.nearme_domains || []), ...(geo.nearyou_domains || [])]
                              .filter((d) => d.registered)
                              .slice(0, 10)
                              .map((d) => (
                                <span key={d.domain} className="text-xs font-mono bg-stone-100 text-stone-600 px-2 py-1 rounded">
                                  {d.domain}
                                </span>
                              ))}
                            {![...(geo.nearme_domains || []), ...(geo.nearyou_domains || [])].some((d) => d.registered) && (
                              <p className="text-xs text-stone-400">None registered</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Top keywords */}
                      {geo.top_keywords?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Top Keywords</p>
                          <div className="flex flex-wrap gap-1.5">
                            {geo.top_keywords.slice(0, 15).map((k, i) => (
                              <span key={i} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded">
                                {k.keyword} <span className="text-blue-400">· vol {k.volume || '?'}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Businesses */}
                      {geo.businesses?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Local Businesses Found</p>
                          <div className="space-y-1">
                            {geo.businesses.slice(0, 5).map((b, i) => (
                              <div key={i} className="text-sm text-stone-600 flex items-center gap-2">
                                <span className="font-medium">{b.name}</span>
                                <span className="text-xs text-stone-400">({b.type})</span>
                                {b.url && <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-0.5"><ExternalLink className="h-3 w-3" />site</a>}
                                {b.rating && <span className="text-xs text-amber-500">★ {b.rating}</span>}
                              </div>
                            ))}
                            {geo.businesses.length > 5 && <p className="text-xs text-stone-400">+{geo.businesses.length - 5} more</p>}
                          </div>
                        </div>
                      )}

                      {/* Strategic plan */}
                      {geo.strategic_plan && (
                        <div>
                          <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Strategic Plan</p>
                          <div className="rounded-lg border border-stone-200 bg-white p-3 max-h-64 overflow-y-auto">
                            <p className="text-sm text-stone-700 whitespace-pre-wrap">{geo.strategic_plan}</p>
                          </div>
                        </div>
                      )}

                      {geo.drive_file_id && (
                        <a
                          href={`https://drive.google.com/file/d/${geo.drive_file_id}/view`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" /> View intelligence JSON in Drive
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Scan results summary */}
      {scanResults.length > 0 && !scanning && (
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm font-bold text-stone-700 mb-2">Last Scan Results ({scanResults.length} geographies)</p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {scanResults.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="font-mono text-stone-600">{r.geo_key}</span>
                <span className={r.error ? 'text-red-500' : 'text-green-600'}>
                  {r.error ? r.error.slice(0, 60) : `Score: ${r.marketScore}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-xs text-stone-400 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-xl font-black text-stone-900">{value}</p>
    </div>
  );
}