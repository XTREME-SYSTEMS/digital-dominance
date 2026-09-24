import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { invokeIndependentAi } from '../../shared/independentCore.ts';

// ═══════════════════════════════════════════════════════════════════════════
// conversationHub — Slack-style group conversations with users + AI agents.
//
// Users create channels, add their agents, and chat together. When a user
// sends a message, the addressed agent (or default agent) responds via LLM
// using its master system prompt + conversation history as context.
//
// Actions:
//   create_conversation  — create a new channel
//   list_conversations    — get all conversations for the current user
//   get_conversation      — get a single conversation with members
//   get_messages          — get messages for a conversation
//   send_message          — save user message + trigger agent response
//   add_member            — add a user or agent to a conversation
//   add_my_agents         — add all active agents to a conversation
//   list_agents           — list all active agent personas
// ═══════════════════════════════════════════════════════════════════════════

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'list_conversations';
    const userName = user.full_name || user.email;

    switch (action) {
      // ── Create a new conversation ──
      case 'create_conversation': {
        if (!body.name) return Response.json({ error: 'name required' }, { status: 400 });
        const conv = await svc.entities.Conversation.create({
          name: body.name,
          type: body.type || 'group',
          description: body.description || '',
          member_user_ids: [user.id],
          member_agent_ids: [],
          members: [{ member_type: 'user', member_id: user.id, member_name: userName }],
          is_private: body.is_private || false,
          last_message_at: new Date().toISOString(),
          last_message_preview: '',
        });
        return Response.json({ ok: true, conversation: conv });
      }

      // ── List conversations for this user ──
      case 'list_conversations': {
        const allConvs = await svc.entities.Conversation.list('-last_message_at', 100);
        const userConvs = allConvs.filter((c: any) =>
          (c.member_user_ids || []).includes(user.id)
        );
        return Response.json({ ok: true, conversations: userConvs });
      }

      // ── Get a single conversation ──
      case 'get_conversation': {
        if (!body.conversation_id) return Response.json({ error: 'conversation_id required' }, { status: 400 });
        const conv = await svc.entities.Conversation.get(body.conversation_id);
        if (!conv) return Response.json({ error: 'Conversation not found' }, { status: 404 });
        return Response.json({ ok: true, conversation: conv });
      }

      // ── Get messages for a conversation ──
      case 'get_messages': {
        if (!body.conversation_id) return Response.json({ error: 'conversation_id required' }, { status: 400 });
        const messages = await svc.entities.ConversationMessage.filter(
          { conversation_id: body.conversation_id },
          'created_date',
          100
        );
        return Response.json({ ok: true, messages: messages.reverse() });
      }

      // ── Send a message and trigger agent response ──
      case 'send_message': {
        if (!body.conversation_id || !body.content)
          return Response.json({ error: 'conversation_id and content required' }, { status: 400 });

        // 1. Save the user's message
        const message = await svc.entities.ConversationMessage.create({
          conversation_id: body.conversation_id,
          sender_type: 'user',
          sender_id: user.id,
          sender_name: userName,
          content: body.content,
          mentioned_agent_id: body.mentioned_agent_id || null,
        });

        // 2. Update conversation preview
        await svc.entities.Conversation.update(body.conversation_id, {
          last_message_at: new Date().toISOString(),
          last_message_preview: body.content.slice(0, 100),
        });

        // 3. Get conversation to find agent members
        const conv = await svc.entities.Conversation.get(body.conversation_id);
        const agentIds: string[] = conv.member_agent_ids || [];

        // 4. Determine which agent(s) should respond
        let respondingAgents: any[] = [];
        if (body.mentioned_agent_id && agentIds.includes(body.mentioned_agent_id)) {
          const agent = await svc.entities.AgentPersona.get(body.mentioned_agent_id);
          if (agent) respondingAgents = [agent];
        } else if (agentIds.length > 0) {
          // Default: first agent in the conversation responds
          const agent = await svc.entities.AgentPersona.get(agentIds[0]);
          if (agent) respondingAgents = [agent];
        }

        // 5. Generate agent responses
        const agentResponses: any[] = [];
        for (const agent of respondingAgents) {
          // Get recent messages for context
          const recent = await svc.entities.ConversationMessage.filter(
            { conversation_id: body.conversation_id },
            '-created_date',
            20
          );
          const history = recent.reverse().map((m: any) =>
            `${m.sender_name} (${m.sender_type}): ${m.content}`
          ).join('\n');

          // Call LLM with agent's system prompt + conversation history
          const systemPrompt = agent.system_prompt || `You are ${agent.name}, a helpful AI agent.`;
          const llmResult = await invokeIndependentAi(base44, {
            prompt: `${systemPrompt}\n\n=== CONVERSATION ===\n${history}\n\n=== INSTRUCTIONS ===\nRespond to the conversation naturally and concisely as ${agent.name}. Stay in character. If the message is directed at you, respond helpfully. Keep responses under 200 words unless detail is needed.`,
          });

          const responseText = typeof llmResult === 'string'
            ? llmResult
            : (llmResult as any)?.text || (llmResult as any)?.result || 'I understand. Let me process that.';

          const agentMsg = await svc.entities.ConversationMessage.create({
            conversation_id: body.conversation_id,
            sender_type: 'agent',
            sender_id: agent.id,
            sender_name: agent.name,
            content: responseText,
            agent_persona_id: agent.id,
          });
          agentResponses.push(agentMsg);
        }

        // 6. Update conversation preview with last agent response
        if (agentResponses.length > 0) {
          const lastResp = agentResponses[agentResponses.length - 1];
          await svc.entities.Conversation.update(body.conversation_id, {
            last_message_at: new Date().toISOString(),
            last_message_preview: lastResp.content.slice(0, 100),
          });
        }

        return Response.json({ ok: true, message, agent_responses: agentResponses });
      }

      // ── Add a member (user or agent) to a conversation ──
      case 'add_member': {
        if (!body.conversation_id) return Response.json({ error: 'conversation_id required' }, { status: 400 });
        const conv = await svc.entities.Conversation.get(body.conversation_id);
        let memberUserIds: string[] = conv.member_user_ids || [];
        let memberAgentIds: string[] = conv.member_agent_ids || [];
        let members: any[] = conv.members || [];

        if (body.member_type === 'user' && body.member_id && !memberUserIds.includes(body.member_id)) {
          memberUserIds.push(body.member_id);
          members.push({ member_type: 'user', member_id: body.member_id, member_name: body.member_name || '' });
        }
        if (body.member_type === 'agent' && body.member_id && !memberAgentIds.includes(body.member_id)) {
          memberAgentIds.push(body.member_id);
          members.push({ member_type: 'agent', member_id: body.member_id, member_name: body.member_name || '' });
        }

        await svc.entities.Conversation.update(body.conversation_id, {
          member_user_ids: memberUserIds,
          member_agent_ids: memberAgentIds,
          members,
        });
        return Response.json({ ok: true, members });
      }

      // ── Add all active agents to a conversation ──
      case 'add_my_agents': {
        if (!body.conversation_id) return Response.json({ error: 'conversation_id required' }, { status: 400 });
        const allAgents = await svc.entities.AgentPersona.filter({ active: true }, '-created_date', 100);
        const conv = await svc.entities.Conversation.get(body.conversation_id);
        let memberAgentIds: string[] = conv.member_agent_ids || [];
        let members: any[] = conv.members || [];

        for (const agent of allAgents) {
          if (!memberAgentIds.includes(agent.id)) {
            memberAgentIds.push(agent.id);
            members.push({ member_type: 'agent', member_id: agent.id, member_name: agent.name });
          }
        }

        await svc.entities.Conversation.update(body.conversation_id, {
          member_agent_ids: memberAgentIds,
          members,
        });
        return Response.json({ ok: true, agent_count: memberAgentIds.length });
      }

      // ── List all active agents (for adding to conversations) ──
      case 'list_agents': {
        const agents = await svc.entities.AgentPersona.filter({ active: true }, '-created_date', 100);
        return Response.json({
          ok: true,
          agents: agents.map((a: any) => ({
            id: a.id,
            name: a.name,
            short_name: a.short_name,
            persona_type: a.persona_type,
          })),
        });
      }

      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('[conversationHub] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}