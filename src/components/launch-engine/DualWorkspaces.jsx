import React from "react";
import { Settings, Gem, CheckCircle2, X, Shield, Zap, Brain, BarChart3, Bell } from "lucide-react";

const ADMIN_FEATURES = [
  "Full website catalog & launch queue management",
  "Autonomous super agent orchestration",
  "Real-time SEO/AEO/GEO scoring dashboard",
  "God Mode optimizer with deterministic path-to-first-page",
  "Mass launch console for unlimited site scaling",
  "Automated system health monitoring & healing",
  "Gap analysis & competitive intelligence",
  "Eden Skye AI receptionist with Twilio + HeyGen",
];

const CLIENT_FEATURES = [
  "Business onboarding & project management",
  "Live lead inbox with AI qualification scoring",
  "Website approval center with preview",
  "Support ticket system with AI routing",
  "Project timeline & milestone tracking",
  "Performance analytics for your sites",
  "Branded communication portal",
  "Automated follow-up scheduling",
];

const OTHER_PROVIDERS = [
  "Manual SEO work required",
  "Single website per account",
  "No autonomous agents",
  "No competitive intelligence",
  "No AI-powered content enhancement",
  "No automated validation",
  "No mass launch capability",
  "No CRM or follow-up automation",
];

export default function DualWorkspaces() {
  return (
    <section id="portals" className="bg-gray-50 py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00a2ff] mb-2">BUILT FOR YOUR BUSINESS</p>
          <h2 className="text-3xl md:text-4xl font-black text-[#0a1220] mb-3">Why We Stand Apart</h2>
          <p className="text-[#6b7280] max-w-2xl mx-auto">Our admin control center and client workspace include capabilities no other provider offers. Here's what sets us apart and how each piece helps your business.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Admin Control Center */}
          <div className="rounded-2xl border-2 border-[#00a2ff]/20 bg-white p-7 hover:border-green-400/50 hover:shadow-[0_0_20px_-4px_rgba(34,197,94,0.3)] transition-all duration-300">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0a1220] to-[#1a2540]">
              <Settings className="h-7 w-7 text-[#00a2ff]" />
            </div>
            <h3 className="text-lg font-black text-[#0a1220] mb-2">Admin Control Center</h3>
            <p className="text-sm text-[#6b7280] mb-4">The command center our super agents use to run your entire digital business autonomously — 24/7, no manual work required.</p>
            <div className="space-y-2 mb-4">
              {ADMIN_FEATURES.map((f, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-[#374151]">{f}</span>
                </div>
              ))}
            </div>
            <a href="/admin" className="text-sm font-bold text-[#00a2ff] hover:underline">Explore Admin →</a>
          </div>

          {/* Client Workspace */}
          <div className="rounded-2xl border-2 border-[#00a2ff]/20 bg-white p-7 hover:border-green-400/50 hover:shadow-[0_0_20px_-4px_rgba(34,197,94,0.3)] transition-all duration-300">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0a1220] to-[#1a2540]">
              <Gem className="h-7 w-7 text-[#00a2ff]" />
            </div>
            <h3 className="text-lg font-black text-[#0a1220] mb-2">Client Workspace</h3>
            <p className="text-sm text-[#6b7280] mb-4">Your personalized portal to monitor projects, manage leads, approve websites, and track performance — all in one beautiful interface.</p>
            <div className="space-y-2 mb-4">
              {CLIENT_FEATURES.map((f, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-[#374151]">{f}</span>
                </div>
              ))}
            </div>
            <a href="/portal" className="text-sm font-bold text-[#00a2ff] hover:underline">Explore Client Portal →</a>
          </div>
        </div>

        {/* Comparison: What Others Don't Have */}
        <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-7">
          <h3 className="text-center text-lg font-black text-[#0a1220] mb-4">What Other Providers Don't Include</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {OTHER_PROVIDERS.map((item, i) => (
              <div key={i} className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 p-3">
                <X className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-[#6b7280]">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-green-600"><Shield className="h-4 w-4" /> Zero Points of Failure</div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#00a2ff]"><Zap className="h-4 w-4" /> Autonomous Operation</div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600"><Brain className="h-4 w-4" /> AI-Optimized CRM</div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600"><BarChart3 className="h-4 w-4" /> Guaranteed Validation</div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-pink-600"><Bell className="h-4 w-4" /> 3-Day Follow-Up Automation</div>
          </div>
        </div>
      </div>
    </section>
  );
}