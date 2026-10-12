import React, { useEffect, useId, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";

export default function WorkspaceNavGroup({ group, onNavigate }) {
  const { pathname } = useLocation();
  const id = useId();
  const containsCurrent = group.items.some(item => item.to === pathname);
  const [open, setOpen] = useState(containsCurrent);
  useEffect(() => { if (containsCurrent) setOpen(true); }, [containsCurrent]);
  return (
    <div>
      {group.collapsible ? (
        <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-controls={id} className="flex min-h-11 w-full items-center justify-between rounded-lg px-3 text-xs font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {group.label}<ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
      ) : <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{group.label}</p>}
      {(!group.collapsible || open) && (
        <div id={id} className="space-y-1">
          {group.items.map(({ to, end, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={end} onClick={onNavigate} className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? "border-primary/25 bg-primary/10 text-primary" : "border-transparent text-sidebar-foreground hover:bg-sidebar-accent"}`}>
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="truncate">{label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}