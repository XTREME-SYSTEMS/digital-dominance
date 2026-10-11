import React from "react";

export default function ServiceList({ services, className = "" }) {
  return (
    <div className={`flex flex-col gap-3 sm:gap-4 ${className}`}>
      {services.map((s, i) => (
        <div key={i} className="flex items-center gap-4 group">
          <div
            className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-[#00D4FF]/40 flex items-center justify-center shrink-0 transition group-hover:border-[#00D4FF] group-hover:shadow-[0_0_20px_rgba(0,212,255,0.3)]"
          >
            <s.icon className="w-5 h-5 text-[#00D4FF]" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white tracking-wide">{s.title}</h3>
            {s.desc && <p className="text-xs text-white/40 mt-0.5">{s.desc}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}