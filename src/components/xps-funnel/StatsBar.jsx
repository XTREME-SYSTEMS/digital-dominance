import React from "react";
import { Award, Users, Wrench, MapPin } from "lucide-react";

const STATS = [
  { icon: Award, value: "#1", label: "National Distributor" },
  { icon: Users, value: "2,400+", label: "Projects Completed" },
  { icon: Wrench, value: "20+", label: "Years Experience" },
  { icon: MapPin, value: "50", label: "States Served" },
];

export default function StatsBar() {
  return (
    <section className="bg-white py-10 border-b border-stone-100">
      <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        {STATS.map((s, i) => (
          <div key={i} className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-stone-100 mb-3">
              <s.icon className="h-6 w-6 text-stone-700" />
            </div>
            <div className="text-3xl md:text-4xl font-black xps-gold-text">{s.value}</div>
            <div className="text-xs text-stone-500 font-bold uppercase tracking-wide mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}