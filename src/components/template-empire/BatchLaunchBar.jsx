import React, { useState } from "react";
import { X, Rocket } from "lucide-react";
import { base44 } from "@/api/base44Client";

const NICHE_OPTIONS = [
  { value: "epoxy_garage", label: "Epoxy Garage" },
  { value: "polished_concrete", label: "Polished Concrete" },
  { value: "decorative_concrete", label: "Decorative Concrete" },
  { value: "epoxy_flooring", label: "Epoxy Flooring" },
  { value: "garage_coating", label: "Garage Coating" },
  { value: "concrete_resurfacing", label: "Concrete Resurfacing" },
];

const PATTERN_OPTIONS = [
  { value: "near_me", label: "near me" },
  { value: "near_me_city", label: "near me + city" },
  { value: "city_state", label: "city, state" },
  { value: "cost", label: "cost" },
  { value: "best", label: "best" },
  { value: "affordable", label: "affordable" },
];

export default function BatchLaunchBar({ selectedCount, selectedTemplates, onClose, onLaunched }) {
  const [niche, setNiche] = useState("epoxy_garage");
  const [pattern, setPattern] = useState("near_me");
  const [cities, setCities] = useState("");
  const [launching, setLaunching] = useState(false);
  const [result, setResult] = useState(null);

  const handleLaunch = async () => {
    setLaunching(true);
    setResult(null);
    try {
      const cityList = cities
        .split("\n")
        .map((c) => c.trim())
        .filter(Boolean);

      const res = await base44.functions.invoke("batchSiteLauncher", {
        template_ids: selectedTemplates.map((t) => t.id),
        niche,
        keyword_pattern: pattern,
        cities: cityList,
      });
      setResult(res.data);
      if (onLaunched) onLaunched(res.data);
    } catch (e) {
      setResult({ error: e.message });
    }
    setLaunching(false);
  };

  const totalSites = selectedCount * (cities.split("\n").filter((c) => c.trim()).length || 1);

  return (
    <div className={`te-batch-bar visible`}>
      <div className="te-batch-count">
        <b>{selectedCount}</b>
        <span>templates selected</span>
      </div>
      <div className="te-batch-config">
        <select className="te-batch-select" value={niche} onChange={(e) => setNiche(e.target.value)}>
          {NICHE_OPTIONS.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
        </select>
        <select className="te-batch-select" value={pattern} onChange={(e) => setPattern(e.target.value)}>
          {PATTERN_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <input
          className="te-batch-select"
          style={{ minWidth: 200, height: 38 }}
          placeholder="Cities (one per line)..."
          value={cities}
          onChange={(e) => setCities(e.target.value)}
          multiline
        />
      </div>
      {totalSites > 1 && (
        <div style={{ fontSize: 12, color: "#a5b4fc", fontWeight: 600 }}>
          = {totalSites} sites
        </div>
      )}
      <button className="te-batch-launch" onClick={handleLaunch} disabled={launching || selectedCount === 0}>
        {launching ? "Launching..." : <><Rocket className="w-4 h-4" /> Launch {totalSites > 1 ? `${totalSites} Sites` : "Batch"}</>}
      </button>
      <button className="te-batch-close" onClick={onClose}>
        <X className="w-4 h-4" />
      </button>
      {result && (
        <div style={{ position: "absolute", bottom: 100, left: "50%", transform: "translateX(-50%)", background: "#dcfce7", color: "#16a34a", padding: "12px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,.2)" }}>
          {result.error ? `Error: ${result.error}` : `Launched ${result.queued || 0} sites to the build queue`}
        </div>
      )}
    </div>
  );
}