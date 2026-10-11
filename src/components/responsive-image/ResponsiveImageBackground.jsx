import React from "react";

// ResponsiveImageBackground — renders a full-screen image optimized for both
// desktop and mobile using an AI-generated config (from responsiveImageOptimizer).
//
// Props:
//   image_url — the image to display
//   config    — AI optimization config (focal_point, object_position, treatment, scale)
//   alt       — accessibility label
//   children  — overlaid content (buttons, links, etc.)
//
// If no config is provided, uses sensible defaults for design mockups.
export default function ResponsiveImageBackground({ image_url, config, alt = "", children, className = "" }) {
  const c = config || {};
  const bgColor = c.bg_color || "#000000";

  // Desktop: hidden on mobile
  const desktopStyle = {
    objectFit: c.treatment_desktop || "cover",
    objectPosition: c.object_position_desktop || "center center",
    transform: `scale(${c.scale_desktop || 1})`,
    transformOrigin: "center center",
  };

  // Mobile: hidden on desktop
  const mobileStyle = {
    objectFit: c.treatment_mobile || "cover",
    objectPosition: c.object_position_mobile || "center top",
    transform: `scale(${c.scale_mobile || 1})`,
    transformOrigin: "center center",
  };

  return (
    <div className={`relative min-h-screen w-full overflow-hidden ${className}`} style={{ backgroundColor: bgColor }}>
      {/* Desktop version — 768px and up */}
      <img
        src={image_url}
        alt={alt}
        className="hidden md:block absolute inset-0 w-full h-full"
        style={desktopStyle}
      />
      {/* Mobile version — below 768px */}
      <img
        src={image_url}
        alt={alt}
        className="block md:hidden absolute inset-0 w-full h-full"
        style={mobileStyle}
      />
      {children}
    </div>
  );
}