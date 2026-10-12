import React, { useState, useEffect, useCallback } from "react";
import { Lightbulb, Loader2, ChevronRight, X, TrendingUp, Search, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";

const PRIORITY_STYLES = {
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  medium: "bg-[#00a2ff]/10 text-[#00a2ff] border-[#00a2ff]/20",
  low: "bg-white/5 text-white/40 border-white/10",
};

const CATEGORY_ICONS = {
  google_trend: Search,
  github_trend: Zap,
  market_gap: TrendingUp,
  service_opportunity: Lightbulb,
  product_opportunity: Lightbulb,
  emerging_tech: Zap,
};

export default function IdeaFeed({ onBuildIdea }) {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const loadIdeas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("ideaProvingMachine", { action: "recommend" });
      const data = res.data?.ideas;
      setIdeas(Array.isArray(data) ? data : (data?.items || []));
    } catch (e) {
      console.error("Failed to load ideas:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadIdeas();
  }, [loadIdeas]);

  const scanNow = async () => {
    setScanning(true);
    try {
      const res = await base44.functions.invoke("ideaProvingMachine", { action: "scan" });
      if (res.data?.ok) {
        await loadIdeas();
      }
    } catch (e) {
      console.error("Scan failed:", e);
    }
    setScanning(false);
  };

  const dismiss = async (id) => {
    try {
      await base44.functions.invoke("ideaProvingMachine", { action: "dismiss", id });
      setIdeas((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      console.error("Dismiss failed:", e);
    }
  };

  const buildIdea = async (idea) => {
    const prompt = `Build a website for ${idea.niche || "a local service business"}. ${idea.recommended_action || ""} Target audience: ${idea.target_audience || "local customers"}. Keywords: ${(idea.keywords || []).join(", ")}. Deploy it to Vercel, sync to Google Analytics and Search Console, validate 3x with 100% pass, and email the result to jeremy@strategicmindsai.com with the Vercel URL and checklist.`;
    try {
      await base44.functions.invoke("ideaProvingMachine", { action: "acted", id: idea.id });
    } catch {}
    onBuildIdea?.(prompt);
  };

  return (
    <div className="rounded-2xl border border-[#00a2ff]/20 bg-gradient-to-br from-[#00a2ff]/5 to-[#0d1525] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#00a2ff]/5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#00a2ff] to-[#0066cc]">
            <Lightbulb className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">What You Should Be Doing</h2>
            <p className="text-[10px] text-white/40">Autonomous idea-proving machine · Scans Google + GitHub trends every 6 hours</p>
          </div>
        </div>
        <button
          onClick={scanNow}
          disabled={scanning}
          className="flex items-center gap-1.5 rounded-lg bg-[#00a2ff] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50 hover:bg-[#0090e0] transition"
        >
          {scanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          {scanning ? "Scanning..." : "Scan Now"}
        </button>
      </div>

      {/* Ideas feed */}
      <div className="max-h-[400px] overflow-y-auto p-3 space-y-2">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[#00a2ff]" />
          </div>
        )}
        {!loading && ideas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Lightbulb className="h-8 w-8 text-white/20" />
            <p className="text-sm text-white/40">No ideas yet. Click "Scan Now" to find opportunities.</p>
          </div>
        )}
        {ideas.map((idea) => {
          const Icon = CATEGORY_ICONS[idea.category] || Lightbulb;
          return (
            <div
              key={idea.id}
              className="group rounded-xl border border-white/10 bg-[#0d1525] p-3 hover:border-[#00a2ff]/50 transition"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase ${PRIORITY_STYLES[idea.priority] || PRIORITY_STYLES.low}`}>
                    {idea.priority}
                  </span>
                  <Icon className="h-3.5 w-3.5 shrink-0 text-white/30" />
                  <h3 className="text-sm font-bold text-white truncate">{idea.title}</h3>
                </div>
                <button
                  onClick={() => dismiss(idea.id)}
                  className="shrink-0 rounded p-0.5 text-white/30 opacity-0 group-hover:opacity-100 hover:text-red-400 transition"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-xs text-white/50 mb-2 line-clamp-2">{idea.description}</p>
              {idea.recommended_action && (
                <div className="mb-2 rounded-lg bg-[#00a2ff]/5 border border-[#00a2ff]/10 px-2.5 py-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#00a2ff] mb-0.5">Recommended Action</p>
                  <p className="text-xs text-white/60">{idea.recommended_action}</p>
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[10px] text-white/30">
                  {idea.potential_revenue && <span className="font-bold text-emerald-400">{idea.potential_revenue}</span>}
                  {idea.competition_level && <span>· {idea.competition_level} competition</span>}
                  {idea.niche && idea.niche !== "Unknown" && <span>· {idea.niche}</span>}
                </div>
                <button
                  onClick={() => buildIdea(idea)}
                  className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-[#00a2ff] transition"
                >
                  Build This <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}