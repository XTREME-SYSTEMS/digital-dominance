import React from "react";
import { TOP_20_INDUSTRIES } from "@/data/topIndustries";
import { ChevronRight } from "lucide-react";

export default function IndustryTemplateGrid({ onQuickAction }) {
  return (
    <div className="p-4">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-stone-900">20 Top Industry Templates</h3>
        <p className="text-[11px] text-stone-500">Click any industry to tell GPT to build a website for it</p>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {TOP_20_INDUSTRIES.map((ind) => (
          <div key={ind.id} className="group rounded-xl border border-stone-200 bg-white hover:border-amber-300 transition p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0" style={{ background: `${ind.accentColor}15`, border: `1px solid ${ind.accentColor}40` }}>
                <span className="text-xs font-black" style={{ color: ind.accentColor }}>{ind.label.slice(0, 2).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-stone-900 truncate">{ind.label}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${ind.emergency === "CRITICAL" ? "bg-red-100 text-red-700" : ind.emergency === "HIGH" ? "bg-orange-100 text-orange-700" : "bg-amber-100 text-amber-700"}`}>
                    {ind.emergency}
                  </span>
                  <span className="text-[10px] text-stone-500">${ind.avgOrder} avg order</span>
                  <span className="text-[10px] text-stone-400">{ind.pageTypes?.length} page types</span>
                </div>
              </div>
              <button onClick={() => onQuickAction(`Build a high-quality website for a ${ind.label} business. Use the ${ind.label} industry template with these services: ${(ind.services || []).join(", ")}. Hero headline: "${ind.heroHeadline}". CTA: "${ind.ctaText}". Generate the brand pack, 10 website variations, 20-day social calendar, 10 videos, digital business card, and brochure. Then provision to Vercel, Supabase, and GitHub.`)}
                className="shrink-0 flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1.5 text-[10px] font-bold text-stone-900 hover:bg-amber-400 transition">
                Build <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}