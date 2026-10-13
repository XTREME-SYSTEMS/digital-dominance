// Pure, provider-neutral safety contract for Digital Dominance GPT sync v4.
// Does not import Base44 or dispatch jobs. No production mutation authority.
export const SYNC_PREVIEW_VERSION = 'dd-gpt-sync-v4-safe-preview.1';
export const SAFE_SYNC_ENTITIES = Object.freeze(['SyncEvent']);
const SAFE_ACTIONS = new Set(['getConfig','getPending','previewSync','previewPacket','stats','listEvents','execute']);
const STATES = new Set(['pending','synced','processed','failed']);
const DIRECTIONS = new Set(['to_gpt','from_gpt','internal']);
const EVENT_TYPES = new Set(['entity_create','entity_update','entity_delete','function_invoke','workflow_run','state_snapshot','gpt_command','gpt_response','sync_cycle']);

const plain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
export function boundedLimit(v, fallback = 20, max = 50) {
  if (v === undefined || v === null || v === '') return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(max, Math.floor(n)));
}
export function safeEventFilter(query = {}) {
  if (!plain(query)) throw new Error('INVALID_EVENT_FILTER');
  const enums = {status: STATES, direction: DIRECTIONS, event_type: EVENT_TYPES};
  const entries = Object.entries(query);
  if (entries.length > 3) throw new Error('FILTER_TOO_BROAD');
  const out = {};
  for (const [key,value] of entries) {
    if (!Object.hasOwn(enums,key) || typeof value !== 'string' || !enums[key].has(value))
      throw new Error('EVENT_FILTER_NOT_ALLOWED');
    out[key] = value;
  }
  return out;
}
export function authorizeHostedRead(tool, args = {}) {
  if (!plain(args)) return {allowed:false,reason:'INVALID_TOOL_ARGUMENTS'};
  if (tool === 'get_capabilities') return {allowed:true,scope:'read_capabilities'};
  if (tool !== 'read_entities') return {allowed:false,reason:'WRITE_OR_EXECUTION_REQUIRES_APPROVAL'};
  if (args.entity !== 'SyncEvent') return {allowed:false,reason:'ENTITY_NOT_ALLOWED'};
  if ('id' in args || 'cursor' in args || 'count_only' in args || 'operation' in args)
    return {allowed:false,reason:'UNSCOPED_READ_ARGUMENT'};
  if (Object.keys(args).some(k => !['entity','query','limit'].includes(k)))
    return {allowed:false,reason:'UNKNOWN_TOOL_ARGUMENT'};
  try { safeEventFilter(args.query || {}); }
  catch (error) { return {allowed:false,reason:error.message}; }
  if ('limit' in args && (!Number.isInteger(Number(args.limit)) || Number(args.limit) < 1))
    return {allowed:false,reason:'INVALID_READ_LIMIT'};
  return {allowed:true,scope:'event_metadata_only'};
}
export function authorizeSyncAction(action, body = {}) {
  if (!plain(body)) return {allowed:false,reason:'INVALID_REQUEST_BODY'};
  if (!SAFE_ACTIONS.has(action)) return {allowed:false,reason:'MUTATION_OR_TAKEOVER_REQUIRES_APPROVED_ADAPTER'};
  if (action === 'execute') return authorizeHostedRead(body.tool,body.args || {});
  return {allowed:true,scope:'read_only'};
}
const str=(v,max=100)=>typeof v === 'string' ? v.slice(0,max) : null;
export function sanitizeSyncEvent(e) {
  // Allowlist projection, never return summaries, context, payload or client data.
  return {
    id:str(e?.id,128), event_type:str(e?.event_type,64), entity_name:str(e?.entity_name,80),
    source:str(e?.source,32), direction:str(e?.direction,32),status:str(e?.status,32),
    created_date:str(e?.created_date,48), synced_at:str(e?.synced_at,48)
  };
}
export function sanitizeEvents(raw) {
  const records=Array.isArray(raw)?raw:(Array.isArray(raw?.items)?raw.items:[]);
  return records.slice(0,50).map(sanitizeSyncEvent);
}
function canonical(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return '['+value.map(canonical).join(',')+']';
  if (plain(value)) return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
  throw new TypeError('INVALID_CANONICAL_JSON');
}
async function sha256(input) {
  const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(input)));
  return Array.from(new Uint8Array(buf)).map(v=>v.toString(16).padStart(2,'0')).join('');
}
const safeIdentifier=(v,max=160)=>typeof v === 'string' && v.length >= 1 && v.length <= max && /^[a-zA-Z0-9._:/-]+$/.test(v);
export async function compilePreviewPacket(input) {
  if (!plain(input)) throw new Error('INVALID_PACKET');
  const keys=['project_id','tenant_id','actor_id','source_system','source_sha256','expected_target_revision','observed_target_revision','action_class','new_creative_mission','foresight_receipt_id','approved_design_ref'];
  if (Object.keys(input).some(k=>!keys.includes(k))) throw new Error('UNAPPROVED_PACKET_FIELD');
  for (const k of ['project_id','tenant_id','actor_id','source_system','expected_target_revision','observed_target_revision'])
    if (!safeIdentifier(input[k])) throw new Error('INVALID_PACKET_FIELD_'+k);
  if (typeof input.source_sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(input.source_sha256))
    throw new Error('INVALID_SOURCE_SHA256');
  if (!['github','chatgpt','base44','x1'].includes(input.source_system)) throw new Error('INVALID_SOURCE_SYSTEM');
  if (!['READ','DRAFT','BRANCH_WRITE','PREVIEW_WRITE','PROTECTED'].includes(input.action_class))
    throw new Error('INVALID_ACTION_CLASS');
  if (input.new_creative_mission !== undefined && typeof input.new_creative_mission !== 'boolean')
    throw new Error('INVALID_CREATIVE_FLAG');
  for (const k of ['foresight_receipt_id','approved_design_ref'])
    if (input[k] !== undefined && !safeIdentifier(input[k])) throw new Error('INVALID_PACKET_FIELD_'+k);
  const revisionConflict=input.expected_target_revision !== input.observed_target_revision;
  const holds=[];
  if (revisionConflict) holds.push('TARGET_REVISION_CONFLICT');
  if (input.new_creative_mission) holds.push(input.foresight_receipt_id ? 'FORESIGHT_RECEIPT_NOT_INDEPENDENTLY_VERIFIED' : 'FORESIGHT_RECEIPT_MISSING');
  if (!['READ','DRAFT'].includes(input.action_class)) holds.push('WRITE_REQUIRES_APPROVED_ADAPTER');
  // No actor/tenant credential checking here: this is a pure preview only.
  const packetId=await sha256({contract:SYNC_PREVIEW_VERSION,...input});
  return {
    contract_version:SYNC_PREVIEW_VERSION,packet_id:packetId,idempotency_key:'ddsync:'+packetId,
    project_id:input.project_id,tenant_id:input.tenant_id,source_system:input.source_system,
    source_sha256:input.source_sha256,expected_target_revision:input.expected_target_revision,
    observed_target_revision:input.observed_target_revision,status:holds.length?'HOLD':'PENDING_REVIEW',
    holds,actor_authenticated:false,foresight_validated:false,independent_validator:'NOT_RUN',
    provider_writes:0,dispatched_jobs:0,rollback:'DISCARD_PREVIEW',source_classification:'UNVERIFIED_INPUT'
  };
}
