import { secrets } from 'base44:runtime';

// ─────────────────────────────────────────────────────────────────────────────
// aiGateway — Shared Vercel AI Gateway helper for backend functions.
//
// Drop-in replacement for the credit-blocked Base44 Core integrations
// (InvokeLLM, GenerateImage). Routes through Vercel's AI Gateway which has
// its own billing separate from Base44 integration credits.
//
// Usage:
//   import { generateText } from '../../shared/aiGateway.ts';
//   const { parsed } = await generateText({ prompt, model, response_json_schema });
//
// For images, call the vercelAiGateway function instead (it handles upload):
//   await base44.functions.invoke('vercelAiGateway', { action: 'generateImage', prompt });
// ─────────────────────────────────────────────────────────────────────────────

const GATEWAY_BASE = 'https://ai-gateway.vercel.sh/v1';

// Shared transport for text generation and tool-enabled editor requests.
export async function completeGateway(payload) {
  const apiKey = secrets.get('VERCEL_AI_GATEWAY_API_KEY');
  if (!apiKey) throw new Error('VERCEL_AI_GATEWAY_API_KEY secret not set');
  const res = await fetch(`${GATEWAY_BASE}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`Vercel AI Gateway (${res.status}): ${(await res.text()).slice(0, 700)}`);
  return await res.json();
}

export async function generateText(opts: {
  prompt: string;
  system_prompt?: string;
  model?: string;
  response_json_schema?: any;
  file_urls?: string[];
}): Promise<{ text: string; parsed: any; usage: any; model: string }> {
  const messages: any[] = [];
  if (opts.system_prompt) messages.push({ role: 'system', content: opts.system_prompt });

  const content: any[] = [{ type: 'text', text: opts.prompt }];
  if (opts.file_urls && Array.isArray(opts.file_urls) && opts.file_urls.length > 0) {
    for (const url of opts.file_urls) content.push({ type: 'image_url', image_url: { url } });
  }
  messages.push({ role: 'user', content });

  const payload: any = {
    model: opts.model || 'anthropic/claude-opus-4.7',
    messages,
  };

  if (opts.response_json_schema) {
    payload.response_format = { type: 'json_schema', json_schema: { name: 'response', schema: opts.response_json_schema } };
  }

  const data = await completeGateway(payload);
  const text = data.choices?.[0]?.message?.content || '';

  let parsed: any = text;
  if (opts.response_json_schema) {
    try { parsed = JSON.parse(text); } catch { parsed = text; }
  }

  return { text, parsed, usage: data.usage, model: data.model };
}

// ─────────────────────────────────────────────────────────────────────────────
// Drop-in replacements for base44.integrations.Core.InvokeLLM / GenerateImage.
//
// These match the Core return shapes so backend functions can swap one line:
//   const r = await base44.integrations.Core.InvokeLLM({ ... });
//   →
//   const r = await invokeLLM({ ... });
// ─────────────────────────────────────────────────────────────────────────────

// Normalize Core model names (e.g. 'gemini_3_flash') — Vercel AI Gateway uses
// 'provider/model' names. Unknown Core names are dropped so the gateway default
// (claude-opus-4.7) applies. add_context_from_internet is not supported by the
// gateway and is silently dropped.
function sanitizeOpts(opts: any) {
  const out: any = { ...opts };
  if (out.model && !String(out.model).includes('/')) delete out.model;
  delete out.add_context_from_internet;
  return out;
}

// Returns a string (no schema) or the parsed object (with schema) — same as Core.InvokeLLM.
export async function invokeLLM(opts: {
  prompt: string;
  system_prompt?: string;
  model?: string;
  response_json_schema?: any;
  file_urls?: string[];
}): Promise<any> {
  const { text, parsed } = await generateText(sanitizeOpts(opts));
  return opts.response_json_schema ? parsed : text;
}

// Returns { url } — same as Core.GenerateImage. Needs the base44 client to upload
// the generated image to Supabase Storage via the vercelAiGateway function.
export async function generateImage(base44: any, opts: {
  prompt: string;
  model?: string;
  n?: number;
  size?: string;
}): Promise<{ url: string }> {
  const res = await base44.functions.invoke('vercelAiGateway', { action: 'generateImage', ...opts });
  return { url: res.data?.urls?.[0] || '' };
}

// ─────────────────────────────────────────────────────────────────────────────
// patchCore — Override Core.InvokeLLM / GenerateImage on a server-side base44
// client so backend functions route through the Vercel AI Gateway without
// changing their call sites.
//
// Usage in a backend function:
//   import { patchCore } from '../../shared/aiGateway.ts';
//   const base44 = createClientFromRequest(req);
//   patchCore(base44);
//   // now base44.integrations.Core.InvokeLLM(...) hits the gateway, not Core
// ─────────────────────────────────────────────────────────────────────────────
export function patchCore(base44: any) {
  const core = base44?.integrations?.Core;
  if (!core) return;

  core.InvokeLLM = async (opts: any = {}) => {
    const { text, parsed } = await generateText(sanitizeOpts(opts));
    return opts.response_json_schema ? parsed : text;
  };

  core.GenerateImage = async (opts: any = {}) => {
    return generateImage(base44, opts);
  };

  core.GenerateSpeech = async (opts: any = {}) => {
    const res = await base44.functions.invoke('vercelAiGateway', { action: 'generateSpeech', text: opts.text, voice: opts.voice });
    return { url: res.data?.url || '' };
  };

  core.TranscribeAudio = async (opts: any = {}) => {
    const res = await base44.functions.invoke('vercelAiGateway', { action: 'transcribeAudio', audio_url: opts.audio_url });
    return res.data?.text || '';
  };

  core.ExtractDataFromUploadedFile = async (opts: any = {}) => {
    const res = await base44.functions.invoke('vercelAiGateway', { action: 'extractData', file_url: opts.file_url, json_schema: opts.json_schema });
    return { status: 'success', output: res.data?.output };
  };

  // SendEmail → independentEmail function (bypasses Base44 email credits)
  core.SendEmail = async (opts: any = {}) => {
    const res = await base44.functions.invoke('independentEmail', {
      to: opts.to,
      subject: opts.subject,
      body: opts.body,
      html: opts.html,
      text: opts.text,
      template_id: opts.template_id,
      template_name: opts.template_name,
      variables: opts.variables,
      from_name: opts.from_name,
      attachments: opts.attachments,
    });
    return res.data;
  };

  // UploadPublicFile → supabaseUpload (bypasses Base44 storage credits, returns public URL)
  core.UploadPublicFile = async (opts: any = {}) => {
    const file = opts.file;
    const ext = (file.name || 'file').split('.').pop() || 'bin';
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const res = await base44.functions.invoke('supabaseUpload', {
      file_data: await fileToDataUrl(file),
      filename: safeName,
      content_type: file.type || 'application/octet-stream',
      bucket: 'public',
    });
    return { file_url: res.data?.file_url };
  };

  // UploadPrivateFile → supabaseUpload (bypasses Base44 storage credits, returns private URI)
  core.UploadPrivateFile = async (opts: any = {}) => {
    const file = opts.file;
    const ext = (file.name || 'file').split('.').pop() || 'bin';
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const res = await base44.functions.invoke('supabaseUpload', {
      file_data: await fileToDataUrl(file),
      filename: safeName,
      content_type: file.type || 'application/octet-stream',
      bucket: 'private',
    });
    return { file_uri: res.data?.file_uri || res.data?.file_url };
  };

  // CreateFileSignedUrl → supabaseUpload signed URL (bypasses Base44 credits)
  core.CreateFileSignedUrl = async (opts: any = {}) => {
    const res = await base44.functions.invoke('supabaseUpload', {
      action: 'signedUrl',
      file_uri: opts.file_uri,
      expires_in: opts.expires_in || 300,
    });
    return { signed_url: res.data?.signed_url || res.data?.file_url || '' };
  };
}

// Helper: convert File to data URL (server-side compatible)
async function fileToDataUrl(file: any): Promise<string> {
  if (typeof file === 'string') return file;
  if (file.arrayBuffer) {
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const b64 = btoa(binary);
    const ext = (file.name || 'file').split('.').pop() || 'bin';
    return `data:${file.type || 'application/octet-stream'};base64,${b64}`;
  }
  return String(file);
}