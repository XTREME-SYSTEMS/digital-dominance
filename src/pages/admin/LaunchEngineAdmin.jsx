import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getReferenceAdminView } from "@/components/launch-engine-admin/ReferenceAdminViews";
import ReferenceAdminHero from "@/components/launch-engine-admin/ReferenceAdminHero";
import ReferenceAdminStats from "@/components/launch-engine-admin/ReferenceAdminStats";
import ReferenceAdminOverviewPanel from "@/components/launch-engine-admin/ReferenceAdminOverviewPanel";
import ReferenceAdminNextPanel from "@/components/launch-engine-admin/ReferenceAdminNextPanel";
import ReferenceAdminFooter from "@/components/launch-engine-admin/ReferenceAdminFooter";

export default function LaunchEngineAdmin() {
  const { pathname, hash, search, state } = useLocation();
  const navigate = useNavigate();
  const view = getReferenceAdminView(hash);
  useEffect(() => {
    const canonicalHash = `#${encodeURIComponent(view.name)}`;
    if (hash !== canonicalHash) navigate({ pathname, search, hash: canonicalHash }, { replace: true, state });
  }, [hash, pathname, search, state, view.name, navigate]);
  return (
    <div className="wle-content">
      <ReferenceAdminHero view={view} />
      <ReferenceAdminStats stats={view.stats} />
      <div className="wle-panels">
        <ReferenceAdminOverviewPanel view={view} />
        <ReferenceAdminNextPanel />
      </div>
      <ReferenceAdminFooter />
    </div>
  );
}