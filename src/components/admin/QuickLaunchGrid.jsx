import React from "react";
import { Link } from "react-router-dom";
import {
  Crown, Rocket, Sparkles, Layout, Factory, Globe,
  Share2, MessageSquare, Workflow, Network, Users,
  KanbanSquare, Mail, Star, Radar, BarChart3, Gauge,
  ArrowRight, Zap, Bot, Layers, Compass, Crown as CrownIcon
} from "lucide-react";

const SECTIONS = [
  {
    title: "Concrete Market Dominance",
    subtitle: "One-click automated dominance engine for epoxy & concrete markets",
    accent: "from-amber-500 to-amber-600",
    icon: Crown,
    items: [
      { to: "/admin/domain-rush", icon: Crown, label: "Dominance Engine", desc: "Launch full pipeline", highlight: true },
      { to: "/admin/crystal-ball", icon: Sparkles, label: "Crystal Ball", desc: "Predictive analytics" },
      { to: "/admin/seo-dominance", icon: Rocket, label: "SEO Dominance", desc: "First-page strategy" },
      { to: "/admin/seo-simulator", icon: Sparkles, label: "SEO Simulator", desc: "Test & amplify" },
    ],
  },
  {
    title: "Launch Concrete Sites",
    subtitle: "Build, template, and deploy epoxy & concrete coating websites fast",
    accent: "from-blue-500 to-blue-600",
    icon: Rocket,
    items: [
      { to: "/admin/templates", icon: Layout, label: "Template Library", desc: "All your templates", highlight: true },
      { to: "/admin/website-factory", icon: Factory, label: "Website Factory", desc: "Create & deploy" },
      { to: "/admin/national-launch", icon: Globe, label: "National Launch", desc: "Scale nationwide" },
      { to: "/admin/seo-generator", icon: Zap, label: "SEO Generator", desc: "Auto-generate pages" },
      { to: "/admin/empire", icon: CrownIcon, label: "Website Empire", desc: "Manage all sites" },
      { to: "/admin/queue", icon: Layers, label: "Site Queue", desc: "Deployment queue" },
    ],
  },
  {
    title: "Automate Concrete Marketing",
    subtitle: "Social media, comms, and autonomous workflows for concrete contractors",
    accent: "from-purple-500 to-purple-600",
    icon: Bot,
    items: [
      { to: "/admin/social-studio", icon: Share2, label: "Social Studio", desc: "Auto social posts", highlight: true },
      { to: "/admin/xtreme-comms", icon: MessageSquare, label: "Xtreme Comms", desc: "SMS + voice + email" },
      { to: "/admin/workflows", icon: Workflow, label: "Autonomous Workflows", desc: "24/7 automations" },
      { to: "/admin/swarm", icon: Network, label: "Swarm Command", desc: "Agent control center" },
      { to: "/admin/voice-assistant", icon: Bot, label: "AI Voice", desc: "Voice assistant" },
      { to: "/admin/playbooks", icon: Layers, label: "Playbooks", desc: "Reusable strategies" },
    ],
  },
  {
    title: "Concrete Lead Pipeline",
    subtitle: "Epoxy & concrete coating leads, appointments, and revenue tracking",
    accent: "from-green-500 to-green-600",
    icon: Users,
    items: [
      { to: "/admin/leads", icon: Users, label: "Leads", desc: "All estimates", highlight: true },
      { to: "/admin/pipeline", icon: KanbanSquare, label: "Pipeline", desc: "Kanban board" },
      { to: "/admin/emails", icon: Mail, label: "Emails", desc: "Email campaigns" },
      { to: "/admin/reviews", icon: Star, label: "Reviews", desc: "Reputation mgmt" },
      { to: "/admin/lead-scraper", icon: Radar, label: "Lead Scraper", desc: "Find new leads" },
      { to: "/admin/skip-trace", icon: Radar, label: "Skip Trace", desc: "Property owners" },
    ],
  },
  {
    title: "Concrete Intelligence",
    subtitle: "SEO, analytics, and system health for concrete markets",
    accent: "from-stone-600 to-stone-700",
    icon: Compass,
    items: [
      { to: "/admin/google", icon: Globe, label: "Google SEO", desc: "Search Console" },
      { to: "/admin/competitors", icon: Radar, label: "Competitors", desc: "Market intel" },
      { to: "/admin/analytics", icon: BarChart3, label: "GA Traffic", desc: "Analytics" },
      { to: "/admin/results", icon: BarChart3, label: "Analytics Hub", desc: "Full results" },
      { to: "/admin/system-health", icon: Gauge, label: "System Health", desc: "Platform status" },
      { to: "/admin/architecture", icon: Compass, label: "Architecture", desc: "System blueprint" },
    ],
  },
];

export default function QuickLaunchGrid() {
  return (
    <div className="space-y-6">
      {SECTIONS.map((section) => {
        const SectionIcon = section.icon;
        return (
          <div key={section.title}>
            {/* Section header */}
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${section.accent} flex items-center justify-center shadow-md`}>
                <SectionIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-stone-900">{section.title}</h2>
                <p className="text-xs text-stone-500">{section.subtitle}</p>
              </div>
            </div>

            {/* Button grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`group relative rounded-xl border p-4 transition-all hover:shadow-lg hover:-translate-y-0.5 flex flex-col gap-2 ${
                      item.highlight
                        ? "border-amber-400 bg-gradient-to-br from-amber-50 to-white hover:border-amber-500"
                        : "border-stone-200 bg-white hover:border-stone-300"
                    }`}
                  >
                    {item.highlight && (
                      <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                        ★ Key
                      </span>
                    )}
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${
                      item.highlight
                        ? "bg-amber-500 text-stone-950"
                        : "bg-stone-100 text-stone-600 group-hover:bg-stone-900 group-hover:text-white"
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-900 leading-tight">{item.label}</p>
                      <p className="text-xs text-stone-500 mt-0.5">{item.desc}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-stone-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all mt-auto" />
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}