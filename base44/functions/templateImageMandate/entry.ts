import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getImageForNiche, normalizeNiche } from '../../shared/industryImageRegistry.ts';

// ============================================================
// templateImageMandate — The mandate system that guarantees
// every template in the TemplateLibrary has a real, valid
// preview image. Runs on a 6-hour cron schedule.
//
// Pipeline:
//   1. Scans all active templates for missing/empty preview_image_url.
//   2. For each missing image, assigns a real industry-appropriate
//      Unsplash photo from the industryImageRegistry.
//   3. Optionally validates existing image URLs are reachable (HEAD).
//   4. Returns a summary of fixes applied.
//
// Invoke: base44.functions.invoke('templateImageMandate', {
//   validateExisting?,  // If true, HEAD-check existing URLs for 404s
//   dryRun?,            // If true, report without updating
// })
// ============================================================

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const validateExisting = body.validateExisting || false;
    const dryRun = body.dryRun || false;
    const svc = base44.asServiceRole;

    // ── 1. SCAN ALL ACTIVE TEMPLATES ────────────────────────
    let allTemplates: any[] = [];
    let cursor: string | undefined;
    do {
      const page: any = await svc.entities.TemplateLibrary.filter(
        { is_active: true },
        { sort: '-created_date', limit: 200, cursor, fields: ['name', 'niche', 'preview_image_url', 'slug'] }
      );
      allTemplates = allTemplates.concat(page.items || []);
      cursor = page.next_cursor;
    } while (cursor);

    const missingImage = allTemplates.filter((t) => !t.preview_image_url || t.preview_image_url.trim() === '');
    const fixes: any[] = [];
    const unresolvedNicheImages: any[] = [];

    // ── 2. ASSIGN REAL IMAGES TO MISSING TEMPLATES ──────────
    for (const tpl of missingImage) {
      const nicheKey = normalizeNiche(tpl.niche);
      if (nicheKey === 'default') {
        unresolvedNicheImages.push({ id: tpl.id, name: tpl.name, niche: tpl.niche, reason: 'Unknown category: generic imagery requires editorial approval' });
        continue;
      }
      const imageUrl = getImageForNiche(tpl.niche);

      fixes.push({
        id: tpl.id,
        name: tpl.name,
        niche: tpl.niche,
        assignedNicheKey: nicheKey,
        assignedUrl: imageUrl,
        reason: 'missing_preview_image',
      });

      if (!dryRun) {
        await svc.entities.TemplateLibrary.update(tpl.id, {
          preview_image_url: imageUrl,
        });
      }
    }

    // ── 3. OPTIONALLY VALIDATE EXISTING URLS ─────────────────
    let brokenUrls: any[] = [];
    if (validateExisting) {
      const withImages = allTemplates.filter((t) => t.preview_image_url && !fixes.find((f) => f.id === t.id));
      const batchSize = 6;

      for (let i = 0; i < withImages.length; i += batchSize) {
        const batch = withImages.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(async (t) => {
            try {
              const res = await fetch(t.preview_image_url, {
                method: 'HEAD',
                signal: AbortSignal.timeout(8000),
              });
              return { id: t.id, name: t.name, niche: t.niche, url: t.preview_image_url, status: res.status, ok: res.ok };
            } catch (e: any) {
              return { id: t.id, name: t.name, niche: t.niche, url: t.preview_image_url, status: 0, ok: false, error: e.message };
            }
          })
        );

        for (const r of results) {
          if (r.status === 'fulfilled' && !r.value.ok) {
            brokenUrls.push(r.value);
          }
        }
      }

      // Fix broken URLs with real industry images
      for (const broken of brokenUrls) {
        const imageUrl = getImageForNiche(broken.niche);
        fixes.push({
          id: broken.id,
          name: broken.name,
          niche: broken.niche,
          assignedUrl: imageUrl,
          reason: `broken_url_${broken.status}`,
        });
        if (!dryRun) {
          await svc.entities.TemplateLibrary.update(broken.id, {
            preview_image_url: imageUrl,
          });
        }
      }
    }

    return Response.json({
      ok: true,
      dryRun,
      summary: {
        totalTemplates: allTemplates.length,
        missingImages: missingImage.length,
        brokenUrls: brokenUrls.length,
        totalFixed: dryRun ? 0 : fixes.length,
        proposedFixes: fixes.length,
        unresolvedNicheImages: unresolvedNicheImages.slice(0, 100),
        semanticRelevanceStatus: 'UNKNOWN_REQUIRES_INDEPENDENT_IMAGE_REVIEW',
        semanticRelevanceVerified: false,
        fixes: fixes.slice(0, 50),
      },
    });
  } catch (error: any) {
    console.error('templateImageMandate error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}