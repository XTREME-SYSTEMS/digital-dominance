import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { getMyProjects, getMyMessages, sendMessage } from "@/lib/smaiSupabase";
import { Link } from "react-router-dom";
import { FolderKanban, MessageSquare, Send, Loader2, LogIn, ArrowRight, Clock, CheckCircle2 } from "lucide-react";
import SmaiNav from "@/components/smai/SmaiNav";
import SmaiFooter from "@/components/smai/SmaiFooter";

export default function ClientPortal() {
  const { user, loading: authLoading } = useAuth();
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ["smai-client-projects", user?.id],
    queryFn: getMyProjects,
    enabled: !!user,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["smai-client-messages", user?.id],
    queryFn: getMyMessages,
    enabled: !!user,
  });

  const handleSend = async (e) => {
    e.preventDefault();
    if (!msg.trim()) return;
    setSending(true);
    try {
      await sendMessage(msg);
      setSent(true);
      setMsg("");
    } catch {}
    setSending(false);
  };

  if (authLoading) {
    return <div className="min-h-screen bg-stone-950 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-950">
        <SmaiNav />
        <div className="max-w-md mx-auto px-6 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl electric-bg flex items-center justify-center mx-auto mb-6 electric-glow">
            <LogIn className="w-8 h-8 text-stone-950" />
          </div>
          <h1 className="text-2xl font-black text-white mb-3">Client Portal Access</h1>
          <p className="text-stone-400 mb-8">Log in to access your projects, messages, and documents.</p>
          <Link to="/smai/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl electric-bg text-stone-950 font-bold hover:opacity-90 transition electric-glow">
            Log In <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-sm text-stone-500 mt-4">Don't have an account? <Link to="/smai/register" className="text-cyan-400 hover:underline">Register here</Link></p>
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
          <p className="font-mono text-[10px] tracking-[0.3em] text-cyan-400 uppercase mb-2">— CLIENT PORTAL —</p>
          <h1 className="text-3xl font-black text-white">Welcome, {user.full_name || user.email}</h1>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: FolderKanban, label: "Active Projects", value: projects.length },
            { icon: CheckCircle2, label: "Completed", value: projects.filter(p => p.status === "completed").length },
            { icon: MessageSquare, label: "Messages", value: messages.length },
            { icon: Clock, label: "Last Login", value: "Now" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-stone-800 bg-stone-900/50 p-5">
              <s.icon className="w-5 h-5 text-cyan-400 mb-2" />
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-xs text-stone-500 uppercase tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Projects */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Your Projects</h2>
          {loadingProjects ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-cyan-400" /></div>
          ) : projects.length === 0 ? (
            <div className="rounded-2xl border border-stone-800 bg-stone-900/50 p-8 text-center text-stone-500">
              <FolderKanban className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p>No projects yet. Your projects will appear here once they're created.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((p) => (
                <div key={p.id} className="rounded-2xl border border-stone-800 bg-stone-900/50 p-5 hover:border-cyan-400/50 transition">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-white">{p.name || "Untitled Project"}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${p.status === "completed" ? "bg-green-500/20 text-green-400" : "bg-cyan-500/20 text-cyan-400"}`}>{p.status || "active"}</span>
                  </div>
                  <p className="text-sm text-stone-400 mb-3">{p.description || "No description available."}</p>
                  <div className="text-xs text-stone-500">Created {new Date(p.created_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Messages */}
        {messages.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-white mb-4">Message History</h2>
            <div className="space-y-2">
              {messages.map((m) => (
                <div key={m.id} className="rounded-xl border border-stone-800 bg-stone-900/50 p-4">
                  <p className="text-sm text-stone-300">{m.body}</p>
                  <div className="text-xs text-stone-500 mt-2">{new Date(m.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Send Message */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Send a Message</h2>
          {sent ? (
            <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/5 p-6 text-center">
              <CheckCircle2 className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <p className="text-white font-bold">Message sent!</p>
              <button onClick={() => setSent(false)} className="text-sm text-cyan-400 hover:underline mt-2">Send another</button>
            </div>
          ) : (
            <form onSubmit={handleSend} className="rounded-2xl border border-stone-800 bg-stone-900/50 p-5 space-y-3">
              <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} placeholder="Type your message to the team..." className="w-full rounded-lg border border-stone-700 bg-stone-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 transition resize-none" />
              <button type="submit" disabled={sending || !msg.trim()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg electric-bg text-stone-950 font-bold hover:opacity-90 transition disabled:opacity-50 electric-glow">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send Message
              </button>
            </form>
          )}
        </div>
      </div>
      <SmaiFooter />
    </div>
  );
}