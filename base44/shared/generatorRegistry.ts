/**
 * Generator Registry — Authoritative classification of every generator
 * in the Digital Dominance system.
 *
 * Each generator is classified: REUSE | CONNECT | REPAIR | REFACTOR | MERGE | NEW-GAP | QUARANTINE
 * with its source path, contract type, and quality gate status.
 *
 * This is the single source of truth for which generators exist, what they do,
 * and whether they route through the Universal Generation Contract.
 */

export type GeneratorClassification =
  | "REUSE"        // Working, canonical — keep as-is
  | "CONNECT"      // Working but not yet routed through Universal Generation Contract
  | "REPAIR"       // Has known defects — needs fix
  | "REFACTOR"     // Works but should be refactored for consistency
  | "MERGE"        // Duplicate pathway — merge into canonical
  | "NEW-GAP"      // Missing capability — needs new generator
  | "QUARANTINE";  // Broken or dangerous — disable

export type GeneratorCategory =
  | "website" | "template" | "image" | "content" | "seo"
  | "brand" | "social" | "app_pwa" | "funnel" | "benchmark"
  | "deploy" | "validation" | "workflow" | "agent" | "pack";

export interface GeneratorEntry {
  id: string;
  name: string;
  source_path: string;
  category: GeneratorCategory;
  classification: GeneratorClassification;
  routes_through_universal_contract: boolean;
  quality_gate_status: "PASS" | "FAIL" | "UNKNOWN" | "BLOCKED";
  notes: string;
}

export const GENERATOR_REGISTRY: GeneratorEntry[] = [
  // === CANONICAL WEBSITE/TEMPLATE GENERATORS ===
  {
    id: "universal-generator",
    name: "Universal Generator",
    source_path: "base44/shared/universalGenerator.ts",
    category: "website",
    classification: "REUSE",
    routes_through_universal_contract: true,
    quality_gate_status: "PASS",
    notes: "THE canonical entry point. All website generation must route here.",
  },
  {
    id: "visual-template-engine",
    name: "Visual Template Engine",
    source_path: "base44/shared/visualTemplateEngine.ts",
    category: "template",
    classification: "REUSE",
    routes_through_universal_contract: true,
    quality_gate_status: "PASS",
    notes: "Niche profiles + HTML generation. Called by universalGenerator.",
  },
  {
    id: "template-layout-variants",
    name: "Template Layout Variants (A/B/C)",
    source_path: "base44/shared/templateLayoutVariants.ts",
    category: "template",
    classification: "REUSE",
    routes_through_universal_contract: true,
    quality_gate_status: "PASS",
    notes: "Three distinct compositional families. Called by visualTemplateEngine.",
  },
  {
    id: "apex-donor-registry",
    name: "APEX Donor Pattern Registry",
    source_path: "base44/shared/apexDonorRegistry.ts",
    category: "template",
    classification: "REUSE",
    routes_through_universal_contract: true,
    quality_gate_status: "PASS",
    notes: "Maps niches to structural patterns. Called by universalGenerator.",
  },

  // === STOCK TEMPLATE FACTORY ===
  {
    id: "stock-template-factory",
    name: "Stock Template Factory",
    source_path: "base44/functions/stockTemplateFactory/entry.ts",
    category: "template",
    classification: "CONNECT",
    routes_through_universal_contract: false,
    quality_gate_status: "UNKNOWN",
    notes: "Generates TemplateLibrary records. Should route through universalGenerator.",
  },
  {
    id: "publish-template-live",
    name: "Publish Template Live",
    source_path: "base44/functions/publishTemplateLive/entry.ts",
    category: "deploy",
    classification: "CONNECT",
    routes_through_universal_contract: false,
    quality_gate_status: "UNKNOWN",
    notes: "Publishes templates to live URLs. Should verify through quality gates.",
  },

  // === MASS LAUNCH ===
  {
    id: "mass-launch-orchestrator",
    name: "Mass Launch Orchestrator",
    source_path: "base44/functions/massLaunchOrchestrator/entry.ts",
    category: "website",
    classification: "CONNECT",
    routes_through_universal_contract: false,
    quality_gate_status: "UNKNOWN",
    notes: "Orchicates bulk site creation. Must route through universalGenerator.",
  },
  {
    id: "bulk-launch-engine",
    name: "Bulk Launch Engine",
    source_path: "base44/functions/bulkLaunchEngine/entry.ts",
    category: "website",
    classification: "CONNECT",
    routes_through_universal_contract: false,
    quality_gate_status: "UNKNOWN",
    notes: "Batch site generation. Must route through universalGenerator.",
  },
  {
    id: "site-bank-orchestrator",
    name: "Site Bank Orchestrator",
    source_path: "base44/functions/siteBankOrchestrator/entry.ts",
    category: "website",
    classification: "CONNECT",
    routes_through_universal_contract: false,
    quality_gate_status: "UNKNOWN",
    notes: "Manages SiteBank records. Should verify generated content through gates.",
  },

  // === IMAGE GENERATORS ===
  {
    id: "image-category-validator",
    name: "Image Category Validator",
    source_path: "base44/functions/imageCategoryValidator/entry.ts",
    category: "validation",
    classification: "REUSE",
    routes_through_universal_contract: true,
    quality_gate_status: "PASS",
    notes: "Independent image-niche semantic validator. Fail-closed.",
  },
  {
    id: "template-image-mandate",
    name: "Template Image Mandate",
    source_path: "base44/functions/templateImageMandate/entry.ts",
    category: "image",
    classification: "REPAIR",
    routes_through_universal_contract: false,
    quality_gate_status: "UNKNOWN",
    notes: "Enforces image requirements. Needs audit against new registries.",
  },
  {
    id: "image-ingestion",
    name: "Image Ingestion",
    source_path: "base44/functions/imageIngestion/entry.ts",
    category: "image",
    classification: "CONNECT",
    routes_through_universal_contract: false,
    quality_gate_status: "UNKNOWN",
    notes: "Ingests images from uploads. Should verify provenance.",
  },

  // === BENCHMARK ===
  {
    id: "benchmark-reverse-engineer",
    name: "Benchmark Reverse Engineer",
    source_path: "base44/functions/benchmarkReverseEngineer/entry.ts",
    category: "benchmark",
    classification: "REUSE",
    routes_through_universal_contract: false,
    quality_gate_status: "UNKNOWN",
    notes: "Captures competitor benchmarks. Independent evidence source.",
  },
  {
    id: "industry-benchmark-capture",
    name: "Industry Benchmark Capture",
    source_path: "base44/functions/industryBenchmarkCapture/entry.ts",
    category: "benchmark",
    classification: "REUSE",
    routes_through_universal_contract: false,
    quality_gate_status: "UNKNOWN",
    notes: "Cloud browser screenshot capture. Independent visual evidence.",
  },
  {
    id: "benchmark-visual-quality-check",
    name: "Benchmark Visual Quality Check",
    source_path: "base44/functions/benchmarkVisualQualityCheck/entry.ts",
    category: "validation",
    classification: "REUSE",
    routes_through_universal_contract: false,
    quality_gate_status: "UNKNOWN",
    notes: "Visual quality assessment against benchmarks.",
  },

  // === AUTONOMOUS ===
  {
    id: "autonomous-visual-orchestrator",
    name: "Autonomous Visual Orchestrator",
    source_path: "base44/functions/autonomousVisualOrchestrator/entry.ts",
    category: "image",
    classification: "CONNECT",
    routes_through_universal_contract: false,
    quality_gate_status: "UNKNOWN",
    notes: "Autonomous image generation. Must route through image validator.",
  },
  {
    id: "autonomous-template-enhancer",
    name: "Autonomous Template Enhancer",
    source_path: "base44/functions/autonomousTemplateEnhancer/entry.ts",
    category: "template",
    classification: "CONNECT",
    routes_through_universal_contract: false,
    quality_gate_status: "UNKNOWN",
    notes: "AI-enhances templates. Must route through quality gates.",
  },

  // === SEO ===
  {
    id: "seo-generator",
    name: "SEO Generator",
    source_path: "base44/functions/seoGenerator/entry.ts",
    category: "seo",
    classification: "CONNECT",
    routes_through_universal_contract: false,
    quality_gate_status: "UNKNOWN",
    notes: "Generates SEO pages. Should route through universalGenerator for consistency.",
  },
  {
    id: "generate-seo-page",
    name: "Generate SEO Page",
    source_path: "base44/functions/generateSeoPage/entry.ts",
    category: "seo",
    classification: "CONNECT",
    routes_through_universal_contract: false,
    quality_gate_status: "UNKNOWN",
    notes: "Individual SEO page generation. Should use universalGenerator.",
  },

  // === VALIDATION ===
  {
    id: "headless-site-validator",
    name: "Headless Site Validator",
    source_path: "base44/functions/headlessSiteValidator/entry.ts",
    category: "validation",
    classification: "REUSE",
    routes_through_universal_contract: true,
    quality_gate_status: "PASS",
    notes: "Fail-closed validator. Rejects null/untested checks. REPAIRED.",
  },
  {
    id: "site-launch-validator",
    name: "Site Launch Validator",
    source_path: "base44/functions/siteLaunchValidator/entry.ts",
    category: "validation",
    classification: "REPAIR",
    routes_through_universal_contract: false,
    quality_gate_status: "UNKNOWN",
    notes: "Needs audit for fail-closed behavior matching headlessSiteValidator.",
  },
  {
    id: "full-site-test-agent",
    name: "Full Site Test Agent",
    source_path: "base44/functions/fullSiteTestAgent/entry.ts",
    category: "validation",
    classification: "CONNECT",
    routes_through_universal_contract: false,
    quality_gate_status: "UNKNOWN",
    notes: "E2E browser testing. Should produce evidence receipts.",
  },

  // === DEPLOY ===
  {
    id: "vercel-deploy",
    name: "Vercel Deploy",
    source_path: "base44/functions/vercelDeploy/entry.ts",
    category: "deploy",
    classification: "REUSE",
    routes_through_universal_contract: false,
    quality_gate_status: "UNKNOWN",
    notes: "Deploys to Vercel. Protected — requires approval for production.",
  },

  // === GPT SYNC ===
  {
    id: "gpt-template-ingestor",
    name: "GPT Template Ingestor",
    source_path: "base44/functions/gptTemplateIngestor/entry.ts",
    category: "template",
    classification: "CONNECT",
    routes_through_universal_contract: false,
    quality_gate_status: "UNKNOWN",
    notes: "GPT-generated template ingestion. Must validate through quality gates.",
  },
  {
    id: "gpt-sync-engine",
    name: "GPT Sync Engine",
    source_path: "base44/functions/gptSyncEngine/entry.ts",
    category: "workflow",
    classification: "REUSE",
    routes_through_universal_contract: false,
    quality_gate_status: "UNKNOWN",
    notes: "Bi-directional sync. Independent from generation pipeline.",
  },

  // === REBRAND ===
  {
    id: "rebrand-generator",
    name: "Rebrand Generator",
    source_path: "base44/functions/rebrandGenerator/entry.ts",
    category: "brand",
    classification: "CONNECT",
    routes_through_universal_contract: false,
    quality_gate_status: "UNKNOWN",
    notes: "Brand rebranding. Should use universal contract for asset provenance.",
  },

  // === PWA ===
  {
    id: "pwa-publish-live",
    name: "PWA Publish Live",
    source_path: "base44/functions/pwaPublishLive/entry.ts",
    category: "deploy",
    classification: "CONNECT",
    routes_through_universal_contract: false,
    quality_gate_status: "UNKNOWN",
    notes: "PWA deployment. Should validate through quality gates before publish.",
  },

  // === SCORING ===
  {
    id: "template-scoring",
    name: "Template Scoring",
    source_path: "base44/shared/templateScoring.ts",
    category: "validation",
    classification: "REUSE",
    routes_through_universal_contract: true,
    quality_gate_status: "PASS",
    notes: "Score theater removed. All scores now measured or UNKNOWN. REPAIRED.",
  },
];

export function getGeneratorsByClassification(classification: GeneratorClassification): GeneratorEntry[] {
  return GENERATOR_REGISTRY.filter((g) => g.classification === classification);
}

export function getGeneratorsByCategory(category: GeneratorCategory): GeneratorEntry[] {
  return GENERATOR_REGISTRY.filter((g) => g.category === category);
}

export function getGeneratorStats() {
  const total = GENERATOR_REGISTRY.length;
  const byClass = GENERATOR_REGISTRY.reduce((acc, g) => {
    acc[g.classification] = (acc[g.classification] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const byGate = GENERATOR_REGISTRY.reduce((acc, g) => {
    acc[g.quality_gate_status] = (acc[g.quality_gate_status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const routedThroughContract = GENERATOR_REGISTRY.filter((g) => g.routes_through_universal_contract).length;
  return {
    total,
    by_classification: byClass,
    by_gate_status: byGate,
    routed_through_universal_contract: routedThroughContract,
    not_routed: total - routedThroughContract,
  };
}