import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Grid3X3, Diamond, ArrowUpFromLine, Check, Sparkles, Activity, Settings, Radio, Radar, Bug, Cpu, Brain, Smartphone, Rocket, Globe } from "lucide-react";
import ReferenceAdminViews from "@/components/launch-engine-admin/ReferenceAdminViews";

const ICONS = [Grid3X3, Diamond, ArrowUpFromLine, Check, Sparkles, Radio, Activity, Settings];

export default function ReferenceAdminSidebar() {
  const { pathname } = useLocation();
  return (
    <aside className="wle-aside">
      <Link to="/" className="wle-brand">
        <em aria-hidden="true">🚀</em>
        <span>Website<br />Launch Engine<small>STRATEGIC MINDS AI</small></span>
      </Link>
      <div className="wle-rail-label">PLATFORM OPERATIONS</div>
      <nav className="wle-nav-container" aria-label="Platform operations">
        <Link to="/admin" className={`wle-side-nav${pathname === "/admin" || pathname === "/admin/" ? " active" : ""}`} aria-current={pathname === "/admin" ? "page" : undefined}>
          <Grid3X3 aria-hidden="true" />Template Studio
        </Link>
        {ReferenceAdminViews.map((view, index) => {
          const Icon = ICONS[index];
          const active = pathname === view.toolPath;
          return (
            <Link key={view.name} to={view.toolPath}
              className={`wle-side-nav${active ? " active" : ""}`} aria-current={active ? "page" : undefined}>
              <Icon aria-hidden="true" />{view.name}
            </Link>
          );
        })}
        <div className="wle-rail-label" style={{ marginTop: "16px" }}>ADDITIONAL SYSTEMS</div>
        <Link to="/admin/vision-intelligence" className="wle-side-nav"><Radar aria-hidden="true" />Vision Intelligence</Link>
        <Link to="/admin/fault-line" className="wle-side-nav"><Bug aria-hidden="true" />FaultLine Scanner</Link>
        <Link to="/admin/god-mode-lab" className="wle-side-nav"><Cpu aria-hidden="true" />God Mode Lab</Link>
        <Link to="/admin/predictive-scoring" className="wle-side-nav"><Brain aria-hidden="true" />Predictive Scoring</Link>
        <Link to="/admin/pwa-factory" className="wle-side-nav"><Smartphone aria-hidden="true" />PWA App Factory</Link>
        <Link to="/admin/pwa-launches" className="wle-side-nav"><Activity aria-hidden="true" />PWA Launches</Link>
        <Link to="/admin/launch-status" className="wle-side-nav"><Rocket aria-hidden="true" />Launch Status</Link>
        <Link to="/admin/site-inventory" className="wle-side-nav"><Globe aria-hidden="true" />Site Inventory</Link>
        <Link to="/admin/benchmark-reverse" className="wle-side-nav"><Diamond aria-hidden="true" />Benchmark Reverse-Engineer</Link>
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