import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import AIAssistBubble from "@/components/ai-assist/AIAssistBubble";
import ReferenceAdminSidebar from "@/components/launch-engine-admin/ReferenceAdminSidebar";
import ReferenceAdminHeader from "@/components/launch-engine-admin/ReferenceAdminHeader";
import "@/components/launch-engine-admin/ReferenceAdmin.css";

// The exact mandatory branding — injected as CSS variables into the admin shell.
// This is the single source of truth; the Brand Compliance Guardian keeps it enforced.
const MANDATORY_BRAND_VARS = {
  "--launch-admin-canvas": "#f4f8fd",
  "--launch-admin-text": "#112940",
  "--launch-admin-surface": "#ffffff",
  "--launch-admin-rail": "#031327",
  "--launch-admin-rail-text": "#e9f4ff",
  "--launch-admin-rail-border": "#275074",
  "--launch-admin-rail-muted": "#89a6c2",
  "--launch-admin-rail-link": "#bad3e9",
  "--launch-admin-primary": "#126fc8",
  "--launch-admin-primary-border": "#309afb",
  "--launch-admin-sky": "#6cc6ff",
  "--launch-admin-heading": "#06213b",
  "--launch-admin-border": "#dce6f1",
  "--launch-admin-muted": "#5b7288",
  "--launch-admin-accent-green": "#22c55e",
  "--launch-admin-accent-gold": "#D4AF37",
};

export default function AdminLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [branding, setBranding] = useState(null);
  const isReference = ["/admin", "/admin/", "/admin.html"].includes(pathname);

  useEffect(() => {
    // Load the active mandatory branding config and inject it as CSS variables
    base44.functions.invoke("brandComplianceScanner", { action: "getBranding" })
      .then(res => setBranding(res.data?.branding || null))
      .catch(() => setBranding(null));
  }, []);

  if (user && user.role !== "admin") return <Navigate to="/portal/dashboard" replace />;

  // Build the CSS variable map from the active branding record, falling back to the hardcoded mandatory set
  const brandVars = branding?.colors ? {
    "--launch-admin-canvas": branding.colors.canvas || MANDATORY_BRAND_VARS["--launch-admin-canvas"],
    "--launch-admin-text": branding.colors.text || MANDATORY_BRAND_VARS["--launch-admin-text"],
    "--launch-admin-surface": branding.colors.surface || MANDATORY_BRAND_VARS["--launch-admin-surface"],
    "--launch-admin-rail": branding.colors.rail || MANDATORY_BRAND_VARS["--launch-admin-rail"],
    "--launch-admin-rail-text": branding.colors.rail_text || MANDATORY_BRAND_VARS["--launch-admin-rail-text"],
    "--launch-admin-rail-border": branding.colors.rail_border || MANDATORY_BRAND_VARS["--launch-admin-rail-border"],
    "--launch-admin-rail-muted": branding.colors.rail_muted || MANDATORY_BRAND_VARS["--launch-admin-rail-muted"],
    "--launch-admin-rail-link": branding.colors.rail_link || MANDATORY_BRAND_VARS["--launch-admin-rail-link"],
    "--launch-admin-primary": branding.colors.primary || MANDATORY_BRAND_VARS["--launch-admin-primary"],
    "--launch-admin-primary-border": branding.colors.primary_border || MANDATORY_BRAND_VARS["--launch-admin-primary-border"],
    "--launch-admin-sky": branding.colors.sky || MANDATORY_BRAND_VARS["--launch-admin-sky"],
    "--launch-admin-heading": branding.colors.heading || MANDATORY_BRAND_VARS["--launch-admin-heading"],
    "--launch-admin-border": branding.colors.border || MANDATORY_BRAND_VARS["--launch-admin-border"],
    "--launch-admin-muted": branding.colors.muted || MANDATORY_BRAND_VARS["--launch-admin-muted"],
    "--launch-admin-accent-green": branding.colors.accent_green || MANDATORY_BRAND_VARS["--launch-admin-accent-green"],
    "--launch-admin-accent-gold": branding.colors.accent_gold || MANDATORY_BRAND_VARS["--launch-admin-accent-gold"],
  } : MANDATORY_BRAND_VARS;

  return (
    <div className="wle-admin" style={brandVars}>
      <ReferenceAdminSidebar />
      <main className="wle-main">
        <ReferenceAdminHeader isReference={isReference} />
        <Outlet />
      </main>
      {!isReference && <AIAssistBubble />}
    </div>
  );
}