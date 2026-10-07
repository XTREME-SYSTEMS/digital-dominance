import React, { useState } from "react";
import { ArrowRight, Phone, Star, Loader2, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { LOGO_URL } from "@/components/Logo";

const GARAGE_BG = "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/0042c042d_Jason-Garage-3.webp";

export default function FunnelHero() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", zip: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await base44.entities.Lead.create({
        form_type: "contact",
        name: form.name,
        email: form.email,
        phone: form.phone,
        message: `Funnel hero form — ZIP: ${form.zip}`,
      });
      setDone(true);
      setTimeout(() => navigate("/funnel"), 1500);
    } catch {
      setDone(true);
      setTimeout(() => navigate("/funnel"), 1500);
    }
    setSubmitting(false);
  };

  return (
    <section className="relative overflow-hidden bg-white">
      {/* Top bar */}
      <div className="relative z-20 xps-gold-bg text-black text-center py-2 text-xs font-bold tracking-wide">
        <span className="hidden sm:inline">📞 (877) 958-5264 — Speak to a Representative Today</span>
        <span className="sm:hidden">📞 (877) 958-5264</span>
      </div>

      {/* Nav */}
      <div className="relative z-20 flex items-center justify-between px-6 py-4 bg-stone-950 border-b border-stone-800">
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="Xtreme Polishing Systems" className="h-12 w-12 object-contain" />
          <div>
            <div className="font-black text-lg xps-gold-text">National Epoxy Pros</div>
            <div className="text-[10px] xps-gold-text font-bold uppercase tracking-widest">Floors For Life</div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-amber-400">
          <Star className="h-4 w-4 fill-amber-400" />
          <Star className="h-4 w-4 fill-amber-400" />
          <Star className="h-4 w-4 fill-amber-400" />
          <Star className="h-4 w-4 fill-amber-400" />
          <Star className="h-4 w-4 fill-amber-400" />
          <span className="text-xs text-stone-400 ml-1">4.9/5 · 2,400+ Projects</span>
        </div>
      </div>

      {/* Hero with darkened garage background */}
      <div className="relative min-h-[600px] flex items-stretch">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src={GARAGE_BG}
            alt="Luxury garage with epoxy floor"
            className="w-full h-full object-cover"
          />
          {/* Light overlay — image stays visible */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/35 to-black/20" />
        </div>

        {/* Content split */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-16 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* LEFT — Hero text */}
          <div className="text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1.5 mb-6">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">#1 National Distributor</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-[1.05]">
              <span className="xps-sparkle-white">Epoxy Will</span>
              <br />
              <span className="xps-sparkle-white">Change Your </span>
              <span className="xps-sparkle-white">Garage</span>
            </h1>

            <p className="text-xl md:text-2xl text-white font-bold mt-5 max-w-md leading-snug">
              Transform your garage with industrial-grade epoxy flooring that lasts a lifetime.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4 mt-8">
              <Link
                to="/funnel"
                className="group inline-flex items-center gap-3 xps-gold-bg text-black font-black text-base px-7 py-3.5 rounded-2xl shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 transition-all"
              >
                Get My Free Estimate
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition" />
              </Link>
              <a
                href="tel:+18779585264"
                className="inline-flex items-center gap-2 bg-black border-2 border-black text-white font-bold text-sm px-5 py-3.5 rounded-2xl hover:border-amber-500 hover:text-amber-400 transition"
              >
                <Phone className="h-4 w-4" />
                (877) 958-5264
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-5 mt-8 text-sm text-white font-bold">
              <span>✓ No Obligation</span>
              <span>✓ Lifetime Warranty</span>
              <span>✓ No Peeling</span>
            </div>
          </div>

          {/* RIGHT — Contact form */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-sm rounded-2xl bg-white/95 backdrop-blur-sm border border-amber-500/30 shadow-2xl p-6">
              {done ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 className="h-14 w-14 text-green-500 mb-4" />
                  <h3 className="font-black text-black text-lg">Thank You!</h3>
                  <p className="text-sm text-stone-500 mt-1">Redirecting you to your estimate…</p>
                </div>
              ) : (
                <>
                  <h3 className="font-black text-black text-xl mb-1">Get Your Free Estimate</h3>
                  <p className="text-sm text-stone-500 mb-5">Fill out the form and we'll contact you within 24 hours.</p>
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-stone-600">Full Name</label>
                      <input
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="John Smith"
                        className="w-full mt-1 rounded-lg border border-stone-200 px-3 py-2.5 text-sm focus:border-amber-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-600">Email</label>
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="john@email.com"
                        className="w-full mt-1 rounded-lg border border-stone-200 px-3 py-2.5 text-sm focus:border-amber-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-600">Phone</label>
                      <input
                        required
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                        className="w-full mt-1 rounded-lg border border-stone-200 px-3 py-2.5 text-sm focus:border-amber-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-600">ZIP Code</label>
                      <input
                        required
                        value={form.zip}
                        onChange={(e) => setForm({ ...form, zip: e.target.value })}
                        placeholder="33009"
                        maxLength={5}
                        className="w-full mt-1 rounded-lg border border-stone-200 px-3 py-2.5 text-sm focus:border-amber-400 outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full xps-gold-bg text-black font-black text-base py-3 rounded-xl shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-[1.02] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                      ) : (
                        <>Get My Estimate <ArrowRight className="h-4 w-4" /></>
                      )}
                    </button>
                    <p className="text-[10px] text-stone-400 text-center">No obligation · We respect your privacy</p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}