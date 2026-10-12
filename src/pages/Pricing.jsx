import React from "react";
import { Link } from "react-router-dom";
import { Check, Sparkles, ArrowRight, Rocket, Phone } from "lucide-react";

const TIERS = [
  {
    name: "STARTER",
    price: "$2,500",
    period: "one-time",
    tagline: "1 website, branded, deployed, SEO-ready",
    delivery: "5-day delivery",
    features: [
      "1 industry website (your choice of template)",
      "Brand pack: logo, colors, fonts, tagline",
      "Deployed to Vercel with SSL",
      "Google Search Console sync",
      "Mobile + desktop PWA",
      "SEO/AEO/GEO schema applied",
      "1 round of revisions",
    ],
    cta: "START NOW",
    highlight: false,
  },
  {
    name: "GROWTH",
    price: "$7,500",
    period: "one-time",
    tagline: "1 website + 30-day automated social media",
    delivery: "3-day delivery",
    features: [
      "Everything in Starter",
      "30-day social media calendar",
      "10 viral videos generated",
      "20 social posts scheduled & published",
      "Full SEO/AEO/GEO schema optimization",
      "Google Analytics + Search Console",
      "Business cards + digital brochure",
      "3 rounds of revisions",
    ],
    cta: "GROW NOW",
    highlight: true,
  },
  {
    name: "DOMINANCE",
    price: "$25,000",
    period: "per month",
    tagline: "100+ programmatic sites, full automation, done-for-you",
    delivery: "Ongoing — managed forever",
    features: [
      "Everything in Growth",
      "100+ programmatic websites by state/city",
      "Full social media automation (all platforms)",
      "Ongoing SEO dominance + content generation",
      "Dedicated AI agent fleet (12 super agents)",
      "24/7 system monitoring + auto-healing",
      "Competitor tracking + market intelligence",
      "Monthly strategy reports",
      "Unlimited revisions",
    ],
    cta: "DOMINATE",
    highlight: false,
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-[#0a1220] text-white">
      <nav className="flex items-center justify-between px-6 py-4 md:px-12 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#00a2ff] to-[#0066cc]">
            <Rocket className="h-5 w-5 text-white" />
          </div>
          <div className="leading-none">
            <span className="block text-sm font-extrabold tracking-tight text-white">Website Launch Engine</span>
            <span className="block text-[9px] font-bold uppercase tracking-[0.15em] text-[#00a2ff]">Florida Based · Nationwide</span>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/templates" className="text-xs font-bold tracking-wider text-white/60 hover:text-[#00a2ff]">TEMPLATES</Link>
          <a href="tel:+17722090266" className="flex items-center gap-2 rounded-full bg-[#00a2ff] px-4 py-2 text-xs font-bold text-white shadow-[0_0_20px_rgba(0,162,255,0.4)] transition hover:bg-[#0090e0]">
            <Phone className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">(772) 209-0266</span>
          </a>
          <Link to="/portal" className="flex items-center gap-2 rounded-lg border border-[#00a2ff]/50 px-4 py-2 text-xs font-bold tracking-wider text-[#00a2ff] hover:bg-[#00a2ff]/10">PORTAL</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-black tracking-wide mb-4">DONE IN <span className="text-[#00a2ff]">DAYS</span></h1>
        <p className="text-white/50 mb-12 max-w-2xl mx-auto text-lg">No retainers. No long timelines. Pick a tier, type what you want, and our AI builds everything — autonomously.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {TIERS.map((tier) => (
            <div key={tier.name} className={`rounded-2xl border p-8 ${tier.highlight ? "border-[#00a2ff] bg-[#00a2ff]/5" : "border-white/10 bg-white/[0.02]"} hover:border-[#00a2ff]/50 transition`}>
              {tier.highlight && <div className="mb-4 inline-block rounded-full bg-[#00a2ff] px-3 py-1 text-[10px] font-bold tracking-wider text-black">MOST POPULAR</div>}
              <h3 className="text-2xl font-black tracking-wider mb-2">{tier.name}</h3>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-black">{tier.price}</span>
                <span className="text-xs text-white/40">{tier.period}</span>
              </div>
              <p className="text-sm text-white/50 mb-2">{tier.tagline}</p>
              <p className="text-xs text-[#00a2ff] font-bold mb-6">{tier.delivery}</p>
              <ul className="space-y-3 mb-8">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                    <Check className="h-4 w-4 text-[#00a2ff] shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/portal" className={`flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-bold tracking-wider transition ${tier.highlight ? "bg-[#00a2ff] text-black hover:bg-[#00a2ff]/80" : "border border-white/20 text-white hover:border-[#00a2ff] hover:text-[#00a2ff]"}`}>
                <Sparkles className="h-4 w-4" />
                {tier.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-white/10 bg-white/[0.02] p-8 max-w-2xl mx-auto">
          <h3 className="text-xl font-bold mb-2">Need something custom?</h3>
          <p className="text-white/50 mb-4">Type what you need in the portal. Our AI will figure out the scope and pricing.</p>
          <Link to="/portal" className="inline-flex items-center gap-2 rounded-full border border-[#00a2ff]/50 px-6 py-3 text-sm font-bold tracking-wider text-[#00a2ff] hover:bg-[#00a2ff]/10">
            ENTER PORTAL <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}