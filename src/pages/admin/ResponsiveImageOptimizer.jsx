import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import ResponsiveImageBackground from "@/components/responsive-image/ResponsiveImageBackground";
import { Sparkles, Smartphone, Monitor, Loader2, Copy, Check, Wand2 } from "lucide-react";

const DEFAULT_IMAGES = [
  { label: "Home", url: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/f82707753_FACEBOOKIMAGE2.png" },
  { label: "AI Strategy", url: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/873cfcc83_FACEBOOKIMAGE3.png" },
  { label: "Custom Systems", url: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/5220e56a5_FACEBOOKIMAGE4.png" },
  { label: "AI-Powered Growth", url: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/71e8a9d98_fACEBOOKIMAGE5.png" },
  { label: "Digital Dominance", url: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/7458bbe92_FACEBOOKIMAGE6.png" },
];

export default function ResponsiveImageOptimizer() {
  const [imageUrl, setImageUrl] = useState("");
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [batchResults, setBatchResults] = useState(null);
  const [batchLoading, setBatchLoading] = useState(false);

  const optimize = async (url) => {
    const targetUrl = url || imageUrl;
    if (!targetUrl) return;
    setLoading(true);
    setError(null);
    setConfig(null);
    try {
      const res = await base44.functions.invoke("responsiveImageOptimizer", { action: "optimize", image_url: targetUrl });
      if (res.data?.error) throw new Error(res.data.error);
      setConfig(res.data?.config || null);
      setImageUrl(targetUrl);
    } catch (err) {
      setError(err.message || "Optimization failed");
    }
    setLoading(false);
  };

  const batchOptimize = async () => {
    setBatchLoading(true);
    setBatchResults(null);
    try {
      const res = await base44.functions.invoke("responsiveImageOptimizer", {
        action: "batchOptimize",
        image_urls: DEFAULT_IMAGES.map((i) => i.url),
      });
      setBatchResults(res.data?.results || []);
    } catch (err) {
      setError(err.message);
    }
    setBatchLoading(false);
  };

  const copyConfig = () => {
    if (!config) return;
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-amber-500" /> Responsive Image Optimizer
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          AI-powered analysis via Vercel AI Gateway. Optimizes your design images for perfect display on both desktop and mobile.
        </p>
      </div>

      {/* Quick optimize all 5 marketing images */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-amber-800">Batch Optimize All Marketing Images</p>
          <button
            onClick={batchOptimize}
            disabled={batchLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 disabled:opacity-50"
          >
            {batchLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
            {batchLoading ? "Optimizing 5 images..." : "Optimize All 5"}
          </button>
        </div>
        {batchResults && (
          <div className="space-y-2">
            {batchResults.map((r, i) => (
              <div key={i} className={`rounded-lg p-2.5 text-xs ${r.error ? "bg-red-50 border border-red-200" : "bg-white border border-stone-200"}`}>
                {r.error ? (
                  <span className="text-red-600">{DEFAULT_IMAGES[i]?.label}: {r.error}</span>
                ) : (
                  <div>
                    <span className="font-bold text-stone-700">{DEFAULT_IMAGES[i]?.label}</span>
                    <span className="text-stone-500 ml-2">→ desktop: {r.config?.object_position_desktop}, mobile: {r.config?.object_position_mobile}, scale: {r.config?.scale_mobile}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Single image optimizer */}
      <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
        <p className="text-sm font-bold text-stone-700">Optimize a Single Image</p>
        <div className="flex gap-2">
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Paste image URL..."
            className="flex-1 h-10 px-3 rounded-lg border border-stone-200 focus:border-amber-500 outline-none text-sm"
          />
          <button
            onClick={() => optimize()}
            disabled={loading || !imageUrl}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-900 text-white font-bold text-sm hover:bg-stone-800 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Analyzing..." : "Optimize"}
          </button>
        </div>

        {/* Quick select */}
        <div className="flex flex-wrap gap-1.5">
          {DEFAULT_IMAGES.map((img) => (
            <button
              key={img.url}
              onClick={() => optimize(img.url)}
              disabled={loading}
              className="px-2.5 py-1 rounded-full text-xs font-semibold border border-stone-200 text-stone-600 hover:border-amber-400 hover:text-amber-600 disabled:opacity-50"
            >
              {img.label}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
      </div>

      {/* Side-by-side preview */}
      {config && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-stone-700">Preview — Desktop vs Mobile</p>
            <button
              onClick={copyConfig}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-50"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy Config"}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Desktop preview */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Monitor className="h-4 w-4 text-stone-500" />
                <span className="text-xs font-bold uppercase tracking-wide text-stone-500">Desktop (16:9)</span>
              </div>
              <div className="relative w-full rounded-xl overflow-hidden border-2 border-stone-200 bg-black" style={{ aspectRatio: "16/9" }}>
                <img
                  src={imageUrl}
                  alt="Desktop preview"
                  className="absolute inset-0 w-full h-full"
                  style={{
                    objectFit: config.treatment_desktop,
                    objectPosition: config.object_position_desktop,
                    transform: `scale(${config.scale_desktop})`,
                    transformOrigin: "center center",
                  }}
                />
              </div>
            </div>

            {/* Mobile preview */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="h-4 w-4 text-stone-500" />
                <span className="text-xs font-bold uppercase tracking-wide text-stone-500">Mobile (9:16)</span>
              </div>
              <div className="relative mx-auto rounded-xl overflow-hidden border-2 border-stone-200 bg-black" style={{ aspectRatio: "9/16", maxWidth: "280px" }}>
                <img
                  src={imageUrl}
                  alt="Mobile preview"
                  className="absolute inset-0 w-full h-full"
                  style={{
                    objectFit: config.treatment_mobile,
                    objectPosition: config.object_position_mobile,
                    transform: `scale(${config.scale_mobile})`,
                    transformOrigin: "center center",
                  }}
                />
              </div>
            </div>
          </div>

          {/* AI Analysis */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
            <p className="text-sm font-bold text-stone-700">AI Analysis & Config</p>
            {config.analysis && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-stone-400 mb-1">Analysis</p>
                <p className="text-sm text-stone-600">{config.analysis}</p>
              </div>
            )}
            {config.recommendation && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-stone-400 mb-1">Recommendation</p>
                <p className="text-sm text-stone-600">{config.recommendation}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-stone-400 mb-1">Config JSON</p>
              <pre className="text-xs font-mono bg-stone-950 text-stone-200 p-3 rounded-lg overflow-auto max-h-48">{JSON.stringify(config, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}