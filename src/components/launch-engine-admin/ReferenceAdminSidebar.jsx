import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Grid3X3, Diamond, ArrowUpFromLine, Check, Sparkles, Activity, Settings } from "lucide-react";
import ReferenceAdminViews, { getReferenceAdminView } from "@/components/launch-engine-admin/ReferenceAdminViews";

const ICONS = [Grid3X3, Diamond, ArrowUpFromLine, Check, Sparkles, Activity, Settings];

export default function ReferenceAdminSidebar() {
  const { pathname, hash } = useLocation();
  const base = pathname === "/admin.html" ? "/admin.html" : "/admin";
  const isReference = ["/admin", "/admin/", "/admin.html"].includes(pathname);
  const selected = getReferenceAdminView(hash);
  return (
    <aside className="wle-aside">
      <Link to="/" className="wle-brand">
        <em aria-hidden="true">🚀</em>
        <span>Website<br />Launch Engine<small>STRATEGIC MINDS AI</small></span>
      </Link>
      <div className="wle-rail-label">PLATFORM OPERATIONS</div>
      <nav className="wle-nav-container" aria-label="Platform operations">
        {ReferenceAdminViews.map((view, index) => {
          const Icon = ICONS[index];
          const active = isReference ? selected.name === view.name : pathname === view.toolPath;
          return (
            <Link key={view.name} replace to={`${base}#${encodeURIComponent(view.name)}`}
              className={`wle-side-nav${active ? " active" : ""}`} aria-current={active ? "page" : undefined}>
              <Icon aria-hidden="true" />{view.name}
            </Link>
          );
        })}
        <Link to="/admin/contents" className="wle-side-nav wle-tools-mobile">All Tools</Link>
      </nav>
      <div className="wle-aside-bottom">
        Florida Based · Nationwide Reach
        <a href="tel:+17722090266">☎ (772) 209-0266</a>
        <Link to="/admin/contents">All Tools</Link>
        <Link to="/">← Back to Website Launch Engine</Link>
      </div>
    </aside>
  );
}