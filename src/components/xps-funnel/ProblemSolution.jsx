import React from "react";
import { CheckCircle2, X } from "lucide-react";

const PROBLEMS = [
  "Cracked, stained concrete ruining your space",
  "Paint chipping after just one season",
  "Slippery floors that are dangerous for kids & pets",
  "Embarrassing garage when guests come over",
  "Wasting money on DIY kits that don't last",
];

const SOLUTIONS = [
  "Seamless, crack-free epoxy that looks brand new for 20+ years",
  "Industrial-grade coating that bonds permanently to concrete",
  "Slip-resistant surface options for total safety",
  "A garage so stunning your neighbors will be jealous",
  "Professional installation backed by a 20-year warranty",
];

export default function ProblemSolution() {
  return (
    <section className="empire-dark relative overflow-hidden py-16 px-6 empire-radial-glow">
      <div className="empire-grid-overlay" />
      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="text-center mb-12 empire-fade-in">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">
            <span className="text-white">Tired of </span>
            <span className="empire-gold-text">Ugly Floors?</span>
          </h2>
          <p className="text-stone-400 mt-3 max-w-xl mx-auto">
            You're not alone. Here's what homeowners deal with — and how we fix it permanently.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Problems */}
          <div className="empire-glass-card" style={{ borderColor: "rgba(239,68,68,.2)" }}>
            <h3 className="font-black text-red-400 text-sm uppercase tracking-wider mb-4">The Problem</h3>
            <div className="space-y-3">
              {PROBLEMS.map((p, i) => (
                <div key={i} className="flex items-start gap-3 text-stone-300 text-sm">
                  <X className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <span>{p}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Solutions */}
          <div className="empire-glass-card" style={{ borderColor: "rgba(129,140,248,.25)" }}>
            <h3 className="empire-gradient-text font-black text-sm uppercase tracking-wider mb-4">The XPS Solution</h3>
            <div className="space-y-3">
              {SOLUTIONS.map((s, i) => (
                <div key={i} className="flex items-start gap-3 text-white text-sm">
                  <CheckCircle2 className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}