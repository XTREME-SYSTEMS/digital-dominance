import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { getLeads, getAllProjects } from "@/lib/smaiSupabase";
import { Link } from "react-router-dom";
import { Users, FolderKanban, TrendingUp, DollarSign, Loader2, Shield, ArrowRight, Activity } from "lucide-react";
import SmaiNav from "@/components/smai/SmaiNav";
import SmaiFooter from "@/components/smai/SmaiFooter";

export default function AdminPortal() {
  const { user, loading: authLoading, isAdmin } = useAuth();

  const { data: leads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ["smai-admin-leads"],
    queryFn: getLeads,
    enabled: !!user && isAdmin,
  });

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ["smai-admin-projects"],
    queryFn: getAllProjects,
    enabled: !!user && isAdmin,
  });

  if (authLoading) {
    return <div className="min-h-screen bg-stone-950 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div>;
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-stone-950">
        <SmaiNav />
        <div className="max-w-md mx-auto px-6 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-3">Admin Access Required</h1>
          <p className="text-stone-400 mb-8">You need admin privileges to access the Strategic Minds AI admin portal.</p>
          <Link to="/smai/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl electric-bg text-stone-950 font-bold hover:opacity-90 transition electric-glow">
            Log In <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <SmaiFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950">
      <SmaiNav />
      <section className="border-b border-stone-800 bg-gradient-to-b from-stone-900/50 to-stone-950">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <p className="font-mono text-[10px] tracking-[0.3em] text-cyan-400 uppercase mb-2">— ADMIN PORTAL —</p>
          <h1 className="text-3xl font-black text-white">Admin Dashboard</h1>
          <p className="text-stone-400 mt-1">Manage clients, projects, and business operations.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Users, label: "Total Leads", value: leads.length, color: "text-cyan-400" },
            { icon: FolderKanban, label: "Active Projects", value: projects.length, color: "text-blue-400" },
            { icon: TrendingUp, label: "Won Deals", value: leads.filter(l => l.status === "won").length, color: "text-green-400" },
            { icon: DollarSign, label: "Pipeline Value", value: `$${leads.reduce((s, l) => s + (l.estimate_value || 0), 0).toLocaleString()}`, color: "text-cyan-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-stone-800 bg-stone-900/50 p-5">
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-xs text-stone-500 uppercase tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { to: "/smai/contact", icon: Activity, label: "View Contact Form" },
            { to: "/smai/portal", icon: Users, label: "Client Portal" },
            { to: "/smai", icon: ArrowRight, label: "View Site" },
          ].map((a) => (
            <Link key={a.to} to={a.to} className="flex items-center gap-3 rounded-xl border border-stone-800 bg-stone-900/50 p-4 hover:border-cyan-400/50 transition">
              <a.icon className="w-5 h-5 text-cyan-400" />
              <span className="text-sm font-medium text-white">{a.label}</span>
            </Link>
          ))}
        </div>

        {/* Recent Leads */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Recent Leads</h2>
          {loadingLeads ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-cyan-400" /></div>
          ) : leads.length === 0 ? (
            <div className="rounded-2xl border border-stone-800 bg-stone-900/50 p-8 text-center text-stone-500">No leads yet.</div>
          ) : (
            <div className="rounded-2xl border border-stone-800 bg-stone-900/50 overflow-hidden">
              {leads.slice(0, 10).map((l, i) => (
                <div key={l.id} className={`flex items-center justify-between p-4 ${i < 9 ? "border-b border-stone-800" : ""}`}>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white">{l.first_name} {l.last_name}</div>
                    <div className="text-xs text-stone-500">{l.email} · {l.phone || "—"}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-stone-400 hidden sm:block">{l.company || "—"}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${l.status === "won" ? "bg-green-500/20 text-green-400" : "bg-cyan-500/20 text-cyan-400"}`}>{l.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Projects */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Recent Projects</h2>
          {loadingProjects ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-cyan-400" /></div>
          ) : projects.length === 0 ? (
            <div className="rounded-2xl border border-stone-800 bg-stone-900/50 p-8 text-center text-stone-500">No projects yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.slice(0, 6).map((p) => (
                <div key={p.id} className="rounded-2xl border border-stone-800 bg-stone-900/50 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-white text-sm">{p.name || "Untitled"}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "completed" ? "bg-green-500/20 text-green-400" : "bg-cyan-500/20 text-cyan-400"}`}>{p.status || "active"}</span>
                  </div>
                  <p className="text-xs text-stone-500">Created {new Date(p.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <SmaiFooter />
    </div>
  );
}