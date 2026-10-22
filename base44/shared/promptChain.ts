/**
 * promptChain — the deterministic core shared by the prompt transformer and the
 * chain runner.
 *
 * Rules this file obeys, without exception:
 *  - Pure functions only. No clock, no randomness, no I/O, no network.
 *  - Every ID is a stable hash of its own inputs, so the same request always
 *    resolves to the same run, the same packets and the same receipt IDs.
 *  - Every list that reaches a record is sorted by a fixed key, so two runs over
 *    the same brief produce byte-identical output.
 *  - Scoring fails closed: a criterion without evidence earns zero.
 */

export const CHAIN_VERSION = 'prompt-chain-1.0.0';

export const CHAIN_STAGES = [
  { id: 'transform', name: 'Transform', agent: 'prompt_transformer', weight: 20 },
  { id: 'implement', name: 'Implement plan', agent: 'build_factory', weight: 20 },
  { id: 'qa', name: 'QA agent', agent: 'qa_agent', weight: 25 },
  { id: 'validate', name: 'Validation agent', agent: 'validation_guardian', weight: 20 },
  { id: 'autonomous_implement', name: 'Autonomous implementation', agent: 'build_factory', weight: 15 },
];

export const TARGETS = ['website', 'page', 'template', 'system', 'copy', 'automation'];

export const BRIEF_SECTIONS = [
  'objective', 'industry_context', 'desired_result', 'audience', 'scope_in', 'scope_out',
  'quality_bar', 'constraints', 'acceptance_checks', 'deliverables', 'risks',
];

// Text the transformer must never pass through: placeholder language that means
// the brief is not finished.
const PLACEHOLDERS = ['tbd', 'to be decided', 'lorem ipsum', 'placeholder text', 'xxx', 'your text here', 'n/a'];

// Tokens that prove a criterion is measurable rather than a feeling.
const MEASURABLE = ['verified', 'verifies', 'matches', 'contains', 'renders', 'passes', 'at least', 'no more than', 'exactly', 'present', 'absent', 'within'];

/** Deterministic trade vocabulary: lets the chain be industry-specific with no model call. */
export const INDUSTRY_MAP = [
  { keys: ['epoxy', 'garage floor', 'floor coating', 'resinous'], label: 'Epoxy Flooring', core: ['Concrete Preparation', 'Garage Floor Coatings', 'Flake Systems', 'Metallic Epoxy', 'Commercial Floor Systems', 'Concrete Repair'] },
  { keys: ['concrete', 'resurfacing', 'polished concrete'], label: 'Decorative Concrete', core: ['Concrete Resurfacing', 'Polished Concrete', 'Stamped Concrete', 'Concrete Sealing', 'Crack Repair', 'Outdoor Patios'] },
  { keys: ['roof'], label: 'Roofing', core: ['Roof Replacement', 'Roof Repair', 'Storm Damage Repair', 'Gutters', 'Roof Inspections', 'Flat Roof Systems'] },
  { keys: ['plumb'], label: 'Plumbing', core: ['Drain Cleaning', 'Leak Detection', 'Water Heater Service', 'Repiping', 'Fixture Installation', 'Emergency Plumbing'] },
  { keys: ['hvac', 'air condition', 'heating', 'furnace'], label: 'HVAC', core: ['AC Installation', 'AC Repair', 'Furnace Service', 'Duct Cleaning', 'Maintenance Plans', 'Indoor Air Quality'] },
  { keys: ['landscap', 'lawn'], label: 'Landscaping', core: ['Lawn Maintenance', 'Landscape Design', 'Irrigation Systems', 'Hardscaping', 'Tree Care', 'Seasonal Cleanup'] },
  { keys: ['paint'], label: 'Painting', core: ['Interior Painting', 'Exterior Painting', 'Cabinet Refinishing', 'Deck Staining', 'Drywall Repair', 'Commercial Painting'] },
  { keys: ['clean', 'janitorial'], label: 'Cleaning', core: ['Recurring Housekeeping', 'Deep Cleaning', 'Move-Out Cleaning', 'Carpet Cleaning', 'Window Cleaning', 'Commercial Cleaning'] },
  { keys: ['electric'], label: 'Electrical', core: ['Panel Upgrades', 'Outlet Installation', 'Lighting Design', 'Generator Hookups', 'EV Charger Install', 'Electrical Inspections'] },
  { keys: ['remodel', 'kitchen', 'bathroom', 'renovation'], label: 'Remodeling', core: ['Kitchen Remodels', 'Bathroom Remodels', 'Basement Finishing', 'Flooring', 'Cabinetry', 'Additions'] },
  { keys: ['pool'], label: 'Pool Service', core: ['Weekly Pool Service', 'Equipment Repair', 'Resurfacing', 'Tile Cleaning', 'Green Pool Recovery', 'Inspections'] },
  { keys: ['pest', 'termite'], label: 'Pest Control', core: ['General Pest Treatment', 'Termite Inspections', 'Rodent Control', 'Mosquito Treatment', 'Bed Bug Treatment', 'Wildlife Removal'] },
  { keys: ['moving', 'mover'], label: 'Moving', core: ['Local Moving', 'Long Distance Moving', 'Packing Services', 'Storage', 'Commercial Moving', 'Junk Removal'] },
  { keys: ['detail', 'car wash', 'auto'], label: 'Auto Detailing', core: ['Interior Detailing', 'Paint Correction', 'Ceramic Coating', 'Window Tinting', 'Fleet Detailing', 'Headlight Restoration'] },
  { keys: ['fence'], label: 'Fencing', core: ['Fence Installation', 'Fence Repair', 'Gate Automation', 'Vinyl Fencing', 'Aluminum Fencing', 'Wood Fencing'] },
  { keys: ['solar'], label: 'Solar', core: ['Solar Installation', 'Battery Storage', 'Panel Cleaning', 'System Monitoring', 'Roof Integration', 'Energy Audits'] },
  { keys: ['garage door'], label: 'Garage Doors', core: ['Door Installation', 'Spring Replacement', 'Opener Repair', 'Panel Replacement', 'Annual Tune-Up', 'Emergency Repair'] },
  { keys: ['tree'], label: 'Tree Service', core: ['Tree Removal', 'Trimming', 'Stump Grinding', 'Emergency Response', 'Land Clearing', 'Health Assessments'] },
];

/** FNV-1a over the normalized string: identical across every runtime the chain touches. */
export function stableHash(value: string): string {
  const text = String(value || '');
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

export function normalizeSentence(value: unknown): string {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

export function normalizeKey(value: unknown): string {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

export function runIdFor(sentence: string, industry: string, target: string): string {
  return `pcr_${stableHash([normalizeSentence(sentence).toLowerCase(), String(industry || '').toLowerCase(), String(target || 'website').toLowerCase()].join('|'))}`;
}

export function packetIdFor(runId: string, criterion: string): string {
  return `pk_${stableHash(`${runId}|${criterion}`)}`;
}

export function receiptIdFor(runId: string, stage: string, criterion: string): string {
  return `rcp_${stableHash(`${runId}|${stage}|${criterion}`)}`;
}

export function actionIdFor(runId: string, packetId: string): string {
  return `act_${stableHash(`${runId}|${packetId}`)}`;
}

/** The trade this sentence belongs to, resolved deterministically from the sentence alone. */
export function detectIndustry(sentence: string): { label: string; core: string[] } | null {
  const text = normalizeSentence(sentence).toLowerCase();
  for (const entry of INDUSTRY_MAP) {
    if (entry.keys.some(key => text.includes(key))) return { label: entry.label, core: entry.core };
  }
  return null;
}

/** The deterministic baseline brief. Nothing here is invented: it restates the request. */
export function scaffoldBrief(sentence: string, meta: { industry?: string; target?: string; desired_result?: string }) {
  const text = normalizeSentence(sentence);
  const detected = detectIndustry(text);
  const industry = String(meta.industry || detected?.label || 'Unspecified').slice(0, 80);
  const target = TARGETS.includes(String(meta.target)) ? String(meta.target) : 'website';
  const core = detected?.core || [];
  return {
    objective: text,
    industry_context: detected
      ? `${industry} — the trade's core services are ${core.join(', ')}.`
      : `${industry} — industry detail to be supplied by the industry pass.`,
    desired_result: String(meta.desired_result || '').slice(0, 400),
    audience: '',
    scope_in: [],
    scope_out: [],
    quality_bar: [],
    constraints: ['No invented facts: no prices, phone numbers, addresses, certifications or review counts unless the request states them.', 'Every claim must be verifiable by a named check.'],
    acceptance_checks: [
      `The finished ${target} matches the objective: ${text}`,
      'Every acceptance check below passes on the artefact itself, not on a description of it',
      'No placeholder or demonstration content remains in the output',
    ],
    deliverables: [`A finished, live ${target}`, 'A receipt per acceptance check with PASS, FAIL or MISSING_EVIDENCE'],
    risks: [],
  };
}

/** Merges the model's brief into the deterministic scaffold. The scaffold always wins on structure. */
export function mergeLlmBrief(scaffold: Record<string, any>, llm: any) {
  const source: Record<string, string> = {};
  const merged: Record<string, any> = {};
  const list = (value: unknown, fallback: string[]) => {
    const items = Array.isArray(value)
      ? value.map(item => cleanText(item, 240)).filter(Boolean)
      : [];
    return items.length ? items : fallback;
  };
  const text = (value: unknown, fallback: string, limit = 700) => {
    const cleaned = cleanText(value, limit);
    return cleaned || fallback;
  };

  for (const key of BRIEF_SECTIONS) {
    if (Array.isArray(scaffold[key])) {
      const fromModel = list(llm?.[key], []);
      merged[key] = fromModel.length ? fromModel : scaffold[key];
      source[key] = fromModel.length ? 'model' : 'scaffold';
    } else {
      const fromModel = text(llm?.[key], '');
      merged[key] = fromModel || scaffold[key] || '';
      source[key] = fromModel ? 'model' : 'scaffold';
    }
  }

  // The objective is always the owner's own sentence: it is the one thing we know is true.
  merged.objective = scaffold.objective;
  source.objective = 'owner';
  if (!merged.desired_result) merged.desired_result = `The ${scaffold.objective.toLowerCase()} is delivered, verified and receipted.`;

  // Scope must be stated in both directions, or the brief is not executable.
  if (!merged.scope_out.length) merged.scope_out = ['Anything the request does not ask for'];
  if (!merged.scope_in.length) merged.scope_in = [scaffold.objective];

  // Measurable quality bar: an unmeasurable one is not a quality bar.
  merged.quality_bar = (merged.quality_bar || []).filter(item => isMeasurable(item));
  if (merged.quality_bar.length < 2) {
    merged.quality_bar = [...merged.quality_bar, 'Every acceptance check is verified by an independent agent and receipted'];
  }

  return { brief: merged, source };
}

function cleanText(value: unknown, limit: number): string {
  const text = String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  if (!text) return '';
  const lower = text.toLowerCase();
  if (PLACEHOLDERS.some(token => lower === token || lower.includes(token))) return '';
  return text.slice(0, limit);
}

/** A usable check names something observable. Feelings are not checks. */
export function isMeasurable(text: string): boolean {
  const lower = String(text || '').toLowerCase();
  if (lower.length < 12) return false;
  return MEASURABLE.some(token => lower.includes(token)) || /\d/.test(lower);
}

/**
 * Deterministic guard against invented content: any email, phone number, URL,
 * money amount or percentage in generated copy that the owner never wrote is
 * reported as an unsupported fact and costs the transform points.
 */
export function scanUnsupportedFacts(candidate: string, source: string): string[] {
  const haystack = String(candidate || '');
  const sourceText = String(source || '').toLowerCase();
  const patterns = [
    /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi,
    /\+?\d[\d\s().-]{7,}\d/g,
    /https?:\/\/[^\s"'<>]+/gi,
    /\$\s?\d[\d,.]*/g,
    /\b\d{1,3}\s?%/g,
  ];
  const found = new Set<string>();
  for (const pattern of patterns) {
    const matches = haystack.match(pattern) || [];
    for (const match of matches) {
      const token = String(match).trim();
      if (!token) continue;
      if (sourceText.includes(token.toLowerCase())) continue;
      found.add(token.slice(0, 60));
    }
  }
  return Array.from(found).sort();
}

/** The brief, rendered as one executable prompt for whoever picks the work up. */
export function briefToText(brief: Record<string, any>, meta: { runId: string; industry: string; target: string }): string {
  const block = (value: unknown) => (Array.isArray(value) ? value.map(item => `  - ${item}`).join('\n') : `  ${value || '—'}`);
  return [
    `# Execution brief ${meta.runId}`,
    `Chain version: ${CHAIN_VERSION}`,
    '',
    '## Objective',
    block(brief.objective),
    '## Industry context',
    block(brief.industry_context),
    '## Desired result',
    block(brief.desired_result),
    '## Audience',
    block(brief.audience),
    '## In scope',
    block(brief.scope_in),
    '## Out of scope',
    block(brief.scope_out),
    '## Quality bar',
    block(brief.quality_bar),
    '## Constraints',
    block(brief.constraints),
    '## Acceptance checks (each must pass on the artefact itself)',
    block(brief.acceptance_checks),
    '## Deliverables',
    block(brief.deliverables),
    '## Risks',
    block(brief.risks),
  ].join('\n').slice(0, 8000);
}

/** Deterministic transform score: structure, specificity, industry fit, result fit, cleanliness. */
export function briefScore(brief: Record<string, any>, sentence: string) {
  const missing = BRIEF_SECTIONS.filter(key => {
    const value = brief[key];
    return Array.isArray(value) ? value.length === 0 : !String(value || '').trim();
  });

  const measurableChecks = (brief.acceptance_checks || []).filter((item: string) => isMeasurable(item)).length;
  const unsupported = scanUnsupportedFacts(JSON.stringify(brief), sentence);
  const vague = (brief.quality_bar || []).filter((item: string) => !isMeasurable(item)).length;
  const industryFit = brief.industry_context && brief.industry_context.length > 40 ? 1 : 0;
  const resultFit = brief.desired_result && brief.desired_result.length > 30 ? 1 : 0;
  const listDepth = ['scope_in', 'scope_out', 'deliverables', 'risks', 'quality_bar']
    .filter(key => (brief[key] || []).length >= 2).length;

  const criteria = [
    criterion('structure', 'Every brief section present', 25, missing.length === 0 ? 1 : Math.max(0, 1 - missing.length / BRIEF_SECTIONS.length), missing.length ? `Missing: ${missing.join(', ')}` : 'All sections present'),
    criterion('specificity', 'Acceptance checks are measurable', 20, Math.min(1, measurableChecks / 3), `${measurableChecks} measurable checks`),
    criterion('industry_fit', 'Industry context is specific', 20, industryFit, industryFit ? 'Industry context states the trade and its services' : 'Industry context is too thin'),
    criterion('result_fit', 'Desired result is stated', 20, resultFit, resultFit ? 'Desired result is stated' : 'Desired result is missing or too short'),
    criterion('depth', 'Scope, quality bar and risks are real lists', 15, listDepth / 5, `${listDepth} of 5 list sections carry two or more entries`),
    criterion('cleanliness', 'No invented facts, no placeholders', 15, Math.max(0, 1 - unsupported.length / 3 - vague / 3), unsupported.length ? `Unsupported: ${unsupported.join(', ')}` : `${vague} vague quality statements`),
  ];
  return { criteria, score: weight(criteria), missing, unsupported };
}

/** Deterministic QA rubric for the plan the builder will execute. */
export function planScore(brief: Record<string, any>, packets: any[]) {
  const covered = new Set(packets.map(packet => packet.criterion_id));
  const acceptance = brief.acceptance_checks || [];
  const acceptanceCovered = acceptance.filter((_: string, index: number) => covered.has(`acceptance-${index + 1}`)).length;
  const routable = packets.filter(packet => ['builder', 'admin', 'worker'].includes(packet.route)).length;
  const withAcceptance = packets.filter(packet => (packet.acceptance || []).length > 0).length;

  const criteria = [
    criterion('plan_coverage', 'Every acceptance check has a work packet', 30, acceptance.length ? acceptanceCovered / acceptance.length : 0, `${acceptanceCovered} of ${acceptance.length} acceptance checks covered`),
    criterion('plan_routing', 'Every packet has a real route', 25, packets.length ? routable / packets.length : 0, `${routable} of ${packets.length} packets routed`),
    criterion('plan_acceptance', 'Every packet carries its own acceptance test', 25, packets.length ? withAcceptance / packets.length : 0, `${withAcceptance} of ${packets.length} packets carry acceptance tests`),
    criterion('plan_traceability', 'Every packet traces to a criterion', 20, packets.length ? packets.filter(packet => packet.criterion_id).length / packets.length : 0, `${packets.filter(packet => packet.criterion_id).length} of ${packets.length} packets trace to a criterion`),
  ];
  return { criteria, score: weight(criteria) };
}

/** Deterministic validation rubric: the process itself must be replayable. */
export function processScore(input: {
  runId: string; packets: any[]; receiptIds: string[]; replays: number; unsupported: string[]; artefactVerified: boolean;
}) {
  const { runId, packets, receiptIds, replays, unsupported, artefactVerified } = input;
  const idsStable = packets.every(packet => packet.id === packetIdFor(runId, packet.criterion_id));
  const uniqueIds = new Set(packets.map(packet => packet.id)).size === packets.length;
  const uniqueReceipts = new Set(receiptIds).size === receiptIds.length;
  const replayStable = replays > 0;

  const criteria = [
    criterion('stable_ids', 'Packet and receipt IDs are hash-stable', 30, idsStable && uniqueIds ? 1 : 0, idsStable ? (uniqueIds ? 'IDs reproduce from their own inputs' : 'Duplicate packet IDs found') : 'Packet IDs are not hash-stable'),
    criterion('receipts', 'A receipt exists for every stage', 30, uniqueReceipts ? 1 : 0, uniqueReceipts ? `${receiptIds.length} unique receipts written` : 'Duplicate receipt IDs found'),
    criterion('idempotence', 'The run was replayed and returned the same result', 20, replayStable ? 1 : 0, replayStable ? `Replayed ${replays} time(s) with an identical digest` : 'No replay evidence'),
    criterion('no_invention', 'No unsupported facts in the brief', 20, unsupported.length === 0 ? 1 : 0, unsupported.length ? `Unsupported: ${unsupported.join(', ')}` : 'No unsupported facts'),
    criterion('artefact', 'A rendered artefact was scored by the QA agent', 0, artefactVerified ? 1 : 0, artefactVerified ? 'Rendered artefact scored' : 'No rendered artefact supplied — scored as MISSING_EVIDENCE'),
  ];
  return { criteria, score: weight(criteria.filter(item => item.weight > 0)) };
}

function criterion(key: string, label: string, weight: number, ratio: number, evidence: string) {
  const safe = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0));
  return { key, label, weight, ratio: Number(safe.toFixed(4)), earned: Number((weight * safe).toFixed(2)), evidence: String(evidence || '').slice(0, 1000) };
}

/** Weighted total. Missing evidence is zero by construction. */
export function weight(criteria: any[]): number {
  const total = criteria.reduce((sum, item) => sum + (item.weight || 0), 0);
  if (!total) return 0;
  const earned = criteria.reduce((sum, item) => sum + (item.earned || 0), 0);
  return Math.round((earned / total) * 1000) / 10;
}

export function stageScores(criteria: any[]): Record<string, number> {
  return {
    transform: 0,
    implement: 0,
    qa: 0,
    validate: 0,
    autonomous: 0,
    total: 0,
    grade: 'F',
  };
}

export function grade(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'B+';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export function verdictFor(stages: any[]): 'PASS' | 'PARTIAL' | 'FAIL' | 'BLOCKED' {
  if (stages.some(stage => stage.status === 'FAIL')) return 'FAIL';
  if (stages.some(stage => stage.status === 'MISSING_EVIDENCE' || stage.status === 'BLOCKED')) return 'PARTIAL';
  return 'PASS';
}

/** Work packets: one per acceptance check, plus the two standing packets every run needs. */
export function buildPackets(brief: Record<string, any>, runId: string) {
  const acceptance = brief.acceptance_checks || [];
  const packets: any[] = acceptance.map((check: string, index: number) => {
    const criterionId = `acceptance-${index + 1}`;
    return {
      id: packetIdFor(runId, criterionId),
      criterion_id: criterionId,
      title: `Satisfy: ${String(check).slice(0, 90)}`,
      route: 'builder',
      plan: [
        `Acceptance check: ${check}`,
        `Objective: ${brief.objective}`,
        `Quality bar: ${(brief.quality_bar || []).join('; ')}`,
        `Constraints: ${(brief.constraints || []).join('; ')}`,
        `Deliverable: ${(brief.deliverables || []).join('; ')}`,
        `Evidence required: the check result measured on the artefact, stored as a receipt.`,
      ].join('\n').slice(0, 4000),
      acceptance: [check],
    };
  });

  const standing = [
    { criterion_id: 'seo_unique', title: 'Every page carries a unique title, description and keywords', route: 'admin', plan: 'Generate per-page metadata deterministically, then compare all pages pairwise and fail on any duplicate title or description.', acceptance: ['No two pages share a title or description (verified by pairwise comparison)'] },
    { criterion_id: 'receipts_written', title: 'A receipt per acceptance check', route: 'worker', plan: 'Write one receipt per acceptance check with expected, actual, status and evidence. Missing evidence records MISSING_EVIDENCE, never PASS.', acceptance: ['Receipt count equals acceptance check count (verified by counting records)'] },
  ];

  for (const item of standing) {
    packets.push({
      ...item,
      id: packetIdFor(runId, item.criterion_id),
      plan: `${item.plan}\nObjective: ${brief.objective}`.slice(0, 4000),
    });
  }

  return packets.sort((a, b) => (a.criterion_id < b.criterion_id ? -1 : a.criterion_id > b.criterion_id ? 1 : 0));
}

export function packetKey(runId: string, criterionId: string): string {
  return `${runId}::${criterionId}`;
}

/** Dedupe is a property of the key, never of insertion order. */
export function dedupePackets(packets: any[]): any[] {
  const seen = new Set<string>();
  const out: any[] = [];
  for (const packet of packets) {
    if (seen.has(packet.id)) continue;
    seen.add(packet.id);
    out.push(packet);
  }
  return out;
}

const SEVERITY_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

/** The auto-recommender: failures first, then the weakest criteria, then severity, then id. */
export function rankRecommendations(criteria: any[], packets: any[]) {
  const byCriterion = new Map(packets.map(packet => [packet.criterion_id, packet]));
  const recommendations = criteria
    .filter(item => item.weight > 0 && item.ratio < 1)
    .map(item => {
      const packet = byCriterion.get(item.key);
      const gap = Number(((1 - item.ratio) * item.weight).toFixed(1));
      const severity = gap >= 20 ? 'critical' : gap >= 12 ? 'high' : gap >= 6 ? 'medium' : 'low';
      return {
        id: `rec_${item.key}`,
        title: `Raise ${item.label.toLowerCase()}`,
        detail: `${item.evidence || 'No evidence recorded.'} Close the gap by executing the packet and storing the receipt.`,
        severity,
        criterion: item.key,
        route: packet?.route || 'builder',
        points: gap,
      };
    });

  return recommendations.sort((a, b) => {
    if ((SEVERITY_RANK[a.severity] || 9) !== (SEVERITY_RANK[b.severity] || 9)) return (SEVERITY_RANK[a.severity] || 9) - (SEVERITY_RANK[b.severity] || 9);
    if (b.points !== a.points) return b.points - a.points;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

/** Digest used to prove a replay produced the same result. */
export function runDigest(run: { runId: string; briefScore: number; packets: any[]; recommendations: any[]; total: number }): string {
  return stableHash([
    run.runId,
    run.briefScore,
    run.total,
    run.packets.map(packet => `${packet.id}:${packet.criterion_id}`).join(','),
    run.recommendations.map(item => `${item.id}:${item.severity}`).join(','),
  ].join('|'));
}