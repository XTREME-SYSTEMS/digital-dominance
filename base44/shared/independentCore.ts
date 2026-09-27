// Independent compatibility helpers for backend Base44 functions.
// These preserve the return shapes callers expect while routing work away
// from Base44 Core integration credits.

function unwrap(response: any) {
  return response?.data ?? response ?? {};
}

export async function invokeIndependentAi(base44: any, options: any) {
  // Preserve Base44 Core.InvokeLLM internet-grounding semantics. A successful
  // free text model is not an acceptable substitute for a live research call.
  if (options?.add_context_from_internet) {
    const response = await base44.functions.invoke('vercelAiGateway', {
      action: 'generateText',
      ...options,
      model: 'perplexity/sonar-pro',
    });
    const data = unwrap(response);
    const result = options?.response_json_schema ? (data?.parsed ?? data?.text) : (data?.text ?? data?.parsed);
    if (result === undefined || result === null || result === '') {
      throw new Error(data?.error || 'External research model returned no result');
    }
    return result;
  }

  let primaryError: any = null;

  try {
    const response = await base44.functions.invoke('independentAi', options);
    const data = unwrap(response);
    if (data?.ok && data.result !== undefined && data.result !== null) {
      if (options.response_json_schema && (typeof data.result !== 'object' || Array.isArray(data.result))) {
        throw new Error('Independent AI did not return valid structured data');
      }
      return data.result;
    }
    primaryError = new Error(data?.error || 'Independent AI did not return a result');
  } catch (error: any) {
    primaryError = error;
  }

  // Paid-but-independent fallback. This is separate from Base44 integration
  // credits and keeps the app operational when free providers are unavailable.
  try {
    const response = await base44.functions.invoke('vercelAiGateway', {
      action: 'generateText',
      ...options,
    });
    const data = unwrap(response);
    const result = options.response_json_schema ? (data?.parsed ?? data?.text) : (data?.text ?? data?.parsed);
    if (result === undefined || result === null || result === '') {
      throw new Error(data?.error || 'Vercel AI Gateway returned no result');
    }
    if (options.response_json_schema && (typeof result !== 'object' || Array.isArray(result))) {
      throw new Error('Vercel AI Gateway did not return valid structured data');
    }
    return result;
  } catch (fallbackError: any) {
    const unavailable = new Error(
      `Independent AI providers failed. Primary: ${primaryError?.message || 'unknown'}; fallback: ${fallbackError?.message || 'unknown'}`
    );
    (unavailable as any).status = 503;
    throw unavailable;
  }
}

export async function sendIndependentEmail(base44: any, options: any) {
  const response = await base44.functions.invoke('independentEmail', options);
  const data = unwrap(response);
  if (data?.error || data?.ok === false) {
    throw new Error(data?.error || 'Independent email failed');
  }
  return data?.result ?? data;
}

export async function generateIndependentImage(base44: any, options: any) {
  const response = await base44.functions.invoke('vercelAiGateway', {
    action: 'generateImage',
    ...options,
  });
  const data = unwrap(response);
  const url = data?.url || data?.urls?.[0] || null;
  if (!url) throw new Error(data?.error || 'Independent image generation failed');
  return { ...data, url };
}

export async function generateIndependentVideo(base44: any, options: any) {
  const response = await base44.functions.invoke('independentVideo', options);
  const data = unwrap(response);
  const url = data?.url || data?.video_url || data?.videos?.[0]?.url || null;
  if (!url) throw new Error(data?.error || 'Independent video generation failed');
  return { ...data, url };
}
