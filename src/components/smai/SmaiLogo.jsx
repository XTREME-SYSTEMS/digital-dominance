import React from "react";

export default function SmaiLogo({ size = 64, className = "" }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 rounded-full border-2 border-[#00D4FF]/50"
        style={{ boxShadow: "0 0 30px rgba(0,212,255,0.4), inset 0 0 20px rgba(0,212,255,0.1)" }}
      />
      <div className="absolute inset-1.5 rounded-full border border-[#00D4FF]/20" />
      <span
        className="relative font-black bg-gradient-to-b from-white via-gray-300 to-gray-600 bg-clip-text text-transparent"
        style={{ fontSize: size * 0.45, letterSpacing: "-0.05em" }}
      >
        S
      </span>
    </div>
  );
}