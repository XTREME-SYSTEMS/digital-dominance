import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Rocket, Database, GitBranch, Globe, Shield, ChevronRight, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ProvisioningDashboard({ onQuickAction }) {
  const [stats, setStats] = useState({ sites: 0, templates: 0, packs: 0, queue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sites, templates, packs, queue] = await Promise.all([
          base44.entities.DynamicPage.count({ status: "published" }).catch(() => 0),
          base44.entities.UniversalIndustryTemplate.count({ template_status: "active" }).catch(() => 0),
          base44.entities.BrandTemplate.count({}).catch(() => 0),
          base44.entities.WebsiteQueue.count({ status: { $in: ["pending", "building", "deploying"] } }).catch(() => 0),
        ]);
        setStats({ sites, templates, packs, queue });
      } catch (e) { console.error("Provisioning stats failed:", e); }
      setLoading(false);
    };
    load();
  }, []);

  const accounts = [
    { name: "Vercel", icon: Rocket, status: "Connected", color: "text-stone-900", prompt: "List my Vercel projects and deployments" },
    { name: "Supabase", icon: Database, status: "Connected", color: "text-emerald-600", prompt: "List my Supabase projects and their status" },
    { name: "GitHub", icon: GitBranch, status: "Connected", color: "text-stone-700", prompt: "List my GitHub repositories and their current state" },
    { name: "GoDaddy", icon: Globe, status: "Connected", color: "text-amber-600", prompt: "List my GoDaddy domains and check availability for a new domain" },
    { name: "Google Console", icon: Shield, status: "Connected", color: "text-blue-600", prompt: "Check my Google integration status: Search Console, Analytics, and site verification" },
    { name: "Railway", icon: Rocket, status: "Connected", color: "text-purple-600", prompt: "Check Railway worker health and cron job status" },
  ];

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-stone-900">Provisioning Dashboard</h3>
        <p className="text-[11px] text-stone-500">Zero-restriction provisioning across all accounts</p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-stone-400" /></div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Live Sites", value: stats.sites, color: "text-emerald-600" },
            { label: "Templates", value: stats.templates, color: "text-amber-600" },
            { label: "Brand Packs", value: stats.packs, color: "text-stone-700" },
            { label: "In Queue", value: stats.queue, color: "text-blue-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-stone-200 bg-white p-2.5 text-center">
              <div className={`text-lg font-black ${s.color}`}>{s.value}</div>
              <div className="text-[9px] font-bold uppercase text-stone-400">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Accounts */}
      <div>
        <h4 className="text-xs font-bold text-stone-600 mb-2">Connected Accounts</h4>
        <div className="space-y-1.5">
          {accounts.map((a) => (
            <div key={a.name} className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white p-2.5">
              <a.icon className={`h-4 w-4 ${a.color}`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-stone-800">{a.name}</div>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-emerald-600 font-medium">{a.status}</span>
                </div>
              </div>
              <button onClick={() => onQuickAction(a.prompt)} className="rounded-lg bg-stone-100 px-2.5 py-1 text-[10px] font-bold text-stone-600 hover:bg-amber-100 hover:text-amber-700">
                Check
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick provision */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
        <h4 className="text-xs font-bold text-amber-800 mb-2">Quick Provision</h4>
        <div className="flex flex-col gap-1.5">
          <button onClick={() => onQuickAction("Provision a new Supabase project for my next website. Set up the schema, triggers, and RLS policies. Give me the project URL and anon key.")}
            className="flex items-center gap-2 rounded-lg bg-white border border-amber-200 px-3 py-2 text-xs font-medium text-stone-700 hover:border-amber-400">
            <Database className="h-3.5 w-3.5 text-emerald-600" /> New Supabase Project <ChevronRight className="h-3 w-3 ml-auto" />
          </button>
          <button onClick={() => onQuickAction("Create a new GitHub repository for my website project, push the code, and set up the CI/CD pipeline.")}
            className="flex items-center gap-2 rounded-lg bg-white border border-amber-200 px-3 py-2 text-xs font-medium text-stone-700 hover:border-amber-400">
            <GitBranch className="h-3.5 w-3.5" /> New GitHub Repo <ChevronRight className="h-3 w-3 ml-auto" />
          </button>
          <button onClick={() => onQuickAction("Deploy my latest website to Vercel production. Give me the live URL.")}
            className="flex items-center gap-2 rounded-lg bg-white border border-amber-200 px-3 py-2 text-xs font-medium text-stone-700 hover:border-amber-400">
            <Rocket className="h-3.5 w-3.5" /> Deploy to Vercel <ChevronRight className="h-3 w-3 ml-auto" />
          </button>
          <button onClick={() => onQuickAction("Check domain availability for my business name on GoDaddy. If available, ask me for approval to purchase.")}
            className="flex items-center gap-2 rounded-lg bg-white border border-amber-200 px-3 py-2 text-xs font-medium text-stone-700 hover:border-amber-400">
            <Globe className="h-3.5 w-3.5 text-amber-600" /> Purchase URL <ChevronRight className="h-3 w-3 ml-auto" />
          </button>
        </div>
      </div>

      {/* Deep links */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-100">
        <Link to="/admin/concept-to-completion" className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:border-amber-300">Concept → Completion</Link>
        <Link to="/admin/system-independence" className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:border-amber-300">Independence</Link>
        <Link to="/admin/provider-vault" className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:border-amber-300">Provider Vault</Link>
      </div>
    </div>
  );
}