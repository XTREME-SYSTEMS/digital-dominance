import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { uploadFile } from "@/lib/gateway";
import { useSettings } from "@/lib/useSettings";
import { calcEstimate, calcLeadScore, money } from "@/lib/pricing";
import { trackEvent, getDeviceType } from "@/lib/tracking";
import { captureAttribution } from "@/lib/estimatorStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, CheckCircle2, Phone, Clock, ShieldCheck } from "lucide-react";
import BackButton from "@/components/BackButton";
import ScrapeProgress from "@/components/funnel/ScrapeProgress";
import FloorVisualizer from "@/components/funnel/FloorVisualizer";
import ConceptBeforeAfter from "@/components/funnel/ConceptBeforeAfter";
import Logo, { XTREME_AI_ICON_URL } from "@/components/Logo";
import { Image } from "@/components/ui/image";
import { generateBidPdf } from "@/lib/bidPdf";

const CONDITIONS = [
  { key: "good", label: "Clean / bare concrete", desc: "No major issues" },
  { key: "minor", label: "Minor cracks or stains", desc: "A few spots" },
  { key: "several", label: "Several cracks", desc: "Needs repairs" },
  { key: "paint", label: "Painted concrete", desc: "Existing paint" },
  { key: "epoxy", label: "Existing coating", desc: "Needs removal" },
  { key: "major", label: "Major damage / not sure", desc: "We'll assess it" }
];

// Steps: 0 welcome · 1 address · 2 condition · 3 visualizer · 4 contact · 5 scrape · 6 results
const STEP_EVENTS = ["funnel_started", "address_entered", "condition_selected", "color_selected", "contact_entered"];

export default function Funnel() {
  const navigate = useNavigate();
  const { settings, isLoading } = useSettings();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ floor_condition: [], photos: [] });
  const [leadId, setLeadId] = useState(null);
  const [detectedSqft, setDetectedSqft] = useState(null);
  const [estimatedSize, setEstimatedSize] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [floorImage, setFloorImage] = useState(null);
  const [conceptImage, setConceptImage] = useState(null);
  const sentRef = React.useRef(false);
  const lookupPromise = React.useRef(null);

  useEffect(() => { trackEvent("funnel_started"); }, []);

  // Set the floor image when we reach the results step — used for the email.
  useEffect(() => {
    if (step === 6) setFloorImage(conceptImage || (data.photos || [])[0] || "");
  }, [step]);

  // Once the visualizer has produced the floor image (step 7), email the
  // branded estimate to the customer from the connected Gmail account.
  useEffect(() => {
    if (step === 6 && leadId && floorImage !== null && !sentRef.current) {
      sentRef.current = true;
      (async () => {
        try {
          const lead = await base44.entities.Lead.get(leadId);
          const pdfBytes = generateBidPdf(lead, settings, window.location.origin);
          const file = await uploadFile(new File([pdfBytes], "Garage-Floor-Estimate.pdf", { type: "application/pdf" })).catch(() => null);
          await base44.functions.invoke("sendEstimateEmail", {
            lead_id: leadId,
            floor_image_url: floorImage || undefined,
            pdf_url: file?.file_url,
            origin: window.location.origin,
          });
          trackEvent("estimate_email_sent", { lead_id: leadId });
        } catch {
          trackEvent("estimate_email_failed", { lead_id: leadId });
        }
      })();
    }
  }, [step, leadId, floorImage]);

  const update = (patch) => setData({ ...data, ...patch });
  const next = () => {
    trackEvent(STEP_EVENTS[step] || "funnel_step", { step });
    setStep((s) => s + 1);
    window.scrollTo(0, 0);
  };
  const back = () => { if (step > 0) { setStep((s) => s - 1); window.scrollTo(0, 0); } };

  const toggleCondition = (key) => {
    const arr = data.floor_condition || [];
    update({ floor_condition: arr.includes(key) ? arr.filter((k) => k !== key) : [...arr, key] });
  };

  // Look up a preliminary garage-size estimate from available property data.
  // Cache the result per address for consistency within this browser.
  const lookupGarageSqft = async (fullAddress) => {
    const cacheKey = `garage_sqft:${fullAddress.toLowerCase().replace(/\s+/g, " ").trim()}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const previous = JSON.parse(cached);
        if (previous.source !== "ai_property_records") return previous;
      }
    } catch {}

    const cache = (result) => {
      try { localStorage.setItem(cacheKey, JSON.stringify(result)); } catch {}
      return result;
    };

    let result = { sqft: 440, source: "fallback_size", confidence: "low" };

    // Primary — deterministic property records lookup (RentCast + OSM + Estately
    // cross-validation, server-side cached so the same address always returns
    // the same sqft across all users and devices).
    try {
      const res = await base44.functions.invoke("propertyLookup", { address: fullAddress, fallback_sqft: 440 });
      const property = res.data || {};
      const sqft = Number(property.sqft);
      if (sqft > 0 && property.source && property.source !== "fallback_size") {
        return cache({
          sqft: Math.min(Math.max(Math.round(sqft), 200), 1200),
          source: property.source,
          confidence: property.confidence || "medium",
          consensus_method: property.consensus_method || null,
          garage_spaces: property.garage_spaces ?? null,
          interior_sqft: property.interior_sqft ?? null
        });
      }
    } catch {
      // fall through to secondary
    }
    return cache(result);
  };

  // Start the records lookup as soon as we have a full address (step 1) so it
  // runs in the background while the user answers the remaining questions — by
  // the time they reach the "looking up" screen the real data is usually back.
  const startLookup = () => {
    const fullAddress = `${data.address}, ${data.city}, ${data.state} ${data.zip}`;
    lookupPromise.current = lookupGarageSqft(fullAddress);
  };

  // Contact submit: kick off the real property lookup, then run the scrape
  // animation. The lead is NOT created here — we wait for the lookup so the
  // estimate uses the actual scraped square footage, not a guess.
  const submitContact = () => {
    setSubmitting(true);
    if (!lookupPromise.current) {
      const fullAddress = `${data.address}, ${data.city}, ${data.state} ${data.zip}`;
      lookupPromise.current = lookupGarageSqft(fullAddress);
    }
    trackEvent("contact_entered", { step: 4 });
    setSubmitting(false);
    setStep(5);
    window.scrollTo(0, 0);
  };

  // After the scrape animation, resolve the lookup, build the estimate from
  // the real square footage, and create the lead with all questionnaire answers.
  const onScrapeComplete = async (result) => {
    if (leadId) { setStep(6); return; }
    const fallback = 440;
    result = result && Number(result.sqft) ? result : { sqft: fallback };
    const sqft = Number(result.sqft) || fallback;
    setDetectedSqft(sqft);
    setEstimatedSize(!result.source || result.source === "fallback_size");
    
    const est = calcEstimate(settings, { ...data, square_footage: sqft, desired_system: data.desired_system || "flake" });
    const score = calcLeadScore(settings, data);
    const lead = await base44.entities.Lead.create({
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip,
      square_footage: sqft,
      sqft_source: result.source || null,
      sqft_confidence: result.confidence || null,
      floor_condition: data.floor_condition,
      timeline: data.timeline || "AS SOON AS POSSIBLE",
      desired_system: data.desired_system || "flake",
      flake_color: data.flake_color || "",
      flake_color_name: data.flake_color_name || "",
      flake_color_hex: data.flake_color_hex || "",
      photos: data.photos || [],
      concept_image: conceptImage || "",
      estimate_mid: est.mid,
      estimate_low: est.low,
      estimate_high: est.high,
      package_options: est.packages,
      lead_score: score,
      assigned_salesperson: settings.salesperson?.name || "",
      status: "NEW ESTIMATE",
      device: getDeviceType(),
      notes: data.flake_color
        ? `Selected color: ${data.flake_color}${data.flake_color_name ? ` (${data.flake_color_name})` : ""}`
        : "",
      ...captureAttribution()
    });
    setLeadId(lead.id);
    await trackEvent("lead_created", { lead_id: lead.id });
    // Push to HubSpot CRM immediately (does not block the funnel).
    base44.functions.invoke("pushLeadToHubspot", { lead_id: lead.id }).catch(() => {});
    // Sync to Google Sheets (auto-creates the sheet on first call, does not block the funnel).
    base44.functions.invoke("syncLeadToSheet", { action: "appendLead", lead_id: lead.id }).catch(() => {});
    trackEvent("scrape_complete", { lead_id: lead.id, sqft, source: result.source, confidence: result.confidence });
    setStep(6);
    window.scrollTo(0, 0);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-stone-50"><div className="w-8 h-8 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin" /></div>;
  }

  // Scrape animation step
  if (step === 5) {
    return <ScrapeProgress address={`${data.address}, ${data.city}, ${data.state} ${data.zip}`} lookup={lookupPromise.current} onComplete={onScrapeComplete} />;
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
            <Logo />
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
              <div className="inline-flex items-center justify-center mb-6" style={{ width: 128, height: 128 }}>
                <Image src={XTREME_AI_ICON_URL} alt="Xtreme AI Systems — Intelligence For Growth" className="w-full h-full" fittingType="fit" />
              </div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-stone-900">
                Get Your Garage Floor Estimate
              </h1>
              <p className="mt-4 text-stone-600 leading-relaxed">
                Answer a few quick questions for a preliminary price range. You can also explore colors and preview what your new floor could look like.
              </p>
              <div className="mt-6 flex flex-col gap-2 text-sm text-stone-500">
                <span className="flex items-center justify-center gap-2"><Clock className="h-4 w-4 text-amber-500" /> Takes about 60 seconds</span>
                <span className="flex items-center justify-center gap-2"><ShieldCheck className="h-4 w-4 text-amber-500" /> No obligation</span>
              </div>
              <Button onClick={next} className="mt-8 h-14 px-10 text-base font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 w-full sm:w-auto">
                START MY ESTIMATE <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Step 1: Address */}
          {step === 1 && (
            <div>
              <StepHeader n="1" title="What's your property address?" sub="We'll check public records for your garage size. If it isn't available, we'll show a clearly labeled preliminary range." />
              <div className="space-y-3 mt-6">
                <Input placeholder="Street address" value={data.address || ""} onChange={(e) => update({ address: e.target.value })} className="h-12" />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="City" value={data.city || ""} onChange={(e) => update({ city: e.target.value })} className="h-12" />
                  <Input placeholder="State" value={data.state || ""} onChange={(e) => update({ state: e.target.value })} className="h-12" />
                </div>
                <Input placeholder="ZIP code" value={data.zip || ""} onChange={(e) => update({ zip: e.target.value })} className="h-12" />
              </div>
              <Button
                onClick={() => { startLookup(); next(); }}
                disabled={!data.address || !data.city || !data.state || !data.zip}
                className="mt-6 h-14 w-full text-base font-bold bg-stone-950 hover:bg-stone-800"
              >
                CONTINUE <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Step 2: Floor condition */}
          {step === 2 && (
            <div>
              <StepHeader n="2" title="What's the condition of your floor?" sub="Select all that apply. This helps us prepare the right way." />
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

          {/* Step 3: Visualizer — upload photo + pick color + see before/after */}
          {step === 3 && (
            <div>
              <StepHeader n="3" title="Visualize your new floor" sub="Upload a photo of your garage, then pick a color to see your transformation instantly." />
              <div className="mt-6">
                <FloorVisualizer
                  initialPhoto={(data.photos || [])[0]}
                  initialColor={data.flake_color ? { code: data.flake_color, color_name: data.flake_color_name, hex: data.flake_color_hex, system: data.desired_system } : null}
                  onPhotoChange={(url) => update({ photos: url ? [url] : [] })}
                  onColorSelected={(c) => update({ flake_color: c.code, flake_color_name: c.color_name, flake_color_hex: c.hex, desired_system: c.system })}
                  onConceptGenerated={(url) => setConceptImage(url)}
                />
              </div>
              <div className="mt-6 space-y-2">
                <Button
                  onClick={next}
                  disabled={!data.flake_color}
                  className="h-14 w-full text-base font-bold bg-stone-950 hover:bg-stone-800"
                >
                  CONTINUE <ArrowRight className="h-5 w-5" />
                </Button>
                <button onClick={next} className="w-full h-11 text-sm font-medium text-stone-500 hover:text-stone-800">
                  SKIP FOR NOW
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Contact info */}
          {step === 4 && (
            <div>
              <StepHeader n="4" title="Last step — where do we send your estimate?" sub="We'll look up your garage and prepare your personalized quote." />
              <div className="space-y-3 mt-6">
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="First name" value={data.first_name || ""} onChange={(e) => update({ first_name: e.target.value })} className="h-12" />
                  <Input placeholder="Last name" value={data.last_name || ""} onChange={(e) => update({ last_name: e.target.value })} className="h-12" />
                </div>
                <Input type="email" placeholder="Email" value={data.email || ""} onChange={(e) => update({ email: e.target.value })} className="h-12" />
                <Input type="tel" placeholder="Phone" value={data.phone || ""} onChange={(e) => update({ phone: e.target.value })} className="h-12" />
              </div>
              <p className="mt-3 text-xs text-stone-500">{settings.consent_language}</p>
              <Button
                onClick={submitContact}
                disabled={!data.first_name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || "") || (data.phone || "").replace(/\D/g, "").length < 7 || submitting}
                className="mt-4 h-14 w-full text-base font-bold bg-amber-500 hover:bg-amber-400 text-stone-950"
              >
                LOOK UP MY GARAGE <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Step 6: Results */}
          {step === 6 && (
            <div className="space-y-8">
              {/* Detected sq ft */}
              <div className="rounded-2xl bg-stone-950 p-7 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20 mb-3">
                  <CheckCircle2 className="h-6 w-6 text-green-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">{estimatedSize ? "Your preliminary garage estimate" : "Your garage has been identified"}</h2>
                <p className="text-sm text-stone-400 mt-1">{data.address}, {data.city}, {data.state}</p>
                <div className="mt-5">
                  <div className="text-xs font-bold tracking-[0.2em] text-amber-500">{estimatedSize ? "ASSUMED GARAGE SIZE" : "ESTIMATED SIZE FROM PROPERTY DATA"}</div>
                  <div className="mt-2 text-5xl font-semibold text-white tabular-nums">{detectedSqft?.toLocaleString()}</div>
                  <div className="text-sm text-stone-400">square feet{estimatedSize ? " · based on a typical two-car garage; confirm with a specialist" : ""}</div>
                </div>
                <div className="mt-5 pt-5 border-t border-stone-800">
                  <div className="text-xs font-bold tracking-[0.2em] text-amber-500">ESTIMATED PROJECT RANGE</div>
                  <div className="mt-2 text-3xl font-semibold text-white tabular-nums">
                    {(() => { const e = calcEstimate(settings, { ...data, square_footage: detectedSqft, desired_system: data.desired_system || "flake" }); return `${money(e.low)} – ${money(e.high)}`; })()}
                  </div>
                </div>
              </div>

              {/* Your floor, visualized with your chosen color */}
              {(data.photos || [])[0] && conceptImage && (
                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">See your garage transformed</h3>
                  <ConceptBeforeAfter
                    beforeUrl={(data.photos || [])[0]}
                    afterUrl={conceptImage}
                    colorName={data.flake_color_name}
                    hex={data.flake_color_hex}
                  />
                </div>
              )}

              {/* Selected color confirmation */}
              {data.flake_color && (
                <div className="rounded-2xl border border-stone-200 bg-white p-6">
                  <div className="text-xs font-bold tracking-[0.2em] text-amber-600">YOUR SELECTED COLOR</div>
                  <div className="mt-2 text-lg font-semibold text-stone-900">{data.flake_color_name}</div>
                  <div className="text-sm text-stone-500">{data.flake_color}</div>
                </div>
              )}

              {/* Xtreme Polishing Systems message */}
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-7 text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 mb-4">
                  <Phone className="h-7 w-7 text-stone-950" />
                </div>
                <h2 className="text-2xl font-semibold text-stone-900">You're all set, {data.first_name}!</h2>
                <p className="mt-3 text-stone-700 leading-relaxed max-w-md mx-auto">
                  A specialist from <strong>Xtreme Polishing Systems</strong> will be in contact with you within <strong>24 hours</strong> to review your garage, confirm your color selection, and schedule your installation.
                </p>
                <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
                  <a href={`tel:${settings.phone}`} onClick={() => trackEvent("call_clicked", { lead_id: leadId, location: "funnel_results" })} className="inline-flex h-12 px-6 items-center justify-center gap-2 rounded-xl border border-stone-300 font-semibold text-stone-900">
                    <Phone className="h-4 w-4" /> Call now: {settings.phone}
                  </a>
                  <button onClick={() => navigate(`/results/${leadId}`)} className="inline-flex h-12 px-6 items-center justify-center rounded-xl bg-stone-950 text-white font-semibold">
                    View full estimate
                  </button>
                </div>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed">{settings.disclaimer}</p>
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
      <div className="text-xs font-bold tracking-[0.2em] text-amber-500">STEP {n} OF 5</div>
      <h1 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight text-stone-900">{title}</h1>
      <p className="mt-2 text-stone-500">{sub}</p>
    </div>
  );
}