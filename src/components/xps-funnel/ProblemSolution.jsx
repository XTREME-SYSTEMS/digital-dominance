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
    <section className="bg-stone-950 py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">
            <span className="text-white">Tired of </span>
            <span className="xps-gold-text">Ugly Floors?</span>
          </h2>
          <p className="text-stone-400 mt-3 max-w-xl mx-auto">
            You're not alone. Here's what homeowners deal with — and how we fix it permanently.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Problems */}
          <div className="rounded-2xl border border-red-900/40 bg-red-950/20 p-6">
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
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-6">
            <h3 className="xps-gold-text font-black text-sm uppercase tracking-wider mb-4">The XPS Solution</h3>
            <div className="space-y-3">
              {SOLUTIONS.map((s, i) => (
                <div key={i} className="flex items-start gap-3 text-white text-sm">
                  <CheckCircle2 className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
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