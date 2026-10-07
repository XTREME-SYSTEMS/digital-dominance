import React from "react";
import { Image } from "@/components/ui/image";

export default function SystemCard({ system }) {
  return (
    <div className="flex flex-col bg-white border border-stone-200 rounded-lg overflow-hidden hover:border-[#D4A92E] hover:shadow-lg transition">
      {/* Number + Title */}
      <div className="flex items-center gap-2 p-3">
        <div className="w-9 h-9 rounded-lg xps-gold-bg grid place-items-center text-black font-black text-base shrink-0">
          {system.num}
        </div>
        <h3 className="xps-gold-text font-bold text-xs uppercase leading-tight">{system.title}</h3>
      </div>

      {/* Image */}
      <div className="relative h-28 overflow-hidden border-y border-stone-200">
        <Image src={system.image} alt={system.title} className="w-full h-full" fittingType="fill" />
      </div>

      {/* Description */}
      <p className="text-black text-xs leading-relaxed p-3">{system.description}</p>

      {/* Specs */}
      <div className="px-3 pb-2 space-y-1.5">
        {system.specs.map((spec, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-black">
            <spec.icon className="h-3.5 w-3.5 text-stone-700 shrink-0" />
            <span>{spec.label}</span>
          </div>
        ))}
      </div>

      {/* Where it works */}
      <div className="px-3 pb-3 mt-auto">
        <div className="xps-gold-text text-[10px] font-bold uppercase tracking-wider mb-2">Where It Works</div>
        <div className="grid grid-cols-2 gap-1.5">
          {system.locations.map((loc, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-black">
              <loc.icon className="h-3 w-3 text-stone-700 shrink-0" />
              <span className="truncate">{loc.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}