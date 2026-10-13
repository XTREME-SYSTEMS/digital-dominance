import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Smartphone, Save, Loader2, CheckCircle2, AlertCircle, Rocket, Copy, ExternalLink, Globe } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AdminSystemPage from "@/components/launch-engine-admin/AdminSystemPage";
import CategoryGrid from "@/components/pwa-factory/CategoryGrid";
import ConfigPanel from "@/components/pwa-factory/ConfigPanel";
import PreviewCanvas from "@/components/pwa-factory/PreviewCanvas";
import { DEFAULT_CONFIG, darken, themeToCssVars } from "@/lib/pwa-factory/studioConfig.js";
import { renderPreview, GALLERY_FAMILIES } from "@/lib/pwa-factory/previewRenderer.js";
import { PREVIEW_STYLES } from "@/lib/pwa-factory/previewStyles.js";

export default function PwaAppFactory() {
  const queryClient = useQueryClient();
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [pattern, setPattern] = useState(null);
  const [viewport, setViewport] = useState("mobile");
  const [form, setForm] = useState({ app_name: "", app_slug: "", nav_config: null });
  const [saving, setSaving] = useState(false);
  const [savedBuild, setSavedBuild] = useState(null);
  const [error, setError] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState(null);

  const { data: builds = [], isLoading: buildsLoading } = useQuery({
    queryKey: ["pwa-app-builds"],
    queryFn: async () => {
      const page = await base44.entities.AppBuild.filter({ platform: "pwa" }, { sort: "-created_date", limit: 50 });
      return page.items || [];
    },
  });

  useEffect(() => {
    if (!selectedIndustry) return;
    setConfig((c) => ({
      ...c,
      primaryColor: selectedIndustry.accentColor || c.primaryColor,
      secondaryColor: selectedIndustry.accentColor ? darken(selectedIndustry.accentColor, 0.3) : c.secondaryColor,
      logoText: selectedIndustry.label,
      heading: selectedIndustry.label,
      brandName: selectedIndustry.label,
    }));
    setForm((f) => ({
      ...f,
      app_name: f.app_name || `${selectedIndustry.label} App`,
      app_slug: f.app_slug || selectedIndustry.id,
    }));
  }, [selectedIndustry]);

  const handleSave = async () => {
    if (!form.app_name || !form.app_slug) {
      setError("App name and slug are required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const navConfig = form.nav_config || [
        { label: "Home", icon: "Home", route: "/" },
        { label: "Services", icon: "Wrench", route: "/services" },
        { label: "Gallery", icon: "Images", route: "/gallery" },
        { label: "About", icon: "Info", route: "/about" },
        { label: "Call", icon: "Phone", route: "/contact" },
      ];
      const manifest = {
        name: form.app_name,
        short_name: form.app_name.slice(0, 12),
        theme_color: config.primaryColor,
        background_color: config.themeMode === "dark" ? "#0a0a0a" : "#ffffff",
        display: "standalone",
        orientation: "portrait",
      };
      const record = await base44.entities.AppBuild.create({
        app_name: form.app_name,
        app_slug: form.app_slug,
        platform: "pwa",
        status: "built",
        manifest,
        nav_config: navConfig,
        description: `PWA for ${selectedIndustry?.label || form.app_name} — pattern ${pattern || "default"}`,
        icon_url: config.logoImage || "",
      });
      setSavedBuild(record);
      queryClient.invalidateQueries({ queryKey: ["pwa-app-builds"] });
    } catch (e) {
      setError(e.message || "Failed to save build");
    } finally {
      setSaving(false);
    }
  };

  const copyManifest = () => {
    const manifest = {
      name: form.app_name,
      short_name: form.app_name?.slice(0, 12),
      theme_color: config.primaryColor,
      background_color: config.themeMode === "dark" ? "#0a0a0a" : "#ffffff",
      display: "standalone",
      orientation: "portrait",
      icons: [],
    };
    navigator.clipboard.writeText(JSON.stringify(manifest, null, 2));
  };

  const buildStandaloneHtml = () => {
    const platform = viewport === "desktop" ? "desktop" : "mobile";
    const pool = platform === "mobile" ? GALLERY_FAMILIES[1].items : GALLERY_FAMILIES[0].items;
    const template = pattern ? (pool.find((p) => p.id === pattern) || pool[0]) : pool[0];
    const rendered = renderPreview(template, platform, config);
    const cssVars = themeToCssVars(config);
    const varsCss = Object.entries(cssVars).map(([k, v]) => `${k}:${v}`).join(";");
    const fontHref = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(config.fontFamily || "Roboto").replace(/%20/g, "+")}:wght@400;500;700;900&display=swap`;
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${form.app_name || "PWA App"}</title>
<meta name="description" content="${config.subtitle || form.app_name || ""}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="${fontHref}" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%}
body{font-family:'${config.fontFamily || "Roboto"}',sans-serif}
${PREVIEW_STYLES}
</style>
</head>
<body style="${varsCss}">
<div style="display:flex;flex-direction:column;height:100vh;height:100dvh">
${rendered.html}
</div>
</body>
</html>`;
  };

  const handlePublishLive = async () => {
    if (!savedBuild) {
      setError("Save the build first before publishing live.");
      return;
    }
    setPublishing(true);
    setError(null);
    setPublishedUrl(null);
    try {
      const html = buildStandaloneHtml();
      const manifest = {
        name: form.app_name,
        short_name: form.app_name?.slice(0, 12),
        theme_color: config.primaryColor,
        background_color: config.themeMode === "dark" ? "#0a0a0a" : "#ffffff",
        display: "standalone",
        orientation: "portrait",
      };
      const res = await base44.functions.invoke("pwaPublishLive", {
        buildId: savedBuild.id,
        appName: form.app_name,
        appSlug: form.app_slug,
        html,
        manifest,
        navConfig: form.nav_config,
      });
      setPublishedUrl(res.data?.url || null);
      queryClient.invalidateQueries({ queryKey: ["pwa-app-builds"] });
    } catch (e) {
      setError(e.message || "Failed to publish live");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <AdminSystemPage
      eyebrow="PWA FACTORY · V1"
      title="PWA App Factory"
      description="Generate templated Progressive Web Apps from 20 industry categories with live visual preview."
      badge="◈ ACTIVE SYSTEM"
      stats={[
        ["Industry categories", "20"],
        ["Mobile patterns", "32"],
        ["Desktop patterns", "32"],
        ["PWA builds", String(builds.length)],
      ]}
    >
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="w-full lg:w-[380px] shrink-0 space-y-4">
          <CategoryGrid selected={selectedIndustry} onSelect={setSelectedIndustry} />
          <ConfigPanel
            config={config}
            setConfig={setConfig}
            pattern={pattern}
            setPattern={setPattern}
            viewport={viewport}
            setViewport={setViewport}
            form={form}
            setForm={setForm}
            selectedIndustry={selectedIndustry}
          />
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="wle-action flex-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save PWA Build
            </button>
            <button onClick={copyManifest} className="wle-action" style={{ background: "#607790" }}>
              <Copy className="w-4 h-4" /> Manifest
            </button>
          </div>
          <button
            onClick={handlePublishLive}
            disabled={publishing || !savedBuild}
            className="wle-action w-full"
            style={{ background: "linear-gradient(135deg, #126fc8, #0d9488)" }}
          >
            {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            {publishing ? "Publishing live..." : "Publish Live to Web"}
          </button>
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
          {savedBuild && !publishedUrl && (
            <div className="flex items-center gap-2 text-[#16a34a] text-sm bg-green-50 border border-green-200 rounded-lg p-3">
              <CheckCircle2 className="w-4 h-4" /> Saved: {savedBuild.app_name}
            </div>
          )}
          {publishedUrl && (
            <div className="flex items-center gap-2 text-[#16a34a] text-sm bg-green-50 border border-green-200 rounded-lg p-3">
              <CheckCircle2 className="w-4 h-4" /> Published live!
              <a href={publishedUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-bold text-[#126fc8] hover:underline ml-1">
                <ExternalLink className="w-3.5 h-3.5" /> {publishedUrl.replace("https://", "")}
              </a>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 rounded-xl border border-[#e4e4e7] overflow-hidden bg-white shadow-sm">
          <PreviewCanvas config={config} pattern={pattern} viewport={viewport} />
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-[#dce6f1] bg-white p-5">
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-[#112940]">
          <Smartphone className="w-4 h-4 text-[#126fc8]" /> Existing PWA Builds ({builds.length})
        </h3>
        {buildsLoading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-[#607790]" /></div>
        ) : builds.length === 0 ? (
          <p className="text-sm text-[#607790] text-center py-8">No PWA builds yet. Select an industry and save your first app.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {builds.map((b) => (
              <div key={b.id} className="rounded-lg border border-[#e4edf5] p-3 hover:shadow-sm transition">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold text-[#112940]">{b.app_name}</p>
                    <p className="text-[10px] font-mono text-[#8faec9]">/{b.app_slug}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#126fc8]/10 text-[#126fc8]">{b.status}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-4 h-4 rounded-full border border-[#e4e4e7]" style={{ background: b.manifest?.theme_color }} />
                  <span className="text-[10px] text-[#607790]">{b.manifest?.display || "standalone"}</span>
                  <span className="text-[10px] text-[#8faec9]">·</span>
                  <span className="text-[10px] text-[#607790]">{b.nav_config?.length || 0} nav items</span>
                </div>
                <div className="flex gap-1.5">
                  {b.published_url && (
                    <a href={b.published_url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1 h-7 rounded-lg bg-[#126fc8]/10 text-[#126fc8] text-xs font-bold hover:bg-[#126fc8]/20">
                      <ExternalLink className="w-3 h-3" /> Open
                    </a>
                  )}
                  <button onClick={() => { setForm({ app_name: b.app_name, app_slug: b.app_slug, nav_config: b.nav_config }); setConfig({ ...DEFAULT_CONFIG, primaryColor: b.manifest?.theme_color || DEFAULT_CONFIG.primaryColor }); }} className="flex-1 flex items-center justify-center gap-1 h-7 rounded-lg bg-gray-100 text-[#607790] text-xs font-bold hover:bg-gray-200">
                    <Rocket className="w-3 h-3" /> Load
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminSystemPage>
  );
}