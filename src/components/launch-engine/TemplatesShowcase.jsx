import React, { useState } from "react";
import { X, Check } from "lucide-react";

const TEMPLATES = [
  {
    id: "legal-funnel",
    badge: "High-Call Legal Funnel",
    title: "Support when it matters",
    subtitle: "Professionally structured website concept",
    cta: "Request Consultation →",
    img: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80&fit=crop",
    industry: "Legal",
  },
  {
    id: "luxury-real-estate",
    badge: "Luxury Real Estate",
    title: "Find your next place",
    subtitle: "Professionally structured website concept",
    cta: "View Properties →",
    img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80&fit=crop",
    industry: "Real Estate",
  },
  {
    id: "contractor-lead",
    badge: "Contractor Lead Machine",
    title: "Quality built to last",
    subtitle: "Professionally structured website concept",
    cta: "Request Estimate →",
    img: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&q=80&fit=crop",
    industry: "Roofing",
  },
  {
    id: "hvac-pro",
    badge: "HVAC Service Pro",
    title: "Comfort all year long",
    subtitle: "Professionally structured website concept",
    cta: "Book Service →",
    img: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=600&q=80&fit=crop",
    industry: "HVAC",
  },
  {
    id: "med-spa",
    badge: "Med Spa Bookings",
    title: "Enhance your natural beauty",
    subtitle: "Professionally structured website concept",
    cta: "Book Consultation →",
    img: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80&fit=crop",
    industry: "Med Spa",
  },
  {
    id: "dental-growth",
    badge: "Dental Growth",
    title: "Healthy smiles, bright lives",
    subtitle: "Professionally structured website concept",
    cta: "Book Appointment →",
    img: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=600&q=80&fit=crop",
    industry: "Dental",
  },
];

export default function TemplatesShowcase({ onChoose }) {
  const [preview, setPreview] = useState(null);

  return (
    <section id="templates" className="bg-gray-50 py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00a2ff] mb-2">WEBSITE TEMPLATES</p>
          <h2 className="text-3xl md:text-4xl font-black text-[#0a1220] mb-3">Explore Templates</h2>
          <p className="text-[#6b7280] max-w-xl mx-auto">Choose a template and scroll through the full website prototype.</p>
          <button className="mt-3 text-sm font-bold text-[#00a2ff] hover:underline">View All Templates →</button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEMPLATES.map((t) => (
            <div key={t.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-xl">
              <div className="relative h-48 overflow-hidden cursor-pointer" onClick={() => setPreview(t)}>
                <img src={t.img} alt={t.badge} className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a1220]/70 to-transparent" />
                <span className="absolute top-3 left-3 rounded-full bg-[#00a2ff] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Design Preview</span>
              </div>
              <div className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#00a2ff] mb-1">{t.industry} · Contact</p>
                <h3 className="text-lg font-black text-[#0a1220] mb-1">{t.title}</h3>
                <p className="text-sm text-[#6b7280] mb-3">{t.subtitle}</p>
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700">{t.badge}</span>
                  <button onClick={() => onChoose?.(t)} className="text-sm font-bold text-[#00a2ff] hover:underline">Preview →</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {preview && <PreviewModal template={preview} onClose={() => setPreview(null)} onChoose={onChoose} />}
    </section>
  );
}

function PreviewModal({ template, onClose, onChoose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative max-w-3xl w-full rounded-2xl bg-white overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70">
          <X className="h-5 w-5" />
        </button>
        <div className="relative h-64 md:h-80 overflow-hidden">
          <img src={template.img} alt={template.badge} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a1220]/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <span className="rounded-full bg-[#00a2ff] px-3 py-1 text-[10px] font-bold uppercase text-white">{template.badge}</span>
            <h3 className="mt-2 text-2xl font-black text-white">{template.title}</h3>
          </div>
        </div>
        <div className="p-6">
          <p className="text-sm text-[#6b7280] mb-4">{template.subtitle}</p>
          <button onClick={() => { onChoose?.(template); onClose(); }} className="w-full rounded-xl bg-[#00a2ff] py-3 text-sm font-bold text-white hover:bg-[#0090e0]">
            Choose This Template →
          </button>
        </div>
      </div>
    </div>
  );
}