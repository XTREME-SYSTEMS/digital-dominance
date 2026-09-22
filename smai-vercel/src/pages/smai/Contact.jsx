import React, { useState } from "react";
import { submitLead } from "@/lib/smaiSupabase";
import { Brain, Mail, Phone, MapPin, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import SmaiNav from "@/components/smai/SmaiNav";
import SmaiFooter from "@/components/smai/SmaiFooter";

const SERVICE_OPTIONS = ["AI Consulting", "AI Marketing", "AI Software Creation", "Not Sure Yet"];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", company: "", service: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setError("Please fill in your name, email, and message.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const [firstName, ...rest] = form.name.split(" ");
      await submitLead({
        first_name: firstName,
        last_name: rest.join(" "),
        email: form.email,
        company: form.company,
        service_interest: form.service,
        message: form.message,
      });
      setSubmitted(true);
    } catch (err) {
      setError("Something went wrong. Please email us directly at jeremy@strategicmindsai.com.");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-stone-950">
      <SmaiNav />

      {/* Header */}
      <section className="border-b border-stone-800 bg-gradient-to-b from-stone-900/50 to-stone-950">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
          <p className="font-mono text-[10px] tracking-[0.3em] text-cyan-400 uppercase mb-3">— GET IN TOUCH —</p>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Let's Talk</h1>
          <p className="text-lg text-stone-400 max-w-2xl">Book a free strategy call. We'll audit your business and show you exactly where AI can drive the biggest impact.</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Form */}
          <div className="lg:col-span-3">
            {submitted ? (
              <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/5 p-10 text-center">
                <CheckCircle2 className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Thank You!</h3>
                <p className="text-stone-400 mb-6">We've received your message and will reach out within 24 hours to schedule your strategy call.</p>
                <button onClick={() => { setSubmitted(false); setForm({ name: "", email: "", company: "", service: "", message: "" }); }} className="text-cyan-400 font-bold hover:text-cyan-300 transition">Send another message</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="rounded-2xl border border-stone-800 bg-stone-900/50 p-7 md:p-8 space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Book Your Free Strategy Call</h3>
                  <p className="text-sm text-stone-500">Tell us about your business and what you're looking to achieve.</p>
                </div>

                {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold tracking-wide text-stone-500 uppercase mb-1.5 block">Name *</label>
                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full h-11 rounded-lg border border-stone-700 bg-stone-950 px-4 text-sm text-white outline-none focus:border-cyan-400 transition" placeholder="Jane Smith" />
                  </div>
                  <div>
                    <label className="text-xs font-bold tracking-wide text-stone-500 uppercase mb-1.5 block">Email *</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full h-11 rounded-lg border border-stone-700 bg-stone-950 px-4 text-sm text-white outline-none focus:border-cyan-400 transition" placeholder="jane@company.com" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold tracking-wide text-stone-500 uppercase mb-1.5 block">Company</label>
                  <input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full h-11 rounded-lg border border-stone-700 bg-stone-950 px-4 text-sm text-white outline-none focus:border-cyan-400 transition" placeholder="Acme Inc." />
                </div>

                <div>
                  <label className="text-xs font-bold tracking-wide text-stone-500 uppercase mb-2 block">What do you need?</label>
                  <div className="flex flex-wrap gap-2">
                    {SERVICE_OPTIONS.map((s) => (
                      <button key={s} type="button" onClick={() => setForm({ ...form, service: s })} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${form.service === s ? "electric-bg text-stone-950" : "bg-stone-800 text-stone-400 hover:text-white border border-stone-700"}`}>{s}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold tracking-wide text-stone-500 uppercase mb-1.5 block">Message *</label>
                  <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} className="w-full rounded-lg border border-stone-700 bg-stone-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 transition resize-none" placeholder="Tell us about your business, goals, and what you'd like to achieve with AI..." />
                </div>

                <button type="submit" disabled={submitting} className="w-full h-12 rounded-xl electric-bg text-stone-950 font-bold hover:opacity-90 transition shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-2 electric-glow">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <>Send Message <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            )}
          </div>

          {/* Contact info */}
          <div className="lg:col-span-2 space-y-5">
            <div className="rounded-2xl border border-stone-800 bg-stone-900/50 p-7">
              <h3 className="text-base font-bold text-white mb-5">Contact Info</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-xs text-stone-500 uppercase tracking-wide mb-0.5">Email</div>
                    <a href="mailto:jeremy@strategicmindsai.com" className="text-sm text-white hover:text-cyan-400 transition">jeremy@strategicmindsai.com</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-xs text-stone-500 uppercase tracking-wide mb-0.5">Phone</div>
                    <span className="text-sm text-white">(772) 209-0266</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-xs text-stone-500 uppercase tracking-wide mb-0.5">Location</div>
                    <span className="text-sm text-white">Fort Lauderdale, FL</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-7">
              <Brain className="w-8 h-8 text-cyan-400 mb-3" />
              <h3 className="text-base font-bold text-white mb-2">What Happens Next?</h3>
              <ol className="space-y-2.5 text-sm text-stone-400">
                <li className="flex gap-2.5"><span className="text-cyan-400 font-bold">1.</span> We review your message within 24 hours</li>
                <li className="flex gap-2.5"><span className="text-cyan-400 font-bold">2.</span> We schedule a 30-min strategy call</li>
                <li className="flex gap-2.5"><span className="text-cyan-400 font-bold">3.</span> We deliver a custom AI opportunity audit</li>
                <li className="flex gap-2.5"><span className="text-cyan-400 font-bold">4.</span> You decide if we're a fit — no pressure</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      <SmaiFooter />
    </div>
  );
}