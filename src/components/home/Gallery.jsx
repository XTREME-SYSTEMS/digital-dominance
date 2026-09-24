import React from "react";
import { Image } from "@/components/ui/image";

export default function Gallery({ items = [] }) {
  if (!items.length) return null;
  return (
    <section id="gallery" className="bg-stone-100 py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-stone-900">Floor inspiration</h2>
        <p className="mt-3 text-stone-500">Explore finish ideas. Concept images are illustrations, not photos of completed projects.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {items.map((g, i) => (
            <figure key={i} className="rounded-2xl overflow-hidden bg-white shadow-sm">
              <div className="grid grid-cols-2">
                <div className="relative">
                  <Image src={g.before_url} alt="Floor before finish" className="block h-44 w-full" fittingType="fill" />
                  <span className="absolute top-2 left-2 text-[10px] font-bold tracking-widest bg-stone-900/80 text-white px-2 py-1 rounded">BEFORE</span>
                </div>
                <div className="relative">
                  <Image src={g.after_url} alt="Floor finish preview" className="block h-44 w-full" fittingType="fill" />
                  <span className="absolute top-2 left-2 text-[10px] font-bold tracking-widest bg-amber-500 text-stone-950 px-2 py-1 rounded">AFTER</span>
                </div>
              </div>
              <figcaption className="p-4 text-sm text-stone-600">{[g.before_url, g.after_url].some(url => url?.includes("generated_image")) ? "Illustrative floor finish concept" : g.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}