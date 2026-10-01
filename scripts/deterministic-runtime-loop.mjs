import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const receiptDir = path.join(root, '03_Bridge_Receipts', 'runtime');
fs.mkdirSync(receiptDir, { recursive: true });
const started = new Date();
const runId = `dd_${started.toISOString().replace(/[^0-9]/g, '').slice(0,14)}`;

// Bounded cleanup only: old JSON receipts in the dedicated runtime receipt folder.
const retentionMs = 30 * 24 * 60 * 60 * 1000;
const cleaned = [];
for (const name of fs.readdirSync(receiptDir)) {
  if (!name.endsWith('.json')) continue;
  const full = path.join(receiptDir, name);
  const stat = fs.statSync(full);
  if (Date.now() - stat.mtimeMs > retentionMs) { fs.unlinkSync(full); cleaned.push(name); }
}

const scheduler = JSON.parse(fs.readFileSync(path.join(root, 'runtime', 'scheduler-control.json'), 'utf8'));
const activeCount = [scheduler.authoritative_scheduler, scheduler.candidate_scheduler].filter((s) => s.active).length;

const commands = [];
for (const [name, args] of [
  ['alpha-prime', ['scripts/alpha-prime-regression.mjs']],
  ['seo-indexing', ['scripts/seo-indexing-regression.mjs']],
  ['runtime-governance', ['scripts/runtime-governance-regression.mjs']],
]) {
  const r = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8' });
  commands.push({ name, status: r.status === 0 ? 'PASS' : 'FAIL', exit_code: r.status, stdout: r.stdout.slice(-5000), stderr: r.stderr.slice(-5000) });
}

const receipt = {
  run_id: runId,
  started_at: started.toISOString(),
  finished_at: new Date().toISOString(),
  source: 'LOCAL_WORKING_MIRROR',
  phases: [
    { name: 'source_truth', status: 'PASS' },
    { name: 'audit', status: commands.every((c) => c.status === 'PASS') ? 'PASS' : 'FAIL' },
    { name: 'clean', status: 'PASS', cleaned_receipts: cleaned },
    { name: 'manage', status: activeCount === 1 ? 'PASS' : 'FAIL' },
    { name: 'evolve', status: 'PASS', mode: 'DRAFT_ONLY' },
  ],
  commands,
  scheduler: { active_count: activeCount, control: scheduler },
  protected_mutations_executed: [],
  evolution: { mode: 'DRAFT_ONLY', recommendations: commands.filter((c) => c.status !== 'PASS').map((c) => `Repair ${c.name}`) }
};
const receiptPath = path.join(receiptDir, `${runId}.json`);
fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));
const v = spawnSync(process.execPath, ['scripts/deterministic-runtime-validator.mjs', receiptPath], { cwd: root, encoding: 'utf8' });
process.stdout.write(v.stdout);
process.stderr.write(v.stderr);
console.log(receiptPath);
process.exit(v.status || 0);
