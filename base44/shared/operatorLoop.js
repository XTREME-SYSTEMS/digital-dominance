import { operatorInstructions, operatorEntities, operatorFunctions } from './operatorCatalog.js';

const fn = (name, description, properties, required = []) => ({ type: 'function', function: { name, description, parameters: { type: 'object', properties, required, additionalProperties: false } } });
export const operatorTools = [
  fn('get_capabilities', 'Inspect actual runtime, configured services and available tools. Configuration is not authorization verification.', {}),
  fn('read_entities', 'Read or count records using a server-side query. Paginate with cursor. Sensitive credential entities are not available.', { entity: { type: 'string', enum: operatorEntities }, query: { type: 'object' }, id: { type: 'string' }, count_only: { type: 'boolean' }, cursor: { type: 'string' } }, ['entity']),
  fn('write_entity', 'Create or update one record, or delete one explicitly requested record by id. Read an existing record first. User accounts cannot be written.', { entity: { type: 'string', enum: operatorEntities.filter(x => x !== 'User') }, operation: { type: 'string', enum: ['create', 'update', 'delete'] }, id: { type: 'string' }, data: { type: 'object' } }, ['entity', 'operation']),
  fn('invoke_function', 'Execute an available system function with its documented payload. The catalog lists exact actions. Do not infer provider success.', { function_name: { type: 'string', enum: Object.keys(operatorFunctions) }, payload: { type: 'object' } }, ['function_name', 'payload']),
];

export async function runOperator({ message, history = [], complete, execute, runtime }) {
  if (typeof message !== 'string' || !message.trim() || message.length > 12000) throw new Error('Enter a request of up to 12,000 characters.');
  const prior = history.slice(-12).filter(m => ['user', 'assistant'].includes(m?.role) && typeof m.content === 'string').map(m => ({ role: m.role, content: m.content.slice(0, 8000) }));
  const messages = [{ role: 'system', content: `${operatorInstructions}\nRuntime: ${runtime}\nFunction catalog: ${JSON.stringify(operatorFunctions)}` }, ...prior, { role: 'user', content: message.trim() }];
  const receipts = [];
  const deadline = Date.now() + 180000;
  for (let step = 0; step < 7 && Date.now() < deadline; step++) {
    const response = await complete({ messages, tools: operatorTools, tool_choice: 'auto', parallel_tool_calls: false, max_tokens: 5000 });
    const assistant = response.choices?.[0]?.message;
    if (!assistant) throw new Error('The AI provider returned no response.');
    if (!assistant.tool_calls?.length) return { ok: true, text: assistant.content || 'Please describe the task.', receipts, runtime };
    messages.push(assistant);
    for (const call of assistant.tool_calls) {
      const receipt = { tool: call.function?.name, status: 'failed', verified_at: new Date().toISOString() };
      let result;
      try {
        if (!operatorTools.some(t => t.function.name === receipt.tool)) throw new Error('Tool is not available.');
        const args = JSON.parse(call.function.arguments || '{}');
        result = await execute(receipt.tool, args);
        if (result?.ok === false || result?.success === false || result?.error) throw new Error(result.error || 'The operation did not succeed.');
        receipt.status = 'completed';
        receipt.target = args.entity || args.function_name || runtime;
        receipt.detail = result?.message || (args.id ? `Record ${args.id}` : 'Request completed; inspect the result for provider state.');
      } catch (error) { result = { ok: false, error: error.message }; receipt.detail = error.message; }
      receipts.push(receipt);
      const serialized = JSON.stringify(result ?? null);
      messages.push({ role: 'tool', tool_call_id: call.id, content: serialized.length > 24000 ? JSON.stringify({ truncated: true, preview: serialized.slice(0, 24000) }) : serialized });
    }
  }
  return { ok: true, text: 'The execution limit was reached. Review the results below; unverified steps are not complete.', receipts, runtime, stopped: true };
}