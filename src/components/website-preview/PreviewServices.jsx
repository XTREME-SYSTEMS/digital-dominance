import React from "react";
import { Check, ArrowRight } from "lucide-react";

export default function PreviewServices({ c }) {
  return (
    <section className="px-4 py-5 wp-font-body">
      <div className="text-center mb-4">
        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: c.accent }}>What We Do</span>
        <h2 className="text-base font-black text-gray-900 mt-0.5 wp-font-heading">Our Services</h2>
        <div className="w-8 h-0.5 mx-auto mt-1 rounded-full" style={{ background: `linear-gradient(90deg, ${c.accent}, ${c.accentLight})` }} />
      </div>
      <div className="grid grid-cols-2 gap-2.5 wp-stagger">
        {c.services.map((s, i) => (
          <div key={i} className="rounded-xl border border-gray-100 p-3 wp-card-hover wp-glass relative overflow-hidden" style={{ borderTop: `2px solid ${c.accent}` }}>
            <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full opacity-5" style={{ background: c.accent }} />
            <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-1.5 shadow-sm" style={{ background: `linear-gradient(135deg, ${c.accent}20, ${c.accentLight}30)` }}>
              <Check className="w-3.5 h-3.5" style={{ color: c.accent }} />
            </div>
            <h3 className="text-[11px] font-bold text-gray-900 mb-0.5">{s.title}</h3>
            <p className="text-[9px] text-gray-500 leading-tight">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}