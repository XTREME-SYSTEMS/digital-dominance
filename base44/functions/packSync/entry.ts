import { createClientFromRequest } from "npm:@base44/sdk@0.8.53";
import { secrets } from "base44:runtime";
import { PACK_DESIGN_CONSTITUTION, researchGateFailures } from "../../shared/packDesignConstitution.ts";

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

function chunkText(value: string, size = 27000): string[] {
  if (!value) return [];
  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += size) chunks.push(value.slice(i, i + size));
  return chunks;
}

function normalizePackType(value: string | undefined): string {
  const v = (value || "other").toLowerCase().replace(/[\s-]+/g, "_");
  if (v === "logo_pack" || v === "logopack") return "logo_pack";
  if (v === "brand_pack" || v === "brandpack") return "brand_pack";
  if (v === "web_pack" || v === "webpack") return "web_pack";
  if (v === "app_pack" || v === "apppack") return "app_pack";
  if (v === "graphic_pack" || v === "graphicpack") return "graphic_pack";
  if (v === "social_pack" || v === "socialpack") return "social_pack";
  if (v === "motion_pack" || v === "motionpack") return "motion_pack";
  if (v === "pwa_pack" || v === "pwapack") return "pwa_pack";
  if (v === "component_pack" || v === "componentpack") return "component_pack";
  if (v === "design_system_pack" || v === "designsystempack") return "design_system_pack";
  return "other";
}

async function storeTextArtifact(base44: any, args: {
  ownerId: string;
  packId: string;
  templateKey: string;
  version: string;
  artifactKey: string;
  artifactType: string;
  content: string;
  contentType: string;
  source?: string;
  metadata?: Record<string, any>;
}): Promise<number> {
  const chunks = chunkText(args.content);
  if (!chunks.length) return 0;
  const fullHash = await sha256(args.content);
  for (let i = 0; i < chunks.length; i++) {
    await base44.asServiceRole.entities.PackArtifact.create({
      owner_id: args.ownerId,
      pack_id: args.packId,
      template_key: args.templateKey,
      version: args.version,
      artifact_key: args.artifactKey,
      artifact_type: args.artifactType,
      chunk_index: i,
      chunk_count: chunks.length,
      content: chunks[i],
      content_type: args.contentType,
      size_bytes: new TextEncoder().encode(chunks[i]).length,
      sha256: await sha256(chunks[i]),
      metadata: { ...(args.metadata || {}), full_sha256: fullHash },
      source: args.source || "gpt",
    });
  }
  return chunks.length;
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

    if (action === "constitution") {
      return Response.json({ ok: true, constitution: PACK_DESIGN_CONSTITUTION });
    }

    // === SYNC V2: receive a GPT pack, preserve the full source, and upsert BrandTemplate ===
    if (action === "sync") {
      const pack = body.pack || body;
      const templateKey = pack.template_key || pack.templateKey;
      if (!templateKey) {
        return Response.json({ error: "template_key is required" }, { status: 400 });
      }

      const packType = normalizePackType(pack.pack_type || pack.packType);
      const researchDossierId = pack.research_dossier_id || pack.researchDossierId || "";
      const bundleId = pack.bundle_id || pack.bundleId || "";
      const variantIndex = Number(pack.variant_index || pack.variantIndex || 0);
      const governedVisualPack = (PACK_DESIGN_CONSTITUTION.pack_types as readonly string[]).includes(packType);

      if (governedVisualPack) {
        if (!researchDossierId || !bundleId || variantIndex < 1 || variantIndex > 10) {
          return Response.json({
            error: "Pack Research Gate fields are required before visual pack sync.",
            code: "RESEARCH_GATE_REQUIRED",
            required: ["research_dossier_id", "bundle_id", "variant_index (1-10)"],
            constitution_version: PACK_DESIGN_CONSTITUTION.constitution_version,
          }, { status: 428 });
        }

        const dossierPage = await base44.asServiceRole.entities.PackResearchDossier.filter({ dossier_id: researchDossierId });
        const dossier = (dossierPage.items || [])[0];
        const researchFailures = researchGateFailures(dossier);
        if (researchFailures.length) {
          return Response.json({
            error: "Research gate did not pass. Visual generation/sync is blocked.",
            code: "RESEARCH_GATE_BLOCKED",
            research_dossier_id: researchDossierId,
            failures: researchFailures,
            constitution_version: PACK_DESIGN_CONSTITUTION.constitution_version,
          }, { status: 428 });
        }

        const bundlePage = await base44.asServiceRole.entities.PackGenerationBundle.filter({ bundle_id: bundleId });
        const bundle = (bundlePage.items || [])[0];
        if (!bundle || bundle.dossier_id !== researchDossierId || bundle.research_gate_passed !== true) {
          return Response.json({
            error: "Generation bundle is missing, mismatched, or not research-approved.",
            code: "BUNDLE_GATE_BLOCKED",
            bundle_id: bundleId,
          }, { status: 428 });
        }
      }

      const ownerId = body.owner_id || "pack-sync-system";
      const translated = translatePack(pack);
      const fullHtml = pack.preview_html || pack.previewHtml || "";
      const compactPreview = compactHtml(fullHtml);
      const manifestJson = JSON.stringify(pack);
      const payloadHash = await sha256(manifestJson);

      // Idempotency: an identical pack payload returns the existing receipt instead of duplicating artifacts.
      const priorReceipts = await base44.asServiceRole.entities.PackSyncReceipt.filter({
        template_key: templateKey,
        payload_sha256: payloadHash,
      });
      const priorReceipt = (priorReceipts.items || [])[0];
      if (priorReceipt) {
        return Response.json({
          ok: true,
          idempotent_replay: true,
          receipt_id: priorReceipt.receipt_id,
          pack_id: priorReceipt.pack_id,
          template_id: priorReceipt.template_id || null,
          template_key: templateKey,
          version: priorReceipt.version,
          sync_status: priorReceipt.status,
          visual_status: priorReceipt.visual_status || "not_run",
          operational_status: priorReceipt.operational_status || "not_run",
          payload_sha256: payloadHash,
          message: "Identical pack already stored; no duplicate artifacts were created.",
        });
      }

      const existing = await base44.asServiceRole.entities.BrandTemplate.filter({
        template_key: translated.template_key,
      });
      const existingRecord = (existing.items || [])[0];
      const previousVersion = existingRecord?.version || null;
      if (existingRecord && !pack.version) translated.version = incrementPatch(previousVersion || "1.0.0");

      const packId = pack.pack_id || `pack_${templateKey}_${payloadHash.slice(0, 16)}`;
      const receiptId = `psr_${crypto.randomUUID()}`;
      const validationId = `pvr_${crypto.randomUUID()}`;

      const receiptRecord = await base44.asServiceRole.entities.PackSyncReceipt.create({
        owner_id: ownerId,
        receipt_id: receiptId,
        pack_id: packId,
        template_key: templateKey,
        pack_type: packType,
        version: translated.version,
        previous_version: previousVersion || "",
        payload_sha256: payloadHash,
        status: "accepted",
        artifact_count: 0,
        visual_status: "not_run",
        operational_status: "not_run",
        repair_attempts: 0,
        blockers: [],
        evidence_refs: [],
        received_at: new Date().toISOString(),
        metadata: {
          source: "gpt-pack-sync-v2",
          preview_original_length: fullHtml.length,
          preview_compact_length: compactPreview.length,
        },
      });

      let artifactCount = 0;
      artifactCount += await storeTextArtifact(base44, {
        ownerId,
        packId,
        templateKey,
        version: translated.version,
        artifactKey: "source-manifest",
        artifactType: "source_manifest",
        content: manifestJson,
        contentType: "application/json",
        metadata: { receipt_id: receiptId },
      });
      artifactCount += await storeTextArtifact(base44, {
        ownerId,
        packId,
        templateKey,
        version: translated.version,
        artifactKey: "source-preview-html",
        artifactType: "source_html",
        content: compactPreview,
        contentType: "text/html",
        metadata: { receipt_id: receiptId },
      });
      if (pack.app_manifest || pack.appManifest) {
        artifactCount += await storeTextArtifact(base44, {
          ownerId,
          packId,
          templateKey,
          version: translated.version,
          artifactKey: "app-manifest",
          artifactType: "app_manifest",
          content: JSON.stringify(pack.app_manifest || pack.appManifest),
          contentType: "application/json",
          metadata: { receipt_id: receiptId },
        });
      }
      if (pack.operational_contract || pack.operationalContract) {
        artifactCount += await storeTextArtifact(base44, {
          ownerId,
          packId,
          templateKey,
          version: translated.version,
          artifactKey: "operational-contract",
          artifactType: "operational_contract",
          content: JSON.stringify(pack.operational_contract || pack.operationalContract),
          contentType: "application/json",
          metadata: { receipt_id: receiptId },
        });
      }

      // BrandTemplate remains the editable Base44 representation. Large previews live losslessly in PackArtifact.
      translated.preview_html = compactPreview.length <= 30000 ? compactPreview : "";
      translated.notes = `${translated.notes} | sha256:${payloadHash} | pack:${packId} | receipt:${receiptId}`.slice(0, 2000);
      const templatePayload = {
        ...translated,
        current_pack_id: packId,
        current_receipt_id: receiptId,
        validation_status: "not_run",
        ...(previousVersion ? { parent_version: previousVersion } : {}),
      };

      let record;
      if (existingRecord) {
        record = await base44.asServiceRole.entities.BrandTemplate.update(existingRecord.id, templatePayload);
      } else {
        record = await base44.asServiceRole.entities.BrandTemplate.create({
          ...templatePayload,
          owner_id: ownerId,
        });
      }

      await base44.asServiceRole.entities.PackSyncReceipt.update(receiptRecord.id, {
        template_id: record.id,
        status: "stored",
        artifact_count: artifactCount,
        metadata: {
          source: "gpt-pack-sync-v2",
          preview_original_length: fullHtml.length,
          preview_compact_length: compactPreview.length,
          preview_stored_in_template: compactPreview.length <= 30000,
        },
      });

      // Create a durable validation job record. A separate validator must execute it before parity can become PASS.
      await base44.asServiceRole.entities.PackValidationRun.create({
        owner_id: ownerId,
        validation_id: validationId,
        receipt_id: receiptId,
        pack_id: packId,
        template_key: templateKey,
        target_url: record.deployed_url || "",
        run_type: "full",
        status: "queued",
        validator_name: "pack-parity-validator",
        validator_version: "2.0.0",
        failures: [],
        evidence_refs: [],
        repair_attempt: 0,
        max_repairs: 3,
        notes: "Queued by packSync V2. PASS requires >=99 visual score and 100 operational score.",
      });

      return Response.json({
        ok: true,
        receipt_id: receiptId,
        validation_id: validationId,
        pack_id: packId,
        template_id: record.id,
        template_key: translated.template_key,
        name: translated.name,
        status: translated.status,
        sync_status: "stored",
        validation_status: "queued",
        parity_certified: false,
        sections_count: translated.sections.length,
        version: translated.version,
        parent_version: previousVersion,
        preview_stored_losslessly: true,
        preview_stored_in_template: compactPreview.length <= 30000,
        preview_length: fullHtml.length,
        compact_preview_length: compactPreview.length,
        artifact_count: artifactCount,
        payload_sha256: payloadHash,
        message: `Pack "${translated.name}" stored successfully. Validation is queued; parity is not certified until validator PASS.`,
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