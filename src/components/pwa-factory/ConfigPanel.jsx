import React, { useState } from "react";
import { ChevronDown, ChevronRight, Palette, Type, LayoutGrid, Plus, Trash2, GripVertical } from "lucide-react";
import { GALLERY_FAMILIES } from "@/lib/pwa-factory/previewRenderer.js";
import { PRESETS, FONT_OPTIONS, loadFont } from "@/lib/pwa-factory/studioConfig.js";

const DEFAULT_NAV = [
  { label: "Home", icon: "Home", route: "/" },
  { label: "Services", icon: "Wrench", route: "/services" },
  { label: "Gallery", icon: "Images", route: "/gallery" },
  { label: "About", icon: "Info", route: "/about" },
  { label: "Call", icon: "Phone", route: "/contact" },
];

function Section({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-[#e4e4e7] bg-white overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-[#112940] hover:bg-[#f8fbfe]">
        <Icon className="w-3.5 h-3.5 text-[#126fc8]" />
        <span className="flex-1 text-left">{title}</span>
        {open ? <ChevronDown className="w-3.5 h-3.5 text-[#8faec9]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#8faec9]" />}
      </button>
      {open && <div className="px-3 pb-3 space-y-3">{children}</div>}
    </div>
  );
}

export default function ConfigPanel({ config, setConfig, pattern, setPattern, viewport, setViewport, form, setForm, selectedIndustry }) {
  const mobilePatterns = GALLERY_FAMILIES[1].items;
  const desktopPatterns = GALLERY_FAMILIES[0].items;
  const allPatterns = viewport === "desktop" ? desktopPatterns : mobilePatterns;

  // Filter patterns based on selected industry — each industry maps to
  // recommended layout patterns so the correct templates display.
  const INDUSTRY_PATTERN_MAP = {
    water_damage: ["M01", "M03", "M23", "D01", "D04"],
    mold_remediation: ["M01", "M04", "M27", "D01", "D03"],
    emergency_plumbing: ["M01", "M03", "M23", "D01", "D02"],
    roof_repair: ["M01", "M02", "M25", "D01", "D05"],
    epoxy_flooring: ["M01", "M03", "M24", "D01", "D04"],
    hvac: ["M01", "M04", "M27", "D01", "D02"],
    electrical: ["M01", "M03", "M23", "D01", "D03"],
    landscaping: ["M01", "M02", "M25", "D01", "D05"],
    pest_control: ["M01", "M04", "M27", "D01", "D02"],
    cleaning: ["M01", "M03", "M24", "D01", "D04"],
    auto_detailing: ["M01", "M02", "M25", "D01", "D05"],
    med_spa: ["M02", "M04", "M24", "D02", "D04"],
    dental: ["M01", "M04", "M27", "D01", "D03"],
    legal: ["M01", "M03", "M23", "D01", "D03"],
    real_estate: ["M02", "M03", "M25", "D02", "D05"],
    insurance: ["M01", "M04", "M27", "D01", "D02"],
    roofing: ["M01", "M02", "M25", "D01", "D05"],
    remodeling: ["M01", "M03", "M24", "D01", "D04"],
    moving: ["M01", "M04", "M27", "D01", "D02"],
  };

  const recommendedIds = selectedIndustry ? (INDUSTRY_PATTERN_MAP[selectedIndustry.id] || []) : [];
  const patterns = recommendedIds.length > 0
    ? allPatterns.filter((p) => recommendedIds.includes(p.id))
    : allPatterns;

  const updateConfig = (patch) => setConfig({ ...config, ...patch });
  const updateForm = (patch) => setForm({ ...form, ...patch });

  const navItems = form.nav_config || DEFAULT_NAV;
  const addNavItem = () => updateForm({ nav_config: [...navItems, { label: "New", icon: "Star", route: "/new" }] });
  const updateNavItem = (i, field, val) => {
    const nc = [...navItems]; nc[i] = { ...nc[i], [field]: val }; updateForm({ nav_config: nc });
  };
  const removeNavItem = (i) => updateForm({ nav_config: navItems.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-3">
      <Section title="App Identity" icon={Type}>
        <div>
          <label className="text-[10px] font-bold text-[#607790] uppercase tracking-wider">App Name</label>
          <input value={form.app_name} onChange={(e) => updateForm({ app_name: e.target.value })} placeholder="Epoxy Pro Florida" className="mt-1 w-full h-9 px-3 rounded-lg border border-[#e4e4e7] text-sm text-[#112940] focus:border-[#126fc8] outline-none" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-[#607790] uppercase tracking-wider">App Slug</label>
          <input value={form.app_slug} onChange={(e) => updateForm({ app_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} placeholder="epoxy-pro-fl" className="mt-1 w-full h-9 px-3 rounded-lg border border-[#e4e4e7] text-sm font-mono text-[#112940] focus:border-[#126fc8] outline-none" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-[#607790] uppercase tracking-wider">Logo Text</label>
          <input value={config.logoText} onChange={(e) => updateConfig({ logoText: e.target.value })} placeholder="Strategic Minds" className="mt-1 w-full h-9 px-3 rounded-lg border border-[#e4e4e7] text-sm text-[#112940] focus:border-[#126fc8] outline-none" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-[#607790] uppercase tracking-wider">Heading</label>
          <input value={config.heading} onChange={(e) => updateConfig({ heading: e.target.value })} placeholder="Overview" className="mt-1 w-full h-9 px-3 rounded-lg border border-[#e4e4e7] text-sm text-[#112940] focus:border-[#126fc8] outline-none" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-[#607790] uppercase tracking-wider">Subtitle</label>
          <input value={config.subtitle} onChange={(e) => updateConfig({ subtitle: e.target.value })} placeholder="Workspace summary" className="mt-1 w-full h-9 px-3 rounded-lg border border-[#e4e4e7] text-sm text-[#112940] focus:border-[#126fc8] outline-none" />
        </div>
      </Section>

      <Section title="Brand Colors" icon={Palette}>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-bold text-[#607790] uppercase">Primary</label>
            <div className="flex gap-1.5 mt-1">
              <input type="color" value={config.primaryColor} onChange={(e) => updateConfig({ primaryColor: e.target.value })} className="w-9 h-9 rounded-lg border border-[#e4e4e7] cursor-pointer" />
              <input value={config.primaryColor} onChange={(e) => updateConfig({ primaryColor: e.target.value })} className="flex-1 h-9 px-2 rounded-lg border border-[#e4e4e7] text-xs font-mono text-[#112940] outline-none" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-[#607790] uppercase">Secondary</label>
            <div className="flex gap-1.5 mt-1">
              <input type="color" value={config.secondaryColor} onChange={(e) => updateConfig({ secondaryColor: e.target.value })} className="w-9 h-9 rounded-lg border border-[#e4e4e7] cursor-pointer" />
              <input value={config.secondaryColor} onChange={(e) => updateConfig({ secondaryColor: e.target.value })} className="flex-1 h-9 px-2 rounded-lg border border-[#e4e4e7] text-xs font-mono text-[#112940] outline-none" />
            </div>
          </div>
        </div>
        <div>
          <label className="text-[10px] font-bold text-[#607790] uppercase tracking-wider">Color Presets</label>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {PRESETS.map((p) => (
              <button key={p.name} onClick={() => updateConfig({ primaryColor: p.primary, secondaryColor: p.secondary })} title={p.name} className="w-7 h-7 rounded-lg border border-[#e4e4e7] hover:scale-110 transition" style={{ background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})` }} />
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] font-bold text-[#607790] uppercase tracking-wider">Theme Mode</label>
          <div className="flex gap-1.5 mt-1">
            <button onClick={() => updateConfig({ themeMode: "light" })} className={`flex-1 h-8 rounded-lg text-xs font-bold border ${config.themeMode === "dark" ? "border-[#e4e4e7] text-[#8faec9] bg-white" : "border-[#126fc8] text-[#126fc8] bg-[#126fc8]/5"}`}>Light</button>
            <button onClick={() => updateConfig({ themeMode: "dark" })} className={`flex-1 h-8 rounded-lg text-xs font-bold border ${config.themeMode === "dark" ? "border-[#126fc8] text-[#126fc8] bg-[#126fc8]/5" : "border-[#e4e4e7] text-[#8faec9] bg-white"}`}>Dark</button>
          </div>
        </div>
        <div>
          <label className="text-[10px] font-bold text-[#607790] uppercase tracking-wider">Font Family</label>
          <select value={config.fontFamily} onChange={(e) => { loadFont(e.target.value); updateConfig({ fontFamily: e.target.value }); }} className="mt-1 w-full h-9 px-2 rounded-lg border border-[#e4e4e7] text-sm text-[#112940] focus:border-[#126fc8] outline-none">
            {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-[#607790] uppercase tracking-wider">Font Scale: {config.fontScale?.toFixed(2) || "1.00"}</label>
          <input type="range" min="0.7" max="1.4" step="0.05" value={config.fontScale || 1} onChange={(e) => updateConfig({ fontScale: parseFloat(e.target.value) })} className="mt-1.5 w-full accent-[#126fc8]" />
        </div>
      </Section>

      <Section title="App Pattern / Layout" icon={LayoutGrid}>
        <div className="flex gap-1.5 mb-2">
          <button onClick={() => setViewport("mobile")} className={`flex-1 h-8 rounded-lg text-xs font-bold border ${viewport === "mobile" ? "border-[#126fc8] text-[#126fc8] bg-[#126fc8]/5" : "border-[#e4e4e7] text-[#8faec9] bg-white"}`}>Mobile</button>
          <button onClick={() => setViewport("tablet")} className={`flex-1 h-8 rounded-lg text-xs font-bold border ${viewport === "tablet" ? "border-[#126fc8] text-[#126fc8] bg-[#126fc8]/5" : "border-[#e4e4e7] text-[#8faec9] bg-white"}`}>Tablet</button>
          <button onClick={() => setViewport("desktop")} className={`flex-1 h-8 rounded-lg text-xs font-bold border ${viewport === "desktop" ? "border-[#126fc8] text-[#126fc8] bg-[#126fc8]/5" : "border-[#e4e4e7] text-[#8faec9] bg-white"}`}>Desktop</button>
        </div>
        <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
          {patterns.map((p) => (
            <button key={p.id} onClick={() => setPattern(p.id)} className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold border transition ${pattern === p.id ? "border-[#126fc8] bg-[#126fc8]/5 text-[#126fc8]" : "border-[#e4e4e7] text-[#112940] hover:border-[#126fc8]/40"}`}>
              <span className="font-mono text-[10px] text-[#8faec9] w-8">{p.id}</span>
              <span className="flex-1 text-left truncate">{p.name}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="PWA Bottom Navigation" icon={LayoutGrid} defaultOpen={false}>
        <div className="space-y-1.5">
          {navItems.map((nav, i) => (
            <div key={i} className="flex gap-1.5 items-center">
              <GripVertical className="w-3.5 h-3.5 text-[#8faec9] shrink-0" />
              <input value={nav.label} onChange={(e) => updateNavItem(i, "label", e.target.value)} placeholder="Label" className="flex-1 h-8 px-2 rounded-lg border border-[#e4e4e7] text-xs text-[#112940] outline-none focus:border-[#126fc8]" />
              <input value={nav.icon} onChange={(e) => updateNavItem(i, "icon", e.target.value)} placeholder="Icon" className="w-20 h-8 px-2 rounded-lg border border-[#e4e4e7] text-xs text-[#112940] outline-none focus:border-[#126fc8]" />
              <input value={nav.route} onChange={(e) => updateNavItem(i, "route", e.target.value)} placeholder="/route" className="w-20 h-8 px-2 rounded-lg border border-[#e4e4e7] text-xs font-mono text-[#112940] outline-none focus:border-[#126fc8]" />
              <button onClick={() => removeNavItem(i)} className="w-7 h-7 grid place-items-center rounded-lg text-red-500 hover:bg-red-50 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
        <button onClick={addNavItem} className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg border border-dashed border-[#126fc8]/40 text-xs font-bold text-[#126fc8] hover:bg-[#126fc8]/5">
          <Plus className="w-3.5 h-3.5" /> Add Nav Button
        </button>
      </Section>
    </div>
  );
}