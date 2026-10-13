import React from "react";
import { Check, Eye, Rocket } from "lucide-react";
import { Image } from "@/components/ui/image";

export default function TemplateRenderCard({ template, selected, onToggle, deployed }) {
  return (
    <div
      onClick={() => onToggle?.(template)}
      className={`group relative cursor-pointer rounded-xl border-2 overflow-hidden transition-all duration-200 ${
        selected
          ? "border-[#126fc8] ring-2 ring-[#126fc8]/30 shadow-lg shadow-[#126fc8]/10"
          : "border-[#dce6f1] hover:border-[#126fc8]/50 hover:shadow-md"
      }`}
    >
      {/* Selected checkmark */}
      {selected && (
        <div className="absolute top-2 right-2 z-20 h-6 w-6 rounded-full bg-[#126fc8] flex items-center justify-center shadow-md">
          <Check className="h-4 w-4 text-white" strokeWidth={3} />
        </div>
      )}

      {/* Deployed badge */}
      {deployed > 0 && (
        <div className="absolute top-2 left-2 z-20 flex items-center gap-1 rounded-full bg-green-500/90 px-2 py-0.5 text-[10px] font-bold text-white">
          <Rocket className="h-3 w-3" />
          {deployed} live
        </div>
      )}

      {/* Preview image */}
      <div className="relative aspect-[16/10] bg-[#f4f8fd] overflow-hidden">
        <Image
          src={template.preview_image_url}
          alt={template.name}
          fittingType="fill"
          className="w-full h-full transition-transform duration-300 group-hover:scale-105"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
          <div className="flex items-center gap-1.5 text-white text-xs font-semibold">
            <Eye className="h-3.5 w-3.5" />
            Click to {selected ? "deselect" : "select"}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 bg-white">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-xs font-bold text-[#112940] leading-tight line-clamp-2">{template.name}</h4>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          {template.niche && (
            <span className="text-[10px] font-semibold text-[#126fc8] bg-[#126fc8]/10 px-1.5 py-0.5 rounded">
              {template.niche}
            </span>
          )}
          <span className="text-[10px] text-[#607790] capitalize">{template.category?.replace("_", " ")}</span>
        </div>
        {template.description && (
          <p className="text-[10px] text-[#607790] mt-1.5 line-clamp-2 leading-relaxed">{template.description}</p>
        )}
      </div>
    </div>
  );
}