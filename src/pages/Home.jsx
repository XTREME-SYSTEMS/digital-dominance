import React, { useEffect } from "react";
import { useSettings } from "@/lib/useSettings";
import { trackEvent } from "@/lib/tracking";
import Nav from "@/components/home/Nav";
import Hero from "@/components/home/Hero";
import ConsultationForm from "@/components/home/ConsultationForm";
import { captureAttribution } from "@/lib/estimatorStore";
import MarketingSection from "@/components/home/MarketingSection";
import BeforeAfterShowcase from "@/components/home/BeforeAfterShowcase";
import FlakeShowcase from "@/components/home/FlakeShowcase";
import FloorTypeGallery from "@/components/home/FloorTypeGallery";
import ApplicationSpaces from "@/components/home/ApplicationSpaces";
import MobileSection from "@/components/home/MobileSection";
import Gallery from "@/components/home/Gallery";
import WhoWeAre from "@/components/home/WhoWeAre";
import FAQ from "@/components/home/FAQ";
import FinalCta from "@/components/home/FinalCta";
import Footer from "@/components/home/Footer";

export default function Home() {
  const { settings } = useSettings();

  useEffect(() => {
    captureAttribution();
    trackEvent("page_view", { page: "/" });
  }, []);

  return (
    <div className="bg-white">
      <Nav settings={settings} />

      <Hero settings={settings} />
      <ConsultationForm settings={settings} />

      <MarketingSection />

      <BeforeAfterShowcase />
      <FloorTypeGallery />
      <ApplicationSpaces />
      <FlakeShowcase />
      <MobileSection />
      <WhoWeAre settings={settings} />
      <Gallery items={settings.gallery} />
      <FAQ />
      <FinalCta settings={settings} />

      <Footer />
    </div>
  );
}