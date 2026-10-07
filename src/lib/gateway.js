import { base44 } from '@/api/base44Client';

// ─────────────────────────────────────────────────────────────────────────────
// gateway — Unified frontend gateway for all AI, file, and email operations.
//
// Routes everything through the Vercel AI Gateway (AI/text/image), Supabase
// Storage (file uploads), and Xtreme Comms (email/SMS) — bypassing the
// Base44 Core integrations that are blocked when integration credits run out.
//
// Usage:
//   import { uploadFile, generateText, generateImage, editImage, sendEmail } from '@/lib/gateway';
//   const { file_url } = await uploadFile(file);
//   const { text } = await generateText({ prompt });
//   await sendEmail({ to, subject, body });
// ─────────────────────────────────────────────────────────────────────────────

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// File upload → Supabase Storage (replaces base44.integrations.Core.UploadFile / UploadPublicFile)
export async function uploadFile(file) {
  const dataUrl = await fileToDataUrl(file);
  const ext = (file.name || 'file').split('.').pop() || 'bin';
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const res = await base44.functions.invoke('supabaseUpload', {
    file_data: dataUrl,
    filename: safeName,
    content_type: file.type || 'application/octet-stream',
  });
  return { file_url: res.data?.file_url };
}

// LLM text generation through Vercel AI Gateway (replaces Core.InvokeLLM).
// Returns a string (no schema) or parsed object (with schema) — same shape as Core.
export async function invokeLLM(opts) {
  const gatewayOpts = { ...opts };
  // Core model names (e.g. 'gemini_3_flash') aren't valid Vercel AI Gateway models
  // ('provider/model' format). Drop them so the gateway default applies.
  if (gatewayOpts.model && !String(gatewayOpts.model).includes('/')) delete gatewayOpts.model;
  // add_context_from_internet isn't supported by Vercel AI Gateway — dropped.
  delete gatewayOpts.add_context_from_internet;

  const res = await base44.functions.invoke('vercelAiGateway', { action: 'generateText', ...gatewayOpts });
  const data = res.data;
  if (!data?.ok) throw new Error(data?.error || 'Vercel AI Gateway failed');
  return opts.response_json_schema ? data.parsed : data.text;
}

// LLM text generation — convenience wrapper returning { text, parsed }.
export async function generateText(opts) {
  const result = await invokeLLM(opts);
  return { text: typeof result === 'string' ? result : JSON.stringify(result), parsed: result };
}

// Text-to-image → Vercel AI Gateway. Returns { url } matching Core.GenerateImage.
export async function generateImage(opts) {
  const res = await base44.functions.invoke('vercelAiGateway', { action: 'generateImage', ...opts });
  return { url: res.data?.urls?.[0] || '' };
}

// Image editing with reference → Vercel AI Gateway (for floor visualizer)
export async function editImage(opts) {
  const res = await base44.functions.invoke('vercelAiGateway', { action: 'editImage', ...opts });
  return res.data;
}

// Email → Xtreme Comms gateway (replaces base44.integrations.Core.SendEmail)
export async function sendEmail(opts) {
  const res = await base44.functions.invoke('xtremeComms', { action: 'sendEmail', ...opts });
  return res.data;
}

// SMS → Xtreme Comms gateway
export async function sendSms(opts) {
  const res = await base44.functions.invoke('xtremeComms', { action: 'sendSms', ...opts });
  return res.data;
}