import { secrets } from 'base44:runtime';
import { operatorEntities, operatorFunctions } from './operatorCatalog.js';

export async function executeHostedTool(base44, name, args) {
  const svc = base44.asServiceRole;
  if (name === 'get_capabilities') return {
    runtime: 'Base44-hosted bridge with external Vercel AI, NOT a completed standalone migration',
    site_editing: 'DynamicPage records, visual editor drafts and existing siteDirectEditor operations. No sandbox terminal access.',
    configured_not_verified: { ai: !!secrets.get('VERCEL_AI_GATEWAY_API_KEY'), vercel: !!secrets.get('VERCEL_API_TOKEN'), github: !!secrets.get('GITHUB_TOKEN') && !!secrets.get('GITHUB_REPO'), browser: !!secrets.get('CLOUD_BROWSER_ENGINE_URL') && !!secrets.get('ENGINE_API_KEY') },
    entities: operatorEntities, functions: operatorFunctions,
    warning: 'Hosted function execution, managed connectors, auth and database still depend on Base44. External API keys do not remove the hosted runtime quota.',
  };
  if (name === 'invoke_function') {
    if (!Object.hasOwn(operatorFunctions, args.function_name)) throw new Error('Function is not available to this operator.');
    const p = args.payload || {};
    if ((args.function_name === 'godaddyApi' && !['listDomains','getDomain','checkAvailability','getDnsRecords','getPurchaseAgreements'].includes(p.action)) || (args.function_name === 'vercelManager' && /delete|remove/i.test(p.action || '')) || (args.function_name === 'socialStudio' && /publish/i.test(p.action || ''))) throw new Error('This financial, destructive or external-publication action requires specific human approval through its existing management screen.');
    const res = await base44.functions.invoke(args.function_name, p);
    return res.data;
  }
  if (!operatorEntities.includes(args.entity)) throw new Error('Entity is not available.');
  const entity = svc.entities[args.entity];
  if (name === 'read_entities') {
    if (args.id) return await entity.get(args.id);
    if (args.count_only && args.entity !== 'User') return { count: await entity.count(args.query || {}) };
    if (args.entity === 'User') return await entity.filter(args.query || {}, '-created_date', 20);
    return await entity.filter(args.query || {}, { sort: '-created_date', limit: 30, ...(args.cursor ? { cursor: args.cursor } : {}) });
  }
  if (name === 'write_entity') {
    if (args.entity === 'User') throw new Error('User account writes are not available.');
    if (args.operation === 'create') return await entity.create(args.data || {});
    if (!args.id) throw new Error('An exact record id is required.');
    if (args.operation === 'update') return await entity.update(args.id, args.data || {});
    if (args.operation === 'delete') { await entity.delete(args.id); return { ok: true, message: `Deleted requested ${args.entity} record ${args.id}.` }; }
  }
  throw new Error('Unsupported tool operation.');
}