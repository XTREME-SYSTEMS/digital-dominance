// Test records must never reach an outbound email provider, even on delayed jobs.
export function suppressLeadEmail(lead: { test_data_classification?: string; email?: string }, recipient?: unknown): boolean {
  const classification = typeof lead.test_data_classification === "string"
    ? lead.test_data_classification.trim().toLowerCase() : "";
  if (["test_confirmed", "test_likely"].includes(classification)) return true;
  return [lead.email, recipient].some(value => {
    if (typeof value !== "string") return false;
    // Match reserved domains in plain, name-address, or recipient-list input.
    // Boundaries prevent treating invalid.com as the reserved invalid domain.
    return /@(?:[a-z0-9-]+\.)*invalid(?=[>\s,;]|$)/i.test(value.trim());
  });
}
