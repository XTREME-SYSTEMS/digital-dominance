import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// ============================================================
// autonomousVisualOrchestrator — The background agent that
// operates three systems automatically:
//
//   1. VISION INTELLIGENCE: Scans top 5 sites in the category,
//      reverse-engineers their layouts, stores them as baseline
//      templates for the App Factory.
//
//   2. PROMPT LIBRARY: Manages image generation prompts — tests
//      them, scores quality, curates the best ones.
//
//   3. SEARCH CONSOLE: Pulls indexing status + search performance
//      for every deployed site and stores results for the
//      Launch Status Dashboard.
//
// Invoke: base44.functions.invoke('autonomousVisualOrchestrator', {
//   niche?,        // Industry to scan (default: reads from system config)
//   skipVision?,   // Skip vision intelligence step
//   skipPrompts?,  // Skip prompt library step
//   skipGsc?,      // Skip Search Console step
// })
//
// Returns: { ok, summary: { sites_scanned, templates_stored,
//   prompts_tested, gsc_sites_checked } }
// ============================================================

const str = (v: any, max: number) => String(v ?? '').slice(0, max);

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { niche, skipVision, skipPrompts, skipGsc } = body;
    const svc = base44.asServiceRole;
    const core = svc.integrations.Core;

    // Determine the target niche — read from system config or use default
    let targetNiche = niche || 'epoxy_flooring';
    try {
      const settings = await svc.entities.AppSettings.list(1);
      if (settings[0]?.default_niche) targetNiche = settings[0].default_niche;
    } catch {}

    const summary = {
      niche: targetNiche,
      sites_scanned: 0,
      templates_stored: 0,
      prompts_tested: 0,
      prompts_curated: 0,
      gsc_sites_checked: 0,
      gsc_indexed: 0,
      errors: [] as string[],
    };

    // ═══════════════════════════════════════════════════════════════
    // SYSTEM 1: VISION INTELLIGENCE — Scan top 5 sites, reverse-
    // engineer layouts, store as baseline templates
    // ═══════════════════════════════════════════════════════════════
    if (!skipVision) {
      try {
        // Step 1a: Discover top 5 competitors in the niche
        const discoverRes = await base44.functions.invoke('visionIntelligenceEngine', {
          action: 'discover',
          niche: targetNiche,
        });
        const competitors = discoverRes.data?.competitors || [];
        summary.sites_scanned = Math.min(competitors.length, 5);

        // Step 1b: Reverse-engineer layouts via benchmarkReverseEngineer
        if (competitors.length > 0) {
          const top5 = competitors.slice(0, 5).map((c: any) => c.url).filter(Boolean);
          if (top5.length > 0) {
            const reverseRes = await base44.functions.invoke('benchmarkReverseEngineer', {
              industry: targetNiche,
              urls: top5,
            });

            // Step 1c: Store results as baseline templates in TemplateLibrary
            const templatesStored = reverseRes.data?.templates || [];
            for (const tpl of templatesStored) {
              try {
                await svc.entities.TemplateLibrary.create({
                  name: `${targetNiche} — Baseline: ${str(tpl.source_name, 40)}`,
                  slug: `${targetNiche}-baseline-${Date.now()}-${str(tpl.source_name, 20).toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                  category: 'homepage',
                  niche: targetNiche,
                  description: `Reverse-engineered from top site: ${tpl.source_url}. Autonomous agent baseline template for ${targetNiche} App Factory.`,
                  content: tpl.html || tpl.content || '',
                  sections: tpl.sections || [],
                  tags: ['autonomous', 'baseline', 'reverse-engineered', targetNiche],
                  is_active: true,
                  status: 'active',
                  sort_order: 0,
                });
                summary.templates_stored++;
              } catch (e) {
                // Template creation may fail on slug collision — skip
              }
            }
          }
        }
      } catch (e) {
        summary.errors.push(`Vision intelligence: ${e.message}`);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // SYSTEM 2: PROMPT LIBRARY — Test and curate image generation
    // prompts for high-quality visual results
    // ═══════════════════════════════════════════════════════════════
    if (!skipPrompts) {
      try {
        // Step 2a: Seed initial prompts if library is empty
        const existingPrompts = await svc.entities.PromptLibrary.list(5);
        if (existingPrompts.length === 0) {
          const seedPrompts = getSeedPrompts(targetNiche);
          for (const p of seedPrompts) {
            await svc.entities.PromptLibrary.create(p);
          }
        }

        // Step 2b: Test untested or low-score prompts (max 3 per run)
        const untested = await svc.entities.PromptLibrary.filter(
          { quality_score: { $lt: 50 }, is_active: true },
          { limit: 3, sort: 'tested_at' }
        );
        const toTest = untested.items || untested || [];

        for (const prompt of toTest.slice(0, 3)) {
          try {
            // Generate a test image
            const imgRes = await core.GenerateImage({ prompt: prompt.prompt_text });
            const testImageUrl = imgRes.url;

            // AI-evaluate the image quality
            const evalRes = await core.InvokeLLM({
              prompt: `Evaluate this generated image for quality, realism, and professional appearance. Score it 0-100 where 100 is ultra-lifelike, magazine-quality, and 0 is poor quality. Consider: lighting, composition, detail, color accuracy, professional appearance. Be strict. Return JSON: { "score": number, "notes": "brief assessment" }`,
              file_urls: [testImageUrl],
              response_json_schema: {
                type: 'object',
                properties: {
                  score: { type: 'number' },
                  notes: { type: 'string' },
                },
              },
            });

            const score = Number(evalRes.score) || 0;
            await svc.entities.PromptLibrary.update(prompt.id, {
              quality_score: score,
              test_image_url: testImageUrl,
              test_notes: str(evalRes.notes, 2000),
              tested_at: new Date().toISOString(),
              test_count: (prompt.test_count || 0) + 1,
              is_featured: score >= 85,
            });
            summary.prompts_tested++;
            if (score >= 85) summary.prompts_curated++;
          } catch (e) {
            summary.errors.push(`Prompt test ${prompt.id}: ${e.message}`);
          }
        }
      } catch (e) {
        summary.errors.push(`Prompt library: ${e.message}`);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // SYSTEM 3: SEARCH CONSOLE — Pull indexing status + search
    // performance for every deployed site
    // ═══════════════════════════════════════════════════════════════
    if (!skipGsc) {
      try {
        // Gather all deployed URLs from multiple sources
        const deployedUrls: { url: string; source: string; record_id: string }[] = [];

        // PWA builds
        const pwaPage = await svc.entities.AppBuild.filter(
          { status: 'published', published_url: { $exists: true } },
          { limit: 50, fields: ['id', 'published_url', 'app_name'] }
        );
        for (const b of pwaPage.items || []) {
          if (b.published_url) deployedUrls.push({ url: b.published_url, source: 'pwa', record_id: b.id });
        }

        // Template deployments
        const tplPage = await svc.entities.DeploymentRecord.filter(
          { status: 'deployed', vercel_url: { $exists: true } },
          { limit: 50, fields: ['id', 'vercel_url'] }
        );
        for (const d of tplPage.items || []) {
          if (d.vercel_url) deployedUrls.push({ url: d.vercel_url, source: 'template', record_id: d.id });
        }

        // Mass launch live sites
        const mlPage = await svc.entities.WebsiteQueue.filter(
          { status: { $in: ['live', 'monitoring'] }, generated_url: { $exists: true } },
          { limit: 100, fields: ['id', 'generated_url'] }
        );
        for (const s of mlPage.items || []) {
          if (s.generated_url) deployedUrls.push({ url: s.generated_url, source: 'mass_launch', record_id: s.id });
        }

        // Pull GSC status for each (max 20 per run to stay within rate limits)
        for (const deployed of deployedUrls.slice(0, 20)) {
          try {
            const gscRes = await base44.functions.invoke('searchConsoleStatus', { url: deployed.url });
            const gscData = gscRes.data;

            // Update the source record with GSC data
            const indexingState = gscData?.indexing?.indexing_state || 'UNKNOWN';
            const isIndexed = indexingState === 'INDEXING_STATE_INDEXED' || gscData?.indexing?.verdict === 'PASS';

            if (deployed.source === 'pwa') {
              await svc.entities.AppBuild.update(deployed.record_id, {
                gsc_indexing_status: indexingState,
                gsc_impressions: gscData?.performance?.impressions || 0,
                gsc_clicks: gscData?.performance?.clicks || 0,
                gsc_avg_position: gscData?.performance?.avg_position || 0,
                gsc_last_checked: new Date().toISOString(),
              }).catch(() => {});
            } else if (deployed.source === 'template') {
              await svc.entities.DeploymentRecord.update(deployed.record_id, {
                health_notes: `GSC: ${indexingState} | ${gscData?.performance?.impressions || 0} impressions, ${gscData?.performance?.clicks || 0} clicks`,
                health_score: isIndexed ? 100 : 50,
              }).catch(() => {});
            } else if (deployed.source === 'mass_launch') {
              await svc.entities.WebsiteQueue.update(deployed.record_id, {
                indexing_status: indexingState,
                search_impressions: gscData?.performance?.impressions || 0,
                search_clicks: gscData?.performance?.clicks || 0,
              }).catch(() => {});
            }

            summary.gsc_sites_checked++;
            if (isIndexed) summary.gsc_indexed++;
          } catch (e) {
            // GSC may fail for unverified properties — skip silently
          }
        }
      } catch (e) {
        summary.errors.push(`Search Console: ${e.message}`);
      }
    }

    // Log the orchestration cycle
    try {
      await svc.entities.SopLog.create({
        category: 'autonomous',
        action: 'autonomousVisualOrchestrator cycle',
        detail: `Niche: ${targetNiche} | Sites scanned: ${summary.sites_scanned} | Templates stored: ${summary.templates_stored} | Prompts tested: ${summary.prompts_tested} | GSC checked: ${summary.gsc_sites_checked} (${summary.gsc_indexed} indexed)`,
        source: 'autonomousVisualOrchestrator',
        status: 'completed',
        timestamp: new Date().toISOString(),
      });
    } catch {}

    return Response.json({
      ok: true,
      summary,
      ran_at: new Date().toISOString(),
      errors: summary.errors.length > 0 ? summary.errors : undefined,
    });
  } catch (error) {
    console.error('autonomousVisualOrchestrator error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ── Seed prompts for the prompt library ─────────────────────────────
function getSeedPrompts(niche: string) {
  const nicheContext = niche === 'epoxy_flooring'
    ? 'epoxy garage floor coating, metallic flakes, glossy seamless surface'
    : `${niche} professional service`;

  return [
    {
      title: 'Ultra-Lifelike Hero — Garage Coating',
      category: 'hero_image',
      industry: niche,
      prompt_text: `Ultra-lifelike photograph of a pristine ${nicheContext} in a luxury home garage, shot with Canon EOS R5, 35mm lens, natural daylight from side window, glossy reflective surface with metallic flake texture, 8K resolution, professional architectural photography, shallow depth of field, no people, no text, no watermark`,
      negative_prompt: 'blurry, low quality, cartoon, illustration, text, watermark, people, distorted',
      tags: ['ultra-lifelike', '8k', 'pro-camera', 'hero'],
      is_active: true,
      quality_score: 0,
      test_count: 0,
      sort_order: 1,
    },
    {
      title: 'Industry Pro — Before Application',
      category: 'before_after',
      industry: niche,
      prompt_text: `Ultra-lifelike photograph of a bare concrete garage floor before coating application, showing cracks and stains, shot from 45-degree angle, professional documentation photography, even lighting, 8K resolution, realistic textures, no people`,
      negative_prompt: 'blurry, cartoon, text, watermark, people, idealized',
      tags: ['ultra-lifelike', 'before-after', 'documentation'],
      is_active: true,
      quality_score: 0,
      test_count: 0,
      sort_order: 2,
    },
    {
      title: 'Industry Pro — After Application',
      category: 'before_after',
      industry: niche,
      prompt_text: `Ultra-lifelike photograph of a finished ${nicheContext} with metallic silver flakes and high-gloss topcoat, shot from 45-degree angle matching the before photo, professional documentation photography, even lighting, 8K resolution, mirror-like reflection, no people`,
      negative_prompt: 'blurry, cartoon, text, watermark, people, uneven coating',
      tags: ['ultra-lifelike', 'before-after', 'documentation', 'glossy'],
      is_active: true,
      quality_score: 0,
      test_count: 0,
      sort_order: 3,
    },
    {
      title: 'Gallery — Close-up Texture',
      category: 'gallery',
      industry: niche,
      prompt_text: `Extreme close-up macro photograph of ${nicheContext} surface texture, showing metallic flake distribution and glossy clear coat, studio lighting with raking angle to reveal texture depth, 8K resolution, professional product photography, no people, no text`,
      negative_prompt: 'blurry, low resolution, text, watermark, people',
      tags: ['ultra-lifelike', 'macro', 'texture', 'gallery'],
      is_active: true,
      quality_score: 0,
      test_count: 0,
      sort_order: 4,
    },
    {
      title: 'Social Card — Premium Finish',
      category: 'social_card',
      industry: niche,
      prompt_text: `Ultra-lifelike wide shot of a luxury garage interior with premium ${nicheContext}, sports car visible in background, warm LED lighting, architectural digest style photography, 8K resolution, professional real estate photography, aspirational mood, no text overlay`,
      negative_prompt: 'blurry, low quality, text overlay, watermark, people, cluttered',
      tags: ['ultra-lifelike', 'social', 'premium', 'aspirational'],
      is_active: true,
      quality_score: 0,
      test_count: 0,
      sort_order: 5,
    },
  ];
}