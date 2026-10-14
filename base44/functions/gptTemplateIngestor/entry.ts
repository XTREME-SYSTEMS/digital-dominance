/**
 * GPT Template Ingestor
 *
 * Calls the configured Base44 Core InvokeLLM integration to draft an industry
 * website candidate. It is NOT the external ChatGPT two-way sync endpoint.
 * Newly generated HTML stays DRAFT/INACTIVE until independent visual/security
 * approval. No public release or paid generation from anonymous requests.
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
import { secrets } from "base44:runtime";

// Explicit service credential, not an unverified cron or spoofable JSON field.
function constantTimeEquals(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}


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

const ART_DIRECTIONS = [
  { id: "architectural_cinema", direction: "Architectural dark cinematic. Full-bleed genuine subject imagery, expressive 84px condensed editorial typography, split storytelling, tactile transition details; AVOID generic glass cards." },
  { id: "editorial_atelier", direction: "Warm premium editorial. Cream backgrounds, architectural columns, confident serif/sans hierarchy, restrained fine rules, magazine-style gallery; AVOID generic blue SaaS UI." },
  { id: "product_gallery", direction: "Art-directed visual product experience. Full-width visual sequence, curated asymmetrical gallery, image-led feature narratives, quiet commerce-level polish; AVOID stock hero/cards." },
  { id: "typographic_monolith", direction: "Bold experimental typography with asymmetrical image rhythm, cinematic material textures, anchored CTA, precise modular system; NOT a standard centered template." },
  { id: "immersive_service", direction: "Industry-specialist premium services experience with dramatic story-led hero, full-page before/after demonstration and conversion process, clearly original hierarchy." },
  { id: "luxury_journal", direction: "High-end digital journal with immense editorial photography, generous white space, section-to-section art direction and detailed typography." },
  { id: "technical_precision", direction: "Premium technical product site with architected diagrams, striking split composition, precise mono annotations, substantial implementation content and restrained motion." },
];

function buildPrompt(niche: string): string {
  const label = NICHE_LABELS[niche] || niche;
  const dna = ART_DIRECTIONS[SUPPORTED_NICHES.indexOf(niche) % ART_DIRECTIONS.length];
  return `You are an expert visual art director and front-end engineer. Build an APPROVAL-ONLY website design study, NOT a live business site.
Industry: ${label}
Creative direction: ${dna.id}. ${dna.direction}
Reference standard: Strategic Minds AI Digital Dominance Premium Visual Factory V2. The finished composition must feel like a custom agency build, not generic MVP markup.

Generate a complete, responsive single-page synthetic premium design study for the ${label} industry.

REQUIREMENTS:
1. Full HTML document with inline <style> in the <head> — no external CSS, no JS frameworks
2. Modern, professional design with:
   - Sticky header with business name, nav links, and phone number
   - Hero section with compelling headline, subheadline, and CTA buttons
   - Trust section with clearly marked placeholders for ONLY owner-verified credentials, never fabricated certifications or licenses
   - Proof/metric section populated with illustrative labels [VERIFIED_PROJECT_COUNT] and [VERIFIED_YEARS], never invented numbers
   - Services section with 4 services, each with a title, description, and image placeholder
   - Project gallery (4 images)
   - Trust narrative section with a specific verification requirement instead of invented testimonials, names, or star ratings
   - CTA section
   - Contact form section with name, phone, email, message fields
   - Footer with services links and contact info
3. Use a unique, industry-appropriate color scheme (not generic blue)
4. Mobile responsive with @media queries
5. Choose a coherent original art direction and provide descriptive accessible image alt text; third-party image URLs must be legal for preview and require attribution/license review before release
6. Use Font Awesome or emoji icons (no external icon libraries)
7. Use [BUSINESS_NAME] and [VERIFIED_PHONE] placeholder tokens, with a prominent SYNTHETIC DESIGN PREVIEW marker in UI
8. All copy must be thoughtful, user-helpful and industry-specific. NO fabricated reviews, credentials, warranties, addresses, contact routes, outcome guarantees, clinical claims or legal success rates.
9. Include micro-interactions (hover effects, transitions)
10. Use your assigned creative direction in every major section. Do not merely vary gradients and colors. Maintain responsive 390px mobile layouts and keyboard access.
11. No real lead collection, public publication, SEO indexing, external payment or social links. Use clearly labeled placeholder contact interactions only.
12. Include <meta name="robots" content="noindex,nofollow,noarchive"> and <meta name="viewport" content="width=device-width,initial-scale=1">.
13. Minimum 5 fully composed content sections and at least 1 meaningful interactive demo with non-persistent data.

OUTPUT: Return ONLY the complete HTML document. No markdown code fences, no explanations, no comments before or after. Just <!DOCTYPE html>...</html>.

Make it beautiful. Make it convert. Make it unique to ${label}.`;
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    // Never treat an unauthenticated request as a trusted workflow execution.
    // Base44's scheduled invoke_backend_function currently supplies no proven
    // service identity. It must provide a server-held Bearer token once wired,
    // otherwise fail CLOSED rather than spend credits or write templates.
    const user = await base44.auth.me().catch(() => null);
    const isAdmin = user?.role === "admin";
    const header = req.headers?.get("authorization") || "";
    const match = /^Bearer ([A-Za-z0-9._~\\-]{32,512})$/.exec(header);
    const presented = match?.[1] || "";
    const configured = secrets.get("GPT_TEMPLATE_INGESTOR_TOKEN") || "";
    const trustedService = configured.length >= 32 && presented.length >= 32 &&
      constantTimeEquals(presented, configured);
    if (!isAdmin && !trustedService) {
      return Response.json({ error: user ? "Forbidden" : "Unauthorized" },
        { status: user ? 403 : 401 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || "status";

    // === STATUS ===
    if (action === "status") {
      const allGpt = await base44.asServiceRole.entities.TemplateLibrary.filter(
        { tags: { $all: ["gpt-generated"] } },
        { limit: 500, fields: ["name", "niche", "created_date", "is_active", "status"] }
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
        pending_review: records.filter(t => t.status === "draft" || !t.is_active).length,
        previously_active: records.filter(t => t.is_active && t.status === "active").length,
        by_niche: byNiche,
        supported_niches: SUPPORTED_NICHES,
      });
    }

    // === GENERATE ===
    if (action === "generate" || action === "generate_batch") {
      const niches = action === "generate" ? [body.niche] : (body.niches || SUPPORTED_NICHES);
      if (!Array.isArray(niches) || niches.length < 1 || niches.length > SUPPORTED_NICHES.length) {
        return Response.json({ error: "Invalid or oversized niche batch" }, { status: 400 });
      }
      const valid = [...new Set(niches)].filter((n): n is string =>
        typeof n === "string" && SUPPORTED_NICHES.includes(n));
      if (valid.length === 0) {
        return Response.json({
          error: "No valid niches provided",
          supported: SUPPORTED_NICHES,
        }, { status: 400 });
      }

      const results: any[] = [];

      for (const niche of valid) {
        try {
          // 24-hour per-niche cooldown prevents an unbounded paid generation
          // loop when the six-hour schedule retries or workers are duplicated.
          const latestQuery = await base44.asServiceRole.entities.TemplateLibrary.filter(
            { niche, author: "ChatGPT Sync" }, "-created_date", 1
          );
          const recent: any[] = Array.isArray(latestQuery) ? latestQuery : (latestQuery.items || []);
          const createdAt = Date.parse(recent[0]?.created_date || "");
          if (Number.isFinite(createdAt) && Date.now() - createdAt < 86_400_000) {
            results.push({ niche, status: "skipped", reason: "24h_niche_cooldown" });
            continue;
          }
          const label = NICHE_LABELS[niche] || niche;
          const prompt = buildPrompt(niche);

          // Call the configured Base44 Core.InvokeLLM (model identity is not assumed to be ChatGPT)
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

          // Strict minimum document contract. Marking a generated string as
          // "production-ready" without browser/Guardian review is prohibited.
          const structurallyValid = /<!doctype html/i.test(html) &&
            /<html[\s>]/i.test(html) &&
            /<head[\s>]/i.test(html) &&
            /<style[\s>]/i.test(html) &&
            /<main[\s>]/i.test(html) &&
            /<h1[\s>]/i.test(html) &&
            /<meta[^>]+name=["']viewport["']/i.test(html) &&
            (html.match(/<section[\s>]/gi) || []).length >= 4 &&
            html.length >= 6000 && html.length <= 48000;
          if (!structurallyValid) {
            results.push({ niche, status: "failed", error: "HTML failed minimum structure and preview-size gates" });
            continue;
          }

          // Ensure every draft refuses public indexing by default.
          if (!/<meta[^>]+name=["\']robots["\']/i.test(html)) {
            html = html.replace(/<head([\s>])/i, '<head$1<meta name="robots" content="noindex,nofollow,noarchive">');
          }

          // Extract title from generated HTML
          const titleMatch = html.match(/<title>(.*?)<\/title>/i);
          const templateName = titleMatch
            ? titleMatch[1].split("—")[0].trim()
            : `${label} — GPT Template`;

          // Generate slug
          const slug = `gpt-review-${niche}-${Date.now()}-${Math.floor(Math.random()*1e6)}`;

          // Store in TemplateLibrary
          const created = await base44.asServiceRole.entities.TemplateLibrary.create({
            name: templateName,
            slug,
            category: "homepage",
            niche,
            description: `Unapproved synthetic ${label} design study via Base44 InvokeLLM. Requires manual content, factual, mobile, accessibility, visual and security verification.`,
            content: html,
            tags: ["gpt-generated", "pending-visual-review", "synthetic-preview", niche, "premium-dna-v1"],
            color_scheme: "ai-generated",
            is_active: false,
            is_default: false,
            status: "draft",
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
            review_state: "PENDING_APPROVAL",
          });

          // Log sync event
          await base44.asServiceRole.entities.SyncEvent.create({
            event_type: "entity_create",
            entity_name: "TemplateLibrary",
            record_id: (created as any)?.id || "",
            action: "gpt_template_ingestor",
            data_summary: `Base44 InvokeLLM drafted ${label} candidate (${html.length} chars); no external GPT handshake and no publication`,
            source: trustedService ? "workflow" : "admin_ui",
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
        drafted: results.filter(r => r.status === "success").length,
        skipped: results.filter(r => r.status === "skipped").length,
        failed: results.filter(r => r.status === "failed").length,
        review_required: true,
        production_release: false,
        results,
      });
    }

    return Response.json({ error: "Unknown action. Use: status, generate, generate_batch" }, { status: 400 });

  } catch (error: any) {
    console.error("GPT_TEMPLATE_INGESTOR_ERROR", error?.name || "Error");
    return Response.json({ error: "TEMPLATE_INGESTOR_ERROR" }, { status: 500 });
  }
}