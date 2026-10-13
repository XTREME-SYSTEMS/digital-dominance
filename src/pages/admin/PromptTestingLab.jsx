import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles, Image as ImageIcon, Loader2, CheckCircle2, XCircle, Star,
  Search, Filter, Eye, ThumbsUp, ThumbsDown, RefreshCw, Plus, AlertCircle,
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