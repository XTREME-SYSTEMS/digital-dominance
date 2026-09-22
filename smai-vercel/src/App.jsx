import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { QueryClientProvider, queryClientInstance } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

import SmaiHome from "@/pages/smai/Home";
import SmaiServices from "@/pages/smai/Services";
import SmaiAbout from "@/pages/smai/About";
import SmaiCaseStudies from "@/pages/smai/CaseStudies";
import SmaiContact from "@/pages/smai/Contact";
import SmaiLogin from "@/pages/smai/Login";
import SmaiRegister from "@/pages/smai/Register";
import SmaiClientPortal from "@/pages/smai/ClientPortal";
import SmaiAdminPortal from "@/pages/smai/AdminPortal";

function ProtectedRoute({ children, adminOnly }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="min-h-screen bg-stone-950 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div>;
  if (!user) return <Navigate to="/smai/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/smai/portal" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/smai" replace />} />
      <Route path="/smai" element={<SmaiHome />} />
      <Route path="/smai/services" element={<SmaiServices />} />
      <Route path="/smai/about" element={<SmaiAbout />} />
      <Route path="/smai/case-studies" element={<SmaiCaseStudies />} />
      <Route path="/smai/contact" element={<SmaiContact />} />
      <Route path="/smai/login" element={<SmaiLogin />} />
      <Route path="/smai/register" element={<SmaiRegister />} />
      <Route path="/smai/portal" element={<ProtectedRoute><SmaiClientPortal /></ProtectedRoute>} />
      <Route path="/smai/admin-portal" element={<ProtectedRoute adminOnly><SmaiAdminPortal /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/smai" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}