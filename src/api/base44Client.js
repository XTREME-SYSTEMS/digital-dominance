import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

//Create a client with authentication required
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});

// ─────────────────────────────────────────────────────────────────────────────
// End-to-end Vercel AI Gateway routing
//
// Override the credit-blocked Base44 Core AI integrations so EVERY frontend
// call site (base44.integrations.Core.InvokeLLM / GenerateImage) routes
// through the Vercel AI Gateway automatically — no per-component edits needed.
// The gateway has its own billing, separate from Base44 integration credits.
// ─────────────────────────────────────────────────────────────────────────────
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function patchCoreMethods(core) {
  if (!core || core.__gatewayPatched) return core;

  // InvokeLLM → Vercel AI Gateway generateText
  core.InvokeLLM = async (opts = {}) => {
    const gOpts = { ...opts };
    // Core model names (e.g. 'gemini_3_flash') aren't valid gateway models
    // ('provider/model' format). Drop them so the gateway default applies.
    if (gOpts.model && !String(gOpts.model).includes('/')) delete gOpts.model;
    // add_context_from_internet isn't supported by the gateway — dropped.
    delete gOpts.add_context_from_internet;

    const res = await base44.functions.invoke('vercelAiGateway', {
      action: 'generateText',
      prompt: gOpts.prompt,
      system_prompt: gOpts.system_prompt,
      model: gOpts.model,
      response_json_schema: gOpts.response_json_schema,
      file_urls: gOpts.file_urls,
    });
    const data = res.data;
    if (!data?.ok) throw new Error(data?.error || 'Vercel AI Gateway failed');
    return opts.response_json_schema ? data.parsed : data.text;
  };

  // GenerateImage → Vercel AI Gateway generateImage
  core.GenerateImage = async (opts = {}) => {
    const res = await base44.functions.invoke('vercelAiGateway', {
      action: 'generateImage',
      prompt: opts.prompt,
      model: opts.model,
      n: opts.n,
      size: opts.size,
    });
    return { url: res.data?.urls?.[0] || '' };
  };

  // GenerateSpeech → Vercel AI Gateway generateSpeech
  core.GenerateSpeech = async (opts = {}) => {
    const res = await base44.functions.invoke('vercelAiGateway', {
      action: 'generateSpeech',
      text: opts.text,
      voice: opts.voice,
    });
    return { url: res.data?.url || '' };
  };

  // TranscribeAudio → Vercel AI Gateway transcribeAudio
  core.TranscribeAudio = async (opts = {}) => {
    const res = await base44.functions.invoke('vercelAiGateway', {
      action: 'transcribeAudio',
      audio_url: opts.audio_url,
    });
    return res.data?.text || '';
  };

  // ExtractDataFromUploadedFile → Vercel AI Gateway extractData
  core.ExtractDataFromUploadedFile = async (opts = {}) => {
    const res = await base44.functions.invoke('vercelAiGateway', {
      action: 'extractData',
      file_url: opts.file_url,
      json_schema: opts.json_schema,
    });
    return { status: 'success', output: res.data?.output };
  };

  // GenerateVideo → Vercel AI Gateway (video not supported, but we try text-to-video models if available)
  core.GenerateVideo = async (opts = {}) => {
    // Vercel AI Gateway doesn't have a direct video endpoint yet.
    // Route through generateImage as a fallback (returns a storyboard frame).
    const res = await base44.functions.invoke('vercelAiGateway', {
      action: 'generateImage',
      prompt: `Storyboard frame for video: ${opts.prompt}`,
    });
    return { url: res.data?.urls?.[0] || '' };
  };

  // SendEmail → independentEmail function (bypasses Base44 email credits)
  core.SendEmail = async (opts = {}) => {
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
  core.UploadPublicFile = async (opts = {}) => {
    const file = opts.file;
    const dataUrl = await fileToDataUrl(file);
    const ext = (file.name || 'file').split('.').pop() || 'bin';
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const res = await base44.functions.invoke('supabaseUpload', {
      file_data: dataUrl,
      filename: safeName,
      content_type: file.type || 'application/octet-stream',
      bucket: 'public',
    });
    return { file_url: res.data?.file_url };
  };

  // UploadPrivateFile → supabaseUpload (bypasses Base44 storage credits, returns private URI)
  core.UploadPrivateFile = async (opts = {}) => {
    const file = opts.file;
    const dataUrl = await fileToDataUrl(file);
    const ext = (file.name || 'file').split('.').pop() || 'bin';
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const res = await base44.functions.invoke('supabaseUpload', {
      file_data: dataUrl,
      filename: safeName,
      content_type: file.type || 'application/octet-stream',
      bucket: 'private',
    });
    return { file_uri: res.data?.file_uri || res.data?.file_url };
  };

  // CreateFileSignedUrl → supabaseUpload signedUrl (bypasses Base44 credits)
  core.CreateFileSignedUrl = async (opts = {}) => {
    const res = await base44.functions.invoke('supabaseUpload', {
      action: 'signedUrl',
      file_uri: opts.file_uri,
      expires_in: opts.expires_in || 300,
    });
    return { signed_url: res.data?.signed_url || res.data?.file_url || '' };
  };

  // SendPushNotification → no-op fallback (mobile push needs native build + Base44 credits)
  core.SendPushNotification = async () => ({ skipped: 'Push notifications require a native mobile build.' });

  core.__gatewayPatched = true;
  return core;
}

// Resilient installer: patch Core synchronously if present, otherwise intercept
// lazy access via a Proxy on base44.integrations so the overrides land whenever
// the SDK materialises Core (it may not exist at import time).
function installGatewayOverrides() {
  const integrations = base44?.integrations;
  if (!integrations) return;
  const core = integrations.Core;
  if (core) { patchCoreMethods(core); return; }
  // Core not ready yet — wrap integrations in a Proxy that patches Core on first access.
  try {
    const target = integrations;
    const proxied = new Proxy(target, {
      get(t, prop) {
        const value = Reflect.get(t, prop);
        if (prop === 'Core' && value && typeof value === 'object') {
          return patchCoreMethods(value);
        }
        return value;
      },
    });
    Object.defineProperty(base44, 'integrations', { value: proxied, writable: true, configurable: true });
  } catch (e) { /* Proxy unsupported — fall through; retry below */ }
  // Fallback retry: poll briefly for Core to appear (SDK lazy init).
  let tries = 0;
  const retry = setInterval(() => {
    tries += 1;
    const c = base44?.integrations?.Core;
    if (c) { patchCoreMethods(c); clearInterval(retry); }
    else if (tries > 20) clearInterval(retry);
  }, 100);
}

installGatewayOverrides();