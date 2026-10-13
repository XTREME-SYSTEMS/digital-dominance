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
    <div className="min-h-screen bg-launch-home-background">
      <LaunchHero onBrowse={() => openWizard({})} />

      <IndustriesGrid onSelect={(industry) => openWizard({ industry })} />
      <TemplatesShowcase onChoose={(template) => openWizard({ template })} />
      <HowItWorks />
      <DualWorkspaces />
      <ContactSection />

      {wizard && <LaunchWizard initial={wizard} onClose={closeWizard} />}
    </div>
  );
}