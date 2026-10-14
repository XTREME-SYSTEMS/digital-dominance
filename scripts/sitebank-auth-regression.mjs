// SiteBank authorization regression: runs offline with a stub Base44 client.
// It proves denial happens before privileged service-role access.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const source = readFileSync(new URL('../base44/functions/siteBankOrchestrator/entry.ts', import.meta.url), 'utf8');
const withoutSdkImport = source.replace(
  /^import .*createClientFromRequest.*;\s*$/m,
  'const createClientFromRequest = req => globalThis.__client(req);',
);
assert.notEqual(withoutSdkImport, source, 'Expected SDK import is present');
const transpiled = ts.transpileModule(withoutSdkImport, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  reportDiagnostics: true,
});
assert.equal((transpiled.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error).length, 0);

async function callAs(actor, shouldThrow = false, action = 'getStats') {
  let privilegedReads = 0;
  const module = { exports: {} };
  const stubClient = {
    auth: { me: async () => actor },
    get asServiceRole() {
      privilegedReads++;
      return { entities: { SiteBank: { filter: async () => {
        if (shouldThrow) throw new Error('NEVER_EXPOSE_INTERNAL_STACK');
        return [];
      } } } };
    },
  };
  const context = {
    module, exports: module.exports, Date, Set, Object, Math,
    console: { error() {} },
    Response: { json: (body, options = {}) => ({ status: options.status || 200, body }) },
    __client: () => stubClient,
  };
  context.globalThis = context;
  vm.runInNewContext(transpiled.outputText, context, { timeout: 2000 });
  const response = await module.exports.default({ json: async () => ({ action }) });
  return { response, privilegedReads };
}

// Every handler must deny unauthenticated and non-admin callers before
// acquiring a privileged Base44 service-role client.
const guardedActions = ['launchBatch', 'buildBacklinks', 'syncToGpt', 'getStats', 'listSites', 'addTags'];
for (const action of guardedActions) {
  const anonymous = await callAs(null, false, action);
  assert.equal(anonymous.response.status, 401, `${action}: anonymous denied`);
  assert.equal(anonymous.privilegedReads, 0, `${action}: anonymous no service-role reads`);

  const nonAdmin = await callAs({ role: 'user' }, false, action);
  assert.equal(nonAdmin.response.status, 403, `${action}: non-admin denied`);
  assert.equal(nonAdmin.privilegedReads, 0, `${action}: non-admin no service-role reads`);
}

const admin = await callAs({ role: 'admin' });
assert.equal(admin.response.status, 200);
assert.equal(admin.response.body.stats.total_sites, 0);
assert.equal(admin.privilegedReads, 1);

const internalError = await callAs({ role: 'admin' }, true);
assert.equal(internalError.response.status, 500);
assert.equal(internalError.response.body.error, 'Internal server error');
assert.equal(JSON.stringify(internalError.response).includes('NEVER_EXPOSE_INTERNAL_STACK'), false);
assert.equal(Object.hasOwn(internalError.response.body, 'stack'), false);
console.log(`PASS SiteBank authorization regression (${guardedActions.length * 2 + 2}/${guardedActions.length * 2 + 2} cases)`);
