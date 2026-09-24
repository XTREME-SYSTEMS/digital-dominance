import React, { useEffect, useState } from "react";
import { Search, MapPin, Home, Ruler, CheckCircle2, Loader2 } from "lucide-react";
import { Image } from "@/components/ui/image";
import { XTREME_AI_ICON_URL } from "@/components/Logo";

const STEPS = [
  { icon: Search, label: "Searching public property records…", duration: 1200 },
  { icon: MapPin, label: "Locating parcel boundaries…", duration: 1000 },
  { icon: Home, label: "Detecting garage footprint…", duration: 1100 },
  { icon: Ruler, label: "Calculating garage square footage…", duration: 900 }
];

const withTimeout = (p, ms) =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);

export default function ScrapeProgress({ address, lookup, onComplete }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [finalizing, setFinalizing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [lookupResult, setLookupResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let elapsed = 0;
    const animTotal = STEPS.reduce((s, st) => s + st.duration, 0);

    const finish = async () => {
      // Wait for the real records lookup to resolve before declaring done.
      let result = null;
      try {
        result = lookup ? await withTimeout(lookup, 12000) : null;
      } catch {
        result = null;
      }
      if (cancelled) return;
      setLookupResult(result);
      try {
        await onComplete?.(result);
        if (!cancelled) { setDone(true); setProgress(100); }
      } catch {
        if (!cancelled) { setFinalizing(false); setError("We couldn't save your estimate. Please try again."); }
      }
    };

    const run = (i) => {
      if (cancelled) return;
      if (i >= STEPS.length) {
        setProgress(95);
        setFinalizing(true);
        finish();
        return;
      }
      setStepIdx(i);
      const start = elapsed;
      const stepEnd = start + STEPS[i].duration;
      const tick = setInterval(() => {
        if (cancelled) return;
        elapsed += 50;
        setProgress(Math.min(95, (elapsed / animTotal) * 95));
        if (elapsed >= stepEnd) {
          clearInterval(tick);
          run(i + 1);
        }
      }, 50);
    };
    run(0);
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-950 px-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4" style={{ width: 96, height: 96 }}>
            <Image src={XTREME_AI_ICON_URL} alt="Xtreme AI Systems" className="w-full h-full" fittingType="fit" />
          </div>
          <h2 className="text-2xl font-semibold text-white">Preparing your estimate</h2>
          <p className="mt-2 text-stone-400 text-sm truncate">{address}</p>
        </div>

        <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden mb-8">
          <div className="h-full bg-amber-500 transition-all duration-100" style={{ width: `${progress}%` }} />
        </div>

        <div className="space-y-3">
          {STEPS.map((s, i) => {
            const stepDone = done || i < stepIdx || (finalizing && i === stepIdx);
            const active = i === stepIdx && !finalizing && !done;
            return (
              <div key={i} className={`flex items-center gap-3 transition ${stepDone || active ? "opacity-100" : "opacity-30"}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${stepDone ? "bg-green-500/20" : active ? "bg-amber-500/20" : "bg-stone-800"}`}>
                  {stepDone ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <s.icon className={`h-4 w-4 ${active ? "text-amber-500" : "text-stone-500"}`} />}
                </div>
                <span className={`text-sm ${stepDone ? "text-stone-400" : active ? "text-white font-medium" : "text-stone-500"}`}>
                  {s.label}
                  {active && <span className="ml-1 inline-flex"><span className="animate-pulse">.</span><span className="animate-pulse" style={{ animationDelay: "0.2s" }}>.</span><span className="animate-pulse" style={{ animationDelay: "0.4s" }}>.</span></span>}
                </span>
              </div>
            );
          })}

          {/* Finalizing: shown while we wait for the real records lookup */}
          {finalizing && !done && !error && (
            <div className="flex items-center gap-3 opacity-100">
              <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 bg-amber-500/20">
                <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
              </div>
              <span className="text-sm text-white font-medium">Finalizing your estimate…</span>
            </div>
          )}

          {error && <div role="alert" className="rounded-lg border border-red-400 p-4 text-sm text-white">
            <p>{error}</p>
            <button className="mt-3 rounded-lg bg-amber-500 px-4 py-2 font-semibold text-stone-950" onClick={async () => {
              setError(""); setFinalizing(true);
              try { await onComplete?.(lookupResult); } catch { setFinalizing(false); setError("We couldn't save your estimate. Please try again."); }
            }}>Try again</button>
          </div>}
          {/* Complete: only once the lookup has resolved */}
          {done && (
            <div className="flex items-center gap-3 opacity-100">
              <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 bg-green-500/20">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
              </div>
              <span className="text-sm text-stone-400">Lookup complete!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}