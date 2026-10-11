import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { runSelfBuilder, generatePlan } from '../../shared/selfBuilderEngine.ts';

// ═══════════════════════════════════════════════════════════════════════════
// smaiSelfBuilder — The self-building system backend function.
//
// Actions:
//   plan    — Generate a plan from a prompt (returns plan for approval)
//   execute — Run the full PEVA loop (plan → execute → verify → adjust)
//   status  — Check if a build is in progress
//
// All AI calls route through Vercel AI Gateway (bypasses Base44 credits).
// ═══════════════════════════════════════════════════════════════════════════

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'plan';

    // ── PLAN: Generate a plan for approval ──
    if (action === 'plan') {
      const { prompt } = body;
      if (!prompt || typeof prompt !== 'string') {
        return Response.json({ error: 'prompt required' }, { status: 400 });
      }

      const plan = await generatePlan(prompt);
      return Response.json({ ok: true, plan });
    }

    // ── EXECUTE: Run the full self-building loop ──
    if (action === 'execute') {
      const { prompt } = body;
      if (!prompt || typeof prompt !== 'string') {
        return Response.json({ error: 'prompt required' }, { status: 400 });
      }

      // Collect progress events (since HTTP can't stream easily, we batch them)
      const events: any[] = [];
      const summary = await runSelfBuilder({
        prompt,
        base44,
        onProgress: (event) => events.push(event),
      });

      return Response.json({ ok: true, summary, events });
    }

    // ── AUTONOMOUS: Plan + Execute in one call (fire-and-forget) ──
    if (action === 'autonomous') {
      const { prompt } = body;
      if (!prompt || typeof prompt !== 'string') {
        return Response.json({ error: 'prompt required' }, { status: 400 });
      }

      const events: any[] = [];
      const summary = await runSelfBuilder({
        prompt,
        base44,
        onProgress: (event) => events.push(event),
      });

      return Response.json({ ok: true, summary, events, plan: events.find((e) => e.type === 'plan_ready')?.plan || null });
    }

    return Response.json({ error: 'Unknown action. Use: plan, execute, autonomous' }, { status: 400 });
  } catch (error: any) {
    console.error('[smaiSelfBuilder] Error:', error);
    return Response.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}