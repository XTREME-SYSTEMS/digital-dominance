import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

// Dynamic test of the real launcher handler with in-memory Base44 and Vercel
// adapters. No provider traffic, deployment, account writes or paid model calls.
const tsSource = readFileSync(new URL('../base44/functions/bulkLaunchEngine/entry.ts', import.meta.url), 'utf8');
const executable = tsSource
  .replace(/^import .*createClientFromRequest.*;\s*$/m, '')
  .replace(/^import .*waitUntil.*;\s*$/m, '')
  .replace('export default async function(req: Request): Promise<Response> {',
    'module.exports = async function(req) {')
  .replace("const { secrets } = await import('base44:runtime');",
    'const { secrets } = globalThis.__runtime;');
assert.ok(executable.includes('module.exports = async function(req)'));
assert.ok(!executable.includes("from 'base44:runtime'"));

async function simulate(action, providerMode = 'accepted', actor = { role: 'admin' }) {
  const updates = [];
  const invoked = [];
  let privilegedReads = 0;
  const initial = {
    id: 'synthetic-site-1',
    template_id: 'safe-template-1',
    site_slug: 'epoxy-miami-fl',
    site_name: 'Epoxy Miami FL',
    site_url: 'https://guessed.invalid',
    status: 'queued',
  };
  const sites = [initial];
  const svc = { entities: { SiteBank: {
    async bulkCreate(entries) {
      return entries.map((item, i) => ({ ...item, id: 'synthetic-site-' + (i + 1) }));
    },
    async filter() { return sites; },
    async update(id, delta) {
      updates.push({ id, ...delta });
      return { id, ...delta };
    },
  } } };
  const client = {
    auth: { me: async () => actor },
    get asServiceRole() { privilegedReads++; return svc; },
    functions: { async invoke(fn, args) {
      invoked.push({ fn, args });
      if (fn === 'gptSyncEngine') return { data: { event_id: 'pending-only' } };
      if (fn !== 'publishTemplateLive') throw new Error('Unexpected function ' + fn);
      if (providerMode === 'throw') throw new Error('provider unavailable');
      if (providerMode === 'missing') return { data: { success: false } };
      return { data: { success: true, deployment_id: 'dpl_test_receipt', url: 'https://preview.example.test' } };
    } },
  };
  const context = {
    module: { exports: {} }, Date, Math,
    console: { error() {} },
    Response: { json: (body, opts = {}) => ({ status: opts.status ?? 200, body }) },
    __client: client, __runtime: { secrets: { get: () => '' } },
    createClientFromRequest: () => client,
    waitUntil: () => {},
  };
  context.globalThis = context;
  vm.runInNewContext(executable, context, { timeout: 1500 });
  const payload = action === 'launch'
    ? { action, niche: 'epoxy', templateId: 'safe-template-1',
        cities: [{ city: 'Miami', state: 'FL' }], autoSync: true }
    : { action };
  const resp = await context.module.exports({
    headers: { get: () => '' },
    json: async () => payload,
  });
  return { resp, updates, invoked, privilegedReads };
}

test('successful provider acceptance is NOT recorded as a live site or sync', async () => {
  const { resp, updates, invoked } = await simulate('launch', 'accepted');
  assert.equal(resp.status, 200);
  assert.equal(resp.body.deployments_accepted, 1);
  assert.equal(resp.body.awaiting_validation, 1);
  assert.equal(resp.body.release_ready, false);
  assert.equal(resp.body.deployed, 0);
  assert.equal(resp.body.synced, 0);
  assert.equal(resp.body.sync_events_emitted, 1);
  assert.ok(invoked.some(e => e.fn === 'publishTemplateLive'));
  assert.ok(invoked.some(e => e.fn === 'gptSyncEngine'));
  assert.ok(updates.some(e => e.site_url === 'https://preview.example.test'));
  assert.ok(!updates.some(e => e.status === 'live' || e.status === 'synced' || e.gpt_synced === true));
});

test('provider failure returns queued and never fabricates a LIVE URL', async () => {
  const { resp, updates } = await simulate('launch', 'throw');
  assert.equal(resp.body.failed, 1);
  assert.equal(resp.body.deployed, 0);
  assert.equal(resp.body.deployments_accepted, 0);
  assert.ok(updates.some(e => e.status === 'queued'));
  assert.ok(!updates.some(e => e.status === 'live' || e.site_url === 'https://guessed.invalid'));
});

test('success flag absent is rejected, not converted to fake live', async () => {
  const { resp, updates } = await simulate('launch', 'missing');
  assert.equal(resp.body.failed, 1);
  assert.equal(resp.body.awaiting_validation, 0);
  assert.ok(!updates.some(e => e.status === 'live'));
});

test('cron auto path also keeps accepted site awaiting independent validation', async () => {
  const { resp, updates } = await simulate('auto', 'accepted');
  assert.equal(resp.body.processed, 1);
  assert.equal(resp.body.awaiting_validation, 1);
  assert.equal(resp.body.deployed, 0);
  assert.equal(resp.body.synced, 0);
  assert.ok(!updates.some(e => e.status === 'live' || e.status === 'synced'));
});

test('anonymous access is rejected before any privileged service-role access', async () => {
  const { resp, privilegedReads } = await simulate('launch', 'accepted', null);
  assert.equal(resp.status, 401);
  assert.equal(privilegedReads, 0);
});

test('non-admin access is rejected before any privileged service-role access', async () => {
  const { resp, privilegedReads } = await simulate('launch', 'accepted', { role: 'user' });
  assert.equal(resp.status, 403);
  assert.equal(privilegedReads, 0);
});
