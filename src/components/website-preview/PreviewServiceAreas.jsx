import React from "react";
import { MapPin, Navigation } from "lucide-react";

export default function PreviewServiceAreas({ c }) {
  const areas = ["Downtown", "Midtown", "Uptown", "Eastside", "Westside", "Northside", "Southside", "Metro Area", "Suburbs", "Riverside"];
  return (
    <section className="px-4 py-5 wp-font-body">
      <div className="text-center mb-3">
        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: c.accent }}>Service Areas</span>
        <h2 className="text-base font-black text-gray-900 mt-0.5 wp-font-heading">Areas We Serve</h2>
        <div className="w-8 h-0.5 mx-auto mt-1 rounded-full" style={{ background: `linear-gradient(90deg, ${c.accent}, ${c.accentLight})` }} />
      </div>
      <div className="flex flex-wrap gap-1.5 justify-center wp-stagger">
        {areas.map((a, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-semibold wp-glass wp-card-hover" style={{ border: `1px solid ${c.accent}30`, color: c.accent }}>
            <MapPin className="w-2.5 h-2.5" /> {a}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5 text-[9px] text-gray-400">
        <Navigation className="w-3 h-3" /> Don't see your area? Call us — we're expanding!
      </div>
    </section>
  );
}