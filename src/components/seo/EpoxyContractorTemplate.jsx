import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useSettings } from "@/lib/useSettings";
import { trackEvent } from "@/lib/tracking";
import { Phone, Clock, MapPin, ChevronRight, ArrowRight, Calculator, BadgeCheck, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import Nav from "@/components/home/Nav";
import ConsultationForm from "@/components/home/ConsultationForm";
import BeforeAfterShowcase from "@/components/home/BeforeAfterShowcase";
import FloorTypeGallery from "@/components/home/FloorTypeGallery";
import ApplicationSpaces from "@/components/home/ApplicationSpaces";
import FlakeShowcase from "@/components/home/FlakeShowcase";
import Gallery from "@/components/home/Gallery";
import WhoWeAre from "@/components/home/WhoWeAre";
import FAQ from "@/components/home/FAQ";
import FinalCta from "@/components/home/FinalCta";
import Footer from "@/components/home/Footer";

// A full, real epoxy contractor website rendered for any city.
// Reuses the production home-page sections (gallery, before/after, color
// charts, reviews, FAQ, estimate funnel) and layers in city-specific SEO
// content — so every city page is a functional contractor site, not a
// thin article.
export default function EpoxyContractorTemplate({ city, stateCode, stateName, seoConfig }) {
  const { settings } = useSettings();
  const cityState = `${city}, ${stateCode}`;
  const phone = settings.phone || "(833) 700-1239";
  const rating = settings.google_rating || 4.9;
  const reviewCount = settings.google_review_count || 187;

  useEffect(() => {
    trackEvent("page_view", { page: `/${stateCode}/${city}/` });
    document.title = seoConfig.title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", seoConfig.description);
    const canon = document.querySelector('link[rel="canonical"]');
    if (canon) canon.setAttribute("href", `https://epoxyquotenearme.com/${stateCode.toLowerCase()}/${slugifyCity(city)}/`);
  }, [city, stateCode, seoConfig]);

  return (
    <div className="bg-white">
      <Nav settings={settings} />

      {/* === City-specific hero — matches the main site Hero exactly === */}
      <section className="relative h-[82vh] min-h-[620px] bg-stone-950 overflow-hidden border-b-2 border-amber-500">
        <img
          src={settings.hero_image_url}
          alt={`Premium epoxy garage floor installation in ${city}, ${stateName}`}
          className="absolute inset-0 w-full h-full object-cover object-[center_75%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/85 via-stone-950/55 to-transparent" />
        <div className="absolute inset-0 flex items-start md:items-center pt-28 md:pt-24">
          <div className="w-full max-w-6xl mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-2xl">
              <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold mb-3">
                <MapPin className="h-4 w-4" /> {cityState}
              </div>
              <h1 className="mt-4 md:mt-5 font-display text-3xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.05] drop-shadow-[0_3px_12px_rgba(0,0,0,0.9)]">
                Epoxy Garage Floors in {city}, {stateName}
              </h1>
              <p className="mt-4 text-lg md:text-xl text-stone-300 max-w-2xl leading-relaxed drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                Premium garage floor coating installation in {city}. Get a personalized price range in about 60 seconds —
                before you talk to anyone. No obligation, no pressure.
              </p>
              <Link to="/funnel" className="mt-6 md:mt-8 inline-flex w-full sm:w-auto items-center justify-center gap-3 h-14 md:h-16 px-8 md:px-10 rounded-xl bg-amber-500 hover:bg-amber-400 transition text-stone-950 text-base font-bold tracking-wide shadow-lg shadow-amber-500/30 border border-white/80">
                <Calculator className="h-5 w-5" /> Price My Floor + Visualize It
              </Link>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/90 font-medium drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                <span>
                  <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-4 w-4" /> Free estimate</span>
                  {" • "}
                  <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> No obligation</span>
                  {" • "}
                  <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" /> Takes about 60 seconds</span>
                </span>
                <span className="hidden md:inline text-white/40">|</span>
                <span className="hidden md:inline text-white/80">{settings.service_area}</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <ConsultationForm settings={settings} />

      {/* === City cost snapshot === */}
      <section className="bg-stone-50 border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <CostStat label="2-Car Garage" value="$2,400–$4,200" />
            <CostStat label="3-Car Garage" value="$3,600–$6,300" />
            <CostStat label="Timeline" value="1–2 Days" />
            <CostStat label="Warranty" value="Up to 15 Yrs" />
          </div>
          <p className="mt-4 text-sm text-stone-500 text-center">
            Estimated ranges for {city}, {stateCode}. Get your exact price in 60 seconds.
          </p>
        </div>
      </section>

      {/* === Full visual sections (real contractor website) === */}
      <BeforeAfterShowcase />
      <FloorTypeGallery />
      <ApplicationSpaces />
      <FlakeShowcase />

      {/* === City-specific SEO content === */}
      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold tracking-tight text-stone-900">
            Epoxy Garage Floor Cost in {city}, {stateCode}
          </h2>
          <div className="mt-5 text-stone-600 leading-relaxed space-y-4">
            <p>
              Garage floor coating pricing in {city} depends on your garage size, the finish you choose, and the
              condition of your concrete. Most 2-car garages in the {stateName} area fall into a predictable range,
              but every floor is different.
            </p>
            <p>
              Instead of calling multiple contractors for quotes, get a preliminary range instantly with our estimator,
              then schedule a free consultation to confirm the details.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { t: "Garage Size", d: "2-car and 3-car garages are most common. Larger garages need more material and labor." },
              { t: "Concrete Condition", d: "Cracks, stains, and existing coatings may require extra preparation." },
              { t: "Climate & Moisture", d: `Proper moisture testing matters in ${stateName} before any coating is applied.` },
              { t: "Finish Selection", d: "Decorative flake, solid color, and metallic systems each carry different costs." },
              { t: "Coating Removal", d: "If an old coating needs removal, expect additional preparation time and cost." },
              { t: "Timeline", d: "ASAP and within-30-day timelines help us prioritize your project." },
            ].map((c) => (
              <div key={c.t} className="rounded-xl border border-stone-200 p-5">
                <div className="font-semibold text-stone-900">{c.t}</div>
                <div className="mt-1 text-sm text-stone-500">{c.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === Estimate CTA band === */}
      <section className="bg-stone-950 py-14">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            See your {city} garage floor cost now
          </h2>
          <p className="mt-2 text-stone-400">No phone call required. Get your personalized range in about 60 seconds.</p>
          <Link
            to="/funnel"
            className="mt-6 inline-flex h-14 px-8 items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-400 transition text-stone-950 font-bold tracking-wide"
          >
            GET MY FREE ESTIMATE <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* === More visual sections === */}
      <WhoWeAre settings={settings} />
      <Gallery items={settings.gallery} />

      {/* === City FAQ === */}
      <section className="bg-stone-50 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold tracking-tight text-stone-900">
            {city} Epoxy Garage Floor FAQs
          </h2>
          <div className="mt-6 space-y-3">
            {seoConfig.faq.map((f, i) => (
              <details key={i} className="group rounded-xl border border-stone-200 bg-white p-5">
                <summary className="flex items-center justify-between cursor-pointer font-semibold text-stone-900 list-none">
                  {f.q}
                  <ChevronRight className="h-5 w-5 text-stone-400 group-open:rotate-90 transition" />
                </summary>
                <p className="mt-3 text-stone-600 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <FAQ />
      <FinalCta settings={settings} />
      <Footer />
    </div>
  );
}

function CostStat({ label, value }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 text-center">
      <div className="text-xl font-bold text-stone-900">{value}</div>
      <div className="text-xs font-semibold uppercase tracking-wide text-stone-500 mt-1">{label}</div>
    </div>
  );
}

function slugifyCity(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}