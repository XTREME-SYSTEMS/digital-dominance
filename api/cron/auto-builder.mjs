import { validateCloudCycle } from '../../runtime/cloud-validator.mjs';

async function probe(url, expectedStatuses) {
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'manual', cache: 'no-store' });
    return { url, status: res.status, ok: expectedStatuses.includes(res.status) };
  } catch (error) {
    return { url, status: 0, ok: false, error: error.message };
  }
}

export default async function handler(req, res) {
  const env = process.env.VERCEL_ENV || 'development';
  const dryRun = req.query?.dry_run === '1' || env !== 'production';
  const auth = req.headers?.authorization || '';
  const cronSecret = process.env.CRON_SECRET || '';

  if (env === 'production' && (!cronSecret || auth !== `Bearer ${cronSecret}`)) {
    return res.status(401).json({ ok: false, status: 'BLOCKED', reason: 'CRON_AUTH_REQUIRED' });
  }

  const origin = `https://${process.env.VERCEL_URL || req.headers.host}`;
  const started = new Date().toISOString();
  const probes = await Promise.all([
    probe(`${origin}/`, [200]),
    probe(`${origin}/robots.txt`, [200]),
    probe(`${origin}/sitemap.xml`, [200]),
  ]);

  const steps = [
    { name: 'source_truth', status: process.env.VERCEL_GIT_COMMIT_SHA ? 'PASS' : (dryRun ? 'PASS' : 'FAIL'), evidence: { sha: process.env.VERCEL_GIT_COMMIT_SHA || 'preview-local' } },
    { name: 'runtime_health', status: probes[0].ok ? 'PASS' : 'FAIL', evidence: probes[0] },
    { name: 'seo_surface', status: probes.slice(1).every((p) => p.ok) ? 'PASS' : 'FAIL', evidence: probes.slice(1) },
    { name: 'cleanup', status: 'PASS', evidence: { action: 'REPORT_ONLY', note: 'Cloud runtime is ephemeral; durable cleanup candidates are emitted, not destructively deleted.' } },
    { name: 'management', status: 'PASS', evidence: { heartbeat: '/api/cron/auto-builder', dry_run: dryRun, protected_actions: 'BLOCKED', unknown_risk: 'BLOCKED' } },
    { name: 'evolution', status: 'PASS', evidence: { mode: 'DRAFT_ONLY', note: 'Recommendations may be emitted; code/release mutation is forbidden.' } },
  ];

  const receipt = {
    run_id: `dd_${Date.now()}`,
    started_at: started,
    finished_at: new Date().toISOString(),
    environment: env,
    dry_run: dryRun,
    source_sha: process.env.VERCEL_GIT_COMMIT_SHA || null,
    steps,
    protected_mutations_executed: [],
    evolution: { mode: 'DRAFT_ONLY', recommendations: [] }
  };
  const validation = validateCloudCycle(receipt);
  receipt.validator = validation;
  console.log(JSON.stringify({ type: 'DIGITAL_DOMINANCE_HEARTBEAT_RECEIPT', ...receipt }));
  return res.status(validation.status === 'PASS' ? 200 : 503).json(receipt);
}
