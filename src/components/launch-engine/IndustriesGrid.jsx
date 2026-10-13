import React from "react";
import { Loader2 } from 'lucide-react';
import useStockTemplates from '@/components/template-studio/useStockTemplates';

export default function IndustriesGrid({ onSelect, workspace = false }) {
  const {items: industries, isLoading, error} = useStockTemplates({is_default:true},20);
  return (
    <section id="industries" className={workspace ? "rounded-2xl border border-border bg-card p-5 sm:p-6" : "bg-white py-16 md:py-24"}>
      <div className={workspace ? "w-full" : "max-w-7xl mx-auto px-4 md:px-8"}>
        <div className={workspace ? "mb-6" : "text-center mb-12"}>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00a2ff] mb-2">OUR SOLUTIONS</p>
          <h2 className={workspace ? "mb-3 font-heading text-2xl font-extrabold text-foreground" : "text-3xl md:text-4xl font-black text-[#0a1220] mb-3"}>20 Industry Categories</h2>
          <p className={workspace ? "max-w-xl text-sm text-muted-foreground" : "text-[#6b7280] max-w-xl mx-auto"}>Explore designs for high-value industries. Choose an industry to view available templates.</p>
          <a href="#templates" className="inline-block mt-3 text-sm font-bold text-[#00a2ff] hover:underline">Explore Templates →</a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {isLoading && <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading industry templates" />}
          {error && <p role="alert" className="col-span-full text-destructive">Unable to load industries: {error.message}</p>}
          {industries.map((ind) => (
            <button
              key={ind.id}
              onClick={() => onSelect?.(ind.niche)}
              className={workspace ? "group relative aspect-[4/3] overflow-hidden rounded-2xl border border-border transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" : "group relative overflow-hidden rounded-2xl border border-gray-200 aspect-[4/3] transition hover:border-[#00a2ff] hover:shadow-lg"}
            >
              <img src={ind.preview_image_url} alt={`${ind.niche}: ${ind.name}`} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1220]/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-3">
                <span className="text-sm font-bold text-white">{ind.niche}</span>
                <span className="text-[#00a2ff] text-lg">➜</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}