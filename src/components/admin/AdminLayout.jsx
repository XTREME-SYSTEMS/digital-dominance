import React, { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { LayoutDashboard, Users, KanbanSquare, Settings, ExternalLink, Mail, Radar, Globe, ScrollText, Star, Wrench, Factory, Smartphone, Rocket, Layers, Layout, UserCircle, TrendingUp, MessageSquare, Brain, Target, BarChart3, Package, Bot, KeyRound, Share2, Wand2, MapPin, Network, Crown, Building2, Code2, Heart, PhoneCall, Activity, ListOrdered, Database, Workflow, Gauge, Cpu, Sparkles, Boxes, BookOpen, Eye, EyeOff, Zap, Shield, Compass, Menu, X, ChevronDown, ChevronRight, LayoutGrid, Search, Phone } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import WorkspaceSidebar from "@/components/launch-engine-admin/WorkspaceSidebar";
import LaunchBrand from "@/components/launch-engine/LaunchBrand";
import AIAssistBubble from "@/components/ai-assist/AIAssistBubble";

const navGroups = [
  {
    label: null,
    items: [
      { to: "/admin/contents", icon: LayoutGrid, label: "📋 Contents Menu" },
      { to: "/admin/gpt-pipeline", icon: Sparkles, label: "⚡ GPT Sync Pipeline" },
      { to: "/admin", end: true, icon: Sparkles, label: "Concrete Opportunities" },
      { to: "/admin/system-audit", icon: Shield, label: "🔍 Full System Audit" },
      { to: "/admin/capabilities", icon: Crown, label: "Capabilities & Gaps" },
      { to: "/admin/concept-to-completion", icon: Sparkles, label: "Concept → Completion" },
      { to: "/admin/gap-filler", icon: Zap, label: "Gap Filler Engine" },
      { to: "/visual-editor", icon: Eye, label: "Visual Editor" },
      { to: "/admin/master-pipeline", icon: ListOrdered, label: "Master Pipeline" },
      { to: "/admin/provider-vault", icon: Shield, label: "Provider Vault" },
      { to: "/admin/independence", icon: Shield, label: "System Independence" },
      { to: "/admin/template-studio", icon: Layers, label: "Template Studio" },
      { to: "/admin/system-library", icon: Boxes, label: "System Library" },
      { to: "/admin/pack-research", icon: Search, label: "GPT Pack Research" },
      { to: "/admin/pack-sync", icon: Package, label: "GPT Pack Sync" },
      { to: "/admin/pipeline-builder", icon: Zap, label: "Pipeline Builder" },
      { to: "/admin/google-workspace-os", icon: Globe, label: "Google Workspace OS" },
      { to: "/admin/internal-architecture", icon: Layers, label: "Internal Architecture" },
      { to: "/admin/google-command-center", icon: Globe, label: "Google Command Center" },
      { to: "/admin/command-center", icon: Crown, label: "Command Center" },
      { to: "/admin/vision-studio", icon: Wand2, label: "Vision Studio" },
      { to: "/admin/image-ingestion", icon: Wand2, label: "Image → Code Ingestion" },
    ],
  },
  {
    label: "CONCRETE OPS — Vision → Agents → Convergence",
    items: [
      { to: "/admin/vision-studio", icon: Wand2, label: "Vision Studio" },
      { to: "/admin/agent-builder", icon: Bot, label: "Agent Builder" },
      { to: "/admin/agent-master", icon: Bot, label: "Agent Master" },
      { to: "/admin/swarm", icon: Network, label: "Swarm Command" },
      { to: "/admin/operator", icon: Bot, label: "AI Operator" },
      { to: "/admin/convergence", icon: Shield, label: "Convergence Engine" },
      { to: "/admin/system-health", icon: Gauge, label: "System Health" },
    ],
  },
  {
    label: "MARKET DOMINANCE — National Concrete Reach",
    items: [
      { to: "/admin/digital-dominance", icon: Crown, label: "Digital Dominance" },
      { to: "/admin/dominance-pipeline", icon: Crown, label: "Dominance Pipeline (5-Step)" },
      { to: "/launch-engine", icon: Rocket, label: "Website Launch Engine" },
      { to: "/admin/targeting", icon: Target, label: "Programmatic Targeting" },
      { to: "/admin/mass-launch", icon: Rocket, label: "Mass Launch Console" },
      { to: "/admin/site-command", icon: Shield, label: "Site Command Center" },
      { to: "/admin/autonomous-dominance", icon: Crown, label: "Autonomous Dominance" },
      { to: "/admin/autonomous-refactor", icon: Wrench, label: "Autonomous Refactor" },
      { to: "/admin/dominance-sandbox", icon: Rocket, label: "Dominance Sandbox" },
    ],
  },
  {
    label: "SYSTEM GENERATOR — Build & Scale Concrete Sites",
    items: [
      { to: "/admin/builder-library", icon: Sparkles, label: "Builder Library" },
      { to: "/admin/meta-agent", icon: Brain, label: "Meta Agent" },
      { to: "/admin/x1-company", icon: Building2, label: "X1 Company" },
      { to: "/admin/vision-cortex-v2", icon: Sparkles, label: "Vision Cortex V2" },
    ],
  },
  {
    label: "ADVANCED — System Internals",
    collapsible: true,
    items: [
      { to: "/admin/alpha-prime", icon: Crown, label: "Alpha Prime" },
      { to: "/admin/fleet", icon: Layers, label: "Fleet" },
      { to: "/admin/vision-cortex", icon: Eye, label: "Vision Cortex" },
      { to: "/admin/meta-architecture", icon: Compass, label: "Meta Architecture" },
      { to: "/admin/shadow", icon: EyeOff, label: "Shadow" },
      { to: "/admin/system-map", icon: Boxes, label: "System Map" },
      { to: "/admin/platform", icon: Cpu, label: "Platform" },
      { to: "/admin/architecture", icon: Compass, label: "Architecture" },
      { to: "/admin/workflows", icon: Workflow, label: "Workflows" },
      { to: "/admin/playbooks", icon: BookOpen, label: "Playbooks" },
      { to: "/admin/contractor-simulation", icon: Users, label: "Simulation" },
      { to: "/admin/seo-simulator", icon: Sparkles, label: "SEO Simulator" },
      { to: "/admin/intelligence", icon: Brain, label: "Intelligence" },
      { to: "/admin/vision-strategy", icon: Target, label: "Strategy" },
      { to: "/admin/rag", icon: Database, label: "RAG Engine" },
      { to: "/admin/graph", icon: Workflow, label: "Knowledge Graph" },
      { to: "/admin/website-factory", icon: Factory, label: "Website Factory" },
      { to: "/admin/app-factory", icon: Smartphone, label: "App Factory" },
      { to: "/admin/templates", icon: Layout, label: "Templates" },
      { to: "/admin/empire", icon: Crown, label: "Website Empire" },
      { to: "/admin/queue", icon: ListOrdered, label: "Site Queue" },
      { to: "/admin/code-studio", icon: Code2, label: "Code Studio" },
      { to: "/admin/rebrand-studio", icon: Wand2, label: "Rebrand Studio" },
      { to: "/admin/site-builder", icon: Crown, label: "Site Builder" },
      { to: "/admin/google", icon: Globe, label: "Google SEO" },
      { to: "/admin/seo-dominance", icon: Rocket, label: "SEO Dominance" },
      { to: "/admin/seo-generator", icon: TrendingUp, label: "SEO Generator" },
      { to: "/admin/url-strategy", icon: Globe, label: "URL Strategy" },
      { to: "/admin/site-health", icon: Heart, label: "Site Health" },
      { to: "/admin/sop", icon: ScrollText, label: "SOP & Memory" },
      { to: "/admin/national-launch", icon: Rocket, label: "National Launch" },
      { to: "/admin/leads", icon: Users, label: "Leads" },
      { to: "/admin/pipeline", icon: KanbanSquare, label: "Pipeline" },
      { to: "/admin/emails", icon: Mail, label: "Emails" },
      { to: "/admin/reviews", icon: Star, label: "Reviews" },
      { to: "/admin/lead-scraper", icon: Radar, label: "Lead Scraper" },
      { to: "/admin/skip-trace", icon: Radar, label: "Skip Trace" },
      { to: "/admin/location-performance", icon: MapPin, label: "Location Stats" },
      { to: "/admin/xtreme-comms", icon: MessageSquare, label: "Xtreme Comms" },
      { to: "/admin/telnyx", icon: Smartphone, label: "Telnyx Manager" },
      { to: "/admin/voice-assistant", icon: PhoneCall, label: "AI Voice" },
      { to: "/admin/social-studio", icon: Share2, label: "Social Studio" },
      { to: "/admin/results", icon: BarChart3, label: "Analytics" },
      { to: "/admin/analytics", icon: Activity, label: "GA Traffic" },
      { to: "/admin/competitors", icon: Radar, label: "Competitors" },
      { to: "/admin/vault", icon: Shield, label: "Vault" },
      { to: "/admin/api-keys", icon: KeyRound, label: "API Keys" },
      { to: "/admin/client-packages", icon: Package, label: "Client Pkgs" },
      { to: "/admin/tools", icon: Wrench, label: "App Tools" },
      { to: "/admin/tool-hub", icon: Layers, label: "Tool Hub" },
      { to: "/admin/blueprint", icon: Building2, label: "Blueprint" },
      { to: "/admin/domain-rush", icon: Crown, label: "Domain Rush" },
      { to: "/admin/crystal-ball", icon: Sparkles, label: "Crystal Ball" },
      { to: "/admin/autocomplete", icon: Zap, label: "AutoComplete" },
      { to: "/portal", icon: UserCircle, label: "Client Portal" },
      { to: "/admin/settings", icon: Settings, label: "Settings" },
    ],
  },
];

const workspaceLinks = [
  { to: "/admin", end: true, icon: Rocket, label: "Launch Engine" },
  { to: "/admin/templates", icon: Layers, label: "Website Catalog" },
  { to: "/admin/dominance-pipeline", icon: Workflow, label: "Build Pipeline" },
  { to: "/admin/targeting", icon: Target, label: "Location Targeting" },
  { to: "/admin/mass-launch", icon: ListOrdered, label: "Launch Queue" },
  { to: "/admin/site-command", icon: Shield, label: "Quality Checks" },
  { to: "/admin/assistant", icon: Bot, label: "GPT Workspace" },
  { to: "/admin/leads", icon: Users, label: "Lead Inbox" },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
];
const workspacePaths = new Set([...workspaceLinks.map(item => item.to), "/admin/gpt-pipeline", "/launch-engine", "/portal"]);
const seenPaths = new Set();
const directoryItems = navGroups.flatMap(group => group.items).filter(item => {
  if (workspacePaths.has(item.to) || seenPaths.has(item.to)) return false;
  seenPaths.add(item.to);
  return true;
}).map(item => ({ ...item, label: item.label.replace(/^[^\p{L}\p{N}]+/u, "") }));
const workspaceNavigation = [
  { label: "Workspace", items: workspaceLinks },
  { label: "All Tools", collapsible: true, items: directoryItems },
];

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  if (user && user.role !== "admin") return <Navigate to="/portal/dashboard" replace />;

  return (
    <div className="dark flex min-h-screen bg-background font-body text-foreground">
      <WorkspaceSidebar groups={workspaceNavigation} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex min-h-20 items-center gap-3 border-b border-border bg-background px-4 sm:px-6 lg:px-8">
          <button type="button" aria-label="Open admin navigation" aria-controls="launch-admin-navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"><Menu className="h-5 w-5" /></button>
          <div className="min-w-0 lg:hidden"><LaunchBrand /></div>
          <p className="hidden text-sm text-muted-foreground lg:block">Website Launch Engine <span className="mx-2" aria-hidden="true">/</span><span className="font-semibold text-foreground">Admin Workspace</span></p>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8"><Outlet /></main>
      </div>
      <AIAssistBubble />
    </div>
  );
}