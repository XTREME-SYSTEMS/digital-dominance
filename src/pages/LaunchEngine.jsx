import React, { useState } from "react";
import LaunchHero from "@/components/launch-engine/LaunchHero";
import IndustriesGrid from "@/components/launch-engine/IndustriesGrid";
import TemplatesShowcase from "@/components/launch-engine/TemplatesShowcase";
import HowItWorks from "@/components/launch-engine/HowItWorks";
import DualWorkspaces from "@/components/launch-engine/DualWorkspaces";
import ContactSection from "@/components/launch-engine/ContactSection";
import LaunchWizard from "@/components/launch-engine/LaunchWizard";

export default function LaunchEngine() {
  const [wizard, setWizard] = useState(null); // { industry?, template? }

  const openWizard = (init) => setWizard(init || {});
  const closeWizard = () => setWizard(null);

  return (
    <div className="min-h-screen bg-[#0a1220]">
      {/* Hero with mountain gradient backdrop */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0a1220] via-[#1a1530] to-[#3f2b4e]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#0a1220] to-transparent" />
        <div className="relative">
          <LaunchHero onBrowse={() => openWizard({})} />
        </div>
      </div>

      <IndustriesGrid onSelect={(industry) => openWizard({ industry })} />
      <TemplatesShowcase onChoose={(template) => openWizard({ template })} />
      <HowItWorks />
      <DualWorkspaces />
      <ContactSection />

      {wizard && <LaunchWizard initial={wizard} onClose={closeWizard} />}
    </div>
  );
}