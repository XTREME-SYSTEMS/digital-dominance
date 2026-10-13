import React, { useMemo } from "react";
import { Smartphone, Tablet, Monitor, Sparkles } from "lucide-react";
import { renderPreview, GALLERY_FAMILIES } from "@/lib/pwa-factory/previewRenderer.js";
import { themeToCssVars } from "@/lib/pwa-factory/studioConfig.js";
import { PREVIEW_STYLES } from "@/lib/pwa-factory/previewStyles.js";

const VIEWPORTS = {
  mobile: { width: 390, label: "390px", icon: Smartphone },
  tablet: { width: 820, label: "820px", icon: Tablet },
  desktop: { width: 1280, label: "1280px", icon: Monitor },
};

export default function PreviewCanvas({ config, pattern, viewport = "mobile" }) {
  const vp = VIEWPORTS[viewport] || VIEWPORTS.mobile;
  const VpIcon = vp.icon;

  const families = GALLERY_FAMILIES;
  const platform = viewport === "mobile" ? "mobile" : viewport === "tablet" ? "mobile" : "desktop";

  const template = useMemo(() => {
    if (pattern) {
      const pool = platform === "mobile" ? families[1].items : families[0].items;
      return pool.find((p) => p.id === pattern) || pool[0];
    }
    return platform === "mobile" ? families[1].items[0] : families[0].items[0];
  }, [pattern, platform, families]);

  const previewHtml = useMemo(() => renderPreview(template, platform, config), [template, platform, config]);
  const cssVars = useMemo(() => themeToCssVars(config), [config]);

  return (
    <div className="flex-1 flex flex-col bg-[#F9FAFB] overflow-hidden relative">
      <style>{PREVIEW_STYLES}</style>
      <div className="h-10 shrink-0 border-b border-[#e4e4e7] bg-white flex items-center justify-between px-4 z-10">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#5b7288]">
          <VpIcon className="w-3.5 h-3.5" />
          {vp.label}
          <span className="text-[#8faec9]">·</span>
          <span className="capitalize">{config.themeMode || "light"}</span>
          <span className="text-[#8faec9]">·</span>
          <span className="font-mono text-[10px]">{template?.id || "default"}</span>
        </div>
        <div className="flex items-center gap-2">
          {config.logoImage && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-[#0d2f96] bg-[#e6f0ff] px-2 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" /> AI
            </span>
          )}
          <span className="text-[10px] font-mono text-[#8faec9]">LIVE PREVIEW</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto flex items-start justify-center p-4 md:p-6">
        <div className="relative" style={{ width: Math.min(vp.width, 1100), maxWidth: "100%" }}>
          <div
            className="bg-white border border-[#e4e4e7] rounded-2xl shadow-lg overflow-hidden vg-scope"
            style={cssVars}
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      </div>
    </div>
  );
}