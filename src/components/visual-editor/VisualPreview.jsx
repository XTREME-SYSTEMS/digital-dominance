import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2, RefreshCw, Monitor, Tablet, Smartphone, ExternalLink, Plus, FileText } from "lucide-react";
import DynamicPageRenderer from "@/components/codestudio/DynamicPageRenderer";

export default function VisualPreview() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [device, setDevice] = useState("desktop");
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: pages, isLoading } = useQuery({
    queryKey: ["dynamicPages"],
    queryFn: () => base44.entities.DynamicPage.list("-created_date", 50),
  });

  const selected = pages?.find((p) => p.id === selectedId) || null;

  const createPage = async () => {
    const page = await base44.entities.DynamicPage.create({
      title: "New Page",
      slug: `page-${Date.now()}`,
      sections: [],
      status: "draft",
      is_public: true,
    });
    qc.invalidateQueries({ queryKey: ["dynamicPages"] });
    setSelectedId(page.id);
  };

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
      <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-stone-200 shrink-0">
        {/* Page selector */}
        <select
          value={selectedId || ""}
          onChange={(e) => setSelectedId(e.target.value)}
          className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 outline-none focus:border-amber-500 min-w-[160px] bg-white"
        >
          <option value="">Select a page...</option>
          {(pages || []).map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
        <button
          onClick={createPage}
          className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 px-2 py-1"
        >
          <Plus className="h-3.5 w-3.5" /> New
        </button>

        {selected && (
          <div className="text-xs text-stone-400 font-mono ml-1 hidden md:block">
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
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-1.5 rounded-lg border border-stone-200 text-stone-400 hover:text-stone-600 hover:border-stone-300 transition-colors"
            title="Refresh preview"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          {selected && (
            <a
              href={`/p/${selected.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs font-bold text-stone-600 hover:border-stone-300 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open
            </a>
          )}
        </div>
      </div>

      {/* === PREVIEW AREA — Base44 style browser frame === */}
      <div className="flex-1 overflow-auto bg-stone-200/60 p-4 flex justify-center items-start">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full text-stone-400">
            <FileText className="h-12 w-12 mb-3 opacity-40" />
            <p className="text-sm font-semibold">Select a page to preview</p>
            <p className="text-xs mt-1">or create a new one to start building</p>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
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
                  epoxyquotenearme.com/p/{selected.slug}
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