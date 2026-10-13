import React, { useState, useMemo } from "react";
import { TOP_20_INDUSTRIES } from "@/data/topIndustries";
import { EXPANDED_INDUSTRIES, WEBSITE_CATEGORIES } from "@/data/expandedIndustries";
import { AlertTriangle, Flame, TrendingUp, Search } from "lucide-react";

const EMERGENCY_ICON = {
  CRITICAL: Flame,
  HIGH: AlertTriangle,
  MEDIUM: TrendingUp,
  LOW: TrendingUp,
};

// Merge all industries into one catalog
const ALL_INDUSTRIES = [...TOP_20_INDUSTRIES, ...EXPANDED_INDUSTRIES];

export default function CategoryGrid({ selected, onSelect }) {
  const [activeCategory, setActiveCategory] = useState("local_services");
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    let list;
    if (activeCategory === "local_services") {
      list = TOP_20_INDUSTRIES;
    } else {
      const cat = WEBSITE_CATEGORIES.find((c) => c.id === activeCategory);
      list = cat ? EXPANDED_INDUSTRIES.filter((i) => {
        const categoryMap = {
          saas_platform: ["saas_dashboard", "saas_landing", "api_platform", "multi_tenant_saas"],
          b2b_enterprise: ["b2b_consulting", "b2b_agency", "b2b_enterprise_software", "b2b_manufacturing"],
          ecommerce: ["ecommerce_store", "ecommerce_subscription", "marketplace"],
          portfolio_creative: ["portfolio_creative", "photography_studio", "design_studio"],
          content_media: ["blog_media", "news_magazine", "podcast_site"],
          community_platform: ["community_forum", "membership_site", "course_platform", "job_board", "directory_site"],
          health_wellness: ["medical_clinic", "dental_practice", "fitness_gym", "mental_health"],
          finance_legal: ["accounting_firm", "law_firm", "financial_advisor", "insurance_agency"],
          education: ["school_education", "training_certification"],
        };
        return (categoryMap[activeCategory] || []).includes(i.id);
      }) : [];
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.label.toLowerCase().includes(q) || i.keyword?.toLowerCase().includes(q));
    }
    return list;
  }, [activeCategory, search]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-[#112940]">{ALL_INDUSTRIES.length} Website Templates</h3>
        <span className="text-xs text-[#607790]">Click to preview as PWA</span>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8faec9]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search all templates..."
          className="w-full pl-9 pr-3 h-8 rounded-lg border border-[#dce6f1] text-xs text-[#112940] focus:border-[#126fc8] outline-none"
        />
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {WEBSITE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
              activeCategory === cat.id
                ? "border-[#126fc8] text-[#126fc8] bg-[#126fc8]/5"
                : "border-[#e4e4e7] text-[#607790] bg-white hover:border-[#126fc8]/40"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[420px] overflow-y-auto">
        {visible.map((ind, i) => {
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
              {ind.avgOrder > 0 && (
                <p className="text-[10px] text-[#8faec9] mt-1 font-mono">${ind.avgOrder.toLocaleString()} avg</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}