import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import {
  Bell, Calendar, Phone, Home, FileText, Trophy, DollarSign, Percent, Zap,
  Rocket, Crown, Share2, Layout, Globe, ArrowRight, Sparkles, Bot, Users,
  KanbanSquare, Mail, Star, Radar, BarChart3, Gauge, Compass, Layers,
  Workflow, Network, Factory, MessageSquare, MapPin, Target, Brain, Shield,
  KeyRound, Wand2, PhoneCall, Activity, ListOrdered, Database, Code2,
  BookOpen, Eye, EyeOff, Boxes, Cpu, FileCode, HelpCircle, DollarSign as Dollar,
  Image, CheckCircle, Calculator
} from "lucide-react";
import { money } from "@/lib/pricing";
import { XTREME_AI_ICON_URL } from "@/components/Logo";
import HomeFunnelSnapshot from "@/components/admin/HomeFunnelSnapshot";
import { isAfter, subDays, startOfDay } from "date-fns";

const PRIMARY_ACTIONS = [
  {
    to: "/admin/site-builder",
    icon: Crown,
    label: "Universal Site Builder",
    desc: "Full pipeline — pick industry, branding, logo, content, URL, launch everything",
    gradient: "from-amber-500 via-amber-600 to-amber-700",
    glow: "shadow-amber-500/30",
  },
  {
    to: "/admin/domain-rush",
    icon: Crown,
    label: "Launch Dominance Campaign",
    desc: "One-click automated pipeline — domain, site, content, social, SEO",
    gradient: "from-orange-500 via-orange-600 to-orange-700",
    glow: "shadow-orange-500/30",
  },
  {
    to: "/admin/dominance-sandbox",
    icon: Rocket,
    label: "Dominance Sandbox",
    desc: "7-tab command center — discovery, branding, funnel, content, social, simulation, launch",
    gradient: "from-emerald-500 via-emerald-600 to-emerald-700",
    glow: "shadow-emerald-500/30",
  },
  {
    to: "/admin/website-factory",
    icon: Rocket,
    label: "Launch New Website",
    desc: "Create & deploy a new site from a template — pick niche, configure, go live",
    gradient: "from-blue-500 via-blue-600 to-blue-700",
    glow: "shadow-blue-500/30",
  },
];

const LAUNCH_SECTIONS = [
  {
    title: "Dominance System",
    icon: Crown,
    color: "amber",
    items: [
      { to: "/admin/dominance-sandbox", icon: Rocket, label: "Sandbox" },
      { to: "/admin/domain-rush", icon: Crown, label: "Dominance Engine" },
      { to: "/admin/crystal-ball", icon: Sparkles, label: "Crystal Ball" },
      { to: "/admin/seo-dominance", icon: Rocket, label: "SEO Dominance" },
      { to: "/admin/seo-simulator", icon: Sparkles, label: "SEO Simulator" },
    ],
  },
  {
    title: "Launch Websites",
    icon: Rocket,
    color: "blue",
    items: [
      { to: "/admin/templates", icon: Layout, label: "Template Library" },
      { to: "/admin/website-factory", icon: Factory, label: "Website Factory" },
      { to: "/admin/national-launch", icon: Globe, label: "National Launch" },
      { to: "/admin/seo-generator", icon: Zap, label: "SEO Generator" },
      { to: "/admin/empire", icon: Crown, label: "Website Empire" },
      { to: "/admin/queue", icon: ListOrdered, label: "Site Queue" },
    ],
  },
  {
    title: "Automate",
    icon: Bot,
    color: "purple",
    items: [
      { to: "/admin/social-studio", icon: Share2, label: "Social Studio" },
      { to: "/admin/xtreme-comms", icon: MessageSquare, label: "Xtreme Comms" },
      { to: "/admin/workflows", icon: Workflow, label: "Workflows" },
      { to: "/admin/swarm", icon: Network, label: "Swarm Command" },
      { to: "/admin/voice-assistant", icon: PhoneCall, label: "AI Voice" },
      { to: "/admin/playbooks", icon: BookOpen, label: "Playbooks" },
    ],
  },
  {
    title: "Pipeline",
    icon: Users,
    color: "green",
    items: [
      { to: "/admin/leads", icon: Users, label: "Leads" },
      { to: "/admin/pipeline", icon: KanbanSquare, label: "Pipeline" },
      { to: "/admin/emails", icon: Mail, label: "Emails" },
      { to: "/admin/reviews", icon: Star, label: "Reviews" },
      { to: "/admin/lead-scraper", icon: Radar, label: "Lead Scraper" },
      { to: "/admin/skip-trace", icon: Radar, label: "Skip Trace" },
    ],
  },
  {
    title: "Intelligence",
    icon: Compass,
    color: "stone",
    items: [
      { to: "/admin/google", icon: Globe, label: "Google SEO" },
      { to: "/admin/competitors", icon: Radar, label: "Competitors" },
      { to: "/admin/analytics", icon: BarChart3, label: "GA Traffic" },
      { to: "/admin/results", icon: BarChart3, label: "Analytics Hub" },
      { to: "/admin/system-health", icon: Gauge, label: "System Health" },
      { to: "/admin/architecture", icon: Compass, label: "Architecture" },
    ],
  },
];

const COLOR_MAP = {
  amber: "hover:border-amber-400 hover:bg-amber-50 hover:text-amber-600",
  blue: "hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600",
  purple: "hover:border-purple-400 hover:bg-purple-50 hover:text-purple-600",
  green: "hover:border-green-400 hover:bg-green-50 hover:text-green-600",
  stone: "hover:border-stone-400 hover:bg-stone-50 hover:text-stone-700",
};

export default function Dashboard() {
  const { data: leads = [] } = useQuery({ queryKey: ["leads"], queryFn: () => base44.entities.Lead.list("-created_date", 500) });
  const { data: appts = [] } = useQuery({ queryKey: ["appts"], queryFn: () => base44.entities.Appointment.list("-created_date", 500) });
  const { data: templates = [] } = useQuery({ queryKey: ["templateLibrary"], queryFn: () => base44.entities.TemplateLibrary.list("-created_date", 200) });

  const today = startOfDay(new Date());
  const weekAgo = subDays(new Date(), 7);
  const inRange = (d, from) => isAfter(new Date(d), from);

  const todayCount = leads.filter((l) => inRange(l.created_date, today)).length;
  const weekCount = leads.filter((l) => inRange(l.created_date, weekAgo)).length;
  const phone = appts.filter((a) => a.type === "PHONE CONSULTATION").length;
  const home = appts.filter((a) => a.type === "IN-HOME ESTIMATE").length;
  const proposals = leads.filter((l) => l.status === "PROPOSAL SENT").length;
  const won = leads.filter((l) => l.status === "WON");
  const pipeline = leads.filter((l) => !["WON", "LOST"].includes(l.status)).reduce((s, l) => s + (l.estimate_mid || 0), 0);
  const convRate = leads.length ? Math.round((won.length / leads.length) * 100) : 0;
  const newLeads = leads.filter((l) => l.status === "NEW ESTIMATE");

  return (
    <div className="space-y-6">
      {/* Branded header */}
      <div className="xa-electric-hover rounded-2xl bg-stone-950 p-6 flex items-center gap-5">
        <img src={XTREME_AI_ICON_URL} alt="Xtreme AI Systems" className="h-16 w-16 object-contain shrink-0" />
        <div>
          <div className="text-[10px] font-bold tracking-[0.2em] text-amber-500 uppercase">Xtreme AI Systems</div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">Command Center</h1>
          <p className="text-sm text-stone-400 mt-1">Launch websites, dominate search, automate everything</p>
        </div>
        <div className="ml-auto hidden md:flex items-center gap-2 text-xs text-stone-500">
          <Zap className="h-4 w-4 text-amber-500" />
          Live data
        </div>
      </div>

      <HomeFunnelSnapshot />

      {/* PRIMARY ACTIONS — big, bold, impossible to miss */}
      <div>
        <h2 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-3">⚡ Quick Launch</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PRIMARY_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.to}
                to={action.to}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${action.gradient} p-5 text-white shadow-lg ${action.glow} transition-all hover:shadow-xl hover:-translate-y-1`}
              >
                <div className="absolute top-0 right-0 opacity-10">
                  <Icon className="h-32 w-32 -mr-8 -mt-8" />
                </div>
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center mb-3">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold">{action.label}</h3>
                  <p className="text-sm text-white/80 mt-1">{action.desc}</p>
                  <div className="flex items-center gap-1 mt-3 text-sm font-semibold">
                    Launch <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* New leads alert */}
      {newLeads.length > 0 && (
        <div className="rounded-2xl bg-amber-500 text-stone-950 p-4 flex items-start gap-3">
          <Bell className="h-5 w-5 mt-0.5" />
          <div>
            <div className="font-bold">{newLeads.length} NEW LEAD{newLeads.length > 1 ? "S" : ""}</div>
            <div className="text-sm mt-0.5">
              Newest: {newLeads[0].first_name} {newLeads[0].last_name} · {newLeads[0].city}{" "}
              <Link to={`/admin/leads/${newLeads[0].id}`} className="underline font-semibold">Open →</Link>
            </div>
          </div>
        </div>
      )}

      {/* LAUNCH SECTIONS — action grid */}
      <div className="space-y-5">
        {LAUNCH_SECTIONS.map((section) => {
          const SectionIcon = section.icon;
          const hoverClass = COLOR_MAP[section.color] || COLOR_MAP.stone;
          return (
            <div key={section.title}>
              <div className="flex items-center gap-2 mb-2">
                <SectionIcon className="h-4 w-4 text-stone-400" />
                <h2 className="text-sm font-bold text-stone-700 uppercase tracking-wider">{section.title}</h2>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`group flex flex-col items-center gap-2 p-3 rounded-xl border border-stone-200 bg-white transition-all ${hoverClass}`}
                    >
                      <Icon className="h-5 w-5 text-stone-500 group-hover:scale-110 transition" />
                      <span className="text-xs font-semibold text-stone-700 text-center leading-tight">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* COMPACT STATS — secondary, not the focus */}
      <div className="grid gap-3 grid-cols-4 lg:grid-cols-8">
        <Link to="/admin/leads" className="bg-white rounded-xl border border-stone-200 p-3 hover:border-amber-400 transition">
          <div className="text-xl font-black text-stone-900">{todayCount}</div>
          <div className="text-[10px] text-stone-500">Today</div>
        </Link>
        <Link to="/admin/leads" className="bg-white rounded-xl border border-stone-200 p-3 hover:border-amber-400 transition">
          <div className="text-xl font-black text-stone-900">{weekCount}</div>
          <div className="text-[10px] text-stone-500">This Week</div>
        </Link>
        <Link to="/admin/pipeline" className="bg-white rounded-xl border border-stone-200 p-3 hover:border-amber-400 transition">
          <div className="text-xl font-black text-stone-900">{phone}</div>
          <div className="text-[10px] text-stone-500">Phone</div>
        </Link>
        <Link to="/admin/pipeline" className="bg-white rounded-xl border border-stone-200 p-3 hover:border-amber-400 transition">
          <div className="text-xl font-black text-stone-900">{home}</div>
          <div className="text-[10px] text-stone-500">Home Visits</div>
        </Link>
        <Link to="/admin/leads" className="bg-white rounded-xl border border-stone-200 p-3 hover:border-amber-400 transition">
          <div className="text-xl font-black text-stone-900">{proposals}</div>
          <div className="text-[10px] text-stone-500">Proposals</div>
        </Link>
        <Link to="/admin/leads" className="bg-white rounded-xl border border-stone-200 p-3 hover:border-amber-400 transition">
          <div className="text-xl font-black text-green-600">{won.length}</div>
          <div className="text-[10px] text-stone-500">Won</div>
        </Link>
        <Link to="/admin/leads" className="bg-white rounded-xl border border-stone-200 p-3 hover:border-amber-400 transition">
          <div className="text-xl font-black text-amber-600">{money(pipeline)}</div>
          <div className="text-[10px] text-stone-500">Pipeline</div>
        </Link>
        <Link to="/admin/templates" className="bg-white rounded-xl border border-stone-200 p-3 hover:border-amber-400 transition">
          <div className="text-xl font-black text-blue-600">{templates?.length || 0}</div>
          <div className="text-[10px] text-stone-500">Templates</div>
        </Link>
      </div>
    </div>
  );
}