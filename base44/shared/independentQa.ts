/**
 * independentQa — the chain's two independent reviewers.
 *
 * Independence here is structural, not a label:
 *  - two separate functions, on two separate transports (one on the app's own
 *    free-tier provider chain, one on a platform model), so neither shares the
 *    other's provider, prompt or failure mode;
 *  - neither agent ever sees the other's findings;
 *  - a PASS or FAIL survives only when the proof the agent quotes is found,
 *    verbatim, in the material it was handed — checked here, never trusted;
 *  - a criterion the agent did not evidence is MISSING_EVIDENCE and earns zero;
 *  - the chain counts agreement only: what both agents verified is corroborated,
 *    what they dispute fails, and what one agent alone touches stays unverified.
 *
 * Pure functions only: no clock, no randomness, no I/O.
 */

import { weight } from './promptChain.ts';

export const MATERIAL_LIMIT = 14000;
export const MIN_QUOTE = 12;
export const CORROBORATION_WEIGHT = 25;

/**
 * Agent A — the QA reviewer. Its first transport is the app's free-tier provider
 * chain, which costs nothing; when that quota is exhausted it falls back to its
 * own platform model. That fallback model must never be the validator's model,
 * or the two reviewers would stop being independent.
 */
export const QA_AGENT = {
  id: 'independent_qa_agent',
  name: 'Independent QA agent',
  model: 'app free-tier chain (groq / google / openrouter)',
  fallback_model: 'gpt_6_luna',
};

/** Agent B — the validator. Runs on a platform model, so a provider outage cannot take both down. */
export const VALIDATOR_AGENT = {
  id: 'independent_validator',
  name: 'Independent validator',
  model: 'claude-sonnet-5',
};

export const AGENT_IDS = [QA_AGENT.id, VALIDATOR_AGENT.id];

/**
 * Each rubric line states where its proof has to come from: an artefact-sourced
 * line can only be evidenced by the artefact itself, never by the plan.
 */
export const QA_RUBRIC = [
  { key: 'qa_objective_fit', label: 'The deliverable fulfils the objective', weight: 25, source: 'material' },
  { key: 'qa_acceptance_met', label: 'Every acceptance check is met on the artefact', weight: 30, source: 'artefact' },
  { key: 'qa_quality_bar', label: "The contact details and business facts on the page are the business's own, not demonstration content", weight: 20, source: 'artefact' },
  { key: 'qa_claims_supported', label: 'Every claim in the work is supported by the material', weight: 25, source: 'material' },
];

export const VALIDATOR_RUBRIC = [
  { key: 'val_facts_match', label: 'Business facts in the artefact match the brief', weight: 30, source: 'artefact' },
  { key: 'val_no_contradiction', label: 'Nothing contradicts the out-of-scope list', weight: 25, source: 'material' },
  { key: 'val_acceptance_verified', label: 'Acceptance checks confirmed on the artefact', weight: 25, source: 'artefact' },
  { key: 'val_process_confirmed', label: 'The packet list in the material bears out the process facts (count and unique ids)', weight: 20, source: 'material' },
];

/** The two questions both agents are asked, so their answers can be compared at all. */
const CORROBORATION_PAIRS = [
  ['qa_acceptance_met', 'val_acceptance_verified'],
  ['qa_claims_supported', 'val_facts_match'],
];

function squash(value: unknown): string {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
}

function fold(value: unknown): string {
  return squash(value).toLowerCase();
}

/**
 * The material both answers are checked against: the owner's own sentence, the
 * brief, the builder's plan (labelled as claims), the mechanical process facts,
 * and the artefact when there is one.
 */
export function agentMaterial(input: { sentence: string; briefText: string; packets: any[]; artefactHtml?: string; facts?: Record<string, any> }) {
  const artefact = String(input.artefactHtml || '');
  const plan = (input.packets || [])
    .map((packet: any) => `- ${packet.id} | ${packet.criterion_id} [${packet.route}] ${packet.title}\n  plan: ${squash(packet.plan)}`)
    .join('\n');
  const facts = input.facts
    ? [
        '## Process facts (computed mechanically by the chain, not asserted by a model)',
        Object.entries(input.facts)
          .map(([key, value]) => `- ${key}: ${Array.isArray(value) ? (value.length ? value.join(', ') : 'none') : String(value)}`)
          .join('\n'),
        '',
      ].join('\n')
    : '';
  const truncated = artefact.length > MATERIAL_LIMIT;

  const body = [
    `## The request, in the owner's own words\n${squash(input.sentence)}`,
    `## The brief the work was meant to satisfy\n${String(input.briefText || '').slice(0, 8000)}`,
    `## The builder's plan — these are claims, not facts (each line is: packet id | criterion | route)\n${plan || '(no packets)'}`,
    facts,
    artefact
      ? `## The artefact as it stands${truncated ? ` (first ${MATERIAL_LIMIT} characters of ${artefact.length})` : ''}\n${artefact.slice(0, MATERIAL_LIMIT)}`
      : '## The artefact\nNo artefact was supplied for this run.',
  ]
    .filter(Boolean)
    .join('\n\n');

  return { body, hasArtefact: artefact.length > 0, truncated, chars: Math.min(artefact.length, MATERIAL_LIMIT) };
}

export function agentPrompt(input: {
  agent: any; runId: string; rubric: any[]; material: string; artefactPresent: boolean; briefing: string;
}) {
  const rubricText = input.rubric
    .map(item => `- ${item.key} — ${item.label}. Proof must come from the ${item.source === 'artefact' ? 'ARTEFACT' : 'material above'}, and from nowhere else.`)
    .join('\n');

  return `You are the ${input.agent.name} for an automated build chain (chain run ${input.runId || 'unknown'}).

You did not produce this work and you owe it nothing. The agent that built it is asking you to approve it; your value is in refusing when the evidence is not there. A second agent reviews the same material separately: you never see their findings and they never see yours.

${input.briefing}

Score exactly these criteria, and nothing else:
${rubricText}

Rules you must obey:
- To return PASS or FAIL you must quote, word for word, the text that proves it. Put that exact text in "quote". The harness searches the material for your quote: a quote it cannot find is discarded and the criterion is recorded as MISSING_EVIDENCE with zero points.
- A quote must be at least ${MIN_QUOTE} characters of real text. Never paraphrase, summarise, tidy or shorten the text you quote.
- ${
    input.artefactPresent
      ? "The builder's plan proves nothing on its own: a claim about the artefact counts only where the artefact itself shows it."
      : 'NO ARTEFACT was supplied. Every criterion whose proof must come from the artefact is MISSING_EVIDENCE — say so plainly instead of guessing.'
  }
- Do not reward effort, intent, formatting or documentation. Reward only what is present and verifiable.
- Do not use general knowledge of what work like this usually contains. Judge only this material.
- Never invent facts, quotes, defects or praise. MISSING_EVIDENCE is a valid, expected answer.

----- MATERIAL -----
${input.material}
----- END MATERIAL -----

Return JSON only: one finding per criterion key, plus a short "verdict" and "summary".`;
}

export function findingSchema() {
  return {
    type: 'object',
    properties: {
      verdict: { type: 'string' },
      summary: { type: 'string' },
      findings: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            key: { type: 'string' },
            status: { type: 'string', enum: ['PASS', 'FAIL', 'MISSING_EVIDENCE'] },
            quote: { type: 'string' },
            note: { type: 'string' },
          },
          required: ['key', 'status', 'quote', 'note'],
        },
      },
    },
    required: ['verdict', 'summary', 'findings'],
  };
}

/**
 * The fail-closed gate. An agent's verdict is kept only when its quote is really
 * in the material (or, for artefact lines, really in the artefact). Everything
 * else becomes MISSING_EVIDENCE and earns nothing.
 */
export function applyFindings(input: { rubric: any[]; findings: any; material: string; artefact?: string; agent: any }) {
  const list = Array.isArray(input.findings) ? input.findings : [];
  const byKey = new Map<string, any>();
  for (const item of list) {
    const key = squash(item?.key);
    if (key && !byKey.has(key)) byKey.set(key, item);
  }
  const artefact = fold(input.artefact);
  const material = fold(input.material);

  return input.rubric.map(item => {
    const found = byKey.get(item.key);
    const quote = squash(found?.quote);
    const claimed = ['PASS', 'FAIL'].includes(String(found?.status || '').toUpperCase())
      ? String(found.status).toUpperCase()
      : 'MISSING_EVIDENCE';
    const haystack = item.source === 'artefact' ? artefact : material;
    const verified = quote.length >= MIN_QUOTE && haystack.includes(fold(quote));
    const status = claimed === 'MISSING_EVIDENCE' || !verified ? 'MISSING_EVIDENCE' : claimed;
    const ratio = status === 'PASS' ? 1 : 0;
    const where = item.source === 'artefact' ? 'artefact' : 'material';
    const note = squash(found?.note).slice(0, 400);
    const evidence =
      status === 'MISSING_EVIDENCE'
        ? `${note || 'No verdict returned for this criterion'} — no proof found in the ${where}`
        : `${note || item.label} — proof found in the ${where}: “${quote.slice(0, 220)}”`;

    return {
      key: item.key,
      label: item.label,
      weight: item.weight,
      ratio,
      earned: Number((item.weight * ratio).toFixed(2)),
      status,
      agent: input.agent.id,
      evidence: `${evidence} (reviewed by ${input.agent.id})`.slice(0, 1000),
    };
  });
}

export function reviewScore(criteria: any[]): number {
  return weight(criteria);
}

export function reviewVerdict(criteria: any[]): string {
  if (criteria.some(item => item.status === 'FAIL')) return 'FAIL';
  if (criteria.some(item => item.status === 'MISSING_EVIDENCE')) return 'MISSING_EVIDENCE';
  return 'PASS';
}

/**
 * The independence criterion. Two agents answering the same two questions
 * separately must reach the same verdict: agreement earns the points, a
 * disagreement fails outright, and anything unproven stays unverified.
 */
export function corroborationCriterion(input: { qa: { ok: boolean; criteria: any[] }; validator: { ok: boolean; criteria: any[] } }) {
  const statusOf = (criteria: any[], key: string) =>
    (criteria || []).find((item: any) => item.key === key)?.status || 'MISSING_EVIDENCE';

  const base = {
    key: 'independent_corroboration',
    label: 'Two independent agents reach the same verdict',
    weight: CORROBORATION_WEIGHT,
    agent: 'independent_corroboration',
  };

  if (!input.qa.ok || !input.validator.ok) {
    const silent = [!input.qa.ok ? QA_AGENT.id : null, !input.validator.ok ? VALIDATOR_AGENT.id : null].filter(Boolean).join(', ');
    return {
      ...base,
      ratio: 0,
      earned: 0,
      status: 'MISSING_EVIDENCE',
      evidence: `${silent} did not report, so nothing is corroborated — one agent cannot pass work on its own`.slice(0, 1000),
    };
  }

  const pairs = CORROBORATION_PAIRS.map(([qaKey, valKey]) => {
    const qaStatus = statusOf(input.qa.criteria, qaKey);
    const valStatus = statusOf(input.validator.criteria, valKey);
    const definitive = qaStatus !== 'MISSING_EVIDENCE' && valStatus !== 'MISSING_EVIDENCE';
    return { detail: `${qaKey}=${qaStatus} vs ${valKey}=${valStatus}`, agreed: definitive && qaStatus === valStatus, disputed: definitive && qaStatus !== valStatus };
  });

  const disputed = pairs.filter(pair => pair.disputed);
  const agreed = pairs.filter(pair => pair.agreed).length;
  const detail = pairs.map(pair => pair.detail).join('; ');
  const status = disputed.length ? 'FAIL' : agreed === pairs.length ? 'PASS' : 'MISSING_EVIDENCE';

  return {
    ...base,
    ratio: status === 'PASS' ? 1 : 0,
    earned: status === 'PASS' ? CORROBORATION_WEIGHT : 0,
    status,
    evidence: (disputed.length
      ? `The two agents disagree on ${disputed.map(pair => pair.detail).join('; ')} — a disputed result cannot pass. All answers: ${detail}.`
      : status === 'PASS'
        ? `Both agents reached the same verdict without seeing each other: ${detail}`
        : `Agreement unproven: ${detail}`).slice(0, 1000),
  };
}