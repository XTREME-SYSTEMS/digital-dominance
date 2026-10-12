import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Plus, Rocket } from "lucide-react";

export default function LaunchAdminHero({ onLaunch }) {
  return (
    <section className="rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-background p-6 sm:p-10">
      <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
        <Rocket className="h-4 w-4" aria-hidden="true" /> Admin Control Center
      </div>
      <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">Website Launch Engine</h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">Choose an industry, preview a website, and move your launch into the build pipeline. Manage your catalog, launches, and quality checks from one workspace.</p>
      <div className="mt-7 flex flex-wrap gap-3">
        <button type="button" onClick={onLaunch} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
          <Plus className="h-4 w-4" aria-hidden="true" /> New Website
        </button>
        <Link to="/admin/mass-launch" className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Open Launch Queue <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link to="/portal/dashboard" className="flex min-h-11 items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Client Portal</Link>
      </div>
    </section>
  );
}