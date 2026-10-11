/**
 * Server-only Supabase project selection policy. NOT a connected database client.
 * Server-owned project credentials are not returned by this module.
 */
import { readFileSync } from 'node:fs';
const registry = JSON.parse(readFileSync(new URL('./project-map.json', import.meta.url), 'utf8'));
const VALID_OPERATIONS = new Set(['health.metadata', 'queue.status.aggregate', 'mission.draft.record']);
const SENSITIVE_NAMES = /(?:secret|password|token|api[_-]?key|onboarding_clients|owner|phone_number|distressed_properties)/i;
export class ProjectRouteDenied extends Error {
  constructor(code) { super(code); this.code=code; this.name='ProjectRouteDenied'; }
}
export function resolveProjectRoute({ projectKey, operation, principal, tenantId, actionClass='READ' }) {
  if (!principal?.verifiedByServer || typeof principal.subject !== 'string' || !principal.subject.trim()) throw new ProjectRouteDenied('AUTHENTICATED_PRINCIPAL_REQUIRED');
  if (!tenantId || principal.tenantId !== tenantId) throw new ProjectRouteDenied('CROSS_TENANT_ACCESS_DENIED');
  if (!VALID_OPERATIONS.has(operation) || SENSITIVE_NAMES.test(operation)) throw new ProjectRouteDenied('UNAPPROVED_OPERATION');
  const project=registry.projects[projectKey];
  if (!project) throw new ProjectRouteDenied('UNKNOWN_PROJECT');
  if (!project.allowed_operations.includes(operation)) throw new ProjectRouteDenied('PROJECT_OPERATION_NOT_APPROVED');
  if (projectKey !== 'x1_staging' && actionClass !== 'READ') throw new ProjectRouteDenied('PRODUCTION_OR_SPECIALIST_WRITE_PROTECTED');
  if (projectKey === 'x1_staging' && actionClass !== (operation === 'mission.draft.record' ? 'DRAFT' : 'READ')) throw new ProjectRouteDenied('UNAPPROVED_ACTION_CLASS');
  return Object.freeze({projectKey,projectRef:project.project_ref,environmentPrefix:project.server_env_prefix,operation,actionClass,tenantId,execution:'SERVER_ADAPTER_REQUIRED',credentials:'NOT_ATTACHED',validated:false});
}
export function listProjectReadiness() {
  return Object.entries(registry.projects).map(([key,data])=>({key,projectRef:data.project_ref,role:data.role,protection:data.protection,allowedOperations:[...data.allowed_operations],runtimeConnected:false}));
}
