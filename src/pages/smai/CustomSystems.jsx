import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const BG_IMAGE =
  "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/5220e56a5_FACEBOOKIMAGE4.png";

export default function CustomSystems() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      <img src={BG_IMAGE} alt="Custom AI Systems & Automation" className="absolute inset-0 w-full h-full object-cover" />

      <Link
        to="/"
        className="absolute left-4 top-4 z-10 text-white/50 hover:text-white text-[10px] font-bold uppercase tracking-widest transition backdrop-blur-sm rounded-full bg-black/30 px-3 py-1.5 border border-white/10"
      >
        ← Home
      </Link>

      <Link
        to="/admin"
        className="group absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-10 inline-flex items-center gap-3 rounded-full border-2 border-[#00D4FF] bg-[#00D4FF]/10 backdrop-blur-md px-6 py-3 shadow-[0_0_30px_rgba(0,212,255,0.5)] transition hover:bg-[#00D4FF]/20"
      >
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-white">
          Build Smarter. <span className="text-[#00D4FF]">Grow Faster.</span>
        </span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00D4FF] text-black transition group-hover:translate-x-1">
          <ArrowRight className="h-4 w-4" />
        </span>
      </Link>
    </div>
  );
}