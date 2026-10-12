import React from "react";
import { Link } from "react-router-dom";
import { Rocket, Phone, ChevronDown } from "lucide-react";

const NAV_LINKS = [
  { label: "Industries", href: "#industries" },
  { label: "Templates", href: "#templates" },
  { label: "How It Works", href: "#how" },
  { label: "Pricing", href: "#pricing" },
  { label: "Portals", href: "#portals" },
  { label: "Contact", href: "#contact" },
];

export default function LaunchHero({ onBrowse }) {
  return (
    <header className="relative z-30">
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 py-3 md:px-8 md:py-4 border-b border-white/10 bg-[#0a1220]/80 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#00a2ff] to-[#0066cc]">
            <Rocket className="h-5 w-5 text-white" />
          </div>
          <div className="leading-none">
            <span className="block text-sm font-extrabold tracking-tight text-white">Website Launch Engine</span>
            <span className="block text-[9px] font-bold uppercase tracking-[0.15em] text-[#00a2ff]">Florida Based · Nationwide Reach</span>
          </div>
        </Link>
        <div className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href} className="text-sm font-semibold text-white/70 hover:text-white transition flex items-center gap-1">
              {l.label}
              {l.label === "Industries" && <ChevronDown className="h-3.5 w-3.5" />}
            </a>
          ))}
        </div>
        <a href="tel:+17722090266" className="flex items-center gap-2 rounded-full bg-[#00a2ff] px-4 py-2 text-sm font-bold text-white shadow-[0_0_20px_rgba(0,162,255,0.4)] transition hover:bg-[#0090e0]">
          <Phone className="h-4 w-4" />
          <span className="hidden sm:inline">(772) 209-0266</span>
        </a>
      </nav>

      {/* Hero content */}
      <div className="relative px-4 md:px-8 pt-12 pb-20 md:pt-20 md:pb-32 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: text */}
          <div className="space-y-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">FAST WEBSITES. REAL LEADS. BIGGER BUSINESS.</p>
            <h1 className="text-4xl md:text-6xl font-black leading-[1.05] tracking-tight text-white">
              Launch <span className="text-[#00a2ff]">100s</span> of Websites in <span className="text-[#00a2ff]">Minutes.</span>
            </h1>
            <p className="text-base md:text-lg text-white/60 max-w-lg leading-relaxed">
              Explore premium, conversion-focused websites for high-value industries. Choose an industry, preview a design, and plan your next launch. Live builds and delivery are confirmed after approval.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={onBrowse} className="rounded-full bg-[#00a2ff] px-6 py-3 text-sm font-bold text-white shadow-[0_0_30px_rgba(0,162,255,0.4)] transition hover:bg-[#0090e0]">
                Browse Industries →
              </button>
              <a href="#templates" className="rounded-full border-2 border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:border-white/40">
                View Templates
              </a>
              <a href="tel:+17722090266" className="flex items-center gap-2 rounded-full border-2 border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:border-white/40">
                <Phone className="h-4 w-4" /> Call Now (772) 209-0266
              </a>
            </div>
          </div>

          {/* Right: 3D mockup collage */}
          <div className="relative h-[360px] md:h-[440px] hidden md:block">
            <BrowserMock
              className="absolute left-0 top-8 w-[55%] -rotate-[8deg]"
              tag="REAL ESTATE"
              title="LUXE HOMES"
              subtitle="Modern Homes. Brighter Futures."
              cta="View Collection →"
              img="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80&fit=crop"
              accent="from-blue-500/20"
            />
            <BrowserMock
              className="absolute left-[18%] top-0 w-[55%] rotate-[3deg] z-10"
              tag="ROOFING"
              title="PREMIER ROOFING"
              subtitle="Quality Roofing Built to Last."
              cta="Get a Free Estimate →"
              img="https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400&q=80&fit=crop"
              accent="from-[#00a2ff]/20"
              featured
            />
            <BrowserMock
              className="absolute right-0 top-12 w-[50%] rotate-[6deg]"
              tag="LEGAL"
              title="HARRISON LAW"
              subtitle="Expert Legal Representation"
              cta="Free Consultation →"
              img="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&q=80&fit=crop"
              accent="from-purple-500/20"
            />
            <BrowserMock
              className="absolute right-[5%] bottom-0 w-[42%] -rotate-[4deg]"
              tag="MED SPA"
              title="RADIANCE"
              subtitle="Reveal Your Natural Beauty"
              cta="Book Now"
              img="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&q=80&fit=crop"
              accent="from-pink-500/20"
            />
            {/* Glow */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-[#00a2ff]/20 blur-[80px]" />
          </div>
        </div>

        {/* Feature row */}
        <div className="mt-12 md:mt-16 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/10 pt-6">
          {[
            { icon: "⚡", label: "Fast website preview planning" },
            { icon: "▥", label: "Conversion-focused premium designs" },
            { icon: "◉", label: "Built for 20+ Industries" },
            { icon: "♧", label: "Florida based nationwide reach" },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-2 text-sm text-white/60">
              <span className="text-[#00a2ff]">{f.icon}</span>
              <span className="font-medium">{f.label}</span>
            </div>
          ))}
          <a href="#industries" className="ml-auto text-sm font-bold text-[#00a2ff] hover:underline">Plan a website launch ↗</a>
        </div>
      </div>
    </header>
  );
}

function BrowserMock({ className = "", tag, title, subtitle, cta, img, accent = "", featured = false }) {
  return (
    <div className={`rounded-xl overflow-hidden border border-white/15 bg-[#0d1525] shadow-2xl ${className}`}>
      {/* Browser bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-[#0a0f1a] border-b border-white/10">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
        <span className="ml-2 text-[9px] font-mono text-white/30">{title.toLowerCase().replace(/\s/g, "-")}.com</span>
      </div>
      {/* Content */}
      <div className="relative h-40 overflow-hidden">
        <img src={img} alt={title} className="absolute inset-0 h-full w-full object-cover" />
        <div className={`absolute inset-0 bg-gradient-to-t ${accent} via-transparent to-[#0a1220]`} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1220] via-[#0a1220]/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-[8px] font-bold uppercase tracking-widest text-[#00a2ff]">{tag}</p>
          <p className="text-sm font-black text-white leading-tight">{title}</p>
          <p className="text-[10px] text-white/60">{subtitle}</p>
          <span className="mt-1.5 inline-block rounded-full bg-[#00a2ff] px-2.5 py-1 text-[9px] font-bold text-white">{cta}</span>
        </div>
      </div>
    </div>
  );
}