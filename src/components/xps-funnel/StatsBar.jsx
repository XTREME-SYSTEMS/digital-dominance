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
    <section className="empire-dark relative overflow-hidden py-12">
      <div className="empire-grid-overlay" />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(99,102,241,.12), transparent 60%)" }} />
      <div className="relative z-10 max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        {STATS.map((s, i) => (
          <div key={i} className="text-center group cursor-default">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 transition-all group-hover:scale-110" style={{ background: "rgba(99,102,241,.1)", border: "1px solid rgba(129,140,248,.25)" }}>
              <s.icon className="h-6 w-6 text-indigo-400" />
            </div>
            <div className="text-3xl md:text-4xl font-black empire-stat-num">{s.value}</div>
            <div className="empire-label-light mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}