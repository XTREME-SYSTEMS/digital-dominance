// Regression tests for the staging-only Base44 githubSync safety boundary.
// Run with: node --test scripts/test-github-sync-safety.mjs
// No network requests, credentials, production data or GitHub writes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const SOURCE = readFileSync(new URL('../base44/functions/githubSync/entry.ts', import.meta.url), 'utf8');
const transformed = ts.transpileModule(SOURCE, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  },
  reportDiagnostics: true,
});
assert.equal(transformed.diagnostics.filter(d => d.category === ts.DiagnosticCategory.Error).length, 0);
assert.doesNotMatch(SOURCE, /const branch\s*=\s*['"]main['"]/);
assert.match(SOURCE, /GITHUB_SYNC_WRITE_ENABLED/);
assert.match(SOURCE, /GITHUB_SYNC_TARGET_BRANCH/);
assert.match(SOURCE, /verifyUnprotectedExistingBranch/);
assert.match(SOURCE, /readback\.contentBase64 !== encoded/);

function makeHarness(overrides = {}) {
  const options = {
    role: 'admin',
    pages: [{ slug: 'epoxy-flooring', title: 'Epoxy' }],
    blocks: [{ name: 'estimate-form', type: 'js', content: 'export const ready=true;' }],
    target: 'feature/god-mode-commander-staging-20261013',
    enabled: false,
    repo: 'XTREME-SYSTEMS/digital-dominance',
    protected: false,
    ...overrides,
  };
  const calls = [];
  const objects = new Map();
  let count = 0;
  const fakeFetch = async (url, opts = {}) => {
    const method = opts.method || 'GET';
    calls.push({ method, url, body: opts.body ? JSON.parse(opts.body) : null });
    const json = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });
    if (String(url).includes('/branches/')) {
      return json({ name: options.target, protected: options.protected });
    }
    if (String(url).includes('/contents/')) {
      const path = String(url).split('/contents/')[1].split('?')[0];
      if (method === 'GET') {
        if (!objects.has(path)) return json({}, 404);
        const current = objects.get(path);
        return json({ sha: current.sha, content: current.content, encoding: 'base64' });
      }
      if (method === 'PUT') {
        const body = JSON.parse(opts.body);
        assert.equal(body.branch, options.target, 'wrong write branch');
        const sha = 'file-sha-' + (++count);
        objects.set(path, { sha, content: body.content });
        return json({ content: { sha }, commit: { sha: 'commit-' + count } });
      }
    }
    throw Error('Unexpected mocked network endpoint: ' + url);
  };
  const secretsMap = {
    GITHUB_SYNC_TARGET_BRANCH: options.target,
    GITHUB_SYNC_WRITE_ENABLED: options.enabled ? 'true' : 'false',
    GITHUB_REPO: options.repo,
    GITHUB_TOKEN: 'mock-value-not-a-real-token',
  };
  const base44 = {
    auth: { me: async () => ({ role: options.role }) },
    asServiceRole: {
      entities: {
        DynamicPage: { list: async () => options.pages },
        CodeBlock: { list: async () => options.blocks },
      },
    },
  };
  const module = { exports: {} };
  const sandbox = {
    module,
    exports: module.exports,
    require: name => {
      if (name.startsWith('npm:@base44/sdk')) return { createClientFromRequest: () => base44 };
      if (name === 'base44:runtime') return { secrets: { get: key => secretsMap[key] } };
      throw Error('Unexpected module: ' + name);
    },
    fetch: fakeFetch,
    Response: { json: (body, init) => ({ status: init?.status ?? 200, body }) },
    AbortSignal: { timeout: () => ({}) },
    TextEncoder, String, Set, btoa,
  };
  new vm.Script(transformed.outputText).runInNewContext(sandbox, { timeout: 5000 });
  const handler = module.exports.default;
  return { calls, objects, handler, options, secretsMap, request: body => ({ json: async () => body }) };
}

test('default preview is read-only without any GitHub calls', async () => {
  const h = makeHarness();
  const result = await h.handler(h.request({}));
  assert.equal(result.status, 200);
  assert.equal(result.body.action, 'preview');
  assert.equal(result.body.write_enabled, false);
  assert.equal(result.body.files_planned, 3);
  assert.equal(h.calls.length, 0);
});

test('explicit apply is blocked with server write gate disabled', async () => {
  const h = makeHarness();
  const result = await h.handler(h.request({ action: 'apply', target_branch: h.options.target, ack_branch_only: true }));
  assert.equal(result.status, 403);
  assert.equal(h.calls.length, 0);
});

test('main and protected-looking branches never receive a write', async () => {
  for (const target of ['main', 'master', 'production', 'release/prod', 'feature/../main', 'feature//evil', 'feature/main/../evil']) {
    const h = makeHarness({ enabled: true, target });
    const result = await h.handler(h.request({ action: 'apply', target_branch: target, ack_branch_only: true }));
    assert.equal(result.status, 403, target);
    assert.equal(h.calls.length, 0, target);
  }
});

test('client branch cannot override server-pinned branch', async () => {
  const h = makeHarness({ enabled: true });
  const result = await h.handler(h.request({ action: 'apply', target_branch: 'feature/attacker', ack_branch_only: true }));
  assert.equal(result.status, 403);
  assert.equal(h.calls.length, 0);
});

test('wrong server-side repo is rejected', async () => {
  const h = makeHarness({ enabled: true, repo: 'another/repository' });
  const result = await h.handler(h.request({ action: 'apply', target_branch: h.options.target, ack_branch_only: true }));
  assert.equal(result.status, 403);
  assert.equal(h.calls.length, 0);
});

test('protected existing branch fails before PUT', async () => {
  const h = makeHarness({ enabled: true, protected: true });
  const result = await h.handler(h.request({ action: 'apply', target_branch: h.options.target, ack_branch_only: true }));
  assert.equal(result.status, 500);
  assert.equal(h.calls.some(x => x.method === 'PUT'), false);
});

test('read-back succeeds on permitted feature branch and replay is idempotent', async () => {
  const h = makeHarness({ enabled: true });
  const req = h.request({ action: 'apply', target_branch: h.options.target, ack_branch_only: true });
  const first = await h.handler(req);
  assert.equal(first.status, 200);
  assert.equal(first.body.status, 'BRANCH_ONLY_COMPLETE');
  assert.equal(h.calls.filter(x => x.method === 'PUT').length, 3);
  assert.equal(h.calls.some(x => x.body?.branch === 'main'), false);
  const replay = await h.handler(req);
  assert.equal(replay.status, 200);
  assert.equal(h.calls.filter(x => x.method === 'PUT').length, 3);
  assert.equal(replay.body.results.filter(x => x.state === 'unchanged').length, 3);
});

test('bad path, dangerous payload and duplicate output path fail closed', async () => {
  const sets = [
    { pages: [{ slug: '../secrets' }] },
    { blocks: [{ name: 'valid', type: 'js', content: 'key=ghp_ABCDEFGHIJKLMNOPQRSTUV123' }] },
    { pages: [{ slug: 'same' }, { slug: 'same' }] },
  ];
  for (const change of sets) {
    const h = makeHarness({ enabled: true, ...change });
    const result = await h.handler(h.request({ action: 'apply', target_branch: h.options.target, ack_branch_only: true }));
    assert.equal(result.status, 500);
    assert.equal(h.calls.length, 0);
  }
});

test('non-admin cannot preview or apply', async () => {
  const h = makeHarness({ enabled: true, role: 'viewer' });
  const result = await h.handler(h.request({}));
  assert.equal(result.status, 403);
  assert.equal(h.calls.length, 0);
});
