const FRESH_GSC_MS = 72 * 60 * 60 * 1000;
const VERIFIED_SOURCES = new Set(['direct_fetch', 'semrush']);

const n = (value) => value === null || value === undefined || value === '' ? null : (Number.isFinite(Number(value)) ? Number(value) : null);
const round2 = (value) => value === null ? null : Math.round(value * 100) / 100;

function normalizeDomain(value) {
  if (typeof value !== 'string') throw new Error('INVALID_DOMAIN');
  const v = value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (!/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/.test(v)) throw new Error('INVALID_DOMAIN');
  return v;
}

function freshTimestamp(value, now) {
  const ts = Date.parse(value || '');
  return Number.isFinite(ts) && ts <= now && now - ts <= FRESH_GSC_MS;
}

function gscEvidence(gscPages, now) {
  const pages = Array.isArray(gscPages) ? gscPages : [];
  const freshPages = pages.filter(p => p?.snapshot && freshTimestamp(p.snapshot.snapshot_at, now));
  const queryMap = new Map();
  let impressions = 0;
  let clicks = 0;
  let weightedPagePosition = 0;

  for (const page of freshPages) {
    const snapshot = page.snapshot || {};
    const pageImpressions = Math.max(0, n(snapshot.impressions) ?? 0);
    const pageClicks = Math.max(0, n(snapshot.clicks) ?? 0);
    const pagePosition = n(snapshot.avg_position);
    impressions += pageImpressions;
    clicks += pageClicks;
    if (pagePosition !== null) weightedPagePosition += pagePosition * pageImpressions;

    for (const q of Array.isArray(snapshot.top_queries) ? snapshot.top_queries : []) {
      const keyword = typeof q?.query === 'string' ? q.query.trim().normalize('NFC') : '';
      if (!keyword) continue;
      const qi = Math.max(0, n(q.impressions) ?? 0);
      const qc = Math.max(0, n(q.clicks) ?? 0);
      const qp = n(q.position);
      const current = queryMap.get(keyword) || { keyword, impressions: 0, clicks: 0, weightedPosition: 0, positionWeight: 0 };
      current.impressions += qi;
      current.clicks += qc;
      if (qp !== null && qi > 0) {
        current.weightedPosition += qp * qi;
        current.positionWeight += qi;
      }
      queryMap.set(keyword, current);
    }
  }

  const rows = [...queryMap.values()].map(q => ({
    keyword: q.keyword,
    impressions: q.impressions,
    clicks: q.clicks,
    ctr: q.impressions > 0 ? round2(q.clicks / q.impressions) : null,
    position: q.positionWeight > 0 ? round2(q.weightedPosition / q.positionWeight) : null,
    source: 'google_search_console',
  })).sort((a, b) => a.keyword.localeCompare(b.keyword));

  return {
    available: freshPages.length > 0,
    freshPages: freshPages.length,
    rows,
    metrics: {
      impressions: freshPages.length ? impressions : null,
      clicks: freshPages.length ? clicks : null,
      ctr: impressions > 0 ? round2(clicks / impressions) : null,
      avg_position: impressions > 0 ? round2(weightedPagePosition / impressions) : null,
    },
  };
}

function evidenceRows(rows, kind) {
  const input = Array.isArray(rows) ? rows : [];
  return input.map(row => {
    const source = row?.source || 'unknown';
    const evidence = VERIFIED_SOURCES.has(source) ? 'VERIFIED' : 'INFERRED';
    if (kind === 'competitor') {
      return { name: row?.name || row?.competitor_name || row?.domain || null, url: row?.url || null, source, evidence };
    }
    return {
      sourceUrl: row?.sourceUrl || row?.url || null,
      targetUrl: row?.targetUrl || null,
      lost: typeof row?.lost === 'boolean' ? row.lost : null,
      nofollow: typeof row?.nofollow === 'boolean' ? row.nofollow : null,
      source,
      evidence,
    };
  }).filter(row => kind === 'competitor' ? row.name : row.sourceUrl);
}

function observedStatus(rows) {
  if (!rows.length) return 'BLOCKED';
  return rows.every(r => r.evidence === 'VERIFIED') ? 'VERIFIED' : 'PARTIAL';
}

export function buildParitySnapshot(input = {}) {
  const domain = normalizeDomain(input.domain);
  const now = Number.isFinite(input.now) ? input.now : Date.now();
  const gsc = gscEvidence(input.gscPages, now);
  const ga4 = input.ga4 && typeof input.ga4 === 'object' ? input.ga4 : null;
  const technical = input.technical && typeof input.technical === 'object' ? input.technical : null;
  const cwv = input.cwv && typeof input.cwv === 'object' ? input.cwv : null;
  const competitors = evidenceRows(input.competitors, 'competitor');
  const backlinks = evidenceRows(input.backlinks, 'backlink');
  const trafficAvailable = !!ga4 && ['sessions', 'users', 'bounce_rate', 'avg_session_duration', 'page_views', 'engagement_rate'].some(key => n(ga4[key]) !== null);
  const technicalAvailable = !!technical;
  const cwvAvailable = !!cwv;

  const trafficMetrics = {
    sessions: trafficAvailable ? n(ga4.sessions) : null,
    users: trafficAvailable ? n(ga4.users) : null,
    bounce_rate: trafficAvailable ? n(ga4.bounce_rate) : null,
    avg_session_duration: trafficAvailable ? n(ga4.avg_session_duration) : null,
    page_views: trafficAvailable ? n(ga4.page_views) : null,
    engagement_rate: trafficAvailable ? n(ga4.engagement_rate) : null,
  };

  const domainOverviewStatus = gsc.available && trafficAvailable ? 'VERIFIED' : (gsc.available || trafficAvailable ? 'PARTIAL' : 'BLOCKED');
  const siteAuditStatus = technicalAvailable && cwvAvailable ? 'VERIFIED' : (technicalAvailable || cwvAvailable ? 'PARTIAL' : 'BLOCKED');

  return {
    version: 1,
    domain,
    observedAt: now,
    capabilities: {
      domainOverview: {
        status: domainOverviewStatus,
        provenance: ['google_search_console', 'google_analytics_4'].filter((_, i) => i === 0 ? gsc.available : trafficAvailable),
        metrics: { ...gsc.metrics, ...trafficMetrics },
      },
      organicResearch: {
        status: gsc.available ? 'VERIFIED' : 'BLOCKED',
        provenance: gsc.available ? ['google_search_console'] : [],
        rows: gsc.rows,
        reason: gsc.available ? null : 'NO_FRESH_GSC_EVIDENCE',
      },
      keywordResearch: {
        status: gsc.available ? 'PARTIAL' : 'BLOCKED',
        provenance: gsc.available ? ['google_search_console'] : [],
        rows: gsc.rows,
        reason: gsc.available ? 'Owned GSC queries do not provide full market demand, keyword volume, CPC, or difficulty coverage.' : 'NO_FRESH_GSC_EVIDENCE',
      },
      competitorsResearch: {
        status: observedStatus(competitors),
        provenance: [...new Set(competitors.map(r => r.source))],
        rows: competitors,
        reason: competitors.some(r => r.evidence !== 'VERIFIED') ? 'Contains inferred competitor research that requires direct or Semrush verification.' : null,
      },
      backlinksResearch: {
        status: observedStatus(backlinks),
        provenance: [...new Set(backlinks.map(r => r.source))],
        rows: backlinks,
        reason: backlinks.some(r => r.evidence !== 'VERIFIED') ? 'Contains inferred backlink opportunities, not verified link observations.' : null,
      },
      trafficOverview: {
        status: trafficAvailable ? 'VERIFIED' : 'BLOCKED',
        provenance: trafficAvailable ? ['google_analytics_4'] : [],
        metrics: trafficMetrics,
        reason: trafficAvailable ? null : 'NO_GA4_EVIDENCE',
      },
      siteAudit: {
        status: siteAuditStatus,
        provenance: [technicalAvailable ? 'direct_technical_audit' : null, cwvAvailable ? 'pagespeed_insights' : null].filter(Boolean),
        metrics: {
          technical_score: technicalAvailable ? n(technical.score) : null,
          performance_score: cwvAvailable ? n(cwv.perfScore) : null,
          core_web_vitals: cwvAvailable ? cwv.metrics || null : null,
        },
        issues: technicalAvailable && Array.isArray(technical.issues) ? technical.issues : [],
      },
      positionTracking: {
        status: gsc.available ? 'VERIFIED' : 'BLOCKED',
        provenance: gsc.available ? ['google_search_console'] : [],
        rows: gsc.rows.map(r => ({ keyword: r.keyword, position: r.position, impressions: r.impressions, clicks: r.clicks, source: r.source })),
        reason: gsc.available ? null : 'NO_FRESH_GSC_EVIDENCE',
      },
      semrushVerifier: {
        status: ['VERIFIED', 'PARTIAL', 'BLOCKED'].includes(input.semrush?.status) ? input.semrush.status : 'BLOCKED',
        reason: input.semrush?.reason || 'NOT_CONNECTED_OR_NOT_REQUESTED',
      },
    },
  };
}

export function summarizeParity(snapshot) {
  const names = ['domainOverview', 'organicResearch', 'keywordResearch', 'competitorsResearch', 'backlinksResearch', 'trafficOverview', 'siteAudit', 'positionTracking'];
  const statuses = names.map(name => snapshot?.capabilities?.[name]?.status || 'BLOCKED');
  return {
    total: names.length,
    verified: statuses.filter(x => x === 'VERIFIED').length,
    partial: statuses.filter(x => x === 'PARTIAL').length,
    blocked: statuses.filter(x => x === 'BLOCKED').length,
    semrushVerifier: snapshot?.capabilities?.semrushVerifier || { status: 'BLOCKED', reason: 'MISSING' },
  };
}
