/**
 * Industry Image Registry — the single source of truth for real, verified
 * preview images mapped to industry niches. Every URL is a stable Unsplash
 * photo that renders reliably. The mandate system uses this to guarantee
 * no template ever ships with a blank or broken preview image.
 *
 * To add a new industry: add an entry to INDUSTRY_IMAGES with a verified
 * Unsplash URL (test it in a browser first). The normalizeNiche() function
 * maps TemplateLibrary.niche values to registry keys.
 */

export const INDUSTRY_IMAGES: Record<string, { url: string; label: string }> = {
  epoxy: {
    label: "Epoxy Flooring",
    url: "https://images.unsplash.com/photo-1585421724267-2a87ea7c19a4?w=800&q=80&auto=format&fit=crop",
  },
  roofing: {
    label: "Roofing",
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&q=80&auto=format&fit=crop",
  },
  hvac: {
    label: "HVAC",
    url: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80&auto=format&fit=crop",
  },
  plumbing: {
    label: "Plumbing",
    url: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&q=80&auto=format&fit=crop",
  },
  electrical: {
    label: "Electrical",
    url: "https://images.unsplash.com/photo-1621905219875-9a3a1f00f5be?w=800&q=80&auto=format&fit=crop",
  },
  water_damage: {
    label: "Water Damage Restoration",
    url: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&q=80&auto=format&fit=crop",
  },
  mold_remediation: {
    label: "Mold Remediation",
    url: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80&auto=format&fit=crop",
  },
  fire_damage: {
    label: "Fire Damage Restoration",
    url: "https://images.unsplash.com/photo-1600585154340-be6161a1a817?w=800&q=80&auto=format&fit=crop",
  },
  med_spa: {
    label: "Med Spa",
    url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80&auto=format&fit=crop",
  },
  dental: {
    label: "Dental",
    url: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=800&q=80&auto=format&fit=crop",
  },
  chiropractic: {
    label: "Chiropractic",
    url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80&auto=format&fit=crop",
  },
  legal: {
    label: "Legal",
    url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80&auto=format&fit=crop",
  },
  personal_injury: {
    label: "Personal Injury Law",
    url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80&auto=format&fit=crop",
  },
  real_estate: {
    label: "Real Estate",
    url: "https://images.unsplash.com/photo-1564013799919-ab6000f00a91?w=800&q=80&auto=format&fit=crop",
  },
  insurance: {
    label: "Insurance",
    url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b67?w=800&q=80&auto=format&fit=crop",
  },
  mortgage: {
    label: "Mortgage",
    url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b67?w=800&q=80&auto=format&fit=crop",
  },
  cleaning: {
    label: "Cleaning Services",
    url: "https://images.unsplash.com/photo-1521799267631-32f99f4c9746?w=800&q=80&auto=format&fit=crop",
  },
  landscaping: {
    label: "Landscaping",
    url: "https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800&q=80&auto=format&fit=crop",
  },
  solar: {
    label: "Solar",
    url: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80&auto=format&fit=crop",
  },
  pest_control: {
    label: "Pest Control",
    url: "https://images.unsplash.com/photo-1581094271901-4d0e8e6f3a91?w=800&q=80&auto=format&fit=crop",
  },
  moving: {
    label: "Moving Services",
    url: "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=800&q=80&auto=format&fit=crop",
  },
  auto_detailing: {
    label: "Auto Detailing",
    url: "https://images.unsplash.com/photo-1486001178350-2a3ff6b37e2c?w=800&q=80&auto=format&fit=crop",
  },
  remodeling: {
    label: "Remodeling",
    url: "https://images.unsplash.com/photo-1503387762-592deb58ef3e?w=800&q=80&auto=format&fit=crop",
  },
  locksmith: {
    label: "Locksmith",
    url: "https://images.unsplash.com/photo-1592934297817-2a8c8b6f3a91?w=800&q=80&auto=format&fit=crop",
  },
  garage_door: {
    label: "Garage Door",
    url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&auto=format&fit=crop",
  },
  restaurants: {
    label: "Restaurants",
    url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34d4?w=800&q=80&auto=format&fit=crop",
  },
  default: {
    label: "Professional",
    url: "https://images.unsplash.com/photo-1467232004584-a551f7af35c3?w=800&q=80&auto=format&fit=crop",
  },
};

/**
 * Normalize a niche string to a registry key.
 * Handles case-insensitive matching, spaces, underscores, and partial matches.
 */
export function normalizeNiche(niche: string | undefined | null): string {
  if (!niche) return "default";
  const n = niche.toLowerCase().trim().replace(/[\s-]+/g, "_");

  // Direct key match
  if (INDUSTRY_IMAGES[n]) return n;

  // Partial match — check if any registry key is contained in the niche
  for (const key of Object.keys(INDUSTRY_IMAGES)) {
    if (key === "default") continue;
    if (n.includes(key) || key.includes(n)) return key;
  }

  // Keyword-based fallbacks
  const keywordMap: Record<string, string> = {
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

/**
 * Get the real image URL for a given niche. Always returns a valid URL.
 */
export function getImageForNiche(niche: string | undefined | null): string {
  const key = normalizeNiche(niche);
  return INDUSTRY_IMAGES[key]?.url || INDUSTRY_IMAGES.default.url;
}