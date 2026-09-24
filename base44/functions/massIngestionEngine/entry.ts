import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { waitUntil } from 'base44:runtime';
import { ingestZip } from './zipImport.ts';

// MASS INGESTION ENGINE
// Handles zip/file upload, extraction, 3-stage clean/parse/organize pipeline.
// Stage 1: Clean — sanitize raw content, remove boilerplate, extract meaningful data
// Stage 2: Parse — analyze structure, extract design patterns, components, layout
// Stage 3: Organize — categorize, tag, score, and prepare for rebrand gallery

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const svc = base44.asServiceRole;

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'list';

    if (action === 'zip_upload') {
      if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });
      try {
        return Response.json(await ingestZip(base44, user, body));
      } catch (error: any) {
        const invalid = /valid ZIP|ZIP directory|ZIP entry|ZIP files|ZIP expands|Unsafe archive|Encrypted ZIP|ZIP64|supported website source|too many entries|8 MB/.test(error.message);
        return Response.json({ error: error.message }, { status: invalid ? 400 : 500 });
      }
    }

    // === INGEST: Accept a new website source (zip URL or file URL) ===
    if (action === 'ingest') {
      const { source_url, source_name } = body;
      if (!source_url || !source_name) return Response.json({ error: 'source_url and source_name required' }, { status: 400 });

      const website_id = `IW-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const record = await svc.entities.IngestedWebsite.create({
        owner_id: user.id,
        website_id,
        source_name,
        source_url,
        stage: 'uploaded',
        created_at: new Date().toISOString(),
      });

      // Kick off the 3-stage pipeline asynchronously
      waitUntil(processPipeline(svc, record, body));
      return Response.json({ ok: true, website_id, stage: 'uploaded', message: 'Ingestion started — 3-stage pipeline running' });
    }

    // === BATCH INGEST: Accept multiple sources at once ===
    if (action === 'batch_ingest') {
      const { sources } = body;
      if (!Array.isArray(sources) || sources.length === 0) return Response.json({ error: 'sources array required' }, { status: 400 });

      const created = [];
      for (const src of sources.slice(0, 50)) {
        const website_id = `IW-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const record = await svc.entities.IngestedWebsite.create({
          owner_id: user.id,
          website_id,
          source_name: src.source_name || 'unnamed',
          source_url: src.source_url || '',
          stage: 'uploaded',
          created_at: new Date().toISOString(),
        });
        waitUntil(processPipeline(svc, record, src));
        created.push(website_id);
      }
      return Response.json({ ok: true, ingested: created.length, website_ids: created });
    }

    // === PROCESS: Manually trigger pipeline for existing record ===
    if (action === 'process') {
      const { website_id } = body;
      const records = await svc.entities.IngestedWebsite.filter({ website_id }, '-created_date', 1);
      if (!records[0]) return Response.json({ error: 'Website not found' }, { status: 404 });
      waitUntil(processPipeline(svc, records[0], body));
      return Response.json({ ok: true, website_id, message: 'Pipeline restarted' });
    }

    // === LIST: Get all ingested websites with optional stage filter ===
    if (action === 'list') {
      const { stage, industry, limit = 50 } = body;
      const filter: any = {};
      if (stage) filter.stage = stage;
      if (industry) filter.industry = industry;
      const records = await svc.entities.IngestedWebsite.filter(filter, '-created_date', limit);
      return Response.json({ ok: true, count: records.length, websites: records });
    }

    // === STATS: Get ingestion statistics ===
    if (action === 'stats') {
      const all = await svc.entities.IngestedWebsite.filter({}, '-created_date', 500);
      const stats = {
        total: all.length,
        uploaded: all.filter(w => w.stage === 'uploaded').length,
        cleaning: all.filter(w => w.stage === 'cleaning' || w.stage === 'cleaned').length,
        parsing: all.filter(w => w.stage === 'parsing' || w.stage === 'parsed').length,
        organizing: all.filter(w => w.stage === 'organizing' || w.stage === 'organized').length,
        categorized: all.filter(w => w.stage === 'categorized').length,
        rebranded: all.filter(w => w.stage === 'rebranded').length,
        deployed: all.filter(w => w.stage === 'deployed').length,
        failed: all.filter(w => w.stage === 'failed').length,
        industries: [...new Set(all.map(w => w.industry).filter(Boolean))],
        avg_quality: all.length > 0 ? Math.round(all.reduce((s, w) => s + (w.quality_score || 0), 0) / all.length) : 0,
      };
      return Response.json({ ok: true, stats });
    }

    // === GET: Get single ingested website ===
    if (action === 'get') {
      const { website_id } = body;
      const records = await svc.entities.IngestedWebsite.filter({ website_id }, '-created_date', 1);
      if (!records[0]) return Response.json({ error: 'Website not found' }, { status: 404 });
      return Response.json({ ok: true, website: records[0] });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}

// === 3-STAGE PIPELINE ===
async function processPipeline(svc: any, record: any, opts: any) {
  const log = [];
  try {
    // STAGE 1: CLEAN — fetch source content, sanitize, extract meaningful data
    await svc.entities.IngestedWebsite.update(record.id, { stage: 'cleaning' });
    log.push('Stage 1: Cleaning started');

    let rawContent = '';
    if (record.source_url) {
      try {
        const res = await fetch(record.source_url, { signal: AbortSignal.timeout(30000) });
        if (res.ok) {
          const text = await res.text();
          rawContent = text.slice(0, 40000);
        }
      } catch (e: any) {
        log.push(`Source fetch warning: ${e.message}`);
      }
    }

    // Use LLM to clean and extract meaningful content
    const cleanRes = await svc.integrations.Core.InvokeLLM({
      prompt: `You are a website ingestion engine. Clean and extract meaningful content from this raw website source data.

Source name: ${record.source_name}
Raw content (first 30000 chars): ${rawContent.slice(0, 30000)}

Tasks:
1. Remove boilerplate, scripts, styles, navigation noise
2. Extract the core content, structure, and design elements
3. Identify the industry and website type
4. Extract color palette (hex values) and fonts if detectable
5. Rate the overall quality (0-100)

Return JSON with: cleaned_content, industry, template_type, layout_style, color_palette, fonts_detected, quality_score`,
      response_json_schema: {
        type: 'object',
        properties: {
          cleaned_content: { type: 'string' },
          industry: { type: 'string' },
          template_type: { type: 'string' },
          layout_style: { type: 'string' },
          color_palette: { type: 'array', items: { type: 'string' } },
          fonts_detected: { type: 'array', items: { type: 'string' } },
          quality_score: { type: 'integer' },
        },
      },
    });

    await svc.entities.IngestedWebsite.update(record.id, {
      stage: 'cleaned',
      raw_content: rawContent.slice(0, 50000),
      cleaned_content: cleanRes.cleaned_content || '',
      industry: cleanRes.industry || 'unknown',
      template_type: cleanRes.template_type || 'custom',
      layout_style: cleanRes.layout_style || 'modern',
      color_palette: cleanRes.color_palette || [],
      fonts_detected: cleanRes.fonts_detected || [],
      quality_score: cleanRes.quality_score || 0,
    });
    log.push('Stage 1: Cleaning complete');

    // STAGE 2: PARSE — analyze structure, extract design patterns, components
    await svc.entities.IngestedWebsite.update(record.id, { stage: 'parsing' });
    log.push('Stage 2: Parsing started');

    const parseRes = await svc.integrations.Core.InvokeLLM({
      prompt: `You are a website structure parser. Analyze this cleaned website content and extract its structural components.

Cleaned content: ${(cleanRes.cleaned_content || '').slice(0, 25000)}
Industry: ${cleanRes.industry}
Template type: ${cleanRes.template_type}

Extract:
1. Page sections (hero, about, services, gallery, contact, etc.)
2. Component patterns (cards, carousels, forms, CTAs, etc.)
3. Design patterns (grid, flexbox layouts, spacing, typography scale)
4. Conversion elements (forms, CTAs, phone numbers, live chat)
5. SEO elements (meta tags, schema, headings structure)
6. Design score (0-100), conversion score (0-100), SEO score (0-100)

Return JSON with: sections, components, design_patterns, conversion_elements, seo_elements, design_score, conversion_score, seo_score`,
      response_json_schema: {
        type: 'object',
        properties: {
          sections: { type: 'array', items: { type: 'string' } },
          components: { type: 'array', items: { type: 'string' } },
          design_patterns: { type: 'array', items: { type: 'string' } },
          conversion_elements: { type: 'array', items: { type: 'string' } },
          seo_elements: { type: 'array', items: { type: 'string' } },
          design_score: { type: 'integer' },
          conversion_score: { type: "integer" },
          seo_score: { type: 'integer' },
        },
      },
    });

    const parsedStructure = JSON.stringify({
      sections: parseRes.sections || [],
      components: parseRes.components || [],
      design_patterns: parseRes.design_patterns || [],
      conversion_elements: parseRes.conversion_elements || [],
      seo_elements: parseRes.seo_elements || [],
    });

    await svc.entities.IngestedWebsite.update(record.id, {
      stage: 'parsed',
      parsed_structure: parsedStructure.slice(0, 30000),
      design_score: parseRes.design_score || 0,
      conversion_score: parseRes.conversion_score || 0,
      seo_score: parseRes.seo_score || 0,
    });
    log.push('Stage 2: Parsing complete');

    // STAGE 3: ORGANIZE — categorize, tag, score, prepare for gallery
    await svc.entities.IngestedWebsite.update(record.id, { stage: 'organizing' });
    log.push('Stage 3: Organizing started');

    const organizeRes = await svc.integrations.Core.InvokeLLM({
      prompt: `You are a website organization engine. Categorize and tag this parsed website for a template gallery.

Industry: ${cleanRes.industry}
Template type: ${cleanRes.template_type}
Layout style: ${cleanRes.layout_style}
Sections: ${JSON.stringify(parseRes.sections)}
Components: ${JSON.stringify(parseRes.components)}
Design score: ${parseRes.design_score}
Conversion score: ${parseRes.conversion_score}
SEO score: ${parseRes.seo_score}

Generate:
1. Categories (array of category tags for gallery filtering)
2. Tags (array of descriptive tags)
3. Gallery-ready name
4. Short description for the gallery card
5. Rebrand recommendations (what should be changed when rebranding for a new industry)
6. Overall gallery score (0-100, combining all scores)

Return JSON with: categories, tags, gallery_name, gallery_description, rebrand_recommendations, gallery_score`,
      response_json_schema: {
        type: 'object',
        properties: {
          categories: { type: 'array', items: { type: 'string' } },
          tags: { type: 'array', items: { type: 'string' } },
          gallery_name: { type: 'string' },
          gallery_description: { type: 'string' },
          rebrand_recommendations: { type: 'array', items: { type: 'string' } },
          gallery_score: { type: 'integer' },
        },
      },
    });

    const organizedData = JSON.stringify({
      categories: organizeRes.categories || [],
      tags: organizeRes.tags || [],
      rebrand_recommendations: organizeRes.rebrand_recommendations || [],
    });

    await svc.entities.IngestedWebsite.update(record.id, {
      stage: 'categorized',
      organized_data: organizedData.slice(0, 30000),
      categories: organizeRes.categories || [],
      tags: organizeRes.tags || [],
      quality_score: organizeRes.gallery_score || Math.round(((parseRes.design_score + parseRes.conversion_score + parseRes.seo_score) / 3)),
      processed_at: new Date().toISOString(),
    });
    log.push('Stage 3: Organizing complete — ready for gallery');

  } catch (error: any) {
    await svc.entities.IngestedWebsite.update(record.id, {
      stage: 'failed',
      error_log: `${error.message}\n${log.join('\n')}`.slice(0, 5000),
    }).catch(() => {});
  }
}