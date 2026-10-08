import { createClientFromRequest } from "npm:@base44/sdk@0.8.48";

function slugify(value: string) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function safeArray(value: any, max = 20) {
  return Array.isArray(value) ? value.slice(0, max) : [];
}

export default async function(req: Request): Promise<Response> {
  try {
    if (req.method !== "POST") return Response.json({ error: "POST required" }, { status: 405 });

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const config = body?.config || {};
    const industry = config?.industry || {};
    const businessName = String(config?.businessName || "").trim();
    const industryId = String(industry?.id || body?.industry_id || "").trim();

    if (!businessName || !industryId) {
      return Response.json({ error: "businessName and industry.id are required" }, { status: 400 });
    }

    const svc = base44.asServiceRole;
    let opportunity: any = null;
    const opportunityId = String(body?.opportunity_id || "").trim();
    if (opportunityId) {
      opportunity = await svc.entities.Opportunity.get(opportunityId);
      if (!opportunity) return Response.json({ error: "Opportunity not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const packetSeed = [
      businessName,
      industryId,
      String(config?.city || ""),
      String(config?.state || ""),
      String(config?.domain || ""),
      now.slice(0, 16),
    ].join("|");
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(packetSeed)));
    const packetId = "site_" + Array.from(digest.slice(0, 10)).map((b) => b.toString(16).padStart(2, "0")).join("");
    const templateSlug = slugify(config?.domain || businessName + "-" + industryId);

    const routes = [
      { path: "/", role: "home", index_eligible: true },
      { path: "/services", role: "service_hub", index_eligible: true },
      { path: "/contact", role: "lead_capture", index_eligible: true },
    ];

    for (const service of safeArray(config?.content?.services || industry?.services, 6)) {
      const label = typeof service === "string" ? service : service?.name || service?.title || "";
      if (!label) continue;
      routes.push({
        path: "/services/" + slugify(label),
        role: "service_detail",
        index_eligible: true,
      });
    }

    // Location expansion is intentionally disabled in the initial packet.
    // It requires differentiated local value plus separate validation.
    const productionLocks = {
      domain_purchase_authorized: false,
      production_deploy_authorized: false,
      public_publish_authorized: false,
      social_publish_authorized: false,
      customer_message_authorized: false,
      indexable_programmatic_pages_authorized: false,
    };

    const sourceEvidence = {
      opportunity_id: opportunity?.id || null,
      evidence_state: opportunity?.evidence_state || "operator_brief",
      decision_score: Number(opportunity?.decision_score || 0),
      automation_eligibility: opportunity?.automation_eligibility || "research_only",
      note: opportunity
        ? "Opportunity evidence is inherited for prioritization only; it does not authorize release."
        : "Direct operator brief. Preview build is allowed, but no market-validation claim is implied.",
    };

    const buildPacket = {
      version: "ddv3-site-build-v1",
      mode: "preview_only",
      source_truth: sourceEvidence,
      business: {
        name: businessName,
        industry_id: industryId,
        industry_label: industry?.label || industryId,
        city: config?.city || "",
        state: config?.state || "",
        proposed_domain: config?.domain || "",
      },
      brand: {
        accent_color: config?.accentColor || "",
        accent_name: config?.accentName || "",
        logo_url: config?.logoUrl || "",
      },
      content: config?.content || {},
      stack_target: {
        framework: "Next.js App Router",
        language: "TypeScript",
        styling: "Tailwind + shadcn/ui",
        data: "Supabase with RLS where applicable",
        source_control: "GitHub feature branch + PR",
        hosting: "Vercel Preview before production",
      },
      routes,
      programmatic_location_pages: {
        enabled: false,
        reason: "DDV3 requires verified local demand, fulfillment, differentiated value, and validation before indexable expansion.",
      },
      release_locks: productionLocks,
      validation_gates: [
        "install_build_lint_typecheck",
        "route_integrity",
        "form_submission",
        "database_persistence",
        "rls_tenant_checks",
        "desktop_1440x1100",
        "mobile_390x844",
        "console_runtime_errors",
        "accessibility_smoke",
        "metadata_canonical",
        "robots_sitemap",
        "jsonld_parse",
        "cta_function",
        "rollback_target",
      ],
    };

    const template = await svc.entities.WebsiteTemplate.create({
      name: `${businessName} — ${industry?.label || industryId}`,
      slug: templateSlug,
      config: {
        company_name: businessName,
        domain: config?.domain || "",
        primary_city: config?.city || "",
        primary_state: config?.state || "",
        color_scheme: config?.accentName || "",
        accent_color: config?.accentColor || "",
        logo_url: config?.logoUrl || "",
        industry: industryId,
        industry_label: industry?.label || industryId,
        hero_headline: config?.content?.hero_headline || industry?.heroHeadline || "",
        hero_subhead: config?.content?.hero_subhead || industry?.heroSubhead || "",
        cta_text: industry?.ctaText || "",
        services: safeArray(config?.content?.services || industry?.services, 12),
        content: config?.content || {},
      },
      status: "configured",
      pwa_enabled: true,
      launch_mode: "manual",
      deploy_log: JSON.stringify({
        state: "preview_packet_compiled",
        production_mutation: false,
        packet_id: packetId,
      }),
    });

    const workPacketId = "wp_" + packetId;
    await svc.entities.WorkPacket.create({
      packet_id: workPacketId,
      session_id: packetId,
      title: `Preview build: ${businessName}`,
      objective: "Build and independently validate a branch/preview website. Do not perform protected production actions.",
      description: "DDV3 governed website factory preview packet.",
      phase: "BUILD",
      status: "READY",
      risk_class: "BRANCH_WRITE",
      inputs: JSON.stringify({ website_build_packet_id: packetId, template_id: template.id }).slice(0, 3000),
      outputs: "GitHub feature branch, Vercel preview URL, validation receipts, screenshots, rollback target.",
      source_truth: opportunity?.id ? `Opportunity:${opportunity.id}` : "Operator brief",
      dependencies: [],
      parallel_safe: false,
      acceptance_criteria: "Preview builds successfully and every applicable validation gate has evidence.",
      validation_requirements: buildPacket.validation_gates.join(", "),
      allowed_actions: [
        "create_feature_branch",
        "write_branch_code",
        "create_pull_request",
        "create_preview_deployment",
        "run_validation",
        "capture_screenshots",
        "write_validation_receipts"
      ],
      forbidden_actions: [
        "merge_default_branch",
        "production_deploy",
        "purchase_domain",
        "change_dns",
        "publish_social",
        "send_customer_message",
        "create_or_replace_secret",
        "index_mass_programmatic_pages",
        "destructive_action",
        "spend_money"
      ],
      recommended_tools: ["GitHub", "Vercel", "Supabase", "XTREME_CLOUD_BROWSER"],
      recommended_executor: "GITHUB_AGENT",
      fallback_executor: "HUMAN",
      affected_systems: ["Digital Dominance V3 Website Factory"],
      rollback_requirements: "Abandon preview branch and deployment; production remains unchanged.",
      order: 0,
    });

    const build = await svc.entities.WebsiteBuildPacket.create({
      packet_id: packetId,
      template_id: template.id,
      work_packet_id: workPacketId,
      opportunity_id: opportunity?.id || "",
      business_name: businessName,
      industry_id: industryId,
      industry_label: industry?.label || industryId,
      city: config?.city || "",
      state: config?.state || "",
      proposed_domain: config?.domain || "",
      build_mode: "preview_only",
      status: "PREVIEW_QUEUED",
      source_evidence_state: sourceEvidence.evidence_state,
      source_decision_score: sourceEvidence.decision_score,
      source_automation_eligibility: sourceEvidence.automation_eligibility,
      source_config_json: JSON.stringify(config).slice(0, 10000),
      build_packet_json: JSON.stringify(buildPacket).slice(0, 20000),
      route_manifest_json: JSON.stringify(routes).slice(0, 10000),
      validation_requirements_json: JSON.stringify(buildPacket.validation_gates).slice(0, 10000),
      ...productionLocks,
      release_authorized: false,
      requested_by: user.email || user.id,
      requested_at: now,
      validation_status: "PENDING",
      notes: "Preview only. Protected production actions remain locked until separate validation and approval.",
    });

    return Response.json({
      ok: true,
      packet_id: build.packet_id,
      template_id: template.id,
      work_packet_id: workPacketId,
      status: build.status,
      build_mode: build.build_mode,
      source_truth: sourceEvidence,
      routes,
      production_locks: productionLocks,
      next_action: "Execute branch/preview build, then attach validation receipts before requesting release approval.",
    });
  } catch (error: any) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
