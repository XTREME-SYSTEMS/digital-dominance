import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import AIAssistBubble from "@/components/ai-assist/AIAssistBubble";
import ReferenceAdminSidebar from "@/components/launch-engine-admin/ReferenceAdminSidebar";
import ReferenceAdminHeader from "@/components/launch-engine-admin/ReferenceAdminHeader";
import "@/components/launch-engine-admin/ReferenceAdmin.css";

export default function AdminLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const isReference = ["/admin", "/admin/", "/admin.html"].includes(pathname);
  if (user && user.role !== "admin") return <Navigate to="/portal/dashboard" replace />;
  return (
    <div className="wle-admin">
      <ReferenceAdminSidebar />
      <main className="wle-main">
        <ReferenceAdminHeader isReference={isReference} />
        <Outlet />
      </main>
      {!isReference && <AIAssistBubble />}
    </div>
  );
}