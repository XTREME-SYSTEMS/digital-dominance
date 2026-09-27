// Provider-independent evidence boundary. No credentials, network, LLM or clock reads.
// Live report names, schemas and unit rates MUST be supplied by a verified server contract.
export const PILOT_DOMAIN = 'epoxyquotenearme.com';
export const OPERATIONS = Object.freeze(['competitors', 'keywordGap', 'backlinks', 'rankings']);
export const LIMITS = Object.freeze({ competitors: 3, keywordGap: 10, backlinks: 10, rankings: 10 });
export const MAX_UNITS = 1000; // ceiling, NOT a Semrush rate estimate
export const PILOT_ID = 'semrush-pilot-v1'; // one durable account-level reservation; no scheduled refresh

const fail = (code) => { throw new Error(code); };
const integer = (n) => Number.isSafeInteger(n) && n >= 0;
export function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
}
export async function digest(value) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(value)));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}
function domain(value) {
  if (typeof value !== 'string' || value.length > 253 ||
      !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/.test(value)) fail('INVALID_DOMAIN');
  return value;
}
function url(value) {
  if (typeof value !== 'string' || value.length > 2048) fail('INVALID_URL');
  let parsed;
  try { parsed = new URL(value); } catch { fail('INVALID_URL'); }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) fail('INVALID_URL');
  domain(parsed.hostname);
  return parsed.href;
}
function keyword(value) {
  if (typeof value !== 'string' || !value.trim() || value.length > 200) fail('INVALID_KEYWORD');
  return value.trim().normalize('NFC');
}
function position(value) {
  if (!Number.isInteger(value) || value < 1 || value > 100) fail('INVALID_POSITION');
  return value;
}
function targetUrl(value) {
  const normalized = url(value);
  const host = new URL(normalized).hostname;
  if (host !== PILOT_DOMAIN && !host.endsWith('.' + PILOT_DOMAIN)) fail('TARGET_MISMATCH');
  return normalized;
}
export function normalizeRows(operation, rows) {
  if (!OPERATIONS.includes(operation) || !Array.isArray(rows) || rows.length > LIMITS[operation]) fail('INVALID_ROWS');
  const normalized = rows.map(r => {
    if (!r || typeof r !== 'object' || Array.isArray(r)) fail('INVALID_ROW');
    if (operation === 'competitors') {
      const competitor = domain(r.domain);
      if (competitor === PILOT_DOMAIN) fail('SELF_COMPETITOR');
      if (typeof r.overlap !== 'number' || !Number.isFinite(r.overlap) || r.overlap < 0 || r.overlap > 1) fail('INVALID_OVERLAP');
      return { domain: competitor, overlap: r.overlap };
    }
    if (operation === 'keywordGap') {
      if (r.targetPosition !== null) position(r.targetPosition);
      return { keyword: keyword(r.keyword), competitor: domain(r.competitor),
        competitorPosition: position(r.competitorPosition), targetPosition: r.targetPosition,
        absenceMeaning: 'not_observed_in_report_scope' };
    }
    if (operation === 'backlinks') {
      if (typeof r.lost !== 'boolean' || typeof r.nofollow !== 'boolean') fail('INVALID_LINK_FLAGS');
      return { sourceUrl: url(r.sourceUrl), targetUrl: targetUrl(r.targetUrl), lost: r.lost,
        nofollow: r.nofollow, validation: 'provider_observed_not_live_page_verified' };
    }
    if (!integer(r.volume)) fail('INVALID_VOLUME');
    return { keyword: keyword(r.keyword), position: position(r.position), volume: r.volume,
      url: targetUrl(r.url), source: 'semrush_estimate_not_search_console' };
  });
  // Locale-independent order; duplicate observations cannot increase evidence weight.
  return [...new Map(normalized.map(r => [canonical(r), r])).entries()]
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([, r]) => r);
}
export function planPilot(target = PILOT_DOMAIN) {
  if (target !== PILOT_DOMAIN) fail('DOMAIN_NOT_ALLOWED');
  return { version: 1, pilotId: PILOT_ID, domain: target, database: 'us',
    maxUnits: MAX_UNITS, maxCalls: 4, retries: 0, automaticRefresh: false,
    operations: OPERATIONS.map(operation => ({ operation, maxRows: LIMITS[operation] })),
    status: 'BLOCKED', reason: 'LIVE_CONTRACT_AND_UNIT_RATES_UNVERIFIED' };
}
// contract is trusted server configuration, never HTTP request input.
// Each fixed request must include the provider-side row cap (not a post-fetch slice).
function validateContract(contract, now) {
  if (!contract || contract.domain !== PILOT_DOMAIN || contract.database !== 'us' ||
      !Number.isFinite(now) || !Number.isFinite(contract.expiresAt) || contract.expiresAt <= now ||
      !/^[a-f0-9]{64}$/.test(contract.schemaHash || '') ||
      !/^[a-f0-9]{64}$/.test(contract.rateEvidenceHash || '') ||
      !integer(contract.availableUnits)) fail('UNVERIFIED_CONTRACT');
  if (!Array.isArray(contract.requests) || contract.requests.length !== 4) fail('INVALID_CONTRACT');
  let total = 0;
  for (let i = 0; i < 4; i++) {
    const r = contract.requests[i];
    if (r.operation !== OPERATIONS[i] || typeof r.report !== 'string' || !r.report ||
        !r.params || typeof r.params !== 'object' || Array.isArray(r.params) ||
        typeof r.limitParam !== 'string' || !Object.hasOwn(r.params, r.limitParam) ||
        r.params[r.limitParam] !== LIMITS[r.operation] ||
        !integer(r.maxUnits) || r.maxUnits < 1) fail('INVALID_CONTRACT');
    total += r.maxUnits;
  }
  if (!integer(total) || total > MAX_UNITS || total > contract.availableUnits) fail('UNIT_BUDGET_EXCEEDED');
  return total;
}
export function providerPayload(result) {
  if (result?.isError) fail('PROVIDER_ERROR');
  let payload = result?.structuredContent;
  const texts = result?.content?.filter(c => c.type === 'text') || [];
  for (const text of texts) {
    let parsed;
    try { parsed = JSON.parse(text.text); } catch { continue; }
    if (parsed?.code || parsed?.error) fail(parsed.code === 'no_api_units' ? 'NO_API_UNITS' : 'PROVIDER_ERROR');
    if (!payload) payload = parsed;
  }
  if (payload?.code || payload?.error) fail(payload.code === 'no_api_units' ? 'NO_API_UNITS' : 'PROVIDER_ERROR');
  if (!payload) fail('MALFORMED_PROVIDER_RESPONSE');
  return payload;
}
export async function collectPilot({ contract, now, executeReport, decode, ledger }) {
  // Reserve the entire worst-case cost BEFORE any provider call. Never refund uncertain usage.
  const units = validateContract(contract, now);
  if (typeof executeReport !== 'function' || typeof decode !== 'function' || !ledger) fail('MISSING_RUNTIME');
  const frozen = JSON.parse(canonical(contract));
  const contractHash = await digest(frozen);
  await ledger.reserve(PILOT_ID, { reservedUnits: units, contractHash });
  const observations = {};
  let calls = 0;
  try {
    for (const request of frozen.requests) {
      calls++;
      const controller = new AbortController();
      let timer;
      const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => { controller.abort(); reject(new Error('PROVIDER_TIMEOUT')); }, 15000);
      });
      let result;
      try {
        result = await Promise.race([executeReport({ report: request.report, params: request.params },
          { signal: controller.signal }), timeout]);
      } finally { clearTimeout(timer); }
      const payload = providerPayload(result);
      if (canonical(payload).length > 1000000) fail('RESPONSE_TOO_LARGE');
      const decoded = decode(request.operation, payload);
      // Decoder must explicitly identify an empty successful report. Errors are never empty data.
      if (decoded?.status !== 'OK') fail('REPORT_NOT_OK');
      observations[request.operation] = normalizeRows(request.operation, decoded.rows);
    }
    const snapshot = { version: 1, domain: PILOT_DOMAIN, database: 'us', observedAt: now,
      contractHash, observations, provenance: 'semrush', reservedUnits: units,
      actualUnits: null, coverage: 'bounded_sample', calls };
    const hash = await digest(snapshot);
    await ledger.finish(PILOT_ID, { status: 'COLLECTED', snapshot, hash });
    return { status: 'COLLECTED', snapshot, hash }; // not independently certified PASS
  } catch (error) {
    // Do not persist raw provider errors (may contain URLs, credentials, or private data).
    const safeCodes = ['NO_API_UNITS', 'PROVIDER_ERROR', 'PROVIDER_TIMEOUT', 'REPORT_NOT_OK',
      'MALFORMED_PROVIDER_RESPONSE', 'RESPONSE_TOO_LARGE'];
    const reason = safeCodes.includes(error?.message) ? error.message : 'INVALID_EVIDENCE_OR_STORAGE';
    await ledger.finish(PILOT_ID, { status: 'BLOCKED', reason, calls, reservedUnits: units });
    return { status: 'BLOCKED', reason, calls, reservedUnits: units };
  }
}
export async function rankingInputs(snapshot, expectedHash, now) {
  if (!snapshot || snapshot.version !== 1 || snapshot.domain !== PILOT_DOMAIN || snapshot.database !== 'us' ||
      !Number.isFinite(now) || !Number.isFinite(snapshot.observedAt) || now < snapshot.observedAt ||
      now - snapshot.observedAt > 86400000 || snapshot.provenance !== 'semrush' ||
      await digest(snapshot) !== expectedHash) fail('SNAPSHOT_REJECTED');
  for (const op of OPERATIONS) normalizeRows(op, snapshot.observations?.[op]);
  return { evidenceHash: expectedHash, domain: snapshot.domain, database: snapshot.database,
    rankings: normalizeRows('rankings', snapshot.observations.rankings),
    keywordGap: normalizeRows('keywordGap', snapshot.observations.keywordGap) };
}
