import React, { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Search, LayoutGrid, Sparkles, X, RefreshCw } from "lucide-react";
import { EMPIRE_CSS } from "@/lib/template-empire/empireStyles.js";
import EmpireHero from "@/components/template-empire/EmpireHero.jsx";
import EmpireTemplateCard from "@/components/template-empire/EmpireTemplateCard.jsx";
import BatchLaunchBar from "@/components/template-empire/BatchLaunchBar.jsx";
import AISiteGenerator from "@/components/template-empire/AISiteGenerator.jsx";
import { getPreset, BRAND_LIST } from "@/lib/universal-template/brandPresets.js";

export default function TemplateEmpire() {
  const [templates, setTemplates] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [batchMode, setBatchMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [showAI, setShowAI] = useState(false);
  const [stats, setStats] = useState({ templates: 0, industries: 0, launched: 0 });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [tplPage, indPage, launchedCount] = await Promise.all([
        base44.entities.BrandTemplate.filter({}, { sort: "-created_date", limit: 100 }),
        base44.entities.UniversalIndustryTemplate.filter({}, { sort: "name", limit: 60 }),
        base44.entities.WebsiteQueue.count({}).catch(() => 0),
      ]);
      setTemplates(tplPage.items || []);
      setIndustries(indPage.items || []);
      setStats({
        templates: (tplPage.items || []).length,
        industries: (indPage.items || []).length,
        launched: launchedCount,
      });
    } catch (e) {
      console.error("Load failed:", e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const categories = useMemo(() => {
    const cats = new Set(templates.map((t) => t.category).filter(Boolean));
    return ["all", ...Array.from(cats).sort()];
  }, [templates]);

  const filtered = useMemo(() => {
    let list = templates;
    if (brandFilter !== "all") list = list.filter((t) => t.brand_id === brandFilter);
    if (categoryFilter !== "all") list = list.filter((t) => t.category === categoryFilter);
    if (!query) return list;
    const q = query.toLowerCase();
    return list.filter((t) =>
      (t.name || "").toLowerCase().includes(q) ||
      (t.template_key || "").toLowerCase().includes(q) ||
      (t.niche || "").toLowerCase().includes(q)
    );
  }, [templates, query, brandFilter, categoryFilter]);

  const toggleSelect = (template) => {
    const next = new Set(selected);
    if (next.has(template.id)) next.delete(template.id);
    else next.add(template.id);
    setSelected(next);
  };

  const handleCardClick = (template) => {
    if (batchMode) {
      toggleSelect(template);
    } else {
      // Navigate to the template studio editor with this template
      window.location.href = `/admin/template-studio?edit=${template.id}`;
    }
  };

  const selectedTemplates = useMemo(
    () => templates.filter((t) => selected.has(t.id)),
    [templates, selected]
  );

  const exitBatchMode = () => {
    setBatchMode(false);
    setSelected(new Set());
  };

  return (
    <div className="te-root" style={{ padding: "8px 4px 100px" }}>
      <style>{EMPIRE_CSS}</style>

      <EmpireHero
        stats={stats}
        onAIGenerate={() => setShowAI(true)}
        onBatchMode={() => setBatchMode(!batchMode)}
        batchMode={batchMode}
      />

      {/* Toolbar */}
      <div className="te-toolbar">
        <div className="te-search">
          <Search className="w-4 h-4" />
          <input
            placeholder="Search templates, niches, or keywords..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="te-chip-row">
          <button
            className={`te-chip ${brandFilter === "all" ? "active" : ""}`}
            onClick={() => setBrandFilter("all")}
          >
            All Brands
          </button>
          {BRAND_LIST.map((b) => (
            <button
              key={b.id}
              className={`te-chip ${brandFilter === b.id ? "active" : ""}`}
              onClick={() => setBrandFilter(b.id)}
            >
              <span style={{ width: 10, height: 10, borderRadius: 3, background: b.primary_color }} />
              {b.short}
            </button>
          ))}
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            height: 40, padding: "0 12px", border: "1px solid #e7e8ee", borderRadius: 10,
            fontSize: 13, fontWeight: 600, color: "#52525b", background: "#fff", outline: "none",
          }}
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c === "all" ? "All Categories" : c.replace(/_/g, " ")}</option>
          ))}
        </select>

        <button
          onClick={loadAll}
          style={{ height: 40, width: 40, border: "1px solid #e7e8ee", borderRadius: 10, background: "#fff", display: "grid", placeItems: "center", cursor: "pointer" }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} style={{ color: "#71717a" }} />
        </button>
      </div>

      {/* Results count */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
        <span style={{ fontSize: 13, color: "#71717a", fontWeight: 500 }}>
          {filtered.length} template{filtered.length !== 1 ? "s" : ""} · Click to {batchMode ? "select" : "edit"}
        </span>
        {batchMode && selected.size > 0 && (
          <span style={{ fontSize: 13, color: "#4f46e5", fontWeight: 700 }}>
            {selected.size} selected for batch launch
          </span>
        )}
      </div>

      {/* Template grid */}
      {loading ? (
        <div className="te-loading">
          <div className="te-spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="te-empty">
          <LayoutGrid className="w-12 h-12" />
          <p style={{ fontWeight: 600, fontSize: 16, margin: "8px 0 4px" }}>No templates found</p>
          <p style={{ fontSize: 14 }}>Try a different search or filter, or generate one with AI.</p>
          <button onClick={() => setShowAI(true)} style={{ marginTop: 16, padding: "10px 20px", borderRadius: 10, background: "#4f46e5", color: "#fff", border: 0, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            <Sparkles className="w-4 h-4" style={{ display: "inline", marginRight: 6 }} /> Generate with AI
          </button>
        </div>
      ) : (
        <div className="te-grid">
          {filtered.map((t) => (
            <EmpireTemplateCard
              key={t.id}
              template={t}
              onClick={() => handleCardClick(t)}
              selected={selected.has(t.id)}
              batchMode={batchMode}
            />
          ))}
        </div>
      )}

      {/* Batch launch bar */}
      {batchMode && selected.size > 0 && (
        <BatchLaunchBar
          selectedCount={selected.size}
          selectedTemplates={selectedTemplates}
          onClose={exitBatchMode}
          onLaunched={() => {
            setTimeout(() => exitBatchMode(), 2500);
            loadAll();
          }}
        />
      )}

      {/* AI Generator */}
      {showAI && (
        <AISiteGenerator
          onClose={() => setShowAI(false)}
          onSaved={() => {
            setShowAI(false);
            loadAll();
          }}
        />
      )}
    </div>
  );
}