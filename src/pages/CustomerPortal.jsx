import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Loader2, LayoutDashboard, Calendar, Wrench, MessageSquare,
  Sparkles, Palette, Gift, Phone, ChevronRight, Tag, Rocket, Lock
} from "lucide-react";
import BackButton from "@/components/BackButton";
import PortalDashboard from "@/components/portal/PortalDashboard";
import PortalTimeline from "@/components/portal/PortalTimeline";
import PortalMaintenance from "@/components/portal/PortalMaintenance";
import PortalMessages from "@/components/portal/PortalMessages";
import PortalSchedule from "@/components/portal/PortalSchedule";
import PortalAIChat from "@/components/portal/PortalAIChat";

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "timeline", label: "Timeline", icon: Calendar },
  { key: "maintenance", label: "Maintenance", icon: Wrench },
  { key: "messages", label: "Messages", icon: MessageSquare },
  { key: "schedule", label: "Schedule", icon: Sparkles },
];

export default function CustomerPortal() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [project, setProject] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState("lookup");
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    (async () => {
      try {
        const settingsList = await base44.entities.AppSettings.list("-created_date", 1);
        setSettings(settingsList?.[0] || null);
      } catch {}
    })();
  }, []);

  const findProject = async () => {
    setLoading(true);
    setError("");
    try {
      const query = email ? { client_email: email } : { client_phone: phone };
      const results = await base44.entities.ClientProject.filter(query, "-created_date", 5);
      if (results && results.length > 0) {
        setProject(results[0]);
        setView("project");
        loadUpdates(results[0].id);
      } else {
        setError("No project found with those details.");
      }
    } catch (e) {
      setError("Could not find your project. Please try again or contact us.");
    }
    setLoading(false);
  };

  const loadUpdates = async (projectId) => {
    try {
      const ups = await base44.entities.ProjectUpdate.filter({ project_id: projectId }, "-created_date", 20);
      setUpdates(ups || []);
    } catch {}
  };

  const BrandMark = () => (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#00a2ff] to-[#0066cc]">
        <Rocket className="h-5 w-5 text-white" />
      </div>
      <div className="leading-none">
        <span className="block text-sm font-extrabold tracking-tight text-white">Website Launch Engine</span>
        <span className="block text-[9px] font-bold uppercase tracking-[0.15em] text-[#00a2ff]">Client Portal</span>
      </div>
    </div>
  );

  // ── Lookup view ──
  if (view === "lookup") {
    return (
      <div className="min-h-screen bg-[#0a1220] text-white flex flex-col">
        <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <BrandMark />
          <BackButton className="text-white/60 hover:text-white" showLabel={false} />
        </nav>

        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="relative mb-6 mx-auto w-fit">
                <div className="absolute inset-0 rounded-full blur-3xl bg-[#00a2ff]/20" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-[#00a2ff]/30">
                  <Lock className="h-8 w-8 text-[#00a2ff]" />
                </div>
              </div>
              <h1 className="text-3xl font-black tracking-wide mb-3">CLIENT <span className="text-[#00a2ff]">PORTAL</span></h1>
              <p className="text-white/50">
                Track your project — timeline, photos, warranty, maintenance, and direct chat with your team.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0d1525] p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-white/70 mb-1.5 block">Email address</label>
                <Input
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-[#0a1220] border-white/10 text-white placeholder-white/30"
                />
              </div>
              <div className="flex items-center gap-3 text-xs text-white/30">
                <div className="flex-1 h-px bg-white/10" /> OR <div className="flex-1 h-px bg-white/10" />
              </div>
              <div>
                <label className="text-sm font-medium text-white/70 mb-1.5 block">Phone number</label>
                <Input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-12 bg-[#0a1220] border-white/10 text-white placeholder-white/30"
                />
              </div>
              {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-lg p-3">{error}</p>}
              <Button
                onClick={findProject}
                disabled={(!email && !phone) || loading}
                className="h-14 w-full text-base font-bold bg-[#00a2ff] hover:bg-[#0090e0] text-white shadow-[0_0_20px_rgba(0,162,255,0.3)]"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>FIND MY PROJECT <ArrowRight className="h-5 w-5" /></>}
              </Button>
            </div>

            <div className="mt-6 text-center space-y-3">
              <p className="text-sm text-white/40">
                Don't have a project yet?{" "}
                <button onClick={() => navigate("/funnel")} className="font-semibold text-[#00a2ff] hover:text-[#0090e0]">
                  Get your estimate →
                </button>
              </p>
              <button
                onClick={() => setView("guest")}
                className="text-sm text-white/30 hover:text-[#00a2ff] font-semibold"
              >
                Browse as guest — see colors, promos & company info
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Guest view ──
  if (view === "guest") {
    return (
      <div className="min-h-screen bg-[#0a1220] text-white">
        <header className="border-b border-white/10 sticky top-0 z-30 bg-[#0a1220]/80 backdrop-blur-md">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
            <BrandMark />
            <button onClick={() => setView("lookup")} className="text-sm text-white/50 hover:text-white">
              Sign in
            </button>
          </div>
        </header>
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
          {/* Welcome */}
          <div className="rounded-2xl border border-[#00a2ff]/20 bg-gradient-to-br from-[#00a2ff]/10 to-[#0d1525] p-6 text-center">
            <h1 className="text-2xl font-bold">Welcome to Website Launch Engine</h1>
            <p className="mt-2 text-white/50">Explore our color charts, special offers, and company highlights.</p>
            <button
              onClick={() => navigate("/funnel")}
              className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#00a2ff] text-white font-bold hover:bg-[#0090e0] shadow-[0_0_20px_rgba(0,162,255,0.3)]"
            >
              Get Your Free Estimate <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Color charts */}
          <div className="rounded-2xl border border-white/10 bg-[#0d1525] p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Palette className="h-5 w-5 text-[#00a2ff]" /> Floor Color Charts
            </h2>
            <p className="text-sm text-white/50 mb-4">Browse our full selection of epoxy flake colors, metallic finishes, and polished concrete options.</p>
            <button
              onClick={() => navigate("/color-charts")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 text-white text-sm font-bold hover:bg-[#00a2ff] transition"
            >
              View Color Charts <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Promo codes */}
          <div className="rounded-2xl border border-[#00a2ff]/20 bg-[#00a2ff]/5 p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Gift className="h-5 w-5 text-[#00a2ff]" /> Special Offers
            </h2>
            <div className="space-y-3">
              {[
                { code: "SPRING25", desc: "10% Off Installation", sub: "Mention this code when booking your estimate" },
                { code: "MILITARY", desc: "15% Off for Veterans", sub: "Thank you for your service" },
                { code: "REFER50", desc: "$50 Gift Card for Referrals", sub: "Refer a friend who books and you both get $50" },
              ].map((p) => (
                <div key={p.code} className="rounded-xl bg-[#0d1525] border border-white/10 p-4 flex items-center gap-3">
                  <Tag className="h-5 w-5 text-[#00a2ff] shrink-0" />
                  <div className="flex-1">
                    <div className="font-bold text-white">{p.code} — {p.desc}</div>
                    <div className="text-sm text-white/40">{p.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Company highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { val: "25+", label: "Years in Business" },
              { val: "10K+", label: "Floors Coated" },
              { val: "4.9★", label: "Google Rating" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-[#0d1525] p-5 text-center">
                <div className="text-3xl font-bold text-[#00a2ff]">{s.val}</div>
                <div className="text-sm text-white/40 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="rounded-2xl border border-white/10 bg-[#0d1525] p-6 text-center">
            <h3 className="font-bold text-white mb-2">Ready to Transform Your Garage?</h3>
            <p className="text-sm text-white/50 mb-4">Get a free AI-powered estimate with before/after visualization in minutes.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate("/funnel")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#00a2ff] text-white font-bold hover:bg-[#0090e0] shadow-[0_0_20px_rgba(0,162,255,0.3)]"
              >
                Start Estimate <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href="tel:+17722090266"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-white/20 text-white font-bold hover:bg-white/5"
              >
                <Phone className="h-4 w-4" /> Call Us
              </a>
            </div>
          </div>
        </div>
        <PortalAIChat project={null} />
      </div>
    );
  }

  // ── Project view ──
  return (
    <div className="min-h-screen bg-[#0a1220] text-white">
      {/* Header */}
      <header className="border-b border-white/10 sticky top-0 z-30 bg-[#0a1220]/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <BrandMark />
          <button
            onClick={() => { setView("lookup"); setProject(null); setEmail(""); setPhone(""); }}
            className="text-sm text-white/50 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Tab navigation */}
      <div className="max-w-3xl mx-auto px-6 pt-6">
        <div className="flex gap-1 overflow-x-auto rounded-xl bg-[#0d1525] border border-white/10 p-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 min-w-[80px] flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? "bg-[#00a2ff] text-white"
                    : "text-white/50 hover:bg-white/5"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-3xl mx-auto px-6 py-6 pb-24">
        {activeTab === "dashboard" && (
          <PortalDashboard project={project} settings={settings} onTabChange={setActiveTab} />
        )}
        {activeTab === "timeline" && (
          <div>
            <h2 className="text-lg font-bold text-white mb-4">Project Timeline</h2>
            <PortalTimeline project={project} updates={updates} />
          </div>
        )}
        {activeTab === "maintenance" && <PortalMaintenance project={project} />}
        {activeTab === "messages" && <PortalMessages project={project} />}
        {activeTab === "schedule" && <PortalSchedule project={project} />}
      </div>

      {/* AI chat floating bubble */}
      <PortalAIChat project={project} />
    </div>
  );
}