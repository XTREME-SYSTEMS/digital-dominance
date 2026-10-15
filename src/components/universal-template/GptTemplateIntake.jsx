import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, RefreshCw, Search, ShieldCheck, Monitor, Smartphone, Eye } from "lucide-react";

/**
 * Read-only bridge between TemplateLibrary (AI candidate HTML) and
 * BrandTemplate (Universal Template Studio). These are different storage
 * models. Never execute untrusted AI HTML in the admin origin.
 */
export default function GptTemplateIntake() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [device, setDevice] = useState("desktop");

  const reload = async () => {
    setLoading(true); setError("");
    try {
      const res = await base44.entities.TemplateLibrary.filter(
        { tags: { $all: ["gpt-generated"] } },
        { sort: "-created_date", limit: 100,
          fields: ["id", "name", "niche", "slug", "status", "is_active", "created_date"] }
      );
      setItems(Array.isArray(res) ? res : (res?.items || []));
    } catch {
      setError("Unable to load GPT candidates. Check your authenticated Base44 session.");
      setItems([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { reload(); }, []);

  useEffect(() => {
    if (!selectedId) return;
    let canceled = false;
    setPreviewLoading(true); setSelected(null);
    base44.entities.TemplateLibrary.get(selectedId)
      .then(record => { if (!canceled) setSelected(record); })
      .catch(() => { if (!canceled) setError("Selected source HTML could not load."); })
      .finally(() => { if (!canceled) setPreviewLoading(false); });
    return () => { canceled = true; };
  }, [selectedId]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter(t => (t.name || "").toLowerCase().includes(q) ||
                                 (t.niche || "").toLowerCase().includes(q)) : items;
  }, [items, query]);

  const pending = items.filter(t => t.status === "draft" || !t.is_active).length;
  const legacy = items.filter(t => t.status === "active" && t.is_active).length;

  return (
    <section className="space-y-5" aria-label="GPT template intake review">
      <div className="rounded-xl bg-amber-50 border border-amber-300 p-4 text-amber-950">
        <div className="font-bold flex items-center gap-2"><ShieldCheck className="w-5 h-5"/> GPT Intake · Read-only Visual Review</div>
        <p className="text-sm mt-2 leading-relaxed">
          TemplateLibrary and BrandTemplate are separate storage models. This panel shows the actual GPT source,
          but never transfers, publishes, activates, or approves records. Legacy active HTML still needs QA.
        </p>
      </div>
      <div className="flex flex-wrap gap-3 items-center">
        <div className="text-sm font-semibold text-stone-800">{items.length} retrieved · {pending} drafts · {legacy} legacy active (unverified)</div>
        <label className="relative ml-auto">
          <Search className="w-4 h-4 absolute left-2 top-2 text-stone-500"/>
          <input aria-label="Filter GPT candidates" value={query} onChange={e=>setQuery(e.target.value)}
            placeholder="Find industry or design" className="border rounded-lg pl-8 pr-3 py-1.5 text-sm w-56"/>
        </label>
        <button onClick={reload} disabled={loading} className="border rounded-lg px-3 py-1.5 text-sm font-semibold inline-flex gap-2">
          <RefreshCw className={"w-4 h-4 "+(loading ? "animate-spin" : "")}/> Refresh
        </button>
      </div>
      {error && <p role="alert" className="text-red-600 text-sm">{error}</p>}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(240px,350px)_minmax(0,1fr)] gap-4">
        <div className="bg-white border rounded-xl max-h-[780px] overflow-auto divide-y" aria-label="GPT candidate designs">
          {loading ? <p className="p-5 text-sm text-stone-600"><Loader2 className="inline w-4 h-4 animate-spin"/> Loading…</p>
            : visible.length === 0 ? <p className="p-5 text-sm text-stone-500">No candidate designs match this search.</p>
            : visible.map(t => (
              <button key={t.id} onClick={()=>{setError("");setSelectedId(t.id);}}
                className={"block text-left w-full p-3 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-amber-500 "+(t.id===selectedId?"bg-amber-50":"")}>
                <div className="text-sm font-bold text-stone-950 leading-tight">{t.name || t.slug}</div>
                <div className="text-xs mt-1 text-stone-500">{t.niche || "Universal"} · {t.status==="draft"||!t.is_active?"Pending Review":"Legacy Active · Not Validated"}</div>
                <div className="text-xs mt-1 text-stone-400">Original ID: {t.id}</div>
              </button>))}
        </div>
        <div className="bg-stone-50 border rounded-xl min-w-0 overflow-hidden">
          {previewLoading ? <div className="p-10 text-stone-500 text-sm">Loading isolated preview…</div>
            : selected ? <>
              <div className="border-b bg-white px-4 py-3 flex flex-wrap items-center gap-3">
                <div className="mr-auto min-w-0">
                  <div className="text-sm font-bold text-stone-900 truncate">{selected.name}</div>
                  <div className="text-xs text-stone-500">Isolated iframe · scripts and forms disabled · not a live website</div>
                </div>
                <button onClick={()=>setDevice("desktop")} className={"px-2 py-1 rounded-md inline-flex items-center gap-1 text-xs "+(device==="desktop"?"bg-stone-900 text-white":"border")}><Monitor className="w-4 h-4"/> Desktop</button>
                <button onClick={()=>setDevice("mobile")} className={"px-2 py-1 rounded-md inline-flex items-center gap-1 text-xs "+(device==="mobile"?"bg-stone-900 text-white":"border")}><Smartphone className="w-4 h-4"/> Mobile</button>
              </div>
              <div className="p-3 overflow-x-auto" style={{background:"#e6e5e1"}}>
                <iframe
                  title={"Isolated preview: "+(selected.name || selected.slug)}
                  sandbox=""
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  srcDoc={selected.content || "<!doctype html><title>No HTML available</title>"}
                  style={{width:device==="mobile"?390:1200,maxWidth:"none",height:"68vh",border:"1px solid #a8a29e",background:"#fff",display:"block",margin:"0 auto"}}
                />
              </div>
              <p className="text-xs text-stone-500 px-4 py-3 border-t">
                <Eye className="w-3 h-3 inline"/> This is a design review only. Require original assets,
                verified business facts, 1440/390 screenshots, accessibility, performance, and a functioning backend.
              </p>
            </> : <div className="p-10 text-sm text-stone-500">Choose a template to inspect its full page without executing untrusted HTML.</div>}
        </div>
      </div>
    </section>
  );
}
