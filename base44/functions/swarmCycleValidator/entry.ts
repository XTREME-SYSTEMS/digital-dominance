import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const REQUIRED_STEPS = ['audit', 'fix', 'heal', 'harden', 'optimize_aeo', 'health_check', 'dispatch'];
const SAFE_RISK_CLASSES = new Set(['READ', 'DRAFT', 'BRANCH_WRITE', 'TEST', 'INTERNAL_MAINTENANCE']);
const PROTECTED_TASK_TYPES = new Set(['social_publish', 'comms_send', 'lead_followup', 'site_deploy', 'production_deploy', 'customer_message', 'public_publish']);

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden - admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const cycleId = String(body.cycle_id || 'unknown');
    const steps = Array.isArray(body.steps) ? body.steps : [];
    const failures: string[] = [];

    for (const required of REQUIRED_STEPS) {
      const step = steps.find((s: any) => s?.step === required);
      if (!step) failures.push(`MISSING_STEP:${required}`);
      else if (step.error) failures.push(`STEP_ERROR:${required}:${step.error}`);
      else if (step.result?.ok === false) failures.push(`STEP_RESULT_NOT_OK:${required}`);
    }

    const serialized = JSON.stringify(steps);
    if (serialized.includes('Published draft social posts')) failures.push('PROTECTED_ACTION_EXECUTED:SOCIAL_PUBLISH');
    if (serialized.includes('Triggered follow-up email batch')) failures.push('PROTECTED_ACTION_EXECUTED:CUSTOMER_MESSAGE');

    const aeo = steps.find((s: any) => s?.step === 'optimize_aeo')?.result?.optimizations || [];
    if (aeo.some((o: any) => o?.action === 'ai_indexer_submission' && o?.executed === true)) {
      failures.push('PROTECTED_ACTION_EXECUTED:INDEXER_SUBMISSION');
    }

    const dispatch = steps.find((s: any) => s?.step === 'dispatch')?.result || {};
    if (!Array.isArray(dispatch?.protected_blocked)) failures.push('MISSING_PROTECTED_BLOCK_RECEIPT');
    if (typeof dispatch?.protected_blocked_count !== 'number') failures.push('MISSING_PROTECTED_BLOCK_COUNT');
    if (Array.isArray(dispatch?.protected_blocked) && dispatch.protected_blocked_count !== dispatch.protected_blocked.length) {
      failures.push('PROTECTED_BLOCK_COUNT_MISMATCH');
    }
    for (const item of dispatch?.dispatched || []) {
      if (PROTECTED_TASK_TYPES.has(item?.task_type)) failures.push(`PROTECTED_TASK_DISPATCHED:${item.task_type}`);
      if (!SAFE_RISK_CLASSES.has(String(item?.risk_class || '').toUpperCase())) failures.push(`UNSAFE_RISK_DISPATCHED:${item?.risk_class || 'UNKNOWN'}`);
    }

    const status = failures.length === 0 ? 'PASS' : 'FAIL';
    await base44.asServiceRole.entities.SopLog.create({
      category: 'integration',
      action: 'swarm_cycle_validation',
      description: `Independent validation ${status} for ${cycleId}`,
      detail: JSON.stringify({ cycle_id: cycleId, status, failures }),
      source: 'swarmCycleValidator',
    }).catch(() => {});

    return Response.json({ ok: status === 'PASS', status, cycle_id: cycleId, failures, validated_at: new Date().toISOString() }, { status: status === 'PASS' ? 200 : 409 });
  } catch (error: any) {
    return Response.json({ ok: false, status: 'FAIL', error: error.message }, { status: 500 });
  }
}
