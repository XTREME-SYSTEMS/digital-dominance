import React from "react";
import FunnelHero from "@/components/xps-funnel/FunnelHero";
import StatsBar from "@/components/xps-funnel/StatsBar";
import ProblemSolution from "@/components/xps-funnel/ProblemSolution";
import SystemShowcase from "@/components/xps-funnel/SystemShowcase";
import TestimonialWall from "@/components/xps-funnel/TestimonialWall";
import FinalCta from "@/components/xps-funnel/FinalCta";

export default function XpsFunnel() {
  return (
    <div className="min-h-screen empire-page-bg">
      <FunnelHero />
      <StatsBar />
      <ProblemSolution />
      <SystemShowcase />
      <TestimonialWall />
      <FinalCta />
    </div>
  );
}