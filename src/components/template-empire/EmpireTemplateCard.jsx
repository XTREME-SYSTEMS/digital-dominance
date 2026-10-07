import React, { useMemo } from "react";
import { Check } from "lucide-react";
import DeviceFrame from "@/components/universal-template/DeviceFrame.jsx";
import { PREVIEW_STYLES } from "@/lib/universal-template/previewStyles.js";
import { themeToCssVars, configFromBrandPreset } from "@/lib/universal-template/studioConfig.js";
import { renderTemplate } from "@/lib/universal-template/visualizerRenderer.js";
import { getPreset } from "@/lib/universal-template/brandPresets.js";

export default function EmpireTemplateCard({ template, onClick, selected, batchMode }) {
  const studioConfig = useMemo(
    () => configFromBrandPreset(template?.brand_config || getPreset(template?.brand_id)),
    [template]
  );
  const config = useMemo(() => themeToCssVars(studioConfig), [studioConfig]);
  const preview = useMemo(
    () => renderTemplate(template?.sections || [], studioConfig),
    [template, studioConfig]
  );

  const preset = getPreset(template?.brand_id);

  return (
    <div
      onClick={onClick}
      className={`te-card te-fade-in ${selected ? "selected" : ""}`}
    >
      {batchMode && (
        <div className={`te-card-select ${selected ? "checked" : ""}`}>
          <Check className="w-4 h-4" />
        </div>
      )}
      <div className="te-card-badge" style={{
        background: template?.status === "published" ? "#dcfce7" : template?.status === "review" ? "#fef3c7" : "#f4f4f5",
        color: template?.status === "published" ? "#16a34a" : template?.status === "review" ? "#d97706" : "#71717a",
      }}>
        {template?.status || "draft"}
      </div>
      <div className="te-card-preview" style={config}>
        <style>{PREVIEW_STYLES}</style>
        <div className="te-card-frame">
          <DeviceFrame type={preview.frame} designW={preview.designW} designH={preview.designH} displayW={260}>
            <div style={{ width: preview.designW, height: preview.designH }} dangerouslySetInnerHTML={{ __html: preview.html }} />
          </DeviceFrame>
        </div>
      </div>
      <div className="te-card-info">
        <h3 className="te-card-title">{template?.name || "Untitled Template"}</h3>
        <div className="te-card-meta">
          <span>{template?.category?.replace(/_/g, " ") || "homepage"}</span>
          <span className="te-dot" />
          <span>{template?.niche?.replace(/_/g, " ") || "general"}</span>
          <span className="te-dot" />
          <span>v{template?.version || "1.0"}</span>
        </div>
        <div className="te-card-brand">
          <span className="te-card-brand-swatch" style={{ background: preset.primary_color }} />
          <span className="te-card-brand-name">{preset.name}</span>
        </div>
      </div>
    </div>
  );
}