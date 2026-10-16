/**
 * Additive, fail-closed intelligence contract for the existing Universal Generator.
 * Does not publish, provision, or mutate persistent records.
 */
export type GateState = "PASS" | "FAIL" | "UNKNOWN" | "BLOCKED";
export interface Proof { source: string; observedAt: string; artifactId: string; status: GateState }
export interface VerifiedFact { value: string; proof: Proof }
export interface DesignBlueprint {
  version: "1.0";
  projectId: string;
  industry: string;
  targetBuyer: string;
  uniqueValueProposition: string;
  primaryConversion: string;
  layoutFamily: string;
  visualDirection: string;
  typography: { heading: string; body: string };
  colorTokens: Record<string, string>;
  contentSections: { id: string; purpose: string; evidenceRequired: boolean }[];
  competitors: { url: string; observation: string; proof: Proof }[];
  assets: { url: string; kind: "hero" | "gallery" | "logo" | "icon"; license: string; proof: Proof }[];
  businessFacts: Record<string, VerifiedFact>;
  localization: { market: string; uniqueServiceEvidence?: Proof };
  approvedVisual?: { referenceId: string; approvedAt: string };
}
export interface QualityEvidence {
  sourceSha?: string;
  previewUrl?: string;
  independentValidatorId?: string;
  checks: Record<string, Proof>;
  visualParity?: { value: number; referenceId: string; desktop: Proof; tablet: Proof; mobile: Proof };
}
export const REQUIRED_CHECKS = [
  "build","lint","type","security","tenantIsolation","forms","navigation",
  "mobile","accessibility","seo","noindex","assets","performance","content","rollback"
] as const;
const fresh = (p?: Proof) => Boolean(p && p.status === "PASS" && p.source && p.observedAt && p.artifactId);
export function assessGeneratorIntelligence(blueprint: DesignBlueprint, evidence?: QualityEvidence) {
  const failures: string[] = [];
  const unknown: string[] = [];
  if (blueprint.version !== "1.0") failures.push("contract_version");
  if (!blueprint.projectId || !blueprint.industry || !blueprint.targetBuyer || !blueprint.primaryConversion) failures.push("brief_incomplete");
  if (blueprint.competitors.length < 3 || blueprint.competitors.some(c => !fresh(c.proof))) unknown.push("research_three_comparables");
  if (!blueprint.uniqueValueProposition || blueprint.contentSections.length < 5) failures.push("undifferentiated_content");
  if (!blueprint.assets.some(a => a.kind === "hero") || blueprint.assets.some(a => !a.license || !fresh(a.proof))) unknown.push("asset_provenance");
  if (!Object.keys(blueprint.businessFacts).length || Object.values(blueprint.businessFacts).some(f => !fresh(f.proof))) unknown.push("business_fact_verification");
  if (blueprint.localization.market && !fresh(blueprint.localization.uniqueServiceEvidence)) unknown.push("unique_local_value");
  if (!blueprint.approvedVisual) unknown.push("visual_approval");
  if (!evidence?.sourceSha || !evidence.previewUrl || !evidence.independentValidatorId) unknown.push("runtime_identity");
  for (const check of REQUIRED_CHECKS) if (!fresh(evidence?.checks?.[check])) unknown.push("check_" + check);
  if (!evidence?.visualParity || evidence.visualParity.value < 0.99 ||
      !blueprint.approvedVisual || evidence.visualParity.referenceId !== blueprint.approvedVisual.referenceId ||
      !fresh(evidence.visualParity.desktop) || !fresh(evidence.visualParity.tablet) || !fresh(evidence.visualParity.mobile)) unknown.push("measured_visual_parity");
  return { status: failures.length ? "FAIL" as GateState : unknown.length ? "UNKNOWN" as GateState : "PASS" as GateState,
    failures, unknown, canPublish: failures.length === 0 && unknown.length === 0 };
}
export function assertGeneratorReleaseAllowed(blueprint: DesignBlueprint, evidence: QualityEvidence) {
  const result = assessGeneratorIntelligence(blueprint, evidence);
  if (!result.canPublish) throw new Error("Generator quality gate blocked: " + [...result.failures, ...result.unknown].join(","));
  return result;
}
