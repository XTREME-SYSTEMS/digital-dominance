import React, { useState, useEffect } from "react";
import { Loader2, RefreshCw, Sparkles, Video, Zap, Target, Gauge, Check, AlertCircle, Eye, Download } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { TEMPLATE_LAYOUTS, TOP_5_GENERATORS, BENCHMARK_CATEGORIES } from "@/data/templateLayouts";
import { TOP_20_INDUSTRIES } from "@/data/topIndustries";
import WebsitePreview from "@/components/launch-engine/WebsitePreview";
import BrandGenerator, { BRAND_OPTIONS } from "@/components/launch-engine/BrandGenerator";

export default function TemplateStudio() {
  const [industry, setIndustry] = useState(TOP_20_INDUSTRIES[0].id);
  const [industryLabel, setIndustryLabel] = useState(TOP_20_INDUSTRIES[0].label);
  const [layout, setLayout] = useState(TEMPLATE_LAYOUTS[0]);
  const [brand, setBrand] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [benchmarking, setBenchmarking] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [benchmark, setBenchmark] = useState(null);
  const [enhancement, setEnhancement] = useState(null);
  const [generatingLogo, setGeneratingLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);

  const selectIndustry = (id) => {
    const t = TOP_20_INDUSTRIES.find((x) => x.id === id);
    setIndustry(id);
    setIndustryLabel(t?.label || "");
  };

  // Generate AI video for the template
  const generateVideo = async () => {
    setGeneratingVideo(true);
    try {
      const res = await base44.integrations.Core.GenerateVideo({
        prompt: `Professional promotional video for a ${industryLabel} business. Cinematic shots of professional work, satisfied customers, before-and-after transformations. Warm lighting, confident tone, 16:9 landscape.`,
        duration: 6,
        aspect_ratio: "16:9",
        generate_audio: false,
      });
      setVideoUrl(res.url);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingVideo(false);
    }
  };

  // Generate AI logo for the brand
  const generateLogo = async () => {
    setGeneratingLogo(true);
    try {
      const brandName = brand?.name || industryLabel;
      const accentColor = brand?.accentColor || "#00a2ff";
      const res = await base44.integrations.Core.GenerateImage({
        prompt: `Modern minimalist logo for a ${industryLabel} business called "${brandName}". Professional, clean, geometric design. Primary color: ${accentColor}. White background. High quality vector style logo.`,
      });
      setLogoUrl(res.url);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingLogo(false);
    }
  };

  // Regenerate template with new variations
  const regenerate = async () => {
    setRegenerating(true);
    try {
      // Pick a random layout from the same trend
      const sameTrend = TEMPLATE_LAYOUTS.filter((l) => l.trend === layout.trend && l.id !== layout.id);
      const newLayout = sameTrend.length > 0
        ? sameTrend[Math.floor(Math.random() * sameTrend.length)]
        : TEMPLATE_LAYOUTS[Math.floor(Math.random() * TEMPLATE_LAYOUTS.length)];
      setLayout(newLayout);
      // Regenerate brand
      if (BRAND_OPTIONS.length > 0) {
        setBrand(BRAND_OPTIONS[Math.floor(Math.random() * BRAND_OPTIONS.length)]);
      }
    } finally {
      setRegenerating(false);
    }
  };

  // Run benchmark against top 5 generators
  const runBenchmark = async () => {
    setBenchmarking(true);
    setBenchmark(null);
    try {
      const res = await base44.functions.invoke("websiteBenchmarkSystem", {
        templateContent: {
          hero: `${industryLabel} - Professional Services`,
          services: ["Service 1", "Service 2", "Service 3"],
          testimonials: ["Review 1", "Review 2", "Review 3"],
          gallery: true,
          video: !!videoUrl,
          cta_buttons: ["Call Now", "Free Quote"],
          brand_colors: !!brand,
          brand_logo: !!logoUrl,
          brand_fonts: !!brand,
          responsive: true,
          schema_markup: true,
          faq: ["Q1", "Q2", "Q3", "Q4", "Q5"],
          faq_schema: true,
        },
        templateLayout: layout.id,
        industry: industryLabel,
      });
      setBenchmark(res.data);
    } catch (err) {
      setBenchmark({ error: err.message });
    } finally {
      setBenchmarking(false);
    }
  };

  // Run autonomous enhancement loop until 100%
  const runAutonomousEnhancement = async () => {
    setEnhancing(true);
    setEnhancement(null);
    try {
      const res = await base44.functions.invoke("autonomousTemplateEnhancer", {
        industry: industryLabel,
        content: {
          hero: `${industryLabel} - Professional Services`,
          services: ["Service 1", "Service 2", "Service 3"],
          layout: layout.id,
        },
        brand: brand ? { name: brand.name, colors: brand.colors, logo_url: logoUrl } : undefined,
        maxCycles: 5,
        targetScore: 100,
      });
      setEnhancement(res.data);
    } catch (err) {
      setEnhancement({ error: err.message });
    } finally {
      setEnhancing(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-stone-950 via-amber-950 to-stone-900 p-5 text-white border border-amber-500/30">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 grid place-items-center">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-extrabold tracking-tight">Template Studio</h1>
            <p className="text-stone-400 text-xs">20 layouts · AI branding · Video · Benchmark vs top 5 generators · Autonomous 100% enhancement</p>
          </div>
        </div>
      </div>

      {/* Industry selector */}
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <label className="text-xs font-bold text-stone-500 mb-2 block">Industry Template</label>
        <select value={industry} onChange={(e) => selectIndustry(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500">
          {TOP_20_INDUSTRIES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Layout selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-800">20 Layout Options</h3>
            <button onClick={regenerate} disabled={regenerating}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-stone-900 hover:bg-amber-400 disabled:opacity-40">
              {regenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Regenerate
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
            {TEMPLATE_LAYOUTS.map((l) => (
              <button key={l.id} onClick={() => setLayout(l)}
                className={`rounded-xl border p-3 text-left transition ${layout.id === l.id ? "border-amber-500 bg-amber-50" : "border-stone-200 bg-white hover:border-stone-300"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-stone-800">{l.name}</span>
                  <span className="text-[10px] font-bold text-amber-600">{l.rating}★</span>
                </div>
                <p className="text-[10px] text-stone-500 mb-1">{l.trend}</p>
                <p className="text-[11px] text-stone-600 leading-tight">{l.description}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[9px] text-stone-400">Conv: {l.conversion_score}%</span>
                  <span className="text-[9px] text-stone-400">· {l.benchmark}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Center: Preview + Brand + Video */}
        <div className="lg:col-span-2 space-y-3">
          {/* Brand generator */}
          <BrandGenerator selected={brand} onSelect={setBrand} />

          {/* Logo + Video actions */}
          <div className="flex flex-wrap gap-2">
            <button onClick={generateLogo} disabled={generatingLogo}
              className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-2 text-xs font-bold text-stone-700 hover:border-amber-500 disabled:opacity-40">
              {generatingLogo ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              {generatingLogo ? "Generating..." : "Generate AI Logo"}
            </button>
            <button onClick={generateVideo} disabled={generatingVideo}
              className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-2 text-xs font-bold text-stone-700 hover:border-amber-500 disabled:opacity-40">
              {generatingVideo ? <Loader2 className="h-3 w-3 animate-spin" /> : <Video className="h-3 w-3" />}
              {generatingVideo ? "Generating Video..." : "Generate AI Video"}
            </button>
          </div>

          {/* Logo preview */}
          {logoUrl && (
            <div className="rounded-xl border border-stone-200 bg-white p-3 flex items-center gap-3">
              <img src={logoUrl} alt="Generated logo" className="h-16 w-16 object-contain rounded-lg" />
              <div>
                <p className="text-xs font-bold text-stone-700">AI-Generated Logo</p>
                <p className="text-[10px] text-stone-500">Highest quality logo generation technology</p>
              </div>
            </div>
          )}

          {/* Video preview */}
          {videoUrl && (
            <div className="rounded-xl border border-stone-200 bg-white p-3">
              <p className="text-xs font-bold text-stone-700 mb-2 flex items-center gap-1"><Video className="h-3 w-3" /> AI-Generated Video</p>
              <video src={videoUrl} controls className="w-full rounded-lg" />
            </div>
          )}

          {/* Website preview */}
          <div className="rounded-xl overflow-hidden border border-stone-200 shadow-lg" style={{ height: "500px" }}>
            <WebsitePreview industry={industryLabel} template={layout.name} brand={brand} />
          </div>
          <p className="text-[10px] text-stone-400 text-center">Live preview · {layout.name} layout · Scroll inside to explore</p>
        </div>
      </div>

      {/* Benchmark + Enhancement section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Benchmark vs top 5 generators */}
        <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-bold text-stone-800">Benchmark vs Top 5 Generators</h3>
            </div>
            <button onClick={runBenchmark} disabled={benchmarking}
              className="flex items-center gap-1.5 rounded-lg bg-stone-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-stone-700 disabled:opacity-40">
              {benchmarking ? <Loader2 className="h-3 w-3 animate-spin" /> : <Target className="h-3 w-3" />}
              Run Benchmark
            </button>
          </div>

          {/* Top 5 generators list */}
          <div className="flex flex-wrap gap-1.5">
            {TOP_5_GENERATORS.map((g) => (
              <span key={g.id} className="rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-bold text-stone-600">
                {g.name} {g.rating}★
              </span>
            ))}
          </div>

          {benchmark && (
            benchmark.error ? (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700"><AlertCircle className="h-4 w-4" /> {benchmark.error}</div>
            ) : (
              <div className="space-y-2">
                {/* Overall score */}
                <div className={`rounded-lg p-3 ${benchmark.overallStatus === "dominant" ? "bg-emerald-50" : benchmark.overallStatus === "competitive" ? "bg-blue-50" : "bg-amber-50"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-stone-700">Overall Score</span>
                    <span className="text-lg font-black text-stone-800">{benchmark.overallScore}/100</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-stone-500">
                    <span>Top 5 avg: {benchmark.benchmarkOverallAvg}</span>
                    <span className={`font-bold uppercase ${benchmark.overallStatus === "dominant" ? "text-emerald-600" : benchmark.overallStatus === "competitive" ? "text-blue-600" : "text-amber-600"}`}>{benchmark.overallStatus}</span>
                  </div>
                </div>

                {/* Category scores */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {benchmark.categoryResults?.map((c) => (
                    <div key={c.category} className="flex items-center gap-2 text-xs">
                      <span className="flex-1 text-stone-600 truncate">{c.category}</span>
                      <span className="font-bold text-stone-800">{c.ourScore}</span>
                      <span className="text-stone-400">/ {c.benchmarkAvg}</span>
                      <span className={`w-2 h-2 rounded-full ${c.status === "exceeds" ? "bg-emerald-500" : c.status === "meets" ? "bg-blue-500" : c.status === "below" ? "bg-amber-500" : "bg-red-500"}`} />
                    </div>
                  ))}
                </div>

                {/* Enhancement priority */}
                {benchmark.enhancementPriority?.length > 0 && (
                  <div className="rounded-lg bg-amber-50 p-2 space-y-1">
                    <p className="text-[10px] font-bold text-amber-700">Enhancement Priority:</p>
                    {benchmark.enhancementPriority.slice(0, 3).map((p, i) => (
                      <p key={i} className="text-[10px] text-amber-600">• {p.category}: {p.recommendation}</p>
                    ))}
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {/* Autonomous enhancement to 100% */}
        <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-bold text-stone-800">Autonomous Enhancement to 100%</h3>
            </div>
            <button onClick={runAutonomousEnhancement} disabled={enhancing}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:from-amber-400 hover:to-amber-500 disabled:opacity-40">
              {enhancing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
              Enhance to 100%
            </button>
          </div>

          <p className="text-[11px] text-stone-500">Runs skip trace → benchmark → score → enhance → re-score loop until all categories reach 100%.</p>

          {enhancing && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Running autonomous enhancement cycles...
            </div>
          )}

          {enhancement && (
            enhancement.error ? (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700"><AlertCircle className="h-4 w-4" /> {enhancement.error}</div>
            ) : (
              <div className="space-y-2">
                <div className="rounded-lg bg-emerald-50 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-stone-700">Score Progression</span>
                    <span className="text-lg font-black text-emerald-700">{enhancement.finalScore}/100</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-stone-500">
                    <span>Baseline: {enhancement.baselineScore}</span>
                    <span>→</span>
                    <span>Cycles: {enhancement.cyclesRun}/{enhancement.maxCycles}</span>
                    {enhancement.converged && <span className="flex items-center gap-1 text-emerald-600 font-bold"><Check className="h-3 w-3" /> CONVERGED</span>}
                  </div>
                </div>

                {/* Cycle details */}
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {enhancement.cycles?.map((c) => (
                    <div key={c.cycle} className="flex items-center gap-2 text-[10px] text-stone-600 rounded bg-stone-50 px-2 py-1">
                      <span className="font-bold">Cycle {c.cycle}:</span>
                      <span>{c.scoreBefore} → {c.scoreAfter}</span>
                      {c.enhancementsApplied?.map((e, i) => (
                        <span key={i} className="text-amber-600 truncate">· {e}</span>
                      ))}
                    </div>
                  ))}
                </div>

                {/* God Mode plan */}
                {enhancement.godModePlan && (
                  <div className="rounded-lg bg-stone-50 p-2">
                    <p className="text-[10px] font-bold text-stone-700 mb-1">God Mode Phased Plan:</p>
                    <p className="text-[10px] text-stone-500">{JSON.stringify(enhancement.godModePlan).slice(0, 200)}...</p>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {/* Benchmark categories reference */}
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <h3 className="text-sm font-bold text-stone-800 mb-2 flex items-center gap-2"><Gauge className="h-4 w-4 text-amber-500" /> All Benchmark Categories (10 total)</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {BENCHMARK_CATEGORIES.map((c) => (
            <div key={c.id} className="rounded-lg border border-stone-100 p-2">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-bold text-stone-700">{c.name}</span>
                <span className="text-[9px] font-bold text-amber-600">{c.weight}%</span>
              </div>
              <p className="text-[9px] text-stone-400 leading-tight">{c.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}