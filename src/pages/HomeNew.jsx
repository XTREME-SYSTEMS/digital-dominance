import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Cpu, Settings, BarChart3, Target, Phone } from "lucide-react";
import SmaiLogo from "@/components/smai/SmaiLogo";

const SERVICES = [
  { to: "/ai-strategy", icon: Cpu, label: "AI Strategy" },
  { to: "/custom-ai-systems", icon: Settings, label: "Custom Systems" },
  { to: "/ai-powered-growth", icon: BarChart3, label: "Automation" },
  { to: "/digital-dominance-system", icon: Target, label: "Growth" },
];

export default function HomeNew() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#00050A] text-white flex">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,170,255,0.10),_transparent_60%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_at_bottom,_rgba(0,130,255,0.12),_transparent_70%)]" />

      {/* Call Now — top right */}
      <a
        href="tel:+15555550100"
        className="absolute right-4 top-4 z-30 inline-flex items-center gap-2 rounded-full border-2 border-[#00D4FF]/40 bg-[#00D4FF]/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/60 backdrop-blur-sm transition hover:border-[#00D4FF] hover:text-white sm:px-4 sm:py-2 sm:text-xs"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#00D4FF] text-black">
          <Phone className="h-3 w-3" />
        </span>
        Call Now
      </a>

      {/* Left sidebar — vertical service buttons */}
      <div className="relative z-20 flex flex-col gap-4 sm:gap-5 p-4 sm:p-6 w-[160px] sm:w-[200px] justify-center">
        {SERVICES.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className="group flex items-center gap-3"
          >
            <div className="relative w-11 h-11 rounded-full border-2 border-[#00D4FF]/40 flex items-center justify-center shrink-0 transition group-hover:border-[#00D4FF] group-hover:shadow-[0_0_20px_rgba(0,212,255,0.3)]">
              <s.icon className="w-5 h-5 text-[#00D4FF]" strokeWidth={1.5} />
            </div>
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-white/50 group-hover:text-white transition">
              {s.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Center content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 text-center pb-16">
        <SmaiLogo size={64} className="sm:!w-20 sm:!h-20" />
        <h1 className="mt-4 text-lg sm:text-2xl font-black tracking-[0.15em] text-white">
          STRATEGIC MINDS AI
        </h1>
        <div className="flex items-center gap-3 mt-2">
          <div className="h-px w-10 bg-gradient-to-r from-transparent to-[#00D4FF]/50" />
          <span className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.3em] text-white/40">
            Intelligence In Motion
          </span>
          <div className="h-px w-10 bg-gradient-to-l from-transparent to-[#00D4FF]/50" />
        </div>

        <div className="mt-10 sm:mt-14">
          <h2 className="text-2xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            We Build Intelligent
          </h2>
          <h2
            className="text-2xl sm:text-5xl font-black tracking-tight text-[#00D4FF] leading-tight"
            style={{ textShadow: "0 0 40px rgba(0,212,255,0.5)" }}
          >
            Business Systems.
          </h2>
        </div>

        <Link
          to="/admin"
          className="group mt-10 sm:mt-14 inline-flex items-center gap-3 rounded-full border-2 border-[#00D4FF] bg-[#00D4FF]/10 px-5 py-3 sm:px-7 sm:py-3.5 backdrop-blur-sm shadow-[0_0_30px_rgba(0,212,255,0.45)] transition hover:bg-[#00D4FF]/20 hover:shadow-[0_0_55px_rgba(0,212,255,0.7)]"
        >
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-white">
            Build Smarter. <span className="text-[#00D4FF]">Grow Faster.</span>
          </span>
          <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-[#00D4FF] text-black transition group-hover:translate-x-1">
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      </div>
    </div>
  );
}