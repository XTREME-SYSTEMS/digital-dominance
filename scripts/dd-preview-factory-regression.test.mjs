import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script, createContext } from 'node:vm';
import test from 'node:test';
import { compileSitePreview } from '../base44/shared/sitePreviewCompiler.js';

const compilerInput = {
  siteId: 'synthetic-001', city: 'Pompano Beach', state: 'FL',
  templateKey: 'epoxy_flooring', designKey: 'signature',
  content: {
    intro: 'Compare garage-floor preparation choices.',
    services: [{ name: 'Surface assessment', description: 'Learn what affects planning.' }],
  },
};

test('site compiler binds location, template, original design and NOINDEX without fake lead action', () => {
  const { html, manifest } = compileSitePreview(compilerInput);
  assert.match(html, /name="robots" content="noindex/);
  assert.match(html, /data-dd-site-id="synthetic-001"/);
  assert.match(html, /rel="icon"/);
  assert.match(html, /Pompano Beach/);
  assert.match(html, /Surface assessment/);
  assert.match(html, /Lead submissions are not connected/);
  assert.equal(manifest.release_state, 'PREVIEW_ONLY');
  assert.equal(manifest.lead_capture, 'NOT_CONNECTED');
});

test('site compiler isolates sites and escapes AI-provided HTML', () => {
  const a = compileSitePreview(compilerInput).html;
  const b = compileSitePreview({ ...compilerInput,
    siteId: 'synthetic-002', city: 'Boca Raton',
    content: { intro: '<script>alert(1)</script>' },
  }).html;
  assert.notEqual(a, b);
  assert.doesNotMatch(b, /<script>alert/);
  assert.match(b, /&lt;script&gt;alert/);
  assert.match(b, /Boca Raton/);
  assert.doesNotMatch(b, /synthetic-001/);
});

test('invalid industry or missing site identity fails closed', () => {
  assert.throws(() => compileSitePreview({ ...compilerInput, templateKey: 'unsupported_magic' }), /Unsupported industry/);
  assert.throws(() => compileSitePreview({ ...compilerInput, city: '' }), /Invalid city/);
  assert.throws(() => compileSitePreview({ ...compilerInput, siteId: '' }), /Invalid siteId/);
});

test('ten existing visual designs can compile from the same approved stock library', () => {
  const a = compileSitePreview({ ...compilerInput, designKey: 'signature' });
  const b = compileSitePreview({ ...compilerInput, designKey: 'immersive' });
  assert.notEqual(a.html, b.html);
  assert.equal(b.manifest.design_key, 'immersive');
});

const massSource = readFileSync(new URL('../base44/functions/massLaunchOrchestrator/entry.ts', import.meta.url), 'utf8');
const deploySource = readFileSync(new URL('../base44/functions/vercelDeploy/entry.ts', import.meta.url), 'utf8');

test('site adapter sends only noindex preview deployments, not production-target or guessed hostnames', () => {
  const sitePath = deploySource.split("if (payload.mode === 'site_preview') {")[1]?.split('    const svc =')[0] || '';
  assert.ok(sitePath.length > 1000);
  assert.match(sitePath, /X-Robots-Tag/);
  assert.match(sitePath, /compileSitePreview\(payload\)/);
  assert.match(sitePath, /deployment_id: deployment.id/);
  assert.doesNotMatch(sitePath, /target:\s*['"]production['"]/);
  assert.doesNotMatch(sitePath, /alias:\s*\[/);
  assert.match(sitePath, /accepted_pending_independent_validation/);
});

test('mass launcher contains no fabricated 200, live, indexing or scorer claims', () => {
  assert.doesNotMatch(massSource, /status:\s*'live'/);
  assert.doesNotMatch(massSource, /http_status:\s*hasUrl \? 200/);
  assert.doesNotMatch(massSource, /runGoogleSyncAsync\(/);
  assert.doesNotMatch(massSource, /runValidation\(/);
  assert.match(massSource, /mode:\s*'site_preview'/);
  assert.match(massSource, /release_ready:\s*false/);
  assert.match(massSource, /INDEPENDENT_VALIDATION_PENDING/);
});

function makeHarness({ mode = 'new', receiptSuccess = true, userRole = 'admin', siteStatus = 'queued' } = {}) {
  const sites = new Map();
  const updates = [];
  const receipts = [];
  const batch = {
    id: 'batch-record-1', batch_id: 'batch-1', queue_item_ids: ['site-1'],
    status: 'orchestrating', template_key: 'epoxy_flooring',
    template_name: 'Epoxy Flooring', domain_base: 'example.test',
    selected_cities: [{ city: 'Pompano Beach', state: 'FL' }], total_sites: 1,
  };
  if (mode !== 'new') sites.set('site-1', {
    id: 'site-1', status: siteStatus, target_city: 'Pompano Beach',
    target_state: 'FL', domain: 'synthetic.example.test', notes: 'synthetic',
  });
  const service = { entities: {
    MassLaunchBatch: {
      filter: async () => ({ items: mode === 'new' ? [] : [batch] }),
      create: async (item) => { Object.assign(batch, item); return batch; },
      update: async (id, patch) => { Object.assign(batch, patch); return batch; },
    },
    WebsiteQueue: {
      filter: async (query) => ({ items: [...sites.values()].filter((site) =>
        (!query?.status || site.status === query.status) &&
        (!query?.id?.$in || query.id.$in.includes(site.id))) }),
      bulkCreate: async (items) => {
        const created = items.map((item, index) => ({ id: 'site-' + (index + 1), ...item }));
        for (const item of created) sites.set(item.id, item);
        return { records: created };
      },
      update: async (id, patch) => {
        const item = sites.get(id);
        Object.assign(item, patch);
        updates.push({ id, ...patch });
        return item;
      },
    },
    SiteValidationReceipt: {
      create: async (item) => { receipts.push(item); return { id: 'receipt-' + receipts.length }; },
    },
  } };
  const invoke = async (name) => name === 'vercelDeploy'
    ? { data: receiptSuccess
        ? { success: true, preview_only: true, deployment_id: 'dpl_synthetic123',
            url: 'https://synthetic-epoxy-abc.vercel.app' }
        : { success: false, preview_only: true } }
    : { data: null };
  const client = {
    auth: { me: async () => userRole ? { id: 'operator-1', role: userRole } : null },
    asServiceRole: service,
    functions: { invoke },
    integrations: { Core: { InvokeLLM: async () => ({
      title: 'Surface preparation guide', intro: 'Sample', services: [], faqs: [],
    }) } },
  };
  const script = massSource
    .replace(/^import .*;\s*$/gm, '')
    .replace('export default async function(req)', 'globalThis.__handler = async function(req)');
  const context = createContext({ createClientFromRequest: () => client, Response, console, URL,
    Promise, Date, Math, Set, String });
  new Script(script).runInContext(context);
  return {
    run: async (body) => {
      const response = await context.__handler({ json: async () => body });
      return { http: response.status, body: await response.json() };
    },
    sites, updates, receipts, batch,
  };
}

test('isolated synthetic site gets ONLY accepted/deploying and false QA receipt', async () => {
  const h = makeHarness();
  const r = await h.run({
    templateKey: 'epoxy_flooring', designKey: 'signature',
    locations: [{ city: 'Pompano Beach', state: 'FL' }],
    maxParallel: 1,
  });
  assert.equal(r.http, 200);
  assert.equal(r.body.accepted, 1);
  assert.equal(r.body.deployed, 0);
  assert.equal(r.body.validated, 0);
  assert.equal(r.body.release_ready, false);
  assert.equal(h.sites.get('site-1').status, 'deploying');
  assert.equal(h.receipts[0].overall_pass, false);
  assert.equal(h.receipts[0].deployment_id, 'dpl_synthetic123');
  assert.equal(h.updates.some((x) => x.status === 'live'), false);
});

test('failed Vercel acceptance requeues work and cannot mark it live', async () => {
  const h = makeHarness({ receiptSuccess: false });
  const r = await h.run({ templateKey: 'epoxy_flooring',
    locations: [{ city: 'Pompano Beach', state: 'FL' }] });
  assert.equal(r.body.accepted, 0);
  assert.equal(r.body.failed, 1);
  assert.equal(r.body.deployed, 0);
  assert.equal(h.sites.get('site-1').status, 'queued');
  assert.equal(h.receipts.length, 0);
});

test('auto mode resumes an existing batch rather than recreating it', async () => {
  const h = makeHarness({ mode: 'existing' });
  const r = await h.run({ mode: 'auto', maxParallel: 1 });
  assert.equal(r.http, 200);
  assert.equal(r.body.accepted, 1);
  assert.equal(h.sites.get('site-1').status, 'deploying');
});

test('no pending sites remains pending independent validation', async () => {
  const h = makeHarness({ mode: 'existing', siteStatus: 'deploying' });
  const r = await h.run({ mode: 'auto' });
  assert.equal(r.http, 200);
  assert.equal(r.body.status, 'awaiting_independent_validation');
  assert.equal(r.body.release_ready, false);
});

test('unknown industry cannot be silently relabeled as epoxy', async () => {
  const h = makeHarness();
  const r = await h.run({ templateKey: 'legal', locations: [{ city: 'Miami', state: 'FL' }] });
  assert.equal(r.http, 422);
  assert.equal(h.sites.size, 0);
});
