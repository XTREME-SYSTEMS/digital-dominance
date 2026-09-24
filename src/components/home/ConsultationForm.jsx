import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { captureAttribution } from "@/lib/estimatorStore";
import { getDeviceType, trackEvent } from "@/lib/tracking";
import { Link } from "react-router-dom";

export default function ConsultationForm({ settings }) {
  const [form, setForm] = useState({ first_name: "", email: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const lead = await base44.entities.Lead.create({
        first_name: form.first_name.trim(), email: form.email.trim(), phone: form.phone.trim(),
        lead_type: "homeowner", status: "NEW ESTIMATE", notes: "Homepage callback request — estimate not yet calculated; contact requested.",
        device: getDeviceType(), ...captureAttribution()
      });
      setSent(true);
      trackEvent("lead_created", { lead_id: lead.id, source: "homepage_callback" });
      base44.functions.invoke("pushLeadToHubspot", { lead_id: lead.id }).catch(() => {});
      base44.functions.invoke("syncLeadToSheet", { action: "appendLead", lead_id: lead.id }).catch(() => {});
    } catch (err) {
      setError("We couldn't save your request. Please try again or call us directly.");
    } finally { setBusy(false); }
  }
  return (
    <section className="bg-stone-50 border-b border-stone-200 px-6 py-10" aria-labelledby="callback-heading">
      <div className="max-w-6xl mx-auto md:flex md:items-center md:gap-12">
        <div className="md:w-1/2 mb-6 md:mb-0">
          <h2 id="callback-heading" className="text-2xl md:text-3xl font-heading font-bold text-stone-900">Not ready to price it yourself?</h2>
          <p className="mt-2 text-stone-600">Leave your details and a floor specialist can follow up about your project. No obligation.</p>
        </div>
        <div className="md:w-1/2">
          {sent ? <div role="status" className="rounded-xl border border-green-200 bg-white p-5 text-stone-900">
            <p className="font-semibold">Request received. We have your contact details.</p>
            <p className="mt-1 text-sm text-stone-600">Want a price range now? <Link className="underline font-semibold" to="/funnel">Get your free estimate</Link>.</p>
          </div> : <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-stone-700">First name<input required maxLength={80} autoComplete="given-name" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} className="mt-1 w-full h-11 rounded-lg border border-stone-300 bg-white px-3 text-stone-900" /></label>
            <label className="text-sm font-semibold text-stone-700">Phone<input required type="tel" minLength={7} maxLength={30} autoComplete="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1 w-full h-11 rounded-lg border border-stone-300 bg-white px-3 text-stone-900" /></label>
            <label className="text-sm font-semibold text-stone-700 sm:col-span-2">Email<input required type="email" maxLength={254} autoComplete="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1 w-full h-11 rounded-lg border border-stone-300 bg-white px-3 text-stone-900" /></label>
            <p className="sm:col-span-2 text-xs text-stone-600">{settings.consent_language}</p>
            {error && <p role="alert" className="sm:col-span-2 text-sm text-red-700">{error} <a className="underline" href={`tel:${settings.phone}`}>Call {settings.phone}</a>.</p>}
            <button disabled={busy} className="sm:col-span-2 h-12 rounded-xl bg-amber-500 text-stone-950 font-bold disabled:opacity-50">{busy ? "Sending your request…" : "Ask a specialist to contact me"}</button>
          </form>}
        </div>
      </div>
    </section>
  );
}