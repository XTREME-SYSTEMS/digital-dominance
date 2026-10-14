import React, { useState, useEffect, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Layers, Plus, Search, RefreshCw, Loader2, Copy, Trash2, Save, Settings, Globe, X } from "lucide-react";
import { BRAND_PRESETS, getPreset, CATEGORY_OPTIONS, NICHE_OPTIONS, defaultSections } from "@/lib/universal-template/brandPresets.js";
import { loadConfig, saveConfig, configFromBrandPreset, loadFont } from "@/lib/universal-template/studioConfig.js";
import TemplateCard from "@/components/universal-template/TemplateCard.jsx";
import BrandConfigPanel from "@/components/universal-template/BrandConfigPanel.jsx";
import TemplateEditor from "@/components/universal-template/TemplateEditor.jsx";
import IngestionPanel from "@/components/universal-template/IngestionPanel.jsx";
import GptTemplateIntake from "@/components/universal-template/GptTemplateIntake.jsx";

export default function UniversalTemplateStudio() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [config, setConfig] = useState(loadConfig());
  const [activeBrand, setActiveBrand] = useState("xtremepolishingsystems");
  const [tab, setTab] = useState("templates");
  const [saving, setSaving] = useState(false);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const page = await base44.entities.BrandTemplate.filter({}, { sort: "-created_date", limit: 100 });
      setTemplates(page.items || []);
    } catch (e) {
      console.error("Failed to load templates:", e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  // When brand changes, update config from preset
  useEffect(() => {
    const preset = getPreset(activeBrand);
    const newConfig = configFromBrandPreset(preset);
    setConfig(newConfig);
    saveConfig(newConfig);
    loadFont(preset.font_heading);
    loadFont(preset.font_body);
  }, [activeBrand]);

  // When editing, update config from the template's brand_config if present
  useEffect(() => {
    if (editing?.brand_config) {
      setConfig(configFromBrandPreset(editing.brand_config));
    }
  }, [editing?.id]);

  const updateConfig = (next) => {
    setConfig(next);
    saveConfig(next);
    loadFont(next.fontHeading);
    loadFont(next.fontFamily);
  };

  const filtered = useMemo(() => {
    let list = templates;
    if (brandFilter !== "all") list = list.filter((t) => t.brand_id === brandFilter);
    if (!query) return list;
    const q = query.toLowerCase();
    return list.filter((t) => (t.name || "").toLowerCase().includes(q) || (t.template_key || "").toLowerCase().includes(q));
  }, [templates, query, brandFilter]);

  const createTemplate = async () => {
    const preset = getPreset(activeBrand);
    const key = `${preset.short.toLowerCase()}-${Date.now().toString(36)}`;
    const newTemplate = {
      template_key: key,
      name: `${preset.name} — New Template`,
      brand_id: activeBrand,
      brand_config: {
        brand_name: preset.name,
        domain: preset.domain,
        primary_color: preset.primary_color,
        secondary_color: preset.secondary_color,
        accent_color: preset.accent_color,
        logo_url: preset.logo_url,
        logo_text: preset.logo_text,
        font_heading: preset.font_heading,
        font_body: preset.font_body,
        phone: preset.phone,
        tagline: preset.tagline,
      },
      category: "homepage",
      niche: preset.niche,
      sections: defaultSections("homepage"),
      version: "1.0.0",
      status: "draft",
    };
    try {
      const rec = await base44.entities.BrandTemplate.create(newTemplate);
      await loadTemplates();
      setSelectedId(rec.id);
      setEditing(rec);
      setTab("editor");
    } catch (e) {
      console.error("Create failed:", e.message);
      alert("Failed to create template: " + e.message);
    }
  };

  const cloneTemplate = async (t) => {
    const key = `${t.template_key}-v${Date.now().toString(36)}`;
    try {
      const rec = await base44.entities.BrandTemplate.create({
        ...t,
        template_key: key,
        name: `${t.name} (Copy)`,
        status: "draft",
        version: "1.0.0",
        parent_version: t.version,
      });
      delete rec.id;
      await loadTemplates();
      setSelectedId(rec.id);
      setEditing(rec);
    } catch (e) {
      alert("Clone failed: " + e.message);
    }
  };

  const saveTemplate = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const { id, created_date, updated_date, created_by_id, owner_id, ...patch } = editing;
      // Sync brand_config from current studio config
      patch.brand_config = {
        brand_name: config.brandName,
        domain: getPreset(editing.brand_id).domain,
        primary_color: config.primaryColor,
        secondary_color: config.secondaryColor,
        accent_color: config.accentColor,
        logo_url: config.logoImage,
        logo_text: config.logoText,
        font_heading: config.fontHeading,
        font_body: config.fontFamily,
        phone: config.phone,
        tagline: config.tagline,
      };
      await base44.entities.BrandTemplate.update(editing.id, patch);
      await loadTemplates();
    } catch (e) {
      alert("Save failed: " + e.message);
    }
    setSaving(false);
  };

  const deleteTemplate = async (t) => {
    if (!confirm(`Delete "${t.name}"? This cannot be undone.`)) return;
    try {
      await base44.entities.BrandTemplate.delete(t.id);
      if (selectedId === t.id) { setSelectedId(null); setEditing(null); setTab("templates"); }
      loadTemplates();
    } catch (e) {
      alert("Delete failed: " + e.message);
    }
  };

  const selectTemplate = (t) => {
    setSelectedId(t.id);
    setEditing(t);
    setTab("editor");
  };

  const tabCls = (on) => `inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${on ? "bg-stone-900 text-white" : "border border-stone-300 text-stone-600 hover:bg-stone-50"}`;

  return (
    <div className="space-y-5 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 grid place-items-center">
            <Layers className="h-6 w-6 text-stone-950" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-stone-900">Universal Template Studio</h1>
            <p className="text-sm text-stone-500">Build and version templates for XPS, NCP, PCU, and any concrete contractor.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={createTemplate} className="px-4 py-2 rounded-lg bg-stone-900 text-white text-sm font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Template
          </button>
          <button onClick={loadTemplates} className="p-2 rounded-lg border border-stone-300">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
        <button onClick={() => setTab("templates")} className={tabCls(tab === "templates")}><Layers className="w-4 h-4" /> Templates</button>
        <button onClick={() => setTab("editor")} className={tabCls(tab === "editor")} disabled={!editing}><Settings className="w-4 h-4" /> Editor</button>
        <button onClick={() => setTab("ingestion")} className={tabCls(tab === "ingestion")}><Globe className="w-4 h-4" /> XPS Ingestion</button>
        <button onClick={() => setTab("gpt-intake")} className={tabCls(tab === "gpt-intake")}><Layers className="w-4 h-4" /> GPT Intake · Review</button>
      </div>

      {/* Read-only cross-entity GPT intake; existing BrandTemplate editor preserved. */}
      {tab === "gpt-intake" && <GptTemplateIntake />}

      {/* Templates tab */}
      {tab === "templates" && (
        <div className="space-y-4">
          {/* Brand filter + search */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button onClick={() => setBrandFilter("all")} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${brandFilter === "all" ? "bg-stone-900 text-white" : "border border-stone-300 text-stone-600"}`}>All Brands</button>
              {Object.values(BRAND_PRESETS).map((b) => (
                <button key={b.id} onClick={() => { setBrandFilter(b.id); setActiveBrand(b.id); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${brandFilter === b.id ? "bg-stone-900 text-white" : "border border-stone-300 text-stone-600"}`}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: b.primary_color }} />
                  {b.short}
                </button>
              ))}
            </div>
            <div className="relative ml-auto">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search templates…" className="pl-8 pr-3 py-1.5 text-sm border border-stone-300 rounded-lg w-48" />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-stone-400" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-stone-200 rounded-xl">
              <Layers className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-500 font-bold">No templates yet</p>
              <p className="text-sm text-stone-400 mt-1">Click "New Template" to create your first one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((t) => (
                <div key={t.id} className="relative group">
                  <TemplateCard template={t} config={configFromBrandPreset(t.brand_config || getPreset(t.brand_id))} onClick={() => selectTemplate(t)} selected={selectedId === t.id} />
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); cloneTemplate(t); }} className="p-1.5 rounded-lg bg-white border border-stone-200 shadow-sm hover:bg-stone-50" title="Clone"><Copy className="w-3.5 h-3.5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); deleteTemplate(t); }} className="p-1.5 rounded-lg bg-white border border-stone-200 shadow-sm hover:bg-red-50 text-red-500" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Editor tab */}
      {tab === "editor" && editing && (
        <div className="space-y-4">
          {/* Template meta bar */}
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <input type="text" value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="text-lg font-black text-stone-900 border-0 border-b-2 border-transparent focus:border-amber-500 outline-none flex-1 min-w-0 bg-transparent" />
                <span className="text-[10px] font-mono px-2 py-1 rounded bg-stone-100 text-stone-500 shrink-0">{editing.template_key}</span>
              </div>
              <div className="flex items-center gap-2">
                <select value={editing.category || "homepage"} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="text-xs px-2 py-1.5 border border-stone-300 rounded-lg bg-white">
                  {CATEGORY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <select value={editing.niche || "epoxy_garage"} onChange={(e) => setEditing({ ...editing, niche: e.target.value })} className="text-xs px-2 py-1.5 border border-stone-300 rounded-lg bg-white">
                  {NICHE_OPTIONS.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
                </select>
                <select value={editing.status || "draft"} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className="text-xs px-2 py-1.5 border border-stone-300 rounded-lg bg-white">
                  <option value="draft">Draft</option>
                  <option value="review">Review</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
                <button onClick={saveTemplate} disabled={saving} className="px-4 py-1.5 rounded-lg bg-amber-500 text-stone-950 text-sm font-bold flex items-center gap-1.5 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                </button>
                <button onClick={() => { setEditing(null); setSelectedId(null); setTab("templates"); }} className="p-1.5 rounded-lg border border-stone-300"><X className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          {/* Brand config + editor side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <h3 className="text-sm font-black text-stone-900 mb-3">Brand Config</h3>
              <BrandConfigPanel config={config} onChange={updateConfig} brandId={editing.brand_id || activeBrand} onBrandChange={(bid) => {
                setActiveBrand(bid);
                setEditing({ ...editing, brand_id: bid });
              }} />
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <TemplateEditor template={editing} config={config} onChange={setEditing} />
            </div>
          </div>
        </div>
      )}

      {tab === "editor" && !editing && (
        <div className="text-center py-16 text-stone-500">
          <Settings className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <p className="font-bold">No template selected</p>
          <p className="text-sm mt-1">Select a template from the Templates tab, or create a new one.</p>
        </div>
      )}

      {/* Ingestion tab */}
      {tab === "ingestion" && <IngestionPanel />}
    </div>
  );
}