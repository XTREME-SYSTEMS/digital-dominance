import { createClientFromRequest } from 'npm:@base44/sdk@0.8.53';

// APEX launch-control quarantine, version 1. The predecessor called a
// production-only Vercel adapter that ignored each site's generated content
// and could mark failed requests live. Its original implementation remains
// recoverable from Git history. Do not restore the unsafe adapter by
// toggling a user-provided payload or an unvalidated environment flag.
//
// This endpoint is intentionally non-mutating while the site factory's
// authenticated preview-only provider adapter and independent Guardian
// validator are implemented and tested. No background cron is created.

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const locations = Array.isArray(body?.locations) ? body.locations : [];
    const syntheticOnly =
      body?.mode === 'synthetic_noindex_canary' &&
      !body?.continueBatchId &&
      locations.length === 1 &&
      locations[0]?.city === 'Synthetic City' &&
      locations[0]?.state === 'ZZ' &&
      body?.templateKey === 'epoxy_synthetic_canary' &&
      body?.googleSyncEnabled === false &&
      body?.autoHealEnabled === false &&
      body?.runTestSwarm === false &&
      body?.provisionTarget === 'vercel';

    if (!syntheticOnly) {
      return Response.json({
        error: 'MASS_LAUNCH_PAUSED',
        detail: 'Mass launch, backlink-network publication, customer messaging and indexing remain paused until one independently validated noindex site and an approved preview adapter pass.',
      }, { status: 409 });
    }
    return Response.json({
      error: 'PREVIEW_ADAPTER_NOT_BOUND',
      detail: 'The prior adapter targeted production and ignored the supplied site content. The single verified Vercel GitHub noindex preview is available separately, but this mass-launch API must remain read-only until an authenticated staging-safe adapter passes Guardian QA.',
    }, { status: 409 });
  } catch (error) {
    // Do not reveal provider or secret configuration in public API responses.
    console.error('APEX mass launch quarantine rejected request', error?.name || 'Error');
    return Response.json({ error: 'MASS_LAUNCH_QUARANTINE_ERROR' }, { status: 500 });
  }
}
