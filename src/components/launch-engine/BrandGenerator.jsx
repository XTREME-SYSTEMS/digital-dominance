import React from "react";
import { Shield, Star, Leaf, Flame, Gem, Anchor, Building, Sun, Heart, Zap, Award, Sparkles, Rocket, Check } from "lucide-react";

export const BRAND_OPTIONS = [
  { id: "midnight", name: "Midnight Blue", accent: "#1e3a8a", accentLight: "#3b82f6", logo: "shield", layout: "left" },
  { id: "gold", name: "Sunset Gold", accent: "#D4AF37", accentLight: "#E6C84E", logo: "star", layout: "center" },
  { id: "forest", name: "Forest Green", accent: "#16a34a", accentLight: "#22c55e", logo: "leaf", layout: "split" },
  { id: "crimson", name: "Crimson", accent: "#dc2626", accentLight: "#ef4444", logo: "flame", layout: "left" },
  { id: "royal", name: "Royal Purple", accent: "#7c3aed", accentLight: "#a855f7", logo: "gem", layout: "center" },
  { id: "teal", name: "Ocean Teal", accent: "#0d9488", accentLight: "#14b8a6", logo: "anchor", layout: "split" },
  { id: "slate", name: "Slate Pro", accent: "#475569", accentLight: "#64748b", logo: "building", layout: "left" },
  { id: "orange", name: "Sunset Orange", accent: "#ea580c", accentLight: "#f97316", logo: "sun", layout: "center" },
  { id: "rose", name: "Rose Luxury", accent: "#e11d48", accentLight: "#f43f5e", logo: "heart", layout: "split" },
  { id: "indigo", name: "Indigo Tech", accent: "#4f46e5", accentLight: "#6366f1", logo: "zap", layout: "left" },
  { id: "amber", name: "Amber Glow", accent: "#f59e0b", accentLight: "#fbbf24", logo: "award", layout: "center" },
  { id: "navy", name: "Deep Navy", accent: "#1e293b", accentLight: "#334155", logo: "shield", layout: "split" },
  { id: "emerald", name: "Emerald", accent: "#059669", accentLight: "#10b981", logo: "leaf", layout: "left" },
  { id: "coral", name: "Coral", accent: "#f97316", accentLight: "#fb923c", logo: "flame", layout: "center" },
  { id: "violet", name: "Violet", accent: "#8b5cf6", accentLight: "#a78bfa", logo: "sparkles", layout: "split" },
  { id: "steel", name: "Steel Blue", accent: "#0284c7", accentLight: "#0ea5e9", logo: "rocket", layout: "left" },
  { id: "bronze", name: "Bronze", accent: "#92400e", accentLight: "#b45309", logo: "award", layout: "center" },
  { id: "pink", name: "Hot Pink", accent: "#db2777", accentLight: "#ec4899", logo: "heart", layout: "split" },
  { id: "graphite", name: "Graphite", accent: "#1f2937", accentLight: "#374151", logo: "building", layout: "left" },
  { id: "cyan", name: "Electric Cyan", accent: "#0891b2", accentLight: "#06b6d4", logo: "zap", layout: "center" },
];

export const LOGO_ICONS = { shield: Shield, star: Star, leaf: Leaf, flame: Flame, gem: Gem, anchor: Anchor, building: Building, sun: Sun, heart: Heart, zap: Zap, award: Award, sparkles: Sparkles, rocket: Rocket };

const LAYOUT_LABELS = { left: "Left", center: "Center", split: "Split" };

export default function BrandGenerator({ selected, onSelect }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-gray-700">Brand Generator — 20 Options</p>
        <span className="text-[10px] text-gray-400">Pick a brand to apply it live</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
        {BRAND_OPTIONS.map((b) => {
          const Icon = LOGO_ICONS[b.logo] || Shield;
          const active = selected?.id === b.id;
          return (
            <button
              key={b.id}
              onClick={() => onSelect(b)}
              className={`flex-shrink-0 w-20 rounded-xl border p-2 text-center transition ${active ? "border-[#00a2ff] bg-[#00a2ff]/5 ring-2 ring-[#00a2ff]/30" : "border-gray-200 hover:border-gray-300 bg-white"}`}
            >
              <div className="w-9 h-9 rounded-lg mx-auto mb-1 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${b.accent}, ${b.accentLight})` }}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="text-[8px] font-bold text-gray-800 truncate">{b.name}</div>
              <div className="flex items-center justify-center gap-0.5 mt-0.5">
                <span className="text-[7px] text-gray-400">{LAYOUT_LABELS[b.layout]}</span>
                {active && <Check className="w-2.5 h-2.5 text-[#00a2ff]" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}