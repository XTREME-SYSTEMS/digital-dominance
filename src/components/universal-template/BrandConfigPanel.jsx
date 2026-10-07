import React from "react";
import { BRAND_LIST, NICHE_OPTIONS } from "@/lib/universal-template/brandPresets.js";

export default function BrandConfigPanel({ config, onChange, brandId, onBrandChange }) {
  const update = (field, value) => onChange({ ...config, [field]: value });

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-bold text-stone-700 uppercase tracking-wide mb-2 block">Brand</label>
        <div className="grid grid-cols-2 gap-2">
          {BRAND_LIST.map((b) => (
            <button
              key={b.id}
              onClick={() => onBrandChange(b.id)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${brandId === b.id ? "border-amber-500 bg-amber-50" : "border-stone-200 hover:border-stone-300"}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-full border border-stone-300" style={{ background: b.primary_color }} />
                <span className="text-sm font-bold text-stone-900">{b.short}</span>
              </div>
              <div className="text-[10px] text-stone-500 truncate">{b.domain || "custom"}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-stone-700 mb-1 block">Primary Color</label>
          <div className="flex gap-2">
            <input type="color" value={config.primaryColor || "#D4A92E"} onChange={(e) => update("primaryColor", e.target.value)} className="w-10 h-9 rounded border border-stone-300 cursor-pointer" />
            <input type="text" value={config.primaryColor || ""} onChange={(e) => update("primaryColor", e.target.value)} className="flex-1 px-2 py-1.5 text-sm border border-stone-300 rounded-lg" />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-stone-700 mb-1 block">Secondary</label>
          <div className="flex gap-2">
            <input type="color" value={config.secondaryColor || "#B8901E"} onChange={(e) => update("secondaryColor", e.target.value)} className="w-10 h-9 rounded border border-stone-300 cursor-pointer" />
            <input type="text" value={config.secondaryColor || ""} onChange={(e) => update("secondaryColor", e.target.value)} className="flex-1 px-2 py-1.5 text-sm border border-stone-300 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-stone-700 mb-1 block">Brand Name</label>
          <input type="text" value={config.brandName || ""} onChange={(e) => update("brandName", e.target.value)} className="w-full px-3 py-1.5 text-sm border border-stone-300 rounded-lg" />
        </div>
        <div>
          <label className="text-xs font-bold text-stone-700 mb-1 block">Logo Text</label>
          <input type="text" value={config.logoText || ""} onChange={(e) => update("logoText", e.target.value)} className="w-full px-3 py-1.5 text-sm border border-stone-300 rounded-lg" />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-stone-700 mb-1 block">Logo URL</label>
        <input type="text" value={config.logoImage || ""} onChange={(e) => update("logoImage", e.target.value)} placeholder="https://..." className="w-full px-3 py-1.5 text-sm border border-stone-300 rounded-lg" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-stone-700 mb-1 block">Heading Font</label>
          <input type="text" value={config.fontHeading || ""} onChange={(e) => update("fontHeading", e.target.value)} className="w-full px-3 py-1.5 text-sm border border-stone-300 rounded-lg" />
        </div>
        <div>
          <label className="text-xs font-bold text-stone-700 mb-1 block">Body Font</label>
          <input type="text" value={config.fontFamily || ""} onChange={(e) => update("fontFamily", e.target.value)} className="w-full px-3 py-1.5 text-sm border border-stone-300 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-stone-700 mb-1 block">Phone</label>
          <input type="text" value={config.phone || ""} onChange={(e) => update("phone", e.target.value)} className="w-full px-3 py-1.5 text-sm border border-stone-300 rounded-lg" />
        </div>
        <div>
          <label className="text-xs font-bold text-stone-700 mb-1 block">Tagline</label>
          <input type="text" value={config.tagline || ""} onChange={(e) => update("tagline", e.target.value)} className="w-full px-3 py-1.5 text-sm border border-stone-300 rounded-lg" />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-stone-700 mb-1 block">Hero Headline</label>
        <input type="text" value={config.heading || ""} onChange={(e) => update("heading", e.target.value)} className="w-full px-3 py-1.5 text-sm border border-stone-300 rounded-lg" />
      </div>
      <div>
        <label className="text-xs font-bold text-stone-700 mb-1 block">Hero Subheadline</label>
        <input type="text" value={config.subtitle || ""} onChange={(e) => update("subtitle", e.target.value)} className="w-full px-3 py-1.5 text-sm border border-stone-300 rounded-lg" />
      </div>

      <div>
        <label className="text-xs font-bold text-stone-700 mb-1 block">Theme Mode</label>
        <div className="flex gap-2">
          <button onClick={() => update("themeMode", "light")} className={`flex-1 py-1.5 text-sm rounded-lg border-2 ${config.themeMode !== "dark" ? "border-amber-500 bg-amber-50" : "border-stone-200"}`}>Light</button>
          <button onClick={() => update("themeMode", "dark")} className={`flex-1 py-1.5 text-sm rounded-lg border-2 ${config.themeMode === "dark" ? "border-amber-500 bg-amber-50" : "border-stone-200"}`}>Dark</button>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-stone-700 mb-1 block">Font Scale: {config.fontScale || 1}x</label>
        <input type="range" min="0.7" max="1.5" step="0.1" value={config.fontScale || 1} onChange={(e) => update("fontScale", parseFloat(e.target.value))} className="w-full" />
      </div>
    </div>
  );
}