import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useSettings } from "@/lib/useSettings";
import { calcEstimate, calcLeadScore } from "@/lib/pricing";
import { trackEvent, getDeviceType, linkLeadAttribution } from "@/lib/tracking";
import { loadDraft, saveDraft, clearDraft, captureAttribution } from "@/lib/estimatorStore";
import AddressStep from "@/components/estimator/AddressStep";
import SizeStep from "@/components/estimator/SizeStep";
import ConditionStep from "@/components/estimator/ConditionStep";
import SystemStep from "@/components/estimator/SystemStep";
import TimelineStep from "@/components/estimator/TimelineStep";
import PhotoStep from "@/components/estimator/PhotoStep";
import ContactStep from "@/components/estimator/ContactStep";

const EVENTS = [
  "address_completed",
  "garage_size_selected",
  "condition_selected",
  "system_selected",
  "timeline_selected",
  "photos_uploaded"
];

export default function Estimator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { settings, isLoading } = useSettings();
  const [step, setStep] = useState(0);
  const [data, setData] = useState(() => ({ ...loadDraft(), ...prefillFromQuery(searchParams) }));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    trackEvent("estimator_started");
  }, []);

  const update = (patch) => {
    const next = { ...data, ...patch };
    setData(next);
    saveDraft(next);
  };

  const next = () => {
    trackEvent(EVENTS[step], { step });
    setStep((s) => s + 1);
    window.scrollTo(0, 0);
  };

  const back = () => {
    if (step === 0) return navigate("/");
    setStep((s) => s - 1);
    window.scrollTo(0, 0);
  };

  const submit = async () => {
    setSubmitting(true);
    const est = calcEstimate(settings, data);
    const score = calcLeadScore(settings, data);
    const attribution = captureAttribution();
    const lead = await base44.entities.Lead.create({
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip,
      garage_size: data.garage_size,
      custom_length: data.custom_length,
      custom_width: data.custom_width,
      square_footage: est.sqft,
      floor_condition: data.floor_condition || [],
      desired_system: data.desired_system,
      timeline: data.timeline,
      photos: data.photos || [],
      estimate_mid: est.mid,
      estimate_low: est.low,
      estimate_high: est.high,
      package_options: est.packages,
      lead_score: score,
      assigned_salesperson: settings.salesperson?.name || "",
      status: "NEW ESTIMATE",
      appointment_status: "none",
      device: getDeviceType(),
      ...attribution
    });
    await linkLeadAttribution(lead.id, { source: "estimator" });
    clearDraft();
    navigate(`/results/${lead.id}`);
  };

  useEffect(() => {
    if (step === 6) trackEvent("contact_gate_viewed");
  }, [step]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin" />
      </div>
    );
  }

  const props = { data, update, settings, onNext: next, onBack: back };

  if (step === 0) return <AddressStep {...props} />;
  if (step === 1) return <SizeStep {...props} />;
  if (step === 2) return <ConditionStep {...props} />;
  if (step === 3) return <SystemStep {...props} />;
  if (step === 4) return <TimelineStep {...props} />;
  if (step === 5) return <PhotoStep {...props} />;
  return <ContactStep {...props} submitting={submitting} onSubmit={submit} />;
}

function prefillFromQuery(sp) {
  const pre = {};
  const size = sp.get("size");
  if (size) pre.garage_size = size;
  return pre;
}