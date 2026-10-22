import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import {
  CHAIN_VERSION, CHAIN_STAGES, TARGETS, normalizeSentence, runIdFor, buildPackets, dedupePackets,
  planScore, processScore, rankRecommendations, verdictFor, grade, weight, receiptIdFor, actionIdFor,
  stableHash, runDigest, isMeasurable, scanUnsupportedFacts, briefToText,
} from '../../shared/promptChain.ts';

/** A filtered query with options returns a page; this reads either shape without guessing. */
const rows = (page: any) => (Array.isArray(page) ? page : page?.items || []);

/**
 * promptChainRunner — the implementation chain.
 *
 * One sentence goes in. The chain transforms it into an exhaustive brief,
 * compiles the implementation packets, has the QA agent and the validation
 * agent read the result, scores it, ranks what is still weak, and (when
 * authorised) queues the work autonomously.
 *
 * Determinism contract:
 *  - run, packet, action and receipt IDs are hashes of their own inputs.
 *  - the transform stage is replayed inside the same run and must return the
 *    same digest; that replay is the idempotence evidence.
 *  - every list is sorted by a fixed key, and nothing is random or clock-derived.
 *  - scoring fails closed: a stage without evidence contributes zero.
 *
 * Callers: the admin console (admin session) and the Vercel cron sweep
 * (bearer token). Admin-only either way.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const mode = body.mode === 'sweep' ? 'sweep' : 'run';

    const bearer = String(req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
    let cronAuthorised = false;
    if (bearer) {
      const expected = secrets.get('PACK_SYNC_TOKEN');
      cronAuthorised = Boolean(expected) && bearer === expected;
    }

    let user: any = null;
    if (!cronAuthorised) {
      try {
        user = await base44.auth.me();
      } catch (authError) {
        user = null;
      }
      if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (mode === 'sweep') {
      const swept = await sweep(base44, cronAuthorised ? 'cron' : 'manual');
      return Response.json({ ok: true, mode: 'sweep', swept });
    }

    const sentence = normalizeSentence(body.sentence).slice(0, 600);
    if (sentence.length < 12) return Response.json({ error: 'Describe the outcome in at least a dozen characters.' }, { status: 400 });

    const result = await runChain(base44, {
      sentence,
      industry: String(body.industry || '').slice(0, 80),
      target: TARGETS.includes(String(body.target)) ? String(body.target) : 'website',
      desired: String(body.desired_result || '').slice(0, 400),
      autoImplement: body.auto_implement === true,
      packetIds: Array.isArray(body.packet_ids) ? body.packet_ids.slice(0, 60).map(String) : [],
      artefactHtml: typeof body.artefact_html === 'string' ? body.artefact_html : '',
      mode: cronAuthorised ? 'cron' : 'manual',
      actor: user?.id || 'cron',
    });

    return Response.json({ ok: true, ...result });
  } catch (error: any) {
    console.error('promptChainRunner error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/** Queued and orphaned runs are finished, then recent verified runs are re-audited. */
async function sweep(base44: any, mode: string) {
  const finished: any[] = [];
  const queued = rows(await base44.asServiceRole.entities.PromptChainRun.filter(
    { status: { $in: ['queued', 'running'] } },
    { sort: 'run_id', limit: 5 },
  ));

  for (const item of queued) {
    try {
      const result = await runChain(base44, {
        sentence: item.source_sentence,
        industry: item.industry || '',
        target: item.target || 'website',
        desired: item.desired_result || '',
        autoImplement: item.auto_implement === true,
        artefactHtml: '',
        mode,
        actor: 'cron',
      });
      finished.push({ run_id: item.run_id, status: result.status, total: result.scores.total });
    } catch (recoverError: any) {
      console.error('sweep: run failed', item.run_id, recoverError?.message);
      await base44.asServiceRole.entities.PromptChainRun.update(item.id, { status: 'failed', error: String(recoverError?.message || '').slice(0, 500) });
      finished.push({ run_id: item.run_id, status: 'failed' });
    }
  }

  const audited: any[] = [];
  const verified = rows(await base44.asServiceRole.entities.PromptChainRun.filter(
    { status: 'verified' },
    { sort: 'run_id', limit: 3 },
  ));

  for (const item of verified) {
    const receipts = rows(await base44.asServiceRole.entities.ValidationReceipt.filter({ session_id: item.run_id }, { limit: 200 }));
    const jobs = rows(await base44.asServiceRole.entities.WorkPacket.filter({ session_id: item.run_id }, { limit: 200 }));
    const expectedReceipts = (item.receipt_ids || []).length;
    const expectedPackets = (item.packets || []).length;
    const receiptsIntact = receipts.length >= expectedReceipts;
    const jobsIntact = jobs.length >= expectedPackets;
    const status = receiptsIntact && jobsIntact ? 'PASS' : 'FAIL';
    const evidence = `expected ${expectedReceipts} receipts / ${expectedPackets} packets, found ${receipts.length} / ${jobs.length}`;

    await base44.asServiceRole.entities.ValidationReceipt.create({
      receipt_id: receiptIdFor(item.run_id, 'audit', `sweep-${stableHash(evidence)}`),
      session_id: item.run_id,
      work_packet_id: `run:${item.run_id}`,
      check_name: 'Re-audit: receipts and queued packets still intact',
      expected: `${expectedReceipts} receipts and ${expectedPackets} packets present`,
      actual: evidence,
      status,
      evidence,
      validator: 'validation_guardian',
      category: 'reliability',
      points_possible: 10,
      points_verified: status === 'PASS' ? 10 : 0,
      timestamp: new Date().toISOString(),
    });

    if (status === 'FAIL') {
      await base44.asServiceRole.entities.PromptChainRun.update(item.id, { status: 'partially_verified' });
    }
    audited.push({ run_id: item.run_id, status, evidence });
  }

  return { picked_up: finished, re_audited: audited };
}

/** The chain itself. Pure orchestration: every stage writes its evidence. */
async function runChain(base44: any, input: {
  sentence: string; industry: string; target: string; desired: string;
  autoImplement: boolean; packetIds?: string[]; artefactHtml: string; mode: string; actor: string;
}) {
  const runId = runIdFor(input.sentence, input.industry, input.target);
  const stages: any[] = [];
  const criteria: any[] = [];
  const receiptIds: string[] = [];

  // ── Stage 1: transform ─────────────────────────────────────
  const first = await base44.functions.invoke('promptTransformer', {
    sentence: input.sentence, industry: input.industry, target: input.target, desired_result: input.desired,
  });
  const transformed = first?.data;
  if (!transformed?.ok || !transformed.brief) {
    throw new Error(transformed?.error || 'The transformer did not return a brief');
  }
  const brief = transformed.brief;
  const briefText = transformed.brief_text || briefToText(brief, { runId, industry: input.industry, target: input.target });
  criteria.push(...transformed.criteria.map((item: any) => ({ ...item, agent: 'prompt_transformer' })));
  stages.push({
    id: 'transform', name: 'Transform', agent: 'prompt_transformer',
    status: transformed.score >= 80 ? 'PASS' : 'FAIL', score: transformed.score,
    evidence: `Brief ${stableHash(briefText)} scored ${transformed.score}/100 across ${transformed.criteria.length} criteria`,
  });

  // ── Stage 2: implement (compile the packets) ───────────────
  const packets = dedupePackets(buildPackets(brief, runId));
  const plan = planScore(brief, packets);
  criteria.push(...plan.criteria.map((item: any) => ({ ...item, agent: 'build_factory' })));
  stages.push({
    id: 'implement', name: 'Implement plan', agent: 'build_factory',
    status: plan.score >= 80 ? 'PASS' : 'FAIL', score: plan.score,
    evidence: `${packets.length} packets compiled, all IDs hash-derived from ${runId}`,
  });

  // ── Stage 3: QA agent ──────────────────────────────────────
  const qa = await qaStage(base44, { brief, briefText, packets, sentence: input.sentence, artefactHtml: input.artefactHtml, runId });
  criteria.push(...qa.criteria);
  stages.push({ id: 'qa', name: 'QA agent', agent: qa.agent, status: qa.status, score: qa.score, evidence: qa.evidence });

  // ── Stage 4: validation agent (replay + process integrity) ─
  const replay = await base44.functions.invoke('promptTransformer', {
    sentence: input.sentence, industry: input.industry, target: input.target, desired_result: input.desired,
  });
  const replayData = replay?.data || {};
  const replayDigest = stableHash(replayData.brief_text || '');
  const replayed = replayData.ok === true && replayData.run_id === runId && replayDigest === stableHash(briefText);

  const receipts = await writeStageReceipts(base44, { runId, criteria, stages });
  receiptIds.push(...receipts.map((item: any) => item.receipt_id));

  const process = processScore({
    runId, packets, receiptIds, replays: replayed ? 1 : 0,
    unsupported: transformed.unsupported_facts || [], artefactVerified: qa.artefactVerified,
  });
  criteria.push(...process.criteria.filter((item: any) => item.weight > 0).map((item: any) => ({ ...item, agent: 'validation_guardian' })));
  const validationScore = process.score;
  stages.push({
    id: 'validate', name: 'Validation agent', agent: 'validation_guardian',
    status: validationScore >= 80 ? 'PASS' : 'FAIL', score: validationScore,
    evidence: replayed
      ? `Replay returned run ${replayData.run_id} with digest ${replayDigest}; IDs and receipts verified`
      : 'Replay digest differed from the first pass',
  });

  // ── Stage 5: score + auto-recommender ──────────────────────
  const recommendations = rankRecommendations(criteria, packets);

  // ── Stage 6: autonomous implementation ─────────────────────
  const actions: any[] = [];
  const wanted = input.packetIds?.length ? new Set(input.packetIds) : null;
  const queuePackets = wanted ? packets.filter((packet: any) => wanted.has(packet.id)) : packets;
  if (input.autoImplement) {
    const existing = rows(await base44.asServiceRole.entities.WorkPacket.filter({ session_id: runId }, { limit: 200 }));
    const already = new Set(existing.map((packet: any) => packet.packet_id));
    for (const packet of queuePackets) {
      const action = {
        id: actionIdFor(runId, packet.id),
        packet_id: packet.id,
        type: 'work_packet',
        route: packet.route,
        target: packet.criterion_id,
        status: already.has(packet.id) ? 'already_queued' : 'queued',
        receipt_id: receiptIdFor(runId, 'autonomous_implement', packet.criterion_id),
      };
      if (!already.has(packet.id)) {
        await base44.asServiceRole.entities.WorkPacket.create({
          packet_id: packet.id,
          session_id: runId,
          title: packet.title.slice(0, 200),
          phase: phaseForPacket(packet.criterion_id),
          status: 'QUEUED',
          risk_class: 'DRAFT',
          description: packet.plan.slice(0, 4900),
          inputs: String(brief.objective || '').slice(0, 2900),
          outputs: (brief.deliverables || []).join(' | ').slice(0, 2900),
          acceptance_criteria: (packet.acceptance || []).join(' | ').slice(0, 2900),
          validation_requirements: 'Each acceptance criterion is verified on the artefact itself and stored as a receipt.',
          source_truth: `PromptChainRun ${runId} on ${CHAIN_VERSION}`,
          recommended_executor: executorFor(packet.route),
          fallback_executor: 'HUMAN',
          allowed_actions: ['read', 'write_app', 'write_records'],
          forbidden_actions: (brief.scope_out || []).slice(0, 10),
          parallel_safe: true,
          order: packets.indexOf(packet),
        });
      }
      actions.push(action);
    }
    stages.push({
      id: 'autonomous_implement', name: 'Autonomous implementation', agent: 'build_factory',
      status: 'PASS', score: 100,
      evidence: `${actions.filter(action => action.status === 'queued').length} packets queued, ${actions.filter(action => action.status === 'already_queued').length} already present`,
    });
  } else {
    stages.push({
      id: 'autonomous_implement', name: 'Autonomous implementation', agent: 'build_factory',
      status: 'BLOCKED', score: 0,
      evidence: `${packets.length} packets compiled and awaiting authorisation`,
    });
  }

  const scores = scoreStages(stages);
  const verdict = verdictFor(stages);

  const recordPayload = {
    run_id: runId,
    chain_version: CHAIN_VERSION,
    source_sentence: input.sentence,
    industry: input.industry || String(brief.industry_context || '').slice(0, 80),
    target: input.target,
    desired_result: String(brief.desired_result || '').slice(0, 400),
    brief,
    brief_text: briefText,
    stages,
    criteria,
    scores,
    verdict,
    determinism: {
      hash: stableHash(briefText),
      stable: replayed,
      unsupported_facts: transformed.unsupported_facts || [],
      checks: [
        `run id ${runId} recomputes from sentence, industry and target`,
        replayed ? 'replayed the transform: same run and same digest' : 'replay digest differed',
        `${packets.length} packets, all hash-derived and deduplicated`,
      ],
    },
    recommendations,
    packets,
    actions,
    receipt_ids: receiptIds,
    artefact_verified: qa.artefactVerified,
    qa_agent_score: qa.artefactVerified ? qa.score : undefined,
    auto_implement: input.autoImplement,
    mode: input.mode,
    status: verdict === 'PASS' ? 'verified' : verdict === 'FAIL' ? 'partially_verified' : 'planned',
    ran_at: new Date().toISOString(),
  };

  const existingRun = rows(await base44.asServiceRole.entities.PromptChainRun.filter({ run_id: runId }, { limit: 1 }));
  const stored = existingRun?.[0]
    ? await base44.asServiceRole.entities.PromptChainRun.update(existingRun[0].id, recordPayload)
    : await base44.asServiceRole.entities.PromptChainRun.create(recordPayload);

  return {
    run_id: runId,
    record_id: stored?.id,
    chain_version: CHAIN_VERSION,
    brief,
    brief_text: briefText,
    stages,
    criteria,
    scores,
    verdict,
    recommendations,
    packets,
    actions,
    receipt_ids: receiptIds,
    determinism: recordPayload.determinism,
    status: recordPayload.status,
    digest: runDigest({ runId, briefScore: scores.transform, packets, recommendations, total: scores.total }),
  };
}

/**
 * The QA agent. With a rendered artefact it defers to the independent page QA
 * agent and folds that score in; without one it reviews the plan adversarially
 * and records the artefact criterion as MISSING_EVIDENCE rather than guessing.
 */
async function qaStage(base44: any, input: { brief: any; briefText: string; packets: any[]; sentence: string; artefactHtml: string; runId: string }) {
  const unverifiable = (input.brief.acceptance_checks || []).filter((check: string) => !isMeasurable(check));
  const evidencePlan = input.packets.filter((packet: any) => /evidence|receipt|verified|measured/i.test(packet.plan)).length;
  const contradicted = input.packets.filter((packet: any) => (input.brief.scope_out || []).some((out: string) => out.length > 20 && packet.plan.includes(out)));
  const invented = scanUnsupportedFacts(input.briefText, input.sentence);

  const criteria = [
    qaCriterion('qa_unverifiable', 'Acceptance checks are all measurable', 30, unverifiable.length === 0 ? 1 : Math.max(0, 1 - unverifiable.length / 3), unverifiable.length ? `Unmeasurable: ${unverifiable.join(' | ').slice(0, 300)}` : 'Every acceptance check names an observable result'),
    qaCriterion('qa_evidence_plan', 'Every packet names the evidence it will produce', 30, input.packets.length ? evidencePlan / input.packets.length : 0, `${evidencePlan} of ${input.packets.length} packets name their evidence`),
    qaCriterion('qa_no_contradiction', 'No packet contradicts the stated out-of-scope list', 20, contradicted.length === 0 ? 1 : 0, contradicted.length ? `${contradicted.length} packet(s) reach outside scope` : 'No packet reaches outside scope'),
    qaCriterion('qa_no_invention', 'No invented facts in the brief', 20, invented.length === 0 ? 1 : 0, invented.length ? `Unsupported: ${invented.join(', ')}` : 'Nothing invented'),
  ];

  let score = weight(criteria);
  let status = score >= 80 ? 'PASS' : 'FAIL';
  let evidence = `Plan reviewed adversarially: ${score}/100 across ${criteria.length} criteria`;
  let artefactVerified = false;

  if (input.artefactHtml) {
    try {
      const res = await base44.functions.invoke('templateQaValidator', { html: input.artefactHtml, profile: {}, applied_fixes: [] });
      const data = res?.data || {};
      const qaScore = Number(data?.qa?.score);
      if (Number.isFinite(qaScore)) {
        artefactVerified = true;
        const artefactCriterion = qaCriterion('qa_artefact', 'Rendered artefact scored by the page QA agent', 40, qaScore / 100, `templateQaValidator scored the rendered page ${qaScore}/100 (${data?.qa?.verdict || 'no verdict'})`);
        criteria.push(artefactCriterion);
        score = weight(criteria);
        status = score >= 80 ? 'PASS' : 'FAIL';
        evidence = `${evidence}; page QA agent scored the rendered artefact ${qaScore}/100`;
      }
    } catch (qaError: any) {
      console.error('qaStage: page QA agent failed', qaError?.message);
      criteria.push(qaCriterion('qa_artefact', 'Rendered artefact scored by the page QA agent', 40, 0, 'The page QA agent could not be reached'));
      score = weight(criteria);
      status = 'FAIL';
      evidence = `${evidence}; page QA agent unreachable`;
    }
  } else {
    criteria.push({ ...qaCriterion('qa_artefact', 'Rendered artefact scored by the page QA agent', 0, 0, 'No rendered artefact supplied — recorded as MISSING_EVIDENCE, never as a pass'), missingEvidence: true });
  }

  return { criteria, score, status, evidence, artefactVerified, agent: artefactVerified ? 'qa_agent+page_qa' : 'qa_agent' };
}

function qaCriterion(key: string, label: string, weightValue: number, ratio: number, evidence: string) {
  const safe = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0));
  return {
    key, label, weight: weightValue, ratio: Number(safe.toFixed(4)),
    earned: Number((weightValue * safe).toFixed(2)), evidence: String(evidence || '').slice(0, 1000),
  };
}

/** One receipt per scored criterion, batched so the worker holds few connections. */
async function writeStageReceipts(base44: any, input: { runId: string; criteria: any[]; stages: any[] }) {
  const agentFor = new Map(input.stages.map((stage: any) => [stage.id, stage.agent]));
  // Deterministic idempotence: a receipt already stored for this run is never rewritten.
  const existing = rows(await base44.asServiceRole.entities.ValidationReceipt.filter({ session_id: input.runId }, { limit: 300 }));
  const have = new Set(existing.map((item: any) => item.receipt_id));
  const entries = input.criteria.map((item: any) => {
    const stageId = stageIdForCriterion(item.agent);
    const status = item.missingEvidence ? 'MISSING_EVIDENCE' : item.ratio >= 1 ? 'PASS' : 'FAIL';
    return {
      receipt_id: receiptIdFor(input.runId, stageId, item.key),
      session_id: input.runId,
      work_packet_id: `run:${input.runId}`,
      check_name: item.label,
      expected: `ratio 1.0 (full marks, ${item.weight} points)`,
      actual: `ratio ${item.ratio} (${item.earned} of ${item.weight} points)`,
      status,
      evidence: item.evidence,
      validator: agentFor.get(stageId) || item.agent || 'qa_agent',
      category: categoryFor(stageId),
      points_possible: item.weight,
      points_verified: item.earned,
      timestamp: new Date().toISOString(),
    };
  });

  const pending = entries.filter((row: any) => !have.has(row.receipt_id));
  const stored: any[] = [];
  for (let index = 0; index < pending.length; index += 6) {
    const batch = pending.slice(index, index + 6);
    const settled = await Promise.allSettled(batch.map((row: any) => base44.asServiceRole.entities.ValidationReceipt.create(row)));
    settled.forEach((outcome: any, offset: number) => {
      const row = batch[offset];
      if (outcome.status === 'fulfilled') stored.push({ receipt_id: row.receipt_id, status: row.status });
      else console.error('receipt write failed', row.receipt_id, outcome.reason?.message);
    });
  }
  return [...new Set([...have, ...stored.map((item: any) => item.receipt_id)])].sort().map((receipt_id: string) => ({ receipt_id }));
}

function stageIdForCriterion(agent: string) {
  if (agent === 'prompt_transformer') return 'transform';
  if (agent === 'validation_guardian') return 'validate';
  if (agent === 'qa_agent' || agent === 'qa_agent+page_qa') return 'qa';
  return 'implement';
}

/** The route decides which executor actually owns that kind of work in this app. */
function executorFor(route: string) {
  if (route === 'worker') return 'RAILWAY';
  return 'BASE44';
}

function phaseForPacket(criterionId: string) {
  if (criterionId === 'seo_unique') return 'OPTIMIZE';
  if (criterionId === 'receipts_written') return 'VALIDATE';
  return 'BUILD';
}

function categoryFor(stageId: string) {
  if (stageId === 'transform') return 'source_truth';
  if (stageId === 'implement') return 'architecture';
  if (stageId === 'qa') return 'testing';
  return 'reliability';
}

/** Weighted total across the chain: each stage carries its own contract weight. */
function scoreStages(stages: any[]) {
  const byId = new Map(stages.map((stage: any) => [stage.id, stage]));
  const out: any = { transform: 0, implement: 0, qa: 0, validate: 0, autonomous: 0, total: 0, grade: 'F' };
  let weighted = 0;
  let assigned = 0;
  for (const contract of CHAIN_STAGES) {
    const stage = byId.get(contract.id);
    const score = stage ? Number(stage.score) || 0 : 0;
    if (contract.id === 'autonomous_implement') out.autonomous = Math.round(score * 10) / 10;
    else if (contract.id === 'validate') out.validate = Math.round(score * 10) / 10;
    else out[contract.id] = Math.round(score * 10) / 10;
    weighted += (score * contract.weight) / 100;
    assigned += contract.weight;
  }
  out.total = Math.round((weighted / (assigned / 100)) * 10) / 10;
  out.grade = grade(out.total);
  return out;
}