export function validateCloudCycle(receipt) {
  const failures = [];
  const isPreview = receipt.environment === 'preview';
  const allowedStepStatuses = isPreview ? new Set(['PASS', 'PASS_PREVIEW']) : new Set(['PASS']);
  const required = ['source_truth', 'runtime_health', 'seo_surface', 'cleanup', 'management', 'evolution'];
  for (const name of required) {
    const step = receipt.steps?.find((s) => s.name === name);
    if (!step) failures.push(`MISSING_STEP:${name}`);
    else if (!allowedStepStatuses.has(step.status)) failures.push(`STEP_NOT_PASS:${name}:${step.status}`);
  }
  if (receipt.protected_mutations_executed?.length) failures.push('PROTECTED_MUTATION_EXECUTED');
  if (receipt.evolution?.mode !== 'DRAFT_ONLY') failures.push('EVOLUTION_NOT_DRAFT_ONLY');
  const status = failures.length ? 'FAIL' : (isPreview ? 'PASS_PREVIEW' : 'PASS');
  return {
    status,
    release_eligible: status === 'PASS',
    failures,
    validated_at: new Date().toISOString(),
    validator: 'runtime/cloud-validator.mjs',
    note: status === 'PASS_PREVIEW' ? 'Preview-protected routes are accepted only as preview evidence; production release still requires strict direct-route PASS.' : undefined
  };
}
