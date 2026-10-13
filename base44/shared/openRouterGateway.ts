import { secrets } from 'base44:runtime';

// ─────────────────────────────────────────────────────────────────────────────
// openRouterGateway — OpenRouter AI Gateway helper (OpenAI-compatible).
//
// Drop-in replacement for the Vercel AI Gateway's completeGateway().
// Routes LLM calls through OpenRouter (multi-model aggregator) which has its
// own billing separate from Vercel AI Gateway credits.
//
// Usage (same signature as completeGateway):
//   import { completeGateway } from '../../shared/openRouterGateway.ts';
//   const data = await completeGateway({ model, messages, tools, ... });
// ─────────────────────────────────────────────────────────────────────────────

const GATEWAY_BASE = 'https://openrouter.ai/api/v1';

// Map Vercel AI Gateway model names to OpenRouter model IDs
const MODEL_MAP: Record<string, string> = {
  'anthropic/claude-opus-4.7': 'anthropic/claude-3.5-sonnet',
  'anthropic/claude-opus-4.8': 'anthropic/claude-3.5-sonnet',
  'anthropic/claude-opus-5': 'anthropic/claude-3.5-sonnet',
  'anthropic/claude-sonnet-4.6': 'anthropic/claude-3.5-sonnet',
  'anthropic/claude-sonnet-5': 'anthropic/claude-3.5-sonnet',
  'openai/gpt-5.4': 'openai/gpt-4o',
  'openai/gpt-5.4-mini': 'openai/gpt-4o-mini',
};

function mapModel(model: string | undefined): string {
  if (!model) return 'anthropic/claude-3.5-sonnet';
  return MODEL_MAP[model] || model;
}

// Same return shape as aiGateway.completeGateway — so it's a drop-in swap.
export async function completeGateway(payload: any): Promise<any> {
  const apiKey = secrets.get('OPENROUTER_API_KEY');
  if (!apiKey) throw new Error('OPENROUTER_API_KEY secret not set');

  const body: any = { ...payload };
  if (body.model) body.model = mapModel(body.model);
  else body.model = 'anthropic/claude-3.5-sonnet';

  // OpenRouter uses the same OpenAI-compatible format for tools
  const res = await fetch(`${GATEWAY_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://unlimitedwebsites.base44.app',
      'X-Title': 'GPT Sync Engine',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter Gateway (${res.status}): ${errText.slice(0, 700)}`);
  }

  return await res.json();
}

export async function generateText(opts: {
  prompt: string;
  system_prompt?: string;
  model?: string;
  response_json_schema?: any;
}): Promise<{ text: string; parsed: any; usage: any; model: string }> {
  const messages: any[] = [];
  if (opts.system_prompt) messages.push({ role: 'system', content: opts.system_prompt });
  messages.push({ role: 'user', content: opts.prompt });

  const payload: any = {
    model: mapModel(opts.model),
    messages,
    max_tokens: 8000,
  };

  if (opts.response_json_schema) {
    payload.response_format = { type: 'json_object' };
  }

  const data = await completeGateway(payload);
  const text = data.choices?.[0]?.message?.content || '';

  let parsed: any = text;
  if (opts.response_json_schema) {
    try { parsed = JSON.parse(text); } catch { parsed = text; }
  }

  return { text, parsed, usage: data.usage, model: data.model };
}