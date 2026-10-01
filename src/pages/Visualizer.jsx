import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2, Upload, Wand2, AlertCircle, Sparkles, Palette, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { uploadFile } from "@/lib/gateway";
import { getSystemColorRecords } from "@/lib/floorColors";
import { FLOOR_SYSTEM_DATA } from "@/data/colorData";
import { AI_DISCLOSURE } from "@/lib/brand";
import Disclosure from "@/components/vq/Disclosure";
import GlitterSwatch from "@/components/ui/GlitterSwatch";
import BackButton from "@/components/BackButton";
import Logo from "@/components/Logo";
import { trackEvent } from "@/lib/tracking";

const SAMPLE_PHOTO = "https://images.unsplash.com/photo-1605152276897-4296181db00d?w=1200&q=80";

const SYSTEMS = FLOOR_SYSTEM_DATA
  .filter((s) => s.name !== "Joint Fill & Repair")
  .map((s) => s.name);

const FINISHES = [
  { key: "Matte", desc: "flat matte sheen with no reflections" },
  { key: "Satin", desc: "soft satin sheen with gentle subtle reflections" },
  { key: "High Gloss", desc: "high-gloss wet-look sheen with sharp mirror-like reflections" },
];

export default function Visualizer() {
  const [systemName, setSystemName] = useState("Flake Epoxy");
  const [photoUrl, setPhotoUrl] = useState(SAMPLE_PHOTO);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [conceptUrl, setConceptUrl] = useState("");
  const [finish, setFinish] = useState("High Gloss");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const colorRecords = getSystemColorRecords(systemName);
  const [selectedColor, setSelectedColor] = useState(colorRecords[0] || null);

  useEffect(() => {
    const records = getSystemColorRecords(systemName);
    setSelectedColor(records[0] || null);
    setConceptUrl("");
  }, [systemName]);

  useEffect(() => {
    trackEvent("visualizer_page_viewed", {});
  }, []);

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
    setPhotoUrl(dataUrl);
    setUploadedUrl("");
    setConceptUrl("");
    try {
      const { file_url } = await uploadFile(file);
      setUploadedUrl(file_url);
    } catch {
      // upload failed — AI gen needs a public URL
    }
  };

  const generate = async () => {
    if (!uploadedUrl) {
      setError("Upload a photo first (the sample photo can't be used for AI rendering).");
      return;
    }
    if (!selectedColor?.name) {
      setError("Missing color selection");
      return;
    }
    setLoading(true);
    setError("");
    setConceptUrl("");
    trackEvent("visualizer_generate_clicked", { system: systemName, color: selectedColor?.name, finish });
    try {
      const sheenDesc = FINISHES.find((f) => f.key === finish)?.desc || FINISHES[2].desc;
      const prompt =
        'Photorealistic interior design rendering of the uploaded room with a newly installed ' +
        systemName + ' floor in the color "' + (selectedColor.name || "") +
        '" with a ' + sheenDesc +
        '. Seamless, professional concrete coating finish. Same room geometry, walls, and lighting as the original photo. High-end real-estate photography, wide angle, natural light.';
      const res = await base44.functions.invoke('vercelAiGateway', {
        action: 'editImage',
        prompt,
        reference_image_url: uploadedUrl,
      });
      setConceptUrl(res?.data?.url || "");
      trackEvent("visualizer_render_complete", { system: systemName, color: selectedColor?.name });
    } catch (err) {
      setError(`FAILED: ${err?.message || err}`);
      console.error("[Visualizer] AI generate failed:", err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-stone-950 border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton className="text-stone-400 hover:text-white" />
            <Logo size="md" colorClass="text-white" />
          </div>
          <Link
            to="/funnel"
            onClick={() => trackEvent("visualizer_cta_estimate", { location: "header" })}
            className="flex h-9 items-center gap-2 rounded-lg text-xs font-bold transition px-4"
            style={{
              background: "linear-gradient(180deg, #FFE25A 0%, #FFD700 45%, #C8A300 100%)",
              border: "2px solid #000",
              color: "#1a1a1a",
              boxShadow: "0 3px 8px rgba(255,215,0,.35), inset 0 1px rgba(255,255,255,.4)",
            }}
          >
            Get Free Estimate <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold tracking-wide mb-3">
            <Palette className="h-3.5 w-3.5" /> FLOOR VISUALIZER
          </div>
          <h1 className="text-3xl font-black text-stone-900 mb-2">See Your New Floor Before You Buy</h1>
          <p className="text-sm text-stone-500 max-w-md mx-auto">
            Upload a photo of your garage or room, pick a color and finish, and get an AI-rendered preview in seconds. No cost, no obligation.
          </p>
        </div>

        {/* System picker */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-stone-700 mb-2">1. Choose Your Floor System</label>
          <div className="flex flex-wrap gap-2">
            {SYSTEMS.map((s) => (
              <button
                key={s}
                onClick={() => setSystemName(s)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition ${
                  systemName === s
                    ? "border-amber-500 bg-amber-50 text-stone-900"
                    : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Color picker */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-stone-700 mb-2">
            2. Pick a Color ({colorRecords.length} available) — Selected: {selectedColor?.name} ({selectedColor?.code})
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-56 overflow-y-auto p-1">
            {colorRecords.map((c) => (
              <button
                key={c.code}
                onClick={() => { setSelectedColor(c); setConceptUrl(""); }}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition ${
                  selectedColor?.code === c.code
                    ? "border-amber-500 bg-amber-50"
                    : "border-stone-200 bg-white hover:border-stone-300"
                }`}
              >
                {c.image_url ? (
                  <img
                    src={c.image_url}
                    alt={c.name}
                    loading="lazy"
                    className="h-12 w-full object-cover object-top rounded"
                  />
                ) : systemName === "Glitter Epoxy" ? (
                  <GlitterSwatch hex={c.hex} seed={c.code} className="h-12 w-full rounded" />
                ) : (
                  <span className="h-12 w-full rounded" style={{ background: c.hex }} />
                )}
                <span className="text-[10px] font-medium text-stone-700 truncate w-full text-center">{c.name}</span>
                <span className="text-[9px] text-stone-400">{c.code}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Finish picker */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-stone-700 mb-2">3. Choose Your Finish</label>
          <div className="flex flex-wrap gap-2">
            {FINISHES.map((f) => (
              <button
                key={f.key}
                onClick={() => { setFinish(f.key); setConceptUrl(""); }}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition ${
                  finish === f.key
                    ? "border-amber-500 bg-amber-50 text-stone-900"
                    : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                }`}
              >
                {f.key}
              </button>
            ))}
          </div>
        </div>

        {/* Photo upload */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-stone-700 mb-2">4. Upload Your Photo</label>
          <div className="flex gap-4 items-start">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-48 h-32 rounded-lg border-2 border-dashed border-stone-300 hover:border-amber-500 transition cursor-pointer overflow-hidden bg-stone-100"
            >
              {photoUrl ? (
                <img src={photoUrl} alt="Floor photo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center">
                  <Upload className="h-8 w-8 text-stone-400" />
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
            </div>
            <div className="text-xs text-stone-500 max-w-xs">
              {uploadedUrl ? (
                <span className="text-green-600 font-medium">✓ Photo uploaded — ready to render</span>
              ) : photoUrl === SAMPLE_PHOTO ? (
                <span>Sample photo shown. Upload your own to render (AI needs a public URL).</span>
              ) : (
                <span>Uploading photo…</span>
              )}
            </div>
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={generate}
          disabled={loading || !uploadedUrl}
          className="w-full h-14 rounded-xl flex items-center justify-center gap-2 text-base font-bold disabled:opacity-60 mb-4"
          style={{
            background: "linear-gradient(180deg, #FFF6D5 0%, #D4AF37 45%, #8B6914 100%)",
            border: "2px solid #000",
            color: "#1a1a1a",
            boxShadow: "0 4px 12px rgba(212,175,55,.4)",
          }}
        >
          {loading ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Rendering…</>
          ) : !uploadedUrl ? (
            <><Upload className="h-5 w-5" /> Upload a photo to render</>
          ) : (
            <><Wand2 className="h-5 w-5" /> Generate AI Render</>
          )}
        </button>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {/* Before / After result */}
        {conceptUrl && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-stone-900 mb-3">Your New Floor — Before & After</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl overflow-hidden border border-stone-200">
                <img src={photoUrl} alt="Before" className="w-full h-64 object-cover" />
                <p className="text-xs font-bold tracking-widest text-stone-400 p-2">BEFORE (original)</p>
              </div>
              <div className="rounded-xl overflow-hidden border-2 border-amber-400">
                <img src={conceptUrl} alt="After" className="w-full h-64 object-cover" />
                <p className="text-xs font-bold tracking-widest text-amber-600 p-2">
                  AFTER — {selectedColor?.name} · {finish}
                </p>
              </div>
            </div>
            <button
              onClick={generate}
              disabled={loading}
              className="mt-3 w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-bold bg-stone-100 text-stone-700 hover:bg-stone-200 transition disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "Regenerating…" : "Regenerate"}
            </button>
            <div className="mt-3">
              <Disclosure text={AI_DISCLOSURE} />
            </div>

            {/* CTA after render */}
            <Link
              to="/funnel"
              onClick={() => trackEvent("visualizer_cta_estimate", { location: "after_render" })}
              className="mt-4 w-full h-14 rounded-xl flex items-center justify-center gap-2 text-base font-bold transition"
              style={{
                background: "linear-gradient(180deg, #FFF6D5 0%, #D4AF37 45%, #8B6914 100%)",
                border: "2px solid #000",
                color: "#1a1a1a",
                boxShadow: "0 4px 12px rgba(212,175,55,.4)",
              }}
            >
              <ArrowRight className="h-5 w-5" /> Get Your Free Estimate Now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}