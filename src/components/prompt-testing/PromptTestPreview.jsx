import React, { useState } from "react";
import { X, Sparkles, Star, ThumbsUp, ThumbsDown, RefreshCw, Loader2, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";
import { Image } from "@/components/ui/image";
import { base44 } from "@/api/base44Client";

export default function PromptTestPreview({ prompt, onClose, onTest, onApprove, onReject }) {
  const score = prompt.quality_score || 0;
  const scoreColor = score >= 85 ? "#16a34a" : score >= 60 ? "#d97706" : "#dc2626";
  const [vqcRunning, setVqcRunning] = useState(false);
  const [vqcResult, setVqcResult] = useState(null);
  const [vqcError, setVqcError] = useState(null);

  const runVisualCheck = async () => {
    if (!prompt.test_image_url) return;
    setVqcRunning(true);
    setVqcError(null);
    setVqcResult(null);
    try {
      const res = await base44.functions.invoke("benchmarkVisualQualityCheck", {
        imageUrl: prompt.test_image_url,
        industryKey: prompt.industry || "generic",
        promptText: prompt.prompt_text,
      });
      setVqcResult(res.data);
    } catch (err) {
      setVqcError(err.message || "Visual quality check failed");
    } finally {
      setVqcRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl border border-[#e4edf5] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#e4edf5]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#126fc8]" />
            <h3 className="font-bold text-[#112940]">{prompt.title}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-[#607790]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Image */}
          <div className="relative rounded-lg overflow-hidden bg-[#f8fbfe] h-64">
            {prompt.test_image_url ? (
              <Image src={prompt.test_image_url} alt={prompt.title} fittingType="fit" className="w-full h-full" />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-[#8faec9]">
                <div className="text-center">
                  <Sparkles className="w-10 h-10 mx-auto opacity-40 mb-2" />
                  <p className="text-sm">No test image yet. Click "Test" to generate one.</p>
                </div>
              </div>
            )}
            {prompt.test_image_url && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 border border-[#e4edf5] shadow-sm">
                <Star className="w-4 h-4" style={{ color: scoreColor }} fill={scoreColor} />
                <span className="text-sm font-extrabold" style={{ color: scoreColor }}>{score}/100</span>
              </div>
            )}
          </div>

          {/* Prompt text */}
          <div>
            <p className="text-xs font-bold text-[#607790] uppercase tracking-wider mb-1">Prompt</p>
            <div className="rounded-lg bg-[#f8fbfe] border border-[#e4edf5] p-3 text-sm text-[#112940] max-h-32 overflow-y-auto">
              {prompt.prompt_text}
            </div>
          </div>

          {/* AI evaluation notes */}
          {prompt.test_notes && (
            <div>
              <p className="text-xs font-bold text-[#607790] uppercase tracking-wider mb-1">AI Evaluation</p>
              <div className="rounded-lg bg-[#fff8e6] border border-[#e2ab3e]/30 p-3 text-sm text-[#725119]">
                {prompt.test_notes}
              </div>
            </div>
          )}

          {/* Visual Quality Check against benchmarks */}
          {prompt.test_image_url && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold text-[#607790] uppercase tracking-wider">Visual Quality Gate</p>
                <button
                  onClick={runVisualCheck}
                  disabled={vqcRunning}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-[#126fc8] hover:underline disabled:opacity-50"
                >
                  {vqcRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                  {vqcRunning ? "Checking..." : "Run Benchmark Check"}
                </button>
              </div>
              {vqcError && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
                  <AlertCircle className="w-3 h-3" /> {vqcError}
                </div>
              )}
              {vqcResult && (
                <div className={`rounded-lg border p-3 ${vqcResult.passed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {vqcResult.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-xs font-bold ${vqcResult.passed ? "text-[#16a34a]" : "text-red-600"}`}>
                      {vqcResult.passed ? "PASSED" : "REJECTED"} — {vqcResult.score}/100
                    </span>
                    <span className="text-[9px] text-[#607790] ml-auto">
                      vs {vqcResult.benchmarkCount} benchmark sites
                    </span>
                  </div>
                  {vqcResult.feedback && (
                    <p className="text-[11px] text-[#607790]">{vqcResult.feedback}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Meta */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-[#f8fbfe] border border-[#e4edf5] p-2.5 text-center">
              <p className="text-lg font-extrabold text-[#112940]">{prompt.test_count || 0}</p>
              <p className="text-[10px] text-[#607790] uppercase tracking-wider">Tests Run</p>
            </div>
            <div className="rounded-lg bg-[#f8fbfe] border border-[#e4edf5] p-2.5 text-center">
              <p className="text-lg font-extrabold" style={{ color: scoreColor }}>{score}</p>
              <p className="text-[10px] text-[#607790] uppercase tracking-wider">Quality Score</p>
            </div>
            <div className="rounded-lg bg-[#f8fbfe] border border-[#e4edf5] p-2.5 text-center">
              <p className="text-lg font-extrabold text-[#112940]">
                {prompt.is_featured ? "✓" : "—"}
              </p>
              <p className="text-[10px] text-[#607790] uppercase tracking-wider">Featured</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-4 border-t border-[#e4edf5]">
          <button
            onClick={onTest}
            className="flex-1 h-10 rounded-lg bg-[#126fc8] text-white text-sm font-bold hover:bg-[#0d5fb8] flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {prompt.test_image_url ? "Re-Test Image" : "Generate Test Image"}
          </button>
          {prompt.test_image_url && (
            <>
              <button
                onClick={onApprove}
                className={`h-10 px-4 rounded-lg text-sm font-bold flex items-center gap-2 ${
                  prompt.is_featured
                    ? "bg-[#16a34a] text-white"
                    : "bg-[#16a34a]/10 text-[#16a34a] border border-[#16a34a]/30 hover:bg-[#16a34a]/20"
                }`}
              >
                <ThumbsUp className="w-4 h-4" /> Approve
              </button>
              <button
                onClick={onReject}
                className="h-10 px-4 rounded-lg bg-gray-100 text-[#607790] text-sm font-bold hover:bg-red-50 hover:text-red-600 flex items-center gap-2"
              >
                <ThumbsDown className="w-4 h-4" /> Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}