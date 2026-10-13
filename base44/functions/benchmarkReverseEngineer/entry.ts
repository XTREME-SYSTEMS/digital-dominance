import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

// ============================================================
// benchmarkReverseEngineer — Top 5 sites per industry category
// reverse-engineering system. Captures layouts, extracts design
// DNA, validates against best practices, and stores results
// for template generation.
//
// Invoke: base44.functions.invoke('benchmarkReverseEngineer', {
//   industryKey: 'epoxy_flooring',  // industry category
//   maxSites: 5,                    // top N sites to analyze
//   forceRecapture: false,         // re-capture even if exists
// })
// ============================================================

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json();
    const { industryKey, maxSites = 5, forceRecapture = false } = body;

    if (!industryKey) {
      return Response.json({ error: 'industryKey is required' }, { status: 400 });
    }

    // ── Step 1: Find top-rated sites for this industry ──────────────
    const topSites = await findTopSitesForIndustry(base44, industryKey, maxSites);
    if (topSites.length === 0) {
      return Response.json({ error: `No top sites found for industry: ${industryKey}` }, { status: 404 });
    }

    // ── Step 2: Check for existing benchmarks, skip if captured ─────
    const existing = await base44.entities.IndustryBenchmark.filter(
      { industry_key: industryKey, evidence_status: 'captured' },
      { limit: 50 }
    );
    const existingUrls = new Set((existing.items || []).map((b: any) => b.url));
    const toCapture = forceRecapture ? topSites : topSites.filter((s) => !existingUrls.has(s.url));

    // ── Step 3: Capture each site's layout ──────────────────────────
    const results = [];
    for (const site of toCapture) {
      try {
        const benchmarkRecord = await base44.entities.IndustryBenchmark.create({
          reference_key: `reference-${industryKey}-${Date.now()}-${site.url.replace(/[^a-z0-9]/gi, '-')}`,
          industry_key: industryKey,
          industry: site.industry || industryKey,
          name: site.name,
          url: site.url,
          source_url: site.sourceUrl || site.url,
          evidence_status: 'reference',
          selection_basis: `Top ${site.rank || 'N'} rated site for ${industryKey} — ${site.selectionReason || 'high authority and relevance'}`,
        });

        // Capture the layout using the benchmark capture system
        try {
          const captureRes = await base44.functions.invoke('industryBenchmarkCapture', {
            benchmarkId: benchmarkRecord.id,
          });
          results.push({
            url: site.url,
            name: site.name,
            status: 'captured',
            benchmarkId: benchmarkRecord.id,
            capture: captureRes.data,
          });
        } catch (captureErr: any) {
          // Mark as blocked but continue
          await base44.entities.IndustryBenchmark.update(benchmarkRecord.id, {
            evidence_status: 'blocked',
            error: (captureErr.message || 'Capture failed').slice(0, 2000),
          }).catch(() => {});
          results.push({
            url: site.url,
            name: site.name,
            status: 'blocked',
            error: captureErr.message,
          });
        }
      } catch (err: any) {
        results.push({ url: site.url, name: site.name, status: 'failed', error: err.message });
      }
    }

    // ── Step 4: Reverse-engineer layout DNA from captured sites ─────
    const allCaptured = await base44.entities.IndustryBenchmark.filter(
      { industry_key: industryKey, evidence_status: 'captured' },
      { limit: 20 }
    );
    const layoutDNA = await extractLayoutDNA(base44, allCaptured.items || [], industryKey);

    // ── Step 5: Validate layouts against best practices ──────────────
    const validation = validateLayout(layoutDNA);

    // ── Step 6: Store the reverse-engineered template ────────────────
    const templateRecord = await base44.entities.TemplateLibrary.create({
      name: `${industryKey} — Reverse-Engineered Top 5 Layout`,
      slug: `${industryKey}-reverse-engineered-top5`,
      category: 'homepage',
      niche: industryKey,
      description: `Layout reverse-engineered from the top 5 rated ${industryKey} websites. Validated score: ${validation.score}/100. ${validation.notes}`,
      content: JSON.stringify({ layoutDNA, validation, sources: topSites }, null, 2),
      tags: ['reverse-engineered', 'top-5', 'validated', industryKey],
      is_active: true,
      status: 'active',
      version: '1.0',
      sort_order: 999,
    });

    return Response.json({
      success: true,
      industryKey,
      sitesFound: topSites.length,
      sitesCaptured: results.filter((r) => r.status === 'captured').length,
      sitesBlocked: results.filter((r) => r.status === 'blocked').length,
      layoutDNA,
      validation,
      templateId: templateRecord.id,
      results,
    });
  } catch (error: any) {
    console.error('benchmarkReverseEngineer error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ── Find top-rated sites for an industry using web search ──────────
async function findTopSitesForIndustry(base44: any, industryKey: string, maxSites: number) {
  const prompt = `Search for the top ${maxSites} highest-rated, best-designed "${industryKey}" websites in the US. For each site, provide:
1. The business name
2. The full URL (https://...)
3. Why it's top-rated (design quality, authority, conversion elements)

Return ONLY a JSON array of objects with fields: name, url, rank, selectionReason. No markdown, no explanation, just the JSON array.`;

  try {
    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          sites: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                url: { type: 'string' },
                rank: { type: 'number' },
                selectionReason: { type: 'string' },
              },
            },
          },
        },
      },
    });
    const sites = (res as any).sites || [];
    return sites.slice(0, maxSites).map((s: any) => ({
      ...s,
      industry: industryKey,
      sourceUrl: s.url,
    }));
  } catch (err: any) {
    console.error('findTopSites error:', err.message);
    return [];
  }
}

// ── Extract layout DNA from captured benchmarks ─────────────────────
async function extractLayoutDNA(base44: any, benchmarks: any[], industryKey: string) {
  if (benchmarks.length === 0) return null;

  const observations = benchmarks.map((b) => ({
    name: b.name,
    url: b.url,
    capabilities: b.capabilities || [],
    visual_tokens: b.visual_tokens || {},
  }));

  const prompt = `You are a reverse-engineering expert. Analyze these ${observations.length} top ${industryKey} website benchmarks and extract the common layout DNA — the shared structural patterns that make them the best in their category.

Benchmarks: ${JSON.stringify(observations).slice(0, 8000)}

Extract and return as JSON:
1. commonSections: array of section types that appear across most sites (hero, services, testimonials, gallery, cta, etc.) in order of frequency
2. heroPattern: the dominant hero layout pattern (split, centered, full-bleed, video bg, etc.)
3. navPattern: navigation structure (sticky top, side, hamburger, etc.)
4. ctaPattern: call-to-action placement strategy
5. colorStrategy: common color approaches for this industry
6. typographyStrategy: common font/heading approaches
7. conversionElements: which conversion elements are universal (phone, form, chat, etc.)
8. layoutScore: how sophisticated the layouts are (0-100, where 100 = highly custom, 0 = generic template)
9. recommendations: specific layout recommendations to create the best possible template for this industry`;

  try {
    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          commonSections: { type: 'array', items: { type: 'string' } },
          heroPattern: { type: 'string' },
          navPattern: { type: 'string' },
          ctaPattern: { type: 'string' },
          colorStrategy: { type: 'string' },
          typographyStrategy: { type: 'string' },
          conversionElements: { type: 'array', items: { type: 'string' } },
          layoutScore: { type: 'number' },
          recommendations: { type: 'string' },
        },
      },
    });
    return res;
  } catch (err: any) {
    console.error('extractLayoutDNA error:', err.message);
    return { error: err.message };
  }
}

// ── Validate the reverse-engineered layout ──────────────────────────
function validateLayout(layoutDNA: any) {
  if (!layoutDNA || layoutDNA.error) {
    return { score: 0, passed: false, notes: 'No layout DNA could be extracted.' };
  }

  let score = 0;
  const checks: string[] = [];

  // Check: has common sections
  if (layoutDNA.commonSections && layoutDNA.commonSections.length >= 4) {
    score += 20;
    checks.push(`✓ ${layoutDNA.commonSections.length} common sections identified`);
  } else {
    checks.push('✗ Insufficient common sections identified');
  }

  // Check: hero pattern is specific (not generic)
  if (layoutDNA.heroPattern && layoutDNA.heroPattern.length > 10) {
    score += 20;
    checks.push(`✓ Hero pattern: ${layoutDNA.heroPattern}`);
  } else {
    checks.push('✗ Hero pattern too generic');
  }

  // Check: conversion elements present
  if (layoutDNA.conversionElements && layoutDNA.conversionElements.length >= 2) {
    score += 20;
    checks.push(`✓ ${layoutDNA.conversionElements.length} conversion elements found`);
  } else {
    checks.push('✗ Insufficient conversion elements');
  }

  // Check: layout score from AI
  if (layoutDNA.layoutScore && layoutDNA.layoutScore >= 60) {
    score += 20;
    checks.push(`✓ Layout sophistication score: ${layoutDNA.layoutScore}/100`);
  } else {
    score += 10;
    checks.push('⚠ Layout sophistication below threshold');
  }

  // Check: has recommendations
  if (layoutDNA.recommendations && layoutDNA.recommendations.length > 50) {
    score += 20;
    checks.push('✓ Detailed recommendations provided');
  } else {
    checks.push('✗ Recommendations too brief');
  }

  return {
    score,
    passed: score >= 70,
    notes: checks.join('; '),
    checks,
  };
}