import React from "react";
import { Link } from "react-router-dom";

export const XTREME_AI_ICON_URL =
  "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/28db91966_LOGO.png";

export const LOGO_URL =
  "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/ceeb745d3_generated_image.png";

// Brand logo — Unlimited Websites. Blue gradient arrow icon stacked above
// white "unlimited websites" wordmark on dark navy. Reads on both light and
// dark headers.
export default function Logo({ colorClass = "text-white", className = "", size = "md" }) {
  const imgSize = size === "xl" ? "h-14 w-auto" : "h-10 w-auto";
  return (
    <Link
      to="/"
      aria-label="Unlimited Websites — home"
      className={`inline-flex items-center shrink-0 ${colorClass} ${className}`}
    >
      <img
        src={LOGO_URL}
        alt="Unlimited Websites"
        className={`${imgSize} object-contain`}
      />
    </Link>
  );
}