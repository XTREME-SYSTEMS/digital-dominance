import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { invokeIndependentAi } from '../../shared/independentCore.ts';

// ═══════════════════════════════════════════════════════════════════════════
// agentRunner — Executes an agent action and logs the result.
// Creates an AgentExecutionLog entry, runs the action (function invoke or
// entity CRUD), records the result, and updates the agent's last_active_at.
//
// Actions:
//   execute       — run a specific agent action
//   get_logs      — get execution logs for an agent
//   get_status    — get live status of all agents (idle/running/error)
// ═══════════════════════════════════════════════════════════════════════════

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'execute';

    switch (action) {
      case 'execute': {
        if (!body.action_id) return Response.json({ error: 'action_id required' }, { status: 400 });

        const agentAction = await svc.entities.AgentAction.get(body.action_id);
        if (!agentAction) return Response.json({ error: 'Action not found' }, { status: 404 });

        const agent = await svc.entities.AgentPersona.get(agentAction.agent_id);
        if (!agent) return Response.json({ error: 'Agent not found' }, { status: 404 });

        // Create execution log
        const log = await svc.entities.AgentExecutionLog.create({
          owner_id: user.id,
          agent_id: agent.id,
          agent_name: agent.name,
          action_id: agentAction.id,
          action_title: agentAction.title,
          status: 'running',
          started_at: new Date().toISOString(),
          trigger: body.trigger || 'manual',
        });

        const startTime = Date.now();
        let result = '';
        let errorMsg = '';
        let tokensConsumed = 0;

        try {
          if (agentAction.action_type === 'function_invoke' && agentAction.target_function) {
            // Invoke the backend function
            const fnResult = await base44.functions.invoke(
              agentAction.target_function,
              agentAction.parameters || {}
            );
            result = JSON.stringify(fnResult?.data || fnResult || {}).slice(0, 5000);
          } else if (agentAction.action_type === 'entity_crud' && agentAction.target_entity) {
            const entityName = agentAction.target_entity;
            const op = agentAction.entity_operation;
            const params = agentAction.parameters || {};
            if (op === 'create') {
              const r = await svc.entities[entityName].create(params);
              result = JSON.stringify(r).slice(0, 5000);
            } else if (op === 'list') {
              const r = await svc.entities[entityName].list('-created_date', 20);
              result = JSON.stringify(r).slice(0, 5000);
            } else if (op === 'filter') {
              const r = await svc.entities[entityName].filter(params.filter || {}, '-created_date', 20);
              result = JSON.stringify(r).slice(0, 5000);
            } else if (op === 'update' && params.id) {
              const r = await svc.entities[entityName].update(params.id, params.data || {});
              result = JSON.stringify(r).slice(0, 5000);
            } else if (op === 'delete' && params.id) {
              await svc.entities[entityName].delete(params.id);
              result = 'Deleted successfully';
            } else {
              result = `Unsupported entity operation: ${op}`;
            }
          } else if (agentAction.action_type === 'communication') {
            // Use LLM to generate a response as the agent
            const llmResult = await invokeIndependentAi(base44, {
              prompt: `${agent.system_prompt || 'You are ' + agent.name}\n\nTask: ${agentAction.title}\nDescription: ${agentAction.description || ''}\nParameters: ${JSON.stringify(agentAction.parameters || {})}\n\nPerform this task and provide the result.`,
            });
            result = typeof llmResult === 'string' ? llmResult : JSON.stringify(llmResult);
            tokensConsumed = result.length / 4; // rough estimate
          } else {
            result = `Action type ${agentAction.action_type} not yet supported`;
          }

          // Update log with success
          await svc.entities.AgentExecutionLog.update(log.id, {
            status: 'completed',
            completed_at: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
            result,
            tokens_consumed: tokensConsumed,
          });

          // Update agent action stats
          await svc.entities.AgentAction.update(agentAction.id, {
            status: 'completed',
            last_run_at: new Date().toISOString(),
            last_result: result.slice(0, 500),
            execution_count: (agentAction.execution_count || 0) + 1,
            success_count: (agentAction.success_count || 0) + 1,
          });

          // Update agent last active
          await svc.entities.AgentPersona.update(agent.id, {
            last_active_at: new Date().toISOString(),
          });

          return Response.json({ ok: true, log_id: log.id, result });
        } catch (execError) {
          errorMsg = execError.message;
          await svc.entities.AgentExecutionLog.update(log.id, {
            status: 'failed',
            completed_at: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
            error: errorMsg,
          });
          await svc.entities.AgentAction.update(agentAction.id, {
            status: 'failed',
            last_run_at: new Date().toISOString(),
            last_error: errorMsg,
            execution_count: (agentAction.execution_count || 0) + 1,
            failure_count: (agentAction.failure_count || 0) + 1,
          });
          return Response.json({ ok: false, error: errorMsg, log_id: log.id }, { status: 500 });
        }
      }

      case 'get_logs': {
        const filter: any = { owner_id: user.id };
        if (body.agent_id) filter.agent_id = body.agent_id;
        const logs = await svc.entities.AgentExecutionLog.filter(filter, '-created_date', body.limit || 50);
        return Response.json({ ok: true, logs });
      }

      case 'get_status': {
        const agents = await svc.entities.AgentPersona.filter(
          { owner_id: user.id, active: true },
          '-created_date',
          100
        );
        const recentLogs = await svc.entities.AgentExecutionLog.filter(
          { owner_id: user.id },
          '-created_date',
          50
        );

        const status = agents.map((a: any) => {
          const agentLogs = recentLogs.filter((l: any) => l.agent_id === a.id);
          const lastLog = agentLogs[0];
          return {
            agent_id: a.id,
            name: a.name,
            short_name: a.short_name,
            status: lastLog?.status || 'idle',
            last_action: lastLog?.action_title || '—',
            last_run: lastLog?.started_at || a.last_active_at || '—',
            execution_count: agentLogs.length,
            last_error: lastLog?.status === 'failed' ? lastLog.error : null,
          };
        });
        return Response.json({ ok: true, agents: status });
      }

      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('[agentRunner] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}