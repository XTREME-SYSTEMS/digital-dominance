import React from "react";
import { Phone, Star, MapPin, Clock, Shield, Award, ThumbsUp } from "lucide-react";

export default function PreviewHero({ c, LogoIcon, industry, heroLayout }) {
  return (
    <>
      <div className="bg-[#0a0a0a] text-white text-[10px] flex items-center justify-between px-4 py-1.5 wp-font-body">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400 wp-pulse-dot" /> Open Now</span>
          <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> Serving Your Area</span>
        </div>
        <a className="flex items-center gap-1 font-bold" style={{ color: c.accentLight }}>
          <Phone className="w-2.5 h-2.5" /> {c.phone}
        </a>
      </div>

      <nav className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-10 wp-font-body">
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm" style={{ background: `linear-gradient(135deg, ${c.accent}, ${c.accentLight})` }}>
            {LogoIcon ? <LogoIcon className="w-3.5 h-3.5 text-white" /> : <span className="text-white font-black text-xs">{industry?.[0] || "P"}</span>}
          </div>
          <span className="font-black text-sm text-gray-900 wp-font-heading">{industry || "Pro"}</span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-[10px] font-semibold text-gray-600">
          <span>Home</span><span>Services</span><span>About</span><span>Reviews</span><span>FAQ</span>
        </div>
        <button className="text-[10px] font-bold text-white px-3 py-1.5 rounded-lg shadow-sm wp-gradient-animate" style={{ background: `linear-gradient(135deg, ${c.accent}, ${c.accentLight})` }}>
          Free Quote
        </button>
      </nav>

      <section className="relative h-52 overflow-hidden wp-font-body">
        <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-30 wp-float" style={{ background: c.accentLight, filter: "blur(24px)" }} />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-20 wp-float-slow" style={{ background: c.accent, filter: "blur(20px)" }} />
        {heroLayout === "split" ? (
          <div className="flex h-full relative z-10">
            <div className="w-1/2 flex flex-col justify-center px-4 wp-gradient-animate" style={{ background: `linear-gradient(135deg, ${c.accent}, ${c.accentLight})` }}>
              <div className="flex items-center gap-0.5 mb-1.5">{[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-yellow-300 text-yellow-300" />)}</div>
              <h1 className="text-lg font-black text-white leading-tight mb-1 wp-font-heading">{c.heroHeadline}</h1>
              <p className="text-[10px] text-white/85 leading-relaxed mb-2">{c.heroSubhead}</p>
              <button className="text-[11px] font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 bg-white shadow-md wp-pulse-ring" style={{ color: c.accent }}>
                <Phone className="w-3 h-3" /> Call Now
              </button>
            </div>
            <div className="w-1/2 relative overflow-hidden">
              <img src={c.heroImg.replace("w=800", "w=1200").replace("q=80", "q=90")} alt={industry || "Professional services"} className="absolute inset-0 w-full h-full object-cover" />
            </div>
          </div>
        ) : (
          <>
            <img src={c.heroImg.replace("w=800", "w=1200").replace("q=80", "q=90")} alt={industry || "Professional services"} className="absolute inset-0 w-full h-full object-cover" />
            <div className={`absolute inset-0 ${heroLayout === "center" ? "bg-black/65" : "bg-gradient-to-r from-black/85 via-black/55 to-transparent"}`} />
            <div className={`relative h-full flex flex-col justify-center px-5 z-10 ${heroLayout === "center" ? "items-center text-center" : "max-w-md"}`}>
              <div className="inline-flex items-center gap-1 mb-2 wp-fade-up" style={{ animationDelay: "0.1s" }}>
                <div className="flex items-center gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}</div>
                <span className="text-[9px] text-white/85 font-bold">{c.rating} · {c.reviews} reviews</span>
              </div>
              <h1 className="text-xl font-black text-white leading-tight mb-1.5 wp-font-heading wp-fade-up" style={{ animationDelay: "0.2s" }}>{c.heroHeadline}</h1>
              <p className="text-[11px] text-white/85 leading-relaxed mb-3 wp-fade-up" style={{ animationDelay: "0.3s" }}>{c.heroSubhead}</p>
              <div className="flex items-center gap-2 wp-fade-up" style={{ animationDelay: "0.4s" }}>
                <button className="text-[11px] font-bold text-white px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-lg wp-pulse-ring" style={{ background: `linear-gradient(135deg, ${c.accent}, ${c.accentLight})` }}>
                  <Phone className="w-3 h-3" /> Call Now
                </button>
                <button className="text-[11px] font-bold text-white border border-white/40 px-4 py-2 rounded-lg wp-glass-dark">
                  Free Estimate
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="flex items-center justify-around px-4 py-3 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white wp-font-body">
        <div className="text-center wp-fade-up" style={{ animationDelay: "0.5s" }}>
          <Shield className="w-4 h-4 mx-auto mb-0.5" style={{ color: c.accent }} />
          <div className="text-[9px] font-black text-gray-900">{c.trustBadge}</div>
          <div className="text-[8px] text-gray-400">{c.trustLabel}</div>
        </div>
        <div className="w-px h-8 bg-gray-200" />
        <div className="text-center wp-fade-up" style={{ animationDelay: "0.55s" }}>
          <Award className="w-4 h-4 mx-auto mb-0.5" style={{ color: c.accent }} />
          <div className="text-[9px] font-black text-gray-900">Licensed</div>
          <div className="text-[8px] text-gray-400">& Insured</div>
        </div>
        <div className="w-px h-8 bg-gray-200" />
        <div className="text-center wp-fade-up" style={{ animationDelay: "0.6s" }}>
          <ThumbsUp className="w-4 h-4 mx-auto mb-0.5" style={{ color: c.accent }} />
          <div className="text-[9px] font-black text-gray-900">{c.rating}★ Rating</div>
          <div className="text-[8px] text-gray-400">{c.reviews}+ Reviews</div>
        </div>
      </section>
    </>
  );
}