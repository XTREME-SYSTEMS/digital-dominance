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

  return {
    template_key: pack.template_key || pack.templateKey,
    name: pack.name || pack.template_name || "Synced Pack",
    brand_id: pack.brand_id || pack.brandId || "custom_contractor",
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
    category: pack.category || "homepage",
    niche: pack.niche || "epoxy_garage",
    sections,
    version: pack.version || "1.0.0",
    status: pack.status || "draft",
    preview_html: fullHtml.slice(0, 30000),
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

      // Upsert by template_key
      const existing = await base44.asServiceRole.entities.BrandTemplate.filter({
        template_key: translated.template_key,
      });

      let record;
      if (existing.items && existing.items.length > 0) {
        record = await base44.asServiceRole.entities.BrandTemplate.update(
          existing.items[0].id,
          { ...translated, parent_version: existing.items[0].version }
        );
      } else {
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
        preview_truncated: fullHtml.length > 30000,
        preview_length: fullHtml.length,
        message: `Pack "${translated.name}" synced successfully`,
      });
    }

    // === LIST: return all synced packs ===
    if (action === "list") {
      const page = await base44.asServiceRole.entities.BrandTemplate.filter(
        {},
        { sort: "-created_date", limit: 50 }
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

    // === DELETE: remove a pack ===
    if (action === "delete") {
      const { template_key } = body;
      if (!template_key) return Response.json({ error: "template_key required" }, { status: 400 });
      const page = await base44.asServiceRole.entities.BrandTemplate.filter({ template_key });
      const rec = (page.items || [])[0];
      if (!rec) return Response.json({ error: "Pack not found" }, { status: 404 });
      await base44.asServiceRole.entities.BrandTemplate.delete(rec.id);
      return Response.json({ ok: true, deleted: template_key });
    }

    // === HEALTH: ping for GPT to verify connectivity ===
    if (action === "health") {
      return Response.json({ ok: true, service: "packSync", timestamp: new Date().toISOString() });
    }

    return Response.json({ error: "Unknown action. Use: sync, list, get, delete, health" }, { status: 400 });
  } catch (e) {
    console.error("[packSync] Error:", e);
    return Response.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}