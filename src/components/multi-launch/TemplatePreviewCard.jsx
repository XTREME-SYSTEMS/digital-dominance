import React, { useState } from "react";
import { CheckCircle2, Eye, ExternalLink } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import StockPreviewDialog from "@/components/template-studio/StockPreviewDialog";

/**
 * TemplatePreviewCard — shows a live visual preview of the template's
 * rendered HTML content inside a scaled iframe, with a selection checkbox
 * overlay and a full-size preview dialog button.
 */
export default function TemplatePreviewCard({ template, isSelected, onToggle }) {
  const [preview, setPreview] = useState(false);

  return (
    <>
      <div
        className={`group relative rounded-lg border overflow-hidden transition ${
          isSelected
            ? "border-[#126fc8] ring-2 ring-[#126fc8]/20"
            : "border-[#e4e4e7] hover:border-[#126fc8]/40"
        }`}
      >
        {/* Live preview iframe — scaled down rendering of the template content */}
        <div
          className="relative aspect-[16/10] bg-[#f8f9fb] overflow-hidden cursor-pointer"
          onClick={onToggle}
        >
          {template.content ? (
            <iframe
              srcDoc={template.content}
              title={template.name}
              className="absolute top-0 left-0"
              style={{
                width: "1280px",
                height: "800px",
                transform: "scale(0.34)",
                transformOrigin: "top left",
                pointerEvents: "none",
                border: "none",
              }}
              loading="lazy"
            />
          ) : template.preview_image_url ? (
            <SafeImage
              src={template.preview_image_url}
              alt={template.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-[#8faec9]">
              No preview
            </div>
          )}

          {/* Checkbox overlay */}
          <div className="absolute top-2 left-2 z-10">
            <div
              className={`w-6 h-6 rounded-md border-2 grid place-items-center transition ${
                isSelected
                  ? "border-[#126fc8] bg-[#126fc8]"
                  : "border-white/80 bg-white/60 backdrop-blur-sm group-hover:border-[#126fc8]/50"
              }`}
            >
              {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
            </div>
          </div>

          {/* Preview button overlay */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPreview(true);
            }}
            className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition hover:bg-black/80"
          >
            <Eye className="w-3 h-3" /> Preview
          </button>
        </div>

        {/* Info bar */}
        <div className="p-3 bg-white">
          <p className="text-sm font-bold text-[#112940] truncate">{template.name}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {template.niche && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#126fc8]/10 text-[#126fc8]">
                {template.niche}
              </span>
            )}
            <span className="text-[9px] text-[#607790]">{template.category}</span>
            {template.deploy_count > 0 && (
              <span className="text-[9px] text-[#d97706] font-bold">{template.deploy_count} deploys</span>
            )}
          </div>
        </div>
      </div>

      {preview && (
        <StockPreviewDialog
          template={template}
          onClose={() => setPreview(false)}
        />
      )}
    </>
  );
}