import React, { useState, useEffect } from "react";

// Industry-relevant fallback images (Unsplash, verified stable URLs).
// These guarantee every image slot renders something meaningful — never blank.
const INDUSTRY_FALLBACKS = {
  contractor: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
  health: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80",
  legal: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80",
  professional: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3a?w=800&q=80",
  realestate: "https://images.unsplash.com/photo-1568605114987-395e3a5eb4c5?w=800&q=80",
  home: "https://images.unsplash.com/photo-1581578731548-c64695cccae9?w=800&q=80",
  automotive: "https://images.unsplash.com/photo-1492144534155-93156a5f2de7?w=800&q=80",
  default: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
};

// NEEDS_IMAGE_REVIEW placeholder — shown when failClosed and image fails.
// This prevents the homepage from silently showing wrong industry imagery.
const svgDataUri = (svg) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);

const NEEDS_REVIEW_PLACEHOLDER =
  svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="700" height="500" viewBox="0 0 700 500">
  <rect width="700" height="500" fill="#0a1220"/>
  <text x="350" y="240" font-family="sans-serif" font-size="22" font-weight="bold" fill="#ff6b6b" text-anchor="middle">NEEDS IMAGE REVIEW</text>
  <text x="350" y="275" font-family="sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">Category image failed — do not substitute</text>
  </svg>`);

// Generic gradient placeholder (data URI) — the ultimate fallback that never fails.
const GRADIENT_PLACEHOLDER =
  svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#126fc8"/><stop offset="1" stop-color="#0d9488"/>
  </linearGradient></defs>
  <rect width="800" height="600" fill="url(#g)"/>
  <text x="400" y="300" font-family="sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle" opacity="0.8">Image Loading...</text>
  </svg>`);

/**
 * SafeImage — guarantees an image always renders successfully.
 * Tries: original URL → industry fallback → generic fallback → gradient placeholder.
 * Uses the platform Image component for Wix Media URLs (server-side resize/WebP).
 *
 * CRITICAL: When `failClosed` is true (used by the homepage IndustriesGrid),
 * no industry/generic fallback is applied. A broken image shows a
 * NEEDS_IMAGE_REVIEW placeholder instead of an unrelated category photo.
 * This prevents the homepage from silently showing wrong industry imagery.
 */
export default function SafeImage({ src, alt = "", category = "default", className = "", fittingType = "fill", failClosed = false, ...props }) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [fallbackStage, setFallbackStage] = useState(0); // 0=original, 1=industry, 2=generic, 3=gradient

  useEffect(() => {
    setCurrentSrc(src);
    setFallbackStage(0);
  }, [src]);

  const industryFallback = INDUSTRY_FALLBACKS[category] || INDUSTRY_FALLBACKS.default;
  const genericFallback = INDUSTRY_FALLBACKS.default;

  const handleError = () => {
    // FAIL-CLOSED: when failClosed is true (homepage), do NOT substitute
    // an unrelated industry image. Show NEEDS_IMAGE_REVIEW instead.
    if (failClosed) {
      setFallbackStage(3);
      setCurrentSrc(NEEDS_REVIEW_PLACEHOLDER);
      return;
    }
    if (fallbackStage === 0) {
      setFallbackStage(1);
      setCurrentSrc(industryFallback);
    } else if (fallbackStage === 1) {
      setFallbackStage(2);
      setCurrentSrc(genericFallback);
    } else {
      setFallbackStage(3);
      setCurrentSrc(GRADIENT_PLACEHOLDER);
    }
  };

  // Always use a plain img — the platform Image component's size-measurement
  // logic can fail to render in certain layouts, leaving image slots blank.
  // Plain img tags load reliably and the fallback chain above handles errors.
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