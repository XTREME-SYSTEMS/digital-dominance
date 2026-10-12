import React, { useState, useEffect } from "react";
import { Target, Save, Rocket, Trash2, Edit, Copy, Loader2, Check, Globe, Zap, Brain, Shield } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { TOP_20_INDUSTRIES } from "@/data/topIndustries";
import LocationTargetingSystem from "@/components/targeting/LocationTargetingSystem";

const EMPTY_CONFIG = {
  name: "",
  template_key: TOP_20_INDUSTRIES[0].id,
  template_name: TOP_20_INDUSTRIES[0].label,
  domain_strategy: "nearme_subdomain",
  domain_base: "epoxyquotenearme.com",
  provision_target: "vercel",
  content_optimization: "maximum",
  google_sync_enabled: true,
  auto_heal_enabled: true,
  selectedStates: [],
  selectedCounties: [],
  selectedCities: [],
};

export default function ProgrammaticTargeting() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [config, setConfig] = useState(EMPTY_CONFIG);
  const [saving, setSaving] = useState(false);
  const [launching, setLaunching] = useState(null);
  const [launchResult, setLaunchResult] = useState(null);

  useEffect(() => { loadConfigs(); }, []);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.ProgrammaticTarget.filter({}, { sort: '-created_date', limit: 100 });
      setConfigs(res.items || res);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const save = async () => {
    if (!config.name) return;
    setSaving(true);
    try {
      const payload = {
        name: config.name,
        template_key: config.template_key,
        template_name: config.template_name,
        selected_states: config.selectedStates,
        selected_counties: config.selectedCounties,
        selected_cities: config.selectedCities,
        domain_strategy: config.domain_strategy,
        domain_base: config.domain_base,
        provision_target: config.provision_target,
        content_optimization: config.content_optimization,
        google_sync_enabled: config.google_sync_enabled,
        auto_heal_enabled: config.auto_heal_enabled,
        total_sites: config.selectedCities.length,
        status: config.selectedCities.length > 0 ? "ready" : "draft",
      };
      if (editing) {
        await base44.entities.ProgrammaticTarget.update(editing, payload);
      } else {
        const created = await base44.entities.ProgrammaticTarget.create(payload);
        setEditing(created.id);
      }
      await loadConfigs();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const editConfig = (c) => {
    setEditing(c.id);
    setConfig({
      name: c.name,
      template_key: c.template_key,
      template_name: c.template_name || "",
      domain_strategy: c.domain_strategy || "nearme_subdomain",
      domain_base: c.domain_base || "",
      provision_target: c.provision_target || "vercel",
      content_optimization: c.content_optimization || "maximum",
      google_sync_enabled: c.google_sync_enabled ?? true,
      auto_heal_enabled: c.auto_heal_enabled ?? true,
      selectedStates: c.selected_states || [],
      selectedCounties: c.selected_counties || [],
      selectedCities: c.selected_cities || [],
    });
    setLaunchResult(null);
  };

  const newConfig = () => {
    setEditing(null);
    setConfig(EMPTY_CONFIG);
    setLaunchResult(null);
  };

  const duplicate = async (c) => {
    await base44.entities.ProgrammaticTarget.create({
      ...c,
      name: `${c.name} (Copy)`,
      status: "draft",
      batch_ids: [],
    });
    loadConfigs();
  };

  const remove = async (c) => {
    if (!confirm(`Delete "${c.name}"?`)) return;
    await base44.entities.ProgrammaticTarget.delete(c.id);
    if (editing === c.id) newConfig();
    loadConfigs();
  };

  const launch = async (c) => {
    setLaunching(c.id);
    setLaunchResult(null);
    try {
      const res = await base44.functions.invoke("massLaunchOrchestrator", {
        targetId: c.id,
        templateKey: c.template_key,
        templateName: c.template_name,
        domainStrategy: c.domain_strategy,
        domainBase: c.domain_base,
        provisionTarget: c.provision_target,
        locations: c.selected_cities || [],
        contentOptimization: c.content_optimization,
        googleSyncEnabled: c.google_sync_enabled,
        autoHealEnabled: c.auto_heal_enabled,
      });
      setLaunchResult({ configId: c.id, data: res.data });
      // Update config status
      await base44.entities.ProgrammaticTarget.update(c.id, {
        status: "active",
        last_launched_at: new Date().toISOString(),
        batch_ids: [...(c.batch_ids || []), res.data.batch_id],
      });
      loadConfigs();
    } catch (err) {
      setLaunchResult({ configId: c.id, error: err.message });
    } finally {
      setLaunching(null);
    }
  };

  const updateField = (field, value) => setConfig((prev) => ({ ...prev, [field]: value }));

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-stone-950 via-amber-950 to-stone-900 p-6 text-white border border-amber-500/30">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 grid place-items-center">
            <Target className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-extrabold tracking-tight">Programmatic Targeting System</h1>
            <p className="text-stone-400 text-sm">Save reusable state → county → city targeting configs for automated mass launches</p>
          </div>
          <button onClick={newConfig} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-stone-900 hover:bg-amber-400 flex items-center gap-2">
            <Target className="h-4 w-4" /> New Target
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Saved configs */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-stone-800">Saved Targeting Configs</h2>
          {configs.length === 0 ? (
            <div className="rounded-xl border border-stone-200 bg-white p-6 text-center text-sm text-stone-500">
              No configs yet. Create one to get started.
            </div>
          ) : (
            configs.map((c) => (
              <div key={c.id} className={`rounded-xl border p-4 transition ${editing === c.id ? "border-amber-500 bg-amber-50" : "border-stone-200 bg-white"}`}>
                <div className="flex items-center justify-between mb-2">
                  <button onClick={() => editConfig(c)} className="text-sm font-bold text-stone-800 hover:text-amber-600 text-left">
                    {c.name}
                  </button>
                  <StatusBadge status={c.status} />
                </div>
                <p className="text-xs text-stone-500 mb-2">{c.template_name}</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {(c.selected_states || []).slice(0, 8).map((s) => (
                    <span key={s} className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold text-stone-600">{s}</span>
                  ))}
                  {(c.selected_states || []).length > 8 && <span className="text-[10px] text-stone-400">+{c.selected_states.length - 8}</span>}
                </div>
                <div className="flex items-center justify-between text-xs text-stone-500 mb-3">
                  <span>{c.total_sites || (c.selected_cities || []).length} sites</span>
                  <span className="font-bold text-amber-600">{c.domain_strategy?.replace(/_/g, " ")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => launch(c)} disabled={launching === c.id || (c.selected_cities || []).length === 0}
                    className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-stone-900 hover:bg-amber-400 disabled:opacity-40 flex items-center gap-1">
                    {launching === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Rocket className="h-3 w-3" />}
                    Launch
                  </button>
                  <button onClick={() => editConfig(c)} className="rounded-lg border border-stone-200 px-2 py-1.5 text-xs text-stone-600 hover:bg-stone-50">
                    <Edit className="h-3 w-3" />
                  </button>
                  <button onClick={() => duplicate(c)} className="rounded-lg border border-stone-200 px-2 py-1.5 text-xs text-stone-600 hover:bg-stone-50">
                    <Copy className="h-3 w-3" />
                  </button>
                  <button onClick={() => remove(c)} className="rounded-lg border border-red-200 px-2 py-1.5 text-xs text-red-500 hover:bg-red-50">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                {launchResult?.configId === c.id && (
                  <div className={`mt-2 rounded-lg p-2 text-xs ${launchResult.error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                    {launchResult.error || `${launchResult.data.deployed}/${launchResult.data.total_sites} deployed · Score: ${launchResult.data.average_google_score}/100`}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Right: Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-stone-500 mb-1 block">Config Name</label>
                <input value={config.name} onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g. Florida Epoxy Domination"
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-500 mb-1 block">Template</label>
                <select value={config.template_key}
                  onChange={(e) => { const t = TOP_20_INDUSTRIES.find((x) => x.id === e.target.value); updateField("template_key", e.target.value); updateField("template_name", t?.label || ""); }}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500">
                  {TOP_20_INDUSTRIES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
            </div>

            {/* Location targeting */}
            <LocationTargetingSystem
              value={{ selectedStates: config.selectedStates, selectedCounties: config.selectedCounties, selectedCities: config.selectedCities }}
              onChange={(v) => setConfig((prev) => ({ ...prev, ...v }))}
            />

            {/* Config grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-stone-100">
              <div>
                <label className="text-xs font-bold text-stone-500 mb-1 block flex items-center gap-1"><Globe className="h-3 w-3" /> Domain Strategy</label>
                <select value={config.domain_strategy} onChange={(e) => updateField("domain_strategy", e.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-2 py-2 text-xs outline-none focus:border-amber-500">
                  <option value="nearme_subdomain">NearMe Subdomain</option>
                  <option value="nearme_domain">NearMe Domain</option>
                  <option value="subfolder">Subfolder</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-stone-500 mb-1 block">Domain Base</label>
                <input value={config.domain_base} onChange={(e) => updateField("domain_base", e.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-2 py-2 text-xs outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-500 mb-1 block flex items-center gap-1"><Zap className="h-3 w-3" /> Provision</label>
                <select value={config.provision_target} onChange={(e) => updateField("provision_target", e.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-2 py-2 text-xs outline-none focus:border-amber-500">
                  <option value="vercel">Vercel</option>
                  <option value="godaddy">GoDaddy</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-stone-500 mb-1 block flex items-center gap-1"><Brain className="h-3 w-3" /> Optimization</label>
                <select value={config.content_optimization} onChange={(e) => updateField("content_optimization", e.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-2 py-2 text-xs outline-none focus:border-amber-500">
                  <option value="seo">SEO</option>
                  <option value="seo_aeo">SEO+AEO</option>
                  <option value="seo_aeo_geo">SEO+AEO+GEO</option>
                  <option value="maximum">Maximum</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-stone-700">
                <input type="checkbox" checked={config.google_sync_enabled} onChange={(e) => updateField("google_sync_enabled", e.target.checked)} className="rounded" />
                Google sync
              </label>
              <label className="flex items-center gap-2 text-xs text-stone-700">
                <input type="checkbox" checked={config.auto_heal_enabled} onChange={(e) => updateField("auto_heal_enabled", e.target.checked)} className="rounded" />
                Auto-heal
              </label>
            </div>

            <button onClick={save} disabled={!config.name || saving}
              className="w-full rounded-xl bg-stone-800 py-3 text-sm font-bold text-white hover:bg-stone-700 disabled:opacity-40 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editing ? "Update Target Config" : "Save Target Config"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    draft: "bg-stone-100 text-stone-500",
    ready: "bg-blue-100 text-blue-700",
    launching: "bg-amber-100 text-amber-700",
    active: "bg-emerald-100 text-emerald-700",
    archived: "bg-stone-100 text-stone-400",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${styles[status] || styles.draft}`}>{status}</span>;
}