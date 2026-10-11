import React from "react";
import { Link } from "react-router-dom";
import SmaiLogo from "./SmaiLogo";

export default function SmaiHeader() {
  return (
    <div className="relative z-20 flex flex-col items-center pt-6 sm:pt-8 pb-4">
      <Link to="/" className="absolute left-4 top-4 text-white/40 hover:text-white text-[10px] font-bold uppercase tracking-widest transition">
        ← Home
      </Link>
      <SmaiLogo size={52} />
      <h1 className="mt-3 text-base sm:text-lg font-black tracking-[0.15em] text-white">STRATEGIC MINDS AI</h1>
      <div className="flex items-center gap-3 mt-1.5">
        <div className="h-px w-8 bg-gradient-to-r from-transparent to-[#00D4FF]/50" />
        <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.3em] text-white/40">
          Intelligence In Motion
        </span>
        <div className="h-px w-8 bg-gradient-to-l from-transparent to-[#00D4FF]/50" />
      </div>
    </div>
  );
}