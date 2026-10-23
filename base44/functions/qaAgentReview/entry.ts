import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import {
  QA_AGENT, QA_RUBRIC, agentMaterial, agentPrompt, findingSchema, applyFindings, reviewScore, reviewVerdict,
} from '../../shared/independentQa.ts';

/**
 * qaAgentReview — the chain's independent QA agent.
 *
 * It reads the material the chain hands it and returns a verdict per rubric line,
 * each with the exact text that proves it. This response is a proposal only: the
 * harness that reads it discards any verdict whose quote it cannot find in the
 * material, so nothing ever passes on an agent's word.
 *
 * It runs on the app's free-tier provider chain, deliberately separate from the
 * model that produced the work. Callable by the chain (shared internal token) or
 * by an admin; nobody else can spend a review.
 */

const QA_BRIEFING = `Your question is: does this work, as it stands, deliver what was asked, and is every claim it makes backed by the material? A plan, a packet description or a promise to do something later is not delivery.`;

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
    if (!sentence || !briefText) {
      return Response.json({ error: 'sentence and brief_text are required' }, { status: 400 });
    }

    const material = agentMaterial({ sentence, briefText, packets, artefactHtml: artefact });
    const prompt = agentPrompt({
      agent: QA_AGENT,
      runId: String(body.run_id || ''),
      rubric: QA_RUBRIC,
      material: material.body,
      artefactPresent: material.hasArtefact,
      briefing: QA_BRIEFING,
    });

    let provider = '';
    let raw: any = {};
    let failure = '';

    try {
      const review = await base44.functions.invoke('independentAi', {
        action: 'invoke',
        prompt,
        response_json_schema: findingSchema(),
        max_tokens: 3000,
        temperature: 0.2,
      });
      const payload = review?.data || {};
      if (payload.ok === true) {
        provider = `independent:${payload.provider || 'unknown'}`;
        raw = payload.result && typeof payload.result === 'object' ? payload.result : {};
      } else {
        failure = String(payload.error || 'the free-tier provider chain did not answer');
      }
    } catch (invokeError: any) {
      failure = String(invokeError?.message || 'the free-tier provider chain did not answer');
    }

    // The review still has to be made when the free tier is out of quota, so the
    // agent falls back to its own model — deliberately not the validator's.
    if (!provider) {
      console.error('qaAgentReview: free-tier chain unavailable —', failure);
      try {
        const llm = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: findingSchema(),
          model: QA_AGENT.fallback_model,
        });
        raw = llm && typeof llm === 'object' ? llm : {};
        provider = `base44:${QA_AGENT.fallback_model}`;
      } catch (llmError: any) {
        console.error('qaAgentReview: fallback model failed —', llmError?.message);
        return Response.json({
          ok: false,
          agent: QA_AGENT.id,
          error: `${failure}; fallback: ${llmError?.message || 'failed'}`,
          criteria: [],
          score: 0,
          verdict: 'MISSING_EVIDENCE',
        });
      }
    }

    const criteria = applyFindings({ rubric: QA_RUBRIC, findings: raw.findings, material: material.body, artefact, agent: QA_AGENT });

    return Response.json({
      ok: true,
      agent: QA_AGENT.id,
      model: QA_AGENT.model,
      provider,
      fallback_used: !provider.startsWith('independent:'),
      score: reviewScore(criteria),
      verdict: reviewVerdict(criteria),
      summary: String(raw.summary || '').slice(0, 600),
      criteria,
      material: { has_artefact: material.hasArtefact, truncated: material.truncated, characters: material.chars },
    });
  } catch (error: any) {
    console.error('qaAgentReview error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}