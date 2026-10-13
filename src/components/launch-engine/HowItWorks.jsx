import React from "react";
import { TrendingUp, Globe, Zap, Crown, Rocket, Infinity as InfinityIcon, CheckCircle2, ArrowRight } from "lucide-react";

const RESULTS = [
  { icon: TrendingUp, title: "First-Page Google Rankings", desc: "Your sites reach Google's first page through deterministic optimization — not guesswork." },
  { icon: Globe, title: "National & International Scale", desc: "Launch unlimited location-specific sites across every US city and international market." },
  { icon: Zap, title: "AI-Optimized Content", desc: "Every page is enhanced by AI to outperform competitors on pricing, SEO, and conversion." },
  { icon: CheckCircle2, title: "Guaranteed Live Validation", desc: "Every site is automatically validated as visible and live — no dead links, no broken pages." },
  { icon: Crown, title: "Autonomous Operation", desc: "Super agents run your entire digital business 24/7 — frontend, backend, and customer outreach." },
  { icon: Rocket, title: "Speed to Market", desc: "From concept to live site in record time, with zero points of failure in the pipeline." },
];

const DOMINANCE_LEVELS = [
  { tier: "LAUNCH", name: "Launch", icon: Rocket, desc: "One website with full AI enhancement, Google Standard scoring, and God Mode optimization.", cta: "Get a Quote →", href: "#contact", highlight: false, color: "from-blue-500 to-blue-700" },
  { tier: "CONQUER", name: "Conquer", icon: TrendingUp, desc: "10+ location-specific sites with competitive intelligence, page variations, and continuous optimization.", cta: "Plan 10 Sites →", href: "#contact", highlight: false, color: "from-cyan-500 to-blue-600" },
  { tier: "DOMINATE", name: "Dominate", icon: Crown, desc: "Unlimited sites across all US counties with autonomous SEO/AEO/GEO and content publishing.", cta: "Discuss Domination →", href: "#contact", highlight: true, color: "from-amber-500 to-orange-600" },
  { tier: "ASCEND", name: "Ascend", icon: Globe, desc: "International expansion — multi-language, multi-region sites with global compliance and local dominance.", cta: "Go International →", href: "#contact", highlight: false, color: "from-purple-500 to-indigo-600" },
  { tier: "OMNIPRESENCE", name: "Omnipresence", icon: InfinityIcon, desc: "Total digital dominance — every market, every language, every device. The maximum level of scale achievable.", cta: "Achieve Omnipresence →", href: "#contact", highlight: false, color: "from-green-500 to-emerald-600" },
];

export default function HowItWorks() {
  return (
    <>
      {/* Results Section - No secrets revealed */}
      <section id="how" className="bg-[#0a1220] py-16 md:py-24 text-white">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00a2ff] mb-2">PROVEN OUTCOMES</p>
            <h2 className="text-3xl md:text-4xl font-black mb-3">The Results You Get</h2>
            <p className="text-white/50 max-w-lg mx-auto">We don't talk about how we do it. We deliver the outcomes that matter to your business.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {RESULTS.map((r, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-green-400/50 hover:shadow-[0_0_20px_-4px_rgba(34,197,94,0.4)] transition-all duration-300">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#00a2ff] to-[#0066cc]">
                  <r.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-bold mb-2">{r.title}</h3>
                <p className="text-xs text-white/50 leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Choose Your Dominance Level */}
      <section id="pricing" className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00a2ff] mb-2">CHOOSE YOUR POWER</p>
            <h2 className="text-3xl md:text-4xl font-black text-[#0a1220] mb-3">Choose Your Dominance Level</h2>
            <p className="text-[#6b7280] max-w-lg mx-auto">From a single site to total global omnipresence. Every level includes full AI enhancement and autonomous operation.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {DOMINANCE_LEVELS.map((p) => (
              <div key={p.tier} className={`rounded-2xl border p-6 transition-all duration-300 hover:border-green-400/50 hover:shadow-[0_0_20px_-4px_rgba(34,197,94,0.3)] ${p.highlight ? "border-amber-400 shadow-lg scale-[1.03] ring-2 ring-amber-400/30" : "border-gray-200 hover:border-green-400"}`}>
                <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${p.color}`}>
                  <p.icon className="w-6 h-6 text-white" />
                </div>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 text-center ${p.highlight ? "text-amber-500" : "text-gray-400"}`}>{p.tier}</p>
                <h3 className="text-lg font-black text-[#0a1220] mb-2 text-center">{p.name}</h3>
                <p className="text-xs text-[#6b7280] mb-4 text-center leading-relaxed">{p.desc}</p>
                <a href={p.href} className={`block rounded-xl py-2.5 text-center text-xs font-bold transition ${p.highlight ? "bg-amber-500 text-white hover:bg-amber-600" : "border-2 border-gray-200 text-[#0a1220] hover:border-green-400 hover:text-green-600"}`}>
                  {p.cta}
                </a>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <p className="text-xs text-[#6b7280]">Maximum scale: <span className="font-bold text-[#0a1220]">Unlimited websites</span> — each deployed as its own app with a unique URL. No per-account limit. National and international.</p>
          </div>
        </div>
      </section>
    </>
  );
}