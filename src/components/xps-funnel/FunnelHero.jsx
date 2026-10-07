import React from "react";
import { ArrowRight, Phone, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { LOGO_URL } from "@/components/Logo";

export default function FunnelHero() {
  return (
    <section className="relative overflow-hidden bg-stone-950">
      {/* Background gradient mesh */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 xps-gold-bg text-black text-center py-2 text-xs font-bold tracking-wide">
        <span className="hidden sm:inline">📞 (877) 958-5264 — Speak to a Representative Today</span>
        <span className="sm:hidden">📞 (877) 958-5264</span>
      </div>

      {/* Nav */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-stone-800">
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="Xtreme Polishing Systems" className="h-12 w-12 object-contain" />
          <div>
            <div className="font-black text-lg xps-gold-text">Xtreme Polishing Systems</div>
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

      {/* Hero content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 md:py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1.5 mb-6">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">#1 National Distributor of Concrete Coatings</span>
        </div>

        <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tight leading-[1.05]">
          <span className="xps-gold-text">Epoxy Will</span>
          <br />
          <span className="xps-gold-text">Change Your Life</span>
        </h1>

        <p className="text-lg md:text-xl text-stone-300 mt-6 max-w-2xl mx-auto font-medium">
          Transform your garage, basement, or commercial space with industrial-grade epoxy flooring
          that lasts decades — not years. Get your <span className="xps-gold-text font-bold">instant estimate</span> in 60 seconds.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <Link
            to="/funnel"
            className="group inline-flex items-center gap-3 xps-gold-bg text-black font-black text-lg px-8 py-4 rounded-2xl shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 transition-all"
          >
            Get My Free Estimate
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition" />
          </Link>
          <a
            href="tel:+18779585264"
            className="inline-flex items-center gap-2 border-2 border-stone-600 text-white font-bold text-base px-6 py-4 rounded-2xl hover:border-amber-500 hover:text-amber-400 transition"
          >
            <Phone className="h-4 w-4" />
            (877) 958-5264
          </a>
        </div>

        {/* Trust line */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-xs text-stone-500 font-medium">
          <span>✓ No Obligation</span>
          <span>✓ Instant Pricing</span>
          <span>✓ Licensed & Insured</span>
          <span>✓ 20-Year Warranty</span>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="relative z-10">
        <svg viewBox="0 0 1440 80" className="w-full h-12 md:h-20" preserveAspectRatio="none">
          <path d="M0,40 C320,80 480,0 720,20 C960,40 1120,80 1440,30 L1440,80 L0,80 Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}