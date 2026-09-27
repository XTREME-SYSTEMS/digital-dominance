import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildParitySnapshot, summarizeParity } from '../base44/shared/seoParity.mjs';

const NOW = Date.parse('2026-09-27T18:30:00Z');
const fresh = new Date(NOW - 60 * 60 * 1000).toISOString();
const stale = new Date(NOW - 8 * 24 * 60 * 60 * 1000).toISOString();

function baseInput() {
  return {
    domain: 'epoxyquotenearme.com',
    now: NOW,
    gscPages: [
      { route: '/', snapshot: { snapshot_at: fresh, impressions: 100, clicks: 10, ctr: 0.1, avg_position: 8,
        top_queries: [
          { query: 'epoxy floor', impressions: 70, clicks: 8, position: 7 },
          { query: 'garage epoxy', impressions: 30, clicks: 2, position: 12 },
        ] } },
      { route: '/florida/pompano-beach', snapshot: { snapshot_at: fresh, impressions: 50, clicks: 5, ctr: 0.1, avg_position: 9,
        top_queries: [
          { query: 'epoxy floor', impressions: 20, clicks: 1, position: 10 },
          { query: 'epoxy pompano', impressions: 30, clicks: 4, position: 6 },
        ] } },
    ],
    ga4: { sessions: 120, users: 95, bounce_rate: 0.42, avg_session_duration: 87, page_views: 220, engagement_rate: 58.2 },
    technical: { score: 92, issues: [{ severity: 'medium', issue: 'Few internal links' }] },
    cwv: { perfScore: 94, metrics: { lcp: '1.8 s', cls: '0.03', fcp: '1.1 s' } },
    competitors: [
      { name: 'Direct Rival', url: 'https://rival.example/', source: 'direct_fetch' },
      { name: 'LLM Rival', url: 'https://llm.example/', source: 'llm_research' },
    ],
    backlinks: [
      { sourceUrl: 'https://directory.example/listing', targetUrl: 'https://epoxyquotenearme.com/', source: 'direct_fetch', lost: false, nofollow: false },
      { sourceUrl: 'https://candidate.example/', targetUrl: 'https://epoxyquotenearme.com/', source: 'llm_research', lost: false, nofollow: false },
    ],
    semrush: { status: 'BLOCKED', reason: 'NO_API_UNITS' },
  };
}

test('owned fresh data verifies rank tracking, traffic and technical audit without Semrush', () => {
  const snap = buildParitySnapshot(baseInput());
  assert.equal(snap.capabilities.positionTracking.status, 'VERIFIED');
  assert.equal(snap.capabilities.trafficOverview.status, 'VERIFIED');
  assert.equal(snap.capabilities.siteAudit.status, 'VERIFIED');
  assert.equal(snap.capabilities.semrushVerifier.status, 'BLOCKED');
  assert.equal(snap.capabilities.domainOverview.status, 'VERIFIED');
});

test('organic query aggregation is deterministic and does not double count duplicate keywords', () => {
  const a = buildParitySnapshot(baseInput());
  const bInput = baseInput();
  bInput.gscPages.reverse();
  const b = buildParitySnapshot(bInput);
  assert.deepEqual(a.capabilities.organicResearch.rows, b.capabilities.organicResearch.rows);
  const epoxy = a.capabilities.organicResearch.rows.find(x => x.keyword === 'epoxy floor');
  assert.equal(epoxy.impressions, 90);
  assert.equal(epoxy.clicks, 9);
  assert.equal(epoxy.position, 7.67);
});

test('stale GSC cannot be marked verified rank evidence', () => {
  const input = baseInput();
  input.gscPages = input.gscPages.map(p => ({ ...p, snapshot: { ...p.snapshot, snapshot_at: stale } }));
  const snap = buildParitySnapshot(input);
  assert.equal(snap.capabilities.positionTracking.status, 'BLOCKED');
  assert.equal(snap.capabilities.organicResearch.status, 'BLOCKED');
});

test('LLM competitor and backlink evidence remains partial', () => {
  const snap = buildParitySnapshot(baseInput());
  assert.equal(snap.capabilities.competitorsResearch.status, 'PARTIAL');
  assert.equal(snap.capabilities.backlinksResearch.status, 'PARTIAL');
  assert.equal(snap.capabilities.competitorsResearch.rows.find(x => x.name === 'LLM Rival').evidence, 'INFERRED');
});

test('direct-only competitor evidence can be verified', () => {
  const input = baseInput();
  input.competitors = input.competitors.filter(x => x.source === 'direct_fetch');
  input.backlinks = input.backlinks.filter(x => x.source === 'direct_fetch');
  const snap = buildParitySnapshot(input);
  assert.equal(snap.capabilities.competitorsResearch.status, 'VERIFIED');
  assert.equal(snap.capabilities.backlinksResearch.status, 'VERIFIED');
});

test('missing sources stay null/blocked instead of fabricating zeros', () => {
  const snap = buildParitySnapshot({ domain: 'epoxyquotenearme.com', now: NOW, gscPages: [], competitors: [], backlinks: [] });
  assert.equal(snap.capabilities.trafficOverview.status, 'BLOCKED');
  assert.equal(snap.capabilities.trafficOverview.metrics.sessions, null);
  assert.equal(snap.capabilities.siteAudit.status, 'BLOCKED');
  assert.equal(snap.capabilities.keywordResearch.status, 'BLOCKED');
  assert.equal(snap.capabilities.domainOverview.metrics.sessions, null);
});

test('keyword research is partial even with GSC because market demand/volume is not owned evidence', () => {
  const snap = buildParitySnapshot(baseInput());
  assert.equal(snap.capabilities.keywordResearch.status, 'PARTIAL');
  assert.match(snap.capabilities.keywordResearch.reason, /market/i);
});

test('summary counts statuses exactly once', () => {
  const summary = summarizeParity(buildParitySnapshot(baseInput()));
  assert.equal(summary.total, 8);
  assert.equal(summary.verified + summary.partial + summary.blocked, 8);
  assert.ok(summary.verified >= 3);
  assert.equal(summary.semrushVerifier.status, 'BLOCKED');
});


test('seoGenerator exposes the semrushParity runtime contract', async () => {
  const source = await readFile(new URL('../base44/functions/seoGenerator/entry.ts', import.meta.url), 'utf8');
  assert.match(source, /buildParitySnapshot/);
  assert.match(source, /case 'semrushParity':/);
  assert.match(source, /paidSemrushCalls:\s*0/);
  assert.match(source, /refreshSources === true/);
});


test('empty GA object and null metrics do not become verified zero traffic', () => {
  const input = baseInput();
  input.ga4 = { sessions: null, users: null };
  const snap = buildParitySnapshot(input);
  assert.equal(snap.capabilities.trafficOverview.status, 'BLOCKED');
  assert.equal(snap.capabilities.trafficOverview.metrics.sessions, null);
  assert.equal(snap.capabilities.trafficOverview.metrics.users, null);
});
