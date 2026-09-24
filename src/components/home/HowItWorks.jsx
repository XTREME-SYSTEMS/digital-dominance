import React from "react";

const steps = [
  { n: "01", t: "Start with your address", d: "Add your ZIP and property address so we can check available property data for your garage size." },
  { n: "02", t: "Choose your finish", d: "Tell us about your concrete. Browse colors and optionally upload a photo to preview your floor." },
  { n: "03", t: "See a preliminary range", d: "Get an estimated price range based on the details available, not a guaranteed final quote." },
  { n: "04", t: "Confirm with a specialist", d: "A specialist reviews your floor and confirms the scope and final price before any work begins." }
];

export default function HowItWorks() {
  return (
    <section className="bg-white py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-stone-900">How it works</h2>
        <div className="mt-12 grid gap-8 md:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="border-t border-stone-200 pt-5">
              <div className="text-amber-500 font-mono text-sm font-bold">{s.n}</div>
              <h3 className="mt-3 font-semibold text-lg text-stone-900">{s.t}</h3>
              <p className="mt-2 text-stone-500 leading-relaxed text-sm">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}