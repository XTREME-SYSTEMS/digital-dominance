import React from "react";

const INDUSTRIES = [
  { name: "Legal", img: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=350&q=80&fit=crop" },
  { name: "Real Estate", img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=350&q=80&fit=crop" },
  { name: "Epoxy Flooring", img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=350&q=80&fit=crop" },
  { name: "Roofing", img: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=350&q=80&fit=crop" },
  { name: "HVAC", img: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=350&q=80&fit=crop" },
  { name: "Plumbing", img: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=350&q=80&fit=crop" },
  { name: "Electrical", img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=350&q=80&fit=crop" },
  { name: "Med Spa", img: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=350&q=80&fit=crop" },
  { name: "Dental", img: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=350&q=80&fit=crop" },
  { name: "Chiropractic", img: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=350&q=80&fit=crop" },
  { name: "Remodeling", img: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=350&q=80&fit=crop" },
  { name: "Landscaping", img: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=350&q=80&fit=crop" },
  { name: "Solar", img: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=350&q=80&fit=crop" },
  { name: "Pest Control", img: "https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?w=350&q=80&fit=crop" },
  { name: "Moving", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=350&q=80&fit=crop" },
  { name: "Auto Detailing", img: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=350&q=80&fit=crop" },
  { name: "Restaurants", img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=350&q=80&fit=crop" },
  { name: "Insurance", img: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=350&q=80&fit=crop" },
  { name: "Mortgage", img: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=350&q=80&fit=crop" },
  { name: "Cleaning Services", img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=350&q=80&fit=crop" },
];

export default function IndustriesGrid({ onSelect, workspace = false }) {
  return (
    <section id="industries" className={workspace ? "rounded-2xl border border-border bg-card p-5 sm:p-6" : "bg-white py-16 md:py-24"}>
      <div className={workspace ? "w-full" : "max-w-7xl mx-auto px-4 md:px-8"}>
        <div className={workspace ? "mb-6" : "text-center mb-12"}>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00a2ff] mb-2">OUR SOLUTIONS</p>
          <h2 className={workspace ? "mb-3 font-heading text-2xl font-extrabold text-foreground" : "text-3xl md:text-4xl font-black text-[#0a1220] mb-3"}>Top 20 Industries</h2>
          <p className={workspace ? "max-w-xl text-sm text-muted-foreground" : "text-[#6b7280] max-w-xl mx-auto"}>Explore designs for high-value industries. Choose an industry to view available templates.</p>
          <a href="#templates" className="inline-block mt-3 text-sm font-bold text-[#00a2ff] hover:underline">Explore Templates →</a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {INDUSTRIES.map((ind) => (
            <button
              key={ind.name}
              onClick={() => onSelect?.(ind.name)}
              className={workspace ? "group relative aspect-[4/3] overflow-hidden rounded-2xl border border-border transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" : "group relative overflow-hidden rounded-2xl border border-gray-200 aspect-[4/3] transition hover:border-[#00a2ff] hover:shadow-lg"}
            >
              <img src={ind.img} alt={ind.name} className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1220]/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-3">
                <span className="text-sm font-bold text-white">{ind.name}</span>
                <span className="text-[#00a2ff] text-lg">➜</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}