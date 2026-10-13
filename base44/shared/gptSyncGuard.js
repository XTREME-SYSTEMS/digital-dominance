// Digital Dominance GPT Sync: side-effect-free policy for an external bridge.
// Branch preview only; no provider or credential dependencies.
export const SYNC_CONTRACT_VERSION = 'dd-gpt-sync-3.1-preview';

export const SAFE_SYNC_ENTITIES = Object.freeze([
  'ApprovalRequest', 'BuildManifest', 'DeploymentRecord', 'PackSyncReceipt',
  'PackValidationRun', 'SiteValidationReceipt', 'SyncEvent', 'SystemManifest',
  'ValidationReceipt', 'WebsiteQueue', 'WorkPacket',
]);

const ACTIONS_READ_ONLY = new Set([
  'getConfig', 'stats', 'listEvents', 'getPending', 'previewSync', 'execute',
]);
const PROHIBITED_QUERY_KEYS = /(?:^\$where$|^\$function$|^\$accumulator$|__proto__|prototype|constructor|\beval\b)/i;

export function authorizeHostedRead(tool, args = {}) {
  if (!args || typeof args !== 'object' || Array.isArray(args))
    return { allowed: false, reason: 'INVALID_TOOL_ARGS' };
  if (tool === 'get_capabilities') return { allowed: true, scope: 'read_capabilities' };
  if (tool !== 'read_entities') return { allowed: false, reason: 'WRITE_OR_EXECUTION_REQUIRES_APPROVAL' };
  if (!SAFE_SYNC_ENTITIES.includes(args.entity))
    return { allowed: false, reason: 'ENTITY_NOT_IN_SAFE_READ_ALLOWLIST' };
  if (args.query != null) {
    if (typeof args.query !== 'object' || Array.isArray(args.query))
      return { allowed: false, reason: 'INVALID_QUERY' };
    if (JSON.stringify(args.query).length > 1200)
      return { allowed: false, reason: 'QUERY_TOO_LARGE' };
    const check = (node) => {
      if (Array.isArray(node)) return node.every(check);
      if (!node || typeof node !== 'object') return true;
      return Object.entries(node).every(([key, value]) => !PROHIBITED_QUERY_KEYS.test(key) && check(value));
    };
    if (!check(args.query)) return { allowed: false, reason: 'QUERY_OPERATOR_PROHIBITED' };
  }
  if (args.id != null && (typeof args.id !== 'string' || args.id.length > 256))
    return { allowed: false, reason: 'INVALID_ENTITY_ID' };
  return { allowed: true, scope: 'read_entity_metadata' };
}

export function authorizeSyncAction(action, body = {}) {
  if (!ACTIONS_READ_ONLY.has(action))
    return { allowed: false, reason: 'ACTION_REQUIRES_APPROVED_WRITE_ADAPTER' };
  if (action === 'execute') return authorizeHostedRead(body.tool, body.args);
  return { allowed: true, scope: 'read_only' };
}

const safeStr = (value, max=120) => typeof value === 'string' ? value.slice(0,max) : null;
export function sanitizeSyncEvent(event) {
  return {
    id: safeStr(event?.id,128),
    event_type: safeStr(event?.event_type,64),
    entity_name: safeStr(event?.entity_name,80),
    source: safeStr(event?.source,32),
    direction: safeStr(event?.direction,32),
    status: safeStr(event?.status,32),
    created_date: safeStr(event?.created_date,64),
    synced_at: safeStr(event?.synced_at,64),
  };
}

const REDACTED_KEYS = /(?:password|token|secret|key|credential|authorization|cookie|email|phone|address|private|client|gpt_context|gpt_response|data_summary|content|description)/i;
export function scrubSyncData(input, depth=0) {
  if (depth > 6) return '[depth_limit]';
  if (input == null || typeof input === 'boolean' || typeof input === 'number') return input;
  if (typeof input === 'string') return input.slice(0,240);
  if (Array.isArray(input)) return input.slice(0,50).map(x => scrubSyncData(x,depth+1));
  if (typeof input === 'object') {
    const out = {};
    for (const [key,value] of Object.entries(input).slice(0,60)) {
      out[key] = REDACTED_KEYS.test(key) ? '[redacted]' : scrubSyncData(value,depth+1);
    }
    return out;
  }
  return '[unsupported]';
}

export function boundedLimit(raw, fallback=20, maximum=50) {
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(1, Math.min(maximum, Math.floor(n))) : fallback;
}
