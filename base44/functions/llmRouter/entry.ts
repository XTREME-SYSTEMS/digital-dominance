import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

// ═══════════════════════════════════════════════════════════════════════════
// llmRouter — Routes LLM calls to the user's connected provider.
// If the user has a UserLLMConnection (OpenAI/Anthropic/Google), calls that
// provider's API directly. Falls back to Base44's built-in InvokeLLM if no
// connection exists. Tracks token usage per user.
//
// Actions:
//   invoke       — route an LLM call to the user's provider
//   list_connections — get the user's LLM connections
//   connect      — save a new provider API key
//   disconnect   — deactivate a connection
// ═══════════════════════════════════════════════════════════════════════════

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'invoke';

    switch (action) {
      // ── Route an LLM call ──
      case 'invoke': {
        if (!body.prompt) return Response.json({ error: 'prompt required' }, { status: 400 });

        // Find the user's active LLM connection
        const connections = await svc.entities.UserLLMConnection.filter(
          { owner_id: user.id, active: true },
          '-created_date',
          10
        );

        if (!connections || connections.length === 0) {
          const response = await base44.functions.invoke('independentAi', {
            prompt: body.prompt,
            response_json_schema: body.response_json_schema || undefined,
          });
          return Response.json({ ok: true, provider: response.data.provider, result: response.data.result, tokens_used: 0 });
        }

        const conn = connections[0];
        let responseText = '';
        let tokensUsed = 0;

        if (conn.provider === 'openai') {
          const apiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${conn.api_key}`,
            },
            body: JSON.stringify({
              model: body.model || conn.default_model || 'gpt-4o',
              messages: [{ role: 'user', content: body.prompt }],
              temperature: body.temperature ?? 0,
              max_tokens: body.max_tokens || 2000,
            }),
          });
          if (!apiRes.ok) {
            const errText = await apiRes.text();
            return Response.json({ error: `OpenAI error: ${errText}` }, { status: 502 });
          }
          const data = await apiRes.json();
          responseText = data.choices?.[0]?.message?.content || '';
          tokensUsed = data.usage?.total_tokens || 0;
        } else if (conn.provider === 'anthropic') {
          const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': conn.api_key,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: body.model || conn.default_model || 'claude-sonnet-4-20250514',
              max_tokens: body.max_tokens || 2000,
              messages: [{ role: 'user', content: body.prompt }],
            }),
          });
          if (!apiRes.ok) {
            const errText = await apiRes.text();
            return Response.json({ error: `Anthropic error: ${errText}` }, { status: 502 });
          }
          const data = await apiRes.json();
          responseText = data.content?.[0]?.text || '';
          tokensUsed = data.usage?.input_tokens + (data.usage?.output_tokens || 0) || 0;
        } else if (conn.provider === 'google') {
          const model = body.model || conn.default_model || 'gemini-1.5-pro';
          const apiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${conn.api_key}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: body.prompt }] }],
                generationConfig: { temperature: body.temperature ?? 0 },
              }),
            }
          );
          if (!apiRes.ok) {
            const errText = await apiRes.text();
            return Response.json({ error: `Google AI error: ${errText}` }, { status: 502 });
          }
          const data = await apiRes.json();
          responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          tokensUsed = data.usageMetadata?.totalTokenCount || 0;
        } else {
          return Response.json({ error: 'Unsupported provider connection' }, { status: 400 });
        }

        // Track token usage
        if (tokensUsed > 0) {
          await svc.entities.UserLLMConnection.update(conn.id, {
            tokens_used_this_month: (conn.tokens_used_this_month || 0) + tokensUsed,
          });
        }

        return Response.json({ ok: true, provider: conn.provider, result: responseText, tokens_used: tokensUsed });
      }

      // ── List user's connections ──
      case 'list_connections': {
        const conns = await svc.entities.UserLLMConnection.filter(
          { owner_id: user.id },
          '-created_date',
          20
        );
        // Mask API keys in response
        const safe = conns.map((c: any) => ({
          ...c,
          api_key: c.api_key ? c.api_key.slice(0, 8) + '...' : '',
        }));
        return Response.json({ ok: true, connections: safe });
      }

      // ── Connect a new provider ──
      case 'connect': {
        if (!body.provider || !body.api_key)
          return Response.json({ error: 'provider and api_key required' }, { status: 400 });

        // Deactivate existing connections for same provider
        const existing = await svc.entities.UserLLMConnection.filter(
          { owner_id: user.id, provider: body.provider, active: true },
          '-created_date',
          10
        );
        for (const ex of existing) {
          await svc.entities.UserLLMConnection.update(ex.id, { active: false });
        }

        const conn = await svc.entities.UserLLMConnection.create({
          owner_id: user.id,
          provider: body.provider,
          label: body.label || body.provider,
          api_key: body.api_key,
          default_model: body.default_model || '',
          available_models: body.available_models || [],
          active: true,
          connected_at: new Date().toISOString(),
        });
        return Response.json({ ok: true, connection_id: conn.id });
      }

      // ── Disconnect ──
      case 'disconnect': {
        if (!body.connection_id) return Response.json({ error: 'connection_id required' }, { status: 400 });
        await svc.entities.UserLLMConnection.update(body.connection_id, { active: false });
        return Response.json({ ok: true });
      }

      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('[llmRouter] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}