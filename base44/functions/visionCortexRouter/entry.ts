import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { invokeIndependentAi } from '../../shared/independentCore.ts';

// ════════════════════════════════════════════════════════════════
// visionCortexRouter
// Backend authority for Shadow Vision Cortex reasoning.
// Loads live fleet state, constructs the operating prompt with
// real evidence, calls the model, validates the structured
// response, creates OperatorIntent when actionable, and persists
// the conversation message durably.
// ════════════════════════════════════════════════════════════════

const VISION_CORTEX_PROMPT = `You are SHADOW VISION CORTEX — the conversational command and intelligence interface for the XTREME universal autonomous operating fabric.

=== YOUR IDENTITY ===
You are NOT a production mutation agent. You are the operator's eyes, ears, and voice into the fleet. You interpret intent, explain status, and route work — but you never directly bypass the orchestration system.

=== YOUR CAPABILITIES ===
1. INTENT INTERPRETATION — Convert operator language into structured OperatorIntent records
2. FLEET STATUS — Explain what systems are healthy, broken, closest to launch, blocking release
3. SYSTEM INTERROGATION — Answer questions about any registered system
4. WORK CREATION — Create actionable intents that Fleet Alpha Prime will execute
5. APPROVAL ROUTING — Identify what needs operator approval
6. KNOWLEDGE RETRIEVAL — Retrieve evidence and proof for any claim
7. INCIDENT EXPLANATION — Explain what failed and why
8. DECISION SUPPORT — Help the operator decide what to prioritize

=== YOUR BEHAVIOR RULES ===
- You NEVER invent state. If you don't have data, say so.
- You ALWAYS provide evidence. Claims without receipts are advisory.
- You NEVER directly execute mutations. You create OperatorIntent records that Fleet Alpha Prime picks up.
- You ALWAYS be concise. 3-6 sentences unless asked for depth.
- You ALWAYS think in systems. Find root causes, not symptoms.
- You ALWAYS convert operator requests into structured intents when actionable.
- For harmless diagnostic or query requests, set risk="low" and approval_policy="auto".
- For anything that could mutate production state, set risk="medium" or "high" and approval_policy="operator_required".

=== OPERATOR INTENT FORMAT ===
When the operator asks you to do something actionable, respond with BOTH:
1. A natural language explanation
2. A structured intent block in the JSON response

For pure queries (status checks, questions), set scope="query" and do not create an intent.
For actionable requests, set scope to one of: fleet, system, workflow, agent, benchmark, repair, deployment, research, approval.

Keep responses concise and actionable. Speak in certainties when you have evidence. Say "I don't have enough data" when you don't.`;

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json();
    const { message, conversation_id, operator_id } = body;

    if (!message || typeof message !== 'string') {
      return Response.json({ error: 'message is required' }, { status: 400 });
    }

    const svc = base44.asServiceRole;
    const now = new Date().toISOString();

    // ── Load live fleet state ──
    const [fleetSystems, pendingIntents, completedIntents, openGaps, activeRepairJobs, recentResults, recentHeartbeats, recentReceipts] = await Promise.all([
      svc.entities.FleetSystem.filter({ active: true }, '-created_date', 50),
      svc.entities.OperatorIntent.filter({ status: 'pending' }, '-created_date', 20),
      svc.entities.OperatorIntent.filter({ status: 'completed' }, '-created_date', 10),
      svc.entities.OptimizationGap.filter({ status: 'open' }, '-repair_priority_score', 20),
      svc.entities.RepairJob.filter({ status: ['queued', 'in_progress', 'blocked'] }, '-created_date', 20),
      svc.entities.BenchmarkResult.list('-created_date', 50),
      svc.entities.FleetHeartbeat.list('-created_date', 1),
      svc.entities.EvidenceReceipt.list('-created_date', 10),
    ]);

    // ── Build fleet context from evidence ──
    let fleetContext = `\n=== LIVE FLEET STATE (from evidence) ===\n`;
    fleetContext += `Systems registered: ${fleetSystems.length}\n`;
    fleetSystems.forEach(s => {
      fleetContext += `- ${s.system_id} (${s.name}) | type=${s.system_type} | mode=${s.current_mode} | score=${s.global_score}/100 | P0=${s.p0_count} | P1=${s.p1_count} | benchmarks=${s.total_benchmarks} | bootstrap=${s.bootstrap_container}\n`;
    });
    fleetContext += `\nPending Intents: ${pendingIntents.length}\n`;
    fleetContext += `Open Gaps (top 20): ${openGaps.length}\n`;
    if (openGaps.length > 0) {
      openGaps.slice(0, 5).forEach(g => {
        fleetContext += `  - [${g.severity}] ${g.system_id}/${g.benchmark_id}: target=${g.target} actual=${g.actual} (priority=${g.repair_priority_score})\n`;
      });
    }
    fleetContext += `Active Repair Jobs: ${activeRepairJobs.length}\n`;
    if (activeRepairJobs.length > 0) {
      activeRepairJobs.slice(0, 5).forEach(j => {
        fleetContext += `  - ${j.system_id}/${j.benchmark_id} status=${j.status} risk=${j.risk} approval=${j.approval_required}\n`;
      });
    }
    fleetContext += `\nRecently Completed Intents: ${completedIntents.length}\n`;
    if (completedIntents.length > 0) {
      completedIntents.slice(0, 5).forEach(i => {
        fleetContext += `  - ${i.intent_id} | scope=${i.scope} | system=${i.system_id} | result=${(i.result || '').slice(0, 120)}\n`;
      });
    }
    fleetContext += `\nRecent Evidence Receipts: ${recentReceipts.length}\n`;
    if (recentReceipts.length > 0) {
      recentReceipts.slice(0, 5).forEach(r => {
        fleetContext += `  - ${r.receipt_id} | system=${r.system_id} | type=${r.evidence_type} | desc=${(r.evidence_description || '').slice(0, 100)}\n`;
      });
    }
    const lastHeartbeat = recentHeartbeats[0];
    if (lastHeartbeat) {
      const ageMin = (Date.now() - new Date(lastHeartbeat.completed_at || lastHeartbeat.started_at).getTime()) / 60000;
      fleetContext += `Last Fleet Heartbeat: ${ageMin.toFixed(1)} min ago | status=${lastHeartbeat.status} | systems_checked=${lastHeartbeat.systems_checked} | intents_routed=${lastHeartbeat.intents_routed}\n`;
    } else {
      fleetContext += `Last Fleet Heartbeat: NEVER (heartbeat not yet proven)\n`;
    }
    fleetContext += `=== END FLEET STATE ===\n`;

    // ── Load conversation history (durable memory) ──
    let conversation = null;
    let historyMessages: any[] = [];
    if (conversation_id) {
      const existing = await svc.entities.VisionConversation.filter({ conversation_id }, '-started_at', 1);
      conversation = existing[0];
      if (conversation) {
        historyMessages = await svc.entities.VisionMessage.filter({ conversation_id }, 'timestamp', 20);
      }
    }
    if (!conversation) {
      const newConvId = conversation_id || `conv-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      conversation = await svc.entities.VisionConversation.create({
        conversation_id: newConvId,
        operator_id: operator_id || user.id,
        operator_email: user.email,
        title: message.slice(0, 80),
        started_at: now,
        last_message_at: now,
        status: 'active',
        systems_referenced: [],
        intent_ids: [],
        message_count: 0,
      });
    }

    // ── Persist user message ──
    const userMsgId = `msg-${Date.now()}-u-${Math.random().toString(36).substring(2, 8)}`;
    await svc.entities.VisionMessage.create({
      message_id: userMsgId,
      conversation_id: conversation.conversation_id,
      role: 'user',
      content: message,
      operator_id: operator_id || user.id,
      timestamp: now,
    });

    // ── Build conversation history context ──
    let historyContext = '';
    if (historyMessages.length > 0) {
      historyContext = `\n=== CONVERSATION HISTORY ===\n`;
      historyMessages.slice(-10).forEach(m => {
        historyContext += `${m.role}: ${m.content}\n`;
      });
      historyContext += `=== END HISTORY ===\n`;
    }

    // ── Call the model with FULL prompt + context ──
    const fullPrompt = VISION_CORTEX_PROMPT + fleetContext + historyContext + `\n=== OPERATOR MESSAGE ===\n${message}\n=== END OPERATOR MESSAGE ===\n\nRespond with a JSON object containing "response" (natural language) and optionally "intent" (structured) and "systems_referenced" (array of system_ids).`;

    const jsonSchema = {
      type: 'object' as const,
      properties: {
        response: { type: 'string', description: 'Natural language response to the operator' },
        systems_referenced: { type: 'array', items: { type: 'string' } },
        intent: {
          type: 'object',
          properties: {
            system_id: { type: 'string' },
            objective: { type: 'string' },
            scope: { type: 'string' },
            priority: { type: 'string' },
            constraints: { type: 'array', items: { type: 'string' } },
            risk: { type: 'string' },
            approval_policy: { type: 'string' },
            target_benchmarks: { type: 'array', items: { type: 'string' } },
          },
        },
      },
      required: ['response'],
    };
    const llmRes: any = await invokeIndependentAi(base44, {
      prompt: fullPrompt,
      response_json_schema: jsonSchema,
    });
    if (!llmRes?.response) throw new Error('Independent AI did not return a response');

    const aiResponse = (llmRes as any).response || 'I am here. How can I help you govern the fleet?';
    const intent = (llmRes as any).intent;
    const systemsReferenced = (llmRes as any).systems_referenced || [];

    // ── Create OperatorIntent if actionable ──
    let createdIntent = null;
    if (intent && intent.objective && intent.scope && intent.scope !== 'query') {
      const intentId = `intent-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      createdIntent = await svc.entities.OperatorIntent.create({
        intent_id: intentId,
        system_id: intent.system_id || 'fleet',
        operator_input: message,
        interpreted_objective: intent.objective,
        scope: intent.scope,
        priority: intent.priority || 'medium',
        constraints: intent.constraints || [],
        risk: intent.risk || 'low',
        target_benchmarks: intent.target_benchmarks || [],
        approval_policy: intent.approval_policy || 'auto',
        status: 'pending',
        created_at: now,
      });

      // Link intent to conversation
      const intentIds = [...(conversation.intent_ids || []), intentId];
      const systemsRef = [...new Set([...(conversation.systems_referenced || []), ...(systemsReferenced || []), intent.system_id].filter(Boolean))];
      await svc.entities.VisionConversation.update(conversation.id, {
        intent_ids: intentIds,
        systems_referenced: systemsRef,
        last_message_at: now,
        message_count: (conversation.message_count || 0) + 2,
      });
    } else {
      await svc.entities.VisionConversation.update(conversation.id, {
        last_message_at: now,
        message_count: (conversation.message_count || 0) + 2,
      });
    }

    // ── Persist assistant message ──
    const assistantMsgId = `msg-${Date.now()}-a-${Math.random().toString(36).substring(2, 8)}`;
    await svc.entities.VisionMessage.create({
      message_id: assistantMsgId,
      conversation_id: conversation.conversation_id,
      role: 'assistant',
      content: aiResponse,
      operator_id: operator_id || user.id,
      timestamp: now,
      intent_id: createdIntent?.intent_id || null,
      systems_referenced: systemsReferenced,
      evidence_refs: [],
      model_used: 'independent-ai',
    });

    return Response.json({
      ok: true,
      conversation_id: conversation.conversation_id,
      response: aiResponse,
      intent: createdIntent ? {
        intent_id: createdIntent.intent_id,
        system_id: createdIntent.system_id,
        objective: createdIntent.interpreted_objective,
        scope: createdIntent.scope,
        priority: createdIntent.priority,
        risk: createdIntent.risk,
        approval_policy: createdIntent.approval_policy,
      } : null,
      systems_referenced: systemsReferenced,
      evidence: {
        fleet_systems_loaded: fleetSystems.length,
        pending_intents: pendingIntents.length,
        open_gaps: openGaps.length,
        active_repair_jobs: activeRepairJobs.length,
        last_heartbeat: lastHeartbeat ? lastHeartbeat.heartbeat_id : null,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: error.status === 503 ? 503 : 500 });
  }
}