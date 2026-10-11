import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Plus, Trash2, Save, Eye, Link2, X } from "lucide-react";

export default function ImageToPageStudio() {
  const [imageUrl, setImageUrl] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [hotspots, setHotspots] = useState([]);
  const [dragStart, setDragStart] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedSlug, setSavedSlug] = useState(null);
  const imgRef = useRef(null);

  const slugify = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleImageClick = (e) => {
    if (!imageUrl || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setHotspots((prev) => [...prev, { x: x - 5, y: y - 3, width: 10, height: 6, link: "", label: `Hotspot ${prev.length + 1}` }]);
  };

  const updateHotspot = (i, field, value) => {
    setHotspots((prev) => prev.map((h, j) => (j === i ? { ...h, [field]: value } : h)));
  };

  const removeHotspot = (i) => setHotspots((prev) => prev.filter((_, j) => j !== i));

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      if (res?.file_url) setImageUrl(res.file_url);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed — integration credits may be exhausted. Try pasting a URL instead.");
    }
  };

  const save = async () => {
    if (!imageUrl || !title) return;
    setSaving(true);
    try {
      const finalSlug = slugify(slug || title);
      await base44.entities.DynamicPage.create({
        title,
        slug: finalSlug,
        status: "published",
        is_public: true,
        sections: [{ id: "img-page", type: "image_page", props: { image_url: imageUrl, hotspots } }],
      });
      setSavedSlug(finalSlug);
    } catch (err) {
      console.error("Save failed:", err);
      alert("Save failed: " + err.message);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
          <Eye className="h-6 w-6 text-amber-500" /> Image-to-Page Studio
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Upload or paste any design image. We render it as a full-page background with 100% visual parity. Click on the preview to add clickable hotspots, then publish.
        </p>
      </div>

      {/* Input row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">Image URL</label>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://media.base44.com/images/..."
            className="mt-1 w-full h-10 px-3 rounded-lg border border-stone-200 focus:border-amber-500 outline-none text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">Or Upload</label>
          <label className="mt-1 flex items-center gap-2 h-10 px-4 rounded-lg border border-stone-200 cursor-pointer hover:border-amber-400 text-sm font-semibold text-stone-600">
            <Upload className="h-4 w-4" /> Choose File
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">Page Title</label>
          <input value={title} onChange={(e) => { setTitle(e.target.value); if (!slug) setSlug(slugify(e.target.value)); }} placeholder="AI Strategy & Consulting" className="mt-1 w-full h-10 px-3 rounded-lg border border-stone-200 focus:border-amber-500 outline-none text-sm" />
        </div>
        <div>
          <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">Slug (URL: /p/slug)</label>
          <input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} placeholder="ai-strategy-consulting" className="mt-1 w-full h-10 px-3 rounded-lg border border-stone-200 focus:border-amber-500 outline-none text-sm" />
        </div>
      </div>

      {/* Preview + Hotspots */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        {/* Image preview — click to add hotspots */}
        <div className="relative rounded-xl overflow-hidden border-2 border-stone-200 bg-black aspect-[4/3] sm:aspect-[16/10] cursor-crosshair" onClick={handleImageClick}>
          {imageUrl ? (
            <>
              <img ref={imgRef} src={imageUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
              {hotspots.map((h, i) => (
                <div
                  key={i}
                  className="absolute border-2 border-[#00D4FF] bg-[#00D4FF]/15 rounded-lg flex items-center justify-center pointer-events-none"
                  style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.width}%`, height: `${h.height}%` }}
                >
                  <span className="text-[9px] font-bold text-white">{i + 1}</span>
                </div>
              ))}
              <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded">
                Click to add hotspot
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-stone-500 text-sm">
              Paste an image URL or upload a file to start
            </div>
          )}
        </div>

        {/* Hotspot list */}
        <div className="rounded-xl border border-stone-200 bg-white p-3 max-h-[400px] overflow-y-auto">
          <p className="text-xs font-bold uppercase tracking-wide text-stone-400 mb-2">Clickable Hotspots ({hotspots.length})</p>
          {hotspots.length === 0 ? (
            <p className="text-xs text-stone-400 py-4 text-center">Click on the image to add clickable zones.</p>
          ) : (
            <div className="space-y-2">
              {hotspots.map((h, i) => (
                <div key={i} className="rounded-lg border border-stone-200 p-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-600">Hotspot {i + 1}</span>
                    <button onClick={() => removeHotspot(i)} className="text-stone-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                  <input value={h.label} onChange={(e) => updateHotspot(i, "label", e.target.value)} placeholder="Label" className="w-full h-8 px-2 rounded border border-stone-200 text-xs outline-none focus:border-amber-400" />
                  <input value={h.link} onChange={(e) => updateHotspot(i, "link", e.target.value)} placeholder="/ai-strategy or https://..." className="w-full h-8 px-2 rounded border border-stone-200 text-xs outline-none focus:border-amber-400" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={!imageUrl || !title || saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 text-stone-950 font-bold text-sm hover:bg-amber-400 disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? "Publishing..." : "Publish Page"}
        </button>
        {savedSlug && (
          <a href={`/p/${savedSlug}`} target="_blank" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-emerald-300 text-emerald-700 font-bold text-sm hover:bg-emerald-50">
            <Link2 className="h-4 w-4" /> View Live Page →
          </a>
        )}
      </div>
    </div>
  );
}