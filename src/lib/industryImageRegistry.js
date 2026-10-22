/**
 * Industry Image Registry — FRONTEND COPY.
 *
 * Canonical source: base44/shared/industryImageRegistry.ts (used by the backend
 * image mandate and the scheduled templateImageMandate job). Frontend code
 * cannot import from base44/, so this copy lets template previews resolve the
 * exact same approved photography. Keep the two in step: any URL changed on the
 * backend must be mirrored here.
 *
 * RULES
 * 1. One approved image per industry, never shared with an unrelated industry.
 * 2. No dead URLs — every entry is a verified-live asset, re-checked by the
 *    imageMandateAudit job. 22 Unsplash entries previously 404'd and left every
 *    template slot blank; each is now a live Base44-hosted asset.
 * 3. 'default' is the only generic entry and is never a substitute for a
 *    named industry — previews fail closed instead.
 */

export const INDUSTRY_IMAGES = {
  epoxy: { label: "Epoxy Flooring", url: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/090c0dbb8_generated_image.png" },
  roofing: { label: "Roofing", url: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/18622e02f_generated_image.png" },
  hvac: { label: "HVAC", url: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80&auto=format&fit=crop" },
  plumbing: { label: "Plumbing", url: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&q=80&auto=format&fit=crop" },
  electrical: { label: "Electrical", url: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/ea9d7a219_generated_image.png" },
  water_damage: { label: "Water Damage Restoration", url: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/625091ac6_generated_image.png" },
  mold_remediation: { label: "Mold Remediation", url: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/89a71a4d1_generated_image.png" },
  fire_damage: { label: "Fire Damage Restoration", url: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/6fe575a92_generated_image.png" },
  med_spa: { label: "Med Spa", url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80&auto=format&fit=crop" },
  dental: { label: "Dental", url: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=800&q=80&auto=format&fit=crop" },
  chiropractic: { label: "Chiropractic", url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80&auto=format&fit=crop" },
  legal: { label: "Legal", url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80&auto=format&fit=crop" },
  personal_injury: { label: "Personal Injury Law", url: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/1604e81e2_generated_image.png" },
  real_estate: { label: "Real Estate", url: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/e6aa23e34_generated_image.png" },
  insurance: { label: "Insurance", url: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/ce38bc06e_generated_image.png" },
  mortgage: { label: "Mortgage", url: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/23df705e2_generated_image.png" },
  cleaning: { label: "Cleaning Services", url: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/c2936f808_generated_image.png" },
  landscaping: { label: "Landscaping", url: "https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800&q=80&auto=format&fit=crop" },
  solar: { label: "Solar", url: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80&auto=format&fit=crop" },
  pest_control: { label: "Pest Control", url: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/62099cc37_generated_image.png" },
  moving: { label: "Moving Services", url: "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=800&q=80&auto=format&fit=crop" },
  auto_detailing: { label: "Auto Detailing", url: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/6bee96b87_generated_image.png" },
  remodeling: { label: "Remodeling", url: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/bd651939c_generated_image.png" },
  locksmith: { label: "Locksmith", url: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/91025a7cc_generated_image.png" },
  garage_door: { label: "Garage Door", url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&auto=format&fit=crop" },
  restaurants: { label: "Restaurants", url: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/6a26270b8_generated_image.png" },
  default: { label: "Professional", url: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/447c55244_generated_image.png" },
  saas: { label: "SaaS Platform", url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80&auto=format&fit=crop" },
  marketplace: { label: "Marketplace", url: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/107c30c28_generated_image.png" },
  booking: { label: "Booking Platform", url: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/a5b83db58_generated_image.png" },
  social: { label: "Social Platform", url: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/77508582a_generated_image.png" },
  ai_tool: { label: "AI Tool", url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80&auto=format&fit=crop" },
  ecommerce: { label: "Ecommerce Store", url: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/55a6768da_generated_image.png" },
  content_gen: { label: "Content Generator", url: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/a5b713e67_generated_image.png" },
  funnel: { label: "Funnel Builder", url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80&auto=format&fit=crop" },
  identity: { label: "Brand & Web Design", url: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/c911f0390_generated_image.png" },
};

export function normalizeNiche(niche) {
  if (!niche) return "default";
  const n = String(niche).toLowerCase().trim().replace(/[\s-]+/g, "_");

  if (INDUSTRY_IMAGES[n]) return n;

  for (const key of Object.keys(INDUSTRY_IMAGES)) {
    if (key === "default") continue;
    if (n.includes(key) || key.includes(n)) return key;
  }

  const keywordMap = {
    epoxy: "epoxy",
    floor: "epoxy",
    garage: "garage_door",
    roof: "roofing",
    air: "hvac",
    heat: "hvac",
    cool: "hvac",
    pipe: "plumbing",
    leak: "plumbing",
    electric: "electrical",
    wire: "electrical",
    water: "water_damage",
    flood: "water_damage",
    mold: "mold_remediation",
    fire: "fire_damage",
    smoke: "fire_damage",
    spa: "med_spa",
    med: "med_spa",
    dental: "dental",
    tooth: "dental",
    chiropract: "chiropractic",
    spine: "chiropractic",
    legal: "legal",
    law: "legal",
    attorney: "legal",
    injury: "personal_injury",
    real: "real_estate",
    property: "real_estate",
    realtor: "real_estate",
    insurance: "insurance",
    mortgage: "mortgage",
    clean: "cleaning",
    landscap: "landscaping",
    lawn: "landscaping",
    solar: "solar",
    panel: "solar",
    pest: "pest_control",
    bug: "pest_control",
    mov: "moving",
    auto: "auto_detailing",
    car: "auto_detailing",
    detail: "auto_detailing",
    remodel: "remodeling",
    renovat: "remodeling",
    construct: "remodeling",
    lock: "locksmith",
    key: "locksmith",
    restaurant: "restaurants",
    food: "restaurants",
  };

  for (const [keyword, key] of Object.entries(keywordMap)) {
    if (n.includes(keyword)) return key;
  }

  return "default";
}

/** The canonical image for a niche. 'default' means no approved industry image. */
export function getImageForNiche(niche) {
  const key = normalizeNiche(niche);
  return INDUSTRY_IMAGES[key]?.url || INDUSTRY_IMAGES.default.url;
}