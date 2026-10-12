import React, { useState } from "react";
import LaunchAdminHero from "@/components/launch-engine-admin/LaunchAdminHero";
import LaunchAdminTools from "@/components/launch-engine-admin/LaunchAdminTools";
import IndustriesGrid from "@/components/launch-engine/IndustriesGrid";
import TemplatesShowcase from "@/components/launch-engine/TemplatesShowcase";
import LaunchWizard from "@/components/launch-engine/LaunchWizard";

export default function LaunchEngineAdmin() {
  const [wizard, setWizard] = useState(null);
  return (
    <div className="space-y-6">
      <LaunchAdminHero onLaunch={() => setWizard({})} />
      <LaunchAdminTools />
      <IndustriesGrid workspace onSelect={industry => setWizard({ industry })} />
      <TemplatesShowcase workspace onChoose={template => setWizard({ template, industry: template.industry })} />
      {wizard && <LaunchWizard initial={wizard} onClose={() => setWizard(null)} />}
    </div>
  );
}