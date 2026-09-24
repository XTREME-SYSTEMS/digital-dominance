import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { secrets } from 'base44:runtime';

// ═══════════════════════════════════════════════════════════════════════════
// independentAi — Drop-in replacement for Base44 Core.InvokeLLM.
//
// Routes through FREE LLM providers that don't use Base44 integration credits:
//   1. Groq (Llama 3.3 70B) — ultra-fast, 14,400 req/day free
//   2. Google AI (Gemini 2.0 Flash) — supports vision, 1,500 req/day free
//   3. OpenRouter (Llama 3.1 8B free) — 200 req/day free
//   4. Vercel AI Gateway (separate billing, NOT Base44 credits)
//
// NEVER uses Base44 integration credits. The system stays operational even
// when Base44 integration credits are exhausted.
//
// Actions:
//   invoke        — LLM text generation (replaces InvokeLLM)
//   invokeVision  — LLM with image inputs (replaces InvokeLLM with file_urls)
//   status        — check which providers are available
//
// Parameters (same as InvokeLLM for drop-in compatibility):
//   prompt, response_json_schema, model, file_urls
//   Additional: system_prompt, max_tokens, temperature
// ═══════════════════════════════════════════════════════════════════════════

const TIMEOUT_MS = 10000;

function withTimeout(ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { controller, cleanup: () => clearTimeout(timer) };
}

async function tryGroq(prompt, systemPrompt, options, model = 'qwen/qwen3.8-27b') {
  const key = secrets.get('GROQ_API_KEY');
  if (!key) return null;

  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });

  const { controller, cleanup } = withTimeout(TIMEOUT_MS);
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens || 4096,
      }),
      signal: controller.signal,
    });
    cleanup();
    if (!res.ok) return model === 'qwen/qwen3.8-27b' ? tryGroq(prompt, systemPrompt, options, 'openai/gpt-oss-20b') : null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch { cleanup(); return model === 'qwen/qwen3.8-27b' ? tryGroq(prompt, systemPrompt, options, 'openai/gpt-oss-20b') : null; }
}

async function tryGoogleAI(prompt, systemPrompt, fileUrls, options) {
  const key = secrets.get('GOOGLE_AI_API_KEY');
  if (!key) return null;

  const model = 'gemini-2.5-flash';
  const parts = [{ text: (systemPrompt || '') + '\n\n' + prompt }];
  if (fileUrls && Array.isArray(fileUrls)) {
    for (const url of fileUrls) {
      parts.push({ file_data: { mime_type: 'image/png', file_url: { uri: url } } });
    }
  }

  const { controller, cleanup } = withTimeout(TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: options.temperature ?? 0.7,
            maxOutputTokens: options.max_tokens || 4096,
            ...(options.response_json_schema
              ? { responseMimeType: 'application/json', responseSchema: options.response_json_schema }
              : {}),
          },
        }),
        signal: controller.signal,
      }
    );
    cleanup();
    if (!res.ok) return null;
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch { cleanup(); return null; }
}

async function tryOpenRouter(prompt, systemPrompt, options) {
  const key = secrets.get('OPENROUTER_API_KEY');
  if (!key) return null;

  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });

  const { controller, cleanup } = withTimeout(TIMEOUT_MS);
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b:free',
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens || 4096,
        response_format: options.response_json_schema ? { type: 'json_object' } : undefined,
      }),
      signal: controller.signal,
    });
    cleanup();
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch { cleanup(); return null; }
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'invoke';

    // ── debug: try each provider and return detailed errors ──
    if (action === 'debug') {
      const { prompt = 'Say hello' } = body;
      const debug = {};

      // List available models from each provider
      // Groq
      const groqKey = secrets.get('GROQ_API_KEY');
      if (groqKey) {
        try {
          const res = await fetch('https://api.groq.com/openai/v1/models', { headers: { Authorization: `Bearer ${groqKey}` } });
          const data = await res.json();
          debug.groq = data.data?.map((m) => m.id).slice(0, 15) || data;
        } catch (e) { debug.groq = { error: e.message }; }
      } else { debug.groq = { error: 'no key' }; }

      // Google AI
      const googleKey = secrets.get('GOOGLE_AI_API_KEY');
      if (googleKey) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${googleKey}`);
          const data = await res.json();
          debug.google_ai = data.models?.map((m) => m.name).slice(0, 15) || data;
        } catch (e) { debug.google_ai = { error: e.message }; }
      } else { debug.google_ai = { error: 'no key' }; }

      // OpenRouter — free models only
      const openrouterKey = secrets.get('OPENROUTER_API_KEY');
      if (openrouterKey) {
        try {
          const res = await fetch('https://openrouter.ai/api/v1/models');
          const data = await res.json();
          debug.openrouter = data.data?.filter((m) => m.id?.includes(':free')).map((m) => m.id).slice(0, 15) || data;
        } catch (e) { debug.openrouter = { error: e.message }; }
      } else { debug.openrouter = { error: 'no key' }; }

      return Response.json({ ok: true, debug });
    }

    // ── status: check available providers ──
    if (action === 'status') {
      return Response.json({
        ok: true,
        providers: {
          groq: !!secrets.get('GROQ_API_KEY'),
          google_ai: !!secrets.get('GOOGLE_AI_API_KEY'),
          openrouter: !!secrets.get('OPENROUTER_API_KEY'),
          },
          independent: true,
          message: 'Free-tier AI keys are configured; actual availability depends on provider quota and account access',
      });
    }

    // ── invoke / invokeVision: LLM generation ──
    const { prompt, response_json_schema, model, file_urls, system_prompt, max_tokens, temperature } = body;
    if (!prompt) return Response.json({ error: 'prompt required' }, { status: 400 });

    const options = { response_json_schema, model, max_tokens, temperature };
    const hasVision = file_urls && Array.isArray(file_urls) && file_urls.length > 0;

    let result = null;
    let provider = null;
    const errors = [];

    // 1. Groq (text only — fastest free tier)
    if (!hasVision) {
      result = await tryGroq(prompt, system_prompt, options);
      if (result) provider = 'groq';
      else errors.push('groq: unavailable or failed');
    }

    // 2. Google AI (supports vision + large context)
    if (!result) {
      result = await tryGoogleAI(prompt, system_prompt, file_urls, options);
      if (result) provider = 'google-ai';
      else errors.push('google-ai: unavailable or failed');
    }

    // 3. OpenRouter (text only — free models)
    if (!result && !hasVision) {
      result = await tryOpenRouter(prompt, system_prompt, options);
      if (result) provider = 'openrouter';
      else errors.push('openrouter: unavailable or failed');
    }

    if (!result) {
      return Response.json({
        error: 'Free-tier AI providers are unavailable. Check provider rate limits, billing, and account access.',
        errors,
      }, { status: 503 });
    }

    // Parse JSON if schema was requested (same behavior as InvokeLLM)
    let parsed = result;
    if (response_json_schema) {
      // Strip markdown code blocks if present (LLMs often wrap JSON in ```json...```)
      const jsonMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : result.trim();
      try { parsed = JSON.parse(jsonStr); } catch { parsed = jsonStr; }
    }

    return Response.json({
      ok: true,
      provider,
      result: response_json_schema ? parsed : result,
      text: result,
      independent: true,
    });
  } catch (error) {
    console.error('[independentAi] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}