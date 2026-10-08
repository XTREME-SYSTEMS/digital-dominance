import { createClientFromRequest } from "npm:@base44/sdk@0.8.48";
import { DDV3_PREVIEW_POLICY_VERSION } from "../../shared/ddv3PreviewGuardrails.js";

async function stableArtifactId(buildPlanId: string) {
  const digest = new Uint8Array(await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${buildPlanId}|${DDV3_PREVIEW_POLICY_VERSION}`)
  ));
  return "wpv_" + Array.from(digest.slice(0, 12)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const PREVIEW_SCHEMA = {
  type: "object",
  properties: {
    brand: {
      type: "object",
      properties: {
        name: { type: "string" },
        tagline: { type: "string" },
        style_direction: { type: "string" },
        primary_cta: { type: "string" }
      },
      required: ["name", "tagline", "style_direction", "primary_cta"]
    },
    pages: {
      type: "array",
      items: {
        type: "object",
        properties: {
          path: { type: "string" },
          page_type: { type: "string" },
          title: { type: "string" },
          meta_description: { type: "string" },
          h1: { type: "string" },
          subhead: { type: "string" },
          cta_text: { type: "string" },
          sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                section_type: {
                  type: "string",
                  enum: ["hero", "text", "benefits", "process", "proof", "pricing", "faq", "cta"]
                },
                heading: { type: "string" },
                body: { type: "string" },
                bullets: { type: "array", items: { type: "string" } },
                claim_class: {
                  type: "string",
                  enum: ["generic", "evidence_backed", "placeholder"]
                },
                claim_evidence_ids: { type: "array", items: { type: "string" } }
              },
              required: ["section_type", "heading", "body", "bullets", "claim_class", "claim_evidence_ids"]
            }
          }
        },
        required: ["path", "page_type", "title", "meta_description", "h1", "subhead", "cta_text", "sections"]
      }
    }
  },
  required: ["brand", "pages"]
};

export default async function(req: Request): Promise<Response> {
  try {
    if (req.method !== "POST") return Response.json({ error: "POST required" }, { status: 405 });

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const buildPlanId = String(body?.build_plan_id || "").trim();
    if (!buildPlanId) return Response.json({ error: "build_plan_id required" }, { status: 400 });

    const svc = base44.asServiceRole;
    const plan = await svc.entities.WebsiteBuildPlan.get(buildPlanId);
    if (!plan) return Response.json({ error: "WebsiteBuildPlan not found" }, { status: 404 });

    if (plan.status !== "validated_for_preview" || plan.validation_state !== "passed") {
      return Response.json({
        error: "Build plan must pass independent validation before preview generation",
        status: plan.status,
        validation_state: plan.validation_state,
      }, { status: 409 });
    }
    if (plan.build_mode !== "preview_only" || plan.release_authorized === true) {
      return Response.json({ error: "Preview safety boundary violated" }, { status: 409 });
    }

    const opportunity = await svc.entities.Opportunity.get(plan.opportunity_id);
    if (!opportunity) return Response.json({ error: "Opportunity not found" }, { status: 404 });

    const evidenceRows = await svc.entities.OpportunityEvidence.filter(
      { opportunity_id: plan.opportunity_id },
      "-retrieved_at",
      500
    );

    const activeEvidence = (evidenceRows || []).filter((row: any) =>
      row.status !== "expired" &&
      row.status !== "disputed" &&
      row.verification_state !== "expired" &&
      row.verification_state !== "disputed"
    );

    const evidenceForPrompt = activeEvidence.slice(0, 80).map((row: any) => ({
      evidence_id: row.evidence_id,
      signal_type: row.signal_type,
      source_class: row.source_class,
      verification_state: row.verification_state,
      source_url: row.source_url || "",
      source_title: row.source_title || "",
      metric_name: row.metric_name || "",
      metric_value: row.metric_value ?? null,
      metric_unit: row.metric_unit || "",
      evidence_summary: String(row.evidence_summary || "").slice(0, 900),
      confidence: row.confidence ?? 0,
      observed_at: row.observed_at || null,
      expires_at: row.expires_at || null,
    }));

    if (plan.canonical_location_id) {
      evidenceForPrompt.push({
        evidence_id: `registry:${plan.canonical_location_id}`,
        signal_type: "serviceability",
        source_class: "AUTHORITATIVE_PUBLIC",
        verification_state: "operator_verified",
        source_url: "",
        source_title: "CanonicalLocationRegistry",
        metric_name: "local_value_score",
        metric_value: Number(plan.local_value_score || 0),
        metric_unit: "0-100",
        evidence_summary: `Verified service-area registry reference for ${plan.geography || "target geography"}. Presence claim is service-area only unless separately verified.`,
        confidence: 100,
        observed_at: null,
        expires_at: null,
      });
    }

    const pageBriefs = (plan.page_specs || []).map((page: any) => ({
      path: page.path,
      page_type: page.page_type,
      primary_query: page.primary_query,
      search_intent: page.search_intent,
      presence_claim: page.presence_claim,
      unique_value_requirements: page.unique_value_requirements,
      allowed_evidence_ids: page.evidence_ids,
    }));

    const prompt = `Create a polished PRIVATE PREVIEW website content package for this validated DDV3 build plan.

This is draft preview copy only. It will not be published or indexed.

PLANNING INPUTS:
- Primary service: ${plan.primary_service || ""}
- Buyer archetype: ${plan.buyer_archetype || ""}
- Geography: ${plan.geography || "national/general"}
- Intent: ${plan.intent || "unknown"}
- Explicit assumptions: ${JSON.stringify(plan.assumptions || [])}
- Proof requirements: ${JSON.stringify(plan.proof_requirements || [])}

PAGE BRIEFS:
${JSON.stringify(pageBriefs)}

ALLOWED EVIDENCE:
${JSON.stringify(evidenceForPrompt)}

RULES:
1. Return exactly one page for every PAGE BRIEF and no extra pages. Preserve each exact path and page_type.
2. Write premium, clear, conversion-oriented copy, but NEVER invent facts.
3. Every factual claim about price, duration, results, reviews, rankings, customers, project counts, credentials, awards, certification, licensing, insurance, geographic presence, or measurable outcomes MUST use claim_class="evidence_backed" and cite supporting claim_evidence_ids from ALLOWED EVIDENCE.
4. If evidence is missing, use careful generic copy or a placeholder that says what must be confirmed. Do not guess.
5. Never fabricate testimonials, reviews, projects, addresses, offices, years in business, ratings, guarantees, certifications, or statistics.
6. Location pages may describe only service-area coverage from registry evidence. Do not say "our office", "located in", "visit us", or imply a local storefront.
7. Pricing pages may explain factors and process without numbers. Use numbers only when directly supported by evidence.
8. Proof sections may only use FIRST_PARTY evidence. If there is no FIRST_PARTY proof, use a placeholder section describing what verified proof is required.
9. Keep each section body under 90 words and bullets to at most 5 items.
10. Do not include schema markup, scripts, links, phone numbers, email addresses, or hidden SEO text.
11. This is a useful website, not a doorway page. Each page must provide distinct value matching its page brief.
12. Output only JSON matching the supplied schema.`;

    const aiRes = await base44.functions.invoke("vercelAiGateway", {
      action: "generateText",
      model: "anthropic/claude-opus-4.7",
      system_prompt: "You are a grounded website copy architect. You may only make factual claims supported by the evidence IDs provided. Never invent proof. Output valid JSON only.",
      prompt,
      response_json_schema: PREVIEW_SCHEMA,
    });

    const ai = aiRes.data || aiRes;
    if (!ai?.ok || !ai?.parsed || typeof ai.parsed !== "object" || !Array.isArray(ai.parsed.pages)) {
      return Response.json({ error: "AI preview generation failed to return structured pages" }, { status: 502 });
    }

    const artifactId = await stableArtifactId(plan.id);
    const payload = {
      artifact_id: artifactId,
      build_plan_id: plan.id,
      opportunity_id: plan.opportunity_id,
      status: "generated",
      preview_only: true,
      is_public: false,
      robots_policy: "noindex",
      brand: ai.parsed.brand || {
        name: plan.primary_service || opportunity.title || "Preview",
        tagline: "",
        style_direction: "premium modern service funnel",
        primary_cta: "Request Information",
      },
      pages: ai.parsed.pages,
      source_evidence_ids: activeEvidence.map((row: any) => row.evidence_id).filter(Boolean),
      generation_provider: "vercel_ai_gateway",
      generation_model: ai.model || "anthropic/claude-opus-4.7",
      generation_usage: JSON.stringify(ai.usage || {}).slice(0, 3000),
      validation_state: "unvalidated",
      validation_errors: [],
      validation_warnings: [],
      generated_at: new Date().toISOString(),
    };

    const existing = await svc.entities.WebsitePreviewArtifact.filter({ artifact_id: artifactId }, "-generated_at", 1);
    const artifact = existing?.[0]
      ? await svc.entities.WebsitePreviewArtifact.update(existing[0].id, payload)
      : await svc.entities.WebsitePreviewArtifact.create(payload);

    await svc.entities.WebsiteBuildPlan.update(plan.id, {
      preview_artifact_id: artifact.id,
      preview_status: "generated",
    });
    await svc.entities.Opportunity.update(plan.opportunity_id, {
      preview_artifact_id: artifact.id,
      preview_status: "generated",
      updated_at: new Date().toISOString(),
    });

    return Response.json({
      ok: true,
      artifact_id: artifact.id,
      build_plan_id: plan.id,
      status: "generated",
      preview_only: true,
      is_public: false,
      robots_policy: "noindex",
      generation_model: payload.generation_model,
      next_action: "validateWebsitePreviewV3",
    });
  } catch (error: any) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
