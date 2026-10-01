export function validateCloudCycle(receipt) {
  const failures = [];
  const required = ['source_truth', 'runtime_health', 'seo_surface', 'cleanup', 'management', 'evolution'];
  for (const name of required) {
    const step = receipt.steps?.find((s) => s.name === name);
    if (!step) failures.push(`MISSING_STEP:${name}`);
    else if (step.status !== 'PASS') failures.push(`STEP_NOT_PASS:${name}:${step.status}`);
  }
  if (receipt.protected_mutations_executed?.length) failures.push('PROTECTED_MUTATION_EXECUTED');
  if (receipt.evolution?.mode !== 'DRAFT_ONLY') failures.push('EVOLUTION_NOT_DRAFT_ONLY');
  return {
    status: failures.length ? 'FAIL' : 'PASS',
    failures,
    validated_at: new Date().toISOString(),
    validator: 'runtime/cloud-validator.mjs'
  };
}
