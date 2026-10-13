import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const functions = ['sendFollowUpEmail', 'sendEstimateEmail', 'crmFollowUpSender', 'sendReviewRequest'];
function fixture(name, lead) {
  const effects = [];
  const source = readFileSync(new URL(`base44/functions/${name}/entry.ts`, root), 'utf8')
    .replace(/^import .*;\n/gm, '').replace('export default async function', 'async function handler');
  const safety = readFileSync(new URL('base44/shared/leadEmailSafety.ts', root), 'utf8').replace('export function', 'function');
  const client = { asServiceRole: {
    entities: {
      Lead: { get: async () => lead, update: async () => effects.push('lead.update') },
      AppSettings: { list: async () => [{}] },
      EmailLog: { create: async () => effects.push('email.log') },
    },
    connectors: { getConnection: async () => { effects.push('gmail.connection'); return { accessToken: 'mock' }; } },
    integrations: { Core: { SendEmail: async () => { effects.push('email.send'); return {}; } } },
  } };
  const context = vm.createContext({
    Response, Uint8Array, console: { error() {} }, createClientFromRequest: () => client,
    GALLERY_IMAGES: [], buildMime: () => new Uint8Array(), base64Url: () => 'mock',
    buildFollowUp: () => '', followUpSubject: () => 'mock', estimateEmailHtml: () => '', estimateSubject: () => 'mock',
    buildReviewEmail: () => '', reviewSubject: () => 'mock', logStep: async () => effects.push('sop.log'),
    fetch: async (url, options) => {
      effects.push(options?.method === 'POST' ? 'email.send' : 'provider.fetch');
      return Response.json(url.endsWith('/profile') ? { emailAddress: 'sender@example.com' } : { id: 'mock-message' });
    },
  });
  vm.runInContext(stripTypeScriptTypes(safety + '\n' + source), context);
  return { effects, run: async overrides => {
    const response = await context.handler({ json: async () => ({ lead_id: 'mock-lead', stage: 'reminder', ...overrides }) });
    return { status: response.status, body: await response.json() };
  } };
}

for (const name of functions) {
  for (const classification of ['test_confirmed', 'test_likely']) test(`${name}: ${classification} blocks all outbound effects, including recipient override`, async () => {
    const f = fixture(name, { id: 'mock-lead', email: 'real@example.com', test_data_classification: classification, status: 'NEW ESTIMATE' });
    const result = await f.run({ to_email: 'override@example.com' });
    assert.equal(result.status, 200); assert.equal(result.body.sent, false);
    assert.equal(result.body.reason, 'nonproduction_lead'); assert.deepEqual(f.effects, []);
  });
  test(`${name}: reserved synthetic email blocks override when classification is missing`, async () => {
    const f = fixture(name, { email: ' Canary@digital-dominance.invalid ' });
    assert.equal((await f.run({ to_email: 'override@example.com' })).body.skipped, true);
    assert.deepEqual(f.effects, []);
  });
  test(`${name}: normal lead retains existing mocked email behavior`, async () => {
    const f = fixture(name, { id: 'mock-lead', email: 'person@example.com', test_data_classification: 'real_confirmed', status: 'NEW ESTIMATE' });
    const result = await f.run();
    assert.equal(result.status, 200); assert.equal(result.body.skipped, undefined);
    assert.ok(f.effects.includes('email.send'));
  });
}

for (const name of ['Immediate Lead Follow-Up', 'Lead Follow-Up', 'CRM Follow-Up Sequence', 'Review Request']) test(`${name}: trigger contains both test exclusions and preserves workflow steps`, () => {
  const workflow = JSON.parse(readFileSync(new URL(`base44/workflows/${name}.jsonc`, root), 'utf8'));
  assert.ok(workflow.trigger.condition.includes('.trigger.data.test_data_classification != "test_confirmed"'));
  assert.ok(workflow.trigger.condition.includes('.trigger.data.test_data_classification != "test_likely"'));
  assert.ok(workflow.definition.do.length > 0);
});

test('estimate preview renders test data without sending', async () => {
  const f = fixture('sendEstimateEmail', { email: 'canary@dd.invalid', test_data_classification: 'test_confirmed' });
  assert.equal((await f.run({ preview: true })).body.subject, 'mock');
  assert.deepEqual(f.effects, []);
});
