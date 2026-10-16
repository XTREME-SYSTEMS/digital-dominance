import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { X, Rocket, MapPin, Check, ChevronRight, Eye, ExternalLink } from "lucide-react";
import WebsitePreview from "@/components/launch-engine/WebsitePreview";
import BrandStudio from "@/components/launch-engine/BrandStudio";
import useStockTemplates from '@/components/template-studio/useStockTemplates';
import SafeImage from '@/components/ui/SafeImage';

export default function LaunchWizard({ initial, onClose }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [brand, setBrand] = useState(null);
  const [selection, setSelection] = useState({
    industry: initial?.industry || initial?.template?.niche || "",
    template: initial?.template || null,
    locations: "",
    count: 10,
  });

  const industries = useStockTemplates({is_default:true},20);
  const designs = useStockTemplates({niche:selection.industry || '__unselected__'},10);

  const STEPS = [
    { label: "Industry", desc: "Choose a business category" },
    { label: "Template", desc: "Pick a design — hover to preview the layout" },
    { label: "Brand", desc: "Generate your logo, domain, and brand colors" },
    { label: "Locations", desc: "How many sites to launch" },
    { label: "Review", desc: "Review your brand and open the studio" },
  ];

  const canAdvance = step === 0 ? !!selection.industry : step === 1 ? !!selection.template : step === 3 ? selection.count > 0 : true;

  const launch = () => {
    navigate('/admin/template-studio', { state: { selectedStockTemplateId:selection.template.id, brand } });
  };

  // Build a full-page HTML for "open in browser"
  const previewHtml = useMemo(() => {
    if (!selection.template?.content) return null;
    let html = selection.template.content;
    if (brand?.colorScheme?.accent) {
      html = html.replace(/--accent:#[0-9a-f]{3,6};/gi, `--accent:${brand.colorScheme.accent};`);
      html = html.replace(/--accent-light:#[0-9a-f]{3,6};/gi, `--accent-light:${brand.colorScheme.accentLight};`);
    }
    if (brand?.businessName) {
      html = html.replace(/<h1[^>]*>.*?<\/h1>/i, `<h1>${brand.businessName}</h1>`);
    }
    return html;
  }, [selection.template, brand]);

  const openInBrowser = () => {
    if (!previewHtml) return;
    const blob = new Blob([previewHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-[#0a1220] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#00a2ff]">
              <Rocket className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Website Launch Wizard</h3>
              <p className="text-[10px] text-white/50">{STEPS[step].label}</p>
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
        <div className="p-5 min-h-[320px]">
          <p className="text-sm text-gray-500 mb-4">{STEPS[step].desc}</p>

          {/* Step 0: Industry */}
          {step === 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-72 overflow-y-auto">
              {industries.isLoading && <p role="status" className="col-span-full text-center text-gray-400">Loading industries…</p>}
              {industries.error && <p role="alert" className="col-span-full text-center text-red-500">{industries.error.message}</p>}
              {industries.items.map((record) => {
                const ind = record.niche;
                return (
                  <button
                    key={ind}
                    onClick={() => setSelection({ ...selection, industry: ind, template:null })}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition ${selection.industry === ind ? "border-[#00a2ff] bg-[#00a2ff]/5" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <div className="h-16 w-full overflow-hidden rounded-lg bg-gray-100">
                      <SafeImage src={record.preview_image_url} alt={ind} className="h-full w-full object-cover" />
                    </div>
                    <span className={`text-xs font-bold ${selection.industry === ind ? "text-[#00a2ff]" : "text-gray-700"}`}>{ind}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 1: Template — Visual Thumbnails */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto">
              {designs.isLoading && <p role="status" className="col-span-full text-center text-gray-400">Loading designs…</p>}
              {designs.error && <p role="alert" className="col-span-full text-center text-red-500">{designs.error.message}</p>}
              {designs.items.map((t) => {
                const designName = t.name.includes(' / ') ? t.name.split(' / ').slice(1).join(' / ') : t.name;
                const active = selection.template?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelection({ ...selection, template: t })}
                    className={`overflow-hidden rounded-xl border-2 text-left transition ${active ? "border-[#00a2ff] ring-2 ring-[#00a2ff]/30" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                      <SafeImage src={t.preview_image_url} alt={t.name} className="h-full w-full object-cover transition duration-300 hover:scale-105" />
                      {active && (
                        <div className="absolute top-2 right-2 rounded-full bg-[#00a2ff] p-1">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="px-3 py-2">
                      <p className={`text-xs font-bold ${active ? "text-[#00a2ff]" : "text-gray-800"}`}>{designName}</p>
                      <p className="mt-0.5 line-clamp-1 text-[10px] text-gray-400">{t.description || ''}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 2: Brand Studio + Preview */}
          {step === 2 && (
            <div className="space-y-3">
              <BrandStudio selected={brand} onSelect={setBrand} industry={selection.industry} />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-[#00a2ff]" />
                  <p className="text-xs font-bold text-gray-700">Live preview — your brand applies in real-time</p>
                </div>
                <button
                  onClick={openInBrowser}
                  disabled={!selection.template}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open in Browser
                </button>
              </div>
              <div className="rounded-xl overflow-hidden border border-gray-200 shadow-lg" style={{ height: "380px" }}>
                <WebsitePreview industry={selection.industry} template={selection.template} brand={brand} />
              </div>
            </div>
          )}

          {/* Step 3: Locations */}
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

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-3">
              <div className="rounded-xl bg-gray-50 p-4 space-y-2">
                <Row label="Industry" value={selection.industry} />
                <Row label="Template" value={selection.template?.name?.split(' / ')[0] + ' — ' + (selection.template?.name?.split(' / ').slice(1).join(' / ') || '')} />
                <Row label="Business Name" value={brand?.businessName || '—'} />
                <Row label="Domain" value={brand?.domain?.domain || '—'} />
                <Row label="Color Scheme" value={brand?.colorScheme?.name || '—'} />
                <Row label="Location Sites" value={`${selection.count} sites`} />
                <Row label="Markets" value={selection.locations || "Nationwide"} />
              </div>
              {brand?.logo && (
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-3">
                  <img src={brand.logo.url} alt="Selected logo" className="h-12 w-12 rounded-lg border border-gray-200 bg-white object-contain p-1" />
                  <div>
                    <p className="text-xs font-bold text-gray-700">Your Logo: {brand.logo.style}</p>
                    <p className="text-[10px] text-gray-400">This will be applied to your website</p>
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-400 text-center">Open the studio to point-and-click edit, regenerate sections, and run the validation agent.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50">
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
              <Rocket className="h-4 w-4" /> Open in Studio
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