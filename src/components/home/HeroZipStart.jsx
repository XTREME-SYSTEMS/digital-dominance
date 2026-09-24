import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calculator } from "lucide-react";
import { trackEvent } from "@/lib/tracking";

export default function HeroZipStart() {
  const navigate = useNavigate();
  const [zip, setZip] = useState("");
  function start(e) {
    e.preventDefault();
    trackEvent("funnel_cta_clicked", { location: "home_hero" });
    navigate(zip ? `/funnel?zip=${encodeURIComponent(zip)}` : "/funnel");
  }
  return <form onSubmit={start} className="mt-6 md:mt-8 max-w-xl">
    <label htmlFor="hero-zip" className="block text-sm font-semibold text-white drop-shadow-md">Start with your ZIP code <span className="font-normal text-white/80">(optional)</span></label>
    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
      <input id="hero-zip" inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{5}" maxLength={5} placeholder="Enter ZIP code" value={zip} onChange={e => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))} className="h-14 w-full sm:w-44 rounded-xl border border-white/80 bg-white px-4 text-base text-stone-950 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-400" />
      <button type="submit" className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-xl border border-white/80 bg-amber-500 px-6 text-base font-bold text-stone-950 shadow-lg hover:bg-amber-400"><Calculator className="h-5 w-5" /> See my price range</button>
    </div>
    <p className="mt-2 text-xs text-white/90 drop-shadow-md">We’ll ask for your address next to prepare a preliminary estimate. No obligation.</p>
  </form>;
}