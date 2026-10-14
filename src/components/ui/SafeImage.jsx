import React, { useState, useEffect, useMemo } from "react";

// Industry/category-relevant fallback images (Unsplash, verified stable URLs).
const CATEGORY_FALLBACKS = {
  // Industry
  contractor: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
  health: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80",
  legal: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80",
  professional: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3a?w=800&q=80",
  realestate: "https://images.unsplash.com/photo-1568605114987-395e3a5eb4c5?w=800&q=80",
  home: "https://images.unsplash.com/photo-1581578731548-c64695cccae9?w=800&q=80",
  automotive: "https://images.unsplash.com/photo-1492144534155-93156a5f2de7?w=800&q=80",
  // Platform
  ecommerce: "https://images.unsplash.com/photo-1556742049-0cfed4d6cedd?w=800&q=80",
  saas: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
  ai_chat: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
  pwa: "https://images.unsplash.com/photo-1512941937669-90a1b00e1d0f?w=800&q=80",
  funnel: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
  marketplace: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9a4?w=800&q=80",
  agency: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80",
  social: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80",
  portfolio: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80",
  booking: "https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?w=800&q=80",
  // Automation
  content_generator: "https://images.unsplash.com/photo-1499750310107-5fef28a65638?w=800&q=80",
  branding_generator: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&q=80",
  logo_generator: "https://images.unsplash.com/photo-1620207418302-439b3873794d?w=800&q=80",
  image_generator: "https://images.unsplash.com/photo-1635776062127-d379b38ba31d?w=800&q=80",
  app_pack: "https://images.unsplash.com/photo-1512941937669-90a1b00e1d0f?w=800&q=80",
  web_pack: "https://images.unsplash.com/photo-1467232004584-a6e5c8c52d44?w=800&q=80",
  ai_tool: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
  // Generic
  default: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
};

// Niche → category mapping for automatic fallback selection
const NICHE_TO_CATEGORY = {
  epoxy: "contractor", roofing: "contractor", hvac: "contractor", plumbing: "contractor",
  electrical: "contractor", remodeling: "contractor", landscaping: "contractor", garage: "contractor",
  concrete: "contractor", flooring: "contractor",
  med_spa: "health", dental: "health", chiropractic: "health", medical: "health", wellness: "health",
  therapy: "health", fitness: "health",
  legal: "legal", attorney: "legal", law: "legal", notary: "legal",
  insurance: "professional", mortgage: "professional", accounting: "professional",
  consulting: "professional", financial: "professional",
  real_estate: "realestate", property: "realestate", realtor: "realestate", rental: "realestate",
  cleaning: "home", pest_control: "home", moving: "home", painting: "home", pool: "home",
  auto_detailing: "automotive", auto_repair: "automotive", towing: "automotive", tires: "automotive",
  // Platform
  ecommerce: "ecommerce", shop: "ecommerce", store: "ecommerce", dropshipping: "ecommerce",
  saas: "saas", software: "saas", platform: "saas", dashboard: "saas",
  ai_chat: "ai_chat", chatbot: "ai_chat", ai_tool: "ai_tool", prompt_lab: "ai_chat", prompt_showcase: "ai_chat",
  pwa: "pwa", mobile_app: "pwa", progressive_web_app: "pwa",
  funnel: "funnel", landing: "funnel", lead_gen: "funnel", conversion: "funnel",
  marketplace: "marketplace", multi_vendor: "marketplace", directory: "marketplace", classifieds: "marketplace",
  agency: "agency", marketing: "agency", design: "agency", branding: "agency",
  social: "social", community: "social", forum: "social", scheduler: "social",
  photography: "portfolio", creative: "portfolio", art: "portfolio",
  booking: "booking", appointment: "booking", reservation: "booking", calendar: "booking",
  // Automation
  content_gen: "content_generator", seo_content: "content_generator",
  brand_gen: "branding_generator", identity: "branding_generator",
  logo: "logo_generator", logo_gen: "logo_generator", brand_mark: "logo_generator",
  image_gen: "image_generator", ai_art: "image_generator", visual_gen: "image_generator",
  app_pack: "app_pack", web_pack: "web_pack",
};

function resolveCategory(category, niche) {
  if (category && CATEGORY_FALLBACKS[category]) return category;
  if (niche) {
    const n = niche.toLowerCase().replace(/[-\s]/g, "_");
    if (NICHE_TO_CATEGORY[n]) return NICHE_TO_CATEGORY[n];
    // Try partial match
    for (const [key, cat] of Object.entries(NICHE_TO_CATEGORY)) {
      if (n.includes(key)) return cat;
    }
  }
  return "default";
}

// Gradient placeholder — the ultimate fallback that never fails
const GRADIENT_PLACEHOLDER =
  "data:image/svg+xml;base64," +
  btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#126fc8"/><stop offset="1" stop-color="#0d9488"/>
  </linearGradient></defs>
  <rect width="800" height="600" fill="url(#g)"/>
  <text x="400" y="300" font-family="sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle" opacity="0.8">Template Preview</text>
  </svg>`);

export default function SafeImage({ src, alt = "", category = "default", niche, className = "", fittingType = "fill", ...props }) {
  // Resolve the best fallback category from category or niche
  const resolvedCategory = useMemo(() => resolveCategory(category, niche), [category, niche]);

  // If src is null/undefined/empty, skip straight to the fallback — don't flash a broken image
  const initialSrc = useMemo(() => {
    if (!src || src === "null" || src === "undefined" || src.trim() === "") {
      return CATEGORY_FALLBACKS[resolvedCategory] || CATEGORY_FALLBACKS.default;
    }
    return src;
  }, [src, resolvedCategory]);

  const [currentSrc, setCurrentSrc] = useState(initialSrc);
  const [fallbackStage, setFallbackStage] = useState(initialSrc === src ? 0 : 1);

  useEffect(() => {
    if (!src || src === "null" || src === "undefined" || src.trim() === "") {
      setCurrentSrc(CATEGORY_FALLBACKS[resolvedCategory] || CATEGORY_FALLBACKS.default);
      setFallbackStage(1);
    } else {
      setCurrentSrc(src);
      setFallbackStage(0);
    }
  }, [src, resolvedCategory]);

  const handleError = () => {
    if (fallbackStage === 0) {
      // Original failed → try resolved category fallback
      setFallbackStage(1);
      setCurrentSrc(CATEGORY_FALLBACKS[resolvedCategory] || CATEGORY_FALLBACKS.default);
    } else if (fallbackStage === 1) {
      // Category fallback failed → try generic default
      setFallbackStage(2);
      setCurrentSrc(CATEGORY_FALLBACKS.default);
    } else {
      // Everything failed → gradient placeholder (never fails)
      setFallbackStage(3);
      setCurrentSrc(GRADIENT_PLACEHOLDER);
    }
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
      {...props}
    />
  );
}