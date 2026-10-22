import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import {
  VALIDATOR_AGENT, VALIDATOR_RUBRIC, agentMaterial, agentPrompt, findingSchema, applyFindings, reviewScore, reviewVerdict,
} from '../../shared/independentQa.ts';

/**
 * independentValidator — the chain's second, independent reviewer.
 *
 * It answers the same two questions the QA agent answers, on a different model
 * and a different transport, and it is handed the mechanical process facts so it
 * can contradict them rather than repeat them. Its verdicts are subject to the
 * same fail-closed gate: a quote the harness cannot find in the material is
 * recorded as MISSING_EVIDENCE and earns nothing.
 *
 * Neither reviewer sees the other's findings; the chain compares them afterwards.
 */

const VALIDATOR_BRIEFING = `Your question is: is every claim made about this work true of the material, and does anything in it contradict the brief? You are validating claims, not style.

The process facts below were computed mechanically from the chain's own data. Bear each one out against the material, and contradict it if the material does not support it — a fact you cannot confirm from the material is MISSING_EVIDENCE, not a PASS.

Also name any invented fact you find: a price, phone number, email address, business name, certification, review count, statistic or guarantee that the brief does not contain.`;

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const expected = secrets.get('PACK_SYNC_TOKEN');
    let authorised = Boolean(expected) && String(body.internal_token || '') === expected;
    if (!authorised) {
      let user: any = null;
      try {
        user = await base44.auth.me();
      } catch (authError) {
        user = null;
      }
      if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
      authorised = true;
    }

    const sentence = String(body.sentence || '').slice(0, 600);
    const briefText = String(body.brief_text || '').slice(0, 8000);
    const artefact = String(body.artefact_html || '').slice(0, 300000);
    const packets = Array.isArray(body.packets) ? body.packets.slice(0, 40) : [];
    const facts = body.facts && typeof body.facts === 'object' ? body.facts : {};
    if (!briefText) return Response.json({ error: 'brief_text is required' }, { status: 400 });

    const material = agentMaterial({ sentence, briefText, packets, artefactHtml: artefact, facts });
    const prompt = agentPrompt({
      agent: VALIDATOR_AGENT,
      runId: String(body.run_id || ''),
      rubric: VALIDATOR_RUBRIC,
      material: material.body,
      artefactPresent: material.hasArtefact,
      briefing: VALIDATOR_BRIEFING,
    });

    let raw: any = {};
    let failure = '';
    try {
      const llm = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: findingSchema(),
        model: VALIDATOR_AGENT.model,
      });
      raw = llm && typeof llm === 'object' ? llm : {};
    } catch (llmError: any) {
      failure = String(llmError?.message || 'the validator model did not answer');
      console.error('independentValidator: model failed —', failure);
    }

    if (failure) {
      return Response.json({
        ok: false,
        agent: VALIDATOR_AGENT.id,
        error: failure,
        criteria: [],
        score: 0,
        verdict: 'MISSING_EVIDENCE',
      });
    }

    const criteria = applyFindings({ rubric: VALIDATOR_RUBRIC, findings: raw.findings, material: material.body, artefact, agent: VALIDATOR_AGENT });

    return Response.json({
      ok: true,
      agent: VALIDATOR_AGENT.id,
      model: VALIDATOR_AGENT.model,
      provider: `base44:${VALIDATOR_AGENT.model}`,
      score: reviewScore(criteria),
      verdict: reviewVerdict(criteria),
      summary: String(raw.summary || '').slice(0, 600),
      criteria,
      material: { has_artefact: material.hasArtefact, truncated: material.truncated, characters: material.chars },
    });
  } catch (error: any) {
    console.error('independentValidator error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}