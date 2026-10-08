// Normalize independent AI responses to the shape previously returned by InvokeLLM.
// Routes directly through the Vercel AI Gateway via the shared helper — no
// function-to-function hop, no Base44 integration credits.
import { generateText } from './aiGateway.ts';

export async function invokeIndependentAi(base44: any, options: any) {
  const { prompt, response_json_schema, system_prompt, model, file_urls, max_tokens, temperature } = options;
  const result = await generateText({
    prompt,
    system_prompt,
    model: model || 'google/gemini-3-flash',
    response_json_schema,
    file_urls,
    max_tokens,
    temperature,
  });
  if (result.parsed === undefined || result.parsed === null) {
    throw new Error('The AI gateway did not return a result.');
  }
  return result.parsed;
}