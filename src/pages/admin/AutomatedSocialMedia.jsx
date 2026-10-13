import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Share2, Loader2, Sparkles, Calendar, Image as ImageIcon,
  Users, Check, AlertCircle, RefreshCw, Clock, Download,
  Instagram, Facebook, Twitter, Youtube, Linkedin,
} from "lucide-react";

const PLATFORM_ICONS = {
  Instagram: Instagram,
  Facebook: Facebook,
  Twitter: Twitter,
  YouTube: Youtube,
  LinkedIn: Linkedin,
  "Google Business": Share2,
};

export default function AutomatedSocialMedia() {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState("calendar");

  // Load sites from SiteBank
  const { data: sites = [], isLoading } = useQuery({
    queryKey: ["asm-sites"],
    queryFn: async () => {
      const page = await base44.entities.SiteBank.filter({ status: { $in: ["live", "synced", "queued"] } }, { sort: "-created_date", limit: 200, fields: ["site_name", "niche", "target_city", "target_state", "site_url", "status"] });
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
    if (selectedIds.size === sites.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(sites.map(s => s.id)));
  };

  const generateBatch = async () => {
    if (selectedIds.size === 0) { setGenError("Select at least one site."); return; }
    setGenerating(true);
    setGenError("");
    setResults(null);
    try {
      const selected = sites.filter(s => selectedIds.has(s.id));
      const res = await base44.functions.invoke("automatedSocialSystem", {
        sites: selected.map(s => ({
          id: s.id,
          site_name: s.site_name,
          niche: s.niche,
          target_city: s.target_city,
          target_state: s.target_state,
          site_url: s.site_url,
        })),
      });
      const data = res?.data?.data;
      if (!data?.results?.length) throw new Error("No results returned");
      setResults(data);
      setActiveTab("calendar");
    } catch (e) {
      setGenError(e.message || "Social media generation failed. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  // Aggregate all calendar posts from results
  const allPosts = useMemo(() => {
    if (!results?.results) return [];
    const posts = [];
    results.results.forEach(r => {
      r.calendar?.forEach((p, i) => {
        posts.push({ ...p, site_name: r.site_name, niche: r.niche, day: i + 1 });
      });
    });
    return posts;
  }, [results]);

  const allTemplates = useMemo(() => {
    if (!results?.results) return [];
    const templates = [];
    results.results.forEach(r => {
      r.templates?.forEach(t => templates.push({ ...t, site_name: r.site_name, niche: r.niche }));
    });
    return templates;
  }, [results]);

  const selectedCount = selectedIds.size;

  return (
    <div className="wle-content" style={{ paddingBottom: 40 }}>
      <div className="wle-hero">
        <div>
          <div className="wle-eyebrow">◈ AUTOMATED SOCIAL MEDIA</div>
          <h1>Automated Social Media System</h1>
          <p>Generate complete social media packs for every site — branded templates, 30-day content calendars with captions, and multi-platform posting schedules. Each site gets its own automated social presence.</p>
        </div>
        <div className="wle-hero-badge" style={{ background: "#10b981", color: "#fff" }}>
          ◈ {selectedCount} SELECTED
        </div>
      </div>

      {/* Controls */}
      <div className="wle-panels" style={{ marginBottom: 16 }}>
        <section className="wle-panel" style={{ gridColumn: "1 / -1" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={selectAll} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #dce6f1", background: "#fff", color: "#112940", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                {selectedIds.size === sites.length ? "Deselect All" : "Select All"}
              </button>
              <span style={{ fontSize: 12, color: "#607790" }}>{selectedCount} of {sites.length} sites selected</span>
            </div>
            <button onClick={generateBatch} disabled={generating || selectedCount === 0}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 10, background: "#10b981", color: "#fff", fontWeight: 700, fontSize: 13, border: 0, cursor: generating ? "not-allowed" : "pointer", opacity: generating || selectedCount === 0 ? 0.6 : 1 }}>
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? "Generating..." : `Generate ${selectedCount} Social Pack${selectedCount > 1 ? "s" : ""}`}
            </button>
          </div>
          {genError && (
            <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <AlertCircle className="w-4 h-4" /> {genError}
            </div>
          )}
          {generating && (
            <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", fontSize: 12 }}>
              Generating social media packs for {selectedCount} sites... Each pack includes 10 branded templates + 30-day content calendar. About 60-90 seconds.
            </div>
          )}
        </section>
      </div>

      {/* Site Selection */}
      {!results && (
        <div className="wle-panels">
          <section className="wle-panel" style={{ gridColumn: "1 / -1" }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#112940", margin: "0 0 12px" }}>Select Sites for Social Media Generation</h2>
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-[#126fc8]" /> : sites.length === 0 ? (
              <p style={{ color: "#8faec9", fontSize: 13, textAlign: "center", padding: 20 }}>No sites available. Launch sites from the Site Bank first.</p>
            ) : (
              <div style={{ maxHeight: 400, overflowY: "auto", borderRadius: 8, border: "1px solid #dce6f1" }}>
                <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f4f8fd", position: "sticky", top: 0 }}>
                      <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: 700, color: "#607790" }}>Site</th>
                      <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: 700, color: "#607790" }}>Niche</th>
                      <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: 700, color: "#607790" }}>Location</th>
                      <th style={{ textAlign: "center", padding: "8px 10px", fontWeight: 700, color: "#607790" }}>Status</th>
                      <th style={{ textAlign: "center", padding: "8px 10px", fontWeight: 700, color: "#607790" }}>Select</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sites.map(s => (
                      <tr key={s.id} style={{ borderBottom: "1px solid #f4f8fd", cursor: "pointer", background: selectedIds.has(s.id) ? "#eff6ff" : "#fff" }} onClick={() => toggleSelect(s.id)}>
                        <td style={{ padding: "8px 10px", fontWeight: 600, color: "#112940" }}>{s.site_name}</td>
                        <td style={{ padding: "8px 10px", color: "#607790" }}>{s.niche || "—"}</td>
                        <td style={{ padding: "8px 10px", color: "#607790" }}>{s.target_city ? `${s.target_city}, ${s.target_state}` : s.target_state || "—"}</td>
                        <td style={{ padding: "8px 10px", textAlign: "center" }}>
                          <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: s.status === "live" ? "#dcfce7" : "#fef3c7", color: s.status === "live" ? "#16a34a" : "#d97706" }}>{s.status?.toUpperCase()}</span>
                        </td>
                        <td style={{ padding: "8px 10px", textAlign: "center" }}>
                          {selectedIds.has(s.id) ? <Check style={{ width: 16, height: 16, color: "#126fc8", margin: "0 auto" }} /> : <div style={{ width: 16, height: 16, borderRadius: 3, border: "1px solid #dce6f1", margin: "0 auto" }} />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#112940", margin: 0 }}>Generated Social Media Packs — {results.results?.length || 0} Sites</h2>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setActiveTab("calendar")} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${activeTab === "calendar" ? "#126fc8" : "#dce6f1"}`, background: activeTab === "calendar" ? "#126fc8" : "#fff", color: activeTab === "calendar" ? "#fff" : "#607790", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                  <Calendar className="w-3.5 h-3.5" /> Calendar ({allPosts.length})
                </button>
                <button onClick={() => setActiveTab("templates")} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${activeTab === "templates" ? "#126fc8" : "#dce6f1"}`, background: activeTab === "templates" ? "#126fc8" : "#fff", color: activeTab === "templates" ? "#fff" : "#607790", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                  <ImageIcon className="w-3.5 h-3.5" /> Templates ({allTemplates.length})
                </button>
                <button onClick={() => setResults(null)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #dce6f1", background: "#fff", color: "#607790", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Clear</button>
              </div>
            </div>

            {/* Calendar Tab */}
            {activeTab === "calendar" && (
              <div style={{ maxHeight: 500, overflowY: "auto", borderRadius: 8, border: "1px solid #dce6f1" }}>
                <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f4f8fd", position: "sticky", top: 0 }}>
                      <th style={{ textAlign: "center", padding: "6px 8px", fontWeight: 700, color: "#607790" }}>Day</th>
                      <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 700, color: "#607790" }}>Site</th>
                      <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 700, color: "#607790" }}>Platform</th>
                      <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 700, color: "#607790" }}>Content Type</th>
                      <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 700, color: "#607790" }}>Caption</th>
                      <th style={{ textAlign: "center", padding: "6px 8px", fontWeight: 700, color: "#607790" }}>Best Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allPosts.slice(0, 200).map((p, i) => {
                      const PIcon = PLATFORM_ICONS[p.platform] || Share2;
                      return (
                        <tr key={i} style={{ borderBottom: "1px solid #f4f8fd" }}>
                          <td style={{ padding: "6px 8px", textAlign: "center", fontWeight: 700, color: "#126fc8" }}>{p.day}</td>
                          <td style={{ padding: "6px 8px", fontWeight: 600, color: "#112940", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120 }}>{p.site_name}</td>
                          <td style={{ padding: "6px 8px" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: "#607790" }}>
                              <PIcon className="w-3 h-3" /> {p.platform}
                            </span>
                          </td>
                          <td style={{ padding: "6px 8px", color: "#607790", fontSize: 10 }}>{p.type || "—"}</td>
                          <td style={{ padding: "6px 8px", color: "#112940", fontSize: 10, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.caption || "—"}</td>
                          <td style={{ padding: "6px 8px", textAlign: "center", fontSize: 10, color: "#8faec9" }}>{p.bestTime || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Templates Tab */}
            {activeTab === "templates" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10, maxHeight: 500, overflowY: "auto" }}>
                {allTemplates.map((t, i) => (
                  <div key={i} style={{ borderRadius: 10, border: "1px solid #dce6f1", overflow: "hidden" }}>
                    <div style={{ height: 140, background: "#f4f8fd", position: "relative" }}>
                      {t.url ? <img src={t.url} alt={t.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" /> : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}><ImageIcon style={{ width: 24, height: 24, color: "#dce6f1" }} /></div>}
                    </div>
                    <div style={{ padding: 6 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#112940", margin: 0 }}>{t.label}</p>
                      <p style={{ fontSize: 9, color: "#8faec9", margin: "1px 0 0" }}>{t.site_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}