import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

const rawBase44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});

function unwrapFunctionResponse(response) {
  return response?.data ?? response ?? {};
}

async function invokeIndependentAi(options = {}) {
  try {
    const response = await rawBase44.functions.invoke('independentAi', options);
    const data = unwrapFunctionResponse(response);
    if (data?.ok && data.result !== undefined && data.result !== null) {
      return data.result;
    }
    throw new Error(data?.error || 'Independent AI returned no result');
  } catch (primaryError) {
    const response = await rawBase44.functions.invoke('vercelAiGateway', {
      action: 'generateText',
      ...options,
    });
    const data = unwrapFunctionResponse(response);
    if (data?.ok === false || (data?.parsed == null && data?.text == null)) {
      throw primaryError;
    }
    if (options.response_json_schema) return data.parsed ?? data.text;
    return data.text ?? data.parsed;
  }
}

async function uploadIndependentFile(file) {
  if (!file) throw new Error('file is required');
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const response = await rawBase44.functions.invoke('supabaseUpload', {
    file_data: dataUrl,
    filename: file.name || `upload-${Date.now()}`,
    content_type: file.type || 'application/octet-stream',
  });
  const data = unwrapFunctionResponse(response);
  if (!data?.file_url) throw new Error(data?.error || 'Independent upload failed');
  return data;
}

const coreCompatibility = {
  InvokeLLM: invokeIndependentAi,

  async GenerateImage(options = {}) {
    const response = await rawBase44.functions.invoke('vercelAiGateway', {
      action: 'generateImage',
      ...options,
    });
    const data = unwrapFunctionResponse(response);
    const url = data?.url || data?.urls?.[0] || null;
    if (!url) throw new Error(data?.error || 'Independent image generation failed');
    return { ...data, url };
  },

  async GenerateVideo(options = {}) {
    const response = await rawBase44.functions.invoke('independentVideo', options);
    const data = unwrapFunctionResponse(response);
    const url = data?.url || data?.video_url || data?.videos?.[0]?.url || null;
    if (!url) throw new Error(data?.error || 'Independent video generation failed');
    return { ...data, url };
  },

  async SendEmail(options = {}) {
    const response = await rawBase44.functions.invoke('independentEmail', {
      ...(options.to === 'jeremy@strategicmindsai.com' ? { action: 'contact' } : {}),
      ...options,
    });
    const data = unwrapFunctionResponse(response);
    if (data?.ok === false || data?.error) throw new Error(data?.error || 'Independent email failed');
    return data?.result ?? data;
  },

  async UploadFile({ file } = {}) {
    return uploadIndependentFile(file);
  },

  async UploadPublicFile({ file } = {}) {
    return uploadIndependentFile(file);
  },
};

const integrationsCompatibility = new Proxy(rawBase44.integrations || {}, {
  get(target, prop) {
    if (prop === 'Core') return coreCompatibility;
    const value = Reflect.get(target, prop, target);
    return typeof value === 'function' ? value.bind(target) : value;
  },
});

// Compatibility membrane: legacy UI code can keep calling
// base44.integrations.Core.* while execution is routed to the independent
// gateways above. Entity/auth/function behavior remains native Base44.
export const base44 = new Proxy(rawBase44, {
  get(target, prop) {
    if (prop === 'integrations') return integrationsCompatibility;
    const value = Reflect.get(target, prop, target);
    return typeof value === 'function' ? value.bind(target) : value;
  },
});
