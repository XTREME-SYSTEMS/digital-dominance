import React from "react";
import {
  Sparkles, Loader2, Star, ThumbsUp, ThumbsDown, Eye, RefreshCw, CheckCircle2,
} from "lucide-react";
import { Image } from "@/components/ui/image";

export default function PromptTestCard({
  prompt, isSelected, isTesting, onSelect, onTest, onApprove, onReject,
}) {
  const score = prompt.quality_score || 0;
  const scoreColor = score >= 85 ? "#16a34a" : score >= 60 ? "#d97706" : "#dc2626";
  const hasImage = !!prompt.test_image_url;

  return (
    <div
      className={`rounded-lg border bg-white overflow-hidden transition cursor-pointer ${
        isSelected ? "border-[#126fc8] ring-2 ring-[#126fc8]/20" : "border-[#e4edf5] hover:border-[#126fc8]/40"
      }`}
      onClick={onSelect}
    >
      {/* Image preview area */}
      <div className="relative h-44 bg-[#f8fbfe] overflow-hidden">
        {isTesting ? (
          <div className="absolute inset-0 grid place-items-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#126fc8]" />
            <p className="text-xs text-[#607790] mt-2">Generating test image...</p>
          </div>
        ) : hasImage ? (
          <Image
            src={prompt.test_image_url}
            alt={prompt.title}
            fittingType="fill"
            className="w-full h-full"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-[#8faec9]">
            <Sparkles className="w-8 h-8 opacity-40" />
          </div>
        )}

        {/* Score badge */}
        {hasImage && !isTesting && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-white/95 border border-[#e4edf5] shadow-sm">
            <Star className="w-3 h-3" style={{ color: scoreColor }} fill={scoreColor} />
            <span className="text-xs font-extrabold" style={{ color: scoreColor }}>{score}</span>
          </div>
        )}

        {/* Featured badge */}
        {prompt.is_featured && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-[#16a34a] text-white text-[10px] font-bold">
            <CheckCircle2 className="w-3 h-3" /> Featured
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-bold text-[#112940] truncate">{prompt.title}</p>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#f8fbfe] text-[#607790] shrink-0">
            {prompt.category?.replace("_", " ")}
          </span>
        </div>
        {prompt.industry && (
          <p className="text-[10px] text-[#8faec9] mb-2">{prompt.industry}</p>
        )}
        <p className="text-xs text-[#607790] line-clamp-2 mb-3">
          {prompt.prompt_text?.slice(0, 120)}...
        </p>

        {/* Test notes */}
        {prompt.test_notes && (
          <p className="text-[10px] text-[#607790] bg-[#f8fbfe] rounded p-2 mb-3 line-clamp-2 italic">
            "{prompt.test_notes?.slice(0, 100)}"
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); onTest(); }}
            disabled={isTesting}
            className="flex-1 h-8 rounded-lg bg-[#126fc8] text-white text-xs font-bold hover:bg-[#0d5fb8] flex items-center justify-center gap-1 disabled:opacity-50"
          >
            {isTesting ? <Loader2 className="w-3 h-3 animate-spin" /> : hasImage ? <RefreshCw className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
            {hasImage ? "Re-test" : "Test"}
          </button>
          {hasImage && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onApprove(); }}
                className={`h-8 px-2 rounded-lg text-xs font-bold flex items-center gap-1 ${
                  prompt.is_featured
                    ? "bg-[#16a34a]/10 text-[#16a34a] border border-[#16a34a]/30"
                    : "bg-gray-100 text-[#607790] hover:bg-gray-200"
                }`}
                title="Approve for live templates"
              >
                <ThumbsUp className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onReject(); }}
                className="h-8 px-2 rounded-lg bg-gray-100 text-[#607790] text-xs font-bold hover:bg-red-50 hover:text-red-600 flex items-center gap-1"
                title="Reject — deactivate"
              >
                <ThumbsDown className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}