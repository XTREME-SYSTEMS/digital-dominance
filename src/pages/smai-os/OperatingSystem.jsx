import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Sparkles, Send, Shield, Zap, Layers, Rocket, Users, CheckCircle2, Clock, AlertCircle, Play, ListOrdered } from "lucide-react";

// SMAI Operating System — Manus-like admin interface.
// Marketing site is the frontend; this is the operating system behind it.
// GPT has bi-directional sync into a sandbox with a queue system.
export default function OperatingSystem() {
  const [input, setInput] = useState("");
  const [active, setActive] = useState(false);
  const [queueStatus, setQueueStatus] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, onboarding: 0 });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statusRes, jobsRes, clientsRes] = await Promise.all([
        base44.functions.invoke("smaiSandboxDispatcher", { action: "status" }).catch(() => null),
        base44.entities.SmaiSandboxJob.filter({}, { sort: "-created_date", limit: 10 }).catch(() => ({ items: [] })),
        base44.entities.SmaiClient.filter({}, { sort: "-created_date", limit: 10 }).catch(() => ({ items: [] })),
      ]);
      setQueueStatus(statusRes?.data || null);
      setRecentJobs(jobsRes?.items || []);
      const clientItems = clientsRes?.items || [];
      setClients(clientItems);
      setStats({
        total: clientItems.length,
        active: clientItems.filter(c => c.status === "active").length,
        onboarding: clientItems.filter(c => c.status === "onboarding").length,
      });
    } catch (e) {
      console.error("Dashboard load error:", e);
    }
  };

  const launch = () => {
    if (!input.trim()) return;
    setActive(true);
    base44.functions.invoke("smaiSandboxDispatcher", {
      action: "enqueue",
      prompt: input.trim(),
    }).then(() => {
      loadDashboard();
      setInput("");
    }).catch(e => console.error("Enqueue error:", e));
  };

  return (
    <div className="min-h-screen bg-[#03070d] text-white flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-stone-800 bg-[#050a12]">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#00D4FF] to-[#0040CC] flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold">Strategic Minds AI</h1>
            <p className="text-[10px] text-stone-500 uppercase tracking-widest">Operating System</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/" className="text-xs text-stone-400 hover:text-[#00D4FF] transition">← Marketing Site</Link>
          <Link to="/smai/onboarding" className="rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/30 px-3 py-1.5 text-xs font-bold text-[#00D4FF] hover:bg-[#00D4FF]/20 transition">Client Portal</Link>
        </div>
      </header>

      {/* Main content */}
      {!active ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-3xl mb-8">
            <StatCard icon={Users} label="Total Clients" value={stats.total} color="#00D4FF" />
            <StatCard icon={CheckCircle2} label="Active" value={stats.active} color="#10b981" />
            <StatCard icon={Clock} label="Onboarding" value={stats.onboarding} color="#f59e0b" />
          </div>

          {/* Queue status */}
          {queueStatus?.ok && (
            <div className="w-full max-w-3xl mb-8 grid grid-cols-3 sm:grid-cols-6 gap-2">
              <QueuePill icon={ListOrdered} label="Queued" value={queueStatus.queue?.queued || 0} color="#f59e0b" />
              <QueuePill icon={Zap} label="Compiling" value={queueStatus.queue?.compiling || 0} color="#00D4FF" />
              <QueuePill icon={Shield} label="Validating" value={queueStatus.queue?.validating || 0} color="#8b5cf6" />
              <QueuePill icon={CheckCircle2} label="Ready" value={queueStatus.queue?.ready || 0} color="#10b981" />
              <QueuePill icon={Rocket} label="Approved" value={queueStatus.queue?.approved || 0} color="#10b981" />
              <QueuePill icon={AlertCircle} label="Failed" value={queueStatus.queue?.failed || 0} color="#ef4444" />
            </div>
          )}

          {/* Central input — Manus-like */}
          <div className="w-full max-w-2xl">
            <div className="rounded-2xl border-2 border-stone-700 bg-stone-900/50 p-4 focus-within:border-[#00D4FF] transition">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); launch(); }
                }}
                placeholder="Describe what you want to build... GPT will sync into the sandbox, validate against the 100% checklist, and deploy when ready."
                rows={3}
                className="w-full resize-none bg-transparent text-base text-white placeholder-stone-500 outline-none"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-stone-500">Enter to launch · Shift+Enter for new line</span>
                <button
                  onClick={launch}
                  disabled={!input.trim()}
                  className="flex items-center gap-2 rounded-xl bg-[#00D4FF] px-5 py-2 text-sm font-bold text-black disabled:opacity-40 hover:bg-[#00D4FF]/80 transition"
                >
                  <Send className="h-4 w-4" />
                  Launch
                </button>
              </div>
            </div>
          </div>

          {/* Recent sandbox jobs */}
          {recentJobs.length > 0 && (
            <div className="w-full max-w-3xl mt-8">
              <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-3">Recent Sandbox Jobs</h3>
              <div className="space-y-2">
                {recentJobs.slice(0, 5).map(job => (
                  <div key={job.id} className="flex items-center justify-between rounded-lg border border-stone-800 bg-stone-900/50 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-stone-300 truncate">{job.prompt?.slice(0, 80)}...</p>
                      <p className="text-[10px] text-stone-500 mt-0.5">{job.job_id}</p>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent clients */}
          {clients.length > 0 && (
            <div className="w-full max-w-3xl mt-8">
              <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-3">Recent Clients</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {clients.slice(0, 6).map(c => (
                  <Link key={c.id} to="/smai/onboarding" className="flex items-center justify-between rounded-lg border border-stone-800 bg-stone-900/50 px-4 py-3 hover:border-[#00D4FF]/30 transition">
                    <div>
                      <p className="text-sm font-semibold text-white">{c.full_name || c.business_name || "Unknown"}</p>
                      <p className="text-[10px] text-stone-500">{c.email}</p>
                    </div>
                    <ClientStatusBadge status={c.status} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00D4FF] to-[#0040CC] mb-4">
                <Play className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-bold mb-2">Sandbox Job Running</h2>
              <p className="text-sm text-stone-400 mb-6">GPT is compiling in the sandbox. Validation will run against the 100% perfection checklist.</p>
              <button onClick={() => { setActive(false); loadDashboard(); }} className="rounded-xl bg-stone-800 border border-stone-700 px-6 py-2 text-sm font-bold hover:border-[#00D4FF] transition">
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4" style={{ color }} />
        <span className="text-[10px] uppercase tracking-wide text-stone-500">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function QueuePill({ icon: Icon, label, value, color }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-stone-800 bg-stone-900/40 px-2 py-2">
      <Icon className="h-3.5 w-3.5 mb-1" style={{ color }} />
      <span className="text-lg font-bold">{value}</span>
      <span className="text-[9px] uppercase tracking-wide text-stone-500">{label}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    queued: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    compiling: "bg-[#00D4FF]/20 text-[#00D4FF] border-[#00D4FF]/30",
    validating: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    ready: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    approved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    failed: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${colors[status] || colors.queued}`}>
      {status}
    </span>
  );
}

function ClientStatusBadge({ status }) {
  const colors = {
    prospective: "bg-stone-700/40 text-stone-400 border-stone-600",
    deposited: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    onboarding: "bg-[#00D4FF]/20 text-[#00D4FF] border-[#00D4FF]/30",
    active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    archived: "bg-stone-700/40 text-stone-500 border-stone-600",
  };
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${colors[status] || colors.prospective}`}>
      {status}
    </span>
  );
}