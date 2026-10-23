import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// INDUSTRY TEMPLATE ENHANCER
// Uses the best AI technology for each industry to generate:
// - Industry-specific images (action: regenerate_image)
// - Industry-specific section content (action: regenerate_section)
// - Full template content enhancement (action: enhance_template)

// Industry-specific image prompt templates — each industry gets optimized visual direction
const INDUSTRY_IMAGE_PROMPTS: Record<string, (ctx: string, biz: string) => string> = {
  epoxy_flooring: (ctx, biz) => `Professional epoxy flooring photograph for ${biz}. ${ctx}. High-gloss garage floor with seamless coating, photorealistic, commercial photography, clean composition, natural lighting, no text, no watermark.`,
  roofing: (ctx, biz) => `Professional roofing contractor photograph for ${biz}. ${ctx}. Roofer installing shingles on a residential roof, photorealistic, commercial photography, safety equipment, no text, no watermark.`,
  hvac: (ctx, biz) => `Professional HVAC technician photograph for ${biz}. ${ctx}. HVAC tech servicing air conditioning unit, photorealistic, commercial photography, clean uniform, no text, no watermark.`,
  plumbing: (ctx, biz) => `Professional plumber photograph for ${biz}. ${ctx}. Plumber fixing pipes under sink, photorealistic, commercial photography, professional tools, no text, no watermark.`,
  electrical: (ctx, biz) => `Professional electrician photograph for ${biz}. ${ctx}. Electrician working on electrical panel, photorealistic, commercial photography, safety gear, no text, no watermark.`,
  landscaping: (ctx, biz) => `Professional landscaping photograph for ${biz}. ${ctx}. Beautifully landscaped yard with stone work and plants, photorealistic, commercial photography, no text, no watermark.`,
  remodeling: (ctx, biz) => `Professional home remodeling photograph for ${biz}. ${ctx}. Kitchen or bathroom renovation in progress, photorealistic, commercial photography, no text, no watermark.`,
  med_spa: (ctx, biz) => `Professional med spa photograph for ${biz}. ${ctx}. Clean modern med spa interior, relaxing atmosphere, photorealistic, commercial photography, no text, no watermark.`,
  dental: (ctx, biz) => `Professional dental office photograph for ${biz}. ${ctx}. Modern dental office with clean equipment, photorealistic, commercial photography, no text, no watermark.`,
  chiropractic: (ctx, biz) => `Professional chiropractic office photograph for ${biz}. ${ctx}. Chiropractor adjusting patient, photorealistic, commercial photography, clean clinic, no text, no watermark.`,
  legal: (ctx, biz) => `Professional law firm photograph for ${biz}. ${ctx}. Professional attorney in modern office, photorealistic, commercial photography, no text, no watermark.`,
  real_estate: (ctx, biz) => `Professional real estate photograph for ${biz}. ${ctx}. Beautiful home exterior or realtor with sold sign, photorealistic, commercial photography, no text, no watermark.`,
  cleaning_services: (ctx, biz) => `Professional cleaning service photograph for ${biz}. ${ctx}. Cleaner with professional equipment in spotless home, photorealistic, commercial photography, no text, no watermark.`,
  solar: (ctx, biz) => `Professional solar panel installation photograph for ${biz}. ${ctx}. Solar panels on residential roof, photorealistic, commercial photography, no text, no watermark.`,
  pest_control: (ctx, biz) => `Professional pest control photograph for ${biz}. ${ctx}. Pest control technician inspecting home, photorealistic, commercial photography, no text, no watermark.`,
  moving: (ctx, biz) => `Professional moving company photograph for ${biz}. ${ctx}. Movers loading furniture into truck, photorealistic, commercial photography, no text, no watermark.`,
  auto_detailing: (ctx, biz) => `Professional auto detailing photograph for ${biz}. ${ctx}. Pristine car being detailed with professional equipment, photorealistic, commercial photography, no text, no watermark.`,
  restaurants: (ctx, biz) => `Professional restaurant photograph for ${biz}. ${ctx}. Beautifully plated food in modern restaurant, photorealistic, commercial photography, no text, no watermark.`,
  insurance: (ctx, biz) => `Professional insurance agent photograph for ${biz}. ${ctx}. Insurance agent meeting with client, photorealistic, commercial photography, no text, no watermark.`,
  mortgage: (ctx, biz) => `Professional mortgage broker photograph for ${biz}. ${ctx}. Mortgage advisor reviewing documents with client, photorealistic, commercial photography, no text, no watermark.`,
};

function getImagePrompt(industry: string, ctx: string, biz: string): string {
  const key = (industry || 'general').toLowerCase().replace(/\s+/g, '_');
  const fn = INDUSTRY_IMAGE_PROMPTS[key];
  if (fn) return fn(ctx, biz);
  return `Professional ${industry} industry photograph for ${biz}. ${ctx}. Photorealistic, commercial photography, clean composition, natural lighting, no text, no watermark, no logo.`;
}

// Industry-specific section content guidance
const INDUSTRY_SECTION_GUIDANCE: Record<string, string> = {
  epoxy_flooring: 'Focus on garage floor coatings, polyaspartic vs epoxy, durability, moisture resistance, 1-day installation, 15-20 year warranty.',
  roofing: 'Focus on storm damage repair, roof inspection, shingle replacement, insurance claims, emergency tarping, 50-year warranties.',
  hvac: 'Focus on AC repair, furnace installation, indoor air quality, 24/7 emergency service, energy efficiency, seasonal maintenance.',
  plumbing: 'Focus on drain cleaning, water heater repair, leak detection, emergency service, tankless installation, repiping.',
  electrical: 'Focus on panel upgrades, rewiring, safety inspections, generator installation, EV charger installation, emergency repairs.',
  landscaping: 'Focus on design-build, hardscaping, irrigation, lawn care, seasonal cleanups, outdoor lighting.',
  remodeling: 'Focus on kitchen and bathroom renovation, design-build process, permits, timelines, material selection.',
  med_spa: 'Focus on facials, injectables, laser treatments, body contouring, wellness, consultation process.',
  dental: 'Focus on cosmetic dentistry, implants, Invisalign, emergency dental, sedation options, family dentistry.',
  chiropractic: 'Focus on spinal adjustment, injury recovery, wellness care, insurance coverage, massage therapy.',
  legal: 'Focus on practice areas, free consultation, case results, contingency fee, experience and credentials.',
  real_estate: 'Focus on market expertise, free home valuation, buying and selling process, local market knowledge.',
  cleaning_services: 'Focus on residential and commercial cleaning, deep cleaning, move-in/out, recurring service, eco-friendly products.',
  solar: 'Focus on solar panel installation, energy savings, tax credits, battery storage, free consultation.',
  pest_control: 'Focus on termite treatment, quarterly service, eco-friendly options, free inspection, guaranteed results.',
  moving: 'Focus on residential and commercial moving, packing services, storage, long-distance, insured and licensed.',
  auto_detailing: 'Focus on interior and exterior detailing, ceramic coating, paint correction, mobile service, packages.',
  restaurants: 'Focus on menu highlights, reservations, private dining, catering, ambiance, fresh ingredients.',
  insurance: 'Focus on coverage options, free quotes, claims support, multi-policy discounts, local agent.',
  mortgage: 'Focus on pre-approval, refinance, first-time buyer, rate locks, fast closing, loan types.',
};

function getSectionGuidance(industry: string): string {
  const key = (industry || 'general').toLowerCase().replace(/\s+/g, '_');
  return INDUSTRY_SECTION_GUIDANCE[key] || `Focus on ${industry} industry-specific services, benefits, and conversion-focused copy.`;
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { action, industry, businessName, phone, email, imageContext, sectionType, currentContent } = body;

    const ind = (industry || 'general').toLowerCase();
    const biz = businessName || 'Your Business';
    const ph = phone || '(555) 123-4567';
    const em = email || 'contact@yourbusiness.com';
    const guidance = getSectionGuidance(industry);

    // ── REGENERATE IMAGE ──
    if (action === 'regenerate_image') {
      const ctx = imageContext || 'professional website hero image';
      const prompt = getImagePrompt(ind, ctx, biz);

      const res = await base44.integrations.Core.GenerateImage({ prompt });
      return Response.json({ url: res.url, prompt });
    }

    // ── REGENERATE SECTION ──
    if (action === 'regenerate_section') {
      const secType = (sectionType || 'section').toLowerCase();
      const prompt = `Generate a single HTML section for a ${ind} business website. Business name: "${biz}". Phone: ${ph}. Email: ${em}. Section type/class: ${secType}.

Industry-specific guidance for ${ind}: ${guidance}

Requirements:
- Return ONLY the HTML for this section (no html, head, or body tags)
- Use semantic HTML with inline styles or class names that match a professional ${ind} website
- Include compelling, industry-specific headings and persuasive copy
- Make it conversion-focused with clear value propositions
- Keep it self-contained (a div or section element with its content)
- Do not include scripts or external resources`;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            html: { type: 'string', description: 'The HTML section content' }
          },
          required: ['html']
        }
      });

      return Response.json({ html: res.html });
    }

    // ── ENHANCE TEMPLATE (full content) ──
    if (action === 'enhance_template') {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a website content generator for the ${ind} industry. Generate enhanced, industry-specific content for a ${ind} business website. Business: "${biz}". Phone: ${ph}. Email: ${em}.

Industry-specific guidance: ${guidance}

Return JSON with enhanced content for each section. All content must be specific to the ${ind} industry and conversion-optimized.`,
        response_json_schema: {
          type: 'object',
          properties: {
            heroHeadline: { type: 'string' },
            heroSubtext: { type: 'string' },
            services: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' }
                }
              }
            },
            aboutText: { type: 'string' },
            whyChooseUs: { type: 'array', items: { type: 'string' } },
            testimonials: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  text: { type: 'string' }
                }
              }
            },
            faqs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  q: { type: 'string' },
                  a: { type: 'string' }
                }
              }
            }
          }
        }
      });

      return Response.json({ content: res });
    }

    return Response.json({ error: 'Unknown action. Use regenerate_image, regenerate_section, or enhance_template' }, { status: 400 });
  } catch (error) {
    console.error('Industry template enhancer error:', error);
    return Response.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}