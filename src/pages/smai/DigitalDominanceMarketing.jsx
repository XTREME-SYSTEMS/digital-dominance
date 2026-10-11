import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Cpu, Settings, BarChart3 } from "lucide-react";
import SmaiHeader from "@/components/smai/SmaiHeader";

const ICONS = [
  { icon: Cpu, label: "Strategy" },
  { icon: Settings, label: "Automation" },
  { icon: BarChart3, label: "Growth" },
];

export default function DigitalDominanceMarketing() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#00050A] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,170,255,0.10),_transparent_60%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_at_bottom,_rgba(0,130,255,0.12),_transparent_70%)]" />

      <SmaiHeader />

      <div className="relative z-10 flex flex-col items-center px-4 sm:px-8 pb-16">
        <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white text-center">
          TURN IDEAS INTO
        </h2>
        <h2
          className="text-2xl sm:text-4xl font-black tracking-tight text-center bg-gradient-to-r from-[#00D4FF] to-[#00A3FF] bg-clip-text text-transparent"
          style={{ textShadow: "0 0 40px rgba(0,212,255,0.4)" }}
        >
          INTELLIGENT SYSTEMS
        </h2>

        <div className="mt-10 sm:mt-14 flex items-center gap-6 sm:gap-12">
          {ICONS.map((item, i) => (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-[#00D4FF]/40 flex items-center justify-center backdrop-blur-sm transition hover:border-[#00D4FF] hover:shadow-[0_0_24px_rgba(0,212,255,0.4)]"
                  style={{ background: "rgba(0,20,40,0.4)" }}
                >
                  <item.icon className="w-6 h-6 sm:w-7 sm:h-7 text-[#00D4FF]" strokeWidth={1.5} />
                </div>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/60">
                  {item.label}
                </span>
              </div>
              {i < ICONS.length - 1 && (
                <div className="h-px w-6 sm:w-10 bg-gradient-to-r from-[#00D4FF]/30 to-[#00D4FF]/10" />
              )}
            </React.Fragment>
          ))}
        </div>

        <Link
          to="/admin"
          className="group mt-12 sm:mt-16 inline-flex items-center gap-3 rounded-full border-2 border-[#00D4FF] bg-[#00D4FF]/10 px-6 py-3 sm:px-8 sm:py-3.5 backdrop-blur-sm shadow-[0_0_30px_rgba(0,212,255,0.45)] transition hover:bg-[#00D4FF]/20 hover:shadow-[0_0_55px_rgba(0,212,255,0.7)]"
        >
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-white">
            Build Smarter. <span className="text-[#00D4FF]">Grow Faster.</span>
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00D4FF] text-black transition group-hover:translate-x-1">
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>
    </div>
  );
}