import React, { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";

const PAGE_OPTIONS = [
  { path: "/", label: "Home (/)" },
  { path: "/funnel", label: "Estimate Funnel (/funnel)" },
  { path: "/estimate", label: "Estimator (/estimate)" },
  { path: "/contact", label: "Contact (/contact)" },
  { path: "/how-it-works", label: "How It Works (/how-it-works)" },
  { path: "/gallery", label: "Gallery (/gallery)" },
];

const CONVERSION_EVENTS = [
  { value: "funnel_started", label: "Funnel Started" },
  { value: "book_estimate", label: "Booking Completed" },
  { value: "lead_created", label: "Lead Created" },
  { value: "contact_form_submit", label: "Contact Form Submit" },
];

const CTA_COLORS = [
  { value: "bg-amber-500", label: "Gold" },
  { value: "bg-stone-900", label: "Black" },
  { value: "bg-blue-600", label: "Blue" },
  { value: "bg-green-600", label: "Green" },
  { value: "bg-red-600", label: "Red" },
];

export default function TestBuilder({ onSave, onCancel }) {
  const [form, setForm] = useState({
    name: "", page_path: "/", traffic_split: 50, conversion_event: "funnel_started",
    variant_a_headline: "", variant_a_subheadline: "", variant_a_cta_text: "", variant_a_cta_color: "bg-amber-500",
    variant_b_headline: "", variant_b_subheadline: "", variant_b_cta_text: "", variant_b_cta_color: "bg-stone-900",
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onCancel} className="p-2 rounded-lg hover:bg-stone-100 transition">
          <ArrowLeft className="h-5 w-5 text-stone-600" />
        </button>
        <h2 className="text-lg font-black text-stone-900">Create A/B Test</h2>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
        <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wide">Test Setup</h3>
        <div>
          <label className="text-xs font-bold text-stone-600">Test Name</label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Home page headline test"
            className="w-full mt-1 rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-400 outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-stone-600">Page to Test</label>
            <select value={form.page_path} onChange={(e) => set("page_path", e.target.value)}
              className="w-full mt-1 rounded-lg border border-stone-200 px-3 py-2 text-sm bg-white focus:border-amber-400 outline-none">
              {PAGE_OPTIONS.map((p) => <option key={p.path} value={p.path}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-stone-600">Conversion Event</label>
            <select value={form.conversion_event} onChange={(e) => set("conversion_event", e.target.value)}
              className="w-full mt-1 rounded-lg border border-stone-200 px-3 py-2 text-sm bg-white focus:border-amber-400 outline-none">
              {CONVERSION_EVENTS.map((ev) => <option key={ev.value} value={ev.value}>{ev.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-stone-600">Traffic Split: {form.traffic_split}% A / {100 - form.traffic_split}% B</label>
          <input type="range" min="10" max="90" step="5" value={form.traffic_split}
            onChange={(e) => set("traffic_split", Number(e.target.value))} className="w-full mt-2 accent-amber-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {["a", "b"].map((v) => {
          const label = v === "a" ? "Variant A (Control)" : "Variant B (Challenger)";
          const borderClass = v === "a" ? "border-stone-200 bg-white" : "border-amber-300 bg-amber-50/30";
          const headingClass = v === "a" ? "text-stone-700" : "text-amber-700";
          return (
            <div key={v} className={`rounded-xl border p-4 space-y-3 ${borderClass}`}>
              <h3 className={`text-sm font-bold uppercase tracking-wide ${headingClass}`}>{label}</h3>
              <p className="text-xs text-stone-400">Leave fields blank to use the page's default content.</p>
              <div>
                <label className="text-xs font-bold text-stone-600">Headline Override</label>
                <input value={form[`variant_${v}_headline`]} onChange={(e) => set(`variant_${v}_headline`, e.target.value)}
                  placeholder="e.g. Get Your Instant Epoxy Estimate"
                  className="w-full mt-1 rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-400 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-600">Subheadline Override</label>
                <input value={form[`variant_${v}_subheadline`]} onChange={(e) => set(`variant_${v}_subheadline`, e.target.value)}
                  placeholder="e.g. See your price in 60 seconds"
                  className="w-full mt-1 rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-400 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-600">CTA Button Text</label>
                <input value={form[`variant_${v}_cta_text`]} onChange={(e) => set(`variant_${v}_cta_text`, e.target.value)}
                  placeholder="e.g. Get My Estimate"
                  className="w-full mt-1 rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-400 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-600">CTA Button Color</label>
                <select value={form[`variant_${v}_cta_color`]} onChange={(e) => set(`variant_${v}_cta_color`, e.target.value)}
                  className="w-full mt-1 rounded-lg border border-stone-200 px-3 py-2 text-sm bg-white focus:border-amber-400 outline-none">
                  {CTA_COLORS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={() => form.name.trim() && onSave(form)} disabled={!form.name.trim()}
        className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-stone-950 hover:bg-amber-400 transition disabled:opacity-50">
        <Save className="h-4 w-4" /> Create Test
      </button>
    </div>
  );
}