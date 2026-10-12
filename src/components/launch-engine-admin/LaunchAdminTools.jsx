import React from "react";
import { Link } from "react-router-dom";
import { Layers, Rocket, ShieldCheck, Bot, ArrowUpRight } from "lucide-react";

const TOOLS = [
  { to: "/admin/templates", icon: Layers, title: "Website Catalog", description: "Manage your saved templates and website designs." },
  { to: "/admin/mass-launch", icon: Rocket, title: "Launch Queue", description: "Manage location launches and batch progress." },
  { to: "/admin/site-command", icon: ShieldCheck, title: "Quality Checks", description: "Review site validation and deployment receipts." },
  { to: "/admin/assistant", icon: Bot, title: "GPT Workspace", description: "Use your existing assistant and build pipeline." },
];

export default function LaunchAdminTools() {
  return (
    <nav aria-label="Launch management tools" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {TOOLS.map(({ to, icon: Icon, title, description }) => (
        <Link key={to} to={to} className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <div className="mb-4 flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" aria-hidden="true" /></span>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" aria-hidden="true" />
          </div>
          <h2 className="font-heading text-base font-bold text-foreground">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        </Link>
      ))}
    </nav>
  );
}