import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Globe, Youtube, Instagram, Smartphone, Monitor, Newspaper,
  Video, Sparkles, TrendingUp, ExternalLink, Search, Filter,
  Layers, Eye, Star, ArrowUpRight, Loader2,
} from "lucide-react";
import AdminSystemPage from "@/components/launch-engine-admin/AdminSystemPage";

const CATEGORIES = [
  { key: "websites", label: "Websites", icon: Globe, color: "#126fc8" },
  { key: "youtube", label: "YouTube", icon: Youtube, color: "#ff0000" },
  { key: "social_media", label: "Social Media", icon: Instagram, color: "#e1306c" },
  { key: "web_apps", label: "Web Apps", icon: Smartphone, color: "#16a34a" },
  { key: "platforms", label: "Platforms", icon: Monitor, color: "#8b5cf6" },
  { key: "tiktok", label: "TikTok", icon: Video, color: "#000000" },
  { key: "news", label: "News & PR", icon: Newspaper, color: "#f59e0b" },
  { key: "video", label: "Video Ads", icon: Video, color: "#06b6d4" },
];

export default function VisualRenderLibrary() {
  const [activeCategory, setActiveCategory] = useState("websites");
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");

  // Load IndustryBenchmark records (the universal benchmark library)
  const { data: benchmarks = [], isLoading: benchmarksLoading } = useQuery({
    queryKey: ["visual-render-library"],
    queryFn: async () => {
      const page = await base44.entities.IndustryBenchmark.filter(
        { evidence_status: { $in: ["captured", "reference"] } },
        { sort: "-created_date", limit: 200 }
      );
      return page.items || [];
    },
  });

  // Load TemplateLibrary for the websites category
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["vrl-templates"],
    queryFn: async () => {
      const page = await base44.entities.TemplateLibrary.filter(
        { is_active: true, status: "active" },
        { sort: "sort_order", limit: 50 }
      );
      return page.items || [];
    },
  });

  // Get unique industries
  const industries = useMemo(() => {
    const set = new Set();
    benchmarks.forEach((b) => b.industry && set.add(b.industry));
    templates.forEach((t) => t.niche && set.add(t.niche));
    return [...set].sort();
  }, [benchmarks, templates]);

  // Filter items by active category
  const items = useMemo(() => {
    let source = [];
    if (activeCategory === "websites") {
      source = templates.map((t) => ({
        id: t.id,
        name: t.name,
        url: t.deployed_to?.[0] || "",
        image: t.preview_image_url || "",
        industry: t.niche || "universal",
        category: t.category || "homepage",
        score: t.performance_score || 0,
        description: t.description || "",
        type: "template",
        capabilities: t.sections || [],
      }));
    } else {
      // Map benchmark categories to our categories
      const categoryMap = {
        youtube: ["youtube", "video", "media"],
        social_media: ["social", "instagram", "facebook", "twitter", "linkedin"],
        web_apps: ["app", "saas", "tool"],
        platforms: ["platform", "marketplace", "directory"],
        tiktok: ["tiktok", "short_video"],
        news: ["news", "press", "media"],
        video: ["video", "ad", "commercial"],
      };
      const matchKeys = categoryMap[activeCategory] || [activeCategory];
      source = benchmarks
        .filter((b) => {
          const cat = (b.industry_key || "").toLowerCase();
          return matchKeys.some((k) => cat.includes(k));
        })
        .map((b) => ({
          id: b.id,
          name: b.name,
          url: b.url,
          image: b.screenshot_uri || b.normalized_uri || "",
          industry: b.industry || "universal",
          category: b.industry_key || activeCategory,
          score: 0,
          description: b.selection_basis || "",
          type: "benchmark",
          capabilities: b.capabilities || [],
        }));
    }

    // Apply search
    if (search) {
      const q = search.toLowerCase();
      source = source.filter((s) =>
        s.name?.toLowerCase().includes(q) ||
        s.industry?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
      );
    }

    // Apply industry filter
    if (industryFilter !== "all") {
      source = source.filter((s) => s.industry === industryFilter);
    }

    // Top 20
    return source.slice(0, 20);
  }, [activeCategory, benchmarks, templates, search, industryFilter]);

  // Stats per category
  const categoryStats = useMemo(() => {
    const stats = {};
    CATEGORIES.forEach((cat) => {
      if (cat.key === "websites") {
        stats[cat.key] = templates.length;
      } else {
        const categoryMap = {
          youtube: ["youtube", "video", "media"],
          social_media: ["social", "instagram", "facebook", "twitter", "linkedin"],
          web_apps: ["app", "saas", "tool"],
          platforms: ["platform", "marketplace", "directory"],
          tiktok: ["tiktok", "short_video"],
          news: ["news", "press", "media"],
          video: ["video", "ad", "commercial"],
        };
        const matchKeys = categoryMap[cat.key] || [cat.key];
        stats[cat.key] = benchmarks.filter((b) => {
          const cat = (b.industry_key || "").toLowerCase();
          return matchKeys.some((k) => cat.includes(k));
        }).length;
      }
    });
    return stats;
  }, [benchmarks, templates]);

  const loading = benchmarksLoading || templatesLoading;

  return (
    <AdminSystemPage
      eyebrow="UNIVERSAL BENCHMARK LIBRARY"
      title="Master Visual Render Library"
      description="The top 20 highest-performing benchmarks across every platform — websites, YouTube, social media, web apps, and more. Reverse-engineered for replication across the unlimited websites network."
      badge="◈ TOP 20 PER CATEGORY"
      stats={[
        ["Total Benchmarks", String(benchmarks.length)],
        ["Active Templates", String(templates.length)],
        ["Categories", String(CATEGORIES.length)],
        ["Industries", String(industries.length)],
      ]}
    >
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.key;
          const count = categoryStats[cat.key] || 0;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition border ${
                isActive
                  ? "bg-[#126fc8] text-white border-[#126fc8]"
                  : "bg-white text-[#607790] border-[#dce6f1] hover:border-[#126fc8]/40"
              }`}
            >
              <Icon className="w-3.5 h-3.5" style={isActive ? {} : { color: cat.color }} />
              {cat.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                isActive ? "bg-white/20" : "bg-[#f4f8fd] text-[#8faec9]"
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-[#8faec9] shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search benchmarks by name, industry, or description..."
            className="flex-1 h-9 px-3 rounded-lg border border-[#dce6f1] text-sm text-[#112940] focus:border-[#126fc8] outline-none"
          />
        </div>
        <select
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border border-[#dce6f1] text-sm text-[#112940] focus:border-[#126fc8] outline-none bg-white"
        >
          <option value="all">All Industries</option>
          {industries.map((ind) => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>
      </div>

      {/* Render Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#126fc8]" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-[#607790]">
          <Layers className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No benchmarks found for this category yet.</p>
          <p className="text-xs mt-1">Run the Benchmark Reverse-Engineer or FaultLine Scanner to populate this library.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {items.map((item, i) => (
            <div
              key={item.id}
              className="group rounded-xl border border-[#dce6f1] bg-white overflow-hidden hover:border-[#126fc8]/40 hover:shadow-lg transition-all"
            >
              {/* Preview Image */}
              <div className="relative aspect-video bg-[#f4f8fd] overflow-hidden">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Globe className="w-8 h-8 text-[#dce6f1]" />
                  </div>
                )}
                {/* Rank badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-bold">
                  <Star className="w-3 h-3 text-yellow-400" /> #{i + 1}
                </div>
                {/* Type badge */}
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-white/90 text-[#112940] text-[10px] font-bold capitalize">
                  {item.type}
                </div>
              </div>

              {/* Content */}
              <div className="p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-bold text-[#112940] truncate flex-1">{item.name}</p>
                  {item.url && (
                    <a
                      href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-[#126fc8] hover:text-[#0d58a8]"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <p className="text-[10px] text-[#8faec9] font-mono truncate mb-2">{item.industry}</p>
                {item.description && (
                  <p className="text-[10px] text-[#607790] line-clamp-2 mb-2">{item.description}</p>
                )}

                {/* Capabilities */}
                {item.capabilities?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.capabilities.slice(0, 3).map((cap, idx) => (
                      <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-[#126fc8]/10 text-[#126fc8] font-bold truncate max-w-[120px]">
                        {cap.name || cap.section_type || cap.section_id || 'cap'}
                      </span>
                    ))}
                    {item.capabilities.length > 3 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#f4f8fd] text-[#8faec9] font-bold">
                        +{item.capabilities.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Score */}
                {item.score > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-[#607790]">
                    <TrendingUp className="w-3 h-3 text-[#16a34a]" />
                    Score: <span className="font-bold text-[#112940]">{item.score}/100</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info footer */}
      <div className="mt-4 rounded-lg border border-[#dce6f1] bg-[#f8fbfe] p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-[#126fc8] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-[#112940]">Universal Benchmark System</p>
            <p className="text-xs text-[#607790] mt-1">
              Every category shows the top 20 highest-performing benchmarks. Use the Benchmark Reverse-Engineer
              to ingest new competitors, and the FaultLine Scanner to identify why they rank. Each benchmark
              is then replicated across the unlimited websites network with location-specific content variations
              for Google-compliant programmatic SEO.
            </p>
          </div>
        </div>
      </div>
    </AdminSystemPage>
  );
}