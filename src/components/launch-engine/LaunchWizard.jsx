import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X, Rocket, MapPin, Check, ChevronRight, Eye, ExternalLink, Sparkles, Loader2, Wand2, Globe, RefreshCw } from "lucide-react";
import WebsitePreview from "@/components/launch-engine/WebsitePreview";
import InteractiveTemplateEditor from "@/components/launch-engine/InteractiveTemplateEditor";
import useStockTemplates from '@/components/template-studio/useStockTemplates';
import SafeImage from '@/components/ui/SafeImage';
import TemplateLivePreview from '@/components/launch-engine/TemplateLivePreview';
import BusinessProfileStep from '@/components/launch-engine/BusinessProfileStep';
import { OTHER_OPTION, industryKeyForLabel, industryLabel } from '@/data/industryCatalog';
import { base44 } from '@/api/base44Client';

const EMPTY_BRIEF = {
  business_name: '', phone: '', website_mode: 'none', website_url: '',
  address: '', city: '', state: '', territory_radius_miles: 25,
  industry: '', industry_other: '', sub_industry: '', sub_industry_other: '',
  services: [], custom_services: [], slogan: '', logo_url: '', photos: [], image_plan: 'own_photos',
};

export default function LaunchWizard({ initial, onClose }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [showEditor, setShowEditor] = useState(false);
  const [editedContent, setEditedContent] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generateStatus, setGenerateStatus] = useState(null);
  const [brief, setBrief] = useState({
    ...EMPTY_BRIEF,
    industry: industryKeyForLabel(initial?.industry) || industryKeyForLabel(initial?.template?.niche) || '',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [selection, setSelection] = useState({
    industry: initial?.industry || initial?.template?.niche || "",
    template: initial?.template || null,
    locations: "",
    count: 10,
  });

  const industries = useStockTemplates({ is_default: true }, 20);
  const designs = useStockTemplates({ niche: selection.industry || '__unselected__' }, 10);

  const STEPS = [
    { label: "Industry", desc: "Choose a business category" },
    { label: "Template", desc: "Pick a design — these are the exact templates from the admin studio" },
    { label: "Customize", desc: "Click to edit any section, or generate industry-specific content" },
    { label: "Locations", desc: "How many sites to launch" },
    { label: "Review", desc: "Review your selections and open the studio" },
  ];

  const briefTrade = brief.industry === OTHER_OPTION ? brief.industry_other : (industryLabel(brief.industry) || brief.industry);
  const briefSpecialty = brief.sub_industry === OTHER_OPTION ? brief.sub_industry_other : brief.sub_industry;

  const canAdvance = step === 0 ? !!selection.industry
    : step === 1 ? !!selection.template
      : step === 2 ? brief.business_name.trim().length > 1 && brief.phone.replace(/\D/g, '').length >= 7
        : step === 3 ? selection.count > 0
          : true;

  // Save the collected brief for the signed-in owner, then hand it to the studio.
  const launch = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      if (await base44.auth.isAuthenticated()) {
        await base44.entities.BrandProfile.create({
          business_name: brief.business_name.trim(),
          website_mode: brief.website_mode === 'existing' ? 'existing' : 'new',
          website_url: brief.website_mode === 'existing' ? brief.website_url.trim() : '',
          industry: brief.industry || 'other',
          industry_label: briefTrade,
          sub_industry: briefSpecialty,
          services: brief.services,
          slogan: brief.slogan.trim(),
          address: brief.address.trim(),
          city: brief.city.trim(),
          state: brief.state.trim(),
          territory_radius_miles: brief.territory_radius_miles,
          phone: brief.phone.trim(),
          logo_url: brief.logo_url,
          image_plan: brief.image_plan,
          photos: brief.photos,
          status: 'configured',
        });
      }
      navigate('/admin/template-studio', { state: { selectedStockTemplateId: selection.template?.id } });
    } catch (e) {
      setSaveError(e.message || 'Could not save your business details');
    } finally {
      setSaving(false);
    }
  };

  // The active template content (edited or original)
  const activeContent = editedContent || selection.template?.content || '';

  // Build a full-page HTML for "open in browser"
  const previewHtml = useMemo(() => activeContent || null, [activeContent]);

  const openInBrowser = () => {
    if (!previewHtml) return;
    const blob = new Blob([previewHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };

  // Generate industry-specific content and apply it to the template
  const generateContent = useCallback(async () => {
    if (!selection.template) return;
    setGenerating(true);
    setGenerateStatus('Generating industry-specific content with AI...');
    try {
      const res = await base44.functions.invoke('industryTemplateEnhancer', {
        action: 'enhance_template',
        industry: briefTrade || selection.industry,
        subIndustry: briefSpecialty,
        services: brief.services,
        businessName: brief.business_name.trim() || 'Your Business Name',
        phone: brief.phone.trim(),
        email: '',
      });
      const content = res.data?.content;
      if (!content) throw new Error('No content returned');

      // Apply generated content to the template HTML
      let html = activeContent;
      const esc = (s) => String(s || '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

      // Replace hero headline
      if (content.heroHeadline) {
        html = html.replace(/<h1[^>]*>.*?<\/h1>/i, `<h1>${esc(content.heroHeadline)}</h1>`);
      }
      // Replace hero subtext (first <p> after h1)
      if (content.heroSubtext) {
        html = html.replace(/(<\/h1>\s*<p[^>]*>)([^<]*)(<\/p>)/i, `$1${esc(content.heroSubtext)}$3`);
      }
      // Replace about text
      if (content.aboutText) {
        const aboutMatch = html.match(/<section[^>]*class="[^"]*about[^"]*"[^>]*>([\s\S]*?)<\/section>/i);
        if (aboutMatch) {
          const newAbout = aboutMatch[0].replace(/<p[^>]*>[\s\S]*?<\/p>/, `<p>${esc(content.aboutText)}</p>`);
          html = html.replace(aboutMatch[0], newAbout);
        }
      }
      // Replace FAQs
      if (content.faqs?.length) {
        const faqHtml = content.faqs.map(f => `<div class="faq-item"><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></div>`).join('');
        html = html.replace(/(<section[^>]*class="[^"]*faq[^"]*"[^>]*>)([\s\S]*?)(<\/section>)/i, `$1${faqHtml}$3`);
      }
      // Replace testimonials
      if (content.testimonials?.length) {
        const tHtml = content.testimonials.map(t => `<div class="testimonial"><p>"${esc(t.text)}"</p><cite>${esc(t.name)}</cite></div>`).join('');
        html = html.replace(/(<section[^>]*class="[^"]*testimonial[^"]*"[^>]*>)([\s\S]*?)(<\/section>)/i, `$1${tHtml}$3`);
      }

      setEditedContent(html);
      setSelection(prev => ({ ...prev, template: { ...prev.template, content: html } }));
      setGenerateStatus('✓ Content generated and applied!');
      setTimeout(() => setGenerateStatus(null), 3000);
    } catch (err) {
      console.error('Generate failed:', err);
      setGenerateStatus('Generation failed: ' + (err.message || 'Unknown error'));
    } finally {
      setGenerating(false);
    }
  }, [selection.template, selection.industry, activeContent, briefTrade, briefSpecialty, brief.services, brief.business_name, brief.phone]);

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
                    onClick={() => {
                      setSelection({ ...selection, industry: ind, template: null });
                      setBrief(prev => ({ ...prev, industry: industryKeyForLabel(ind) || prev.industry, sub_industry: '', sub_industry_other: '', services: [], custom_services: [] }));
                    }}
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

          {/* Step 1: Template — exact admin templates */}
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
                    onClick={() => setSelection({ ...selection, template: t, editedContent: null })}
                    className={`overflow-hidden rounded-xl border-2 text-left transition ${active ? "border-[#00a2ff] ring-2 ring-[#00a2ff]/30" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-gray-100 p-1.5">
                      <TemplateLivePreview template={t} className="h-full w-full" />
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
              {!designs.isLoading && designs.items.length === 0 && (
                <p className="col-span-full text-center text-gray-400 text-sm py-8">No templates found for this industry. Try another category.</p>
              )}
            </div>
          )}

          {/* Step 2: Customize — business brief, click-to-edit + generate */}
          {step === 2 && (
            <div className="space-y-4">
              <BusinessProfileStep value={brief} onChange={setBrief} />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-[#00a2ff]" />
                  <p className="text-xs font-bold text-gray-700">Live preview of your selected template</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowEditor(true)}
                    disabled={!selection.template}
                    className="flex items-center gap-1.5 rounded-lg bg-[#00a2ff] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0090e0] disabled:opacity-40"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Click to Edit
                  </button>
                  <button
                    onClick={openInBrowser}
                    disabled={!selection.template}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Open
                  </button>
                </div>
              </div>

              {/* Generate button — best generator technology */}
              <button
                onClick={generateContent}
                disabled={!selection.template || generating}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00a2ff] to-[#0066cc] px-4 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40 transition"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                {generating ? 'Generating...' : 'Generate Industry-Specific Content'}
              </button>
              {generateStatus && (
                <p className={`text-xs text-center ${generateStatus.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>{generateStatus}</p>
              )}
              <p className="text-[10px] text-gray-400 text-center">Uses AI to generate {selection.industry}-specific headlines, services, FAQs, and testimonials — then applies them to your template.</p>

              <div className="rounded-xl overflow-hidden border border-gray-200 shadow-lg" style={{ height: "340px" }}>
                <WebsitePreview industry={selection.industry} template={selection.template} overrideHtml={editedContent} />
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
                <Row label="Business" value={brief.business_name} />
                <Row label="Phone" value={brief.phone} />
                <Row label="Website" value={brief.website_mode === 'existing' ? brief.website_url : 'New site'} />
                <Row label="Address" value={[brief.address, brief.city, brief.state].filter(Boolean).join(', ')} />
                <Row label="Service radius" value={`${brief.territory_radius_miles} miles`} />
                <Row label="Industry" value={briefTrade || selection.industry} />
                <Row label="Specialty" value={briefSpecialty} />
                <Row label="Services" value={`${brief.services.length} selected`} />
                <Row label="Slogan" value={brief.slogan} />
                <Row label="Images" value={brief.image_plan === 'ai_generated' ? 'AI generated — review before publishing' : `${brief.photos.length} of your own`} />
                <Row label="Template" value={selection.template?.name || '—'} />
                <Row label="Content" value={editedContent ? 'AI-generated & customized' : 'Original template'} />
                <Row label="Location Sites" value={`${selection.count} sites`} />
                <Row label="Markets" value={selection.locations || "Nationwide"} />
              </div>
              {saveError && <p role="alert" className="text-center text-xs text-red-500">{saveError}</p>}
              <p className="text-xs text-gray-400 text-center">Open the studio to point-and-click edit, regenerate sections, and run the validation agent.</p>
            </div>
          )}
        </div>

        {/* Interactive Click-to-Edit Editor */}
        {showEditor && (
          <InteractiveTemplateEditor
            template={selection.template}
            industry={selection.industry}
            onClose={() => setShowEditor(false)}
            onSave={(content) => {
              setEditedContent(content);
              setSelection({ ...selection, template: { ...selection.template, content } });
            }}
          />
        )}

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
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-[#00a2ff] px-5 py-2 text-sm font-bold text-white hover:bg-[#0090e0] disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
              {saving ? 'Saving…' : 'Open in Studio'}
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