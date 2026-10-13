// Test records must never reach an outbound email provider, even on delayed jobs.
export function suppressLeadEmail(lead: { test_data_classification?: string; email?: string }, recipient?: unknown): boolean {
  if (["test_confirmed", "test_likely"].includes(lead.test_data_classification || "")) return true;
  return [lead.email, recipient].some(value => {
    if (typeof value !== "string") return false;
    // Reserved synthetic recipients are blocked even when an override is supplied.
    const address = value.trim().toLowerCase();
    return /@[^@\s]+\.invalid$/.test(address);
  });
}
