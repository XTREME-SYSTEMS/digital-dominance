/**
 * Client-only launch request. It does not enqueue jobs, approve markets, or publish sites.
 * Tenant/actor authorization and idempotency belong to the authenticated backend.
 */
export function createDraftLaunchPlan(selection) {
  const industry = String(selection?.industry || '').trim();
  const templateId = String(selection?.template?.id || '').trim();
  const count = Number(selection?.count);
  const marketInput = String(selection?.locations || '').trim();

  if (!industry) throw new Error('Choose an industry first.');
  if (!templateId) throw new Error('Choose an exact website template first.');
  if (!Number.isInteger(count) || count < 1 || count > 350) {
    throw new Error('Choose between 1 and 350 sites.');
  }
  if (marketInput.length > 500) {
    throw new Error('Target market notes must be 500 characters or fewer.');
  }

  const proposedMarkets = [...new Set(marketInput.split(',')
    .map(value => value.trim())
    .filter(Boolean))];

  return Object.freeze({
    schema_version: 'dd-launch-request-v1',
    status: 'PENDING_MARKET_REVIEW',
    industry,
    template_id: templateId,
    requested_site_count: count,
    proposed_markets: Object.freeze(proposedMarkets),
    markets_verified: false,
    queued: false,
    generated_site_count: 0,
    release_mode: 'preview_only',
  });
}
