import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';

function load(path, globals = {}) {
  let source = readFileSync(new URL('../' + path, import.meta.url), 'utf8');
  source = source.replace(/^import .*;\n/gm, '').replace('export default async function', 'async function handler');
  const context = vm.createContext({ Response, URL, console: { log() {}, error() {} }, ...globals });
  vm.runInContext(stripTypeScriptTypes(source), context);
  return context;
}

function fixture({ capability = false, proof, deployError = false, auto = false } = {}) {
  const writes = [], calls = [];
  const site = { id: 'site-1', domain: 'fictional.example', target_city: 'Synthetic', target_state: 'FL' };
  const batch = { id: 'batch-record', batch_id: 'batch-test', queue_item_ids: ['site-1'], total_sites: 1, template_key: 'epoxy', google_sync_enabled: true };
  const svc = { entities: {
    MassLaunchBatch: { filter: async () => [batch], update: async (id, value) => writes.push({ entity: 'batch', id, value }) },
    WebsiteQueue: { filter: async () => [site], update: async (id, value) => writes.push({ entity: 'site', id, value }) },
    SiteValidationReceipt: { create: async value => { writes.push({ entity: 'receipt', value }); return { id: 'failure-receipt' }; } },
  } };
  const base44 = {
    auth: { me: async () => ({ id: 'operator', role: 'admin' }) }, asServiceRole: svc,
    functions: { invoke: async (name, body) => {
      calls.push({ name, body });
      if (body.action === 'capabilities') return { data: { per_site_deploy: capability } };
      if (name === 'vercelDeploy') { if (deployError) throw new Error('provider timeout'); return { data: proof }; }
      throw new Error('unexpected downstream call: ' + name);
    } },
    integrations: { Core: { InvokeLLM: async () => { calls.push({ name: 'LLM' }); return { title: 'Synthetic' }; } } },
  };
  const module = load('base44/functions/massLaunchOrchestrator/entry.ts', { createClientFromRequest: () => base44, waitUntil: () => { throw new Error('unexpected background work'); } });
  return { ...module, writes, calls, run: () => module.handler(new Request('https://local.invalid', { method: 'POST', body: JSON.stringify(auto ? { mode: 'auto' } : { continueBatchId: 'batch-test' }) })) };
}

test('incompatible exporter blocks before entity writes or model calls', async () => {
  const f = fixture(); const r = await f.run();
  assert.equal(r.status, 409); assert.equal((await r.json()).deployed, 0);
  assert.equal(f.writes.length, 0); assert.equal(f.calls.length, 1);
});
for (const [name, options] of [
  ['provider exception', { deployError: true }],
  ['queued acceptance', { proof: { success: true, ready_state: 'QUEUED', deployment_id: 'dpl_test', url: 'https://site.vercel.app', site_id: 'site-1' } }],
  ['legacy success URL', { proof: { success: true, url: 'https://site.vercel.app' } }],
  ['wrong site identity', { proof: { success: true, ready_state: 'READY', deployment_id: 'dpl_test', url: 'https://site.vercel.app', site_id: 'different' } }],
]) test(name + ' is never counted deployed/live/validated', async () => {
  const f = fixture({ capability: true, ...options }); const r = await f.run(); const body = await r.json();
  assert.equal(body.deployed, 0); assert.equal(body.validated, 0); assert.equal(body.failed, 1);
  assert.ok(f.writes.some(w => w.entity === 'site' && w.value.status === 'archived'));
  assert.ok(!f.writes.some(w => ['live', 'monitoring', 'complete'].includes(w.value.status)));
  assert.ok(!f.writes.some(w => w.entity === 'receipt'));
});
test('READY proof records exact deployment but no invented QA or indexing', async () => {
  const f = fixture({ capability: true, auto: true, proof: { success: true, ready_state: 'READY', deployment_id: 'dpl_test', url: 'https://site.vercel.app', site_id: 'site-1' } });
  const body = await (await f.run()).json();
  assert.equal(body.deployed, 1); assert.equal(body.validated, 0);
  const receipt = f.writes.find(w => w.entity === 'receipt').value;
  assert.equal(receipt.deployment_id, 'dpl_test'); assert.equal(receipt.overall_pass, false);
  assert.equal(Object.hasOwn(receipt, 'http_status'), false);
  assert.equal(Object.hasOwn(receipt, 'mobile_viewport_ok'), false);
  assert.equal(Object.hasOwn(receipt, 'tls_valid'), false);
  assert.ok(!f.calls.some(c => /Google|Index|Sitemap|Optimizer|Swarm/.test(c.name)));
});
test('production Code Studio exporter reports incompatibility without reading secrets', async () => {
  const f = load('base44/functions/vercelDeploy/entry.ts', {
    createClientFromRequest: () => ({ auth: { me: async () => ({ role: 'admin' }) } }),
    secrets: { get: () => { throw new Error('secret access forbidden in preflight'); } },
    fetch: () => { throw new Error('provider mutation forbidden'); },
  });
  const invoke = body => f.handler(new Request('https://local.invalid', { method: 'POST', body: JSON.stringify(body) }));
  assert.equal((await (await invoke({ action: 'capabilities' })).json()).per_site_deploy, false);
  assert.equal((await invoke({ content: {}, site_id: 'site-1' })).status, 409);
});
test('URL injection and custom-domain fallback fail provider URL gate', () => {
  const f = fixture();
  for (const url of ['http://site.vercel.app', 'https://fictional.example', 'https://user:password@site.vercel.app', 'https://site.vercel.app/?token=bad']) {
    assert.throws(() => f.requireDeploymentProof({ success: true, ready_state: 'READY', deployment_id: 'dpl_test', site_id: 'site-1', url }, 'site-1'));
  }
});

test('Code Studio export uses static build outputs and reports only acceptance', async () => {
  let request;
  const f = load('base44/functions/vercelDeploy/entry.ts', {
    createClientFromRequest: () => ({
      auth: { me: async () => ({ role: 'admin' }) },
      asServiceRole: { entities: {
        DynamicPage: { filter: async () => [{ slug: 'example', title: 'Sample', sections: [] }] },
        CodeBlock: { filter: async () => [] },
      } },
    }),
    secrets: { get: () => 'test-provider-reference' },
    fetch: async (_url, options) => {
      request = JSON.parse(options.body);
      return Response.json({ id: 'dpl_test', url: 'sample.vercel.app', readyState: 'QUEUED' });
    },
  });
  const result = await (await f.handler(new Request('https://local.invalid', { method: 'POST', body: '{}' }))).json();
  const config = JSON.parse(request.files.find(file => file.file === 'vercel.json').data);
  assert.deepEqual(config.builds, [{ src: '**/*.html', use: '@vercel/static' }]);
  assert.equal(result.success, false); assert.equal(result.accepted, true);
  assert.equal(result.ready_state, 'QUEUED'); assert.equal(result.validation_status, 'UNKNOWN');
});
