import React, { useState, useEffect } from "react";
import { X, Sparkles, Loader2, Save, Eye } from "lucide-react";
import { base44 } from "@/api/base44Client";
import DeviceFrame from "@/components/universal-template/DeviceFrame.jsx";
import { PREVIEW_STYLES } from "@/lib/universal-template/previewStyles.js";
import { themeToCssVars, configFromBrandPreset } from "@/lib/universal-template/studioConfig.js";
import { renderTemplate } from "@/lib/universal-template/visualizerRenderer.js";
import { getPreset } from "@/lib/universal-template/brandPresets.js";

export default function AISiteGenerator({ onClose, onSaved }) {
  const [industries, setIndustries] = useState([]);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [brandName, setBrandName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.UniversalIndustryTemplate.filter(
      { template_status: { $in: ["configured", "active"] } },
      { sort: "name", limit: 60 }
    )
      .then((page) => setIndustries(page.items || []))
      .catch(() => {});
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerated(null);
    try {
      const res = await base44.functions.invoke("aiSiteGenerator", {
        prompt,
        industry_id: selectedIndustry?.industry_id,
        brand_name: brandName,
      });
      if (res.data?.template) {
        setGenerated(res.data.template);
      } else {
        alert("Generation failed: " + (res.data?.error || "Unknown error"));
      }
    } catch (e) {
      alert("Generation failed: " + e.message);
    }
    setGenerating(false);
  };

  const handleSave = async () => {
    if (!generated) return;
    setSaving(true);
    try {
      const preset = getPreset("custom_contractor");
      const rec = await base44.entities.BrandTemplate.create({
        template_key: `ai-gen-${Date.now().toString(36)}`,
        name: generated.name || `${brandName || "AI Generated"} Site`,
        brand_id: "custom_contractor",
        brand_config: {
          brand_name: brandName || "Your Brand",
          domain: "",
          primary_color: generated.brand_config?.primary_color || preset.primary_color,
          secondary_color: generated.brand_config?.secondary_color || preset.secondary_color,
          accent_color: generated.brand_config?.accent_color || preset.accent_color,
          logo_url: "",
          logo_text: brandName || "Your Brand",
          font_heading: generated.brand_config?.font_heading || preset.font_heading,
          font_body: generated.brand_config?.font_body || preset.font_body,
          phone: "(877) 958-6408",
          tagline: generated.brand_config?.tagline || preset.tagline,
        },
        category: "homepage",
        niche: selectedIndustry?.industry_id || "epoxy_garage",
        sections: generated.sections || [],
        version: "1.0.0",
        status: "draft",
      });
      if (onSaved) onSaved(rec);
      onClose();
    } catch (e) {
      alert("Save failed: " + e.message);
    }
    setSaving(false);
  };

  const studioConfig = configFromBrandPreset(generated?.brand_config || getPreset("custom_contractor"));
  const themeVars = themeToCssVars(studioConfig);
  const preview = generated ? renderTemplate(generated.sections || [], studioConfig) : null;

  return (
    <div className="te-ai-overlay" onClick={onClose}>
      <div className="te-ai-panel" onClick={(e) => e.stopPropagation()}>
        <div className="te-ai-header">
          <h2><Sparkles className="w-5 h-5" style={{ color: "#a5b4fc" }} /> AI Site Generator</h2>
          <button className="te-ai-close" onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <div className="te-ai-body">
          <div className="te-ai-field">
            <label className="te-ai-label">Brand / Business Name</label>
            <input
              className="te-ai-input"
              placeholder="e.g. Elite Garage Floors"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
            />
          </div>

          <div className="te-ai-field">
            <label className="te-ai-label">Pick an Industry (optional)</label>
            <div className="te-ai-industry-grid">
              {industries.map((ind) => (
                <button
                  key={ind.id}
                  className={`te-ai-industry ${selectedIndustry?.id === ind.id ? "active" : ""}`}
                  onClick={() => setSelectedIndustry(ind)}
                >
                  {ind.name}
                </button>
              ))}
            </div>
          </div>

          <div className="te-ai-field">
            <label className="te-ai-label">Or describe what you want</label>
            <textarea
              className="te-ai-textarea"
              placeholder="e.g. A modern website for a garage floor coating company in Miami. Should include hero, services, gallery, testimonials, and a contact form. Blue and white color scheme."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <button
            className="te-ai-generate"
            onClick={handleGenerate}
            disabled={generating || (!prompt && !selectedIndustry)}
          >
            {generating ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating beautiful website...</> : <><Sparkles className="w-5 h-5" /> Generate Website</>}
          </button>

          {generated && preview && (
            <>
              <div className="te-ai-result">
                <div className="te-ai-result-preview" style={themeVars}>
                  <style>{PREVIEW_STYLES}</style>
                  <DeviceFrame type={preview.frame} designW={preview.designW} designH={preview.designH} displayW={560}>
                    <div style={{ width: preview.designW, height: preview.designH }} dangerouslySetInnerHTML={{ __html: preview.html }} />
                  </DeviceFrame>
                </div>
                <div className="te-ai-result-info">
                  <h3 className="te-ai-result-title">{generated.name || "AI Generated Site"}</h3>
                  <div className="te-ai-result-meta">
                    {generated.sections?.length || 0} sections · {generated.brand_config?.primary_color || "default"} theme
                  </div>
                </div>
              </div>
              <div className="te-ai-actions">
                <button onClick={handleGenerate} disabled={generating}>
                  <Eye className="w-4 h-4" /> Regenerate
                </button>
                <button className="primary" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save to Gallery
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}