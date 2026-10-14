/**
 * Independently invocable QA evaluator. Does not call the Universal Generator
 * and does not share its source. A synthetic PASS is NOT a release approval.
 */
const validators = [
  ["html_document", html => /<!doctype html/i.test(html) && /<html\b/i.test(html) && /<\/html>/i.test(html)],
  ["head_and_body", html => /<head\b/i.test(html) && /<\/head>/i.test(html) && /<body\b/i.test(html) && /<\/body>/i.test(html)],
  ["title", html => /<title\b[^>]*>[^<]{3,}<\/title>/i.test(html)],
  ["visible_heading", html => /<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(html)],
  ["explicit_noindex", html => /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)],
  ["sandbox_csp", html => /http-equiv=["']Content-Security-Policy["']/i.test(html) && /form-action &#39;none&#39;/i.test(html)],
  ["contact_path", html => /<form\b/i.test(html) || /href=["']tel:/i.test(html) || /href=["']mailto:/i.test(html)],
  ["minimum_content", html => html.length >= 3000],
  ["external_script_blocked_by_csp", html => /default-src &#39;none&#39;/i.test(html)],
];
export const QA_AGENT_ID = "independent-universal-qa-v1";
export function validateSandboxArtifact(html, ctx = {}) {
  if (typeof html !== "string") throw new Error("QA_REQUIRES_HTML");
  const checks = validators.map(([name, predicate]) => {
    let ok = false;
    try { ok = !!predicate(html); } catch (_) { ok = false; }
    return { name, status: ok ? "PASS" : "FAIL" };
  });
  if (!ctx.synthetic) checks.push({name:"synthetic_isolation",status:"FAIL"});
  else checks.push({name:"synthetic_isolation",status:"PASS"});
  if (!ctx.source_sha || ctx.source_sha === "UNKNOWN")
    checks.push({name:"source_identity",status:"FAIL"});
  else checks.push({name:"source_identity",status:"PASS"});
  const falseClaimPatterns = [
    /\blicensed(?:\s+and\s+|\s*[,/&]\s*)insured\b/i,
    /\bguaranteed\s+(?:first\s+page|rankings|top\s+ranking)\b/i,
    /\b(?:over\s+)?\d{2,}\s+verified\s+(?:reviews|projects)\b/i,
  ];
  const uncheckedClaims = falseClaimPatterns.filter(re => re.test(html)).length;
  const status = checks.every(c => c.status === "PASS") ? "PASS" : "FAIL";
  return Object.freeze({
    qa_agent_id: QA_AGENT_ID,
    independence: "SEPARATE_MODULE_AND_PROCESS_CAPABLE",
    status, checks, passed: checks.filter(c => c.status === "PASS").length,
    failed: checks.filter(c => c.status === "FAIL").length,
    unverified_marketing_claim_patterns: uncheckedClaims,
    release_ready: false,
    release_blockers: [
      "NO_PUBLICATION_IN_SYNTHETIC_SANDBOX",
      "NO_BUYER_PROOF_OR_ORIGINAL_CONTENT_ATTESTATION",
      "NO_AUTH_RLS_PERSISTENCE_OR_RUNTIME_WEB_VITALS_RECEIPTS",
      "NO_DEPLOYMENT_APPROVAL"
    ],
    source_sha: ctx.source_sha || "UNKNOWN",
    plan_id: ctx.plan_id || "UNKNOWN",
    evidence_class: "SYNTHETIC_OFFLINE_HTML_INSPECTION",
  });
}