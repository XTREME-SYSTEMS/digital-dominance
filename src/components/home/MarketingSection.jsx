import React, { useState, useEffect } from "react";
import { Droplets, ShieldCheck, Flame, Clock, Sparkles, Award, MapPin, Store, Star } from "lucide-react";

const highlights = [
  { icon: MapPin, label: "70+ locations" },
  { icon: Droplets, label: "Stain & oil resistant" },
  { icon: ShieldCheck, label: "Crack & moisture sealed" },
  { icon: Flame, label: "Hot-tire resistant" },
  { icon: Clock, label: "Installation time varies by floor" },
  { icon: Sparkles, label: "Easy to clean" },
  { icon: Store, label: "Trust national retailers" }
];

const POWER_TEXT = "Backed by Xtreme Polishing Systems";

// Black band highlighting the key benefits of an epoxy garage floor,
// with a prominent power statement above it (typewriter animated).
export default function MarketingSection() {
  const [typed, setTyped] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setTyped(POWER_TEXT.slice(0, i));
      if (i >= POWER_TEXT.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, 55);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="bg-stone-950 text-white">
      {/* Power statement banner */}
      <div className="border-b border-amber-500/40 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 py-5 px-6">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-2 text-center">
          <div className="flex items-center justify-center gap-4 text-center">
            <Star className="h-6 w-6 text-amber-400 shrink-0 fill-amber-400" strokeWidth={2.2} style={{ marginRight: "6px" }} />
            <span
              className="font-extrabold uppercase tracking-tight leading-none"
              style={{
                fontSize: "clamp(1.1rem, 2.4vw, 1.9rem)",
                color: "#FFD700",
                WebkitTextStroke: "0.5px #000",
                textShadow: "0 2px 8px rgba(0,0,0,0.6), 0 0 1px #ffffff"
              }}
            >
              <span style={{ border: "1px solid rgba(255,255,255,0.85)", borderRadius: "8px", padding: "6px 14px", display: "inline-flex", alignItems: "center", gap: "10px" }}>
                {typed}
                <span
                  className="inline-block"
                  style={{
                    width: "2px",
                    height: "1em",
                    background: "#FFD700",
                    marginLeft: "2px",
                    verticalAlign: "text-bottom",
                    opacity: done ? 0 : 1,
                    animation: done ? "none" : "vx-caret 0.7s step-end infinite"
                  }}
                />
              </span>
            </span>
            <Star className="h-6 w-6 text-amber-400 shrink-0 fill-amber-400" strokeWidth={2.2} style={{ marginLeft: "6px" }} />
          </div>
        </div>
      </div>

      {/* Benefits band */}
      <div className="py-8 px-6 border-b border-stone-800">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
          {highlights.map((h) => (
            <div key={h.label} className="flex items-center gap-2.5">
              <h.icon className="h-5 w-5 text-amber-400 shrink-0" />
              <span className="text-sm font-medium text-stone-200">{h.label}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes vx-caret { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </section>
  );
}