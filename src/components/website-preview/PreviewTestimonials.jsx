import React from "react";
import { Star, Quote } from "lucide-react";

export default function PreviewTestimonials({ c }) {
  return (
    <section className="px-4 py-5 wp-font-body">
      <div className="text-center mb-3">
        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: c.accent }}>Testimonials</span>
        <h2 className="text-base font-black text-gray-900 mt-0.5 wp-font-heading">What Clients Say</h2>
        <div className="w-8 h-0.5 mx-auto mt-1 rounded-full" style={{ background: `linear-gradient(90deg, ${c.accent}, ${c.accentLight})` }} />
      </div>
      <div className="space-y-2 wp-stagger">
        {c.testimonials.map((t, i) => (
          <div key={i} className="rounded-xl p-3 wp-glass wp-card-hover relative overflow-hidden" style={{ borderLeft: `3px solid ${c.accent}` }}>
            <Quote className="absolute top-2 right-2 w-5 h-5 opacity-10" style={{ color: c.accent }} />
            <div className="flex items-center gap-0.5 mb-1">
              {[...Array(5)].map((_, j) => <Star key={j} className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />)}
            </div>
            <p className="text-[10px] text-gray-700 italic mb-1.5 leading-relaxed">"{t.text}"</p>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm" style={{ background: `linear-gradient(135deg, ${c.accent}, ${c.accentLight})` }}>
                {t.name[0]}
              </div>
              <div>
                <div className="text-[9px] font-bold text-gray-900">{t.name}</div>
                <div className="text-[8px] text-gray-400">{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}