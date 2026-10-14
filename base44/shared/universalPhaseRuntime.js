/**
 * UNIVERSAL PHASE RUNTIME v1 - deterministic, dependency-free planning adapter.
 * The existing generateSite() remains the ONLY website generator.
 *
 * Every one of the 30 canonical stages receives its identical generator
 * context. A stage is NOT "operational" merely because its packet exists.
 * Synthetic sandbox execution never creates leads, domains, live sites,
 * agents, queues, schedules or credentials.
 */
export const PHASE_GROUPS = Object.freeze([
  {
    key: "intelligence", name: "Intelligence", provider: "god-mode-lead-asset-foresight",
    steps: ["Industry Opportunity Scanner","Market Intelligence","God Mode SEO",
      "Digital Dominance","Name & Domain Intelligence","NearMe / NearYou Strategy","Opportunity Ranking"]
  },
  {
    key: "strategy", name: "Simulation and Strategy", provider: "god-mode-commander",
    steps: ["Strategy Tournament","Portfolio Simulator","Financial & ROI Analysis",
      "Ten-Strategy Comparison","Strategy Selection"]
  },
  {
    key: "builder", name: "Auto Builder", provider: "universal-generator",
    steps: ["Business Onboarding","Brand & Design System","Website Genome",
      "Visual Editor","Pack Review","Programmatic Launch"]
  },
  {
    key: "operations", name: "Operations", provider: "existing-x1-control-plane",
    steps: ["SEO & Content Ops","Social Media Studio","Image & Video Factory",
      "CRM & Client OS","Super Agent Command","Analytics & A/B Testing"]
  },
  {
    key: "validation", name: "Validation and Release", provider: "independent-validation-qa",
    steps: ["Fault Line Validation","Website Preview & QA","Domain Provisioning",
      "Vercel Deployment","System Health","System Contents"]
  }
]);
export const PHASE_STEPS = Object.freeze(PHASE_GROUPS.flatMap((phase) =>
  phase.steps.map((name, i) => Object.freeze({
    id: PHASE_GROUPS.slice(0, PHASE_GROUPS.indexOf(phase)).reduce((n, p) => n + p.steps.length, 0) + i + 1,
    name, phase: phase.key, provider: phase.provider,
    generator_entrypoint: "base44/shared/universalGenerator.ts#generateSite",
    default_execution: "NOT_EXECUTED",
  }))
));
if (PHASE_STEPS.length !== 30) throw new Error("UNIVERSAL_PHASE_CONSTITUTION_MUST_HAVE_30_STEPS");

const isString = (v) => typeof v === "string" && v.trim().length > 0;
const safeText = (v, max) => String(v || "").trim().slice(0, max);
export function createMissionPlan(input = {}) {
  if (!isString(input.niche)) throw new Error("NICHE_REQUIRED");
  if (!isString(input.brandName)) throw new Error("SYNTHETIC_BRAND_REQUIRED");
  if (!input.synthetic || input.allowProduction || input.allowPublishing || input.allowExternalMessaging)
    throw new Error("SANDBOX_ONLY_NO_EXTERNAL_SIDE_EFFECTS");
  if (input.phone || input.domain) throw new Error("NO_REAL_CONTACT_OR_DOMAIN_IN_SYNTHETIC_SANDBOX");
  const generator_context = Object.freeze({
    niche: safeText(input.niche, 72),
    brandName: safeText(input.brandName, 100),
    city: safeText(input.city, 80),
    state: safeText(input.state, 48)
  });
  const project = "XTREME-SYSTEMS/digital-dominance";
  const source_sha = safeText(input.sourceSha, 64) || "UNKNOWN";
  const plan_id = "dd-sandbox-" + [generator_context.niche, generator_context.brandName,
    generator_context.city, source_sha.slice(0, 8)].join("-")
    .toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").slice(0, 120);
  return Object.freeze({
    contract_version: "2026-10-14.1",
    plan_id, project, source_sha, synthetic: true, publish: false, indexable: false,
    live_provisioning: false, external_messages: false, spend: false, new_scheduler: false,
    existing_x1_only: true, scenario_count: 1000, scenario_class: "HYPOTHETICAL_UNCALIBRATED",
    buyer_evidence: "MISSING", production_approval: "MISSING",
    connectors: Object.freeze({
      god_mode_commander: "PLUGIN_IN_CHATGPT_NOT_SERVER_BINDING",
      lead_asset_foresight: "PLUGIN_IN_CHATGPT_NOT_SERVER_BINDING",
      x1_queue: "EXISTING_QUEUE_ONLY_NO_ENQUEUE",
      validation_agent: "STATIC_QA_ADAPTER",
      qa_agent: "INDEPENDENT_TEST_RUNNER"
    }),
    generator_context,
    work_packets: PHASE_STEPS.map(s => Object.freeze({
      id: plan_id + "-s" + String(s.id).padStart(2, "0"),
      step: s.id, phase: s.phase, title: s.name,
      provider: s.provider, generator_entrypoint: s.generator_entrypoint,
      generator_context, action_class: "READ_OR_SYNTHETIC_PREVIEW",
      status: "NOT_EXECUTED",
      source_sha, approval_required_for_external_effects: true
    }))
  });
}

export function toSandboxDocument(html) {
  if (typeof html !== "string" || !/<head(?:\s|>)/i.test(html) || !/<\/head>/i.test(html))
    throw new Error("GENERATOR_MUST_RETURN_FULL_HTML_DOCUMENT");
  const head = '<meta name="robots" content="noindex,nofollow,noarchive">' +
    '<meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; ' +
    'img-src data:; font-src data:; style-src &#39;unsafe-inline&#39;; ' +
    'form-action &#39;none&#39;; base-uri &#39;none&#39;">';
  return html.replace(/<\/head>/i, head + "</head>");
}

export function executeSyntheticMission(plan, generateSite, validateArtifact) {
  if (!plan?.synthetic || plan?.publish || plan?.live_provisioning ||
      plan?.production_approval !== "MISSING")
    throw new Error("PROTECTED_EXECUTION_DENIED");
  if (typeof generateSite !== "function" || typeof validateArtifact !== "function")
    throw new Error("GENERATOR_AND_INDEPENDENT_QA_REQUIRED");
  const generated = generateSite(plan.generator_context);
  if (!generated || typeof generated.html !== "string")
    throw new Error("UNIVERSAL_GENERATOR_OUTPUT_MISSING");
  const html = toSandboxDocument(generated.html);
  const qa = validateArtifact(html, {
    source_sha: plan.source_sha,
    plan_id: plan.plan_id,
    synthetic: true,
    expected_brand: plan.generator_context.brandName
  });
  if (!qa || !Array.isArray(qa.checks) || qa.checks.length === 0 ||
      !["PASS", "FAIL"].includes(qa.status))
    throw new Error("INDEPENDENT_QA_RECEIPT_REQUIRED");
  const generatorPacket = plan.work_packets.find(p => p.step === 15);
  const qaPacket = plan.work_packets.find(p => p.step === 26);
  const results = plan.work_packets.map(p => ({
    step: p.step, phase: p.phase, provider: p.provider,
    status: p.step === generatorPacket.step ? "PASS_SYNTHETIC_GENERATION" :
      p.step === qaPacket.step ? (qa.status === "PASS" ? "PASS_SANDBOX_QA" : "FAIL_SANDBOX_QA") :
      "NOT_EXECUTED",
    source_sha: p.source_sha
  }));
  return {
    plan_id: plan.plan_id, source_sha: plan.source_sha, synthetic: true,
    indexable: false, publish: false, live_deployment: false,
    generator: { name: "universalGenerator.generateSite", niche: generated.niche,
      html_bytes: new TextEncoder().encode(html).byteLength,
      supported_niches: generated.supportedNiches?.length || null },
    qa, results, executed_step_count: 2,
    remaining_step_count: 28,
    status: qa.status === "PASS" ? "SANDBOX_PREVIEW_VALIDATED" : "SANDBOX_QA_FAILED",
    release_gate: "BLOCKED_NO_EXTERNAL_PROVIDER_EVIDENCE_OR_OPERATOR_APPROVAL",
    sandbox_html: html
  };
}

export function phaseSummary(result) {
  return PHASE_GROUPS.map(phase => {
    const rows = result.results.filter(r => r.phase === phase.key);
    return { key: phase.key, name: phase.name, provider: phase.provider,
      total_steps: rows.length, executed_steps: rows.filter(r => r.status.startsWith("PASS_")).length,
      unexecuted_steps: rows.filter(r => r.status === "NOT_EXECUTED").length,
      stage_status: rows.some(r => r.status === "FAIL_SANDBOX_QA") ? "FAIL" :
        rows.some(r => r.status === "NOT_EXECUTED") ? "PARTIAL" : "PASS" };
  });
}