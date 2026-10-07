import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { patchCore } from '../../shared/aiGateway.ts';

// ─────────────────────────────────────────────────────────────────────────────
// runContractorSimulation
// Narrow, app-specific backend wrapper for the Contractor Simulation System.
// Moves the restricted InvokeLLM Core Integration call off the client so
// integration credits are protected behind admin auth.
//
// Actions:
//   archetype — simulate a contractor archetype evaluating the system
//   visitor   — simulate a visitor browsing the estimate website
//
// The response JSON schemas are fixed server-side per simulation type;
// the client passes only the persona prompt and the type.
// ─────────────────────────────────────────────────────────────────────────────

const SCHEMAS: Record<string, any> = {
  archetype: {
    type: 'object',
    properties: {
      archetype_name: { type: 'string' },
      overall_score: { type: 'number' },
      category_scores: { type: 'object' },
      honest_opinion: { type: 'string' },
      would_buy: { type: 'boolean' },
      biggest_concern: { type: 'string' },
      favorite_feature: { type: 'string' },
    },
  },
  visitor: {
    type: 'object',
    properties: {
      visitor_name: { type: 'string' },
      pages_visited: { type: 'array', items: { type: 'string' } },
      thoughts: { type: 'string' },
      converted: { type: 'boolean' },
      conversion_reason: { type: 'string' },
      objections: { type: 'array', items: { type: 'string' } },
      lead_score: { type: 'number' },
    },
  },
};

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { simulation_type, prompt } = body;

    if (!simulation_type || !SCHEMAS[simulation_type]) {
      return Response.json({ error: 'simulation_type must be "archetype" or "visitor"' }, { status: 400 });
    }
    if (!prompt || typeof prompt !== 'string') {
      return Response.json({ error: 'prompt is required' }, { status: 400 });
    }

    const svc = base44.asServiceRole;
    patchCore(base44);
    patchCore(svc);
    const result = await svc.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: SCHEMAS[simulation_type],
    });

    return Response.json({ ok: true, result });
  } catch (error) {
    console.error('[runContractorSimulation] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}