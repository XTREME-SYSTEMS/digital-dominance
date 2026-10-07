import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { secrets } from 'base44:runtime';

// ─────────────────────────────────────────────────────────────────────────────
// vercelAiGateway — Free/cheap AI via Vercel AI Gateway.
//
// This is a drop-in alternative to the blocked Base44 Core integrations
// (InvokeLLM, GenerateImage). It routes through Vercel's AI Gateway which
// has its own billing separate from Base44 integration credits.
//
// Actions:
//   generateText  — LLM text generation (replaces InvokeLLM)
//   generateImage — Text-to-image generation (replaces GenerateImage)
//   editImage     — Image editing with a reference image (for floor visualizer)
//
// Models (defaults set to the absolute best available):
//   Text:  anthropic/claude-opus-4.7 (best — most capable), openai/gpt-5.4 (fast + smart), openai/gpt-5.4-mini (cheapest)
//   Image: openai/gpt-image-2 (best for generation), google/gemini-3.1-flash-image-preview (best for editing — Nano Banana)
//
// Generated images are uploaded to Supabase Storage and returned as public URLs.
// ─────────────────────────────────────────────────────────────────────────────

const GATEWAY_BASE = 'https://ai-gateway.vercel.sh/v1';
const BUCKET_NAME = 'epoxy-uploads';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const apiKey = secrets.get('VERCEL_AI_GATEWAY_API_KEY') || secrets.get('VERCEL_API_TOKEN');
    if (!apiKey) return Response.json({ error: 'VERCEL_AI_GATEWAY_API_KEY secret not set' }, { status: 500 });

    const body = await req.json();
    const { action } = body;

    // ── generateText: LLM text generation ──
    if (action === 'generateText') {
      const { prompt, model, system_prompt, response_json_schema, file_urls } = body;
      if (!prompt) return Response.json({ error: 'prompt required' }, { status: 400 });

      const messages: any[] = [];
      if (system_prompt) messages.push({ role: 'system', content: system_prompt });

      // Build user message — support text + optional image inputs
      const content: any[] = [{ type: 'text', text: prompt }];
      if (file_urls && Array.isArray(file_urls) && file_urls.length > 0) {
        for (const url of file_urls) {
          content.push({ type: 'image_url', image_url: { url } });
        }
      }
      messages.push({ role: 'user', content });

      // Model fallback chain — if the primary model fails upstream (rate limit,
      // timeout, availability), retry with progressively lighter models so the
      // chat stays responsive instead of throwing a 500 at the user.
      const requestedModel = model || 'anthropic/claude-opus-4.7';
      const FALLBACK_CHAIN: Record<string, string[]> = {
        'anthropic/claude-opus-4.7': ['openai/gpt-5.4', 'openai/gpt-5.4-mini'],
        'openai/gpt-5.4': ['openai/gpt-5.4-mini'],
      };
      const modelChain = [requestedModel, ...(FALLBACK_CHAIN[requestedModel] || [])];

      const payload: any = {
        model: requestedModel,
        messages,
      };

      // Structured output (JSON schema)
      if (response_json_schema) {
        payload.response_format = { type: 'json_schema', json_schema: { name: 'response', schema: response_json_schema } };
      }

      let data: any = null;
      let lastError = '';

      for (const m of modelChain) {
        payload.model = m;
        // 30s timeout — upstream hangs shouldn't stall the whole function
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        try {
          const res = await fetch(`${GATEWAY_BASE}/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });
          clearTimeout(timeout);

          if (!res.ok) {
            lastError = `AI Gateway error (${res.status}): ${await res.text()}`;
            console.warn(`[vercelAiGateway] model ${m} failed: ${res.status}`);
            continue; // try next model in the fallback chain
          }

          data = await res.json();
          break; // success
        } catch (err) {
          clearTimeout(timeout);
          lastError = err.message;
          console.warn(`[vercelAiGateway] model ${m} threw: ${err.message}`);
          continue; // try next model
        }
      }

      if (!data) {
        return Response.json({ error: `All models failed. Last: ${lastError}` }, { status: 500 });
      }

      const text = data.choices?.[0]?.message?.content || '';

      // If JSON schema was requested, parse the response
      let parsed = text;
      if (response_json_schema) {
        try { parsed = JSON.parse(text); } catch { parsed = text; }
      }

      return Response.json({ ok: true, text, parsed, usage: data.usage, model: data.model });
    }

    // ── generateImage: Text-to-image generation ──
    if (action === 'generateImage') {
      const { prompt, model, n, size } = body;
      if (!prompt) return Response.json({ error: 'prompt required' }, { status: 400 });

      const imageModel = model || 'openai/gpt-image-2';
      const payload: any = {
        model: imageModel,
        prompt,
        n: n || 1,
        response_format: 'b64_json',
      };
      if (size) payload.size = size;

      const res = await fetch(`${GATEWAY_BASE}/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.text();
        return Response.json({ error: `AI Gateway image error: ${err}`, status: res.status }, { status: 500 });
      }

      const data = await res.json();
      const images = data.data || [];

      // Upload each image to Supabase Storage and return public URLs
      const urls: string[] = [];
      for (let i = 0; i < images.length; i++) {
        const b64 = images[i].b64_json;
        if (!b64) continue;
        const dataUrl = `data:image/png;base64,${b64}`;
        const uploadRes = await base44.functions.invoke('supabaseUpload', {
          file_data: dataUrl,
          filename: `ai-gen-${Date.now()}-${i}.png`,
          content_type: 'image/png',
        });
        if (uploadRes.data?.file_url) urls.push(uploadRes.data.file_url);
      }

      return Response.json({ ok: true, urls, count: urls.length, model: imageModel });
    }

    // ── editImage: Image editing with a reference image (floor visualizer) ──
    // Uses a multimodal LLM (Nano Banana / Gemini Flash Image) via chat completions.
    // The reference image is sent as input, and the model generates a new edited image.
    if (action === 'editImage') {
      const { prompt, reference_image_url, model } = body;
      if (!prompt || !reference_image_url) {
        return Response.json({ error: 'prompt and reference_image_url required' }, { status: 400 });
      }

      const editModel = model || 'google/gemini-3.1-flash-image-preview';

      const payload = {
        model: editModel,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: reference_image_url } },
            ],
          },
        ],
      };

      const res = await fetch(`${GATEWAY_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.text();
        return Response.json({ error: `AI Gateway edit error: ${err}`, status: res.status }, { status: 500 });
      }

      const data = await res.json();
      const message = data.choices?.[0]?.message;

      // Extract generated image from the response
      let imageUrl: string | null = null;
      if (message?.images && message.images.length > 0) {
        imageUrl = message.images[0].image_url?.url || null;
      }

      if (!imageUrl) {
        // Some models return the image inline in content as a data URL
        const content = message?.content || '';
        const dataUrlMatch = typeof content === 'string' && content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
        if (dataUrlMatch) imageUrl = dataUrlMatch[0];
      }

      if (!imageUrl) {
        return Response.json({ error: 'No image generated in response', raw: JSON.stringify(message).slice(0, 500) }, { status: 500 });
      }

      // Upload to Supabase Storage and return public URL
      const uploadRes = await base44.functions.invoke('supabaseUpload', {
        file_data: imageUrl,
        filename: `ai-edit-${Date.now()}.png`,
        content_type: 'image/png',
      });

      return Response.json({
        ok: true,
        url: uploadRes.data?.file_url || null,
        model: editModel,
        text: typeof message?.content === 'string' ? message.content.slice(0, 200) : '',
      });
    }

    // ── generateEmbedding: Text embeddings for RAG / vector search ──
    if (action === 'generateEmbedding') {
      const { text, model } = body;
      if (!text) return Response.json({ error: 'text required' }, { status: 400 });

      const res = await fetch(`${GATEWAY_BASE}/embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'text-embedding-3-small',
          input: text,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        return Response.json({ error: `AI Gateway embedding error: ${err}`, status: res.status }, { status: 500 });
      }

      const data = await res.json();
      const embedding = data.data?.[0]?.embedding || [];
      return Response.json({ ok: true, embedding, dims: embedding.length, model: data.model });
    }

    // ── generateSpeech: Text-to-speech (replaces Core.GenerateSpeech) ──
    if (action === 'generateSpeech') {
      const { text, voice, model } = body;
      if (!text) return Response.json({ error: 'text required' }, { status: 400 });

      const speechModel = model || 'openai/tts-1';
      const payload: any = {
        model: speechModel,
        input: text,
        response_format: 'url',
      };
      if (voice) payload.voice = voice;

      const res = await fetch(`${GATEWAY_BASE}/audio/speech`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.text();
        return Response.json({ error: `AI Gateway speech error: ${err}`, status: res.status }, { status: 500 });
      }

      // The response may be a direct audio URL or audio bytes
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        return Response.json({ ok: true, url: data.url || data.audio_url || null, model: speechModel });
      }
      // If it's raw audio, upload to Supabase and return URL
      const audioBuf = await res.arrayBuffer();
      const b64 = btoa(String.fromCharCode(...new Uint8Array(audioBuf)));
      const dataUrl = `data:audio/mp3;base64,${b64}`;
      const uploadRes = await base44.functions.invoke('supabaseUpload', {
        file_data: dataUrl,
        filename: `ai-speech-${Date.now()}.mp3`,
        content_type: 'audio/mpeg',
      });
      return Response.json({ ok: true, url: uploadRes.data?.file_url || null, model: speechModel });
    }

    // ── transcribeAudio: Audio transcription (replaces Core.TranscribeAudio) ──
    if (action === 'transcribeAudio') {
      const { audio_url, model } = body;
      if (!audio_url) return Response.json({ error: 'audio_url required' }, { status: 400 });

      // Fetch the audio file, then send it to the gateway
      const audioRes = await fetch(audio_url);
      if (!audioRes.ok) return Response.json({ error: 'Failed to fetch audio file' }, { status: 500 });
      const audioBlob = await audioRes.blob();

      const formData = new FormData();
      formData.append('model', model || 'openai/whisper-1');
      formData.append('file', audioBlob, 'audio.mp3');

      const res = await fetch(`${GATEWAY_BASE}/audio/transcriptions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.text();
        return Response.json({ error: `AI Gateway transcription error: ${err}`, status: res.status }, { status: 500 });
      }

      const data = await res.json();
      const transcript = data.text || '';
      return Response.json({ ok: true, text: transcript, model: data.model });
    }

    // ── extractData: Extract structured data from a file (replaces Core.ExtractDataFromUploadedFile) ──
    if (action === 'extractData') {
      const { file_url, json_schema, prompt } = body;
      if (!file_url || !json_schema) return Response.json({ error: 'file_url and json_schema required' }, { status: 400 });

      const extractPrompt = prompt || 'Extract the data from this file into the specified JSON schema. Return only valid JSON.';
      const payload = {
        model: 'anthropic/claude-opus-4.7',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: `${extractPrompt}\n\nReturn JSON matching this schema:\n${JSON.stringify(json_schema)}` },
              { type: 'file_url', file_url: { url: file_url } },
            ],
          },
        ],
        response_format: { type: 'json_schema', json_schema: { name: 'response', schema: json_schema } },
      };

      const res = await fetch(`${GATEWAY_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.text();
        return Response.json({ error: `AI Gateway extraction error: ${err}`, status: res.status }, { status: 500 });
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '';
      let parsed: any = text;
      try { parsed = JSON.parse(text); } catch { /* keep raw text */ }
      return Response.json({ ok: true, output: parsed, text, model: data.model });
    }

    // ── listModels: List available models (proxy to Vercel) ──
    if (action === 'listModels') {
      return Response.json({ ok: true, note: 'Visit https://vercel.com/ai-gateway/models to browse models' });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('[vercelAiGateway] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}