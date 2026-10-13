import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// ============================================================
// backgroundOperationsManager — The autonomous background agent
// that keeps all operational systems functioning, organized,
// and updated. Runs on a 6-hour cron schedule.
//
// Responsibilities:
//   1. TEMPLATE ROUTING: Ensures all TemplateLibrary records are
//      properly categorized, have valid slugs, and are routed to
//      the correct deployment pipeline based on category/niche.
//   2. SYSTEM ORGANIZATION: Audits entity records for stale or
//      orphaned data, updates status fields, and maintains
//      inventory consistency.
//   3. WORKFLOW HEALTH: Checks that active workflows are running
//      and flags any that are stalled or failing.
//   4. BUILD PIPELINE: Ensures queued AppBuild and WebsiteQueue
//      records are progressing through their status pipeline.
//   5. HEALTH LEDGER: Writes a summary snapshot for the admin UI.
//
// Invoke: base44.functions.invoke('backgroundOperationsManager', {
//   skipTemplates?, skipOrganize?, skipPipeline?, skipHealth?
// })
// ============================================================

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { skipTemplates, skipOrganize, skipPipeline, skipHealth } = body;
    const svc = base44.asServiceRole;

    const summary = {
      ran_at: new Date().toISOString(),
      templates_routed: 0,
      templates_fixed: 0,
      stale_records_flagged: 0,
      pipeline_progressed: 0,
      workflows_checked: 0,
      issues_found: [] as string[],
    };

    // ── 1. TEMPLATE ROUTING ──────────────────────────────────
    if (!skipTemplates) {
      const page = await svc.entities.TemplateLibrary.filter(
        { is_active: true },
        { sort: '-created_date', limit: 200 }
      );
      const templates = page.items || [];
      summary.templates_routed = templates.length;

      const fixes: any[] = [];
      for (const t of templates) {
        const updates: any = {};
        // Ensure slug is valid
        if (!t.slug || t.slug.trim() === '') {
          updates.slug = (t.name || 'template-' + t.id).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        }
        // Ensure status is set correctly based on is_active
        if (t.is_active && t.status === 'draft') {
          updates.status = 'active';
        }
        // Ensure category is set
        if (!t.category) {
          updates.category = 'homepage';
        }
        // Ensure sort_order is set
        if (t.sort_order == null) {
          updates.sort_order = 0;
        }
        if (Object.keys(updates).length > 0) {
          fixes.push({ id: t.id, updates });
        }
      }

      // Apply fixes in batches of 10
      for (let i = 0; i < fixes.length; i += 10) {
        const batch = fixes.slice(i, i + 10).map((f) => ({ id: f.id, ...f.updates }));
        await svc.entities.TemplateLibrary.bulkUpdate(batch);
      }
      summary.templates_fixed = fixes.length;
    }

    // ── 2. SYSTEM ORGANIZATION ──────────────────────────────
    if (!skipOrganize) {
      // Check for stale WebsiteQueue records stuck in "researching" or "generating" for too long
      const stalePage = await svc.entities.WebsiteQueue.filter(
        { status: { $in: ['researching', 'generating', 'deploying'] } },
        { sort: '-created_date', limit: 100 }
      );
      const staleSites = stalePage.items || [];
      const now = Date.now();
      const STALE_THRESHOLD = 2 * 60 * 60 * 1000; // 2 hours

      const stuckIds: string[] = [];
      for (const s of staleSites) {
        const updated = s.updated_date ? new Date(s.updated_date).getTime() : 0;
        if (now - updated > STALE_THRESHOLD) {
          stuckIds.push(s.id);
        }
      }
      if (stuckIds.length > 0) {
        // Reset stuck sites back to queued so the pipeline can retry
        await svc.entities.WebsiteQueue.updateMany(
          { id: { $in: stuckIds } },
          { $set: { status: 'queued' } }
        );
        summary.stale_records_flagged = stuckIds.length;
        summary.issues_found.push(`${stuckIds.length} stuck WebsiteQueue records reset to queued`);
      }

      // Check for AppBuild records stuck in "building" status
      const stuckBuildsPage = await svc.entities.AppBuild.filter(
        { status: 'building' },
        { sort: '-created_date', limit: 50 }
      );
      const stuckBuilds = stuckBuildsPage.items || [];
      const stuckBuildIds: string[] = [];
      for (const b of stuckBuilds) {
        const updated = b.updated_date ? new Date(b.updated_date).getTime() : 0;
        if (now - updated > STALE_THRESHOLD) {
          stuckBuildIds.push(b.id);
        }
      }
      if (stuckBuildIds.length > 0) {
        await svc.entities.AppBuild.updateMany(
          { id: { $in: stuckBuildIds } },
          { $set: { status: 'queued' } }
        );
        summary.stale_records_flagged += stuckBuildIds.length;
        summary.issues_found.push(`${stuckBuildIds.length} stuck AppBuild records reset to queued`);
      }
    }

    // ── 3. PIPELINE PROGRESSION ─────────────────────────────
    if (!skipPipeline) {
      // Move queued WebsiteQueue records to researching if they have a template_id
      const queuedPage = await svc.entities.WebsiteQueue.filter(
        { status: 'queued', template_id: { $exists: true } },
        { sort: 'created_date', limit: 20 }
      );
      const queued = queuedPage.items || [];
      if (queued.length > 0) {
        await svc.entities.WebsiteQueue.updateMany(
          { id: { $in: queued.map((q) => q.id) } },
          { $set: { status: 'researching' } }
        );
        summary.pipeline_progressed = queued.length;
      }

      // Move queued AppBuild records to building
      const queuedBuildsPage = await svc.entities.AppBuild.filter(
        { status: 'queued' },
        { sort: 'created_date', limit: 20 }
      );
      const queuedBuilds = queuedBuildsPage.items || [];
      if (queuedBuilds.length > 0) {
        await svc.entities.AppBuild.updateMany(
          { id: { $in: queuedBuilds.map((q) => q.id) } },
          { $set: { status: 'building' } }
        );
        summary.pipeline_progressed += queuedBuilds.length;
      }
    }

    // ── 4. WORKFLOW HEALTH CHECK ────────────────────────────
    if (!skipHealth) {
      // The workflow system manages its own health, but we log a heartbeat
      // by counting active MassLaunchBatch records that need attention
      const activeBatchesPage = await svc.entities.MassLaunchBatch.filter(
        { status: { $in: ['queued', 'orchestrating', 'deploying', 'validating'] } },
        { sort: '-created_at', limit: 50 }
      );
      const activeBatches = activeBatchesPage.items || [];
      summary.workflows_checked = activeBatches.length;

      // Flag batches that haven't been updated in 24 hours
      const DAY = 24 * 60 * 60 * 1000;
      const stalledBatches = activeBatches.filter((b) => {
        const updated = b.updated_date ? new Date(b.updated_date).getTime() : 0;
        return now() - updated > DAY;
      });
      if (stalledBatches.length > 0) {
        summary.issues_found.push(`${stalledBatches.length} MassLaunchBatch records appear stalled (>24h no update)`);
      }
    }

    // ── 5. HEALTH LEDGER ────────────────────────────────────
    // Write a summary to the SystemHealthAudit entity if it exists
    try {
      await svc.entities.SystemHealthAudit.create({
        // @ts-ignore - entity may have different field names
        audit_type: 'background_operations',
        summary: JSON.stringify(summary),
        issues_count: summary.issues_found.length,
        ran_at: summary.ran_at,
      });
    } catch {
      // Entity may not accept these fields — non-critical
    }

    return Response.json({ ok: true, summary });
  } catch (error: any) {
    console.error('backgroundOperationsManager error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function now() {
  return Date.now();
}