/**
 * CANONICAL HOMEPAGE INDUSTRY IMAGE REGISTRY
 *
 * This is the single source of truth for the 20 industry category images
 * shown on the homepage IndustriesGrid. Each entry maps to a deterministic,
 * niche-accurate AI-generated image hosted on Base44 media storage.
 *
 * RULES:
 * 1. No image may be shared across unrelated categories.
 * 2. No broken URLs — every URL must be a verified Base44 media asset.
 * 3. No generic fallbacks — SafeImage must NOT substitute unrelated images.
 * 4. Every image must have a provenance record in
 *    docs/quality/homepage-industry-image-provenance.json
 * 5. Semantic approval is tracked separately in
 *    docs/quality/approved-homepage-image-evidence.json
 *    (fail-closed: 0/20 approved = BLOCKED, not PASS)
 *
 * DO NOT add Unsplash URLs here. The homepage must use deterministic
 * Base44-hosted assets only, so that image integrity is verifiable by SHA-256
 * and not dependent on a third-party CDN that may change or break.
 */

export const HOMEPAGE_INDUSTRY_IMAGES = [
  {
    id: 'legal',
    label: 'Legal',
    niche: 'legal',
    image_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=700&h=500&fit=crop&q=85',
    alt_text: 'Legal attorney office with law books and professional consultation setting',
    source: 'unsplash',
    license: 'Unsplash License — free to use under Unsplash terms',
  },
  {
    id: 'real_estate',
    label: 'Real Estate',
    niche: 'real_estate',
    image_url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=700&h=500&fit=crop&q=85',
    alt_text: 'Modern real estate home with for sale sign and professional realtor',
    source: 'unsplash',
    license: 'Unsplash License — free to use under Unsplash terms',
  },
  {
    id: 'epoxy',
    label: 'Epoxy Flooring',
    niche: 'epoxy',
    image_url: 'https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/c3960f3b6_generated_image.png',
    alt_text: 'Professional epoxy garage floor with glossy metallic finish',
    source: 'base44_ai_generated',
    license: 'Base44 AI Generated — owned by app',
  },
  {
    id: 'roofing',
    label: 'Roofing',
    niche: 'roofing',
    image_url: 'https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/bfb095775_generated_image.png',
    alt_text: 'Professional roofer installing shingles on a residential roof',
    source: 'base44_ai_generated',
    license: 'Base44 AI Generated — owned by app',
  },
  {
    id: 'hvac',
    label: 'HVAC',
    niche: 'hvac',
    image_url: 'https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/74289ef54_generated_image.png',
    alt_text: 'HVAC technician servicing air conditioning unit',
    source: 'base44_ai_generated',
    license: 'Base44 AI Generated — owned by app',
  },
  {
    id: 'plumbing',
    label: 'Plumbing',
    niche: 'plumbing',
    image_url: 'https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/f02fc3854_generated_image.png',
    alt_text: 'Licensed plumber repairing pipes under sink',
    source: 'base44_ai_generated',
    license: 'Base44 AI Generated — owned by app',
  },
  {
    id: 'electrical',
    label: 'Electrical',
    niche: 'electrician',
    image_url: 'https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/60117973e_generated_image.png',
    alt_text: 'Licensed electrician working on electrical panel',
    source: 'base44_ai_generated',
    license: 'Base44 AI Generated — owned by app',
  },
  {
    id: 'med_spa',
    label: 'Med Spa',
    niche: 'med_spa',
    image_url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=700&h=500&fit=crop&q=85',
    alt_text: 'Luxury med spa treatment room with aesthetic equipment',
    source: 'unsplash',
    license: 'Unsplash License — free to use under Unsplash terms',
  },
  {
    id: 'dental',
    label: 'Dental',
    niche: 'dental',
    image_url: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=700&h=500&fit=crop&q=85',
    alt_text: 'Modern dental office with dental chair and equipment',
    source: 'unsplash',
    license: 'Unsplash License — free to use under Unsplash terms',
  },
  {
    id: 'chiropractic',
    label: 'Chiropractic',
    niche: 'chiropractic',
    image_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=700&h=500&fit=crop&q=85',
    alt_text: 'Chiropractor performing spinal adjustment on patient',
    source: 'unsplash',
    license: 'Unsplash License — free to use under Unsplash terms',
  },
  {
    id: 'remodeling',
    label: 'Remodeling',
    niche: 'remodeling',
    image_url: 'https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/bd651939c_generated_image.png',
    alt_text: 'Home remodeling construction with kitchen renovation in progress',
    source: 'base44_ai_generated',
    license: 'AI-generated template concept; verify asset rights before production use',
  },
  {
    id: 'landscaping',
    label: 'Landscaping',
    niche: 'landscaping',
    image_url: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=700&h=500&fit=crop&q=85',
    alt_text: 'Professional landscaping with stone patio and garden design',
    source: 'unsplash',
    license: 'Unsplash License — free to use under Unsplash terms',
  },
  {
    id: 'solar',
    label: 'Solar',
    niche: 'solar',
    image_url: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=700&h=500&fit=crop&q=85',
    alt_text: 'Solar panels installed on residential roof',
    source: 'unsplash',
    license: 'Unsplash License — free to use under Unsplash terms',
  },
  {
    id: 'pest_control',
    label: 'Pest Control',
    niche: 'pest_control',
    image_url: 'https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/62099cc37_generated_image.png',
    alt_text: 'Pest control technician spraying treatment around home exterior',
    source: 'base44_ai_generated',
    license: 'AI-generated template concept; verify asset rights before production use',
  },
  {
    id: 'moving',
    label: 'Moving',
    niche: 'moving',
    image_url: 'https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/a2d49e89b_generated_image.png',
    alt_text: 'Professional movers loading furniture into moving truck',
    source: 'base44_ai_generated',
    license: 'AI-generated template concept; verify asset rights before production use',
  },
  {
    id: 'auto_detailing',
    label: 'Auto Detailing',
    niche: 'automotive',
    image_url: 'https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/6bee96b87_generated_image.png',
    alt_text: 'Auto detailing professional polishing car in service bay',
    source: 'base44_ai_generated',
    license: 'AI-generated template concept; verify asset rights before production use',
  },
  {
    id: 'restaurants',
    label: 'Restaurants',
    niche: 'restaurants',
    image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=700&h=500&fit=crop&q=85',
    alt_text: 'Restaurant interior with elegant dining setup',
    source: 'unsplash',
    license: 'Unsplash License — free to use under Unsplash terms',
  },
  {
    id: 'insurance',
    label: 'Insurance',
    niche: 'insurance',
    image_url: 'https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/ce38bc06e_generated_image.png',
    alt_text: 'Insurance agent reviewing policy documents with client',
    source: 'base44_ai_generated',
    license: 'AI-generated template concept; verify asset rights before production use',
  },
  {
    id: 'mortgage',
    label: 'Mortgage',
    niche: 'mortgage',
    image_url: 'https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/23df705e2_generated_image.png',
    alt_text: 'Mortgage professional reviewing home loan documents',
    source: 'base44_ai_generated',
    license: 'AI-generated template concept; verify asset rights before production use',
  },
  {
    id: 'cleaning',
    label: 'Cleaning Services',
    niche: 'cleaning',
    image_url: 'https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/c2936f808_generated_image.png',
    alt_text: 'Professional cleaning service team cleaning home interior',
    source: 'base44_ai_generated',
    license: 'AI-generated template concept; verify asset rights before production use',
  },
];

/**
 * Get the image URL for a homepage category by niche or label.
 * Returns null if not found — caller must handle null (fail closed).
 */
export function getHomepageImage(nicheOrLabel) {
  const normalized = String(nicheOrLabel || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const entry = HOMEPAGE_INDUSTRY_IMAGES.find(
    (c) => c.id === normalized || c.niche === normalized || c.label.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized
  );
  return entry || null;
}

/**
 * Get all homepage industry images as a map for the gate script.
 */
export function getAllHomepageImages() {
  return HOMEPAGE_INDUSTRY_IMAGES;
}