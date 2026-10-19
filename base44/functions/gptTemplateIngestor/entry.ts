/**
 * GPT Template Ingestor
 *
 * Uses configured Base44 InvokeLLM to create untrusted synthetic proposals.
 * No output is activated or released without independent verification.
 *
 * The workflow "GPT Template Sync" calls this on a schedule to keep the
 * library stocked with fresh, AI-designed templates.
 *
 * Actions:
 *  - { action: "generate", niche: "epoxy" }            → generate one template
 *  - { action: "generate_batch", niches: [...] }       → generate multiple
 *  - { action: "status" }                               → report how many GPT templates exist
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";

const SUPPORTED_NICHES = [
  "epoxy", "water_damage", "roofing", "hvac", "plumbing", "electrician",
  "pest_control", "landscaping", "mold_remediation", "fire_damage",
  "garage_door", "legal", "real_estate", "remodeling", "med_spa",
  "dental", "chiropractic", "solar", "automotive", "cleaning", "identity",
];

const NICHE_LABELS: Record<string, string> = {
  epoxy: "Epoxy Flooring",
  water_damage: "Water Damage Restoration",
  roofing: "Roofing",
  hvac: "HVAC",
  plumbing: "Plumbing",
  electrician: "Electrical",
  pest_control: "Pest Control",
  landscaping: "Landscaping",
  mold_remediation: "Mold Remediation",
  fire_damage: "Fire Damage Restoration",
  garage_door: "Garage Door Services",
  legal: "Legal Services",
  real_estate: "Real Estate",
  remodeling: "Home Remodeling",
  med_spa: "Med Spa",
  dental: "Dental",
  chiropractic: "Chiropractic",
  solar: "Solar Installation",
  automotive: "Auto Repair",
  cleaning: "Cleaning Services",
  identity: "Brand & Web Design",
};

function buildPrompt(niche: string): string {
  const label = NICHE_LABELS[niche] || niche;
  return `You are a world-class web designer specializing in high-converting contractor and service business websites.

Generate a DISTINCT, HIGH-FIDELITY, SYNTHETIC DESIGN PREVIEW for a single-page website for a ${label} business.

REQUIREMENTS:
1. Full HTML document with inline <style> in the <head> — no external CSS, no JS frameworks
2. Modern, professional design with:
   - Editorial navigation with fictional brand name and anchor links; no real phone number or contact details
   - Hero section with compelling headline, subheadline, and CTA buttons
   - Credibility/process visual module without invented certifications, licensing, ratings or business metrics
   - Numbers only for nonfactual design labels, never fabricated achievements
   - Services section with 4 services, each with a title, description, and image placeholder
   - Project gallery (4 images)
   - Editorial project gallery with clearly labeled SYNTHETIC examples; NO fake reviews, clients, names, portraits or testimonials
   - CTA section
   - A clearly labeled NONFUNCTIONAL form-design preview, no submitted customer information
   - Footer with services links and contact info
3. Use a unique, industry-appropriate color scheme (not generic blue)
4. Mobile responsive with @media queries
5. Use placeholder image URLs from Unsplash that are relevant to ${label}
6. Use Font Awesome or emoji icons (no external icon libraries)
7. Use a fictional brand explicitly labeled SYNTHETIC DESIGN CONCEPT, never a real provider
8. All copy should be persuasive, benefit-focused, and specific to ${label}
9. Include micro-interactions (hover effects, transitions)
10. Create an art-directed visual identity with large sophisticated typography, asymmetric editorial flow, unique section compositions and purposeful imagery
11. Include noindex/nofollow robots and clearly identify this as unapproved preview content
12. No script tags, iframes, embeds, external scripts, javascript: URLs, inline JS handlers or outbound forms
13. NO real addresses, customer reviews, professional credentials, phone numbers, promises of results, pricing guarantees or legal/clinical claims

OUTPUT: Return ONLY the complete HTML document. No markdown code fences, no explanations, no comments before or after. Just <!DOCTYPE html>...</html>.

Make it beautiful. Make it convert. Make it unique to ${label}.`;
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    // Authentication must succeed BEFORE privileged reads and LLM spending.
    // An internal cron without a verified signed service identity must fail closed.
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || "status";

    // === STATUS ===
    if (action === "status") {
      const allGpt = await base44.asServiceRole.entities.TemplateLibrary.filter(
        { tags: { $all: ["gpt-generated"] } },
        { limit: 500, fields: ["name", "niche", "created_date", "status", "is_active"] }
      );
      const records: any[] = Array.isArray(allGpt) ? allGpt : (allGpt.items || []);
      const byNiche: Record<string, number> = {};
      for (const t of records) {
        const n = t.niche || "unknown";
        byNiche[n] = (byNiche[n] || 0) + 1;
      }
      return Response.json({
        action: "status",
        total_gpt_templates: records.length,
        pending_review: records.filter(t => t.status === "draft" || t.is_active === false).length,
        legacy_active_unverified: records.filter(t => t.is_active === true).length,
        by_niche: byNiche,
        supported_niches: SUPPORTED_NICHES,
      });
    }

    // === GENERATE ===
    if (action === "generate" || action === "generate_batch") {
      // Bound paid LLM calls. Legacy 21-niche cron must be migrated to a
      // scoped, signed queue before being re-enabled against this endpoint.
      const niches: unknown[] = action === "generate" ? [body.niche] : body.niches;
      if (!Array.isArray(niches) || niches.length < 1 || niches.length > 3) {
        return Response.json({ error: "BATCH_REQUIRES_SCOPED_APPROVAL", max_per_request: 3 }, { status: 409 });
      }
      const valid = [...new Set(niches.filter((n): n is string => typeof n === "string" && SUPPORTED_NICHES.includes(n)))];
      if (valid.length !== niches.length) {
        return Response.json({ error: "UNSUPPORTED_OR_DUPLICATE_NICHE", supported: SUPPORTED_NICHES }, { status: 400 });
      }
      if (valid.length === 0) {
        return Response.json({
          error: "No valid niches provided",
          supported: SUPPORTED_NICHES,
        }, { status: 400 });
      }

      const results: any[] = [];

      for (const niche of valid) {
        try {
          const label = NICHE_LABELS[niche] || niche;
          const prompt = buildPrompt(niche);

          // Call ChatGPT via InvokeLLM
          const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt,
            model: "automatic",
            response_json_schema: null,
          });

          // The response is a string containing the HTML
          let html = typeof llmResponse === "string"
            ? llmResponse
            : (llmResponse as any)?.response || (llmResponse as any)?.content || String(llmResponse);

          // Strip markdown code fences if present
          html = html.replace(/^```html?\s*/i, "").replace(/```\s*$/i, "").trim();

          // Reject executable/unbounded LLM HTML instead of promoting it.
          const invalidHtml = html.length < 4500 || html.length > 45000 ||
            !/<!doctype html>/i.test(html) || !/<html\b/i.test(html) ||
            !/<\/html>/i.test(html) || !/<head\b/i.test(html) ||
            !/<style\b/i.test(html) || !/<h1\b/i.test(html) ||
            /<\s*(script|iframe|embed|object|base|meta\s+http-equiv)\b/i.test(html) ||
            /\bon[a-z]+\s*=/i.test(html) || /javascript\s*:/i.test(html) ||
            /<(?:form|a)\b[^>]*(?:action|href)\s*=\s*["'](?:https?:|mailto:|tel:)/i.test(html);
          if (invalidHtml) {
            results.push({ niche, status: "failed", error: "HTML_QUALITY_OR_SECURITY_GATE" });
            continue;
          }
          // Never let the LLM control approval or indexing metadata.
          html = html.replace(/<meta\b[^>]*name\s*=\s*["']robots["'][^>]*>/gi, "");
          html = html.replace(/<head\b[^>]*>/i, m =>
            m + '\n<meta name="robots" content="noindex,nofollow,noarchive">');
          // Synthetic layouts can show a form, but inputs and submit buttons
          // cannot collect, transmit or submit data.
          html = html.replace(/<button\b/gi, '<button disabled')
            .replace(/<input\b/gi, '<input disabled')
            .replace(/<textarea\b/gi, '<textarea disabled');

          // Extract title from generated HTML
          const titleMatch = html.match(/<title>(.*?)<\/title>/i);
          const templateName = titleMatch
            ? titleMatch[1].split("—")[0].trim()
            : `${label} — GPT Template`;

          // Generate slug
          const slug = `gpt-${niche}-${Date.now()}`;

          // Store in TemplateLibrary
          const created = await base44.asServiceRole.entities.TemplateLibrary.create({
            name: templateName,
            slug,
            category: "homepage",
            niche,
            description: `AI-generated ${label} website template. Created by ChatGPT via the GPT Template Sync workflow. Features industry-specific copy, unique design, and conversion-optimized layout.`,
            content: html,
            tags: ["gpt-generated", "ai-designed", niche, "synthetic-preview", "pending-visual-qa", "noindex"],
            color_scheme: "ai-generated",
            is_active: false,
            is_default: false,
            status: "draft",
            version: "1.0",
            author: "Base44 InvokeLLM draft generator",
            sort_order: 999,
          });

          results.push({
            niche,
            status: "success",
            template_id: (created as any)?.id,
            template_name: templateName,
            html_length: html.length,
            release_status: "PENDING_VISUAL_AND_FACTUAL_REVIEW",
          });

          // Log sync event
          await base44.asServiceRole.entities.SyncEvent.create({
            event_type: "entity_create",
            entity_name: "TemplateLibrary",
            record_id: (created as any)?.id || "",
            action: "gpt_template_ingestor",
            data_summary: `ChatGPT generated ${label} template (${html.length} chars)`,
            source: "system",
            direction: "internal",
            status: "pending",
            gpt_context: `Niche: ${niche}, Template: ${templateName}`,
          });

        } catch (err: any) {
          results.push({ niche, status: "failed", error: err.message });
        }
      }

      return Response.json({
        action: action,
        total: valid.length,
        succeeded: results.filter(r => r.status === "success").length,
        failed: results.filter(r => r.status === "failed").length,
        results,
      });
    }

    return Response.json({ error: "Unknown action. Use: status, generate, generate_batch" }, { status: 400 });

  } catch (error: any) {
    console.error("gptTemplateIngestor", error?.name || "Error");
    return Response.json({ error: "TEMPLATE_INGESTOR_FAILED" }, { status: 500 });
  }
}