import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { generateText } from '../../shared/aiGateway.ts';

// SMAI Sandbox Dispatcher — Manages the GPT bi-directional sync sandbox queue.
// GPT prompts go into a queue, get compiled in an isolated sandbox, validated
// against the 100% perfection checklist, and deployed when ready.
// Uses Vercel AI Gateway (bypasses Base44 integration credits).
export default async function(req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { action } = body;

  // ─── ENQUEUE: Add a new GPT prompt to the sandbox queue ───────────
  if (action === 'enqueue') {
    const { client_id, prompt, web_pack_url, logo_pack_url, brand_pack_url } = body;
    if (!prompt) return Response.json({ error: 'prompt required' }, { status: 400 });

    const jobId = `SBOX-${Date.now()}`;
    console.log(`[smaiSandboxDispatcher] Enqueuing job ${jobId}: ${prompt.slice(0, 100)}...`);

    const job = await base44.entities.SmaiSandboxJob.create({
      job_id: jobId,
      client_id: client_id || 'system',
      prompt,
      gpt_sync_direction: 'bidirectional',
      status: 'queued',
      queue_position: 0,
      pack_status: {
        web_pack_approved: !!web_pack_url,
        logo_pack_approved: !!logo_pack_url,
        brand_pack_approved: !!brand_pack_url
      },
      queued_at: new Date().toISOString()
    });

    return Response.json({ ok: true, job_id: jobId, job, status: 'queued' });
  }

  // ─── PROCESS: Pick next queued job and run it through the pipeline ──
  if (action === 'process') {
    const batchSize = Math.min(body.batch_size || 1, 5);
    const queued = await base44.entities.SmaiSandboxJob.filter(
      { status: 'queued' },
      { sort: 'queued_at', limit: batchSize }
    );

    if (!queued.items || queued.items.length === 0) {
      return Response.json({ ok: true, message: 'No queued jobs', processed: 0 });
    }

    const results = [];
    for (const job of queued.items) {
      try {
        console.log(`[smaiSandboxDispatcher] Processing ${job.job_id}...`);
        await base44.entities.SmaiSandboxJob.update(job.id, {
          status: 'compiling',
          started_at: new Date().toISOString()
        });

        // Step 1: Generate code/plan via Vercel AI Gateway
        const { parsed } = await generateText({
          prompt: `You are a full-stack system architect. A client has submitted this request:

"${job.prompt}"

Generate a complete implementation plan as JSON:
{
  "pages": [{"path": "/...", "name": "...", "components": [...], "description": "..."}],
  "backend_functions": [{"name": "...", "purpose": "...", "endpoints": [...]}],
  "entities": [{"name": "...", "fields": [...]}],
  "validation_items": [{"category": "frontend|backend|buttons|user_flow|visual_parity|operational_parity", "description": "...", "test_method": "..."}]
}`,
          model: 'openai/gpt-5.4',
          response_json_schema: {
            type: 'object',
            properties: {
              pages: { type: 'array' },
              backend_functions: { type: "array" },
              entities: { type: "array" },
              validation_items: { type: "array" }
            }
          }
        });

        const plan = parsed || {};

        // Step 2: Create validation checklist
        const checklistId = `CHK-${Date.now()}`;
        const validationItems = (plan.validation_items || []).map((v, i) => ({
          item_id: `item-${i + 1}`,
          category: v.category || 'frontend',
          description: v.description || '',
          test_method: v.test_method || 'screenshot_diff',
          status: 'pending'
        }));

        await base44.entities.SmaiValidationChecklist.create({
          checklist_id: checklistId,
          sandbox_job_id: job.id,
          items: validationItems,
          total_items: validationItems.length,
          passed_items: 0,
          failed_items: 0,
          overall_score: 0,
          pack_reference: {
            web_pack_url: body.web_pack_url || '',
            logo_pack_url: body.logo_pack_url || '',
            brand_pack_url: body.brand_pack_url || ''
          },
          created_at: new Date().toISOString()
        });

        await base44.entities.SmaiSandboxJob.update(job.id, {
          status: 'validating',
          validation_checklist_id: checklistId,
          gpt_iterations: 1
        });

        results.push({
          job_id: job.job_id,
          status: 'validating',
          checklist_id: checklistId,
          plan_summary: {
            pages: plan.pages?.length || 0,
            functions: plan.backend_functions?.length || 0,
            entities: plan.entities?.length || 0,
            validation_items: validationItems.length
          }
        });
      } catch (e) {
        console.error(`[smaiSandboxDispatcher] Job ${job.job_id} failed: ${e.message}`);
        await base44.entities.SmaiSandboxJob.update(job.id, {
          status: 'failed',
          error: e.message
        });
        results.push({ job_id: job.job_id, status: 'failed', error: e.message });
      }
    }

    return Response.json({ ok: true, processed: results.length, results });
  }

  // ─── STATUS: Get queue status ─────────────────────────────────────
  if (action === 'status') {
    const queued = await base44.entities.SmaiSandboxJob.count({ status: 'queued' });
    const compiling = await base44.entities.SmaiSandboxJob.count({ status: 'compiling' });
    const validating = await base44.entities.SmaiSandboxJob.count({ status: 'validating' });
    const ready = await base44.entities.SmaiSandboxJob.count({ status: 'ready' });
    const approved = await base44.entities.SmaiSandboxJob.count({ status: 'approved' });
    const failed = await base44.entities.SmaiSandboxJob.count({ status: 'failed' });

    return Response.json({
      ok: true,
      queue: { queued, compiling, validating, ready, approved, failed }
    });
  }

  return Response.json({ error: 'Unknown action. Use: enqueue, process, status' }, { status: 400 });
}