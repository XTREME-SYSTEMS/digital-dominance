import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";

// Fallback templates — used only if the TemplateLibrary entity has no active records.
const FALLBACK_TEMPLATES = [
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

// Map a TemplateLibrary record to the card shape this component renders.
const mapRecord = (r) => ({
  id: r.id,
  badge: r.niche ? `${r.niche} Template` : "Website Template",
  title: r.name,
  subtitle: r.description || "Professionally structured website concept",
  cta: "Preview →",
  img: r.preview_image_url || "https://images.unsplash.com/photo-1460925895917-afdab827c853?w=600&q=80&fit=crop",
  industry: r.category || "Website",
  tags: r.tags || [],
});

export default function TemplatesShowcase({ onChoose, workspace = false }) {
  const [preview, setPreview] = useState(null);
  const [templates, setTemplates] = useState(null); // null = loading, [] = loaded empty

  useEffect(() => {
    let alive = true;
    base44.entities.TemplateLibrary.filter(
      { is_active: true, status: "active" },
      { sort: "sort_order", limit: 12, fields: ["name", "slug", "category", "niche", "description", "preview_image_url", "tags", "sort_order"] }
    )
      .then((page) => {
        if (!alive) return;
        const items = (page && page.items) || [];
        setTemplates(items.length > 0 ? items.map(mapRecord) : FALLBACK_TEMPLATES);
      })
      .catch(() => { if (alive) setTemplates(FALLBACK_TEMPLATES); });
    return () => { alive = false; };
  }, []);

  const list = templates || FALLBACK_TEMPLATES;

  return (
    <section id="templates" className={workspace ? "rounded-2xl border border-border bg-card p-5 sm:p-6" : "bg-gray-50 py-16 md:py-24"}>
      <div className={workspace ? "w-full" : "max-w-7xl mx-auto px-4 md:px-8"}>
        <div className={workspace ? "mb-6" : "text-center mb-12"}>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00a2ff] mb-2">WEBSITE TEMPLATES</p>
          <h2 className={workspace ? "mb-3 font-heading text-2xl font-extrabold text-foreground" : "text-3xl md:text-4xl font-black text-[#0a1220] mb-3"}>Explore Templates</h2>
          <p className={workspace ? "max-w-xl text-sm text-muted-foreground" : "text-[#6b7280] max-w-xl mx-auto"}>Choose a template and scroll through the full website prototype.</p>
          <Link to={workspace ? "/admin/templates" : "/templates"} className="inline-block mt-3 text-sm font-bold text-[#00a2ff] hover:underline">View All Templates →</Link>
        </div>

        {templates === null ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#00a2ff]" /></div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map((t) => (
              <div key={t.id} className={workspace ? "overflow-hidden rounded-2xl border border-border bg-background" : "overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-xl"}>
                <button type="button" aria-label={`Preview ${t.badge}`} className="relative block h-48 w-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset" onClick={() => setPreview(t)}>
                  <img src={t.img} alt={t.badge} className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a1220]/70 to-transparent" />
                  <span className="absolute top-3 left-3 rounded-full bg-[#00a2ff] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Design Preview</span>
                </button>
                <div className="p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#00a2ff] mb-1">{t.industry} · Contact</p>
                  <h3 className={workspace ? "mb-1 font-heading text-lg font-extrabold text-foreground" : "text-lg font-black text-[#0a1220] mb-1"}>{t.title}</h3>
                  <p className={workspace ? "mb-3 text-sm text-muted-foreground" : "text-sm text-[#6b7280] mb-3"}>{t.subtitle}</p>
                  <div className="flex items-center justify-between">
                    <span className={workspace ? "rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground" : "rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700"}>{t.badge}</span>
                    <button onClick={() => onChoose?.(t) || setPreview(t)} className="text-sm font-bold text-[#00a2ff] hover:underline">Preview →</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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