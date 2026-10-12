import React from "react";
import { Link } from "react-router-dom";
import { ExternalLink, UserCircle, X, Phone } from "lucide-react";
import LaunchBrand from "@/components/launch-engine/LaunchBrand";
import WorkspaceNavGroup from "@/components/launch-engine-admin/WorkspaceNavGroup";

export default function WorkspaceSidebar({ groups, mobileOpen, onClose }) {
  return (
    <>
      {mobileOpen && <button type="button" aria-label="Close navigation" onClick={onClose} className="fixed inset-0 z-30 bg-background/80 lg:hidden" />}
      <aside id="launch-admin-navigation" aria-label="Admin workspace" className={`fixed left-0 top-0 z-40 flex h-screen h-[100dvh] w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 lg:sticky ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex min-h-20 items-center gap-1 border-b border-sidebar-border px-4">
          <LaunchBrand />
          <button type="button" aria-label="Close navigation" onClick={onClose} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"><X className="h-5 w-5" /></button>
        </div>
        <nav aria-label="Admin navigation" className="flex-1 space-y-6 overflow-y-auto px-3 py-6">
          {groups.map(group => <WorkspaceNavGroup key={group.label} group={group} onNavigate={onClose} />)}
        </nav>
        <div className="space-y-1 border-t border-sidebar-border p-3">
          <Link to="/portal/dashboard" onClick={onClose} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-sidebar-foreground hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><UserCircle className="h-4 w-4" /> Client Portal</Link>
          <Link to="/" onClick={onClose} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-sidebar-foreground hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ExternalLink className="h-4 w-4" /> View Website</Link>
          <a href="tel:+17722090266" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-primary hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Phone className="h-4 w-4" /> (772) 209-0266</a>
        </div>
      </aside>
    </>
  );
}