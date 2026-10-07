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
function installGatewayOverrides() {
  const core = base44?.integrations?.Core;
  if (!core) return;

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
}

installGatewayOverrides();