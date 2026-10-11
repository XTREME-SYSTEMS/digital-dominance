import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Search, MessageCircle, Share2, TrendingUp,
  FileText, Compass, LineChart
} from "lucide-react";
import SmaiHeader from "@/components/smai/SmaiHeader";
import ServiceList from "@/components/smai/ServiceList";

const SERVICES = [
  { icon: Search, title: "SEO Strategy", desc: "Rank higher and capture organic traffic" },
  { icon: MessageCircle, title: "AEO (Answer Engine Optimization)", desc: "Get cited by AI answer engines" },
  { icon: Share2, title: "GEO (Generative Engine Optimization)", desc: "Appear in generative AI responses" },
  { icon: TrendingUp, title: "Digital Growth Strategy", desc: "Data-driven roadmaps for scaling" },
  { icon: FileText, title: "Content & Knowledge Optimization", desc: "Content that ranks and converts" },
  { icon: Compass, title: "Search & Discovery Visibility", desc: "Be found everywhere your customers look" },
  { icon: LineChart, title: "Long-Term Business Growth", desc: "Sustainable compounding growth systems" },
];

export default function AiPoweredGrowth() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#00050A] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,170,255,0.08),_transparent_60%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(0,130,255,0.12),_transparent_70%)]" />

      <SmaiHeader />

      <div className="relative z-10 flex flex-col items-center px-4 sm:px-8 pb-16">
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
          AI-POWERED
        </h2>
        <h2
          className="text-3xl sm:text-5xl font-black tracking-tight text-[#00D4FF]"
          style={{ textShadow: "0 0 40px rgba(0,212,255,0.5)" }}
        >
          GROWTH
        </h2>
        <p className="mt-3 text-sm text-white/60 text-center">
          More Visibility. More Opportunities.
        </p>

        <div className="mt-10 sm:mt-14 w-full max-w-3xl flex flex-col lg:flex-row gap-8 lg:gap-12">
          <div className="flex-1">
            <ServiceList services={SERVICES} />
          </div>
          <div className="hidden lg:flex flex-1 items-center justify-center">
            <div
              className="relative w-56 h-56 rounded-full border-2 border-[#00D4FF]/20 flex items-center justify-center"
              style={{ boxShadow: "0 0 60px rgba(0,212,255,0.15), inset 0 0 40px rgba(0,212,255,0.08)" }}
            >
              <div className="absolute inset-6 rounded-full border border-[#00D4FF]/10" />
              <Search className="w-16 h-16 text-[#00D4FF]/60" strokeWidth={1} />
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