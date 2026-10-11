import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Brain, Workflow, Settings, Code2,
  BarChart3, MessageSquare, Globe
} from "lucide-react";
import SmaiHeader from "@/components/smai/SmaiHeader";

const SERVICES = [
  { icon: Brain, title: "AI Agents", desc: "Autonomous agents that execute complex tasks" },
  { icon: Workflow, title: "Workflow Automation", desc: "Connect your tools into intelligent pipelines" },
  { icon: Settings, title: "Business Process Automation", desc: "Eliminate repetitive work with smart automation" },
  { icon: Code2, title: "Custom AI Software Solutions", desc: "Purpose-built applications powered by AI" },
  { icon: BarChart3, title: "CRM & Lead Systems", desc: "Intelligent lead scoring and pipeline management" },
  { icon: MessageSquare, title: "AI Chatbots & Knowledge Systems", desc: "24/7 intelligent support and knowledge bases" },
  { icon: Globe, title: "AI-Powered Websites", desc: "Self-optimizing sites that rank and convert" },
];

export default function CustomSystems() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#00050A] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,170,255,0.08),_transparent_60%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_at_bottom,_rgba(0,130,255,0.10),_transparent_70%)]" />

      <SmaiHeader />

      <div className="relative z-10 flex flex-col items-center px-4 sm:px-8 pb-16">
        <h2
          className="text-xl sm:text-3xl font-black tracking-tight text-center bg-gradient-to-b from-white via-gray-200 to-gray-500 bg-clip-text text-transparent"
        >
          CUSTOM AI SYSTEMS & AUTOMATION
        </h2>
        <p className="mt-3 text-xs sm:text-sm font-bold uppercase tracking-widest text-white/50 text-center">
          Streamline Operations. Amplify Productivity.
        </p>

        <div className="mt-10 sm:mt-12 w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICES.map((s, i) => (
            <div
              key={i}
              className="group relative rounded-2xl border border-[#00D4FF]/15 bg-white/[0.02] backdrop-blur-sm p-5 transition hover:border-[#00D4FF]/40 hover:bg-[#00D4FF]/[0.04] hover:shadow-[0_0_24px_-4px_rgba(0,212,255,0.3)]"
            >
              <div className="w-11 h-11 rounded-full border-2 border-[#00D4FF]/40 flex items-center justify-center mb-3 transition group-hover:border-[#00D4FF] group-hover:shadow-[0_0_16px_rgba(0,212,255,0.3)]">
                <s.icon className="w-5 h-5 text-[#00D4FF]" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-bold text-white tracking-wide">{s.title}</h3>
              <p className="text-xs text-white/40 mt-1">{s.desc}</p>
            </div>
          ))}
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