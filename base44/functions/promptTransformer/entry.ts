import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  CHAIN_VERSION, TARGETS, BRIEF_SECTIONS, normalizeSentence, runIdFor, scaffoldBrief,
  mergeLlmBrief, briefScore, briefToText, scanUnsupportedFacts, stableHash,
} from '../../shared/promptChain.ts';

/**
 * promptTransformer — one sentence in, an exhaustive execution brief out.
 *
 * Deterministic architecture:
 *  - The run ID is a hash of (sentence, industry, target). Re-asking for the same
 *    sentence returns the stored brief instead of burning a second model call.
 *  - The structure, IDs, scoring and guardrails are computed in code. The model
 *    only fills section text, and anything it invents is caught by the
 *    unsupported-fact scan and scored down.
 *
 * Admin only: it is an operator tool, not a public endpoint.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const sentence = normalizeSentence(body.sentence).slice(0, 600);
    if (sentence.length < 12) {
      return Response.json({ error: 'Describe the outcome in at least a dozen characters.' }, { status: 400 });
    }
    const industry = String(body.industry || '').slice(0, 80);
    const target = TARGETS.includes(String(body.target)) ? String(body.target) : 'website';
    const desired = String(body.desired_result || '').slice(0, 400);
    const runId = runIdFor(sentence, industry, target);

    // Deterministic replay: the same sentence resolves to the same run and brief.
    const page = await base44.asServiceRole.entities.PromptChainRun.filter({ run_id: runId }, { limit: 1 });
    const replay = (Array.isArray(page) ? page : page?.items || [])[0];
    if (replay?.brief && replay?.brief_text) {
      return Response.json({
        ok: true,
        reused: true,
        run_id: runId,
        chain_version: CHAIN_VERSION,
        brief: replay.brief,
        brief_text: replay.brief_text,
        score: replay.scores?.transform || 0,
        criteria: replay.criteria || [],
        determinism: replay.determinism || {},
      });
    }

    const scaffold = scaffoldBrief(sentence, { industry, target, desired_result: desired });
    let modelBrief: any = null;
    try {
      modelBrief = await base44.integrations.Core.InvokeLLM({
        prompt: `You are the prompt architect for a high-performance contractor marketing system. A business owner typed this single sentence:

"${sentence}"

Turn it into an exhaustive, executable brief that another agent could implement without asking a single question.

Rules, all mandatory:
- Be specific to the industry and to the exact result the sentence asks for. Use the trade's own vocabulary and name the actual artefacts (pages, sections, forms, integrations, files).
- The objective is the owner's sentence. Never rewrite or soften it.
- Industry context: state the trade, who buys from it, what the trade's customers compare, and what "good" looks like in that trade.
- Desired result: state the finished state in observable terms.
- In scope and out of scope: both, at least three entries each. Out of scope must include what would be overreach.
- Quality bar: each entry measurable.
- Acceptance checks: at least four, each independently verifiable on the finished artefact ("X renders", "no two pages share a title", "the form stores a record"). Never a feeling.
- Deliverables and risks: name real ones.
- NEVER invent facts the sentence does not contain: no prices, phone numbers, emails, addresses, review counts, certifications, awards or URLs. If a detail is not given, describe the requirement instead of inventing the value.
- No placeholders, no "TBD", no lorem text.
- Write in plain, confident English, British spelling, no em-dashes.`,
        response_json_schema: {
          type: 'object',
          properties: {
            industry_context: { type: 'string' },
            desired_result: { type: 'string' },
            audience: { type: 'string' },
            scope_in: { type: 'array', items: { type: 'string' } },
            scope_out: { type: 'array', items: { type: 'string' } },
            quality_bar: { type: 'array', items: { type: 'string' } },
            constraints: { type: 'array', items: { type: 'string' } },
            acceptance_checks: { type: 'array', items: { type: 'string' } },
            deliverables: { type: 'array', items: { type: 'string' } },
            risks: { type: 'array', items: { type: 'string' } },
          },
          required: BRIEF_SECTIONS.filter(key => key !== 'objective'),
        },
      });
    } catch (modelError: any) {
      console.error('promptTransformer: model pass failed, using the deterministic scaffold', modelError?.message);
    }

    const { brief, source } = mergeLlmBrief(scaffold, modelBrief || {});
    const scored = briefScore(brief, sentence);
    const briefText = briefToText(brief, { runId, industry: brief.industry_context, target });
    const unsupported = Array.from(new Set([...scored.unsupported, ...scanUnsupportedFacts(briefText, sentence)])).sort();

    const payload = {
      run_id: runId,
      chain_version: CHAIN_VERSION,
      source_sentence: sentence,
      industry: industry || brief.industry_context.slice(0, 80),
      target,
      desired_result: brief.desired_result.slice(0, 400),
      brief: { ...brief, section_source: source },
      brief_text: briefText,
      criteria: scored.criteria,
      scores: { transform: scored.score, total: scored.score },
      determinism: {
        hash: stableHash(briefText),
        stable: true,
        unsupported_facts: unsupported,
        checks: [
          `run id derived from sentence, industry and target: ${runId}`,
          `brief digest ${stableHash(briefText)} recomputes from the same input`,
          unsupported.length ? `${unsupported.length} unsupported fact(s) flagged and scored down` : 'no unsupported facts found',
        ],
      },
      mode: 'manual',
      status: 'planned',
      ran_at: new Date().toISOString(),
    };

    const created = await base44.asServiceRole.entities.PromptChainRun.create(payload);

    // The transformed brief is a reusable prompt in its own right.
    await base44.asServiceRole.entities.PromptLibrary.create({
      title: `${target}: ${sentence}`.slice(0, 120),
      category: 'custom',
      prompt_text: briefText.slice(0, 4990),
      industry: String(brief.industry_context || '').slice(0, 80),
      negative_prompt: unsupported.length ? `Do not invent: ${unsupported.join(', ')}` : '',
      tags: ['prompt-chain', CHAIN_VERSION, target],
      is_active: true,
      sort_order: 0,
    });

    return Response.json({
      ok: true,
      reused: false,
      run_id: runId,
      record_id: created?.id,
      chain_version: CHAIN_VERSION,
      brief,
      brief_text: briefText,
      score: scored.score,
      criteria: scored.criteria,
      missing: scored.missing,
      unsupported_facts: unsupported,
      determinism: payload.determinism,
    });
  } catch (error: any) {
    console.error('promptTransformer error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}