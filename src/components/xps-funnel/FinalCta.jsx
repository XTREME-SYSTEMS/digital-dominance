import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, Shield, Zap } from "lucide-react";

const URGENCY_POINTS = [
  { icon: Clock, text: "Limited installation slots this month" },
  { icon: Shield, text: "20-year warranty included on all systems" },
  { icon: Zap, text: "Most estimates completed in under 60 seconds" },
];

export default function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-stone-950 py-20 px-6">
      {/* Glow */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1.5 mb-6">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Free Estimate · No Obligation</span>
        </div>

        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-[1.05]">
          <span className="text-white">Your Dream Floor is</span>
          <br />
          <span className="xps-gold-text">One Click Away</span>
        </h2>

        <p className="text-lg text-stone-300 mt-5 max-w-xl mx-auto">
          See your price instantly. Pick your system. Book your install. It's that simple.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <Link
            to="/funnel"
            className="group inline-flex items-center gap-3 xps-gold-bg text-black font-black text-lg px-10 py-4 rounded-2xl shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 transition-all"
          >
            Start My Free Estimate
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition" />
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-10">
          {URGENCY_POINTS.map((u, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-stone-400">
              <u.icon className="h-4 w-4 text-amber-400" />
              <span>{u.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}