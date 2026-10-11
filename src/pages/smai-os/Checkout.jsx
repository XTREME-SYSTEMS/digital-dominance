import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Check, Shield, Zap, Crown, ArrowRight, Loader2 } from "lucide-react";

// SMAI Checkout — Marketing site payment page.
// Client pays a deposit, then receives temp credentials to access the portal.
export default function Checkout() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");
  const [selected, setSelected] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const PLANS = [
    {
      name: "Discovery Deposit",
      price: "$500",
      desc: "Initial deposit to start your Digital Dominance journey. Includes 101 logo concepts, strategy generation, and full onboarding.",
      icon: Zap,
      productId: "smai-deposit",
      features: ["101 AI Logo Concepts", "Business Strategy Generation", "Skip Trace Research", "Full Onboarding Portal", "Eden Skye AI Guide"],
    },
    {
      name: "Growth Package",
      price: "$2,500",
      desc: "Full website build + deployment. Everything in Discovery plus a complete custom website deployed to your domain.",
      icon: Crown,
      productId: "smai-growth",
      features: ["Everything in Discovery", "Custom Website Build", "Vercel Deployment", "Google Sync", "100% Validation Checklist", "Brand Pack + Web Pack"],
    },
    {
      name: "Dominance System",
      price: "$5,000",
      desc: "Complete digital dominance. Website + social media automation + programmatic SEO + ongoing AI management.",
      icon: Shield,
      productId: "smai-dominance",
      features: ["Everything in Growth", "30-Day Social Calendar", "30 AI Videos", "Programmatic SEO (50+ pages)", "Ongoing AI Agent Management", "Monthly Strategy Reports"],
    },
  ];

  const handleSubscribe = async () => {
    const plan = PLANS[selected];
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("create-checkout", { productId: plan.productId });
      if (res.data?.redirectUrl) {
        window.location.href = res.data.redirectUrl;
      } else {
        setError("Failed to create checkout session. Please try again.");
      }
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Checkout failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#03070d] to-[#0a0a0a] text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-stone-800">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#00D4FF] to-[#0040CC]" />
          <span className="font-bold text-sm">Strategic Minds AI</span>
        </Link>
        <Link to="/smai/onboarding" className="text-xs text-stone-400 hover:text-[#00D4FF] transition">Already have access? Sign in →</Link>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Status banners */}
        {status === "success" && (
          <div className="mb-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-4 text-center">
            <Check className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
            <p className="font-bold text-emerald-400">Deposit received! Check your email for temporary credentials.</p>
            <p className="text-sm text-stone-400 mt-1">Sign in to start your onboarding with Eden Skye.</p>
          </div>
        )}
        {status === "canceled" && (
          <div className="mb-8 rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-center">
            <p className="font-bold text-red-400">Checkout was canceled. You can try again anytime.</p>
          </div>
        )}

        {/* Heading */}
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#00D4FF] mb-3">Start Your Journey</p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Choose Your Digital Dominance Package</h1>
          <p className="text-stone-400 max-w-2xl mx-auto">Pay your deposit to unlock the full Strategic Minds AI onboarding portal. Eden Skye will guide you through every step.</p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {PLANS.map((plan, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`relative text-left rounded-2xl border-2 p-6 transition-all ${
                selected === i
                  ? "border-[#00D4FF] bg-[#00D4FF]/5 shadow-[0_0_30px_rgba(0,212,255,0.15)]"
                  : "border-stone-800 bg-stone-900/30 hover:border-stone-600"
              }`}
            >
              {selected === i && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#00D4FF] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
                  Selected
                </div>
              )}
              <plan.icon className={`h-8 w-8 mb-3 ${selected === i ? "text-[#00D4FF]" : "text-stone-500"}`} />
              <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
              <p className="text-2xl font-bold mb-2">{plan.price}</p>
              <p className="text-xs text-stone-400 mb-4">{plan.desc}</p>
              <ul className="space-y-1.5">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs text-stone-300">
                    <Check className="h-3.5 w-3.5 text-[#00D4FF] shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        {/* Checkout button */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-[#00D4FF] px-8 py-3 text-base font-bold text-black disabled:opacity-50 hover:bg-[#00D4FF]/80 transition shadow-[0_0_30px_rgba(0,212,255,0.3)]"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
            {loading ? "Processing..." : `Pay ${PLANS[selected].price} & Start`}
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <p className="text-[10px] text-stone-500">Secure checkout via Base44 Payments. You'll receive temporary credentials by email after payment.</p>
        </div>
      </main>
    </div>
  );
}