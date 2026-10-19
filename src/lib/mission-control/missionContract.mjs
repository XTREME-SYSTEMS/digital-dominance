/**
 * Digital Dominance / Strategic Minds AI mission contract.
 * Pure, side-effect-free V1 kernel. NOT a deployed executor or an approval service.
 * All approvals must be verified by a trusted backend, never by the browser or LLM.
 */
export const STATES = Object.freeze([
  "DRAFT", "PLANNED", "QUEUED", "RUNNING", "AWAITING_APPROVAL",
  "VALIDATING", "COMPLETED", "FAILED", "CANCELLED"
]);

const NEXT = Object.freeze({
  DRAFT: ["PLANNED", "CANCELLED"],
  PLANNED: ["QUEUED", "AWAITING_APPROVAL", "CANCELLED"],
  QUEUED: ["RUNNING", "AWAITING_APPROVAL", "CANCELLED"],
  RUNNING: ["AWAITING_APPROVAL", "VALIDATING", "FAILED", "CANCELLED"],
  AWAITING_APPROVAL: ["QUEUED", "RUNNING", "CANCELLED"],
  VALIDATING: ["COMPLETED", "FAILED", "RUNNING", "CANCELLED"],
  COMPLETED: [], FAILED: ["QUEUED", "CANCELLED"], CANCELLED: []
});

const READ_TOOLS = new Set(["get_capabilities", "read_entities"]);
const PROTECTED_WORDS = /delete|remove|publish|post|send|email|sms|call|voice|purchase|buy|checkout|pay|billing|spend|deploy|release|merge|dns|domain|secret|key|credential|permission|production|migrate|schema|rls|rotate|grant|revoke/i;

function requireNonEmpty(value, name, max = 12000) {
  if (typeof value !== "string" || !value.trim() || value.length > max) {
    throw new TypeError(name + " must be non-empty text of at most " + max + " characters");
  }
  return value.trim();
}
function requireMission(mission) {
  if (!mission?.id || !mission?.tenantId || !mission?.actorId) {
    throw new TypeError("Trusted mission, tenant and actor identities are required");
  }
}
export function determineLane(goal) {
  const text = goal.toLowerCase();
  if (/website|landing page|site fleet|seo|nearme|nearyou|domain/.test(text)) return "WEBSITE_FACTORY";
  if (/video|social|post|content calendar|campaign|marketing/.test(text)) return "MARKETING";
  if (/code|software|app|api|bug|repository/.test(text)) return "ENGINEERING";
  if (/research|compare|investigate|audit|analy[sz]e/.test(text)) return "RESEARCH";
  return "GENERAL_OPERATOR";
}
export function createMission({ id, goal, actorId, tenantId, sourceSha, scope = "staging" }) {
  requireNonEmpty(id, "id", 128);
  requireNonEmpty(actorId, "actorId", 128);
  requireNonEmpty(tenantId, "tenantId", 128);
  requireNonEmpty(goal, "goal");
  if (!["staging", "sandbox", "draft"].includes(scope)) throw new TypeError("V1 missions must be nonproduction");
  const lane = determineLane(goal);
  return {
    schemaVersion: 1, id, goal: goal.trim(), actorId, tenantId,
    sourceSha: sourceSha || null, scope, lane, status: "DRAFT",
    stages: [
      { id: "source-truth", status: "PENDING", requiresApproval: false },
      { id: "research", status: "PENDING", requiresApproval: false },
      { id: "plan", status: "PENDING", requiresApproval: false },
      { id: lane === "WEBSITE_FACTORY" ? "site-spec-and-pack" : "work-packet", status: "PENDING", requiresApproval: false },
      { id: "approval", status: "PENDING", requiresApproval: true },
      { id: "sandbox-execution", status: "PENDING", requiresApproval: false },
      { id: "independent-validation", status: "PENDING", requiresApproval: false }
    ],
    approvalIds: [], receipts: []
  };
}
export function transitionMission(mission, nextStatus, { reason, validationReceipt } = {}) {
  requireMission(mission);
  if (!STATES.includes(nextStatus) || !NEXT[mission.status]?.includes(nextStatus)) {
    throw new Error("Illegal mission state transition: " + mission.status + " -> " + nextStatus);
  }
  requireNonEmpty(reason, "reason", 1000);
  if (nextStatus === "COMPLETED" &&
      (!validationReceipt || validationReceipt.status !== "PASS" ||
       validationReceipt.missionId !== mission.id ||
       !validationReceipt.validatorId || validationReceipt.validatorId === mission.actorId)) {
    throw new Error("COMPLETED requires a matching independent PASS validation receipt");
  }
  return {
    ...mission, status: nextStatus,
    receipts: nextStatus === "COMPLETED"
      ? [...mission.receipts, validationReceipt] : mission.receipts
  };
}
export function classifyToolCall(toolName, args = {}) {
  requireNonEmpty(toolName, "toolName", 128);
  if (READ_TOOLS.has(toolName)) return { risk: "READ", target: args.entity || toolName };
  const target = args.function_name || args.entity || args.target || toolName;
  const descriptor = [toolName, target, args.action, args.operation].filter(Boolean).join(":");
  if (PROTECTED_WORDS.test(descriptor) || args.operation === "delete") {
    return { risk: "PROTECTED", target: String(target) };
  }
  // Unknown tools, provider functions and all mutations fail closed, even when their name sounds safe.
  return { risk: "WRITE_REVIEW", target: String(target) };
}
export function authorizeToolCall({ mission, toolName, args = {}, approval = null, verifiedByServer = false, now = Date.now() }) {
  requireMission(mission);
  const action = classifyToolCall(toolName, args);
  if (action.risk === "READ") return { allowed: true, risk: "READ", reason: "Read-only by policy, subject to backend tenant authorization" };
  if (!verifiedByServer || !approval || approval.missionId !== mission.id ||
      approval.tenantId !== mission.tenantId || approval.actorId !== mission.actorId ||
      approval.toolName !== toolName || approval.target !== action.target ||
      !approval.id || !Number.isFinite(approval.expiresAt) || approval.expiresAt <= now) {
    return { allowed: false, risk: action.risk, reason: "Trusted, scoped, unexpired server approval required" };
  }
  // Production, destructive, external communications and spend additionally require
  // dedicated action-specific workflows. Generic chat approvals can NEVER authorize them.
  if (action.risk === "PROTECTED") return { allowed: false, risk: action.risk, reason: "Protected action requires dedicated provider approval workflow" };
  if (mission.scope !== "draft" && mission.scope !== "sandbox" && mission.scope !== "staging") {
    return { allowed: false, risk: action.risk, reason: "Nonproduction scope required" };
  }
  return { allowed: true, risk: action.risk, approvalId: approval.id, reason: "Scoped nonproduction approval verified by trusted backend" };
}
