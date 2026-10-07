import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Download, Loader2, Globe, Image as ImageIcon, Palette, Package, RefreshCw } from "lucide-react";

export default function IngestionPanel() {
  const [running, setRunning] = useState(false);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("xpsSiteIngestor", { action: "status" });
      const data = res.data || res;
      const recs = data.records || [];
      setRecords(recs);
      return recs;
    } catch (e) {
      console.error("Ingestion status failed:", e.message);
      return [];
    }
    setLoading(false);
  };

  useEffect(() => { loadStatus(); }, []);

  const startIngestion = async () => {
    setRunning(true);
    try {
      await base44.functions.invoke("xpsSiteIngestor", { action: "start", maxPages: 15 });
      // Poll every 5s until the crawl finishes (~25-30s)
      const poll = setInterval(async () => {
        const recs = await loadStatus();
        const latest = recs[0];
        if (latest?.stage === "organized" || latest?.stage === "failed") {
          clearInterval(poll);
          setRunning(false);
        }
      }, 5000);
      // Safety timeout — stop polling after 90s
      setTimeout(() => { clearInterval(poll); setRunning(false); }, 90000);
    } catch (e) {
      console.error("Ingestion start failed:", e.message);
      setRunning(false);
    }
  };

  const loadDetail = async (website_id) => {
    setSelected(website_id);
    setDetailLoading(true);
    try {
      const res = await base44.functions.invoke("xpsSiteIngestor", { action: "get", website_id });
      const data = res.data || res;
      setSelectedDetail(data.record);
    } catch (e) {
      console.error("Detail load failed:", e.message);
    }
    setDetailLoading(false);
  };

  const organized = selectedDetail?.organized_data ? (() => {
    try { return JSON.parse(selectedDetail.organized_data); } catch { return null; }
  })() : null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-stone-200 bg-gradient-to-br from-amber-50 to-white p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 grid place-items-center">
              <Globe className="h-6 w-6 text-stone-950" />
            </div>
            <div>
              <h2 className="text-lg font-black text-stone-900">XPS Site Ingestion</h2>
              <p className="text-sm text-stone-600">Crawl xtremepolishingsystems.com end-to-end: pages, images, color charts, products.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={startIngestion} disabled={running} className="px-4 py-2 rounded-lg bg-stone-900 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-50">
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {running ? "Starting…" : "Ingest XPS Site"}
            </button>
            <button onClick={loadStatus} className="px-3 py-2 rounded-lg border border-stone-300 text-sm font-bold flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-stone-400" /></div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 text-stone-500 border-2 border-dashed border-stone-200 rounded-xl">
          No ingestion runs yet. Click "Ingest XPS Site" to start crawling.
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((r) => (
            <div key={r.id} className={`rounded-xl border p-3 cursor-pointer transition-all ${selected === r.website_id ? "border-amber-500 bg-amber-50" : "border-stone-200 hover:border-stone-300"}`} onClick={() => loadDetail(r.website_id)}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${r.stage === "organized" ? "bg-green-100 text-green-700" : r.stage === "failed" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                    {r.stage}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-stone-900 truncate">{r.source_name}</div>
                    <div className="text-[11px] text-stone-500">{new Date(r.created_date || r.created_at).toLocaleString()}</div>
                  </div>
                </div>
                {r.stage === "organized" && <span className="text-[10px] text-green-600 font-bold">✓ Ready</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="rounded-xl border border-stone-200 p-4">
          {detailLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-stone-400" /></div>
          ) : organized ? (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-stone-900">Ingestion Results</h3>

              <div className="grid grid-cols-4 gap-3">
                <StatBox icon={Globe} value={organized.stats.total_pages_crawled} label="Pages" />
                <StatBox icon={ImageIcon} value={organized.stats.total_images} label="Images" />
                <StatBox icon={Palette} value={organized.stats.total_color_charts} label="Color Charts" />
                <StatBox icon={Package} value={organized.stats.total_products} label="Products" />
              </div>

              {organized.color_charts?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">Color Chart Images ({organized.color_charts.length})</h4>
                  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-64 overflow-y-auto">
                    {organized.color_charts.slice(0, 48).map((url, i) => (
                      <div key={i} className="aspect-square rounded-lg border border-stone-200 bg-stone-100 overflow-hidden" title={url}>
                        <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {organized.images?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">Site Images ({organized.images.length})</h4>
                  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-64 overflow-y-auto">
                    {organized.images.slice(0, 48).map((url, i) => (
                      <div key={i} className="aspect-square rounded-lg border border-stone-200 bg-stone-100 overflow-hidden" title={url}>
                        <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {organized.products?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">Products ({organized.products.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {organized.products.slice(0, 30).map((p, i) => (
                      <a key={i} href={p.url} target="_blank" rel="noreferrer" className="text-xs px-3 py-2 rounded-lg border border-stone-200 hover:border-amber-400 truncate">
                        {p.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {organized.pages?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">Pages Crawled</h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {organized.pages.map((p, i) => (
                      <div key={i} className="text-xs px-2 py-1 rounded bg-stone-50 flex items-center justify-between">
                        <span className="font-mono text-stone-600 truncate">{p.path}</span>
                        <span className="text-stone-400 ml-2 shrink-0">{p.image_count} imgs</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-stone-500">No organized content available. Stage: {selectedDetail?.stage || "unknown"}</div>
          )}
        </div>
      )}
    </div>
  );
}

function StatBox({ icon: Icon, value, label }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3 text-center">
      <Icon className="w-5 h-5 text-amber-500 mx-auto mb-1" />
      <div className="text-xl font-black text-stone-900">{value || 0}</div>
      <div className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">{label}</div>
    </div>
  );
}