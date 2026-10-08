import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { secrets } from 'base44:runtime';
import { completeGateway } from '../../shared/aiGateway.ts';
import { runOperator } from '../../shared/operatorLoop.js';
import { executeHostedTool } from '../../shared/operatorHosted.js';
import { withRetry, withFallback, CircuitBreaker } from '../../shared/resilience.ts';

// ═══════════════════════════════════════════════════════════════════════════
// independentAgentRunner — Runs AI agents WITHOUT Base44 integration credits.
//
// Routes all agent LLM calls through Vercel AI Gateway (own billing).
// Supports tool-calling loops, entity access, and backend function invocation.
// This replaces the Base44-billed in-app agent chat runtime.
// ═══════════════════════════════════════════════════════════════════════════

const breaker = new CircuitBreaker(5, 30000);

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // ── runAgent: Execute an agent conversation turn ──
    if (action === 'runAgent') {
      const { agent_name, message, history, context } = body;
      if (!agent_name || !message) {
        return Response.json({ error: 'agent_name and message required' }, { status: 400 });
      }

      // Load agent config
      let agentConfig: any = null;
      try {
        const agents = await base44.asServiceRole.entities.AgentPersona.filter(
          { name: agent_name },
          { limit: 1 }
        );
        agentConfig = agents.items?.[0] || null;
      } catch {
        // AgentPersona might not exist — use default
      }

      const systemPrompt = agentConfig?.system_prompt ||
        `You are ${agent_name}, an autonomous AI agent in the Xtreme Polishing Systems dominance engine. ` +
        `You have access to entity data and backend functions. Execute tasks efficiently and report results clearly.`;

      // Build context from entity data if provided
      let contextStr = '';
      if (context?.entities && Array.isArray(context.entities)) {
        for (const ent of context.entities) {
          try {
            const records = await base44.asServiceRole.entities[ent.entity]?.filter(
              ent.query || {},
              { limit: ent.limit || 10, fields: ent.fields }
            );
            if (records?.items) {
              contextStr += `\n${ent.entity}: ${JSON.stringify(records.items).slice(0, 2000)}\n`;
            }
          } catch { /* skip */ }
        }
      }

      // Route through Vercel AI Gateway (NOT Base44 Core)
      const result = await breaker.execute(async () => {
        return await withRetry(
          async () => {
            const res = await completeGateway({
              model: 'anthropic/claude-opus-4.7',
              messages: [
                { role: 'system', content: systemPrompt + (contextStr ? `\n\nContext:\n${contextStr}` : '') },
                ...(Array.isArray(history) ? history : []),
                { role: 'user', content: message },
              ],
            });
            return res;
          },
          { maxAttempts: 3, retryableErrors: ['timeout', '5xx', 'rate_limit'] }
        );
      });

      // Log the agent execution
      try {
        await base44.asServiceRole.entities.AgentExecutionLog.create({
          agent_name,
          action: 'chat',
          input_message: message?.slice(0, 5000),
          output_response: (result.text || '').slice(0, 5000),
          status: 'completed',
          executed_at: new Date().toISOString(),
        });
      } catch { /* logging is best-effort */ }

      return Response.json({
        ok: true,
        response: result.text,
        usage: result.usage,
        model: result.model,
        agent: agent_name,
        independent: true, // confirms this did NOT use Base44 credits
      });
    }

    // ── runOperator: Tool-calling loop (replaces Base44 agent chat) ──
    if (action === 'runOperator') {
      if (user.role !== 'admin') {
        return Response.json({ error: 'Only admins can run operator tools' }, { status: 403 });
      }

      const { message: msg, history: hist } = body;
      if (!msg) return Response.json({ error: 'message required' }, { status: 400 });

      const result = await runOperator({
        message: msg,
        history: Array.isArray(hist) ? hist : [],
        runtime: 'independent',
        complete: (payload) => completeGateway({ model: 'anthropic/claude-opus-4.7', ...payload }),
        execute: (name, args) => executeHostedTool(base44, name, args),
      });

      return Response.json({ ok: true, ...result, independent: true });
    }

    // ── listAgents: List all available agent personas ──
    if (action === 'listAgents') {
      try {
        const agents = await base44.asServiceRole.entities.AgentPersona.filter(
          {},
          { limit: 50, fields: ['name', 'role', 'status', 'system_prompt'] }
        );
        return Response.json({ ok: true, agents: agents.items || [], independent: true });
      } catch {
        return Response.json({ ok: true, agents: [], note: 'AgentPersona entity not configured' });
      }
    }

    // ── status: Check if independent agent runtime is available ──
    if (action === 'status') {
      const hasGateway = !!secrets.get('VERCEL_AI_GATEWAY_API_KEY');
      return Response.json({
        ok: true,
        independent: hasGateway,
        runtime: 'vercel-ai-gateway',
        billing: 'independent (NOT Base44 credits)',
        circuitBreaker: breaker.getState(),
      });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('[independentAgentRunner] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}