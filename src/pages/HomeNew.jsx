import React from "react";
import { Link } from "react-router-dom";
import { Phone, Cpu, Settings2, TrendingUp, Target, ArrowRight } from "lucide-react";

const SERVICES = [
  { label: "AI STRATEGY", icon: Cpu },
  { label: "CUSTOMIZATION", icon: Settings2 },
  { label: "AUTOMATION", icon: TrendingUp },
  { label: "GROWTH", icon: Target },
];

export default function HomeNew() {
  return (
    <div className="min-h-screen bg-[#050508] text-white overflow-x-hidden flex flex-col">
      {/* Nebula background */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: `
          radial-gradient(ellipse at 20% 30%, rgba(0, 80, 180, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 70%, rgba(0, 229, 255, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 50%, rgba(20, 20, 40, 0.3) 0%, transparent 70%),
          #050508
        `,
      }} />
      <div className="fixed inset-0 pointer-events-none opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
      }} />

      {/* Nav bar */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-5 md:px-12">
        <Link to="/templates" className="flex items-center gap-2 rounded-full border border-white/20 px-5 py-2 text-xs font-bold tracking-wider text-white/80 hover:border-[#00E5FF] hover:text-[#00E5FF] transition">
          TEMPLATES
        </Link>
        <a href="tel:+15555550100" className="flex items-center gap-2 rounded-full border border-[#00E5FF]/50 px-5 py-2 text-xs font-bold tracking-wider text-[#00E5FF] hover:bg-[#00E5FF]/10 transition">
          <Phone className="h-3.5 w-3.5" />
          CALL NOW
        </a>
      </nav>

      {/* Hero — centered, fills viewport */}
      <section className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 text-center" style={{ minHeight: "calc(100vh - 80px)" }}>
        {/* Logo with glow ring */}
        <div className="relative mb-10">
          <div className="absolute inset-0 rounded-full blur-3xl" style={{
            background: "radial-gradient(circle, rgba(0,229,255,0.35) 0%, transparent 70%)",
            width: "220px", height: "220px",
            left: "50%", top: "50%", transform: "translate(-50%,-50%)",
          }} />
          <div className="relative flex h-32 w-32 items-center justify-center rounded-full border border-[#00E5FF]/30" style={{
            background: "radial-gradient(circle at 30% 30%, rgba(0,229,255,0.12), transparent 70%)",
            boxShadow: "0 0 60px rgba(0,229,255,0.15), inset 0 0 30px rgba(0,229,255,0.05)",
          }}>
            <span className="text-7xl font-black" style={{
              background: "linear-gradient(135deg, #e8e8e8 0%, #a0a0a0 30%, #ffffff 50%, #a0a0a0 70%, #e8e8e8 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 20px rgba(0,229,255,0.4))",
            }}>S</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-wider mb-4" style={{
          background: "linear-gradient(135deg, #c0c0c0 0%, #a0a0a0 30%, #ffffff 50%, #a0a0a0 70%, #c0c0c0 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>STRATEGIC MINDS AI</h1>

        {/* Subtitle with lines */}
        <div className="flex items-center gap-4 mb-14">
          <div className="h-px w-12 md:w-24 bg-gradient-to-r from-transparent to-white/30" />
          <p className="text-xs md:text-sm font-medium tracking-[0.3em] text-white/60">INTELLIGENCE IN MOTION</p>
          <div className="h-px w-12 md:w-24 bg-gradient-to-l from-transparent to-white/30" />
        </div>

        {/* Service icons row */}
        <div className="flex items-center justify-center gap-4 md:gap-12 mb-14">
          {SERVICES.map((svc, i) => (
            <React.Fragment key={svc.label}>
              <div className="flex flex-col items-center gap-3">
                <div className="relative flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full border border-[#00E5FF]/30 hover:border-[#00E5FF] transition" style={{
                  background: "radial-gradient(circle at 30% 30%, rgba(0,229,255,0.1), transparent 70%)",
                  boxShadow: "0 0 20px rgba(0,229,255,0.08)",
                }}>
                  <svc.icon className="h-6 w-6 md:h-8 md:w-8 text-[#00E5FF]" />
                </div>
                <span className="text-[10px] md:text-xs font-bold tracking-wider text-white/70">{svc.label}</span>
              </div>
              {i < SERVICES.length - 1 && <div className="h-16 w-px bg-white/10 hidden md:block" />}
            </React.Fragment>
          ))}
        </div>

        {/* CTA */}
        <Link to="/admin" className="group flex items-center gap-3 rounded-full border border-[#00E5FF]/50 px-8 py-4 text-sm font-bold tracking-wider text-white hover:bg-[#00E5FF]/10 transition" style={{ boxShadow: "0 0 30px rgba(0,229,255,0.12)" }}>
          BUILD SMARTER. GROW FASTER.
          <ArrowRight className="h-4 w-4 text-[#00E5FF] group-hover:translate-x-1 transition" />
        </Link>
      </section>
    </div>
  );
}