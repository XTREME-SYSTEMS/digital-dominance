import React from "react";
import { Radar, Zap, TrendingUp, Layers, Cpu, Gauge, Crosshair } from "lucide-react";

const STEPS = [
  { num: 1, icon: Radar, label: "Industry Skip Trace", desc: "Scans the top 5 competitor websites in your industry for pricing, SEO, funnel, and content intelligence." },
  { num: 2, icon: Layers, label: "Brand Generator", desc: "Instantly creates 20 logo, accent color, and layout combinations for your template." },
  { num: 3, icon: Cpu, label: "Benchmark Enhancement", desc: "AI enhances your content, pricing, competitive intel, funnel intel, and SEO/AEO/GEO to outperform all competitors." },
  { num: 4, icon: Gauge, label: "Google Standard", desc: "Programmatic scoring against Google's 2026 algorithm (14 weighted factors) ensures 100% compliance." },
  { num: 5, icon: Crosshair, label: "God Mode", desc: "Deterministic optimizer calculates the fastest mathematical path to Google's first page in your category." },
];

const TECH = [
  { icon: Radar, name: "Industry Skip Trace Engine", desc: "Real-time web scan of top 5 competitors — extracts services, pricing, SEO strengths, funnel strategies, content gaps, and backlink profiles." },
  { icon: Cpu, name: "Benchmark Enhancement System", desc: "AI-powered enhancement of hero copy, service descriptions, AEO FAQ, GEO location pages, pricing strategy, funnel optimization, and 30-day content calendar." },
  { icon: Gauge, name: "Google 2026 Programmatic Standard", desc: "Deterministic 14-factor scoring engine based on Google's published 2026 algorithm weights. Scores every page 0-100 with prioritized fix recommendations." },
  { icon: Crosshair, name: "God Mode Deterministic Optimizer", desc: "Mathematical weighted-impact algorithm that generates a phased optimization plan. Calculates exact time-to-first-page and projected score after each phase." },
  { icon: Layers, name: "Page Variation Engine", desc: "Generates location-dominance, service-depth, and question-answer page variations for A/B testing — each optimized for a different Google ranking signal." },
  { icon: TrendingUp, name: "SEO / AEO / GEO Maximizer", desc: "Three-engine system: SEO for traditional search, AEO for AI Overview capture, GEO for local pack dominance. All run in the backend continuously." },
];

const PRICING = [
  {
    tier: "START",
    name: "Single Website",
    desc: "One website with skip trace, benchmark enhancement, Google Standard scoring, and God Mode optimization.",
    cta: "Get a Quote →",
    href: "#contact",
    highlight: false,
  },
  {
    tier: "DOMINATE",
    name: "Multi-Site Launch",
    desc: "10+ location-specific sites with full competitive intelligence, page variations, and ongoing God Mode optimization.",
    cta: "Plan 10 Sites →",
    href: "#contact",
    highlight: true,
  },
  {
    tier: "EMPIRE",
    name: "Market Dominance",
    desc: "Unlimited sites across all US counties with continuous SEO/AEO/GEO maximization and autonomous content publishing.",
    cta: "Discuss Empire →",
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
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00a2ff] mb-2">REAL TECHNOLOGY</p>
            <h2 className="text-3xl md:text-4xl font-black mb-3">How It Works</h2>
            <p className="text-white/50 max-w-lg mx-auto">Five backend systems that scan, enhance, score, and optimize your website to reach Google's first page.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {STEPS.map((s) => (
              <div key={s.num} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center hover:border-[#00a2ff]/40 transition">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#00a2ff] to-[#0066cc] text-white">
                  <s.icon className="w-5 h-5" />
                </div>
                <div className="text-[10px] font-bold text-[#00a2ff] mb-1">STEP {s.num}</div>
                <h3 className="text-sm font-bold mb-1">{s.label}</h3>
                <p className="text-xs text-white/50 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* God Mode Technology */}
      <section className="bg-gradient-to-b from-[#0a1220] to-[#111827] py-16 md:py-24 text-white">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00a2ff] mb-2">BACKEND ENGINE</p>
            <h2 className="text-3xl md:text-4xl font-black mb-3">God Mode Technology</h2>
            <p className="text-white/50 max-w-2xl mx-auto">Six deterministic systems operating in the backend, researched from Google's 2026 algorithm and the top 5 marketing agencies in the world.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {TECH.map((t, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-[#00a2ff]/40 transition">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#00a2ff] to-[#0066cc]">
                    <t.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold mb-1">{t.name}</h3>
                    <p className="text-xs text-white/50 leading-relaxed">{t.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00a2ff]/30 bg-[#00a2ff]/5 px-5 py-2.5">
              <Zap className="w-4 h-4 text-[#00a2ff]" />
              <span className="text-sm font-bold text-white">All systems run automatically in the backend — no manual SEO work required</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-white py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00a2ff] mb-2">FLEXIBLE PRICING</p>
            <h2 className="text-3xl md:text-4xl font-black text-[#0a1220] mb-3">Choose Your Dominance Level</h2>
            <p className="text-[#6b7280] max-w-lg mx-auto">Every plan includes skip trace, benchmark enhancement, Google Standard scoring, and God Mode optimization.</p>
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