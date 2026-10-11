import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Lightbulb, Boxes, Network, BarChart3, ShieldCheck } from "lucide-react";
import SmaiHeader from "@/components/smai/SmaiHeader";
import ServiceList from "@/components/smai/ServiceList";

const SERVICES = [
  { icon: Lightbulb, title: "AI Readiness & Strategy", desc: "Assess your organization's AI maturity and roadmap" },
  { icon: Boxes, title: "Solution Architecture", desc: "Design scalable AI systems tailored to your needs" },
  { icon: Network, title: "Business Process Design", desc: "Map and optimize workflows for AI integration" },
  { icon: BarChart3, title: "Data & Intelligence Strategy", desc: "Build the data foundation for AI success" },
  { icon: ShieldCheck, title: "Responsible AI Implementation", desc: "Deploy AI with governance and compliance" },
];

export default function AiStrategy() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#00050A] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,170,255,0.08),_transparent_60%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(0,130,255,0.10),_transparent_70%)]" />

      <SmaiHeader />

      <div className="relative z-10 flex flex-col items-center px-4 sm:px-8 pb-16">
        <h2
          className="text-2xl sm:text-4xl font-black tracking-tight text-center bg-gradient-to-b from-white via-gray-200 to-gray-500 bg-clip-text text-transparent"
          style={{ textShadow: "0 0 30px rgba(0,212,255,0.2)" }}
        >
          AI STRATEGY & CONSULTING
        </h2>
        <p className="mt-3 text-sm sm:text-base text-white/60 text-center">
          Turning Possibilities Into Practical Solutions
        </p>

        <div className="mt-10 sm:mt-14 w-full max-w-3xl flex flex-col lg:flex-row gap-8 lg:gap-12">
          <div className="flex-1">
            <ServiceList services={SERVICES} />
          </div>
          <div className="hidden lg:flex flex-1 items-center justify-center">
            <div
              className="relative w-64 h-64 rounded-full border border-[#00D4FF]/20 flex items-center justify-center"
              style={{ boxShadow: "0 0 80px rgba(0,212,255,0.15), inset 0 0 60px rgba(0,212,255,0.08)" }}
            >
              <div className="absolute inset-8 rounded-full border border-[#00D4FF]/10" />
              <div className="absolute inset-16 rounded-full border border-[#00D4FF]/10" />
              <span className="text-6xl font-black bg-gradient-to-b from-[#00D4FF] to-[#00A3FF] bg-clip-text text-transparent">
                AI
              </span>
            </div>
          </div>
        </div>

        <Link
          to="/admin"
          className="group mt-12 inline-flex items-center gap-3 rounded-full border-2 border-[#00D4FF] bg-[#00D4FF]/10 px-6 py-3 backdrop-blur-sm shadow-[0_0_30px_rgba(0,212,255,0.45)] transition hover:bg-[#00D4FF]/20"
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