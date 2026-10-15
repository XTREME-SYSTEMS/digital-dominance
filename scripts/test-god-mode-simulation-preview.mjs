// No-network execution tests for the existing GOD MODE simulator's read-only
// deterministic preview. Validates 1,000 actual scenario evaluations and
// explicit blocking of ALL legacy DB-writing pathways.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../base44/functions/godModeSimulationEngine/entry.ts', import.meta.url), 'utf8');
const result = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  reportDiagnostics: true,
});
assert.equal(result.diagnostics.filter(d => d.category === ts.DiagnosticCategory.Error).length, 0);
assert.match(source, /action === "preview_simulation"/);
assert.match(source, /GOD_MODE_PERSISTENT_WRITE_ENABLED/);

function makeHarness(role = 'admin') {
  const calls = [];
  const sdk = {
    auth: { me: async () => ({ role }) },
    asServiceRole: new Proxy({}, {
      get: (_, name) => {
        calls.push(String(name));
        throw new Error('UNAUTHORIZED_SERVICE_ROLE_ACCESS');
      },
    }),
  };
  const module = { exports: {} };
  const context = {
    module, exports: module.exports,
    require: name => {
      if (name.startsWith('npm:@base44/sdk')) return { createClientFromRequest: () => sdk };
      if (name === 'base44:runtime') return { secrets: { get: () => undefined } };
      if (name.endsWith('/sopLog.ts')) return { logStep: async () => { throw new Error('LOG_SIDE_EFFECT'); } };
      throw Error('Unexpected dependency: ' + name);
    },
    Response: { json: (body, options) => ({ status: options?.status || 200, body }) },
  };
  new vm.Script(result.outputText).runInNewContext(context, { timeout: 2000 });
  const handler = module.exports.default;
  return {
    calls,
    request: body => ({ json: async () => body }),
    invoke: body => handler({ json: async () => body }),
  };
}

test('preview_simulation executes 1,000 reproducible synthetic cases without any database access', async () => {
  const h = makeHarness();
  const first = await h.invoke({ action: 'preview_simulation' });
  assert.equal(first.status, 200);
  assert.equal(first.body.state, 'SIMULATED_UNCALIBRATED');
  assert.equal(first.body.execution_mode, 'READ_ONLY');
  assert.equal(first.body.scenario_evaluations, 1000);
  assert.equal(first.body.total_seeded_draws, 20000);
  assert.equal(first.body.strategies.length, 10);
  assert.ok(first.body.strategies.every(s => s.scenarios === 100));
  assert.match(first.body.deterministic_fingerprint, /^[0-9a-f]{8}$/);
  assert.equal(h.calls.length, 0, 'zero service role/entity access');
  const second = await h.invoke({ action: 'preview_simulation' });
  assert.equal(second.status, 200);
  assert.equal(second.body.deterministic_fingerprint, first.body.deterministic_fingerprint);
  assert.deepEqual(JSON.parse(JSON.stringify(second.body.strategies)), JSON.parse(JSON.stringify(first.body.strategies)));
  assert.equal(h.calls.length, 0);
});

test('legacy ingest, simulate and full_pipeline actions fail closed without privileged server config', async () => {
  for (const action of ['ingest', 'simulate', 'full_pipeline']) {
    const h = makeHarness();
    const r = await h.invoke({ action });
    assert.equal(r.status, 403, action);
    assert.equal(r.body.status, 'BLOCKED');
    assert.equal(h.calls.length, 0);
  }
});

test('unknown and missing actions do not fall into a write path', async () => {
  const h = makeHarness();
  for (const body of [{}, { action: 'deploy' }, { action: 'write_memory' }]) {
    const r = await h.invoke(body);
    assert.equal(r.status, 400);
    assert.equal(h.calls.length, 0);
  }
});

test('non-admin cannot invoke deterministic preview', async () => {
  const h = makeHarness('viewer');
  const r = await h.invoke({ action: 'preview_simulation' });
  assert.equal(r.status, 403);
  assert.equal(h.calls.length, 0);
});
