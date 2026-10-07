import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2, RefreshCw, Monitor, Tablet, Smartphone, ExternalLink, Plus, FileText } from "lucide-react";
import DynamicPageRenderer from "@/components/codestudio/DynamicPageRenderer";

export default function VisualPreview({ selectedId, onSelectPage }) {
  const qc = useQueryClient();
  const [device, setDevice] = useState("desktop");
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: pageList, isLoading: listLoading, error: listError } = useQuery({
    queryKey: ["visualEditorPages"],
    queryFn: () => base44.entities.DynamicPage.filter({}, { sort: "-updated_date", limit: 50, fields: ["title", "slug", "status"] }),
  });
  const pages = pageList?.items || [];
  const { data: selected, isLoading: pageLoading, error: pageError } = useQuery({
    queryKey: ["visualEditorPage", selectedId],
    queryFn: () => base44.entities.DynamicPage.get(selectedId),
    enabled: Boolean(selectedId),
  });
  const isLoading = listLoading || (Boolean(selectedId) && pageLoading);
  useEffect(() => { if (!selectedId && pages.length) onSelectPage(pages[0].id); }, [selectedId, pageList]);
  useEffect(() => base44.entities.DynamicPage.subscribe(event => {
    qc.invalidateQueries({ queryKey: ["visualEditorPages"] });
    if (event.id === selectedId) qc.invalidateQueries({ queryKey: ["visualEditorPage", selectedId] });
  }), [selectedId, qc]);
  const createPage = useMutation({
    mutationFn: () => base44.entities.DynamicPage.create({ title: "New Page", slug: `page-${Date.now()}`, sections: [], status: "draft", is_public: false }),
    onSuccess: (page) => {
      qc.setQueryData(["visualEditorPage", page.id], page);
      qc.invalidateQueries({ queryKey: ["visualEditorPages"] });
      qc.invalidateQueries({ queryKey: ["dynamicPages"] });
      onSelectPage(page.id);
    },
  });

  const deviceWidths = {
    desktop: "100%",
    tablet: "834px",
    mobile: "390px",
  };

  const deviceIcons = {
    desktop: Monitor,
    tablet: Tablet,
    mobile: Smartphone,
  };

  return (
    <div className="flex flex-col h-full bg-stone-100">
      {/* === TOP BAR — Base44-style toolbar === */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-white border-b border-stone-200 shrink-0">
        {/* Page selector */}
        <select
          value={selectedId || ""}
          aria-label="Canvas page"
          onChange={(e) => onSelectPage(e.target.value || null)}
          className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 outline-none focus:border-amber-500 min-w-[160px] bg-white"
        >
          <option value="">Select a page...</option>
          {selected && !pages.some(p => p.id === selected.id) && <option value={selected.id}>{selected.title}</option>}
          {pages.map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
        <button
          onClick={() => createPage.mutate()}
          disabled={createPage.isPending}
          className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 px-2 py-1"
        >
          <Plus className="h-3.5 w-3.5" /> New
        </button>

        {selected && (
          <div className="text-xs text-stone-400 font-mono ml-1 hidden xl:block">
            /p/{selected.slug}
          </div>
        )}

        {/* Right side controls */}
        <div className="ml-auto flex items-center gap-1.5">
          {/* Device toggle — Base44 style */}
          <div className="flex items-center rounded-lg border border-stone-200 overflow-hidden">
            {Object.entries(deviceIcons).map(([d, Icon]) => (
              <button
                key={d}
                onClick={() => setDevice(d)}
                className={`p-1.5 transition-colors ${
                  device === d ? "bg-stone-900 text-white" : "text-stone-400 hover:text-stone-600 hover:bg-stone-50"
                }`}
                title={d}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>

          <button
            onClick={() => { qc.invalidateQueries({ queryKey: ["visualEditorPage", selectedId] }); setRefreshKey(k => k + 1); }}
            className="p-1.5 rounded-lg border border-stone-200 text-stone-400 hover:text-stone-600 hover:border-stone-300 transition-colors"
            title="Refresh preview"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          {selected && selected.status !== "published" && <span className="text-[10px] text-stone-500">Draft saved</span>}
          {selected?.status === "published" && (
            <a
              href={`/p/${selected.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs font-bold text-stone-600 hover:border-stone-300 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open
            </a>
          )}
        </div>
      </div>

      {/* === PREVIEW AREA — Base44 style browser frame === */}
      {(listError || pageError || createPage.error) && <p role="alert" className="p-3 text-xs text-destructive">{(listError || pageError || createPage.error).message}</p>}
      <div className="flex-1 min-h-0 overflow-auto bg-stone-200/60 p-4 flex justify-center items-start">
        {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-amber-500" /></div> : !selected ? (
          <div className="flex flex-col items-center justify-center h-full text-stone-400">
            <FileText className="h-12 w-12 mb-3 opacity-40" />
            <p className="text-sm font-semibold">Select a page to preview</p>
            <p className="text-xs mt-1">or create a new one to start building</p>
          </div>
        ) : (
          /* Browser frame */
          <div
            className="bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-300 flex flex-col"
            style={{ width: deviceWidths[device], maxWidth: "100%", height: "100%" }}
            key={refreshKey}
          >
            {/* Browser chrome — URL bar */}
            <div className="flex items-center gap-2 px-3 py-2 bg-stone-100 border-b border-stone-200 shrink-0">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 flex items-center gap-1.5 bg-white rounded-md px-2.5 py-1 border border-stone-200">
                <div className="w-3 h-3 rounded-full border border-stone-300 grid place-items-center">
                  <div className="w-1 h-1 rounded-full bg-stone-400" />
                </div>
                <span className="text-[11px] text-stone-500 font-mono truncate">
                  {selected.status === "published" ? `/p/${selected.slug}` : `Draft / ${selected.slug}`}
                </span>
              </div>
            </div>

            {/* Live rendered page */}
            <div className="flex-1 overflow-y-auto bg-white">
              {(selected.sections || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-stone-300">
                  <FileText className="h-10 w-10 mb-3" />
                  <p className="text-sm font-semibold text-stone-400">Empty page</p>
                  <p className="text-xs mt-1 text-stone-400">Ask the AI in the chat to build sections</p>
                </div>
              ) : (
                <DynamicPageRenderer page={selected} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}