import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ResponsiveImageBackground from "@/components/responsive-image/ResponsiveImageBackground";

const BG_IMAGE =
  "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/5220e56a5_FACEBOOKIMAGE4.png";

// AI-optimized via Vercel AI Gateway (openai/gpt-5.4 vision analysis)
const RESPONSIVE_CONFIG = {
  focal_point_x: 0.5,
  focal_point_y: 0.46,
  object_position_desktop: "center center",
  object_position_mobile: "center 32%",
  treatment_desktop: "cover",
  treatment_mobile: "cover",
  bg_color: "#04070d",
  scale_desktop: 1.0,
  scale_mobile: 1.2,
};

export default function CustomSystems() {
  return (
    <ResponsiveImageBackground image_url={BG_IMAGE} config={RESPONSIVE_CONFIG} alt="Custom AI Systems & Automation">
      <Link to="/" className="absolute left-4 top-4 z-10 text-white/50 hover:text-white text-[10px] font-bold uppercase tracking-widest transition backdrop-blur-sm rounded-full bg-black/30 px-3 py-1.5 border border-white/10">
        ← Home
      </Link>
      <Link to="/admin" className="group absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-10 inline-flex items-center gap-3 rounded-full border-2 border-[#00D4FF] bg-[#00D4FF]/10 backdrop-blur-md px-6 py-3 shadow-[0_0_30px_rgba(0,212,255,0.5)] transition hover:bg-[#00D4FF]/20">
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-white">
          Build Smarter. <span className="text-[#00D4FF]">Grow Faster.</span>
        </span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00D4FF] text-black transition group-hover:translate-x-1">
          <ArrowRight className="h-4 w-4" />
        </span>
      </Link>
    </ResponsiveImageBackground>
  );
}