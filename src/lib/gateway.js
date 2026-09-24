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

// Structured and plain-text responses matching Core.InvokeLLM's previous return shape.
export async function invokeLLM(opts) {
  let res;
  try {
    res = await base44.functions.invoke('independentAi', opts);
  } catch (error) {
    if (error?.response?.status === 503) throw new Error('Independent AI providers are unavailable. Check provider rate limits, billing, and account access.');
    throw error;
  }
  const data = res.data;
  if (!data?.ok || data.result == null) throw new Error(data?.error || 'Independent AI failed');
  if (opts.response_json_schema && (typeof data.result !== 'object' || Array.isArray(data.result))) {
    throw new Error('Independent AI did not return valid structured data');
  }
  return data.result;
}

// LLM text generation through available free-tier providers.
export async function generateText(opts) {
  const result = await invokeLLM(opts);
  return { text: typeof result === 'string' ? result : JSON.stringify(result), parsed: result };
}

// Text-to-image → Vercel AI Gateway (replaces base44.integrations.Core.GenerateImage)
export async function generateImage(opts) {
  const res = await base44.functions.invoke('vercelAiGateway', { action: 'generateImage', ...opts });
  return res.data;
}

// Image editing with reference → Vercel AI Gateway (for floor visualizer)
export async function editImage(opts) {
  const res = await base44.functions.invoke('vercelAiGateway', { action: 'editImage', ...opts });
  return res.data;
}

// Email → independent email gateway (Xtreme Communications first, Gmail fallback).
export async function sendEmail(opts) {
  const res = await base44.functions.invoke('independentEmail', {
    ...(opts?.to === 'jeremy@strategicmindsai.com' ? { action: 'contact' } : {}),
    ...opts,
  });
  const data = res.data ?? res;
  if (data?.error) throw new Error(data.error);
  return data?.result ?? data;
}

// Video → Vercel AI Gateway + Supabase Storage.
export async function generateVideo(opts) {
  const res = await base44.functions.invoke('independentVideo', opts);
  const data = res.data ?? res;
  if (!data?.url) throw new Error(data?.error || 'Independent video generation failed');
  return data;
}

// SMS → Xtreme Comms gateway
export async function sendSms(opts) {
  const res = await base44.functions.invoke('xtremeComms', { action: 'sendSms', ...opts });
  return res.data;
}