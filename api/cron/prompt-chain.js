/**
 * Vercel Cron bridge.
 *
 * Vercel calls this route on its schedule; this route calls the app's chain
 * runner with the shared bearer token. The token lives in Vercel's environment
 * (CRON_SECRET, or PACK_SYNC_TOKEN if that is what you set) and must match the
 * app secret of the same name. Nothing runs without it.
 *
 * No dependencies: global fetch (Node 18+).
 */

const RUNNER_URL = process.env.PROMPT_CHAIN_URL || 'https://unlimitedwebsites.base44.app/functions/promptChainRunner';

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET || process.env.PACK_SYNC_TOKEN || '';
  if (!secret) {
    res.status(500).json({ ok: false, error: 'No cron token configured in the Vercel environment' });
    return;
  }

  const job = String(req.query?.job || 'chain-sweep');
  const mode = job === 'run' ? 'run' : 'sweep';

  try {
    const response = await fetch(RUNNER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
      body: JSON.stringify({ mode, job, scheduled_at: new Date().toISOString() }),
      signal: AbortSignal.timeout(110000),
    });
    const data = await response.json().catch(() => ({}));
    console.log('prompt-chain cron', job, response.status, JSON.stringify(data).slice(0, 500));
    res.status(response.status).json({ ok: response.ok, job, status: response.status, data });
  } catch (error) {
    console.error('prompt-chain cron failed', job, error?.message);
    res.status(500).json({ ok: false, job, error: error?.message || 'cron call failed' });
  }
}