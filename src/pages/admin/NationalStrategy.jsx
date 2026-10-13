import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Globe, MapPin, TrendingUp, Target, Rocket, Loader2,
  CheckCircle2, Clock, AlertCircle, BarChart3, Navigation,
  Building2, Users, DollarSign, Zap, ArrowRight,
} from "lucide-react";

const US_REGIONS = [
  { name: "Northeast", states: ["CT", "ME", "MA", "NH", "NJ", "NY", "PA", "RI", "VT"], color: "#3b82f6" },
  { name: "Southeast", states: ["AL", "FL", "GA", "KY", "MS", "NC", "SC", "TN", "VA", "WV"], color: "#10b981" },
  { name: "Midwest", states: ["IL", "IN", "IA", "KS", "MI", "MN", "MO", "NE", "ND", "OH", "SD", "WI"], color: "#f59e0b" },
  { name: "Southwest", states: ["AZ", "AR", "LA", "NM", "OK", "TX"], color: "#ef4444" },
  { name: "West", states: ["AK", "CA", "CO", "HI", "ID", "MT", "NV", "OR", "UT", "WA", "WY"], color: "#8b5cf6" },
];

const TARGET_NICHES = [
  { niche: "epoxy_flooring", label: "Epoxy Flooring", priority: "Critical", estLeadValue: 4500, searchVolume: 48000 },
  { niche: "roofing", label: "Roofing", priority: "Critical", estLeadValue: 8000, searchVolume: 120000 },
  { niche: "water_damage", label: "Water Damage", priority: "High", estLeadValue: 3500, searchVolume: 90000 },
  { niche: "hvac", label: "HVAC", priority: "High", estLeadValue: 5500, searchVolume: 150000 },
  { niche: "plumbing", label: "Plumbing", priority: "High", estLeadValue: 4000, searchVolume: 110000 },
  { niche: "mold_remediation", label: "Mold Remediation", priority: "Medium", estLeadValue: 2800, searchVolume: 60000 },
  { niche: "electrical", label: "Electrical", priority: "Medium", estLeadValue: 3500, searchVolume: 85000 },
  { niche: "pest_control", label: "Pest Control", priority: "Medium", estLeadValue: 1200, searchVolume: 95000 },
  { niche: "landscaping", label: "Landscaping", priority: "Medium", estLeadValue: 2500, searchVolume: 70000 },
  { niche: "solar", label: "Solar", priority: "High", estLeadValue: 12000, searchVolume: 130000 },
];

export default function NationalStrategy() {
  const [selectedRegion, setSelectedRegion] = useState(null);

  // Load all site inventory
  const { data: siteBank = [], isLoading: sbLoading } = useQuery({
    queryKey: ["ns-sitebank"],
    queryFn: async () => {
      const page = await base44.entities.SiteBank.filter({}, { sort: "-created_date", limit: 500 });
      return page.items || [];
    },
  });

  const { data: queue = [], isLoading: qLoading } = useQuery({
    queryKey: ["ns-queue"],
    queryFn: async () => {
      const page = await base44.entities.WebsiteQueue.filter({}, { sort: "-created_date", limit: 500 });
      return page.items || [];
    },
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["ns-templates"],
    queryFn: async () => {
      const page = await base44.entities.TemplateLibrary.filter({ is_active: true }, { sort: "sort_order", limit: 100, fields: ["name", "niche", "deploy_count"] });
      return page.items || [];
    },
  });

  const allSites = useMemo(() => {
    const sb = siteBank.map(s => ({ ...s, source: "sitebank" }));
    const wq = queue.map(q => ({ ...q, site_name: q.keyword, source: "queue" }));
    return [...sb, ...wq];
  }, [siteBank, queue]);

  // National stats
  const stats = useMemo(() => {
    const live = allSites.filter(s => s.status === "live" || s.status === "synced").length;
    const queued = allSites.filter(s => s.status === "queued" || s.status === "deploying").length;
    const states = new Set(allSites.filter(s => s.target_state).map(s => s.target_state));
    const cities = new Set(allSites.filter(s => s.target_city).map(s => `${s.target_city}|${s.target_state}`));
    const niches = new Set(allSites.map(s => s.niche).filter(Boolean));
    const estRevenue = live * 12 * 4500; // 12 leads/mo avg × $4500 avg lead value
    return {
      total: allSites.length,
      live,
      queued,
      states: states.size,
      cities: cities.size,
      niches: niches.size,
      estAnnualRevenue: estRevenue * 12,
      coverage: Math.round((states.size / 50) * 100),
    };
  }, [allSites]);

  // Sites by state
  const byState = useMemo(() => {
    const map = {};
    allSites.forEach(s => {
      if (!s.target_state) return;
      if (!map[s.target_state]) map[s.target_state] = { state: s.target_state, total: 0, live: 0, queued: 0, niches: new Set() };
      map[s.target_state].total++;
      if (s.status === "live" || s.status === "synced") map[s.target_state].live++;
      if (s.status === "queued" || s.status === "deploying") map[s.target_state].queued++;
      if (s.niche) map[s.target_state].niches.add(s.niche);
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [allSites]);

  // Sites by region
  const byRegion = useMemo(() => {
    return US_REGIONS.map(region => {
      const regionSites = allSites.filter(s => region.states.includes(s.target_state));
      const live = regionSites.filter(s => s.status === "live" || s.status === "synced").length;
      const queued = regionSites.filter(s => s.status === "queued" || s.status === "deploying").length;
      const statesActive = new Set(regionSites.filter(s => s.target_state).map(s => s.target_state)).size;
      return { ...region, total: regionSites.length, live, queued, statesActive, statesTotal: region.states.length };
    });
  }, [allSites]);

  // Sites by niche
  const byNiche = useMemo(() => {
    const map = {};
    allSites.forEach(s => {
      if (!s.niche) return;
      const key = s.niche.toLowerCase().replace(/ /g, "_");
      if (!map[key]) map[key] = { niche: key, total: 0, live: 0, queued: 0 };
      map[key].total++;
      if (s.status === "live" || s.status === "synced") map[key].live++;
      if (s.status === "queued" || s.status === "deploying") map[key].queued++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [allSites]);

  // Launch progress phases
  const phases = useMemo(() => [
    { phase: "Phase 1: Foundation", target: 50, current: stats.live, desc: "Deploy 50 flagship sites across top 5 niches in FL", status: stats.live >= 50 ? "complete" : "in_progress" },
    { phase: "Phase 2: Regional", target: 200, current: stats.live, desc: "Expand to 200 sites across Southeast + Southwest", status: stats.live >= 200 ? "complete" : stats.live >= 50 ? "in_progress" : "pending" },
    { phase: "Phase 3: National", target: 1000, current: stats.live, desc: "Scale to 1,000 sites across all 50 states", status: stats.live >= 1000 ? "complete" : stats.live >= 200 ? "in_progress" : "pending" },
    { phase: "Phase 4: Saturation", target: 5000, current: stats.live, desc: "5,000+ sites with full niche × city coverage matrix", status: stats.live >= 5000 ? "complete" : stats.live >= 1000 ? "in_progress" : "pending" },
    { phase: "Phase 5: Dominance", target: 10000, current: stats.live, desc: "10,000+ sites — total national search dominance", status: stats.live >= 10000 ? "complete" : stats.live >= 5000 ? "in_progress" : "pending" },
  ], [stats.live]);

  const loading = sbLoading || qLoading;

  return (
    <div className="wle-content" style={{ paddingBottom: 40 }}>
      {/* Hero */}
      <div className="wle-hero">
        <div>
          <div className="wle-eyebrow">◈ NATIONAL STRATEGY</div>
          <h1>National Strategy Plan</h1>
          <p>Track total site inventory, target markets, and high-level launch progress across all 50 states. The strategic command center for nationwide programmatic SEO dominance.</p>
        </div>
        <div className="wle-hero-badge" style={{ background: "#126fc8", color: "#fff" }}>
          ◈ {stats.coverage}% US COVERAGE
        </div>
      </div>

      {/* National Stats */}
      <div className="wle-stats">
        <div className="wle-stat"><small>Total Inventory</small><strong>{stats.total}</strong></div>
        <div className="wle-stat"><small>Live Sites</small><strong style={{ color: "#16a34a" }}>{stats.live}</strong></div>
        <div className="wle-stat"><small>Queued</small><strong style={{ color: "#d97706" }}>{stats.queued}</strong></div>
        <div className="wle-stat"><small>States Active</small><strong>{stats.states}<span style={{ fontSize: 11, color: "#8faec9" }}>/50</span></strong></div>
        <div className="wle-stat"><small>Cities</small><strong>{stats.cities}</strong></div>
        <div className="wle-stat"><small>Est. Annual Rev</small><strong style={{ color: "#16a34a" }}>${(stats.estAnnualRevenue / 1000000).toFixed(1)}M</strong></div>
      </div>

      {/* Launch Progress Phases */}
      <div className="wle-panels" style={{ marginBottom: 16 }}>
        <section className="wle-panel" style={{ gridColumn: "1 / -1" }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#112940", margin: "0 0 12px" }}>🚀 National Launch Progress</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
            {phases.map((p, i) => {
              const pct = Math.min(100, Math.round((p.current / p.target) * 100));
              const statusColor = p.status === "complete" ? "#16a34a" : p.status === "in_progress" ? "#126fc8" : "#8faec9";
              const statusBg = p.status === "complete" ? "#dcfce7" : p.status === "in_progress" ? "#eff6ff" : "#f4f8fd";
              return (
                <div key={i} style={{ padding: 14, borderRadius: 10, border: `2px solid ${statusColor}33`, background: statusBg }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: statusColor, textTransform: "uppercase" }}>{p.phase}</span>
                    {p.status === "complete" ? <CheckCircle2 style={{ width: 16, height: 16, color: "#16a34a" }} /> : p.status === "in_progress" ? <Loader2 style={{ width: 16, height: 16, color: "#126fc8" }} /> : <Clock style={{ width: 16, height: 16, color: "#8faec9" }} />}
                  </div>
                  <p style={{ fontSize: 11, color: "#607790", margin: "0 0 8px", lineHeight: 1.4 }}>{p.desc}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: "#112940", marginBottom: 4 }}>
                    <span>{p.current} live</span><span>{pct}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: "#dce6f1", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: statusColor, borderRadius: 3, transition: "width 0.4s" }} />
                  </div>
                  <p style={{ fontSize: 10, color: "#8faec9", margin: "4px 0 0" }}>Target: {p.target.toLocaleString()} sites</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Regional Breakdown */}
      <div className="wle-panels" style={{ marginBottom: 16, gridTemplateColumns: "1fr 1fr" }}>
        <section className="wle-panel">
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#112940", margin: "0 0 12px" }}>🗺️ Regional Coverage</h2>
          <div style={{ display: "grid", gap: 8 }}>
            {byRegion.map((r, i) => (
              <button key={i} onClick={() => setSelectedRegion(selectedRegion === r.name ? null : r.name)}
                style={{ padding: 12, borderRadius: 10, border: `2px solid ${selectedRegion === r.name ? r.color : "#dce6f1"}`, background: selectedRegion === r.name ? `${r.color}08` : "#fff", cursor: "pointer", textAlign: "left" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: r.color }} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#112940" }}>{r.name}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#607790" }}>{r.live} live · {r.queued} queued</span>
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 10, color: "#8faec9" }}>
                  <span>{r.total} total sites</span>
                  <span>{r.statesActive}/{r.statesTotal} states active</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "#dce6f1", marginTop: 6, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(r.statesActive / r.statesTotal) * 100}%`, background: r.color, borderRadius: 2 }} />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Top States */}
        <section className="wle-panel">
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#112940", margin: "0 0 12px" }}>🏆 Top States by Site Count</h2>
          {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#126fc8]" /> : byState.length === 0 ? (
            <p style={{ color: "#8faec9", fontSize: 13, textAlign: "center", padding: 20 }}>No sites deployed yet.</p>
          ) : (
            <div style={{ maxHeight: 350, overflowY: "auto" }}>
              {byState.slice(0, 15).map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #f4f8fd" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#8faec9", width: 20 }}>#{i + 1}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#112940", flex: 1 }}>{s.state}</span>
                  <div style={{ display: "flex", gap: 6, fontSize: 10 }}>
                    <span style={{ padding: "2px 6px", borderRadius: 4, background: "#dcfce7", color: "#16a34a", fontWeight: 700 }}>{s.live} live</span>
                    <span style={{ padding: "2px 6px", borderRadius: 4, background: "#fef3c7", color: "#d97706", fontWeight: 700 }}>{s.queued} queued</span>
                    <span style={{ padding: "2px 6px", borderRadius: 4, background: "#e0e7ef", color: "#607790", fontWeight: 700 }}>{s.niches.size} niches</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Target Markets */}
      <div className="wle-panels" style={{ marginBottom: 16 }}>
        <section className="wle-panel" style={{ gridColumn: "1 / -1" }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#112940", margin: "0 0 12px" }}>🎯 Target Market Priorities</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
            {TARGET_NICHES.map((n, i) => {
              const nicheData = byNiche.find(b => b.niche === n.niche) || { total: 0, live: 0, queued: 0 };
              const priorityColor = n.priority === "Critical" ? "#dc2626" : n.priority === "High" ? "#d97706" : "#126fc8";
              const priorityBg = n.priority === "Critical" ? "#fef2f2" : n.priority === "High" ? "#fffbeb" : "#eff6ff";
              return (
                <div key={i} style={{ padding: 14, borderRadius: 10, border: "1px solid #dce6f1", background: "#fff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#112940" }}>{n.label}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: priorityColor, background: priorityBg, padding: "2px 6px", borderRadius: 4, textTransform: "uppercase" }}>{n.priority}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, fontSize: 10, color: "#607790" }}>
                    <div><strong style={{ color: "#112940", fontSize: 14 }}>{nicheData.live}</strong><br />Live</div>
                    <div><strong style={{ color: "#112940", fontSize: 14 }}>{nicheData.queued}</strong><br />Queued</div>
                    <div><strong style={{ color: "#16a34a", fontSize: 14 }}>${(n.estLeadValue / 1000).toFixed(1)}k</strong><br />Lead Value</div>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 10, color: "#8faec9" }}>Monthly searches: {(n.searchVolume / 1000).toFixed(0)}k</div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Niche Coverage Matrix */}
      <div className="wle-panels">
        <section className="wle-panel" style={{ gridColumn: "1 / -1" }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#112940", margin: "0 0 12px" }}>📊 Niche × Region Coverage Matrix</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f4f8fd" }}>
                  <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: 700, color: "#607790" }}>Niche</th>
                  {US_REGIONS.map(r => <th key={r.name} style={{ textAlign: "center", padding: "8px 6px", fontWeight: 700, color: r.color, fontSize: 10 }}>{r.name}</th>)}
                  <th style={{ textAlign: "center", padding: "8px 10px", fontWeight: 700, color: "#607790" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {TARGET_NICHES.map(n => {
                  const nicheKey = n.niche;
                  const rowTotal = allSites.filter(s => (s.niche || "").toLowerCase().replace(/ /g, "_") === nicheKey).length;
                  return (
                    <tr key={n.niche} style={{ borderBottom: "1px solid #f4f8fd" }}>
                      <td style={{ padding: "6px 10px", fontWeight: 600, color: "#112940" }}>{n.label}</td>
                      {US_REGIONS.map(r => {
                        const count = allSites.filter(s => (s.niche || "").toLowerCase().replace(/ /g, "_") === nicheKey && r.states.includes(s.target_state)).length;
                        return (
                          <td key={r.name} style={{ textAlign: "center", padding: "6px 6px" }}>
                            <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700,
                              background: count > 10 ? "#dcfce7" : count > 0 ? "#fef3c7" : "#f4f8fd",
                              color: count > 10 ? "#16a34a" : count > 0 ? "#d97706" : "#dce6f1" }}>
                              {count || "—"}
                            </span>
                          </td>
                        );
                      })}
                      <td style={{ textAlign: "center", padding: "6px 10px", fontWeight: 800, color: "#126fc8" }}>{rowTotal}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 11, color: "#8faec9", marginTop: 8 }}>Green = 10+ sites · Yellow = 1-9 sites · Empty = no coverage yet</p>
        </section>
      </div>
    </div>
  );
}