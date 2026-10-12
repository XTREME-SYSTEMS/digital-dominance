import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, ArrowRight, ArrowLeft, Rocket, Phone } from "lucide-react";
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
    <div className="min-h-screen bg-[#0a1220] text-white flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#00a2ff] to-[#0066cc]">
            <Rocket className="h-5 w-5 text-white" />
          </div>
          <div className="leading-none">
            <span className="block text-sm font-extrabold tracking-tight text-white">Website Launch Engine</span>
            <span className="block text-[9px] font-bold uppercase tracking-[0.15em] text-[#00a2ff]">Florida Based · Nationwide</span>
          </div>
        </Link>
        <Link to="/" className="flex items-center gap-2 text-xs font-bold tracking-wider text-white/60 hover:text-[#00a2ff]">
          <ArrowLeft className="h-3.5 w-3.5" /> BACK
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <div className="relative mb-8 mx-auto w-fit">
            <div className="absolute inset-0 rounded-full blur-3xl bg-[#00a2ff]/20" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-[#00a2ff]/30">
              <Lock className="h-10 w-10 text-[#00a2ff]" />
            </div>
          </div>

          <h1 className="text-3xl font-black tracking-wide mb-3">ENTER THE <span className="text-[#00a2ff]">PORTAL</span></h1>
          <p className="text-white/50 mb-8">Sign in to access the autonomous build system. Type what you want to build. Walk away. It gets done.</p>

          <div className="flex flex-col gap-3">
            <Link to="/login" className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#00a2ff] py-4 text-sm font-bold tracking-wider text-black hover:bg-[#00a2ff]/80 transition">
              SIGN IN <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/register" className="flex items-center justify-center gap-2 w-full rounded-xl border border-white/20 py-4 text-sm font-bold tracking-wider text-white/80 hover:border-[#00a2ff] hover:text-[#00a2ff] transition">
              CREATE ACCOUNT
            </Link>
          </div>

          <p className="mt-8 text-xs text-white/30">Authorized personnel only. All actions are logged with evidence receipts.</p>
        </div>
      </div>
    </div>
  );
}