import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Download, RefreshCw, Eye, Trash2, Copy, Check, Loader2, Package, Palette, Type, Globe } from "lucide-react";

export default function PackSync() {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState(false);
  const [fullPreview, setFullPreview] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [validation, setValidation] = useState(null);

  const loadPacks = useCallback(async () => {
    setLoading(true);
    try {
      const page = await base44.entities.BrandTemplate.filter({}, { sort: "-updated_date", limit: 100 });
      setPacks(page.items || []);
    } catch (e) {
      console.error("PackSync list failed:", e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadPacks(); }, [loadPacks]);

  useEffect(() => {
    let cancelled = false;
    const loadV2Details = async () => {
      if (!selected) {
        setFullPreview("");
        setReceipt(null);
        setValidation(null);
        return;
      }
      setFullPreview(selected.preview_html || "");
      setReceipt(null);
      setValidation(null);
      setPreviewLoading(true);
      try {
        const jobs = [];
        if (selected.current_pack_id) {
          jobs.push(base44.entities.PackArtifact.filter({ pack_id: selected.current_pack_id, artifact_type: "source_html" }, { limit: 500 }));
        } else jobs.push(Promise.resolve({ items: [] }));
        if (selected.current_receipt_id) {
          jobs.push(base44.entities.PackSyncReceipt.filter({ receipt_id: selected.current_receipt_id }, { limit: 1 }));
          jobs.push(base44.entities.PackValidationRun.filter({ receipt_id: selected.current_receipt_id }, { sort: "-created_date", limit: 1 }));
        } else {
          jobs.push(Promise.resolve({ items: [] }));
          jobs.push(Promise.resolve({ items: [] }));
        }
        const [artifactPage, receiptPage, validationPage] = await Promise.all(jobs);
        if (cancelled) return;
        const chunks = [...(artifactPage.items || [])].sort((a, b) => (a.chunk_index || 0) - (b.chunk_index || 0));
        if (chunks.length) setFullPreview(chunks.map((x) => x.content || "").join(""));
        setReceipt((receiptPage.items || [])[0] || null);
        setValidation((validationPage.items || [])[0] || null);
      } catch (e) {
        console.error("PackSync V2 detail load failed:", e.message);
      }
      if (!cancelled) setPreviewLoading(false);
    };
    loadV2Details();
    return () => { cancelled = true; };
  }, [selected?.id, selected?.current_pack_id, selected?.current_receipt_id]);

  const deletePack = async (pack) => {
    if (!confirm(`Delete pack "${pack.template_key}"?`)) return;
    try {
      await base44.entities.BrandTemplate.delete(pack.id);
      loadPacks();
      if (selected?.id === pack.id) setSelected(null);
    } catch (e) {
      console.error("Delete failed:", e.message);
    }
  };

  const endpointUrl = "https://epoxyquotenearme.base44.app/functions/packSync";

  const copyEndpoint = () => {
    navigator.clipboard.writeText(endpointUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = {
    total: packs.length,
    published: packs.filter(p => p.status === "published").length,
    draft: packs.filter(p => p.status === "draft").length,
    withPreview: packs.filter(p => p.preview_html?.length > 0).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-stone-200 bg-gradient-to-br from-amber-50 to-white p-5">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 grid place-items-center shrink-0">
            <Package className="h-7 w-7 text-stone-950" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-stone-900">GPT Pack Sync</h1>
            <p className="text-sm text-stone-600 mt-1">
              GPT pushes webpacks, brand packs, logo packs, and app-pack manifests here. Sync preserves the source pack; parity is only PASS after visual and operational validation.
            </p>
          </div>
        </div>

        {/* Endpoint info */}
        <div className="mt-4 rounded-lg border border-stone-300 bg-stone-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wide text-stone-500 mb-1">Endpoint URL</div>
              <code className="text-xs text-stone-800 font-mono break-all">{endpointUrl}</code>
            </div>
            <button onClick={copyEndpoint} className="px-3 py-2 rounded-lg border border-stone-300 bg-white text-stone-700 hover:border-amber-400 shrink-0">
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="mt-2 text-[11px] text-stone-500">
            <span className="font-bold">Auth:</span> <code className="font-mono">Authorization: Bearer &lt;PACK_SYNC_TOKEN&gt;</code>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard icon={Package} value={stats.total} label="Total Packs" />
        <StatCard icon={Check} value={stats.published} label="Published" />
        <StatCard icon={Eye} value={stats.withPreview} label="With Preview" />
        <StatCard icon={Palette} value={stats.draft} label="Drafts" />
      </div>

      {/* Pack list */}
      <div className="rounded-xl border border-stone-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 bg-stone-50">
          <h2 className="text-sm font-black text-stone-900">Synced Packs</h2>
          <button onClick={loadPacks} className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-bold flex items-center gap-2 hover:border-amber-400">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-stone-400" /></div>
        ) : packs.length === 0 ? (
          <div className="text-center py-12 text-stone-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-stone-300" />
            <p className="text-sm font-bold">No packs synced yet</p>
            <p className="text-xs mt-1">GPT can push packs to the endpoint above.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {packs.map((p) => (
              <div key={p.id} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${selected?.id === p.id ? "bg-amber-50" : "hover:bg-stone-50"}`} onClick={() => setSelected(p)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status === "published" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {p.status}
                    </span>
                    <span className="text-sm font-bold text-stone-900 truncate">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-stone-500">
                    <span className="font-mono">{p.template_key}</span>
                    <span>{p.brand_id}</span>
                    <span>{p.category}</span>
                    {p.sections?.length > 0 && <span>{p.sections.length} sections</span>}
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deletePack(p); }} className="p-2 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview panel */}
      {selected && (
        <div className="rounded-xl border border-stone-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 bg-stone-50">
            <div className="min-w-0">
              <h3 className="text-sm font-black text-stone-900 truncate">{selected.name}</h3>
              <p className="text-[11px] text-stone-500 font-mono">{selected.template_key}</p>
            </div>
          </div>

          {/* V2 receipt + validation state */}
          {selected.current_pack_id && (
            <div className="px-4 py-3 border-b border-stone-100 bg-stone-950 text-white">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatusField label="Pack" value={selected.current_pack_id} mono />
                <StatusField label="Receipt" value={receipt?.status || "loading"} />
                <StatusField label="Validation" value={validation?.status || selected.validation_status || "not_run"} />
                <StatusField label="Visual" value={validation?.visual_score != null ? `${validation.visual_score}%` : "NOT CERTIFIED"} />
                <StatusField label="Operational" value={validation?.operational_score != null ? `${validation.operational_score}%` : "NOT CERTIFIED"} />
              </div>
              <div className="mt-2 text-[10px] text-stone-400">
                PASS gate: visual ≥99% and operational =100%. Stored or queued never means certified.
              </div>
            </div>
          )}

          {/* Brand config */}
          {selected.brand_config && (
            <div className="px-4 py-3 border-b border-stone-100 bg-white">
              <div className="text-[10px] font-bold uppercase tracking-wide text-stone-500 mb-2">Brand Config</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <BrandField icon={Globe} label="Domain" value={selected.brand_config.domain} />
                <BrandField icon={Palette} label="Primary" value={selected.brand_config.primary_color} color={selected.brand_config.primary_color} />
                <BrandField icon={Palette} label="Accent" value={selected.brand_config.accent_color} color={selected.brand_config.accent_color} />
                <BrandField icon={Type} label="Heading Font" value={selected.brand_config.font_heading} />
              </div>
              {selected.brand_config.logo_url && (
                <div className="mt-3 flex items-center gap-3">
                  <img src={selected.brand_config.logo_url} alt="Logo" className="h-12 w-12 object-contain rounded border border-stone-200" />
                  <span className="text-[11px] text-stone-500 font-mono truncate">{selected.brand_config.logo_url}</span>
                </div>
              )}
            </div>
          )}

          {/* Preview HTML / lossless V2 artifact reconstruction */}
          {previewLoading ? (
            <div className="px-4 py-10 flex items-center justify-center gap-2 text-stone-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading lossless pack preview…
            </div>
          ) : fullPreview ? (
            <div>
              <div className="px-4 py-2 border-b border-stone-100 bg-stone-50 text-[10px] font-bold uppercase tracking-wide text-stone-500 flex items-center justify-between gap-3">
                <span>Visual Preview ({fullPreview.length.toLocaleString()} chars)</span>
                {selected.current_pack_id && <span className="text-emerald-700">V2 artifact source</span>}
              </div>
              <iframe
                srcDoc={fullPreview}
                title="Pack Preview"
                className="w-full"
                style={{ height: "600px", border: 0, background: "#fff" }}
                sandbox="allow-same-origin"
              />
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-stone-500 text-sm">No preview HTML artifact is available for this pack.</div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusField({ label, value, mono = false }) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] uppercase tracking-wide text-stone-500 font-bold">{label}</div>
      <div className={`text-xs text-white truncate ${mono ? "font-mono" : "font-bold"}`}>{value || "—"}</div>
    </div>
  );
}

function StatCard({ icon: Icon, value, label }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3 text-center">
      <Icon className="w-5 h-5 text-amber-500 mx-auto mb-1" />
      <div className="text-xl font-black text-stone-900">{value}</div>
      <div className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">{label}</div>
    </div>
  );
}

function BrandField({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-2">
      {color ? (
        <div className="w-6 h-6 rounded border border-stone-300 shrink-0" style={{ background: color }} />
      ) : (
        <Icon className="w-4 h-4 text-stone-400 shrink-0" />
      )}
      <div className="min-w-0">
        <div className="text-[9px] font-bold uppercase tracking-wide text-stone-400">{label}</div>
        <div className="text-xs text-stone-800 truncate font-mono">{value || "—"}</div>
      </div>
    </div>
  );
}