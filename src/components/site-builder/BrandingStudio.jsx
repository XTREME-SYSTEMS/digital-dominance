import React, { useState } from "react";
import { ACCENT_PRESETS } from "@/data/topIndustries";
import { base44 } from "@/api/base44Client";
import { generateImage } from "@/lib/gateway";
import { ArrowRight, ArrowLeft, Palette, Image as ImageIcon, Loader2, Sparkles, Check } from "lucide-react";

export default function BrandingStudio({ config, update, onNext, onBack }) {
  const [generatingLogo, setGeneratingLogo] = useState(false);
  const [logoPrompt, setLogoPrompt] = useState("");
  const [logoError, setLogoError] = useState(null);

  const industry = config.industry;

  const handleAccentChange = (preset) => {
    update({ accentColor: preset.value, accentName: preset.name });
  };

  const handleCustomColor = (e) => {
    update({ accentColor: e.target.value, accentName: "Custom" });
  };

  const generateLogo = async () => {
    if (!config.businessName) return;
    setGeneratingLogo(true);
    setLogoError(null);
    try {
      const prompt =
        logoPrompt ||
        `Professional minimalist logo for a ${industry.label} business called "${config.businessName}". ` +
        `Modern, clean, icon-based design with a ${config.accentName} accent color (${config.accentColor}). ` +
        `Flat design, vector style, white background, suitable for a website header. No text or minimal text.`;
      const res = await generateImage({ prompt });
      if (res?.url) {
        update({ logoUrl: res.url });
      } else {
        setLogoError("No image returned. Try again.");
      }
    } catch (e) {
      setLogoError(e.message || "Failed to generate logo");
    } finally {
      setGeneratingLogo(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-stone-900">Step 2 — Branding Studio</h2>
        <p className="text-sm text-stone-500 mt-1">
          Pick your accent color and generate a custom logo. Everything on the site adapts to your accent color.
        </p>
      </div>

      {/* Live Preview Header */}
      <div
        className="rounded-2xl border-2 p-6 transition-colors"
        style={{ borderColor: config.accentColor }}
      >
        <div className="flex items-center gap-4">
          {config.logoUrl ? (
            <img
              src={config.logoUrl}
              alt="Logo preview"
              className="h-16 w-16 rounded-xl object-contain border border-stone-200 bg-white p-1"
            />
          ) : (
            <div
              className="h-16 w-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl"
              style={{ backgroundColor: config.accentColor }}
            >
              {(config.businessName || "A").charAt(0)}
            </div>
          )}
          <div>
            <h3 className="text-2xl font-bold text-stone-900">{config.businessName || "Your Business"}</h3>
            <p className="text-sm text-stone-500">{industry.heroHeadline}</p>
          </div>
          <button
            className="ml-auto px-5 py-2.5 rounded-xl text-white font-bold text-sm"
            style={{ backgroundColor: config.accentColor }}
          >
            {industry.ctaText}
          </button>
        </div>
      </div>

      {/* Accent Color Picker */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
        <h3 className="font-bold text-stone-900 flex items-center gap-2">
          <Palette className="h-4 w-4 text-amber-500" /> Accent Color
        </h3>
        <div className="flex flex-wrap gap-3">
          {ACCENT_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handleAccentChange(preset)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition ${
                config.accentColor === preset.value
                  ? "border-stone-900 bg-stone-50"
                  : "border-stone-200 hover:border-stone-300"
              }`}
            >
              <div
                className="w-6 h-6 rounded-full border border-stone-300"
                style={{ backgroundColor: preset.value }}
              />
              <span className="text-sm font-semibold text-stone-700">{preset.name}</span>
              {config.accentColor === preset.value && <Check className="h-4 w-4 text-stone-900" />}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
          <label className="text-sm font-semibold text-stone-600">Custom:</label>
          <input
            type="color"
            value={config.accentColor}
            onChange={handleCustomColor}
            className="w-12 h-10 rounded cursor-pointer border border-stone-200"
          />
          <span className="text-sm font-mono text-stone-500">{config.accentColor}</span>
        </div>
      </div>

      {/* Logo Generator */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
        <h3 className="font-bold text-stone-900 flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-amber-500" /> Logo Generator
        </h3>
        <p className="text-sm text-stone-500">
          AI-generate a custom logo for your business. Leave the prompt blank to auto-generate based on your industry.
        </p>
        <textarea
          value={logoPrompt}
          onChange={(e) => setLogoPrompt(e.target.value)}
          placeholder={`Auto-generate based on: ${industry.label} · ${config.businessName} · ${config.accentName}`}
          className="w-full px-4 py-3 text-sm border border-stone-200 rounded-lg focus:border-amber-500 outline-none resize-none h-20"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={generateLogo}
            disabled={generatingLogo || !config.businessName}
            className="px-5 py-2.5 rounded-lg bg-stone-900 text-white font-bold text-sm hover:bg-stone-800 disabled:opacity-50 flex items-center gap-2"
          >
            {generatingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generatingLogo ? "Generating Logo..." : "Generate Logo"}
          </button>
          {config.logoUrl && (
            <span className="text-sm text-emerald-600 font-semibold flex items-center gap-1">
              <Check className="h-4 w-4" /> Logo generated
            </span>
          )}
        </div>
        {logoError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{logoError}</div>
        )}
        {config.logoUrl && (
          <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl border border-stone-200">
            <img src={config.logoUrl} alt="Generated logo" className="h-20 w-20 rounded-xl object-contain bg-white border border-stone-200 p-1" />
            <div>
              <p className="text-sm font-semibold text-stone-700">Your new logo</p>
              <p className="text-xs text-stone-500">This will be used in the site header, favicon, and social profiles.</p>
              <button onClick={generateLogo} disabled={generatingLogo} className="text-xs text-amber-600 font-semibold hover:underline mt-1">
                Regenerate
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="px-5 py-2.5 rounded-lg border border-stone-200 text-stone-600 font-semibold text-sm hover:bg-stone-50 flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button onClick={onNext} className="px-6 py-2.5 rounded-lg bg-amber-500 text-stone-950 font-bold text-sm hover:bg-amber-400 flex items-center gap-2">
          Continue <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}