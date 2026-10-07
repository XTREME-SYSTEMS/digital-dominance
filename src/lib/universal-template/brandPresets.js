// Brand presets for the Universal Template Studio.
// Each preset defines the visual identity for a brand: colors, logo, fonts,
// domain, phone, and tagline. These feed into studioConfig and the visualizer.

export const BRAND_PRESETS = {
  xtremepolishingsystems: {
    id: "xtremepolishingsystems",
    name: "Xtreme Polishing Systems",
    short: "XPS",
    domain: "xtremepolishingsystems.com",
    niche: "epoxy_flooring",
    primary_color: "#D4A92E",
    secondary_color: "#B8901E",
    accent_color: "#1a1a1a",
    logo_url: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/20999222a_Logo_XPS_Color_12-20-24.webp",
    logo_text: "Xtreme Polishing Systems",
    font_heading: "Plus Jakarta Sans",
    font_body: "Inter",
    phone: "(877) 958-5264",
    tagline: "#1 National Distributor of Concrete Coatings and Equipment",
    description: "The parent company — full ecommerce distributor site with products, equipment, coatings, color charts, and locations.",
  },
  nationalconcretepolishing: {
    id: "nationalconcretepolishing",
    name: "National Concrete Polishing",
    short: "NCP",
    domain: "nationalconcretepolishing.net",
    niche: "polished_concrete",
    primary_color: "#0EA5E9",
    secondary_color: "#0369A1",
    accent_color: "#FACC15",
    logo_url: "",
    logo_text: "National Concrete Polishing",
    font_heading: "Montserrat",
    font_body: "Open Sans",
    phone: "(877) 958-6408",
    tagline: "National Polished Concrete Contractors",
    description: "National contractor brand for polished concrete services across commercial and residential.",
  },
  polishedconcreteuniversity: {
    id: "polishedconcreteuniversity",
    name: "Polished Concrete University",
    short: "PCU",
    domain: "polishingconcreteuniversity.com",
    niche: "decorative_concrete",
    primary_color: "#7C3AED",
    secondary_color: "#5B21B6",
    accent_color: "#F59E0B",
    logo_url: "",
    logo_text: "Polished Concrete University",
    font_heading: "Poppins",
    font_body: "Inter",
    phone: "(877) 958-6408",
    tagline: "Train. Certify. Master Concrete Polishing.",
    description: "Training and certification platform for concrete polishing professionals.",
  },
  custom_contractor: {
    id: "custom_contractor",
    name: "Custom Contractor",
    short: "Custom",
    domain: "",
    niche: "epoxy_garage",
    primary_color: "#D4A92E",
    secondary_color: "#B8901E",
    accent_color: "#1a1a1a",
    logo_url: "",
    logo_text: "Your Contractor Name",
    font_heading: "Plus Jakarta Sans",
    font_body: "Inter",
    phone: "(877) 958-6408",
    tagline: "Local Epoxy & Concrete Experts",
    description: "Blank slate for any epoxy, decorative concrete, or polished concrete contractor.",
  },
};

export const BRAND_LIST = Object.values(BRAND_PRESETS);

export function getPreset(brandId) {
  return BRAND_PRESETS[brandId] || BRAND_PRESETS.custom_contractor;
}

// Niche options for the custom contractor path
export const NICHE_OPTIONS = [
  { value: "epoxy_garage", label: "Epoxy Garage Floors" },
  { value: "decorative_concrete", label: "Decorative Concrete" },
  { value: "polished_concrete", label: "Polished Concrete" },
  { value: "epoxy_flooring", label: "Epoxy Flooring" },
  { value: "garage_coating", label: "Garage Coating" },
  { value: "concrete_resurfacing", label: "Concrete Resurfacing" },
  { value: "general_contractor", label: "General Contractor" },
];

// Template category options
export const CATEGORY_OPTIONS = [
  { value: "homepage", label: "Homepage" },
  { value: "landing_page", label: "Landing Page" },
  { value: "funnel", label: "Lead Funnel" },
  { value: "service_page", label: "Service Page" },
  { value: "location_page", label: "Location Page" },
  { value: "gallery", label: "Gallery" },
  { value: "about", label: "About" },
  { value: "contact", label: "Contact" },
  { value: "cost_page", label: "Cost/Pricing" },
  { value: "color_charts", label: "Color Charts" },
  { value: "blog_post", label: "Blog Post" },
  { value: "full_site", label: "Full Site" },
];

// Default section templates for a new brand template
export function defaultSections(category) {
  const base = [
    {
      section_id: "hero",
      section_type: "hero",
      name: "Hero Section",
      enabled: true,
      content: {
        headline: "Transform Your Concrete Floors",
        subheadline: "Professional epoxy and polished concrete solutions.",
        cta_text: "Get Free Estimate",
        cta_link: "/estimate",
        background_image: "",
        trust_badges: ["No Obligation", "Lifetime Warranty", "No Peeling"],
      },
    },
    {
      section_id: "stats",
      section_type: "stats",
      name: "Stats Bar",
      enabled: true,
      content: {
        items: [
          { value: "2,400+", label: "Projects Completed" },
          { value: "70+", label: "Locations Nationwide" },
          { value: "25+", label: "Years Experience" },
          { value: "100%", label: "Satisfaction" },
        ],
      },
    },
    {
      section_id: "showcase",
      section_type: "showcase",
      name: "System Showcase",
      enabled: true,
      content: {
        title: "Our Flooring Systems",
        systems: [
          { name: "Solid Color", image: "", price_tier: "$" },
          { name: "Broadcast Flake", image: "", price_tier: "$$" },
          { name: "Metallic Epoxy", image: "", price_tier: "$$$" },
        ],
      },
    },
    {
      section_id: "testimonials",
      section_type: "testimonials",
      name: "Testimonials",
      enabled: true,
      content: {
        title: "Loved by Our Customers",
        reviews: [
          { name: "Alan G.", role: "Homeowner", text: "Best decision we made for our garage." },
          { name: "Danielle J.", role: "Business Owner", text: "Customers ask about our floor every day." },
        ],
      },
    },
    {
      section_id: "cta",
      section_type: "cta",
      name: "Final CTA",
      enabled: true,
      content: {
        headline: "Ready to Transform Your Floors?",
        subheadline: "Get your instant estimate in 60 seconds.",
        cta_text: "Get My Estimate",
        cta_link: "/estimate",
      },
    },
  ];

  if (category === "funnel") {
    return base.filter((s) => ["hero", "stats", "showcase", "testimonials", "cta"].includes(s.section_type));
  }
  if (category === "color_charts") {
    return [
      {
        section_id: "color_hero",
        section_type: "hero",
        name: "Color Chart Hero",
        enabled: true,
        content: {
          headline: "Epoxy Color Charts",
          subheadline: "Explore our full range of professional epoxy colors.",
        },
      },
      {
        section_id: "color_grid",
        section_type: "showcase",
        name: "Color Grid",
        enabled: true,
        content: {
          title: "Browse by System",
          systems: [
            { name: "Metallic Pigments", image: "" },
            { name: "Flake Systems", image: "" },
            { name: "Solid Color", image: "" },
            { name: "Quartz", image: "" },
          ],
        },
      },
    ];
  }
  return base;
}