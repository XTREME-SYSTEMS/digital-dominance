import React, { useState, useEffect } from "react";
import { Rocket, Loader2, Zap, Target, Layers, Gauge, Save, Check, AlertCircle, Radar, Crosshair } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { TOP_20_INDUSTRIES } from "@/data/topIndustries";
import LocationTargetingSystem from "@/components/targeting/LocationTargetingSystem";
import ServiceSelector from "@/components/launch-engine/ServiceSelector";

const EMPTY = {
  name: "",
  template_key: TOP_20_INDUSTRIES[0].id,
  template_name: TOP_20_INDUSTRIES[0].label,
  domain_strategy: "nearme_subdomain",
  domain_base: "epoxyquotenearme.com",
  provision_target: "vercel",
  content_optimization: "maximum",
  google_sync_enabled: true,
  auto_heal_enabled: true,
  max_parallel: 12,
  url_strategy: "city_subdomain",
  content_adjustment: "unique_local",
  selectedServices: [],
  selectedStates: [],
  selectedCounties: [],
  selectedCities: [],
};

export default function BulkLaunchBuilder() {
  const [config, setConfig] = useState(EMPTY);
  const [launching, setLaunching] = useState(false);
  const [launchResult, setLaunchResult] = useState(null);
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(true);

  useEffect(() => { loadBatches(); }, []);

  const loadBatches = async () => {
    setLoadingBatches(true);
    try {
      const res = await base44.entities.MassLaunchBatch.filter({}, { sort: '-created_date', limit: 20 });
      setBatches(res.items || res);
    } catch (err) { console.error(err); }
    finally { setLoadingBatches(false); }
  };

  const update = (field, value) => setConfig((prev) => ({ ...prev, [field]: value }));

  const launch = async () => {
    if (config.selectedCities.length === 0) return;
    setLaunching(true);
    setLaunchResult(null);
    try {
      const res = await base44.functions.invoke("massLaunchOrchestrator", {
        templateKey: config.template_key,
        templateName: config.template_name,
        domainStrategy: config.domain_strategy,
        domainBase: config.domain_base,
        provisionTarget: config.provision_target,
        locations: config.selectedCities,
        contentOptimization: config.content_optimization,
        googleSyncEnabled: config.google_sync_enabled,
        autoHealEnabled: config.auto_heal_enabled,
        services: config.selectedServices,
        maxParallel: config.max_parallel,
        urlStrategy: config.url_strategy,
        contentAdjustment: config.content_adjustment,
      });
      setLaunchResult(res.data);
      loadBatches();
    } catch (err) {
      setLaunchResult({ error: err.message });
    } finally {
      setLaunching(false);
    }
  };

  const siteCount = config.selectedCities.length;
  const canLaunch = siteCount > 0 && !launching;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-stone-950 via-amber-950 to-stone-900 p-5 text-white border border-amber-500/30">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 grid place-items-center">
            <Rocket className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-extrabold tracking-tight">Bulk Launch Builder</h1>
            <p className="text-stone-400 text-xs">Mass parallel website launches with skip trace, benchmark enhancement, Google Standard scoring, and God Mode optimization</p>
          </div>
        </div>
      </div>

      {/* Config grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Template + Services + Settings */}
        <div className="space-y-4">
          {/* Template */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-bold text-stone-800">Industry Template</h3>
            </div>
            <select value={config.template_key}
              onChange={(e) => { const t = TOP_20_INDUSTRIES.find((x) => x.id === e.target.value); update("template_key", e.target.value); update("template_name", t?.label || ""); update("selectedServices", []); }}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500">
              {TOP_20_INDUSTRIES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <div>
              <label className="text-xs font-bold text-stone-500 mb-1 block">Config Name</label>
              <input value={config.name} onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. Florida Epoxy Domination"
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500" />
            </div>
          </div>

          {/* Services */}
          <ServiceSelector templateKey={config.template_key} selectedServices={config.selectedServices}
            onChange={(svcs) => update("selectedServices", svcs)} />

          {/* Settings */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Gauge className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-bold text-stone-800">Launch Settings</h3>
            </div>
            <div>
              <label className="text-xs font-bold text-stone-500 mb-1 block">Max Parallel Sites</label>
              <input type="number" min={1} max={24} value={config.max_parallel}
                onChange={(e) => update("max_parallel", parseInt(e.target.value) || 12)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500" />
              <p className="text-[10px] text-stone-400 mt-1">Parallel sites processed per batch (1-24)</p>
            </div>
            <div>
              <label className="text-xs font-bold text-stone-500 mb-1 block">URL Strategy</label>
              <select value={config.url_strategy} onChange={(e) => update("url_strategy", e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-2 py-2 text-xs outline-none focus:border-amber-500">
                <option value="city_subdomain">City Subdomain (city.domain.com)</option>
                <option value="state_subdomain">State Subdomain (state.domain.com)</option>
                <option value="subfolder">Subfolder (domain.com/state/city)</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-stone-500 mb-1 block">Content Adjustment</label>
              <select value={config.content_adjustment} onChange={(e) => update("content_adjustment", e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-2 py-2 text-xs outline-none focus:border-amber-500">
                <option value="unique_local">Unique Local Data (recommended)</option>
                <option value="template_variation">Template Variation</option>
                <option value="ai_generated">Full AI Generation</option>
              </select>
              <p className="text-[10px] text-stone-400 mt-1">Google March 2026 requires genuine local data differentiation per page</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-stone-500 mb-1 block">Domain Strategy</label>
                <select value={config.domain_strategy} onChange={(e) => update("domain_strategy", e.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-2 py-2 text-xs outline-none focus:border-amber-500">
                  <option value="nearme_subdomain">NearMe Subdomain</option>
                  <option value="nearme_domain">NearMe Domain</option>
                  <option value="subfolder">Subfolder</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-stone-500 mb-1 block">Optimization</label>
                <select value={config.content_optimization} onChange={(e) => update("content_optimization", e.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-2 py-2 text-xs outline-none focus:border-amber-500">
                  <option value="seo">SEO</option>
                  <option value="seo_aeo">SEO+AEO</option>
                  <option value="seo_aeo_geo">SEO+AEO+GEO</option>
                  <option value="maximum">Maximum</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 text-xs text-stone-700">
                <input type="checkbox" checked={config.google_sync_enabled} onChange={(e) => update("google_sync_enabled", e.target.checked)} className="rounded" />
                Google sync
              </label>
              <label className="flex items-center gap-2 text-xs text-stone-700">
                <input type="checkbox" checked={config.auto_heal_enabled} onChange={(e) => update("auto_heal_enabled", e.target.checked)} className="rounded" />
                Auto-heal
              </label>
            </div>
          </div>
        </div>

        {/* Right: Location targeting + Launch */}
        <div className="lg:col-span-2 space-y-4">
          <LocationTargetingSystem
            value={{ selectedStates: config.selectedStates, selectedCounties: config.selectedCounties, selectedCities: config.selectedCities }}
            onChange={(v) => setConfig((prev) => ({ ...prev, ...v }))}
          />

          {/* Backend systems info */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-bold text-amber-800">Backend Systems (run automatically)</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-amber-700">
              <div className="flex items-center gap-1.5"><Radar className="h-3 w-3" /> Skip trace top 5 competitors</div>
              <div className="flex items-center gap-1.5"><Target className="h-3 w-3" /> Benchmark content enhancement</div>
              <div className="flex items-center gap-1.5"><Gauge className="h-3 w-3" /> Google 2026 Standard scoring</div>
              <div className="flex items-center gap-1.5"><Crosshair className="h-3 w-3" /> God Mode optimization</div>
            </div>
          </div>

          {/* Launch button */}
          <button onClick={launch} disabled={!canLaunch}
            className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-4 text-sm font-bold text-white hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg">
            {launching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Rocket className="h-5 w-5" />}
            {launching ? "Launching — skip trace, benchmark, scoring, God Mode running..." : `Launch ${siteCount} Sites in Parallel with God Mode`}
          </button>

          {!canLaunch && siteCount === 0 && (
            <p className="text-xs text-stone-400 text-center">Select at least one city to launch</p>
          )}

          {/* Launch result */}
          {launchResult && (
            <div className={`rounded-xl p-4 text-sm ${launchResult.error ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
              {launchResult.error ? (
                <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {launchResult.error}</div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold"><Check className="h-4 w-4" /> Batch launched successfully</div>
                  <div className="text-xs space-y-0.5">
                    <div>Batch ID: {launchResult.batch_id}</div>
                    <div>Built: {launchResult.built} · Deployed: {launchResult.deployed} · Validated: {launchResult.validated}</div>
                    <div>Avg Google Score: {launchResult.average_google_score}/100</div>
                    <div>Skip trace: {launchResult.skip_trace_run ? "✓" : "✗"} · Benchmark: {launchResult.benchmark_run ? "✓" : "✗"}</div>
                    <div>Services included: {launchResult.services_included} · Parallel: {launchResult.parallel_batch_size}</div>
                    <div>Status: {launchResult.message}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recent batches */}
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <h3 className="text-sm font-bold text-stone-800 mb-3">Recent Batches</h3>
            {loadingBatches ? (
              <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-amber-500" /></div>
            ) : batches.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-4">No batches yet</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {batches.map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-lg border border-stone-100 px-3 py-2 text-xs">
                    <div>
                      <span className="font-bold text-stone-700">{b.template_name || b.template_key}</span>
                      <span className="text-stone-400 ml-2">{b.total_sites} sites</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-600">{b.average_google_score || 0}/100</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        b.status === 'complete' ? 'bg-emerald-100 text-emerald-700' :
                        b.status === 'orchestrating' ? 'bg-amber-100 text-amber-700' :
                        'bg-stone-100 text-stone-500'
                      }`}>{b.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}