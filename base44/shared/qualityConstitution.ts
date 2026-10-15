/**
 * Quality Constitution v1.0
 *
 * One enforceable quality constitution covering every active generator,
 * category, asset, page, workflow, job, and deployment in the Digital
 * Dominance system.
 *
 * PRINCIPLES:
 * 1. No empty checklist may count as PASS.
 * 2. A score alone cannot bypass a HARD gate.
 * 3. Any mandatory FAIL/UNKNOWN/BLOCKED = NOT RELEASED.
 * 4. Builders cannot certify their own work.
 * 5. A missing validator shows UNKNOWN, not green.
 * 6. No fallback to unrelated default imagery.
 * 7. No fabricated reviews, credentials, awards, guarantees, businesses,
 *    locations, offers, prices, or expertise.
 * 8. 100% required-test PASS is a release criterion.
 */

import type { GateStatus, QualityGate, QualityGateResult } from './universalGenerationContract';

// ============================================================
// GATE SEVERITY
// ============================================================

export type GateSeverity = 'HARD' | 'SOFT' | 'ADVISORY';

export interface ConstitutionGate {
  gate_id: string;
  gate_name: string;
  severity: GateSeverity;
  category: string;
  baseline: string;
  target: string;
  evidence_type: 'screenshot' | 'log' | 'metric' | 'receipt' | 'test_result' | 'hash';
  owner: string;
  independent_validator: string;
  repair_policy: 'BLOCK_RELEASE' | 'WARN' | 'AUTO_REPAIR' | 'MANUAL';
  description: string;
}

// ============================================================
// FULL GATE CATALOG
// ============================================================

export const CONSTITUTION_GATES: ConstitutionGate[] = [
  {
    gate_id: 'source_identity',
    gate_name: 'Source Identity',
    severity: 'HARD',
    category: 'deployment_ops',
    baseline: 'Git SHA + branch + deployment URL verified',
    target: '100% match between repo SHA, deployment, and app ID',
    evidence_type: 'receipt',
    owner: 'ci-pipeline',
    independent_validator: 'independent-validator',
    repair_policy: 'BLOCK_RELEASE',
    description: 'Verify that the deployed artifact matches the exact git SHA and branch. No deployment from untracked or detached HEAD.',
  },
  {
    gate_id: 'reproducible_build',
    gate_name: 'Reproducible Build',
    severity: 'HARD',
    category: 'deployment_ops',
    baseline: 'Build produces same output SHA from same input SHA',
    target: '100% reproducible — same SHA in, same SHA out',
    evidence_type: 'hash',
    owner: 'ci-pipeline',
    independent_validator: 'independent-validator',
    repair_policy: 'BLOCK_RELEASE',
    description: 'The build must be deterministic. Same source SHA must produce the same output artifact hash.',
  },
  {
    gate_id: 'lint',
    gate_name: 'Lint Pass',
    severity: 'HARD',
    category: 'validation_qa',
    baseline: 'Zero lint errors',
    target: '0 errors, 0 warnings (warnings allowed but tracked)',
    evidence_type: 'log',
    owner: 'ci-pipeline',
    independent_validator: 'ci-pipeline',
    repair_policy: 'BLOCK_RELEASE',
    description: 'ESLint must pass with zero errors.',
  },
  {
    gate_id: 'typecheck',
    gate_name: 'Type Check',
    severity: 'HARD',
    category: 'validation_qa',
    baseline: 'Zero type errors',
    target: '0 type errors',
    evidence_type: 'log',
    owner: 'ci-pipeline',
    independent_validator: 'ci-pipeline',
    repair_policy: 'BLOCK_RELEASE',
    description: 'TypeScript compiler must pass with zero errors.',
  },
  {
    gate_id: 'component_render',
    gate_name: 'Component Rendering',
    severity: 'HARD',
    category: 'validation_qa',
    baseline: 'All page components render without errors',
    target: '100% of pages render in real browser',
    evidence_type: 'screenshot',
    owner: 'browser-validator',
    independent_validator: 'browser-validator',
    repair_policy: 'BLOCK_RELEASE',
    description: 'Every page must render in a real browser without console errors or blank screens.',
  },
  {
    gate_id: 'semantic_imagery',
    gate_name: 'Semantic Image Accuracy',
    severity: 'HARD',
    category: 'validation_qa',
    baseline: 'Every image matches its category semantically',
    target: '100% independent semantic match score >= 0.98',
    evidence_type: 'screenshot',
    owner: 'image-validator',
    independent_validator: 'independent-visual-reviewer',
    repair_policy: 'BLOCK_RELEASE',
    description: 'Every image must be independently verified to match its intended category. No generic fallbacks, no broken URLs, no cross-category reuse.',
  },
  {
    gate_id: 'responsive',
    gate_name: 'Responsive (Desktop/Tablet/Mobile)',
    severity: 'HARD',
    category: 'validation_qa',
    baseline: 'Pages render correctly at 1440px, 768px, 390px',
    target: '100% of pages pass at all three viewports',
    evidence_type: 'screenshot',
    owner: 'browser-validator',
    independent_validator: 'browser-validator',
    repair_policy: 'BLOCK_RELEASE',
    description: 'Every page must be tested at desktop (1440px), tablet (768px), and mobile (390px) viewports.',
  },
  {
    gate_id: 'accessibility',
    gate_name: 'Accessibility Critical Functions',
    severity: 'HARD',
    category: 'validation_qa',
    baseline: 'Keyboard navigation, ARIA labels, contrast',
    target: 'WCAG 2.1 AA compliance on critical paths',
    evidence_type: 'test_result',
    owner: 'browser-validator',
    independent_validator: 'accessibility-validator',
    repair_policy: 'BLOCK_RELEASE',
    description: 'Critical accessibility functions must work: keyboard nav, screen reader labels, color contrast, focus management.',
  },
  {
    gate_id: 'navigation',
    gate_name: 'Navigation/Buttons/Forms',
    severity: 'HARD',
    category: 'validation_qa',
    baseline: 'All navigation links, buttons, and forms work',
    target: '100% of interactive elements function correctly',
    evidence_type: 'test_result',
    owner: 'browser-validator',
    independent_validator: 'browser-validator',
    repair_policy: 'BLOCK_RELEASE',
    description: 'Every link, button, and form must be tested and function correctly.',
  },
  {
    gate_id: 'api_backend',
    gate_name: 'Real API/Backend/Auth/RLS',
    severity: 'HARD',
    category: 'validation_qa',
    baseline: 'API endpoints respond correctly with auth',
    target: '100% of declared endpoints return expected status',
    evidence_type: 'log',
    owner: 'api-validator',
    independent_validator: 'api-validator',
    repair_policy: 'BLOCK_RELEASE',
    description: 'Real API calls must be tested — not mocked. Auth and RLS must enforce correctly.',
  },
  {
    gate_id: 'workflow_idempotency',
    gate_name: 'Workflow Idempotency & Queue Safety',
    severity: 'HARD',
    category: 'workflow_automation',
    baseline: 'Workflows are idempotent, queue is safe',
    target: '0 duplicate executions, 0 lost jobs',
    evidence_type: 'log',
    owner: 'workflow-validator',
    independent_validator: 'workflow-validator',
    repair_policy: 'BLOCK_RELEASE',
    description: 'Workflows must be idempotent. Queue must not produce duplicate or lost jobs.',
  },
  {
    gate_id: 'safe_ai_outputs',
    gate_name: 'Safe AI Outputs',
    severity: 'HARD',
    category: 'validation_qa',
    baseline: 'No fabricated facts in AI-generated content',
    target: '0 fabricated reviews, credentials, awards, guarantees, prices',
    evidence_type: 'test_result',
    owner: 'content-validator',
    independent_validator: 'content-validator',
    repair_policy: 'BLOCK_RELEASE',
    description: 'AI-generated content must not fabricate reviews, credentials, awards, guarantees, business names, locations, offers, prices, or expertise.',
  },
  {
    gate_id: 'content_factuality',
    gate_name: 'Content Factuality',
    severity: 'HARD',
    category: 'validation_qa',
    baseline: 'All stated facts are verified or marked unverified',
    target: '100% of facts verified or explicitly marked UNKNOWN',
    evidence_type: 'receipt',
    owner: 'content-validator',
    independent_validator: 'content-validator',
    repair_policy: 'BLOCK_RELEASE',
    description: 'Every factual claim must be verified or explicitly marked as unverified.',
  },
  {
    gate_id: 'tenant_isolation',
    gate_name: 'Tenant Isolation',
    severity: 'HARD',
    category: 'security_governance',
    baseline: 'Users cannot access other users data',
    target: '0 cross-tenant data leaks',
    evidence_type: 'test_result',
    owner: 'security-validator',
    independent_validator: 'security-validator',
    repair_policy: 'BLOCK_RELEASE',
    description: 'RLS must prevent any user from accessing another user or tenant data.',
  },
  {
    gate_id: 'seo_compliance',
    gate_name: 'SEO Useful-Content Compliance',
    severity: 'HARD',
    category: 'seo_aeo_geo',
    baseline: 'Content is useful, not thin or doorway',
    target: '100% of pages have unique, useful content',
    evidence_type: 'test_result',
    owner: 'seo-validator',
    independent_validator: 'seo-validator',
    repair_policy: 'BLOCK_RELEASE',
    description: 'No thin city swaps, no doorway pages, no duplicate content across sites. Each site must have unique, useful content.',
  },
  {
    gate_id: 'deployment_identity',
    gate_name: 'Deployment Identity',
    severity: 'HARD',
    category: 'deployment_ops',
    baseline: 'Deployment URL matches intended target',
    target: '100% deployment URL verification',
    evidence_type: 'receipt',
    owner: 'deployment-validator',
    independent_validator: 'deployment-validator',
    repair_policy: 'BLOCK_RELEASE',
    description: 'The deployment URL must match the intended target. No deploying to wrong domain or environment.',
  },
  {
    gate_id: 'security_scan',
    gate_name: 'Security Scan',
    severity: 'HARD',
    category: 'security_governance',
    baseline: 'No critical security vulnerabilities',
    target: '0 critical, 0 high vulnerabilities',
    evidence_type: 'log',
    owner: 'security-scanner',
    independent_validator: 'security-scanner',
    repair_policy: 'BLOCK_RELEASE',
    description: 'Security scan must find zero critical or high vulnerabilities.',
  },
  {
    gate_id: 'rollback',
    gate_name: 'Rollback Available',
    severity: 'HARD',
    category: 'deployment_ops',
    baseline: 'Rollback path exists and is tested',
    target: '100% of deployments have a tested rollback',
    evidence_type: 'receipt',
    owner: 'deployment-validator',
    independent_validator: 'deployment-validator',
    repair_policy: 'BLOCK_RELEASE',
    description: 'Every deployment must have a rollback path that has been tested.',
  },
  {
    gate_id: 'independent_review',
    gate_name: 'Independent Review',
    severity: 'HARD',
    category: 'validation_qa',
    baseline: 'Independent guardian has reviewed and approved',
    target: '100% independent guardian approval',
    evidence_type: 'receipt',
    owner: 'guardian-validator',
    independent_validator: 'guardian-validator',
    repair_policy: 'BLOCK_RELEASE',
    description: 'An independent guardian (not the builder) must review and approve before release. Builders cannot certify their own work.',
  },
];

// ============================================================
// EVALUATION
// ============================================================

export function evaluateConstitution(gateResults: QualityGate[]): {
  result: QualityGateResult;
  constitution_gates: ConstitutionGate[];
  all_hard_gates_pass: boolean;
  release_decision: 'RELEASED' | 'NOT_RELEASED';
  blocked_reasons: string[];
} {
  const hardGateIds = CONSTITUTION_GATES.filter(g => g.severity === 'HARD').map(g => g.gate_id);
  const hardResults = gateResults.filter(g => hardGateIds.includes(g.gate_id));

  const passed = hardResults.filter(g => g.status === 'PASS').length;
  const failed = hardResults.filter(g => g.status === 'FAIL').length;
  const unknown = hardResults.filter(g => g.status === 'UNKNOWN' || g.status === 'BLOCKED').length;
  const total = hardGateIds.length;

  const blockedReasons = hardResults
    .filter(g => g.status !== 'PASS')
    .map(g => {
      const constitution = CONSTITUTION_GATES.find(c => c.gate_id === g.gate_id);
      return `${g.gate_name}: ${g.status}${g.failure_detail ? ' — ' + g.failure_detail : ''}${constitution ? ' [' + constitution.repair_policy + ']' : ''}`;
    });

  const allPass = failed === 0 && unknown === 0 && passed === total;

  return {
    result: {
      gates: gateResults,
      hard_gates_passed: passed,
      hard_gates_failed: failed,
      hard_gates_unknown: unknown,
      release_eligible: allPass,
      release_blocked_reasons: blockedReasons,
    },
    constitution_gates: CONSTITUTION_GATES,
    all_hard_gates_pass: allPass,
    release_decision: allPass ? 'RELEASED' : 'NOT_RELEASED',
    blocked_reasons: blockedReasons,
  };
}

// ============================================================
// DASHBOARD COLUMN DEFINITIONS
// ============================================================

export const DASHBOARD_COLUMNS = [
  'Source Parity',
  'Visual QA',
  'Image Semantics',
  'Accessibility',
  'Mobile',
  'E2E',
  'Security',
  'Data/RLS',
  'Workflow',
  'SEO/AEO/GEO',
  'Performance',
  'Analytics',
  'Deployment',
  'Rollback',
] as const;

export type DashboardColumn = typeof DASHBOARD_COLUMNS[number];

export function getDashboardColumnForGate(gateId: string): DashboardColumn | null {
  const map: Record<string, DashboardColumn> = {
    source_identity: 'Source Parity',
    reproducible_build: 'Source Parity',
    lint: 'Visual QA',
    typecheck: 'Visual QA',
    component_render: 'Visual QA',
    semantic_imagery: 'Image Semantics',
    responsive: 'Mobile',
    accessibility: 'Accessibility',
    navigation: 'E2E',
    api_backend: 'Data/RLS',
    workflow_idempotency: 'Workflow',
    safe_ai_outputs: 'SEO/AEO/GEO',
    content_factuality: 'SEO/AEO/GEO',
    tenant_isolation: 'Security',
    seo_compliance: 'SEO/AEO/GEO',
    deployment_identity: 'Deployment',
    security_scan: 'Security',
    rollback: 'Rollback',
    independent_review: 'E2E',
  };
  return map[gateId] || null;
}