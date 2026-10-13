import React, { useState } from "react";
import { Phone, Mail, Building2, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

const INDUSTRY_OPTIONS = [
  "Legal", "Real Estate", "Epoxy Flooring", "Roofing", "HVAC", "Plumbing",
  "Electrical", "Med Spa", "Dental", "Chiropractic", "Remodeling", "Landscaping",
  "Solar", "Pest Control", "Moving", "Auto Detailing", "Restaurants",
  "Insurance", "Mortgage", "Cleaning Services",
];

const PRIMARY_PHONE = "(866) 571-1174";
const BACKUP_PHONE = "(772) 209-0266";
const EMAIL = "jeremy@strategicmindsai.com";

export default function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", industry: "", details: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitToCRM = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Save to CRM (Lead entity) for automated follow-up
      await base44.entities.Lead.create({
        form_type: "contact",
        name: form.name,
        email: form.email,
        service: form.industry,
        message: form.details,
        description: `Website Launch Inquiry — ${form.industry || "General"}`,
      });
      setSubmitted(true);
      setForm({ name: "", email: "", industry: "", details: "" });
    } catch (err) {
      // Fallback to email compose
      const subject = encodeURIComponent(`Website Launch Inquiry — ${form.industry || "General"}`);
      const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\nIndustry: ${form.industry}\n\nProject Details:\n${form.details}`);
      window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="bg-[#0a1220] py-16 md:py-24 text-white">
      <div className="max-w-3xl mx-auto px-4 md:px-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00a2ff] mb-2">READY TO EXPLORE YOUR NEXT WEBSITES?</p>
        <h2 className="text-3xl md:text-4xl font-black mb-3">Ready to Launch?</h2>
        <p className="text-white/50 max-w-lg mx-auto mb-6">
          Florida-based, with nationwide reach. Explore website concepts and plan your next launch.
        </p>

        {/* Contact Info Cards */}
        <div className="mb-8 grid sm:grid-cols-3 gap-3">
          <a href={`tel:+18665711174`} className="flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-green-400/50 hover:shadow-[0_0_16px_-2px_rgba(34,197,94,0.4)] transition-all duration-300">
            <Phone className="h-5 w-5 text-green-400" />
            <span className="text-[10px] uppercase tracking-wider text-white/40">Primary</span>
            <span className="text-sm font-bold text-white">{PRIMARY_PHONE}</span>
          </a>
          <a href={`tel:+17722090266`} className="flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-green-400/50 hover:shadow-[0_0_16px_-2px_rgba(34,197,94,0.4)] transition-all duration-300">
            <Phone className="h-5 w-5 text-white/50" />
            <span className="text-[10px] uppercase tracking-wider text-white/40">Backup</span>
            <span className="text-sm font-bold text-white">{BACKUP_PHONE}</span>
          </a>
          <a href={`mailto:${EMAIL}`} className="flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-green-400/50 hover:shadow-[0_0_16px_-2px_rgba(34,197,94,0.4)] transition-all duration-300">
            <Mail className="h-5 w-5 text-[#00a2ff]" />
            <span className="text-[10px] uppercase tracking-wider text-white/40">Email</span>
            <span className="text-sm font-bold text-white truncate w-full">{EMAIL}</span>
          </a>
        </div>

        {submitted ? (
          <div className="rounded-2xl border border-green-400/30 bg-green-500/10 p-6">
            <p className="text-sm font-bold text-green-400 mb-1">Inquiry Received!</p>
            <p className="text-xs text-white/60">Our AI CRM has logged your inquiry. Eden Skye will follow up with you every 3 days with branded updates and offers.</p>
          </div>
        ) : (
          <form onSubmit={submitToCRM} className="grid sm:grid-cols-2 gap-4 text-left">
            <input
              required
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-xl border border-white/15 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/60 outline-none focus:border-[#00a2ff]"
            />
            <input
              required
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-xl border border-white/15 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/60 outline-none focus:border-[#00a2ff]"
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
              className="rounded-xl border border-white/15 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/60 outline-none focus:border-[#00a2ff]"
            />
            <button type="submit" disabled={submitting} className="sm:col-span-2 rounded-xl bg-[#00a2ff] py-3.5 text-sm font-bold text-white hover:bg-[#0090e0] disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? "Submitting..." : <>Submit to AI CRM <ArrowRight className="h-4 w-4" /></>}
            </button>
            <p className="sm:col-span-2 text-xs text-white/40 text-center">
              Your inquiry enters our AI-optimized CRM. Eden Skye follows up every 3 days with branded emails and enticing offers.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}