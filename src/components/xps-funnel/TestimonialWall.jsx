import React from "react";
import { Quote } from "lucide-react";

const REVIEWS = [
  {
    name: "Alan G.",
    role: "Homeowner · Pompano Beach, FL",
    text: "My garage went from embarrassing to the best room in the house. The flake system looks incredible and the crew was professional start to finish. Worth every penny.",
    rating: 5,
  },
  {
    name: "Danielle J.",
    role: "Business Owner · Tampa, FL",
    text: "We had XPS coat our 4,000 sq ft showroom with metallic epoxy. Customers literally stop and ask about the floor. It's been 3 years and still looks brand new.",
    rating: 5,
  },
  {
    name: "Mike R.",
    role: "Homeowner · Orlando, FL",
    text: "Got my estimate in 60 seconds, booked the next week. The team showed up on time, finished in one day, and the solid color coating is flawless. No more oil stains!",
    rating: 5,
  },
];

export default function TestimonialWall() {
  return (
    <section className="empire-page-bg py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10 empire-fade-in">
          <h2 className="text-3xl md:text-5xl font-black text-stone-900 uppercase tracking-tight">
            Loved by <span className="empire-gold-text">2,400+ Customers</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {REVIEWS.map((r, i) => (
            <div key={i} className="empire-card p-6">
              <Quote className="h-8 w-8 text-indigo-400 mb-3" />
              <p className="text-sm text-stone-700 leading-relaxed">"{r.text}"</p>
              <div className="border-t border-stone-100 pt-3 mt-4">
                <div className="font-black text-stone-900 text-sm">{r.name}</div>
                <div className="text-xs text-stone-500">{r.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}