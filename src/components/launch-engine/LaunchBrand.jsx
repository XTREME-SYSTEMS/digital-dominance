import React from "react";
import { Link } from "react-router-dom";
import { Rocket } from "lucide-react";

export default function LaunchBrand({ to = "/admin", subtitle = "Admin Control Center" }) {
  return (
    <Link to={to} className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Rocket className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-heading text-sm font-extrabold tracking-tight text-foreground">Website Launch Engine</span>
        <span className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{subtitle}</span>
      </span>
    </Link>
  );
}