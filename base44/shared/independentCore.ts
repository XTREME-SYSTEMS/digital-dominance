// Normalize independent AI responses to the shape previously returned by InvokeLLM.
export async function invokeIndependentAi(base44: any, options: any) {
  const response = await base44.functions.invoke('independentAi', options);
  const data = response.data;
  if (!data?.ok || data.result === undefined || data.result === null) {
    throw new Error(data?.error || 'Independent AI did not return a result');
  }
  if (options.response_json_schema && (typeof data.result !== 'object' || Array.isArray(data.result))) {
    throw new Error('Independent AI did not return valid structured data');
  }
  return data.result;
}