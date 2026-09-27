import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { invokeIndependentAi } from '../../shared/independentCore.ts';

// ═══════════════════════════════════════════════════════════════════════════
// memoryRouter — Agent memory retrieval and capture.
// Before an agent acts, it queries relevant memories. After acting, the
// result is summarized and stored as a new memory entry.
//
// Actions:
//   query      — retrieve relevant memories for an agent
//   capture    — store a new memory from an agent action result
//   list       — get all memories for an agent
//   decay      — reduce confidence of old, unaccessed memories
// ═══════════════════════════════════════════════════════════════════════════

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'query';

    switch (action) {
      case 'query': {
        if (!body.agent_id) return Response.json({ error: 'agent_id required' }, { status: 400 });

        const allMemories = await svc.entities.AgentMemory.filter(
          { owner_id: user.id, agent_id: body.agent_id },
          '-created_date',
          100
        );

        // Also get shared memories
        const shared = await svc.entities.AgentMemory.filter(
          { owner_id: user.id, is_shared: true },
          '-created_date',
          50
        );

        const combined = [...allMemories, ...shared];

        if (!body.query || combined.length === 0) {
          return Response.json({ ok: true, memories: combined.slice(0, 20) });
        }

        // Simple text-matching relevance search (embedding-based would be better
        // but requires a vector store — this works as a baseline)
        const queryLower = body.query.toLowerCase();
        const scored = combined.map((m: any) => {
          const contentLower = (m.content || '').toLowerCase();
          const titleLower = (m.title || '').toLowerCase();
          let score = 0;
          // Content match
          if (contentLower.includes(queryLower)) score += 10;
          // Title match
          if (titleLower.includes(queryLower)) score += 5;
          // Tag match
          if ((m.tags || []).some((t: string) => t.toLowerCase().includes(queryLower))) score += 3;
          // Word overlap
          const queryWords = queryLower.split(/\s+/).filter((w: string) => w.length > 3);
          for (const w of queryWords) {
            if (contentLower.includes(w)) score += 1;
          }
          // Boost by importance
          if (m.importance === 'critical') score *= 2;
          if (m.importance === 'high') score *= 1.5;
          return { ...m, _relevance: score };
        });

        const relevant = scored
          .filter((m: any) => m._relevance > 0)
          .sort((a: any, b: any) => b._relevance - a._relevance)
          .slice(0, 10);

        // Update access counts for retrieved memories
        for (const m of relevant) {
          await svc.entities.AgentMemory.update(m.id, {
            access_count: (m.access_count || 0) + 1,
            last_accessed_at: new Date().toISOString(),
          });
        }

        return Response.json({ ok: true, memories: relevant });
      }

      case 'capture': {
        if (!body.agent_id || !body.content)
          return Response.json({ error: 'agent_id and content required' }, { status: 400 });

        const agent = await svc.entities.AgentPersona.get(body.agent_id);

        // Summarize the content if it's long
        let title = body.title || '';
        let content = body.content;
        if (content.length > 500 && !title) {
          const summaryResult = await invokeIndependentAi(base44, {
            prompt: `Summarize the following in one sentence (max 100 chars):\n\n${content.slice(0, 2000)}`,
          });
          title = (typeof summaryResult === 'string' ? summaryResult : '').slice(0, 100);
        }

        const memory = await svc.entities.AgentMemory.create({
          owner_id: user.id,
          agent_id: body.agent_id,
          agent_short_name: agent?.short_name || '',
          category: body.category || 'general',
          memory_type: body.memory_type || 'outcome',
          title: title || 'Captured memory',
          content,
          tags: body.tags || [],
          source: body.source || 'agent_action',
          source_reference: body.source_reference || '',
          confidence: body.confidence || 0.8,
          importance: body.importance || 'medium',
          is_shared: body.is_shared || false,
          created_at: new Date().toISOString(),
        });
        return Response.json({ ok: true, memory });
      }

      case 'list': {
        const filter: any = { owner_id: user.id };
        if (body.agent_id) filter.agent_id = body.agent_id;
        if (body.category) filter.category = body.category;
        const memories = await svc.entities.AgentMemory.filter(filter, '-created_date', body.limit || 50);
        return Response.json({ ok: true, memories });
      }

      case 'decay': {
        // Reduce confidence of memories not accessed in 30+ days
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        const oldMemories = await svc.entities.AgentMemory.filter(
          { owner_id: user.id },
          '-created_date',
          200
        );
        let decayed = 0;
        for (const m of oldMemories) {
          const lastAccessed = m.last_accessed_at ? new Date(m.last_accessed_at) : new Date(m.created_date || Date.now());
          if (lastAccessed < cutoff && m.confidence > 0.3) {
            await svc.entities.AgentMemory.update(m.id, {
              confidence: Math.max(0.1, (m.confidence || 0.8) * 0.8),
            });
            decayed++;
          }
        }
        return Response.json({ ok: true, decayed_count: decayed });
      }

      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('[memoryRouter] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}