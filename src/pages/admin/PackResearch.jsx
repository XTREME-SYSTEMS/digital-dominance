import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Globe, ShieldCheck, Loader2, AlertTriangle, CheckCircle2, Layers3, ExternalLink } from "lucide-react";

const PACK_OPTIONS = [
  ["logo_pack", "Logo Pack"],
  ["brand_pack", "Brand Pack"],
  ["web_pack", "Web Pack"],
  ["app_pack", "App Pack"],
];

export default function PackResearch() {
  const [form, setForm] = useState({
    project_name: "",
    industry: "",
    sub_industry: "",
    geography: "United States",
    request: "",
    requested_pack_types: ["logo_pack", "brand_pack", "web_pack"],
  });
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [dossiers, setDossiers] = useState([]);
  const [bundles, setBundles] = useState([]);

  const load = async () => {
    try {
      const [d, b] = await Promise.all([
        base44.entities.PackResearchDossier.filter({}, { sort: "-created_date", limit: 25 }),
        base44.entities.PackGenerationBundle.filter({}, { sort: "-created_date", limit: 25 }),
      ]);
      setDossiers(d.items || []);
      setBundles(b.items || []);
    } catch (e) {
      console.error("Pack research load failed", e);
    }
  };

  useEffect(() => { load(); }, []);

  const togglePack = (key) => {
    setForm((f) => ({
      ...f,
      requested_pack_types: f.requested_pack_types.includes(key)
        ? f.requested_pack_types.filter((x) => x !== key)
        : [...f.requested_pack_types, key],
    }));
  };

  const runResearch = async () => {
    if (!form.project_name.trim() || !form.industry.trim() || !form.request.trim()) return;
    setRunning(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke("packResearchOrchestrator", { action: "research", ...form });
      setResult(res.data || res);
      await load();
    } catch (e) {
      setResult({ ok: false, error: e.message });
    } finally {
      setRunning(false);
    }
  };

  const bundleByDossier = Object.fromEntries(bundles.map((b) => [b.dossier_id, b]));

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-stone-200 bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-500 text-stone-950">
            <Search className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black">GPT Pack Research Gate</h1>
            <p className="mt-1 max-w-3xl text-sm text-stone-300">
              Mandatory research before any GPT logo, brand, web, app, or visual pack can sync. The gate discovers the top 3 benchmark systems, browses and reverse-engineers them, then researches market economics, pricing, demand, keywords, products, target buyers, trends, design patterns, and funnel patterns.
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Gate label="Benchmark systems" value="3 minimum" />
          <Gate label="Logo concepts" value="10 required" />
          <Gate label="Brand packs" value="10 required" />
          <Gate label="Web packs" value="10 required" />
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Project name" value={form.project_name} onChange={(v) => setForm({ ...form, project_name: v })} placeholder="National Epoxy Pros" />
          <Field label="Industry" value={form.industry} onChange={(v) => setForm({ ...form, industry: v })} placeholder="Construction / flooring" />
          <Field label="Sub-industry" value={form.sub_industry} onChange={(v) => setForm({ ...form, sub_industry: v })} placeholder="Epoxy flooring" />
          <Field label="Geography" value={form.geography} onChange={(v) => setForm({ ...form, geography: v })} placeholder="United States" />
        </div>
        <label className="mt-4 block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-stone-500">Vision / request</span>
          <textarea
            value={form.request}
            onChange={(e) => setForm({ ...form, request: e.target.value })}
            rows={5}
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
            placeholder="Describe the website, app, funnel, brand, or visual system you want created."
          />
        </label>

        <div className="mt-4">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">Required visual packs</div>
          <div className="flex flex-wrap gap-2">
            {PACK_OPTIONS.map(([key, label]) => {
              const active = form.requested_pack_types.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => togglePack(key)}
                  className={`rounded-lg border px-3 py-2 text-sm font-bold transition ${active ? "border-amber-500 bg-amber-50 text-stone-900" : "border-stone-300 text-stone-500"}`}
                >
                  {active ? "✓ " : ""}{label}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={runResearch}
          disabled={running || !form.project_name.trim() || !form.industry.trim() || !form.request.trim()}
          className="mt-5 flex items-center gap-2 rounded-xl bg-stone-950 px-5 py-3 text-sm font-black text-white disabled:opacity-40"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
          {running ? "Researching + reverse-engineering…" : "Run Mandatory Research"}
        </button>
      </section>

      {result && (
        <section className={`rounded-2xl border p-5 ${result.research_gate_passed ? "border-emerald-300 bg-emerald-50" : "border-amber-300 bg-amber-50"}`}>
          <div className="flex items-start gap-3">
            {result.research_gate_passed ? <CheckCircle2 className="h-6 w-6 text-emerald-600" /> : <AlertTriangle className="h-6 w-6 text-amber-600" />}
            <div className="min-w-0">
              <h2 className="font-black text-stone-900">{result.research_gate_passed ? "Research Gate PASS" : "Research Gate BLOCKED"}</h2>
              {result.error ? <p className="mt-1 text-sm text-red-700">{result.error}</p> : (
                <div className="mt-2 grid gap-2 text-sm md:grid-cols-2">
                  <Info label="Dossier" value={result.dossier_id} />
                  <Info label="Bundle" value={result.bundle_id} />
                  <Info label="Quality score" value={result.quality_score != null ? result.quality_score + "%" : "—"} />
                  <Info label="Evidence sources" value={result.source_count ?? "—"} />
                </div>
              )}
              {!!result.failures?.length && <p className="mt-3 text-xs text-amber-800">Blockers: {result.failures.join(", ")}</p>}
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
        <div className="flex items-center gap-2 border-b border-stone-200 px-4 py-3">
          <Layers3 className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-black">Recent Research Dossiers</h2>
        </div>
        <div className="divide-y divide-stone-100">
          {dossiers.length === 0 ? (
            <div className="px-4 py-8 text-sm text-stone-500">No pack research dossiers yet.</div>
          ) : dossiers.map((d) => {
            const b = bundleByDossier[d.dossier_id];
            return (
              <div key={d.id} className="px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-stone-900">{d.project_name}</div>
                    <div className="mt-1 text-xs text-stone-500">{d.industry}{d.sub_industry ? " · " + d.sub_industry : ""} · {d.geography}</div>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${d.research_status === "ready" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{d.research_status}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-6 text-xs">
                  <Info label="Sources" value={d.source_count || 0} />
                  <Info label="Benchmarks" value={(d.benchmark_competitors || []).length} />
                  <Info label="Keywords" value={(d.keyword_research || []).length} />
                  <Info label="Pricing" value={(d.retail_pricing || []).length} />
                  <Info label="Products" value={(d.top_products_services || []).length} />
                  <Info label="Bundle" value={b?.status || "—"} />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Gate({ label, value }) {
  return <div className="rounded-xl border border-white/10 bg-white/5 p-3"><div className="text-lg font-black">{value}</div><div className="text-[10px] uppercase tracking-wide text-stone-400">{label}</div></div>;
}

function Field({ label, value, onChange, placeholder }) {
  return <label><span className="mb-1 block text-xs font-bold uppercase tracking-wide text-stone-500">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500" /></label>;
}

function Info({ label, value }) {
  return <div className="min-w-0"><div className="text-[9px] font-bold uppercase tracking-wide text-stone-400">{label}</div><div className="truncate font-mono text-xs text-stone-800">{String(value ?? "—")}</div></div>;
}
