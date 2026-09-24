import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import BeforeAfter from "@/components/funnel/BeforeAfter";

const BEFORE_URL = "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/2fa2f386d_generated_image.png";
const AFTER_URL = "https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/b2326e50a_generated_image.png";

export default function BeforeAfterShowcase() {
  return (
    <section className="bg-stone-50 py-20 md:py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-stone-900">
See what your garage could become
          </h2>
          <p className="mt-4 text-stone-600 max-w-2xl mx-auto">
Explore an example floor transformation, then use the visualizer to preview a finish in your own space. These are concept images, not completed customer projects.
          </p>
        </div>
        <BeforeAfter beforeUrl={BEFORE_URL} afterUrl={AFTER_URL} />
        <div className="mt-8 text-center">
          <Link
            to="/funnel"
            className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-xl bg-amber-500 hover:bg-amber-400 transition text-stone-950 text-base font-bold tracking-wide shadow-lg shadow-amber-500/30 animate-pop-bounce"
          >
            GET YOUR ESTIMATE <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}