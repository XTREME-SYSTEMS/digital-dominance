import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Video, Loader2, Sparkles, Play, Film, Clock, Check,
  AlertCircle, RefreshCw, Download, ArrowRight, X,
} from "lucide-react";

const DURATION_OPTIONS = [
  { value: "8", label: "8s", clips: 1, note: "1 scene" },
  { value: "15", label: "15s", clips: 2, note: "2 scenes" },
  { value: "30", label: "30s", clips: 4, note: "4 scenes" },
  { value: "45", label: "45s", clips: 6, note: "6 scenes" },
];

export default function BulkVideoGenerator() {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [results, setResults] = useState(null);
  const [duration, setDuration] = useState("15");
  const [generatingVideoFor, setGeneratingVideoFor] = useState(null);

  // Load templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["bvg-templates"],
    queryFn: async () => {
      const page = await base44.entities.TemplateLibrary.filter({ is_active: true }, { sort: "sort_order", limit: 100, fields: ["name", "niche", "preview_image_url", "description"] });
      return page.items || [];
    },
  });

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === templates.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(templates.map(t => t.id)));
  };

  const generateBatch = async () => {
    if (selectedIds.size === 0) { setGenError("Select at least one template."); return; }
    setGenerating(true);
    setGenError("");
    setResults(null);
    try {
      const selected = templates.filter(t => selectedIds.has(t.id));
      const res = await base44.functions.invoke("bulkVideoGenerator", {
        templates: selected.map(t => ({
          id: t.id,
          name: t.name,
          niche: t.niche,
          description: t.description,
        })),
      });
      const data = res?.data?.data;
      if (!data?.results?.length) throw new Error("No results returned");
      setResults(data);
    } catch (e) {
      setGenError(e.message || "Bulk generation failed. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  const generateSingleVideo = async (concept) => {
    setGeneratingVideoFor(concept.id);
    try {
      const res = await base44.integrations.Core.GenerateVideo({
        prompt: concept.videoPrompt,
        duration: 6,
        aspect_ratio: "16:9",
        generate_audio: false,
      });
      // Update results with the video URL
      if (results) {
        const updated = { ...results };
        updated.results = updated.results.map(r => ({
          ...r,
          concepts: r.concepts?.map(c => c.id === concept.id ? { ...c, videoUrl: res?.url } : c),
        }));
        setResults(updated);
      }
    } catch (e) {
      console.error("Video generation failed:", e);
    } finally {
      setGeneratingVideoFor(null);
    }
  };

  const selectedCount = selectedIds.size;

  return (
    <div className="wle-content" style={{ paddingBottom: 40 }}>
      <div className="wle-hero">
        <div>
          <div className="wle-eyebrow">◈ BULK VIDEO GENERATOR</div>
          <h1>Bulk Video Generator</h1>
          <p>Generate AI video concept packs for multiple templates at once. Each concept includes a thumbnail, description, and production script. Render actual videos on demand at 8s, 15s, 30s, or 45s.</p>
        </div>
        <div className="wle-hero-badge" style={{ background: "#126fc8", color: "#fff" }}>
          ◈ {selectedCount} SELECTED
        </div>
      </div>

      {/* Controls */}
      <div className="wle-panels" style={{ marginBottom: 16 }}>
        <section className="wle-panel" style={{ gridColumn: "1 / -1" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={selectAll} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #dce6f1", background: "#fff", color: "#112940", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                {selectedIds.size === templates.length ? "Deselect All" : "Select All"}
              </button>
              <span style={{ fontSize: 12, color: "#607790" }}>{selectedCount} of {templates.length} templates selected</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Clock style={{ width: 14, height: 14, color: "#607790" }} />
                <span style={{ fontSize: 12, color: "#607790", fontWeight: 600 }}>Duration:</span>
                {DURATION_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setDuration(opt.value)}
                    style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${duration === opt.value ? "#126fc8" : "#dce6f1"}`, background: duration === opt.value ? "#126fc8" : "#fff", color: duration === opt.value ? "#fff" : "#607790", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    {opt.label}
                  </button>
                ))}
              </div>
              <button onClick={generateBatch} disabled={generating || selectedCount === 0}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 10, background: "#126fc8", color: "#fff", fontWeight: 700, fontSize: 13, border: 0, cursor: generating ? "not-allowed" : "pointer", opacity: generating || selectedCount === 0 ? 0.6 : 1 }}>
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generating ? "Generating..." : `Generate ${selectedCount} Video Pack${selectedCount > 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
          {genError && (
            <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <AlertCircle className="w-4 h-4" /> {genError}
            </div>
          )}
          {generating && (
            <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: "#eff6ff", border: "1px solid #bfdbfe", color: "#2563eb", fontSize: 12 }}>
              Generating video concepts for {selectedCount} templates... This takes about 30-60 seconds.
            </div>
          )}
        </section>
      </div>

      {/* Template Selection Grid */}
      {!results && (
        <div className="wle-panels">
          <section className="wle-panel" style={{ gridColumn: "1 / -1" }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#112940", margin: "0 0 12px" }}>Select Templates for Video Generation</h2>
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-[#126fc8]" /> : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                {templates.map(t => (
                  <button key={t.id} onClick={() => toggleSelect(t.id)}
                    style={{ padding: 0, borderRadius: 10, border: `2px solid ${selectedIds.has(t.id) ? "#126fc8" : "#dce6f1"}`, background: "#fff", cursor: "pointer", overflow: "hidden", textAlign: "left" }}>
                    <div style={{ position: "relative", height: 120, overflow: "hidden" }}>
                      <img src={t.preview_image_url} alt={t.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                      {selectedIds.has(t.id) && (
                        <div style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: "50%", background: "#126fc8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Check style={{ width: 14, height: 14, color: "#fff" }} />
                        </div>
                      )}
                    </div>
                    <div style={{ padding: 8 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#112940", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</p>
                      <p style={{ fontSize: 10, color: "#8faec9", margin: "2px 0 0" }}>{t.niche}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="wle-panels">
          <section className="wle-panel" style={{ gridColumn: "1 / -1" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#112940", margin: 0 }}>Generated Video Concepts — {results.results?.length || 0} Templates</h2>
              <button onClick={() => setResults(null)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #dce6f1", background: "#fff", color: "#607790", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
            <div style={{ display: "grid", gap: 16 }}>
              {results.results?.map((r, ri) => (
                <div key={ri} style={{ padding: 14, borderRadius: 12, border: "1px solid #dce6f1", background: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #f4f8fd" }}>
                    <Film style={{ width: 18, height: 18, color: "#126fc8" }} />
                    <p style={{ fontSize: 14, fontWeight: 800, color: "#112940", margin: 0 }}>{r.templateName}</p>
                    <span style={{ fontSize: 10, color: "#8faec9" }}>· {r.niche}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", background: "#dcfce7", padding: "2px 6px", borderRadius: 4 }}>{r.concepts?.length || 0} concepts</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                    {r.concepts?.map((c, ci) => (
                      <div key={ci} style={{ borderRadius: 10, border: "1px solid #dce6f1", overflow: "hidden" }}>
                        <div style={{ position: "relative", height: 120, background: "#f4f8fd" }}>
                          {c.thumbnailUrl ? <img src={c.thumbnailUrl} alt={c.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" /> : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}><Film style={{ width: 24, height: 24, color: "#dce6f1" }} /></div>}
                          {c.videoUrl && (
                            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <video src={c.videoUrl} controls style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>
                          )}
                        </div>
                        <div style={{ padding: 8 }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: "#112940", margin: 0 }}>{c.title}</p>
                          <p style={{ fontSize: 10, color: "#607790", margin: "3px 0", lineHeight: 1.3 }}>{c.description}</p>
                          {c.script && <p style={{ fontSize: 9, color: "#8faec9", margin: "3px 0", fontStyle: "italic" }}>Script: {c.script.substring(0, 80)}...</p>}
                          {!c.videoUrl && (
                            <button onClick={() => generateSingleVideo(c)} disabled={generatingVideoFor === c.id}
                              style={{ marginTop: 6, width: "100%", padding: "5px 8px", borderRadius: 6, background: "#126fc8", color: "#fff", fontSize: 10, fontWeight: 700, border: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, opacity: generatingVideoFor === c.id ? 0.6 : 1 }}>
                              {generatingVideoFor === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                              {generatingVideoFor === c.id ? "Rendering..." : `Render ${duration}s Video`}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}