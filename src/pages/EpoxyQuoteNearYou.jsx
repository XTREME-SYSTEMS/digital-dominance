import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { uploadFile } from "@/lib/gateway";
import { useSettings } from "@/lib/useSettings";
import { calcEstimate, calcLeadScore, money } from "@/lib/pricing";
import { trackEvent, getDeviceType } from "@/lib/tracking";
import { captureAttribution } from "@/lib/estimatorStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, CheckCircle2, Clock, ShieldCheck, Camera, Loader2, Mail } from "lucide-react";
import BackButton from "@/components/BackButton";
import PhotoUpload from "@/components/funnel/PhotoUpload";
import { generateBidPdf } from "@/lib/bidPdf";

const CONDITIONS = [
  { key: "good", label: "Clean / bare concrete", desc: "No major issues" },
  { key: "minor", label: "Minor cracks or stains", desc: "A few spots" },
  { key: "several", label: "Several cracks", desc: "Needs repairs" },
  { key: "paint", label: "Painted concrete", desc: "Existing paint" },
  { key: "epoxy", label: "Existing coating", desc: "Needs removal" },
  { key: "major", label: "Major damage / not sure", desc: "We'll assess it" }
];

const GARAGE_SIZES = [
  { key: "one_car", label: "1-Car Garage", desc: "~220 sq ft" },
  { key: "two_car", label: "2-Car Garage", desc: "~440 sq ft" },
  { key: "three_car", label: "3-Car Garage", desc: "~660 sq ft" },
  { key: "not_sure", label: "Not sure", desc: "We'll help you figure it out" }
];

// Steps: 0 welcome · 1 contact · 2 garage · 3 condition · 4 photo · 5 submitting · 6 confirmation
export default function EpoxyQuoteNearYou() {
  const { settings, isLoading } = useSettings();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ floor_condition: [], photos: [], desired_system: "flake" });
  const [submitting, setSubmitting] = useState(false);
  const [leadId, setLeadId] = useState(null);
  const [error, setError] = useState(null);
  const sentRef = useRef(false);

  useEffect(() => { trackEvent("funnel_started", { source: "epoxyquotenearyou" }); }, []);

  const update = (patch) => setData({ ...data, ...patch });
  const next = () => { setStep(s => s + 1); window.scrollTo(0, 0); };
  const back = () => { if (step > 0) { setStep(s => s - 1); window.scrollTo(0, 0); } };

  const toggleCondition = (key) => {
    const arr = data.floor_condition || [];
    update({ floor_condition: arr.includes(key) ? arr.filter(k => k !== key) : [...arr, key] });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const est = calcEstimate(settings, { ...data, desired_system: "flake" });
      const score = calcLeadScore(settings, data);
      const lead = await base44.entities.Lead.create({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        zip: data.zip || "",
        garage_size: data.garage_size,
        square_footage: est.sqft,
        floor_condition: data.floor_condition,
        timeline: data.timeline || "AS SOON AS POSSIBLE",
        desired_system: "flake",
        photos: data.photos || [],
        estimate_mid: est.mid,
        estimate_low: est.low,
        estimate_high: est.high,
        package_options: est.packages,
        lead_score: score,
        assigned_salesperson: settings.salesperson?.name || "",
        status: "NEW ESTIMATE",
        device: getDeviceType(),
        lead_source: "epoxyquotenearyou.com",
        ...captureAttribution()
      });
      setLeadId(lead.id);
      await trackEvent("lead_created", { lead_id: lead.id, source: "epoxyquotenearyou" });
      trackEvent("book_estimate", { lead_id: lead.id });

      // Generate PDF and send quote email in background
      if (!sentRef.current) {
        sentRef.current = true;
        (async () => {
          try {
            const pdfBytes = await generateBidPdf(lead, settings, window.location.origin);
            const file = await uploadFile(new File([pdfBytes], "Garage-Floor-Estimate.pdf", { type: "application/pdf" })).catch(() => null);
            await base44.functions.invoke("sendEstimateEmail", {
              lead_id: lead.id,
              floor_image_url: (data.photos || [])[0] || undefined,
              pdf_url: file?.file_url,
              origin: window.location.origin,
            });
            trackEvent("estimate_email_sent", { lead_id: lead.id });
          } catch (err) {
            trackEvent("estimate_email_failed", { lead_id: lead.id });
            console.error("[nearyou] email send failed:", err);
          }
        })();
      }

      // Push to CRM + Sheets (non-blocking)
      base44.functions.invoke("pushLeadToHubspot", { lead_id: lead.id }).catch(() => {});
      base44.functions.invoke("syncLeadToSheet", { action: "appendLead", lead_id: lead.id }).catch(() => {});

      setStep(5);
      window.scrollTo(0, 0);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    }
    setSubmitting(false);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-stone-50"><div className="w-8 h-8 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin" /></div>;
  }

  // Confirmation step
  if (step === 5) {
    const est = calcEstimate(settings, { ...data, desired_system: "flake" });
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col">
        <header className="bg-stone-950 text-white">
          <div className="max-w-2xl mx-auto px-6 py-5 flex items-center gap-3">
            <BackButton className="text-stone-300 hover:text-white" showLabel={false} />
            <span className="text-lg font-bold tracking-tight">EpoxyQuoteNearYou.com</span>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-lg text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 mb-6">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-900">You're all set, {data.first_name}!</h1>
            <p className="mt-4 text-stone-600 leading-relaxed">
              Your quote request has been received. We're preparing your personalized estimate now —
              you'll receive it in your inbox at <strong>{data.email}</strong> within <strong>24 hours</strong>.
            </p>

            <div className="mt-8 rounded-2xl bg-stone-950 p-6 text-left">
              <div className="text-xs font-bold tracking-[0.2em] text-amber-500 mb-3">YOUR PRELIMINARY ESTIMATE</div>
              <div className="text-3xl font-semibold text-white tabular-nums">{money(est.low)} – {money(est.high)}</div>
              <p className="text-sm text-stone-400 mt-1">Based on your {GARAGE_SIZES.find(g => g.key === data.garage_size)?.label || "garage"}. Final price confirmed after specialist review.</p>
            </div>

            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-left">
              <div className="flex items-center gap-2 text-amber-700 font-semibold mb-2">
                <Mail className="h-4 w-4" /> What happens next
              </div>
              <ol className="space-y-2 text-sm text-stone-700">
                <li>1. We review your photos and garage details</li>
                <li>2. Your personalized quote is generated and emailed to you</li>
                <li>3. A specialist reaches out to schedule your installation</li>
              </ol>
            </div>

            <a href={`tel:${settings.phone}`} onClick={() => trackEvent("call_clicked", { lead_id: leadId, location: "nearyou_confirmation" })}
               className="mt-6 inline-flex h-12 px-6 items-center justify-center gap-2 rounded-xl border border-stone-300 font-semibold text-stone-900">
              Call now: {settings.phone}
            </a>
            <p className="mt-4 text-xs text-stone-500">{settings.disclaimer}</p>
          </div>
        </div>
      </div>
    );
  }

  const totalSteps = 4;
  const progressPct = step <= 4 ? (step / totalSteps) * 100 : 100;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <header className="bg-stone-950 text-white">
        <div className="max-w-2xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton className="text-stone-300 hover:text-white" showLabel={false} />
            <span className="text-lg font-bold tracking-tight">EpoxyQuoteNearYou.com</span>
          </div>
          {step > 0 && step <= 4 && (
            <button onClick={back} className="flex items-center gap-1 text-sm text-stone-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          )}
        </div>
      </header>

      {/* Progress bar */}
      {step <= 4 && (
        <div className="h-1 bg-stone-200">
          <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-lg">

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-stone-900">
                Get Your Epoxy Floor Quote
              </h1>
              <p className="mt-4 text-stone-600 leading-relaxed">
                Answer a few quick questions and upload a photo of your garage.
                We'll send you a personalized quote within <strong>24 hours</strong>.
              </p>
              <div className="mt-6 flex flex-col gap-2 text-sm text-stone-500">
                <span className="flex items-center justify-center gap-2"><Clock className="h-4 w-4 text-amber-500" /> Quote in 24 hours</span>
                <span className="flex items-center justify-center gap-2"><Camera className="h-4 w-4 text-amber-500" /> Just upload a photo</span>
                <span className="flex items-center justify-center gap-2"><ShieldCheck className="h-4 w-4 text-amber-500" /> No obligation</span>
              </div>
              <Button onClick={next} className="mt-8 h-14 px-10 text-base font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 w-full sm:w-auto">
                GET MY QUOTE <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Step 1: Contact info */}
          {step === 1 && (
            <div>
              <StepHeader n="1" title="Let's start with you" sub="We'll send your personalized quote here." />
              <div className="space-y-3 mt-6">
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="First name" value={data.first_name || ""} onChange={(e) => update({ first_name: e.target.value })} className="h-12" />
                  <Input placeholder="Last name" value={data.last_name || ""} onChange={(e) => update({ last_name: e.target.value })} className="h-12" />
                </div>
                <Input type="email" placeholder="Email" value={data.email || ""} onChange={(e) => update({ email: e.target.value })} className="h-12" />
                <Input type="tel" placeholder="Phone" value={data.phone || ""} onChange={(e) => update({ phone: e.target.value })} className="h-12" />
                <Input placeholder="ZIP code" value={data.zip || ""} onChange={(e) => update({ zip: e.target.value })} className="h-12" />
              </div>
              <Button
                onClick={next}
                disabled={!data.first_name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || "") || (data.phone || "").replace(/\D/g, "").length < 7}
                className="mt-6 h-14 w-full text-base font-bold bg-stone-950 hover:bg-stone-800"
              >
                CONTINUE <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Step 2: Garage size */}
          {step === 2 && (
            <div>
              <StepHeader n="2" title="What size is your garage?" sub="Pick the closest match — we'll confirm the exact size later." />
              <div className="space-y-2 mt-6">
                {GARAGE_SIZES.map((g) => {
                  const active = data.garage_size === g.key;
                  return (
                    <button
                      key={g.key}
                      onClick={() => update({ garage_size: g.key })}
                      className={`w-full text-left rounded-xl border p-4 flex items-center justify-between transition ${active ? "border-amber-500 bg-amber-50" : "border-stone-200 bg-white hover:border-stone-300"}`}
                    >
                      <div>
                        <div className="font-semibold text-stone-900">{g.label}</div>
                        <div className="text-sm text-stone-500">{g.desc}</div>
                      </div>
                      {active && <CheckCircle2 className="h-5 w-5 text-amber-500" />}
                    </button>
                  );
                })}
              </div>
              <Button
                onClick={next}
                disabled={!data.garage_size}
                className="mt-6 h-14 w-full text-base font-bold bg-stone-950 hover:bg-stone-800"
              >
                CONTINUE <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Step 3: Floor condition */}
          {step === 3 && (
            <div>
              <StepHeader n="3" title="What's the condition of your floor?" sub="Select all that apply. This helps us prepare the right way." />
              <div className="space-y-2 mt-6">
                {CONDITIONS.map((c) => {
                  const active = (data.floor_condition || []).includes(c.key);
                  return (
                    <button
                      key={c.key}
                      onClick={() => toggleCondition(c.key)}
                      className={`w-full text-left rounded-xl border p-4 flex items-center justify-between transition ${active ? "border-amber-500 bg-amber-50" : "border-stone-200 bg-white hover:border-stone-300"}`}
                    >
                      <div>
                        <div className="font-semibold text-stone-900">{c.label}</div>
                        <div className="text-sm text-stone-500">{c.desc}</div>
                      </div>
                      {active && <CheckCircle2 className="h-5 w-5 text-amber-500" />}
                    </button>
                  );
                })}
              </div>
              <Button
                onClick={next}
                disabled={!(data.floor_condition || []).length}
                className="mt-6 h-14 w-full text-base font-bold bg-stone-950 hover:bg-stone-800"
              >
                CONTINUE <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Step 4: Photo upload + submit */}
          {step === 4 && (
            <div>
              <StepHeader n="4" title="Upload a photo of your garage" sub="A photo helps us give you the most accurate quote. Then we'll get to work on your estimate." />
              <div className="mt-6">
                <PhotoUpload photos={data.photos || []} onChange={(urls) => update({ photos: urls })} />
              </div>
              {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="mt-6 h-14 w-full text-base font-bold bg-amber-500 hover:bg-amber-400 text-stone-950"
              >
                {submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> PREPARING YOUR QUOTE...</> : <>GET MY QUOTE <ArrowRight className="h-5 w-5" /></>}
              </Button>
              <button onClick={handleSubmit} disabled={submitting} className="mt-2 w-full h-11 text-sm font-medium text-stone-500 hover:text-stone-800">
                SKIP PHOTO & GET QUOTE
              </button>
              <p className="mt-3 text-xs text-stone-500">{settings.consent_language}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepHeader({ n, title, sub }) {
  return (
    <div>
      <div className="text-xs font-bold tracking-[0.2em] text-amber-500">STEP {n} OF 4</div>
      <h1 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight text-stone-900">{title}</h1>
      <p className="mt-2 text-stone-500">{sub}</p>
    </div>
  );
}