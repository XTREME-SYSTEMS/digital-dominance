// Free LLM Registry — zero-cost LLM endpoints for passive 24/7 operation.
// Rotate between providers to stay within free tiers. Each has generous free limits.
// Backend functions import this to avoid paid credits for high-volume autonomous work.

export const FREE_LLM_PROVIDERS = [
  {
    id: 'groq',
    name: 'Groq (Qwen 3.8 27B + GPT-OSS 120B)',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    models: ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b'],
    freeTier: '30 RPM, 14,400 requests/day',
    apiKeyEnv: 'GROQ_API_KEY',
    speed: 'ultra-fast',
    quality: 'high',
    contextWindow: 131072,
  },
  {
    id: 'google-ai',
    name: 'Google AI Studio (Gemini 2.5 Flash)',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    models: ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-pro'],
    freeTier: '15 RPM, 1,500 requests/day, 1M tokens/min',
    apiKeyEnv: 'GOOGLE_AI_API_KEY',
    speed: 'fast',
    quality: 'high',
    contextWindow: 1000000,
  },
  {
    id: 'openrouter-free',
    name: 'OpenRouter (Free Models)',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    models: [
      'qwen/qwen3.8-27b:free',
      'z-ai/glm-5.2:free',
      'nvidia/nemotron-3.5-lightning:free',
    ],
    freeTier: '20 RPM, 200 requests/day (free models)',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    speed: 'medium',
    quality: 'medium',
    contextWindow: 32768,
  },
  {
    id: 'base44-automatic',
    name: 'Base44 InvokeLLM (automatic)',
    endpoint: 'base44-integration',
    models: ['automatic', 'gemini_3_flash'],
    freeTier: 'Uses Base44 integration credits — no external key needed',
    apiKeyEnv: null,
    speed: 'fast',
    quality: 'high',
    contextWindow: 1000000,
  },
];

// Get the provider list with connection status (for display)
export function getProviderStatus() {
  return FREE_LLM_PROVIDERS.map((p) => ({
    ...p,
    connected: p.apiKeyEnv === null, // base44-automatic is always available; others need keys set
  }));
}

// Call a free LLM with OpenAI-compatible format (Groq, OpenRouter)
// Falls back to Base44 InvokeLLM if no external keys are available.
export async function callFreeLlm(base44, messages, options = {}) {
  const { secrets } = await import('base44:runtime');

  // Try Groq first (fastest free tier)
  const groqKey = secrets.get('GROQ_API_KEY');
  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: options.model || 'qwen/qwen3.8-27b',
          messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 4096,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return { provider: 'groq', content: data.choices[0].message.content };
      }
    } catch (e) {
      // Fall through to next provider
    }
  }

  // Try OpenRouter free models
  const openrouterKey = secrets.get('OPENROUTER_API_KEY');
  if (openrouterKey) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openrouterKey}`,
        },
        body: JSON.stringify({
          model: 'qwen/qwen3.8-27b:free',
          messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 4096,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return { provider: 'openrouter', content: data.choices[0].message.content };
      }
    } catch (e) {
      // Fall through
    }
  }

  // Try Google AI (free, supports large context + vision)
  const googleKey = secrets.get('GOOGLE_AI_API_KEY');
  if (googleKey) {
    try {
      const promptText = messages.map((m) => (typeof m.content === 'string' ? m.content : '')).join('\n\n');
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${googleKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: { temperature: options.temperature || 0.7 },
            ...(options.jsonSchema ? { responseMimeType: 'application/json' } : {}),
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (content) return { provider: 'google-ai', content };
      }
    } catch (e) {
      // Fall through
    }
  }

  // Fallback: Vercel AI Gateway (separate billing from Base44 integration credits)
  try {
    const res = await base44.functions.invoke('vercelAiGateway', {
      action: 'generateText',
      prompt: messages.map((m) => (typeof m.content === 'string' ? m.content : '')).join('\n\n'),
      response_json_schema: options.jsonSchema || undefined,
    });
    return { provider: 'vercel-gateway', content: res.data?.text || '' };
  } catch (e) {
    return { provider: 'error', content: `All LLM providers failed: ${e.message}` };
  }
}