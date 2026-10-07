import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Loader2, Trophy, TrendingUp, TrendingDown, CheckCircle2, XCircle } from "lucide-react";

export default function TestResults({ test, onBack }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke("abTestEngine", { action: "results", test_id: test.id });
        setResults(res.data || res);
      } catch (e) {
        setResults({ error: e.message });
      }
      setLoading(false);
    })();
  }, [test.id]);

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-stone-400" /></div>;
  }

  const m = results?.metrics || {};
  const t = results?.test || test;
  const winnerLabel = m.winner === "a" ? t.variant_a_label || "Variant A" : m.winner === "b" ? t.variant_b_label || "Variant B" : null;

  const renderVariant = (variant) => {
    const isWinner = m.winner === variant;
    const label = variant === "a" ? t.variant_a_label || "Variant A" : t.variant_b_label || "Variant B";
    const cr = variant === "a" ? m.cr_a : m.cr_b;
    const conv = variant === "a" ? t.conversions_a : t.conversions_b;
    const imp = variant === "a" ? t.impressions_a : t.impressions_b;
    const share = variant === "a" ? t.traffic_split : 100 - t.traffic_split;
    const headline = variant === "a" ? t.variant_a_headline : t.variant_b_headline;
    const cta = variant === "a" ? t.variant_a_cta_text : t.variant_b_cta_text;

    return (
      <div key={variant} className={`rounded-xl border p-4 ${isWinner ? "border-green-400 bg-green-50" : "border-stone-200 bg-white"}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-stone-900">{label}</h3>
          {isWinner && <CheckCircle2 className="h-5 w-5 text-green-600" />}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-white border border-stone-100 p-3 text-center">
            <div className="text-2xl font-black text-stone-900">{cr?.toFixed(1) || "0.0"}%</div>
            <div className="text-xs text-stone-500">Conversion Rate</div>
          </div>
          <div className="rounded-lg bg-white border border-stone-100 p-3 text-center">
            <div className="text-2xl font-black text-stone-900">{conv || 0}</div>
            <div className="text-xs text-stone-500">Conversions</div>
          </div>
          <div className="rounded-lg bg-white border border-stone-100 p-3 text-center">
            <div className="text-2xl font-black text-stone-900">{imp || 0}</div>
            <div className="text-xs text-stone-500">Impressions</div>
          </div>
          <div className="rounded-lg bg-white border border-stone-100 p-3 text-center">
            <div className="text-2xl font-black text-stone-900">{share}%</div>
            <div className="text-xs text-stone-500">Traffic Share</div>
          </div>
        </div>
        <div className="mt-3 space-y-1 text-xs text-stone-500">
          {headline && <div><span className="font-bold">Headline:</span> {headline}</div>}
          {cta && <div><span className="font-bold">CTA:</span> {cta}</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-stone-100 transition">
          <ArrowLeft className="h-5 w-5 text-stone-600" />
        </button>
        <div>
          <h2 className="text-lg font-black text-stone-900">{t.name}</h2>
          <p className="text-xs text-stone-500">
            <span className="font-mono">{t.page_path}</span> · {t.status} · converts on <span className="font-mono">{t.conversion_event}</span>
          </p>
        </div>
      </div>

      {winnerLabel && (
        <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 p-4 text-stone-950">
          <Trophy className="h-8 w-8" />
          <div>
            <div className="font-black text-lg">Winner: {winnerLabel}</div>
            <div className="text-sm">Statistically significant at p &lt; 0.05 (p = {m.p_value?.toFixed(4)})</div>
          </div>
        </div>
      )}
      {!winnerLabel && (t.impressions_a || 0) + (t.impressions_b || 0) > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-stone-100 p-3 text-sm text-stone-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Test in progress — {m.significant ? "Significance reached!" : "collecting data for statistical significance"}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderVariant("a")}
        {renderVariant("b")}
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
        <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wide">Statistical Analysis</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-stone-500">
              {m.lift >= 0 ? <TrendingUp className="h-3 w-3 text-green-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />} Lift
            </div>
            <div className={`text-xl font-black ${m.lift >= 0 ? "text-green-600" : "text-red-500"}`}>
              {m.lift >= 0 ? "+" : ""}{m.lift?.toFixed(1) || 0}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-stone-500">Z-Score</div>
            <div className="text-xl font-black text-stone-900">{m.z_score?.toFixed(2) || "0.00"}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-stone-500">P-Value</div>
            <div className="text-xl font-black text-stone-900">{m.p_value?.toFixed(4) || "1.0000"}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {m.significant ? (
            <><CheckCircle2 className="h-4 w-4 text-green-600" /><span className="text-green-700 font-bold">Significant — variant {m.winner?.toUpperCase()} wins</span></>
          ) : (
            <><XCircle className="h-4 w-4 text-stone-400" /><span className="text-stone-500">Not yet significant — keep collecting data (need ~30+ conversions per variant)</span></>
          )}
        </div>
      </div>
    </div>
  );
}