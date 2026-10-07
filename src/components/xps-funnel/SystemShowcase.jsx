import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const SYSTEMS = [
  {
    title: "Broadcast Flake",
    desc: "Textured, slip-resistant — hides imperfections",
    image: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/2ddeba0a6_image.png",
    price: "$$",
  },
  {
    title: "Metallic Epoxy",
    desc: "3D pearlescent finish for showrooms & lobbies",
    image: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/955b67c0f_images.jpg",
    price: "$$$",
  },
  {
    title: "Solid Color",
    desc: "Clean, uniform finish for garages & basements",
    image: "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/76835d4ad_IMG_1593-min.webp",
    price: "$",
  },
];

export default function SystemShowcase() {
  return (
    <section className="empire-page-bg py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 empire-fade-in">
          <div className="empire-label mb-2">A System For Every Customer</div>
          <h2 className="text-3xl md:text-5xl font-black text-stone-900 uppercase tracking-tight">
            Find Your Perfect <span className="empire-gold-text">Floor System</span>
          </h2>
          <p className="text-stone-500 mt-3 max-w-xl mx-auto">
            From budget-friendly solids to premium metallics — we have the right system for your space and budget.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SYSTEMS.map((s, i) => (
            <div
              key={i}
              className="empire-card group overflow-hidden"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={s.image}
                  alt={s.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                />
                <div className="absolute top-3 right-3 empire-btn-gold text-xs font-black" style={{ padding: "4px 12px" }}>
                  {s.price}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-black text-stone-900 text-lg">{s.title}</h3>
                <p className="text-sm text-stone-500 mt-1">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>


      </div>
    </section>
  );
}