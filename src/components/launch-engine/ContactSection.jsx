import React, { useState } from "react";
import { Phone, Mail } from "lucide-react";

const INDUSTRY_OPTIONS = [
  "Legal", "Real Estate", "Epoxy Flooring", "Roofing", "HVAC", "Plumbing",
  "Electrical", "Med Spa", "Dental", "Chiropractic", "Remodeling", "Landscaping",
  "Solar", "Pest Control", "Moving", "Auto Detailing", "Restaurants",
  "Insurance", "Mortgage", "Cleaning Services",
];

export default function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", industry: "", details: "" });

  const composeEmail = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Website Launch Inquiry — ${form.industry || "General"}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nIndustry: ${form.industry}\n\nProject Details:\n${form.details}`
    );
    window.location.href = `mailto:jeremy@strategicmindsai.com?subject=${subject}&body=${body}`;
  };

  return (
    <section id="contact" className="bg-[#0a1220] py-16 md:py-24 text-white">
      <div className="max-w-3xl mx-auto px-4 md:px-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00a2ff] mb-2">READY TO EXPLORE YOUR NEXT WEBSITES?</p>
        <h2 className="text-3xl md:text-4xl font-black mb-3">Ready to Launch?</h2>
        <p className="text-white/50 max-w-lg mx-auto mb-8">
          Florida-based, with nationwide reach. Explore website concepts and plan your next launch. Call{" "}
          <a href="tel:+17722090266" className="font-bold text-[#00a2ff] hover:underline">(772) 209-0266</a>, or prepare an inquiry email below.
        </p>

        <form onSubmit={composeEmail} className="grid sm:grid-cols-2 gap-4 text-left">
          <input
            required
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-xl border border-white/15 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#00a2ff]"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="rounded-xl border border-white/15 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#00a2ff]"
          />
          <select
            required
            value={form.industry}
            onChange={(e) => setForm({ ...form, industry: e.target.value })}
            className="rounded-xl border border-white/15 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-[#00a2ff]"
          >
            <option value="" className="bg-[#0a1220]">Choose industry</option>
            {INDUSTRY_OPTIONS.map((ind) => (
              <option key={ind} value={ind} className="bg-[#0a1220]">{ind}</option>
            ))}
          </select>
          <input
            placeholder="Project details"
            value={form.details}
            onChange={(e) => setForm({ ...form, details: e.target.value })}
            className="rounded-xl border border-white/15 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#00a2ff]"
          />
          <button type="submit" className="sm:col-span-2 rounded-xl bg-[#00a2ff] py-3.5 text-sm font-bold text-white hover:bg-[#0090e0]">
            Compose Inquiry Email →
          </button>
          <p className="sm:col-span-2 text-xs text-white/30 text-center">
            Opens your email app with a draft to jeremy@strategicmindsai.com. You must press Send there.
          </p>
        </form>
      </div>
    </section>
  );
}