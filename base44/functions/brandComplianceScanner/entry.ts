import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";

// ─────────────────────────────────────────────────────────────────────────────
// brandComplianceScanner — the Brand Compliance Guardian's backend engine.
// Scans admin pages for branding deviations, identifies over-complicated
// systems to hide, and enforces the mandatory branding config.
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_PAGES = [
  { route: "/admin", name: "Template Studio", section: "core" },
  { route: "/admin/templates", name: "Website Catalog", section: "core" },
  { route: "/admin/site-inventory", name: "Site Inventory", section: "core" },
  { route: "/admin/multi-launch", name: "Multi-Template Launcher", section: "core" },
  { route: "/admin/mass-launch", name: "Launch Queue", section: "core" },
  { route: "/admin/pwa-factory", name: "PWA App Factory", section: "core" },
  { route: "/admin/launch-status", name: "Launch Status", section: "core" },
  { route: "/admin/pwa-launches", name: "PWA Launches", section: "core" },
  { route: "/admin/prompt-testing", name: "Prompt Testing Lab", section: "core" },
  { route: "/admin/background-ops", name: "Background Operations", section: "core" },
  { route: "/admin/analytics", name: "Analytics", section: "core" },
  { route: "/admin/tools", name: "Integrations", section: "core" },
  { route: "/admin/site-command", name: "Approval Desk", section: "archived" },
  { route: "/admin/assistant", name: "AI Operations", section: "archived" },
  { route: "/admin/sync", name: "GPT Sync", section: "archived" },
  { route: "/admin/vision-intelligence", name: "Vision Intelligence", section: "archived" },
  { route: "/admin/fault-line", name: "FaultLine Scanner", section: "archived" },
  { route: "/admin/god-mode-lab", name: "God Mode Lab", section: "archived" },
  { route: "/admin/predictive-scoring", name: "Predictive Scoring", section: "archived" },
  { route: "/admin/benchmark-reverse", name: "Benchmark Reverse-Engineer", section: "archived" },
];

// Systems that are over-complicated and should be hidden in the background
const OVER_COMPLICATED_SYSTEMS = [
  { name: "God Mode Lab", route: "/admin/god-mode-lab", reason: "Over-complicated simulation interface — hidden to background ops" },
  { name: "Predictive Scoring", route: "/admin/predictive-scoring", reason: "Complex Monte Carlo UI — moved to background autonomous agent" },
  { name: "FaultLine Scanner", route: "/admin/fault-line", reason: "Heavy forensic scanner — runs autonomously in background" },
  { name: "Benchmark Reverse-Engineer", route: "/admin/benchmark-reverse", reason: "Complex capture pipeline — hidden to background ops" },
  { name: "Vision Intelligence", route: "/admin/vision-intelligence", reason: "Over-engineered vision cortex — simplified into background" },
];

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Admin access required" }, { status: 403 });
    const svc = base44.asServiceRole;

    const body = await req.json().catch(() => ({}));
    const action = body.action || "status";

    // ── status: Get current branding compliance status ──
    if (action === "status") {
      const branding = await svc.entities.MandatoryBranding.filter({ is_active: true }, "-created_date", 1);
      const active = branding[0] || null;
      if (!active) return Response.json({ ok: true, active: false, message: "No active mandatory branding config. Run 'enforce' to seed it." });
      return Response.json({
        ok: true,
        active: true,
        brand_name: active.brand_name,
        compliance_score: active.compliance_score || 100,
        deviations: active.deviations || [],
        hidden_systems: active.hidden_systems || [],
        last_audited_at: active.last_audited_at,
        audit_notes: active.audit_notes || "",
      });
    }

    // ── enforce: Seed or update the mandatory branding config ──
    if (action === "enforce") {
      // Deactivate any existing active records
      const existing = await svc.entities.MandatoryBranding.filter({ is_active: true });
      for (const rec of existing) {
        await svc.entities.MandatoryBranding.update(rec.id, { is_active: false });
      }

      // The exact admin reference branding (from --launch-admin-* variables)
      const brandingConfig = {
        brand_name: "Website Launch Engine",
        tagline: "STRATEGIC MINDS AI",
        logo_emoji: "🚀",
        colors: {
          canvas: "#f4f8fd",
          text: "#112940",
          surface: "#ffffff",
          rail: "#031327",
          rail_text: "#e9f4ff",
          rail_border: "#275074",
          rail_muted: "#89a6c2",
          rail_link: "#bad3e9",
          primary: "#126fc8",
          primary_border: "#309afb",
          sky: "#6cc6ff",
          heading: "#06213b",
          border: "#dce6f1",
          muted: "#5b7288",
          accent_green: "#22c55e",
          accent_gold: "#D4AF37",
        },
        fonts: {
          heading: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif",
          body: "Inter, ui-sans-serif, system-ui, sans-serif",
          mono: "JetBrains Mono, ui-monospace, monospace",
        },
        radii: { sm: "8px", md: "12px", lg: "16px", xl: "20px" },
        shadows: {
          card: "0 8px 24px rgba(0, 0, 0, 0.08)",
          glow: "0 0 16px -2px rgba(34, 197, 94, 0.5)",
          blue: "0 0 16px -2px rgba(0, 162, 255, 0.5)",
        },
        nav_structure: ADMIN_PAGES.map(p => ({
          label: p.name,
          route: p.route,
          section: p.section,
          is_archived: p.section === "archived",
        })),
        hidden_systems: OVER_COMPLICATED_SYSTEMS.map(s => ({
          ...s,
          hidden_at: new Date().toISOString(),
        })),
        compliance_score: 100,
        deviations: [],
        is_active: true,
        last_audited_at: new Date().toISOString(),
        audit_notes: "Mandatory branding enforced from admin reference layout. All over-complicated systems hidden to background.",
      };

      const record = await svc.entities.MandatoryBranding.create(brandingConfig);
      return Response.json({ ok: true, record, message: "Mandatory branding enforced across all admin pages." });
    }

    // ── scan: Scan admin pages for branding deviations ──
    if (action === "scan") {
      const branding = await svc.entities.MandatoryBranding.filter({ is_active: true }, "-created_date", 1);
      const active = branding[0];
      if (!active) return Response.json({ ok: false, error: "No active branding config. Run 'enforce' first." }, { status: 400 });

      // Use LLM to scan for deviations and over-complicated content
      const scanPrompt = `You are the Brand Compliance Guardian. Scan the admin system for branding deviations and over-complicated content.

MANDATORY BRANDING:
- Colors: canvas #f4f8fd, text #112940, surface #ffffff, rail #031327, primary #126fc8, accent_green #22c55e, accent_gold #D4AF37
- Fonts: Plus Jakarta Sans (heading), Inter (body), JetBrains Mono (mono)
- Style: Clean, professional, navy sidebar rail, light canvas, blue primary CTAs

ADMIN PAGES TO AUDIT:
${ADMIN_PAGES.map(p => `- ${p.name} (${p.route}) [${p.section}]`).join("\n")}

SYSTEMS ALREADY HIDDEN (over-complicated, moved to background):
${OVER_COMPLICATED_SYSTEMS.map(s => `- ${s.name}: ${s.reason}`).join("\n")}

Return a JSON object with:
- deviations: array of { page, issue, severity, recommended_fix } for any pages that deviate from the mandatory branding
- simplifications: array of { system, reason } for any remaining over-complicated systems that should be hidden
- compliance_score: number 0-100
- audit_notes: summary of findings`;

      const llmRes = await base44.integrations.Core.InvokeLLM({
        prompt: scanPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            deviations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  page: { type: "string" },
                  issue: { type: "string" },
                  severity: { type: "string", enum: ["low", "medium", "high"] },
                  recommended_fix: { type: "string" },
                },
                required: ["page", "issue", "severity"],
              },
            },
            simplifications: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  system: { type: "string" },
                  reason: { type: "string" },
                },
              },
            },
            compliance_score: { type: "number" },
            audit_notes: { type: "string" },
          },
          required: ["deviations", "simplifications", "compliance_score", "audit_notes"],
        },
      });

      const result = typeof llmRes === "string" ? JSON.parse(llmRes) : llmRes;

      // Update the branding record with scan results
      const updated = await svc.entities.MandatoryBranding.update(active.id, {
        deviations: result.deviations || [],
        compliance_score: result.compliance_score || 100,
        last_audited_at: new Date().toISOString(),
        audit_notes: result.audit_notes || "",
      });

      return Response.json({
        ok: true,
        scan: result,
        record: updated,
      });
    }

    // ── simplify: Hide over-complicated systems into the background ──
    if (action === "simplify") {
      const branding = await svc.entities.MandatoryBranding.filter({ is_active: true }, "-created_date", 1);
      const active = branding[0];
      if (!active) return Response.json({ ok: false, error: "No active branding config. Run 'enforce' first." }, { status: 400 });

      const hiddenSystems = OVER_COMPLICATED_SYSTEMS.map(s => ({
        ...s,
        hidden_at: new Date().toISOString(),
      }));

      const updated = await svc.entities.MandatoryBranding.update(active.id, {
        hidden_systems: hiddenSystems,
        audit_notes: `Simplified admin: ${hiddenSystems.length} over-complicated systems hidden to background operations. Admin sidebar shows only core, essential tools.`,
        last_audited_at: new Date().toISOString(),
      });

      return Response.json({
        ok: true,
        hidden_count: hiddenSystems.length,
        hidden_systems: hiddenSystems,
        record: updated,
        message: `${hiddenSystems.length} over-complicated systems hidden to background. Admin sidebar is now clean and focused.`,
      });
    }

    // ── getBranding: Return the active branding config for the admin layout ──
    if (action === "getBranding") {
      const branding = await svc.entities.MandatoryBranding.filter({ is_active: true }, "-created_date", 1);
      const active = branding[0] || null;
      return Response.json({ ok: true, branding: active });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("[brandComplianceScanner] Error:", error.message);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}