import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export default function PreviewFaq({ c, industry }) {
  const [open, setOpen] = useState(0);
  const faqs = [
    { q: `How much does ${industry?.toLowerCase() || "the service"} cost?`, a: "We offer free, no-obligation estimates with transparent upfront pricing. Costs vary based on scope — call for a personalized quote today." },
    { q: "How quickly can you come out?", a: "Same-day service is available for most calls. Emergency response 24/7 for urgent situations." },
    { q: "Are you licensed and insured?", a: "Yes — fully licensed, bonded, and insured for your complete protection and peace of mind." },
    { q: "Do you guarantee your work?", a: "Absolutely. Every project is backed by our satisfaction guarantee and comprehensive warranty." },
  ];
  return (
    <section className="px-4 py-5 bg-gray-50 wp-font-body">
      <div className="text-center mb-3">
        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: c.accent }}>FAQ</span>
        <h2 className="text-base font-black text-gray-900 mt-0.5 wp-font-heading">Common Questions</h2>
        <div className="w-8 h-0.5 mx-auto mt-1 rounded-full" style={{ background: `linear-gradient(90deg, ${c.accent}, ${c.accentLight})` }} />
      </div>
      <div className="space-y-2 wp-stagger">
        {faqs.map((f, i) => (
          <div key={i} className="rounded-xl bg-white border border-gray-100 overflow-hidden wp-card-hover">
            <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center gap-2 p-3 text-left">
              <HelpCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: c.accent }} />
              <span className="text-[10px] font-bold text-gray-900 flex-1">{f.q}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${open === i ? "rotate-180" : ""}`} />
            </button>
            {open === i && (
              <div className="wp-accordion">
                <p className="text-[9px] text-gray-600 leading-relaxed px-3 pb-3 pl-8">{f.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}