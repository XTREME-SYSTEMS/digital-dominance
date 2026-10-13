// ============================================================
// ULTRA-LIFELIKE IMAGE PROMPT LIBRARY
// Engineered to produce photorealistic, ultra-detailed images
// for every industry category. Each prompt uses cinematic
// lighting, professional photography terminology, and specific
// camera/lens specs to force maximum realism from AI generators.
// ============================================================

export const ULTRA_PROMPT_BASE = `ultra-photorealistic, 8K UHD, shot on Canon EOS R5 with RF 24-70mm f/2.8L lens, natural lighting, shallow depth of field, professional photography, hyper-detailed textures, true-to-life colors, no artificial smoothing, no plastic skin, no oversaturation, raw photo aesthetic, award-winning photography`;

export const ULTRA_PROMPTS = {
  water_damage: {
    label: "Water Damage Restoration",
    hero: `Professional water damage restoration technician in full protective gear standing in a flooded living room, industrial extraction equipment visible, dramatic emergency lighting, water reflecting ceiling lights, ${ULTRA_PROMPT_BASE}`,
    gallery: `Flooded basement being pumped out by professional restoration crew, industrial dehumidifiers running, realistic wet concrete textures, dramatic shadows, ${ULTRA_PROMPT_BASE}`,
    team: `Restoration team in branded uniforms inspecting water-damaged drywall, moisture meters in hand, realistic indoor lighting, professional documentary photography style, ${ULTRA_PROMPT_BASE}`,
  },
  mold_remediation: {
    label: "Mold Remediation",
    hero: `Mold remediation specialist in full PPE suit with respirator mask inspecting black mold on bathroom wall, professional containment barriers visible, dramatic clinical lighting, ${ULTRA_PROMPT_BASE}`,
    gallery: `Attic space with mold growth being treated by professional in protective suit, HEPA vacuum equipment, realistic wood grain textures, natural window light, ${ULTRA_PROMPT_BASE}`,
  },
  emergency_plumbing: {
    label: "Emergency Plumbing",
    hero: `Professional plumber kneeling under kitchen sink fixing burst pipe, water spray visible, wrench in hand, realistic pipe fittings, dramatic under-cabinet lighting, ${ULTRA_PROMPT_BASE}`,
    gallery: `Master plumber soldering copper pipes in a utility room, blue flame visible, realistic metal reflections, professional worksite photography, ${ULTRA_PROMPT_BASE}`,
  },
  roof_repair: {
    label: "Roof Repair",
    hero: `Roofer in safety harness on a residential shingle roof at golden hour, replacing damaged shingles, realistic asphalt texture, dramatic sunset sky background, ${ULTRA_PROMPT_BASE}`,
    gallery: `Close-up of professional roofer's hands installing new architectural shingles, nail gun in hand, realistic granule texture, warm sunlight, ${ULTRA_PROMPT_BASE}`,
  },
  epoxy_flooring: {
    label: "Epoxy Garage Flooring",
    hero: `Luxury garage with flawless metallic epoxy floor coating, reflective surface mirroring a parked sports car, dramatic overhead LED lighting, realistic metallic flake texture, ${ULTRA_PROMPT_BASE}`,
    gallery: `Close-up of epoxy installer rolling metallic flake coating on concrete garage floor, squeegee and roller visible, realistic wet coating sheen, professional installation photography, ${ULTRA_PROMPT_BASE}`,
  },
  hvac: {
    label: "HVAC Services",
    hero: `HVAC technician in branded uniform servicing a residential air conditioning unit, manifold gauges visible, realistic condenser coil textures, bright outdoor daylight, ${ULTRA_PROMPT_BASE}`,
    gallery: `Professional HVAC installation team installing a new furnace in a residential basement, sheet metal ductwork visible, realistic metal textures, warm indoor lighting, ${ULTRA_PROMPT_BASE}`,
  },
  electrical: {
    label: "Electrical Services",
    hero: `Licensed electrician in safety glasses working on a residential electrical panel, wire strippers in hand, realistic copper wire textures, focused task lighting, ${ULTRA_PROMPT_BASE}`,
    gallery: `Electrician installing recessed LED can lights in a ceiling, realistic drywall texture, dust particles visible in light beam, professional worksite photography, ${ULTRA_PROMPT_BASE}`,
  },
  landscaping: {
    label: "Landscaping",
    hero: `Professional landscaping crew installing a stone paver patio at a luxury home, lush green lawn in background, golden hour lighting, realistic stone and grass textures, ${ULTRA_PROMPT_BASE}`,
    gallery: `Close-up of landscaper's hands laying interlocking pavers with rubber mallet, realistic paver texture, sand bedding visible, natural outdoor lighting, ${ULTRA_PROMPT_BASE}`,
  },
  pest_control: {
    label: "Pest Control",
    hero: `Pest control technician in branded uniform with backpack sprayer treating a residential exterior perimeter, realistic siding and landscaping textures, bright daylight, ${ULTRA_PROMPT_BASE}`,
    gallery: `Close-up of pest control professional inspecting termite damage on a wooden beam, flashlight beam visible, realistic wood damage texture, ${ULTRA_PROMPT_BASE}`,
  },
  cleaning: {
    label: "Cleaning Services",
    hero: `Professional house cleaning team in branded uniforms cleaning a luxury kitchen, microfiber cloths and spray bottles visible, realistic stainless steel appliance reflections, bright natural lighting, ${ULTRA_PROMPT_BASE}`,
    gallery: `Close-up of cleaning specialist's hand wiping a marble countertop with microfiber cloth, realistic stone texture, cleaning product spray visible, ${ULTRA_PROMPT_BASE}`,
  },
  auto_detailing: {
    label: "Auto Detailing",
    hero: `Professional auto detailer polishing a black luxury sedan with dual-action polisher, realistic paint reflection showing garage lights, water droplets visible, ${ULTRA_PROMPT_BASE}`,
    gallery: `Close-up of detailer's hand applying ceramic coating to luxury car paint, realistic beading water texture, professional studio lighting, ${ULTRA_PROMPT_BASE}`,
  },
  med_spa: {
    label: "Medical Spa",
    hero: `Elegant medical spa reception area with serene lighting, modern minimalist furniture, realistic stone and wood textures, calming blue accent colors, ${ULTRA_PROMPT_BASE}`,
    gallery: `Medical spa treatment room with luxury facial equipment, soft diffused lighting, realistic linen and surface textures, wellness photography, ${ULTRA_PROMPT_BASE}`,
  },
  dental: {
    label: "Dental Services",
    hero: `Modern dental office reception area with warm welcoming lighting, realistic wood paneling and stone textures, professional medical photography, ${ULTRA_PROMPT_BASE}`,
    gallery: `Dentist in scrubs examining a patient with modern dental equipment, realistic dental chair and instrument textures, bright clinical lighting, ${ULTRA_PROMPT_BASE}`,
  },
  legal: {
    label: "Legal Services",
    hero: `Professional attorney in a modern law office, floor-to-ceiling windows with city view, realistic leather chair and mahogany desk textures, dramatic natural lighting, ${ULTRA_PROMPT_BASE}`,
    gallery: `Lawyer consulting with client across a conference table, legal documents spread out, realistic paper and wood textures, professional documentary photography, ${ULTRA_PROMPT_BASE}`,
  },
  real_estate: {
    label: "Real Estate",
    hero: `Professional real estate agent in business attire standing in front of a luxury suburban home at golden hour, realistic brick and landscaping textures, ${ULTRA_PROMPT_BASE}`,
    gallery: `Interior of a staged luxury living room with floor-to-ceiling windows, realistic furniture and architectural details, professional real estate photography, ${ULTRA_PROMPT_BASE}`,
  },
  insurance: {
    label: "Insurance Services",
    hero: `Insurance agent in professional attire at a modern desk, reviewing policy documents on a tablet, realistic office environment, warm professional lighting, ${ULTRA_PROMPT_BASE}`,
    gallery: `Insurance professional shaking hands with a client in a modern office, realistic business attire textures, professional corporate photography, ${ULTRA_PROMPT_BASE}`,
  },
  roofing: {
    label: "Roofing",
    hero: `Professional roofing crew installing a new metal roof on a luxury home, dramatic blue sky background, realistic metal panel reflections, golden hour lighting, ${ULTRA_PROMPT_BASE}`,
    gallery: `Close-up of roofer sealing metal roof seams with professional torch, realistic metal texture and heat shimmer, ${ULTRA_PROMPT_BASE}`,
  },
  remodeling: {
    label: "Home Remodeling",
    hero: `General contractor reviewing blueprints on a kitchen remodel site, realistic construction environment, sawdust visible, professional documentary photography, ${ULTRA_PROMPT_BASE}`,
    gallery: `Newly remodeled luxury kitchen with quartz countertops, custom cabinetry, and stainless steel appliances, realistic material textures, professional interior photography, ${ULTRA_PROMPT_BASE}`,
  },
  moving: {
    label: "Moving Services",
    hero: `Professional moving crew loading furniture into a branded moving truck, realistic furniture and cardboard box textures, bright daylight, ${ULTRA_PROMPT_BASE}`,
    gallery: `Close-up of mover's hands wrapping a leather sofa in protective moving blankets, realistic fabric and blanket textures, ${ULTRA_PROMPT_BASE}`,
  },
};

/**
 * Get the ultra-lifelike prompt for a specific industry and image type.
 * @param {string} industryId - Industry key from TOP_20_INDUSTRIES
 * @param {string} type - "hero" | "gallery" | "team"
 * @returns {string} Full prompt string
 */
export function getUltraPrompt(industryId, type = "hero") {
  const industry = ULTRA_PROMPTS[industryId];
  if (!industry) return ULTRA_PROMPT_BASE;
  return industry[type] || industry.hero;
}

/**
 * Get all prompts for a specific industry.
 */
export function getIndustryPrompts(industryId) {
  return ULTRA_PROMPTS[industryId] || { hero: ULTRA_PROMPT_BASE };
}

/**
 * List all available industry prompt categories.
 */
export function getAvailableIndustries() {
  return Object.entries(ULTRA_PROMPTS).map(([id, data]) => ({
    id,
    label: data.label,
  }));
}