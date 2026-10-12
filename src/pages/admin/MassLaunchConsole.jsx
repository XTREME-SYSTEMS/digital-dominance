import React, { useState, useMemo } from "react";
import { Rocket, MapPin, Globe, Zap, Shield, Brain, Loader2, Check, ChevronDown, Search, Building2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { US_STATES, US_COUNTIES, slugify } from "@/lib/usCounties";
import { TOP_20_INDUSTRIES } from "@/data/topIndustries";

export default function MassLaunchConsole() {
  const [selectedStates, setSelectedStates] = useState([]);
  const [selectedCounties, setSelectedCounties] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [cityInput, setCityInput] = useState("");
  const [template, setTemplate] = useState(TOP_20_INDUSTRIES[0]);
  const [domainStrategy, setDomainStrategy] = useState("nearme_subdomain");
  const [domainBase, setDomainBase] = useState("epoxyquotenearme.com");
  const [provisionTarget, setProvisionTarget] = useState("vercel");
  const [contentOptimization, setContentOptimization] = useState("maximum");
  const [googleSync, setGoogleSync] = useState(true);
  const [autoHeal, setAutoHeal] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [batchResult, setBatchResult] = useState(null);
  const [domainSearch, setDomainSearch] = useState("");
  const [domainResults, setDomainResults] = useState([]);

  const availableCounties = useMemo(() => {
    const counties = [];
    selectedStates.forEach((st) => {
      (US_COUNTIES[st] || []).forEach((c) => counties.push({ state: st, county: c }));
    });
    return counties;
  }, [selectedStates]);

  const toggleState = (code) => {
    setSelectedStates((prev) =>
      prev.includes(code) ? prev.filter((s) => s !== code) : [...prev, code]
    );
  };

  const toggleCounty = (state, county) => {
    const key = `${county}, ${state}`;
    setSelectedCounties((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  };

  const addCity = () => {
    if (!cityInput.trim()) return;
    const parts = cityInput.split(",").map((p) => p.trim());
    const city = parts[0];
    const state = parts[1]?.toUpperCase() || selectedStates[0] || "";
    const county = parts[2] || "";
    if (city && state) {
      setSelectedCities((prev) => [...prev, { city, state, county }]);
      setCityInput("");
    }
  };

  const addAllCountiesAsCities = () => {
    const cities = selectedCounties.map((key) => {
      const [county, state] = key.split(", ");
      return { city: county.replace(/ County$/, ""), state, county };
    });
    setSelectedCities((prev) => [...prev, ...cities]);
  };

  const totalLocations = selectedCities.length;
  const totalSites = totalLocations;

  const searchDomains = async () => {
    if (!domainSearch.trim()) return;
    setDomainResults([
      { name: `${slugify(domainSearch)}nearme.com`, available: "UNKNOWN" },
      { name: `${slugify(domainSearch)}nearyou.com`, available: "UNKNOWN" },
      { name: `${slugify(domainSearch)}.com`, available: "UNKNOWN" },
    ]);
  };

  const launch = async () => {
    if (!totalLocations) return;
    setLaunching(true);
    setBatchResult(null);
    try {
      const res = await base44.functions.invoke("massLaunchOrchestrator", {
        templateKey: template.id,
        templateName: template.label,
        domainStrategy,
        domainBase,
        provisionTarget,
        locations: selectedCities,
        contentOptimization,
        googleSyncEnabled: googleSync,
        autoHealEnabled: autoHeal,
      });
      setBatchResult(res.data);
    } catch (err) {
      setBatchResult({ error: err.message });
    } finally {
      setLaunching(false);
    }
  };

  const continueBatch = async () => {
    if (!batchResult?.batch_id) return;
    setLaunching(true);
    try {
      const res = await base44.functions.invoke("massLaunchOrchestrator", {
        continueBatchId: batchResult.batch_id,
      });
      setBatchResult(res.data);
    } catch (err) {
      setBatchResult({ ...batchResult, error: err.message });
    } finally {
      setLaunching(false);
    }
  };

  const validateBatch = async () => {
    if (!batchResult?.batch_id) return;
    setLaunching(true);
    try {
      const res = await base44.functions.invoke("siteLaunchValidator", {
        batchId: batchResult.batch_id,
      });
      setBatchResult({ ...batchResult, validation: res.data });
    } catch (err) {
      setBatchResult({ ...batchResult, error: err.message });
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-stone-950 via-amber-950 to-stone-900 p-6 text-white border border-amber-500/30">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 grid place-items-center">
            <Rocket className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Mass Launch Console</h1>
            <p className="text-stone-400 text-sm">Select states → counties → cities → template → launch infinite sites with full Google compliance</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Location Selector */}
        <div className="lg:col-span-2 space-y-4">
          {/* States */}
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <h3 className="text-sm font-bold text-stone-800 mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-amber-500" /> 1. Select States
              <span className="text-xs text-stone-400">({selectedStates.length} selected)</span>
            </h3>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {US_STATES.map((s) => (
                <button
                  key={s.code}
                  onClick={() => toggleState(s.code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    selectedStates.includes(s.code)
                      ? "bg-amber-500 text-white border-amber-500"
                      : "bg-stone-100 text-stone-600 border border-stone-200 hover:border-amber-300"
                  }`}
                >
                  {s.code}
                </button>
              ))}
            </div>
          </div>

          {/* Counties */}
          {selectedStates.length > 0 && (
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-stone-800 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-amber-500" /> 2. Select Counties
                  <span className="text-xs text-stone-400">({selectedCounties.length} selected)</span>
                </h3>
                {selectedCounties.length > 0 && (
                  <button onClick={addAllCountiesAsCities} className="text-xs font-bold text-amber-600 hover:text-amber-700">
                    Add all as cities →
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {availableCounties.map(({ state, county }) => {
                  const key = `${county}, ${state}`;
                  return (
                    <button
                      key={key}
                      onClick={() => toggleCounty(state, county)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        selectedCounties.includes(key)
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-stone-100 text-stone-600 border border-stone-200 hover:border-emerald-300"
                      }`}
                    >
                      {county}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cities */}
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <h3 className="text-sm font-bold text-stone-800 mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-amber-500" /> 3. Cities / Locations
              <span className="text-xs text-stone-400">({totalLocations} total → {totalSites} sites)</span>
            </h3>
            <div className="flex gap-2 mb-3">
              <input
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCity()}
                placeholder="City, State, County (e.g. Miami, FL, Miami-Dade)"
                className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
              <button onClick={addCity} className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-bold text-white hover:bg-stone-700">
                Add
              </button>
            </div>
            {selectedCities.length > 0 && (
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                {selectedCities.map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-800">
                    {c.city}, {c.state}
                    <button onClick={() => setSelectedCities((prev) => prev.filter((_, idx) => idx !== i))} className="text-amber-400 hover:text-amber-600">×</button>
                  </span>
                ))}
                <button onClick={() => setSelectedCities([])} className="text-xs text-red-500 font-bold hover:text-red-600">Clear all</button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Config + Launch */}
        <div className="space-y-4">
          {/* Template */}
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <h3 className="text-sm font-bold text-stone-800 mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4 text-amber-500" /> 4. Template
            </h3>
            <select
              value={template.id}
              onChange={(e) => setTemplate(TOP_20_INDUSTRIES.find((t) => t.id === e.target.value))}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
            >
              {TOP_20_INDUSTRIES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <p className="text-xs text-stone-500 mt-2">{template.services?.length || 0} services · {template.pageTypes?.length || 0} page types</p>
          </div>

          {/* Domain Strategy */}
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <h3 className="text-sm font-bold text-stone-800 mb-3 flex items-center gap-2">
              <Globe className="h-4 w-4 text-amber-500" /> 5. Domain Strategy
            </h3>
            <select
              value={domainStrategy}
              onChange={(e) => setDomainStrategy(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500 mb-2"
            >
              <option value="nearme_subdomain">NearMe Subdomain (city.nearme.com)</option>
              <option value="nearme_domain">NearMe Domain (citynearme.com)</option>
              <option value="subfolder">Subfolder (domain.com/state/city)</option>
              <option value="custom">Custom Domain</option>
            </select>
            <input
              value={domainBase}
              onChange={(e) => setDomainBase(e.target.value)}
              placeholder="Base domain"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
            />
          </div>

          {/* Domain Search */}
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <h3 className="text-sm font-bold text-stone-800 mb-3 flex items-center gap-2">
              <Search className="h-4 w-4 text-amber-500" /> Domain Name Search
            </h3>
            <div className="flex gap-2">
              <input
                value={domainSearch}
                onChange={(e) => setDomainSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchDomains()}
                placeholder="e.g. epoxy flooring"
                className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
              <button onClick={searchDomains} className="rounded-lg bg-stone-800 px-3 py-2 text-sm font-bold text-white">Search</button>
            </div>
            {domainResults.length > 0 && (
              <div className="mt-2 space-y-1">
                {domainResults.map((d) => (
                  <div key={d.name} className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-1.5 text-xs">
                    <span className="font-mono font-semibold text-stone-700">{d.name}</span>
                    <span className="text-stone-400">{d.available}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Provisioning + Optimization */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
            <h3 className="text-sm font-bold text-stone-800 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" /> 6. Provisioning & Optimization
            </h3>
            <div>
              <label className="text-xs font-semibold text-stone-500">Provision Target</label>
              <select value={provisionTarget} onChange={(e) => setProvisionTarget(e.target.value)} className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500">
                <option value="vercel">Vercel (auto-deploy)</option>
                <option value="godaddy">GoDaddy (domain)</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-500">Content Optimization</label>
              <select value={contentOptimization} onChange={(e) => setContentOptimization(e.target.value)} className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500">
                <option value="seo">SEO only</option>
                <option value="seo_aeo">SEO + AEO</option>
                <option value="seo_aeo_geo">SEO + AEO + GEO</option>
                <option value="maximum">Maximum (SEO + AEO + GEO + Structured Data)</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input type="checkbox" checked={googleSync} onChange={(e) => setGoogleSync(e.target.checked)} className="rounded" />
              Auto-sync Google Analytics + Search Console
            </label>
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input type="checkbox" checked={autoHeal} onChange={(e) => setAutoHeal(e.target.checked)} className="rounded" />
              Auto-heal sites scoring below 90
            </label>
          </div>

          {/* Launch */}
          <button
            onClick={launch}
            disabled={!totalLocations || launching}
            className="w-full rounded-xl bg-amber-500 py-4 text-sm font-extrabold text-stone-900 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {launching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Rocket className="h-5 w-5" />}
            {launching ? "Launching..." : `Launch ${totalSites} Site${totalSites !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>

      {/* Results */}
      {batchResult && (
        <div className="rounded-2xl border border-stone-300 bg-white p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-bold text-stone-800">Launch Results</h2>
          </div>
          {batchResult.error ? (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{batchResult.error}</div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Total Sites" value={batchResult.total_sites} />
                <Stat label="Processed" value={batchResult.processed_this_run} />
                <Stat label="Deployed" value={batchResult.deployed} />
                <Stat label="Validated" value={batchResult.validated} />
                <Stat label="Scored" value={batchResult.scored} />
                <Stat label="Failed" value={batchResult.failed} />
                <Stat label="Avg Google Score" value={batchResult.average_google_score} />
                <Stat label="Remaining" value={batchResult.remaining} />
              </div>
              <p className="text-sm text-stone-600">{batchResult.message}</p>
              <div className="flex gap-3">
                {batchResult.remaining > 0 && (
                  <button onClick={continueBatch} disabled={launching} className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-bold text-white hover:bg-stone-700 disabled:opacity-40">
                    {launching ? "Processing..." : "Continue Batch"}
                  </button>
                )}
                <button onClick={validateBatch} disabled={launching} className="rounded-lg border border-amber-500 px-4 py-2 text-sm font-bold text-amber-600 hover:bg-amber-50 disabled:opacity-40">
                  Validate & Score
                </button>
              </div>
              {batchResult.validation && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 space-y-2">
                  <p className="font-bold text-emerald-800">Validation Complete</p>
                  <p className="text-sm text-emerald-700">
                    {batchResult.validation.passed}/{batchResult.validation.total_sites} passed ·
                    Average Google Score: {batchResult.validation.average_google_score}/100 ·
                    Gap to 100: {batchResult.validation.gap_to_100}
                  </p>
                  {batchResult.validation.sites?.slice(0, 5).map((s) => (
                    <div key={s.site_id} className="text-xs text-stone-600 border-t border-emerald-200 pt-2">
                      <span className="font-bold">{s.city}, {s.state}</span> — Score: {s.google_score}/100
                      {s.recommendations?.length > 0 && <span className="text-stone-500"> · {s.recommendations[0]}</span>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-stone-50 border border-stone-200 p-3">
      <p className="text-xs text-stone-500 font-semibold">{label}</p>
      <p className="text-2xl font-black text-stone-800">{value ?? 0}</p>
    </div>
  );
}