import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles, Image as ImageIcon, Loader2, CheckCircle2, XCircle, Star,
  Search, Filter, Eye, ThumbsUp, ThumbsDown, RefreshCw, Plus, AlertCircle,
  Bot, Clock, Zap,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import AdminSystemPage from "@/components/launch-engine-admin/AdminSystemPage";
import PromptTestCard from "@/components/prompt-testing/PromptTestCard";
import PromptTestPreview from "@/components/prompt-testing/PromptTestPreview";

export default function PromptTestingLab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [testing, setTesting] = useState(null);
  const [error, setError] = useState(null);
  const [autoTesting, setAutoTesting] = useState(false);
  const [autoTestResult, setAutoTestResult] = useState(null);

  const { data: prompts = [], isLoading } = useQuery({
    queryKey: ["prompt-library-all"],
    queryFn: async () => {
      const page = await base44.entities.PromptLibrary.filter(
        {},
        { sort: "-created_date", limit: 200 }
      );
      return page.items || [];
    },
    refetchInterval: 10000,
  });

  const filtered = prompts.filter((p) => {
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    if (statusFilter === "featured" && !p.is_featured) return false;
    if (statusFilter === "tested" && !p.test_image_url) return false;
    if (statusFilter === "untested" && p.test_image_url) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.title?.toLowerCase().includes(q) || p.prompt_text?.toLowerCase().includes(q) || p.industry?.toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    total: prompts.length,
    tested: prompts.filter((p) => p.test_image_url).length,
    featured: prompts.filter((p) => p.is_featured).length,
    avgScore: prompts.length > 0
      ? Math.round(prompts.reduce((s, p) => s + (p.quality_score || 0), 0) / prompts.length)
      : 0,
  };

  // ── Autonomous agent activity stats ───────────────────────────────────
  const agentStats = (() => {
    const testedPrompts = prompts.filter((p) => p.tested_at);
    const lastTested = testedPrompts.length > 0
      ? testedPrompts.reduce((max, p) => p.tested_at > max ? p.tested_at : max, testedPrompts[0].tested_at)
      : null;
    const nextRun = lastTested ? new Date(new Date(lastTested).getTime() + 12 * 60 * 60 * 1000) : null;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentlyTested = testedPrompts.filter((p) => new Date(p.tested_at) > oneDayAgo).length;
    const autoFeatured = prompts.filter((p) => p.is_featured && p.quality_score >= 85).length;
    const deactivated = prompts.filter((p) => !p.is_active).length;
    const stale = prompts.filter((p) => p.is_active && (!p.tested_at || new Date(p.tested_at) < oneDayAgo)).length;
    return { lastTested, nextRun, recentlyTested, autoFeatured, deactivated, stale };
  })();

  const handleTest = async (prompt) => {
    setTesting(prompt.id);
    setError(null);
    setSelectedPrompt(prompt.id);
    try {
      // 1. Generate test image
      const genRes = await base44.integrations.Core.GenerateImage({
        prompt: prompt.prompt_text,
      });
      const imageUrl = genRes?.url || genRes?.data?.url;
      if (!imageUrl) throw new Error("No image URL returned");

      // 2. AI-evaluate the image quality
      const evalRes = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert art director evaluating an AI-generated image for a ${prompt.industry || "general"} ${prompt.category} prompt. Score the image 0-100 on: photorealism, composition, lighting, color accuracy, and professional quality. Respond with a JSON object: {"score": <number>, "notes": "<2-3 sentence evaluation>", "verdict": "approve"|"reject"|"revise"}.`,
        file_urls: [imageUrl],
        response_json_schema: {
          type: "object",
          properties: {
            score: { type: "number" },
            notes: { type: "string" },
            verdict: { type: "string", enum: ["approve", "reject", "revise"] },
          },
        },
      });

      const score = evalRes?.score || 0;
      const notes = evalRes?.notes || "No notes available";
      const verdict = evalRes?.verdict || "revise";

      // 3. Update the prompt record
      await base44.entities.PromptLibrary.update(prompt.id, {
        test_image_url: imageUrl,
        quality_score: score,
        test_notes: notes,
        tested_at: new Date().toISOString(),
        test_count: (prompt.test_count || 0) + 1,
        is_featured: score >= 85 && verdict === "approve",
      });

      queryClient.invalidateQueries({ queryKey: ["prompt-library-all"] });
    } catch (e) {
      setError(e.message || "Failed to test prompt");
    } finally {
      setTesting(null);
    }
  };

  const handleApprove = async (prompt) => {
    await base44.entities.PromptLibrary.update(prompt.id, {
      is_featured: true,
      is_active: true,
    });
    queryClient.invalidateQueries({ queryKey: ["prompt-library-all"] });
  };

  const handleReject = async (prompt) => {
    await base44.entities.PromptLibrary.update(prompt.id, {
      is_featured: false,
      is_active: false,
    });
    queryClient.invalidateQueries({ queryKey: ["prompt-library-all"] });
  };

  const handleAutoTest = async () => {
    setAutoTesting(true);
    setError(null);
    setAutoTestResult(null);
    try {
      const res = await base44.functions.invoke("automatedPromptTester", { maxPrompts: 5 });
      setAutoTestResult(res?.data?.summary || null);
      queryClient.invalidateQueries({ queryKey: ["prompt-library-all"] });
    } catch (e) {
      setError(e.message || "Auto-test failed");
    } finally {
      setAutoTesting(false);
    }
  };

  const selectedPromptData = prompts.find((p) => p.id === selectedPrompt);

  return (
    <AdminSystemPage
      eyebrow="PROMPT LAB · IMAGE QA"
      title="Prompt Testing Lab"
      description="Generate test images from your prompt library, AI-evaluate quality, and approve only the best for live templates."
      badge="◈ QA PIPELINE"
      stats={[
        ["Total prompts", String(stats.total)],
        ["Tested", String(stats.tested)],
        ["Featured", String(stats.featured)],
        ["Avg score", stats.avgScore + "/100"],
      ]}
    >
      {/* Autonomous tester banner */}
      <div className="rounded-lg border border-[#dce6f1] bg-gradient-to-r from-[#f8fbfe] to-[#f0f7ff] p-4 mb-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg grid place-items-center bg-[#126fc8]/10 text-[#126fc8]">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#112940] flex items-center gap-2">
                Autonomous Prompt Tester
                <span className="flex items-center gap-1 text-[10px] font-bold text-[#16a34a] bg-green-50 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse" /> ACTIVE
                </span>
              </p>
              <p className="text-xs text-[#607790] flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3 h-3" /> Runs automatically every 12 hours · Tests 5 prompts per cycle · Auto-features 85+ scores
              </p>
            </div>
          </div>
          <button
            onClick={handleAutoTest}
            disabled={autoTesting}
            className="flex items-center gap-2 px-4 h-9 rounded-lg bg-[#126fc8] text-white text-xs font-bold hover:bg-[#0d58a8] disabled:opacity-50 transition"
          >
            {autoTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            {autoTesting ? "Testing..." : "Run Auto-Test Now"}
          </button>
        </div>
        {autoTestResult && (
          <div className="mt-3 pt-3 border-t border-[#dce6f1] flex items-center gap-4 text-xs">
            <span className="text-[#16a34a] font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Tested: {autoTestResult.tested}</span>
            <span className="text-[#d97706] font-bold flex items-center gap-1"><Star className="w-3.5 h-3.5" /> Featured: {autoTestResult.featured}</span>
            {autoTestResult.deactivated > 0 && (
              <span className="text-red-500 font-bold flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Deactivated: {autoTestResult.deactivated}</span>
            )}
          </div>
        )}
      </div>

      {/* Autonomous agent status panel */}
      <div className="rounded-lg border border-[#dce6f1] bg-white p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-[#126fc8]" />
          <h3 className="text-sm font-bold text-[#112940]">Autonomous Agent Status</h3>
          <span className="text-[10px] text-[#8faec9] ml-auto font-mono">cron: 0 */12 * * *</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <AgentStat
            icon={Clock}
            label="Last Run"
            value={agentStats.lastTested ? new Date(agentStats.lastTested).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Never"}
            color="#126fc8"
          />
          <AgentStat
            icon={RefreshCw}
            label="Next Run"
            value={agentStats.nextRun ? new Date(agentStats.nextRun).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Pending"}
            color="#7c3aed"
          />
          <AgentStat
            icon={Zap}
            label="Tested (24h)"
            value={String(agentStats.recentlyTested)}
            color="#d97706"
          />
          <AgentStat
            icon={Star}
            label="Auto-Featured"
            value={String(agentStats.autoFeatured)}
            color="#16a34a"
          />
          <AgentStat
            icon={AlertCircle}
            label="Stale Prompts"
            value={String(agentStats.stale)}
            color={agentStats.stale > 0 ? "#dc2626" : "#607790"}
          />
          <AgentStat
            icon={XCircle}
            label="Deactivated"
            value={String(agentStats.deactivated)}
            color="#8faec9"
          />
        </div>
        <div className="mt-3 pt-3 border-t border-[#e4edf5] flex items-center gap-2 text-[11px] text-[#607790]">
          <Bot className="w-3 h-3 text-[#16a34a]" />
          <span>The autonomous agent runs every 12 hours via cron, testing up to 5 stale prompts per cycle. Prompts scoring 85+ are auto-featured; prompts scoring below 50 across 3+ tests are auto-deactivated.</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-[#8faec9] shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts by title, text, or industry..."
            className="flex-1 h-9 px-3 rounded-lg border border-[#dce6f1] text-sm text-[#112940] focus:border-[#126fc8] outline-none"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border border-[#dce6f1] text-sm text-[#112940] focus:border-[#126fc8] outline-none bg-white"
        >
          <option value="all">All Categories</option>
          <option value="hero_image">Hero Image</option>
          <option value="industry_photo">Industry Photo</option>
          <option value="product_shot">Product Shot</option>
          <option value="background">Background</option>
          <option value="logo">Logo</option>
          <option value="avatar">Avatar</option>
          <option value="social_card">Social Card</option>
          <option value="gallery">Gallery</option>
          <option value="custom">Custom</option>
        </select>
        <div className="flex gap-1.5">
          {["all", "untested", "tested", "featured"].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 h-9 rounded-lg text-xs font-bold border capitalize ${
                statusFilter === f
                  ? "border-[#126fc8] text-[#126fc8] bg-[#126fc8]/5"
                  : "border-[#e4e4e7] text-[#607790] bg-white hover:border-[#126fc8]/40"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Prompt grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#126fc8]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#607790]">
          <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No prompts found. The autonomous agent seeds prompts every 6 hours.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((prompt) => (
            <PromptTestCard
              key={prompt.id}
              prompt={prompt}
              isSelected={selectedPrompt === prompt.id}
              isTesting={testing === prompt.id}
              onSelect={() => setSelectedPrompt(prompt.id)}
              onTest={() => handleTest(prompt)}
              onApprove={() => handleApprove(prompt)}
              onReject={() => handleReject(prompt)}
            />
          ))}
        </div>
      )}

      {/* Preview drawer */}
      {selectedPromptData && (
        <PromptTestPreview
          prompt={selectedPromptData}
          onClose={() => setSelectedPrompt(null)}
          onTest={() => handleTest(selectedPromptData)}
          onApprove={() => handleApprove(selectedPromptData)}
          onReject={() => handleReject(selectedPromptData)}
        />
      )}
    </AdminSystemPage>
  );
}

function AgentStat({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-lg bg-[#f8fbfe] border border-[#e4edf5] p-2.5 text-center">
      <div className="w-7 h-7 rounded-lg grid place-items-center mx-auto mb-1" style={{ background: color + "15", color }}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <p className="text-xs font-extrabold text-[#112940] truncate">{value}</p>
      <p className="text-[9px] text-[#607790] uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}