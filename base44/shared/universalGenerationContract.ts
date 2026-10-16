/**
 * Universal Generation Contract (UGC) v1.0
 *
 * The typed, versioned contract consumed by EVERY generator, workflow, agent,
 * template, and deployment phase in the Digital Dominance system.
 *
 * This is the single authoritative production compiler interface. Every
 * generator — whether it produces HTML websites, logos, videos, content,
 * SEO pages, apps, or data packs — must produce artifacts that conform to
 * this contract.
 *
 * Pipeline:
 * Intent → Research Dossier → Business/Industry Facts → Design DNA →
 * Brand/Asset Manifest → Content & Offers → Visual/Image Production →
 * Template & Component Composition → Frontend/Backend Contracts →
 * Workflows/Agents → SEO/AEO/GEO → Security & Data → Independent QA →
 * Preview → Operator Approval → Deploy → Monitor → Attribute Revenue →
 * Learn → Improve
 */

// ============================================================
// CORE TYPES
// ============================================================

export type GenerationCategory =
  | 'research_market_intelligence'
  | 'logo'
  | 'brand'
  | 'web'
  | 'app_system_pwa'
  | 'creative_media_image'
  | 'design_system'
  | 'component'
  | 'funnel'
  | 'offer_pricing'
  | 'seo_aeo_geo'
  | 'content'
  | 'data_schema'
  | 'integration_api'
  | 'workflow_automation'
  | 'agent_swarm'
  | 'knowledge_rag'
  | 'analytics_experiment'
  | 'crm_sales'
  | 'security_governance'
  | 'deployment_ops'
  | 'validation_qa'
  | 'client_handoff';

export type LifecycleState =
  | 'CONFIGURED'
  | 'QUEUED'
  | 'BUILDING'
  | 'PREVIEW_READY'
  | 'VALIDATED'
  | 'APPROVED'
  | 'LIVE'
  | 'FAILED'
  | 'ROLLED_BACK';

export type ApprovalState =
  | 'PENDING'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED';

export type GateStatus = 'PASS' | 'FAIL' | 'UNKNOWN' | 'BLOCKED' | 'SKIPPED';

export type DesignVariant = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// ============================================================
// ASSET MANIFEST
// ============================================================

export interface AssetManifestEntry {
  asset_id: string;
  asset_type: 'image' | 'logo' | 'video' | 'audio' | 'document' | 'data' | 'code' | 'config';
  asset_url: string;
  asset_sha256: string;
  source_provenance: string;
  license: string;
  intended_category: string;
  alt_text: string;
  semantic_match_score?: number;
  semantic_reviewer?: string;
  semantic_evidence_uri?: string;
}

export interface AssetManifest {
  entries: AssetManifestEntry[];
  total_count: number;
  unique_count: number;
  duplicate_count: number;
}

// ============================================================
// QUALITY GATE
// ============================================================

export interface QualityGate {
  gate_id: string;
  gate_name: string;
  category: GenerationCategory;
  required: boolean;
  status: GateStatus;
  evidence_uri?: string;
  evidence_sha256?: string;
  tested_at?: string;
  tested_by: string;
  tested_git_sha?: string;
  tested_deployment_id?: string;
  test_version?: string;
  failure_detail?: string;
  next_repair?: string;
}

export interface QualityGateResult {
  gates: QualityGate[];
  hard_gates_passed: number;
  hard_gates_failed: number;
  hard_gates_unknown: number;
  release_eligible: boolean;
  release_blocked_reasons: string[];
}

// ============================================================
// CONTENT FACTS
// ============================================================

export interface ContentFacts {
  business_name?: string;
  industry?: string;
  niche?: string;
  target_city?: string;
  target_state?: string;
  phone?: string;
  email?: string;
  services?: string[];
  service_areas?: string[];
  years_in_business?: number;
  license_number?: string;
  certifications?: string[];
  // VERIFIED facts only — no fabricated reviews, credentials, awards,
  // guarantees, businesses, locations, offers, prices, or expertise
  verified: boolean;
  verified_at?: string;
  verified_by?: string;
}

// ============================================================
// DESIGN DNA
// ============================================================

export interface DesignDNA {
  design_variant: DesignVariant;
  primary_color: string;
  accent_color: string;
  bg_color: string;
  text_color: string;
  font_heading: string;
  font_body: string;
  border_radius: string;
  spacing_scale: string[];
  approved_visual_reference?: string;
  visual_lock?: boolean;
}

// ============================================================
// UNIVERSAL GENERATION CONTRACT
// ============================================================

export interface UniversalGenerationContract {
  // Identity
  contract_id: string;
  contract_version: string;
  compiler_version: string;
  git_sha: string;

  // Scope
  project_id: string;
  tenant_id?: string;
  category_id: GenerationCategory;
  industry_id?: string;
  niche?: string;

  // Request
  intent: string;
  requested_quantity: number;
  design_variant: DesignVariant;
  approved_visual_reference?: string;
  template_id?: string;

  // Inputs
  content_facts: ContentFacts;
  design_dna: DesignDNA;
  research_dossier_uri?: string;

  // Outputs
  asset_manifest: AssetManifest;
  output_uri?: string;
  output_sha256?: string;

  // Quality
  quality_gates: QualityGateResult;
  validation_receipt_uri?: string;
  approval_state: ApprovalState;
  approved_by?: string;
  approved_at?: string;

  // Deployment
  preview_deployment_id?: string;
  production_deployment_id?: string;
  deployment_url?: string;

  // Cost & Lifecycle
  cost_estimate?: number;
  rollback_reference?: string;
  lifecycle_state: LifecycleState;
  created_at: string;
  updated_at: string;

  // Provenance
  source_provenance: string;
  reproducible: boolean;
}

// ============================================================
// CONTRACT BUILDER
// ============================================================

export function createContract(params: {
  category: GenerationCategory;
  niche?: string;
  intent: string;
  quantity?: number;
  design_variant?: DesignVariant;
  content_facts?: Partial<ContentFacts>;
  design_dna?: Partial<DesignDNA>;
}): UniversalGenerationContract {
  const now = new Date().toISOString();
  return {
    contract_id: `ugc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    contract_version: '1.0',
    compiler_version: 'universal-generator-v1',
    git_sha: 'main',
    project_id: `proj-${Date.now()}`,
    category_id: params.category,
    industry_id: params.niche,
    niche: params.niche,
    intent: params.intent,
    requested_quantity: params.quantity || 1,
    design_variant: params.design_variant || 1,
    content_facts: {
      verified: false,
      ...params.content_facts,
    },
    design_dna: {
      design_variant: params.design_variant || 1,
      primary_color: '#0c4a6e',
      accent_color: '#0ea5e9',
      bg_color: '#ffffff',
      text_color: '#1a1a2e',
      font_heading: 'Inter',
      font_body: 'Inter',
      border_radius: '12px',
      spacing_scale: ['4px', '8px', '12px', '16px', '24px', '32px', '48px', '64px'],
      ...params.design_dna,
    },
    asset_manifest: {
      entries: [],
      total_count: 0,
      unique_count: 0,
      duplicate_count: 0,
    },
    quality_gates: {
      gates: [],
      hard_gates_passed: 0,
      hard_gates_failed: 0,
      hard_gates_unknown: 0,
      release_eligible: false,
      release_blocked_reasons: [],
    },
    approval_state: 'PENDING',
    lifecycle_state: 'CONFIGURED',
    created_at: now,
    updated_at: now,
    source_provenance: 'universal-generator-v1',
    reproducible: true,
  };
}

// ============================================================
// GATE EVALUATOR
// ============================================================

export function evaluateGates(gates: QualityGate[]): QualityGateResult {
  const hardGates = gates.filter(g => g.required);
  const passed = hardGates.filter(g => g.status === 'PASS').length;
  const failed = hardGates.filter(g => g.status === 'FAIL').length;
  const unknown = hardGates.filter(g => g.status === 'UNKNOWN' || g.status === 'BLOCKED').length;
  const blockedReasons = hardGates
    .filter(g => g.status !== 'PASS')
    .map(g => `${g.gate_name}: ${g.status}${g.failure_detail ? ' — ' + g.failure_detail : ''}`);

  return {
    gates,
    hard_gates_passed: passed,
    hard_gates_failed: failed,
    hard_gates_unknown: unknown,
    release_eligible: failed === 0 && unknown === 0 && passed === hardGates.length,
    release_blocked_reasons: blockedReasons,
  };
}

// ============================================================
// STANDARD GATE DEFINITIONS
// ============================================================

export const STANDARD_GATES: Record<string, Omit<QualityGate, 'status' | 'tested_at'>> = {
  SOURCE_IDENTITY: {
    gate_id: 'source_identity',
    gate_name: 'Source Identity',
    category: 'validation_qa',
    required: true,
    tested_by: 'independent-validator',
  },
  REPRODUCIBLE_BUILD: {
    gate_id: 'reproducible_build',
    gate_name: 'Reproducible Build',
    category: 'validation_qa',
    required: true,
    tested_by: 'independent-validator',
  },
  LINT: {
    gate_id: 'lint',
    gate_name: 'Lint Pass',
    category: 'validation_qa',
    required: true,
    tested_by: 'ci-pipeline',
  },
  TYPECHECK: {
    gate_id: 'typecheck',
    gate_name: 'Type Check',
    category: 'validation_qa',
    required: true,
    tested_by: 'ci-pipeline',
  },
  COMPONENT_RENDER: {
    gate_id: 'component_render',
    gate_name: 'Component Rendering',
    category: 'validation_qa',
    required: true,
    tested_by: 'browser-validator',
  },
  SEMANTIC_IMAGERY: {
    gate_id: 'semantic_imagery',
    gate_name: 'Semantic Image Accuracy',
    category: 'validation_qa',
    required: true,
    tested_by: 'independent-visual-reviewer',
  },
  RESPONSIVE: {
    gate_id: 'responsive',
    gate_name: 'Responsive (Desktop/Tablet/Mobile)',
    category: 'validation_qa',
    required: true,
    tested_by: 'browser-validator',
  },
  ACCESSIBILITY: {
    gate_id: 'accessibility',
    gate_name: 'Accessibility Critical Functions',
    category: 'validation_qa',
    required: true,
    tested_by: 'browser-validator',
  },
  NAVIGATION: {
    gate_id: 'navigation',
    gate_name: 'Navigation/Buttons/Forms',
    category: 'validation_qa',
    required: true,
    tested_by: 'browser-validator',
  },
  API_BACKEND: {
    gate_id: 'api_backend',
    gate_name: 'Real API/Backend/Auth/RLS',
    category: 'validation_qa',
    required: true,
    tested_by: 'api-validator',
  },
  WORKFLOW_IDEMPOTENCY: {
    gate_id: 'workflow_idempotency',
    gate_name: 'Workflow Idempotency & Queue Safety',
    category: 'validation_qa',
    required: true,
    tested_by: 'workflow-validator',
  },
  SAFE_AI_OUTPUTS: {
    gate_id: 'safe_ai_outputs',
    gate_name: 'Safe AI Outputs (no fabricated facts)',
    category: 'validation_qa',
    required: true,
    tested_by: 'content-validator',
  },
  CONTENT_FACTUALITY: {
    gate_id: 'content_factuality',
    gate_name: 'Content Factuality',
    category: 'validation_qa',
    required: true,
    tested_by: 'content-validator',
  },
  TENANT_ISOLATION: {
    gate_id: 'tenant_isolation',
    gate_name: 'Tenant Isolation',
    category: 'security_governance',
    required: true,
    tested_by: 'security-validator',
  },
  SEO_COMPLIANCE: {
    gate_id: 'seo_compliance',
    gate_name: 'SEO Useful-Content Compliance',
    category: 'seo_aeo_geo',
    required: true,
    tested_by: 'seo-validator',
  },
  DEPLOYMENT_IDENTITY: {
    gate_id: 'deployment_identity',
    gate_name: 'Deployment Identity',
    category: 'deployment_ops',
    required: true,
    tested_by: 'deployment-validator',
  },
  SECURITY_SCAN: {
    gate_id: 'security_scan',
    gate_name: 'Security Scan',
    category: 'security_governance',
    required: true,
    tested_by: 'security-scanner',
  },
  ROLLBACK: {
    gate_id: 'rollback',
    gate_name: 'Rollback Available',
    category: 'deployment_ops',
    required: true,
    tested_by: 'deployment-validator',
  },
  INDEPENDENT_REVIEW: {
    gate_id: 'independent_review',
    gate_name: 'Independent Review',
    category: 'validation_qa',
    required: true,
    tested_by: 'guardian-validator',
  },
};