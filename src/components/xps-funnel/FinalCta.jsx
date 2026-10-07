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
    <section className="relative overflow-hidden empire-dark py-20 px-6 empire-radial-glow">
      <div className="empire-grid-overlay" />

      <div className="relative z-10 max-w-3xl mx-auto text-center empire-fade-in">
        <div className="empire-badge-gold mb-6">
          <span className="text-xs font-bold uppercase tracking-wider">Free Estimate · No Obligation</span>
        </div>

        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-[1.05]">
          <span className="text-white">Your Dream Floor is</span>
          <br />
          <span className="empire-gold-text">One Click Away</span>
        </h2>

        <p className="text-lg text-stone-300 mt-5 max-w-xl mx-auto">
          See your price instantly. Pick your system. Book your install. It's that simple.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <Link
            to="/funnel"
            className="empire-btn-gold group"
            style={{ fontSize: 16, padding: "16px 36px" }}
          >
            Start My Free Estimate
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition" />
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-10">
          {URGENCY_POINTS.map((u, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-stone-400">
              <u.icon className="h-4 w-4 text-indigo-400" />
              <span>{u.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}