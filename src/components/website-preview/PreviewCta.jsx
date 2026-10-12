import React from "react";
import { Phone, Star, Clock } from "lucide-react";

export default function PreviewCta({ c }) {
  return (
    <section className="relative px-4 py-6 text-center overflow-hidden wp-font-body">
      <div className="absolute inset-0 wp-gradient-animate" style={{ background: `linear-gradient(135deg, ${c.accent}, ${c.accentLight}, ${c.accent})` }} />
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 wp-float" style={{ background: "white", filter: "blur(16px)" }} />
      <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full opacity-15 wp-float-slow" style={{ background: "white", filter: "blur(14px)" }} />
      <div className="relative z-10">
        <div className="flex items-center justify-center gap-0.5 mb-2">{[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-yellow-300 text-yellow-300" />)}</div>
        <h2 className="text-lg font-black text-white mb-1 wp-font-heading">Ready to Get Started?</h2>
        <p className="text-[10px] text-white/85 mb-3">Free consultation. Same-day appointments. Satisfaction guaranteed.</p>
        <button className="inline-flex items-center gap-1.5 bg-white text-[12px] font-bold px-5 py-2.5 rounded-xl shadow-lg wp-pulse-ring" style={{ color: c.accent }}>
          <Phone className="w-3.5 h-3.5" /> {c.phone}
        </button>
        <div className="flex items-center justify-center gap-1 text-[9px] text-white/70 mt-2">
          <Clock className="w-2.5 h-2.5" /> Open Now · Responds in ~5 min
        </div>
      </div>
    </section>
  );
}