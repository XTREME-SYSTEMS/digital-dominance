import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, ArrowRight, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function Portal() {
  const navigate = useNavigate();
  const { user, isLoadingAuth } = useAuth();

  useEffect(() => {
    if (!isLoadingAuth && user) {
      navigate("/admin", { replace: true });
    }
  }, [user, isLoadingAuth, navigate]);

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-black" style={{
            background: "linear-gradient(135deg, #e8e8e8, #ffffff, #a0a0a0)",
            WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>S</span>
          <span className="text-sm font-bold tracking-wider text-white/80">STRATEGIC MINDS AI</span>
        </Link>
        <Link to="/" className="flex items-center gap-2 text-xs font-bold tracking-wider text-white/60 hover:text-[#00E5FF]">
          <ArrowLeft className="h-3.5 w-3.5" /> BACK
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <div className="relative mb-8 mx-auto w-fit">
            <div className="absolute inset-0 rounded-full blur-3xl bg-[#00E5FF]/20" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-[#00E5FF]/30">
              <Lock className="h-10 w-10 text-[#00E5FF]" />
            </div>
          </div>

          <h1 className="text-3xl font-black tracking-wide mb-3">ENTER THE <span className="text-[#00E5FF]">PORTAL</span></h1>
          <p className="text-white/50 mb-8">Sign in to access the autonomous build system. Type what you want to build. Walk away. It gets done.</p>

          <div className="flex flex-col gap-3">
            <Link to="/login" className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#00E5FF] py-4 text-sm font-bold tracking-wider text-black hover:bg-[#00E5FF]/80 transition">
              SIGN IN <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/register" className="flex items-center justify-center gap-2 w-full rounded-xl border border-white/20 py-4 text-sm font-bold tracking-wider text-white/80 hover:border-[#00E5FF] hover:text-[#00E5FF] transition">
              CREATE ACCOUNT
            </Link>
          </div>

          <p className="mt-8 text-xs text-white/30">Authorized personnel only. All actions are logged with evidence receipts.</p>
        </div>
      </div>
    </div>
  );
}