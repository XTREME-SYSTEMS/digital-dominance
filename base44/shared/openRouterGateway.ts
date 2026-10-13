import { secrets } from 'base44:runtime';

// ─────────────────────────────────────────────────────────────────────────────
// openRouterGateway — LLM gateway helper (OpenAI-compatible).
//
// Routes through Groq (free tier, fast inference, supports tool calling).
// Falls back to OpenRouter if Groq fails. Both are separate from the
// credit-exhausted Vercel AI Gateway.
//
// Usage (same signature as aiGateway.completeGateway):
//   import { completeGateway } from '../../shared/openRouterGateway.ts';
//   const data = await completeGateway({ model, messages, tools, ... });
// ─────────────────────────────────────────────────────────────────────────────

const GROQ_BASE = 'https://api.groq.com/openai/v1';
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

// Provider-specific default models (both support tool calling)
const GROQ_MODEL = 'llama-3.1-8b-instant';
const OPENROUTER_MODEL = 'openai/gpt-4o-mini';

async function callGroq(payload: any): Promise<any> {
  const apiKey = secrets.get('GROQ_API_KEY');
  if (!apiKey) throw new Error('GROQ_API_KEY secret not set');

  const body: any = { ...payload };
  body.model = GROQ_MODEL; // always use Groq-native model

  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq Gateway (${res.status}): ${errText.slice(0, 500)}`);
  }

  return await res.json();
}

async function callOpenRouter(payload: any): Promise<any> {
  const apiKey = secrets.get('OPENROUTER_API_KEY');
  if (!apiKey) throw new Error('OPENROUTER_API_KEY secret not set');

  const body: any = { ...payload };
  body.model = OPENROUTER_MODEL; // always use OpenRouter-native model

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
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
    throw new Error(`OpenRouter Gateway (${res.status}): ${errText.slice(0, 500)}`);
  }

  return await res.json();
}

// Same return shape as aiGateway.completeGateway — drop-in swap.
// Tries Groq first (free tier), falls back to OpenRouter.
export async function completeGateway(payload: any): Promise<any> {
  try {
    return await callGroq(payload);
  } catch (groqError: any) {
    // If Groq fails, try OpenRouter as fallback
    try {
      return await callOpenRouter(payload);
    } catch (orError: any) {
      throw new Error(`Both gateways failed. Groq: ${groqError.message} | OpenRouter: ${orError.message}`);
    }
  }
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
    model: opts.model, // will be overridden by provider-specific model in callGroq/callOpenRouter
    messages,
    max_tokens: 4000,
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