import React from "react";
import { Link } from "react-router-dom";
import { Cpu, Zap, Shield, Globe, Bot, Code2, Cloud, Database, ArrowRight, Rocket, Phone } from "lucide-react";

const AGENTS = [
  { name: "APEX Orchestrator", role: "Master brain — routes all work" },
  { name: "Build Factory", role: "Turns definitions into production websites" },
  { name: "Visual Factory", role: "99% visual parity, brand-locked design" },
  { name: "Provider Adapters", role: "Vercel, Supabase, GitHub, GoDaddy, Google" },
  { name: "Scale Fleet", role: "Mass-produces sites from validated templates" },
  { name: "Social Media Manager", role: "Content, scheduling, posting, engagement" },
  { name: "Email Manager", role: "Creates, sends, responds to emails" },
  { name: "Validation Guardian", role: "Independent validation — no self-certification" },
  { name: "System Monitor", role: "24/7 monitoring, auto-healing" },
  { name: "Bottleneck Hunter", role: "Finds and removes restrictions" },
  { name: "Benchmark Scout", role: "Models the best websites in existence" },
  { name: "Sync Guardian", role: "Keeps all systems in sync" },
];

const CAPABILITIES = [
  { icon: Cpu, title: "12 Super Agents", desc: "Autonomous AI agents that build, validate, deploy, and manage — without human intervention" },
  { icon: Zap, title: "Autonomous Pipeline", desc: "Type what you want. The system researches, brands, builds, deploys, and validates — end to end" },
  { icon: Globe, title: "Programmatic SEO", desc: "Generate 100+ websites by state, city, and industry — each with full SEO/AEO/GEO schema" },
  { icon: Bot, title: "Social Media Automation", desc: "30-day calendars, viral videos, scheduled posts — all generated and published automatically" },
  { icon: Cloud, title: "Full Stack Provisioning", desc: "Vercel, Supabase, GitHub, Railway, GoDaddy — deployed and synced automatically" },
  { icon: Shield, title: "3x Validation", desc: "Every site passes 3 independent validation cycles before release" },
  { icon: Code2, title: "Code Studio", desc: "Image-to-code ingestion, visual editor, direct site editing" },
  { icon: Database, title: "120+ Entities", desc: "Full data model covering every aspect of digital dominance" },
];

export default function Tech() {
  return (
    <div className="min-h-screen bg-[#0a1220] text-white">
      <nav className="flex items-center justify-between px-6 py-4 md:px-12 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#00a2ff] to-[#0066cc]">
            <Rocket className="h-5 w-5 text-white" />
          </div>
          <div className="leading-none">
            <span className="block text-sm font-extrabold tracking-tight text-white">Website Launch Engine</span>
            <span className="block text-[9px] font-bold uppercase tracking-[0.15em] text-[#00a2ff]">Florida Based · Nationwide</span>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/templates" className="text-xs font-bold tracking-wider text-white/60 hover:text-[#00a2ff]">TEMPLATES</Link>
          <Link to="/pricing" className="text-xs font-bold tracking-wider text-white/60 hover:text-[#00a2ff]">PRICING</Link>
          <a href="tel:+17722090266" className="flex items-center gap-2 rounded-full bg-[#00a2ff] px-4 py-2 text-xs font-bold text-white shadow-[0_0_20px_rgba(0,162,255,0.4)] transition hover:bg-[#0090e0]">
            <Phone className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">(772) 209-0266</span>
          </a>
          <Link to="/portal" className="flex items-center gap-2 rounded-lg border border-[#00a2ff]/50 px-4 py-2 text-xs font-bold tracking-wider text-[#00a2ff] hover:bg-[#00a2ff]/10">PORTAL</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black tracking-wide mb-4">THE <span className="text-[#00a2ff]">TECHNOLOGY</span></h1>
          <p className="text-white/50 max-w-2xl mx-auto text-lg">A full autonomous digital dominance engine — 12 AI agents, 100+ backend functions, 120+ data entities, and complete infrastructure provisioning.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
          {CAPABILITIES.map((cap) => (
            <div key={cap.title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 hover:border-[#00a2ff]/50 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#00a2ff]/30 mb-4" style={{ background: "radial-gradient(circle, rgba(0,229,255,0.1), transparent)" }}>
                <cap.icon className="h-6 w-6 text-[#00a2ff]" />
              </div>
              <h3 className="text-sm font-bold mb-2">{cap.title}</h3>
              <p className="text-xs text-white/50 leading-relaxed">{cap.desc}</p>
            </div>
          ))}
        </div>

        <div className="mb-20">
          <h2 className="text-2xl font-black tracking-wide mb-8 text-center">THE <span className="text-[#00a2ff]">12 SUPER AGENTS</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AGENTS.map((agent, i) => (
              <div key={agent.name} className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:border-[#00a2ff]/30 transition">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#00a2ff]/30 text-xs font-black text-[#00a2ff]">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div>
                  <h3 className="text-sm font-bold">{agent.name}</h3>
                  <p className="text-xs text-white/40">{agent.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center rounded-2xl border border-[#00a2ff]/30 bg-[#00a2ff]/5 p-12">
          <h2 className="text-2xl font-black mb-4">SEE IT IN ACTION</h2>
          <p className="text-white/50 mb-6">Enter the portal and type what you want to build. The AI handles the rest.</p>
          <Link to="/portal" className="inline-flex items-center gap-2 rounded-full bg-[#00a2ff] px-8 py-4 text-sm font-bold tracking-wider text-black hover:bg-[#00a2ff]/80 transition">
            ENTER PORTAL <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}