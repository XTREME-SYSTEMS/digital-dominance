import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Cpu, Settings, BarChart3, Target } from "lucide-react";

const BG_IMAGE =
  "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/f82707753_FACEBOOKIMAGE2.png";

const SERVICES = [
  { to: "/ai-strategy", icon: Cpu, label: "AI Strategy" },
  { to: "/custom-ai-systems", icon: Settings, label: "Custom Systems" },
  { to: "/ai-powered-growth", icon: BarChart3, label: "Automation" },
  { to: "/digital-dominance-system", icon: Target, label: "Growth" },
];

export default function HomeNew() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* Full-screen image — 100% visual parity */}
      <img
        src={BG_IMAGE}
        alt="Strategic Minds AI — Intelligence In Motion"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Left sidebar — vertical service buttons (as requested) */}
      <div className="absolute left-0 top-0 bottom-0 z-10 w-[150px] sm:w-[190px] bg-black/30 backdrop-blur-md flex flex-col justify-center gap-5 p-4 sm:p-6 border-r border-[#00D4FF]/20">
        {SERVICES.map((s) => (
          <Link key={s.to} to={s.to} className="group flex items-center gap-3">
            <div className="w-11 h-11 rounded-full border-2 border-[#00D4FF]/50 flex items-center justify-center shrink-0 transition group-hover:border-[#00D4FF] group-hover:shadow-[0_0_20px_rgba(0,212,255,0.4)]">
              <s.icon className="w-5 h-5 text-[#00D4FF]" strokeWidth={1.5} />
            </div>
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-white/70 group-hover:text-white transition">
              {s.label}
            </span>
          </Link>
        ))}
      </div>

      {/* CTA — bottom center, clickable overlay */}
      <Link
        to="/admin"
        className="group absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-10 inline-flex items-center gap-3 rounded-full border-2 border-[#00D4FF] bg-[#00D4FF]/10 backdrop-blur-md px-6 py-3 shadow-[0_0_30px_rgba(0,212,255,0.5)] transition hover:bg-[#00D4FF]/20"
      >
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-white">
          Build Smarter. <span className="text-[#00D4FF]">Grow Faster.</span>
        </span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00D4FF] text-black transition group-hover:translate-x-1">
          <ArrowRight className="h-4 w-4" />
        </span>
      </Link>
    </div>
  );
}