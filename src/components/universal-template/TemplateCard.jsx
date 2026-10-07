import React, { useMemo } from "react";
import DeviceFrame from "./DeviceFrame.jsx";
import { PREVIEW_STYLES } from "@/lib/universal-template/previewStyles.js";
import { themeToCssVars } from "@/lib/universal-template/studioConfig.js";
import { renderTemplate } from "@/lib/universal-template/visualizerRenderer.js";

export default function TemplateCard({ template, config, onClick, selected }) {
  const themeVars = useMemo(() => themeToCssVars(config), [config]);
  const preview = useMemo(() => renderTemplate(template?.sections || [], config), [template, config]);

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border-2 bg-white overflow-hidden cursor-pointer transition-all hover:shadow-lg ${selected ? "border-amber-500 shadow-lg" : "border-stone-200"}`}
    >
      <div className="flex items-center justify-center bg-stone-100 py-4 overflow-hidden" style={themeVars}>
        <style>{PREVIEW_STYLES}</style>
        <div className="origin-top">
          <DeviceFrame type={preview.frame} designW={preview.designW} designH={preview.designH} displayW={240}>
            <div style={{ width: preview.designW, height: preview.designH }} dangerouslySetInnerHTML={{ __html: preview.html }} />
          </DeviceFrame>
        </div>
      </div>
      <div className="p-3 border-t border-stone-200">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-stone-900 truncate">{template?.name || "Untitled"}</h3>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${template?.status === "published" ? "bg-green-100 text-green-700" : template?.status === "review" ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-600"}`}>
            {template?.status || "draft"}
          </span>
        </div>
        <div className="text-[11px] font-mono text-stone-500 mt-1 truncate">{template?.template_key}</div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-stone-500 capitalize">{template?.category?.replace(/_/g, " ")}</span>
          <span className="text-[10px] font-mono text-stone-400">v{template?.version || "1.0.0"}</span>
        </div>
      </div>
    </div>
  );
}