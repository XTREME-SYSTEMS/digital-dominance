import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Grid3X3, Diamond, ArrowUpFromLine, Check, Sparkles, Activity, Settings, Radio, Radar, Bug, Cpu, Brain, Smartphone, Rocket, Globe, Bot, ChevronDown, ChevronRight, Archive, Layers, BarChart3, Wrench, Shield, Database, Target, Code2 } from "lucide-react";

export default function ReferenceAdminSidebar() {
  const { pathname } = useLocation();
  const [archiveOpen, setArchiveOpen] = useState(false);

  const isCore = (paths) => paths.some((p) => pathname === p || pathname.startsWith(p + "/"));

  return (
    <aside className="wle-aside">
      <Link to="/" className="wle-brand">
        <img src="https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/ceeb745d3_generated_image.png" alt="Unlimited Websites" style={{ height: "36px", width: "auto", objectFit: "contain" }} />
      </Link>

      {/* ── MASTER COMMAND CENTER ──────────────────────────── */}
      <div className="wle-rail-label" style={{ marginTop: "14px" }}>COMMAND CENTER</div>
      <nav className="wle-nav-container" aria-label="Master plan">
        <Link to="/admin/master-plan" className={`wle-side-nav${isCore(["/admin/master-plan"]) ? " active" : ""}`}>
          <Target aria-hidden="true" />Master Plan & Strategy
        </Link>
      </nav>

      {/* ── CORE: Template & Catalog ──────────────────────────── */}
      <div className="wle-rail-label">TEMPLATE & CATALOG</div>
      <nav className="wle-nav-container" aria-label="Core operations">
        <Link to="/admin" className={`wle-side-nav${isCore(["/admin"]) && pathname === "/admin" ? " active" : ""}`}>
          <Grid3X3 aria-hidden="true" />Template Studio
        </Link>
        <Link to="/admin/templates" className={`wle-side-nav${isCore(["/admin/templates"]) ? " active" : ""}`}>
          <Layers aria-hidden="true" />Website Catalog
        </Link>
        <Link to="/admin/gpt-template-sync" className={`wle-side-nav${isCore(["/admin/gpt-template-sync"]) ? " active" : ""}`}>
          <Sparkles aria-hidden="true" />GPT Template Sync
        </Link>
        <Link to="/admin/json-gpt-sync" className={`wle-side-nav${isCore(["/admin/json-gpt-sync"]) ? " active" : ""}`}>
          <Code2 aria-hidden="true" />JSON GPT Sync
        </Link>
        <Link to="/admin/one-click-factory" className={`wle-side-nav${isCore(["/admin/one-click-factory"]) ? " active" : ""}`}>
          <Rocket aria-hidden="true" />One-Click Factory
        </Link>
        <Link to="/admin/generator-registry" className={`wle-side-nav${isCore(["/admin/generator-registry"]) ? " active" : ""}`}>
          <Shield aria-hidden="true" />Generator Registry
        </Link>
      </nav>

      {/* ── CORE: Inventory & Deployment ──────────────────────── */}
      <div className="wle-rail-label" style={{ marginTop: "14px" }}>INVENTORY & DEPLOYMENT</div>
      <nav className="wle-nav-container" aria-label="Inventory and deployment">
        <Link to="/admin/site-inventory" className={`wle-side-nav${isCore(["/admin/site-inventory"]) ? " active" : ""}`}>
          <Globe aria-hidden="true" />Site Inventory
        </Link>
        <Link to="/admin/launch-control" className={`wle-side-nav${isCore(["/admin/launch-control"]) ? " active" : ""}`}>
          <Rocket aria-hidden="true" />Launch Control Center
        </Link>
        <Link to="/admin/site-bank" className={`wle-side-nav${isCore(["/admin/site-bank"]) ? " active" : ""}`}>
          <Database aria-hidden="true" />Site Bank Automation
        </Link>
        <Link to="/admin/multi-launch" className={`wle-side-nav${isCore(["/admin/multi-launch"]) ? " active" : ""}`}>
          <Rocket aria-hidden="true" />Multi-Template Launcher
        </Link>
        <Link to="/admin/mass-launch" className={`wle-side-nav${isCore(["/admin/mass-launch"]) ? " active" : ""}`}>
          <ArrowUpFromLine aria-hidden="true" />Launch Queue
        </Link>
        <Link to="/admin/pwa-factory" className={`wle-side-nav${isCore(["/admin/pwa-factory"]) ? " active" : ""}`}>
          <Smartphone aria-hidden="true" />PWA App Factory
        </Link>
        <Link to="/admin/launch-status" className={`wle-side-nav${isCore(["/admin/launch-status"]) ? " active" : ""}`}>
          <Rocket aria-hidden="true" />Launch Status
        </Link>
        <Link to="/admin/pwa-launches" className={`wle-side-nav${isCore(["/admin/pwa-launches"]) ? " active" : ""}`}>
          <Activity aria-hidden="true" />PWA Launches
        </Link>
      </nav>

      {/* ── CORE: QA & Autonomous Ops ────────────────────────── */}
      <div className="wle-rail-label" style={{ marginTop: "14px" }}>QA & AUTONOMOUS OPS</div>
      <nav className="wle-nav-container" aria-label="QA and autonomous operations">
        <Link to="/admin/prompt-testing" className={`wle-side-nav${isCore(["/admin/prompt-testing"]) ? " active" : ""}`}>
          <Sparkles aria-hidden="true" />Prompt Testing Lab
        </Link>
        <Link to="/admin/background-ops" className={`wle-side-nav${isCore(["/admin/background-ops"]) ? " active" : ""}`}>
          <Bot aria-hidden="true" />Background Operations
        </Link>
      </nav>

      {/* ── CORE: Analytics & Integrations ────────────────────── */}
      <div className="wle-rail-label" style={{ marginTop: "14px" }}>ANALYTICS & INTEGRATIONS</div>
      <nav className="wle-nav-container" aria-label="Analytics and integrations">
        <Link to="/admin/analytics" className={`wle-side-nav${isCore(["/admin/analytics"]) ? " active" : ""}`}>
          <BarChart3 aria-hidden="true" />Analytics
        </Link>
        <Link to="/admin/tools" className={`wle-side-nav${isCore(["/admin/tools"]) ? " active" : ""}`}>
          <Wrench aria-hidden="true" />Integrations
        </Link>
        <Link to="/admin/brand-guardian" className={`wle-side-nav${isCore(["/admin/brand-guardian"]) ? " active" : ""}`}>
          <Shield aria-hidden="true" />Brand Guardian
        </Link>
        <Link to="/admin/image-validator" className={`wle-side-nav${isCore(["/admin/image-validator"]) ? " active" : ""}`}>
          <Shield aria-hidden="true" />Image Validator
        </Link>
        <Link to="/admin/visual-library" className={`wle-side-nav${isCore(["/admin/visual-library"]) ? " active" : ""}`}>
          <Layers aria-hidden="true" />Visual Render Library
        </Link>
      </nav>

      {/* ── ARCHIVED: Legacy systems (collapsible) ────────────── */}
      <div className="wle-rail-label" style={{ marginTop: "14px" }}>
        <button
          onClick={() => setArchiveOpen(!archiveOpen)}
          className="wle-side-nav"
          style={{ background: "none", border: 0, cursor: "pointer", width: "100%", textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.08em", color: "#89a6c2", padding: 0, display: "flex", alignItems: "center", gap: "4px" }}
        >
          {archiveOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <Archive className="w-3 h-3" /> Archived Systems
        </button>
      </div>
      {archiveOpen && (
        <nav className="wle-nav-container" aria-label="Archived systems" style={{ opacity: 0.6 }}>
          <Link to="/admin/site-command" className={`wle-side-nav${isCore(["/admin/site-command"]) ? " active" : ""}`}>
            <Check aria-hidden="true" />Approval Desk
          </Link>
          <Link to="/admin/assistant" className={`wle-side-nav${isCore(["/admin/assistant"]) ? " active" : ""}`}>
            <Radio aria-hidden="true" />AI Operations
          </Link>
          <Link to="/admin/sync" className={`wle-side-nav${isCore(["/admin/sync"]) ? " active" : ""}`}>
            <Settings aria-hidden="true" />GPT Sync
          </Link>
          <Link to="/admin/vision-intelligence" className={`wle-side-nav${isCore(["/admin/vision-intelligence"]) ? " active" : ""}`}>
            <Radar aria-hidden="true" />Vision Intelligence
          </Link>
          <Link to="/admin/fault-line" className={`wle-side-nav${isCore(["/admin/fault-line"]) ? " active" : ""}`}>
            <Bug aria-hidden="true" />FaultLine Scanner
          </Link>
          <Link to="/admin/god-mode-lab" className={`wle-side-nav${isCore(["/admin/god-mode-lab"]) ? " active" : ""}`}>
            <Cpu aria-hidden="true" />God Mode Lab
          </Link>
          <Link to="/admin/predictive-scoring" className={`wle-side-nav${isCore(["/admin/predictive-scoring"]) ? " active" : ""}`}>
            <Brain aria-hidden="true" />Predictive Scoring
          </Link>
          <Link to="/admin/benchmark-reverse" className={`wle-side-nav${isCore(["/admin/benchmark-reverse"]) ? " active" : ""}`}>
            <Diamond aria-hidden="true" />Benchmark Reverse-Engineer
          </Link>
        </nav>
      )}

      <div className="wle-aside-bottom">
        Florida Based · Nationwide Reach
        <a href="tel:+17722090266">☎ (772) 209-0266</a>
        <Link to="/admin/contents">All Tools</Link>
        <Link to="/">← Back to Website Launch Engine</Link>
      </div>
    </aside>
  );
}