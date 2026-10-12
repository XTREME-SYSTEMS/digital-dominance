import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Rocket, MapPin, Check, ChevronRight, Eye } from "lucide-react";
import WebsitePreview from "@/components/launch-engine/WebsitePreview";
import BrandGenerator from "@/components/launch-engine/BrandGenerator";

const INDUSTRIES = [
  "Legal", "Real Estate", "Epoxy Flooring", "Roofing", "HVAC", "Plumbing",
  "Electrical", "Med Spa", "Dental", "Chiropractic", "Remodeling", "Landscaping",
  "Solar", "Pest Control", "Moving", "Auto Detailing", "Restaurants",
  "Insurance", "Mortgage", "Cleaning Services",
];

const TEMPLATES = [
  "High-Call Legal Funnel", "Luxury Real Estate", "Contractor Lead Machine",
  "HVAC Service Pro", "Med Spa Bookings", "Dental Growth",
];

export default function LaunchWizard({ initial, onClose }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [brand, setBrand] = useState(null);
  const [selection, setSelection] = useState({
    industry: initial?.industry || "",
    template: initial?.template?.badge || "",
    locations: initial?.template?.industry || "",
    count: 10,
  });

  const STEPS = [
    { label: "Industry", desc: "Choose a business category" },
    { label: "Template", desc: "Pick a conversion-focused design" },
    { label: "Preview", desc: "Your finished website preview" },
    { label: "Locations", desc: "How many sites to launch" },
    { label: "Launch", desc: "Send to Dominance Pipeline" },
  ];

  const canAdvance = step === 0 ? !!selection.industry : step === 1 ? !!selection.template : step === 3 ? selection.count > 0 : true;

  const launch = () => {
    // Pass selection to the Dominance Pipeline via navigation state
    navigate("/admin/dominance-pipeline", {
      state: {
        fromLaunchEngine: true,
        industry: selection.industry,
        template: selection.template,
        locationCount: selection.count,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between bg-[#0a1220] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#00a2ff]">
              <Rocket className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Website Launch Wizard</h3>
              <p className="text-[10px] text-white/50">Choose a Template</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-1 px-5 py-3 border-b border-gray-100">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.label}>
              <div className={`flex items-center gap-1.5 ${i <= step ? "text-[#00a2ff]" : "text-gray-300"}`}>
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${i < step ? "bg-[#00a2ff] text-white" : i === step ? "border-2 border-[#00a2ff]" : "border-2 border-gray-200"}`}>
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className="text-xs font-semibold hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-gray-200" />}
            </React.Fragment>
          ))}
        </div>

        {/* Body */}
        <div className="p-5 min-h-[280px]">
          <p className="text-sm text-gray-500 mb-4">{STEPS[step].desc}</p>

          {step === 0 && (
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {INDUSTRIES.map((ind) => (
                <button
                  key={ind}
                  onClick={() => setSelection({ ...selection, industry: ind })}
                  className={`rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition ${selection.industry === ind ? "border-[#00a2ff] bg-[#00a2ff]/5 text-[#00a2ff]" : "border-gray-200 text-gray-700 hover:border-gray-300"}`}
                >
                  {ind}
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
              {TEMPLATES.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelection({ ...selection, template: t })}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${selection.template === t ? "border-[#00a2ff] bg-[#00a2ff]/5 text-[#00a2ff]" : "border-gray-200 text-gray-700 hover:border-gray-300"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="h-4 w-4 text-[#00a2ff]" />
                <p className="text-xs font-bold text-gray-700">This is your finished website — fully designed and ready to launch.</p>
              </div>
              <BrandGenerator selected={brand} onSelect={setBrand} />
              <div className="rounded-xl overflow-hidden border border-gray-200 shadow-lg" style={{ height: "380px" }}>
                <WebsitePreview industry={selection.industry} template={selection.template} brand={brand} />
              </div>
              <p className="text-[10px] text-gray-400 text-center">Scroll inside the preview to explore the full site. Every section is built and polished.</p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">Number of Location Sites</label>
                <input
                  type="range"
                  min={1}
                  max={350}
                  value={selection.count}
                  onChange={(e) => setSelection({ ...selection, count: parseInt(e.target.value) })}
                  className="w-full accent-[#00a2ff]"
                />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-400">1</span>
                  <span className="text-lg font-black text-[#0a1220]">{selection.count} sites</span>
                  <span className="text-xs text-gray-400">350</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">Target Markets (optional)</label>
                <input
                  placeholder="e.g. Florida, Texas, California..."
                  value={selection.locations}
                  onChange={(e) => setSelection({ ...selection, locations: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#00a2ff]"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <div className="rounded-xl bg-gray-50 p-4 space-y-2">
                <Row label="Industry" value={selection.industry} />
                <Row label="Template" value={selection.template} />
                <Row label="Location Sites" value={`${selection.count} sites`} />
                <Row label="Markets" value={selection.locations || "Nationwide"} />
              </div>
              <p className="text-xs text-gray-400 text-center">This will send the selection to your Digital Dominance Pipeline for automated provisioning and programmatic launch.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-white disabled:opacity-40"
          >
            ← Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance}
              className="rounded-lg bg-[#00a2ff] px-5 py-2 text-sm font-bold text-white hover:bg-[#0090e0] disabled:opacity-40"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={launch}
              className="flex items-center gap-2 rounded-lg bg-[#00a2ff] px-5 py-2 text-sm font-bold text-white hover:bg-[#0090e0]"
            >
              <Rocket className="h-4 w-4" /> Launch to Pipeline
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-bold text-[#0a1220]">{value || "—"}</span>
    </div>
  );
}