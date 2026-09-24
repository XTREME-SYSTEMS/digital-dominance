import React from "react";
import { Link } from "react-router-dom";
import { trackEvent } from "@/lib/tracking";

export default function FinalCta({ settings }) {
  return (
    <section className="bg-white py-16 px-6 border-t border-stone-200">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-black">Ready to see your garage floor cost?</h2>
        <p className="mt-3 text-black/70">It takes about 60 seconds. No obligation, no phone call required.</p>
        <Link to="/funnel" onClick={() => trackEvent("funnel_cta_clicked", { location: "home_final" })} className="mt-8 inline-flex h-16 px-10 items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-400 transition text-stone-950 text-base font-bold tracking-wide shadow-lg shadow-amber-500/30">
          GET MY FREE ESTIMATE
        </Link>
        <p className="mt-3 text-sm text-black/60">Free estimate • No obligation • Takes about 60 seconds</p>
      </div>
    </section>
  );
}