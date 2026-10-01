import fs from 'node:fs';

const receiptPath = process.argv[2];
if (!receiptPath || !fs.existsSync(receiptPath)) {
  console.error('FAIL missing receipt');
  process.exit(2);
}
const receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
const failures = [];
for (const phase of ['source_truth', 'audit', 'clean', 'manage', 'evolve']) {
  if (!receipt.phases?.find((p) => p.name === phase)) failures.push(`MISSING_PHASE:${phase}`);
}
for (const c of receipt.commands || []) if (c.status !== 'PASS') failures.push(`COMMAND_FAIL:${c.name}`);
if ((receipt.protected_mutations_executed || []).length) failures.push('PROTECTED_MUTATION_EXECUTED');
if (receipt.evolution?.mode !== 'DRAFT_ONLY') failures.push('EVOLUTION_NOT_DRAFT_ONLY');
if (receipt.scheduler?.active_count !== 1) failures.push(`ACTIVE_SCHEDULER_COUNT:${receipt.scheduler?.active_count}`);
const result = { status: failures.length ? 'FAIL' : 'PASS', failures, validated_at: new Date().toISOString(), receipt: receiptPath };
const out = receiptPath.replace(/\.json$/, '.validator.json');
fs.writeFileSync(out, JSON.stringify(result, null, 2));
console.log(`${result.status} ${out}`);
process.exit(failures.length ? 1 : 0);
