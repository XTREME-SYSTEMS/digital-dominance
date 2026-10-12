import React from "react";
import { Zap, Shield, Award, Clock } from "lucide-react";

export default function PreviewAbout({ c }) {
  const features = [
    { icon: Zap, title: "Fast Response", desc: "Same-day service" },
    { icon: Shield, title: "Fully Insured", desc: "Your protection" },
    { icon: Award, title: "Experienced", desc: "Years of expertise" },
    { icon: Clock, title: "24/7 Available", desc: "Always ready" },
  ];
  return (
    <section className="px-4 py-5 bg-gradient-to-b from-gray-50 to-white wp-font-body">
      <div className="text-center mb-3">
        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: c.accent }}>About Us</span>
        <h2 className="text-base font-black text-gray-900 mt-0.5 wp-font-heading">Why Choose Us</h2>
        <div className="w-8 h-0.5 mx-auto mt-1 rounded-full" style={{ background: `linear-gradient(90deg, ${c.accent}, ${c.accentLight})` }} />
      </div>
      <p className="text-[10px] text-gray-600 leading-relaxed text-center mb-4 max-w-sm mx-auto">{c.about}</p>
      <div className="grid grid-cols-2 gap-2 wp-stagger">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-2 rounded-xl p-2.5 wp-glass wp-card-hover">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm" style={{ background: `linear-gradient(135deg, ${c.accent}20, ${c.accentLight}30)` }}>
              <f.icon className="w-4 h-4" style={{ color: c.accent }} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-900">{f.title}</div>
              <div className="text-[8px] text-gray-400">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}