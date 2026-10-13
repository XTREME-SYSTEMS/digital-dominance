import React from "react";
import { TOP_20_INDUSTRIES } from "@/data/topIndustries";
import { AlertTriangle, Flame, TrendingUp } from "lucide-react";

const EMERGENCY_ICON = {
  CRITICAL: Flame,
  HIGH: AlertTriangle,
  MEDIUM: TrendingUp,
  LOW: TrendingUp,
};

export default function CategoryGrid({ selected, onSelect }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-[#112940]">20 Industry Categories</h3>
        <span className="text-xs text-[#607790]">Click to preview as PWA</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {TOP_20_INDUSTRIES.map((ind, i) => {
          const EmIcon = EMERGENCY_ICON[ind.emergency] || TrendingUp;
          const active = selected?.id === ind.id;
          return (
            <button
              key={ind.id}
              onClick={() => onSelect(ind)}
              className={`text-left rounded-xl border p-3 transition-all ${active ? "border-[#126fc8] bg-[#126fc8]/5 shadow-md ring-2 ring-[#126fc8]/20" : "border-[#e4e4e7] bg-white hover:border-[#126fc8]/40 hover:shadow-sm"}`}
            >
              <div className="flex items-start justify-between mb-1.5">
                <span className="text-[10px] font-mono text-[#8faec9]">#{String(i + 1).padStart(2, "0")}</span>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                  style={{ background: (ind.accentColor || "#126fc8") + "18", color: ind.accentColor || "#126fc8" }}
                >
                  <EmIcon className="w-2.5 h-2.5" />{ind.emergency}
                </span>
              </div>
              <p className="text-xs font-bold text-[#112940] leading-tight">{ind.label}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="inline-block w-3 h-3 rounded-full border border-[#e4e4e7]" style={{ background: ind.accentColor }} />
                <span className="text-[10px] text-[#607790] truncate">{ind.accentName}</span>
              </div>
              <p className="text-[10px] text-[#8faec9] mt-1 font-mono">${ind.avgOrder.toLocaleString()} avg</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}