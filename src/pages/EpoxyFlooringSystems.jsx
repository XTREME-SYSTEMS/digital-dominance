import React from "react";
import {
  Droplets, Shield, Sun, MapPin, Ruler, DollarSign, Clock,
  Home, Wrench, Store, ShoppingBag, Scissors, UtensilsCrossed,
  Users, Building2, Factory, Truck, FlaskConical, Cog, Sparkles, Warehouse,
} from "lucide-react";
import { LOGO_URL } from "@/components/Logo";
import SystemCard from "@/components/epoxy-systems/SystemCard";

const SYSTEMS = [
  {
    num: 1,
    title: "Solid Color Coating",
    image: "https://images.unsplash.com/photo-1652305461546-bf0a76934433?w=400&h=250&fit=crop&q=80",
    description: "A single-color epoxy system delivering a clean, uniform finish. Ideal for homeowners seeking a sleek, modern look without decorative elements.",
    specs: [
      { icon: Ruler, label: "10-15 mils thick" },
      { icon: DollarSign, label: "$ Budget-friendly" },
      { icon: Clock, label: "5-7 year lifespan" },
    ],
    locations: [
      { icon: Home, label: "Garages" },
      { icon: Building2, label: "Basements" },
      { icon: Sun, label: "Patios" },
      { icon: Wrench, label: "Workshops" },
    ],
  },
  {
    num: 2,
    title: "Broadcast Flake System",
    image: "https://images.unsplash.com/photo-1486406146926-c690a1a3a3a3?w=400&h=250&fit=crop&q=80",
    description: "Decorative vinyl flakes broadcast into the epoxy for a textured, slip-resistant surface. Hides imperfections while adding visual interest.",
    specs: [
      { icon: Ruler, label: "20-30 mils thick" },
      { icon: DollarSign, label: "$$ Mid-range" },
      { icon: Clock, label: "7-10 year lifespan" },
    ],
    locations: [
      { icon: Home, label: "Garages" },
      { icon: Store, label: "Showrooms" },
      { icon: ShoppingBag, label: "Retail" },
      { icon: Scissors, label: "Salons" },
    ],
  },
  {
    num: 3,
    title: "Quartz Aggregate System",
    image: "https://images.unsplash.com/photo-1589109807644-924edf14ee09?w=400&h=250&fit=crop&q=80",
    description: "Colored quartz sand bonded with epoxy for a slip-resistant, highly durable surface. Combines safety with aesthetic appeal.",
    specs: [
      { icon: Ruler, label: "30-40 mils thick" },
      { icon: DollarSign, label: "$$$ Premium" },
      { icon: Clock, label: "10-15 year lifespan" },
    ],
    locations: [
      { icon: UtensilsCrossed, label: "Kitchens" },
      { icon: Users, label: "Locker Rooms" },
      { icon: Droplets, label: "Showers" },
      { icon: Building2, label: "Commercial" },
    ],
  },
  {
    num: 4,
    title: "Mortar System",
    image: "https://images.unsplash.com/photo-1771531072574-af6ed6b954c0?w=400&h=250&fit=crop&q=80",
    description: "Heavy-duty mortar system for high-traffic and impact resistance. Built to withstand forklifts, heavy machinery, and industrial wear.",
    specs: [
      { icon: Ruler, label: "60-125 mils thick" },
      { icon: DollarSign, label: "$$$$ Heavy-duty" },
      { icon: Clock, label: "15-20 year lifespan" },
    ],
    locations: [
      { icon: Warehouse, label: "Warehouses" },
      { icon: Factory, label: "Factories" },
      { icon: Truck, label: "Loading Docks" },
      { icon: Cog, label: "Industrial" },
    ],
  },
  {
    num: 5,
    title: "Chemical-Resistant System",
    image: "https://images.unsplash.com/photo-1772209415876-76ea6cbc2f0c?w=400&h=250&fit=crop&q=80",
    description: "Novolac epoxy formulation engineered for chemical and acid resistance. Protects substrates from spills, stains, and corrosion.",
    specs: [
      { icon: Ruler, label: "30-50 mils thick" },
      { icon: DollarSign, label: "$$$$ Industrial" },
      { icon: Clock, label: "10-15 year lifespan" },
    ],
    locations: [
      { icon: FlaskConical, label: "Labs" },
      { icon: Cog, label: "Manufacturing" },
      { icon: FlaskConical, label: "Chem Plants" },
      { icon: Home, label: "Garages" },
    ],
  },
  {
    num: 6,
    title: "Metallic Epoxy System",
    image: "https://images.unsplash.com/photo-1731481562702-0e94ce06ebb3?w=400&h=250&fit=crop&q=80",
    description: "Metallic pigments create a 3D, pearlescent finish that mimics natural stone. A premium decorative option for high-end spaces.",
    specs: [
      { icon: Ruler, label: "20-30 mils thick" },
      { icon: DollarSign, label: "$$$ Premium" },
      { icon: Clock, label: "10-15 year lifespan" },
    ],
    locations: [
      { icon: Store, label: "Showrooms" },
      { icon: Building2, label: "Lobbies" },
      { icon: UtensilsCrossed, label: "Restaurants" },
      { icon: Home, label: "Residential" },
    ],
  },
];

const FEATURES = [
  { icon: Droplets, label: "Moisture Resistant" },
  { icon: Shield, label: "Extremely Durable" },
  { icon: Sun, label: "UV Stable" },
  { icon: MapPin, label: "Built for Florida" },
];

const FOOTER_VALUES = [
  { icon: Shield, label: "Durable Protection" },
  { icon: Clock, label: "Long-Lasting Performance" },
  { icon: Sparkles, label: "Beautiful Results" },
];

export default function EpoxyFlooringSystems() {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b border-stone-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Xtreme Polishing Systems" className="h-12 w-12 object-contain" />
            <div>
              <div className="font-black text-lg xps-gold-text">Xtreme Polishing Systems</div>
              <div className="text-[10px] xps-gold-text font-bold uppercase tracking-widest">Local-First Concrete Platform</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex flex-col items-center gap-1 text-center">
                <f.icon className="h-6 w-6 text-stone-700" />
                <span className="text-[10px] text-stone-600 font-bold uppercase tracking-wide">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="max-w-7xl mx-auto text-center mt-6">
          <h1 className="text-3xl md:text-5xl font-black xps-gold-text uppercase tracking-tight">6 Epoxy Flooring Systems</h1>
          <p className="text-sm md:text-base xps-gold-text font-bold uppercase tracking-widest mt-2">Built for Every Space. Engineered for Florida.</p>
        </div>
      </header>

      {/* Main grid */}
      <main className="px-4 md:px-6 py-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {SYSTEMS.map((s) => (
            <SystemCard key={s.num} system={s} />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-stone-50 px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <MapPin className="h-10 w-10 text-stone-700" />
            <p className="text-black font-bold text-sm uppercase tracking-wide max-w-xs">
              Engineered for Florida's Heat, Humidity & Daily Wear
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-8">
            {FOOTER_VALUES.map((v, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <v.icon className="h-7 w-7 text-stone-700" />
                <span className="text-xs text-black font-bold uppercase tracking-wide">{v.label}</span>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}