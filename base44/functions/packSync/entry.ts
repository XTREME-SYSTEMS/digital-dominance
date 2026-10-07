import { createClientFromRequest } from "npm:@base44/sdk@0.8.53";
import { secrets } from "base44:runtime";

// PACK SYNC — GPT → Base44 bridge
// Accepts webpacks, brand packs, and logo packs from GPT/ChatGPT,
// authenticates via PACK_SYNC_TOKEN, and translates them into
// BrandTemplate records with 99% visual + operational parity.
//
// ENDPOINT: https://epoxyquotenearme.base44.app/functions/packSync
// AUTH: Authorization: Bearer <PACK_SYNC_TOKEN>  (or x-pack-sync-token header)
//
// ACTIONS:
//   sync   — upsert a pack into BrandTemplate (by template_key)
//   list   — return all synced packs
//   get    — return one pack by template_key
//   delete — remove a pack by template_key
//   health — ping for GPT to verify connectivity

function authenticateToken(req: Request): boolean {
  const token = secrets.get("PACK_SYNC_TOKEN");
  if (!token) return false;
  const authHeader = req.headers.get("authorization") || "";
  const bearer = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (bearer && bearer === token) return true;
  const altToken = req.headers.get("x-pack-sync-token") || "";
  if (altToken && altToken === token) return true;
  return false;
}

const ALLOWED_BRAND_IDS = new Set([
  "xtremepolishingsystems",
  "nationalconcretepolishing",
  "polishedconcreteuniversity",
  "custom_contractor",
]);

const ALLOWED_CATEGORIES = new Set([
  "homepage",
  "landing_page",
  "service_page",
  "location_page",
  "funnel",
  "gallery",
  "about",
  "contact",
  "cost_page",
  "color_charts",
  "blog_post",
  "full_site",
]);

const ALLOWED_NICHES = new Set([
  "epoxy_garage",
  "decorative_concrete",
  "polished_concrete",
  "epoxy_flooring",
  "garage_coating",
  "concrete_resurfacing",
  "general_contractor",
]);

const ALLOWED_STATUSES = new Set(["draft", "review", "published", "archived"]);

function allowedOrFallback(value: string | undefined, allowed: Set<string>, fallback: string): string {
  return value && allowed.has(value) ? value : fallback;
}

function compactHtml(input: string): string {
  return input
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function incrementPatch(version: string | undefined): string {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version || "");
  if (!match) return "1.0.1";
  return `${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Translate GPT pack format → BrandTemplate schema
function translatePack(pack: any) {
  const brandConfig = pack.brand_config || pack.brandConfig || {};
  const rawSections = pack.sections || [];

  const sections = rawSections.map((s: any, i: number) => ({
    section_id: s.section_id || s.id || `section-${i}`,
    section_type: s.section_type || s.type || "html",
    name: s.name || s.title || "",
    content: {
      headline: s.headline || s.content?.headline || "",
      body: s.body || s.content?.body || "",
      html: s.html || s.content?.html || "",
      css: s.css || s.content?.css || "",
      images: s.images || s.content?.images || [],
      items: s.items || s.content?.items || [],
      ...(s.content || {}),
    },
    enabled: s.enabled !== false,
  }));

  const fullHtml = pack.preview_html || pack.previewHtml || "";
  const compactPreview = compactHtml(fullHtml);

  return {
    template_key: pack.template_key || pack.templateKey,
    name: pack.name || pack.template_name || "Synced Pack",
    brand_id: allowedOrFallback(pack.brand_id || pack.brandId, ALLOWED_BRAND_IDS, "custom_contractor"),
    brand_config: {
      brand_name: brandConfig.brand_name || brandConfig.brandName || pack.name || "",
      domain: brandConfig.domain || "",
      primary_color: brandConfig.primary_color || brandConfig.primaryColor || "#000000",
      secondary_color: brandConfig.secondary_color || brandConfig.secondaryColor || "#FFFFFF",
      accent_color: brandConfig.accent_color || brandConfig.accentColor || "#D4AF37",
      logo_url: brandConfig.logo_url || brandConfig.logoUrl || "",
      logo_text: brandConfig.logo_text || brandConfig.logoText || "",
      font_heading: brandConfig.font_heading || brandConfig.fontHeading || "Plus Jakarta Sans",
      font_body: brandConfig.font_body || brandConfig.fontBody || "Inter",
      phone: brandConfig.phone || "",
      tagline: brandConfig.tagline || "",
    },
    category: allowedOrFallback(pack.category, ALLOWED_CATEGORIES, "homepage"),
    niche: allowedOrFallback(pack.niche, ALLOWED_NICHES, "general_contractor"),
    sections,
    version: pack.version || "1.0.0",
    status: allowedOrFallback(pack.status, ALLOWED_STATUSES, "draft"),
    preview_html: compactPreview.slice(0, 30000),
    notes: `Synced from GPT via packSync. Pack type: ${pack.pack_type || "webpack"}`.slice(0, 2000),
  };
}

export default async function(req: Request): Promise<Response> {
  try {
    // Token auth — this is a webhook-style endpoint, no user session
    if (!authenticateToken(req)) {
      return Response.json({ error: "Invalid or missing PACK_SYNC_TOKEN" }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action || "sync";

    // === SYNC: receive a pack from GPT and upsert into BrandTemplate ===
    if (action === "sync") {
      const pack = body.pack || body;
      const templateKey = pack.template_key || pack.templateKey;
      if (!templateKey) {
        return Response.json({ error: "template_key is required" }, { status: 400 });
      }

      const translated = translatePack(pack);
      const fullHtml = pack.preview_html || pack.previewHtml || "";
      const compactPreview = compactHtml(fullHtml);
      if (compactPreview.length > 30000) {
        return Response.json({
          error: "preview_html is too large after compaction",
          code: "PREVIEW_TOO_LARGE",
          original_length: fullHtml.length,
          compact_length: compactPreview.length,
          max_length: 30000,
          message: "Do not truncate parity-critical HTML. Split the pack into smaller templates or send a compact preview plus section HTML/CSS.",
        }, { status: 413 });
      }
      translated.preview_html = compactPreview;
      const payloadHash = await sha256(JSON.stringify(pack));

      // Upsert by template_key
      const existing = await base44.asServiceRole.entities.BrandTemplate.filter({
        template_key: translated.template_key,
      });

      let record;
      if (existing.items && existing.items.length > 0) {
        const previousVersion = existing.items[0].version || "1.0.0";
        if (!pack.version) translated.version = incrementPatch(previousVersion);
        translated.notes = `${translated.notes} | sha256:${payloadHash} | preview:${compactPreview.length} chars`.slice(0, 2000);
        record = await base44.asServiceRole.entities.BrandTemplate.update(
          existing.items[0].id,
          { ...translated, parent_version: previousVersion }
        );
      } else {
        translated.notes = `${translated.notes} | sha256:${payloadHash} | preview:${compactPreview.length} chars`.slice(0, 2000);
        record = await base44.asServiceRole.entities.BrandTemplate.create({
          ...translated,
          owner_id: body.owner_id || "pack-sync-system",
        });
      }

      return Response.json({
        ok: true,
        template_id: record.id,
        template_key: translated.template_key,
        name: translated.name,
        status: translated.status,
        sections_count: translated.sections.length,
        version: translated.version,
        parent_version: record.parent_version || null,
        preview_truncated: false,
        preview_length: fullHtml.length,
        compact_preview_length: compactPreview.length,
        payload_sha256: payloadHash,
        message: `Pack "${translated.name}" synced successfully`,
      });
    }

    // === LIST: return all synced packs ===
    if (action === "list") {
      const page = await base44.asServiceRole.entities.BrandTemplate.filter(
        {},
        { sort: "-updated_date", limit: 50 }
      );
      return Response.json({ packs: page.items || [], count: (page.items || []).length });
    }

    // === GET: return a specific pack by template_key ===
    if (action === "get") {
      const { template_key } = body;
      if (!template_key) return Response.json({ error: "template_key required" }, { status: 400 });
      const page = await base44.asServiceRole.entities.BrandTemplate.filter({ template_key });
      return Response.json({ pack: (page.items || [])[0] || null });
    }

    // DELETE is intentionally not exposed through the shared external sync token.
    // Deletion remains an authenticated admin action in the Base44 UI.
    if (action === "delete") {
      return Response.json({
        error: "External delete is disabled. Delete packs from the authenticated admin UI.",
        code: "ADMIN_ONLY_DELETE",
      }, { status: 403 });
    }

    // === HEALTH: ping for GPT to verify connectivity ===
    if (action === "health") {
      return Response.json({ ok: true, service: "packSync", timestamp: new Date().toISOString() });
    }

    return Response.json({ error: "Unknown action. Use: sync, list, get, health" }, { status: 400 });
  } catch (e) {
    console.error("[packSync] Error:", e);
    return Response.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}