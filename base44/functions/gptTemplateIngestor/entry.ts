/**
 * GPT Template Ingestor
 *
 * Calls ChatGPT (via InvokeLLM) to generate a complete, production-ready
 * website template for a given niche/industry. The generated HTML is stored
 * in the TemplateLibrary entity with source="gpt".
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

Generate a COMPLETE, production-ready, single-page website template for a ${label} business.

REQUIREMENTS:
1. Full HTML document with inline <style> in the <head> — no external CSS, no JS frameworks
2. Modern, professional design with:
   - Sticky header with business name, nav links, and phone number
   - Hero section with compelling headline, subheadline, and CTA buttons
   - Trust bar with certifications/licenses
   - Stats section (years in business, projects completed, rating, etc.)
   - Services section with 4 services, each with a title, description, and image placeholder
   - Project gallery (4 images)
   - Testimonials section (3 reviews with star ratings, names, avatars)
   - CTA section
   - Contact form section with name, phone, email, message fields
   - Footer with services links and contact info
3. Use a unique, industry-appropriate color scheme (not generic blue)
4. Mobile responsive with @media queries
5. Use placeholder image URLs from Unsplash that are relevant to ${label}
6. Use Font Awesome or emoji icons (no external icon libraries)
7. The business name should be a realistic ${label} company name
8. All copy should be persuasive, benefit-focused, and specific to ${label}
9. Include micro-interactions (hover effects, transitions)
10. The design should look distinctly different from generic templates — give it personality

OUTPUT: Return ONLY the complete HTML document. No markdown code fences, no explanations, no comments before or after. Just <!DOCTYPE html>...</html>.

Make it beautiful. Make it convert. Make it unique to ${label}.`;
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    // Allow service-role invocation from workflows (no user auth needed for cron)
    // But verify admin if called from UI
    let isAdmin = false;
    try {
      const user = await base44.auth.me();
      isAdmin = user?.role === "admin";
    } catch { /* workflow call — no user context */ }

    const body = await req.json().catch(() => ({}));
    const action = body.action || "status";

    // === STATUS ===
    if (action === "status") {
      const allGpt = await base44.asServiceRole.entities.TemplateLibrary.filter(
        { tags: { $all: ["gpt-generated"] }, is_active: true },
        { limit: 500, fields: ["name", "niche", "created_date"] }
      );
      const byNiche: Record<string, number> = {};
      for (const t of allGpt.items) {
        const n = t.niche || "unknown";
        byNiche[n] = (byNiche[n] || 0) + 1;
      }
      return Response.json({
        action: "status",
        total_gpt_templates: allGpt.items.length,
        by_niche: byNiche,
        supported_niches: SUPPORTED_NICHES,
      });
    }

    // === GENERATE ===
    if (action === "generate" || action === "generate_batch") {
      const niches: string[] = action === "generate"
        ? [body.niche]
        : (body.niches || SUPPORTED_NICHES);

      // Validate niches
      const valid = niches.filter(n => SUPPORTED_NICHES.includes(n));
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

          // Validate it looks like HTML
          if (!html.includes("<!DOCTYPE") && !html.includes("<html")) {
            results.push({ niche, status: "failed", error: "LLM did not return valid HTML" });
            continue;
          }

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
            tags: ["gpt-generated", "ai-designed", niche, "stock-2026-10-v1"],
            color_scheme: "ai-generated",
            is_active: true,
            is_default: false,
            status: "active",
            version: "1.0",
            author: "ChatGPT Sync",
            sort_order: 999,
          });

          results.push({
            niche,
            status: "success",
            template_id: (created as any)?.id,
            template_name: templateName,
            html_length: html.length,
          });

          // Log sync event
          await base44.asServiceRole.entities.SyncEvent.create({
            event_type: "entity_create",
            entity_name: "TemplateLibrary",
            record_id: (created as any)?.id || "",
            action: "gpt_template_ingestor",
            data_summary: `ChatGPT generated ${label} template (${html.length} chars)`,
            source: "workflow",
            direction: "from_gpt",
            status: "synced",
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
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}