import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { invokeIndependentAi } from '../../shared/independentCore.ts';

// ═══════════════════════════════════════════════════════════════════════════
// agentRouter — Agent-to-agent communication protocol.
// Receives a goal, determines which agent(s) should handle it, sends
// SwarmMessages to those agents, executes their actions, and collects results.
//
// Actions:
//   route_goal    — analyze a goal and dispatch to the right agent(s)
//   send_message  — send a direct message from one agent to another
//   get_messages  — get swarm messages for an agent
//   get_handoffs   — get handoff messages (agent delegating to another)
// ═══════════════════════════════════════════════════════════════════════════

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'route_goal';

    switch (action) {
      case 'route_goal': {
        if (!body.goal) return Response.json({ error: 'goal required' }, { status: 400 });

        // Get user's active agents
        const agents = await svc.entities.AgentPersona.filter(
          { owner_id: user.id, active: true },
          '-created_date',
          50
        );

        if (!agents || agents.length === 0) {
          return Response.json({ error: 'No active agents found. Build an agent fleet first.' }, { status: 400 });
        }

        // Use LLM to determine which agent(s) should handle this goal
        const agentList = agents.map((a: any) => ({
          id: a.id,
          name: a.name,
          short_name: a.short_name,
          persona_type: a.persona_type,
          assigned_context: a.assigned_context || '',
        }));

        const routingResult = await invokeIndependentAi(base44, {
          prompt: `You are an agent router. Given a goal and a list of agents, determine which agent(s) should handle it.

GOAL: ${body.goal}

AVAILABLE AGENTS:
${JSON.stringify(agentList, null, 2)}

Respond with a JSON object containing:
- "selected_agents": array of agent IDs that should handle this goal (max 3)
- "reasoning": brief explanation of why these agents
- "task_breakdown": object mapping each selected agent ID to their specific subtask`,
          response_json_schema: {
            type: 'object',
            properties: {
              selected_agents: { type: 'array', items: { type: 'string' } },
              reasoning: { type: 'string' },
              task_breakdown: { type: 'string' },
            },
          },
        });

        const selectedIds = (routingResult as any)?.selected_agents || [];
        const reasoning = (routingResult as any)?.reasoning || '';
        const taskBreakdown = (routingResult as any)?.task_breakdown || '';

        // Send SwarmMessages to selected agents and execute their actions
        const results = [];
        for (const agentId of selectedIds) {
          const agent = agents.find((a: any) => a.id === agentId);
          if (!agent) continue;

          // Create a SwarmMessage (directive to the agent)
          const msg = await svc.entities.SwarmMessage.create({
            from_agent: 'orchestrator',
            to_agent: agent.id,
            message_type: 'directive',
            content: `Goal: ${body.goal}\n\nYour task: ${taskBreakdown}`,
            read: false,
          });

          // Find the agent's active actions and execute the first one
          const actions = await svc.entities.AgentAction.filter(
            { agent_id: agent.id, status: 'active' },
            'order',
            5
          );

          if (actions.length > 0) {
            // Execute via agentRunner
            const execResult = await base44.functions.invoke('agentRunner', {
              action: 'execute',
              action_id: actions[0].id,
              trigger: 'agent_router',
            });
            results.push({
              agent_id: agent.id,
              agent_name: agent.name,
              message_id: msg.id,
              execution: execResult?.data,
            });
          } else {
            // No actions — generate a response via LLM
            const llmRes = await invokeIndependentAi(base44, {
              prompt: `${agent.system_prompt || 'You are ' + agent.name}\n\nGoal: ${body.goal}\n\nProvide your analysis and recommended actions.`,
            });
            results.push({
              agent_id: agent.id,
              agent_name: agent.name,
              message_id: msg.id,
              response: typeof llmRes === 'string' ? llmRes : JSON.stringify(llmRes),
            });
          }
        }

        return Response.json({
          ok: true,
          reasoning,
          task_breakdown: taskBreakdown,
          selected_agents: selectedIds,
          results,
        });
      }

      case 'send_message': {
        if (!body.from_agent || !body.to_agent || !body.content)
          return Response.json({ error: 'from_agent, to_agent, and content required' }, { status: 400 });

        const msg = await svc.entities.SwarmMessage.create({
          from_agent: body.from_agent,
          to_agent: body.to_agent,
          message_type: body.message_type || 'query',
          content: body.content,
          related_task_id: body.related_task_id || '',
          read: false,
        });
        return Response.json({ ok: true, message: msg });
      }

      case 'get_messages': {
        const filter: any = {};
        if (body.agent_id) {
          filter.$or = [{ to_agent: body.agent_id }, { from_agent: body.agent_id }];
        }
        const messages = await svc.entities.SwarmMessage.filter(filter, '-created_date', 50);
        return Response.json({ ok: true, messages });
      }

      case 'get_handoffs': {
        const messages = await svc.entities.SwarmMessage.filter(
          { message_type: 'handoff' },
          '-created_date',
          50
        );
        return Response.json({ ok: true, messages });
      }

      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('[agentRouter] Error:', error.message);
    return Response.json({ error: error.message }, { status: error.status === 503 ? 503 : 500 });
  }
}