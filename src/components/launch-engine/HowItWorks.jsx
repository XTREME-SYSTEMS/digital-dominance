import React from "react";

const STEPS = [
  { num: 1, label: "Choose Industry", desc: "Start with a business category." },
  { num: 2, label: "Pick a Template", desc: "Browse scrollable designs." },
  { num: 3, label: "Approve Locations", desc: "Pick the number and markets." },
  { num: 4, label: "Review Proof", desc: "Inspect private previews and receipts." },
];

const PRICING = [
  {
    tier: "START",
    name: "Single Website",
    desc: "One focused business website with a customized visual layout.",
    cta: "Get a Quote →",
    href: "#contact",
    highlight: false,
  },
  {
    tier: "EXPAND",
    name: "Multi-Site Launch",
    desc: "Review templates and approve several location-specific previews.",
    cta: "Plan 10 Sites →",
    href: "#contact",
    highlight: true,
  },
  {
    tier: "GROW",
    name: "Marketing Support",
    desc: "Discuss content, lead attribution, and ongoing site optimization.",
    cta: "Discuss Options →",
    href: "#contact",
    highlight: false,
  },
];

export default function HowItWorks() {
  return (
    <>
      {/* How It Works */}
      <section id="how" className="bg-[#0a1220] py-16 md:py-24 text-white">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00a2ff] mb-2">SIMPLE PROCESS</p>
            <h2 className="text-3xl md:text-4xl font-black mb-3">How It Works</h2>
            <p className="text-white/50 max-w-lg mx-auto">Five clear actions from design choice to reviewable proof.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STEPS.map((s) => (
              <div key={s.num} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#00a2ff] text-xl font-black text-white">{s.num}</div>
                <h3 className="text-sm font-bold mb-1">{s.label}</h3>
                <p className="text-xs text-white/50">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-white py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00a2ff] mb-2">FLEXIBLE PRICING</p>
            <h2 className="text-3xl md:text-4xl font-black text-[#0a1220] mb-3">Choose the Right Launch</h2>
            <p className="text-[#6b7280] max-w-lg mx-auto">Request a written quote. No unsupported prices or rankings are promised.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PRICING.map((p) => (
              <div key={p.tier} className={`rounded-2xl border p-7 transition ${p.highlight ? "border-[#00a2ff] shadow-lg scale-[1.02]" : "border-gray-200 hover:border-gray-300"}`}>
                <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${p.highlight ? "text-[#00a2ff]" : "text-gray-400"}`}>{p.tier}</p>
                <h3 className="text-xl font-black text-[#0a1220] mb-2">{p.name}</h3>
                <p className="text-sm text-[#6b7280] mb-5">{p.desc}</p>
                <a href={p.href} className={`block rounded-xl py-3 text-center text-sm font-bold transition ${p.highlight ? "bg-[#00a2ff] text-white hover:bg-[#0090e0]" : "border-2 border-gray-200 text-[#0a1220] hover:border-[#00a2ff]"}`}>
                  {p.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}