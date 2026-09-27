import { mkdir, open } from 'node:fs/promises';
import { join } from 'node:path';
import { PILOT_ID } from '../base44/shared/semrushEvidence.mjs';

// Single-host pilot only. root MUST be a durable private volume shared by all callers.
// Exclusive creation survives restart and blocks concurrent/repeated quota reservations.
// Do not use temporary/serverless storage or delete a reservation to retry.
export function fileLedger(root) {
  if (!root || !root.startsWith('/')) throw new Error('ABSOLUTE_DURABLE_LEDGER_REQUIRED');
  async function write(id, suffix, data) {
    if (id !== PILOT_ID) throw new Error('INVALID_PILOT');
    await mkdir(root, { recursive: true, mode: 0o700 });
    const file = await open(join(root, id + suffix + '.json'), 'wx', 0o600);
    try { await file.writeFile(JSON.stringify(data)); await file.sync(); }
    finally { await file.close(); }
    const directory = await open(root, 'r');
    try { await directory.sync(); } finally { await directory.close(); }
  }
  return { reserve: (id, data) => write(id, '.reservation', data),
    finish: (id, data) => write(id, '.receipt', data) };
}
