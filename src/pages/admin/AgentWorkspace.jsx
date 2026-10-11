import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  ArrowRight, Bot, BrainCircuit, CircleAlert, Clock3,
  Code2, FileText, Globe2, Loader2, MessageCircle,
  Network, Plus, RefreshCw, Search, Send, ShieldCheck, Sparkles,
  Workflow, PanelLeftClose, PanelLeftOpen, Terminal, Layers3,
} from "lucide-react";

const AGENT = "system_operator";
const MODES = [
  { id: "research", label: "Research", icon: Search, prompt: "Research this question using attributable sources. Compare alternatives and return verified findings, uncertainty, and a read-only plan. Do not execute changes." },
  { id: "build", label: "Build", icon: Code2, prompt: "Prepare a website or app build plan, identify current source truth and technical constraints, and specify a reversible preview. Do not change files, deploy, or publish." },
  { id: "automate", label: "Automate", icon: Workflow, prompt: "Design a durable automation using existing approved workflows, queues, leases, checkpoints, and receipts. Draft only; do not activate schedules or integrations." },
  { id: "audit", label: "Audit", icon: ShieldCheck, prompt: "Perform a read-only forensic audit. Separate VERIFIED, INFERRED, and UNKNOWN. Identify failures, risks, and validation steps. Do not mutate state." },
];
const QUICK_LINKS = [
  { to: "/admin/operator", label: "Full System Operator", icon: Bot, detail: "Existing native agent console" },
  { to: "/admin/swarm", label: "Swarm Command", icon: Network, detail: "Real task and agent activity" },
  { to: "/admin/agent-builder", label: "Agent Builder", icon: BrainCircuit, detail: "Configure specialist agents" },
  { to: "/admin/website-factory", label: "Website Factory", icon: Layers3, detail: "Current website generation" },
  { to: "/admin/gpt-pipeline", label: "GPT Sync Pipeline", icon: Globe2, detail: "Existing handoff surfaces" },
  { to: "/admin/system-health", label: "System Health", icon: Terminal, detail: "Runtime and health checks" },
];
const stamp = (s) => {
  if (!s) return "";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
};
const errorText = (e) => e?.response?.data?.error || e?.message || "Unable to complete the request.";
const normalizeConversations = (items) => (Array.isArray(items) ? items : []).filter((item) => !item.metadata?.deleted);

export default function AgentWorkspace() {
  const [mode, setMode] = useState("research");
  const [tab, setTab] = useState("chat");
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [draft, setDraft] = useState("");
  const [connection, setConnection] = useState("checking");
  const [taskStatus, setTaskStatus] = useState("checking");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sidebar, setSidebar] = useState(true);
  const endRef = useRef(null);
  const activeIdRef = useRef(null);

  const loadTasks = useCallback(async () => {
    try {
      const result = await base44.entities.SwarmTask.list("-created_date", 12);
      setTasks(Array.isArray(result) ? result : []);
      setTaskStatus("connected");
    } catch (e) {
      setTaskStatus("unavailable");
      setError((previous) => previous || "Task feed: " + errorText(e));
    }
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const result = normalizeConversations(await base44.agents.listConversations({ agent_name: AGENT }));
      setConversations(result);
      setActive((current) => {
        if (current?.id && result.some((r) => r.id === current.id)) return result.find((r) => r.id === current.id);
        if (activeIdRef.current) return result.find((r) => r.id === activeIdRef.current) || result[0] || null;
        return result[0] || null;
      });
      setConnection("connected");
    } catch (e) {
      setConnection("unavailable");
      setError("Operator connection: " + errorText(e));
    }
  }, []);

  useEffect(() => {
    loadConversations();
    loadTasks();
    const timer = setInterval(loadTasks, 30000);
    return () => clearInterval(timer);
  }, [loadConversations, loadTasks]);

  useEffect(() => {
    activeIdRef.current = active?.id || null;
    if (!active) { setMessages([]); return; }
    setMessages(Array.isArray(active.messages) ? active.messages : []);
    let unsub = null;
    try {
      unsub = base44.agents.subscribeToConversation(active.id, (event) => {
        setMessages(Array.isArray(event?.messages) ? event.messages : []);
      });
    } catch (e) { setError("Live updates: " + errorText(e)); }
    return () => { if (typeof unsub === "function") unsub(); };
  }, [active?.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, sending]);

  const createSession = async () => {
    setError("");
    try {
      const newSession = await base44.agents.createConversation({
        agent_name: AGENT,
        metadata: { name: "New agent session", description: "Digital Dominance Agent Workspace; approval-first" },
      });
      setConversations((previous) => [newSession, ...previous]);
      setActive(newSession);
      setMessages([]);
      setTab("chat");
      return newSession;
    } catch (e) {
      setError("New session: " + errorText(e));
      return null;
    }
  };

  const submit = async (event) => {
    event?.preventDefault();
    const question = draft.trim();
    if (!question || sending) return;
    setError("");
    setSending(true);
    try {
      let conv = active;
      if (!conv) conv = await createSession();
      if (!conv) return;
      const selected = MODES.find((m) => m.id === mode) || MODES[0];
      // The default workspace sends planning-only instructions. Protected execution
      // remains behind the existing Operator/approval controls.
      const instruction = [
        "[DIGITAL DOMINANCE AGENT WORKSPACE]",
        "[PLAN / READ-ONLY MODE]",
        selected.prompt,
        "Always establish source truth, show evidence, and make an approval-gated work packet.",
        "Do not publish, purchase, send customer messages, change secrets, migrate databases,",
        "activate a schedule, or deploy production from this session.",
        "",
        "USER REQUEST:",
        question,
      ].join("\n");
      setDraft("");
      setMessages((previous) => [...previous, { role: "user", content: question, local_pending: true }]);
      await base44.agents.addMessage(conv, { role: "user", content: instruction });
      await loadConversations();
    } catch (e) {
      setError("Message not accepted: " + errorText(e));
      setDraft(question);
      setMessages((previous) => previous.filter((m) => !m.local_pending));
    } finally {
      setSending(false);
    }
  };

  const connected = connection === "connected";
  const underway = tasks.filter((task) => ["claimed", "in_progress", "validating", "staged"].includes(task.status));
  return (
    <div className="rounded-2xl overflow-hidden bg-[#101116] text-[#f6f5f4] border border-white/10 min-h-[min(900px,calc(100vh-110px))] flex flex-col shadow-2xl">
      <header className="px-4 md:px-6 h-[70px] border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-950/40">
            <Sparkles className="h-5 w-5 text-zinc-950" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-amber-300 tracking-[0.22em] uppercase">Strategic Minds AI</div>
            <h1 className="text-lg md:text-xl tracking-tight font-semibold">Agent Workspace <span className="text-xs font-normal text-zinc-500">/ v1 preview</span></h1>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className={"hidden sm:flex gap-2 items-center px-3 py-1.5 border rounded-full " + (connected ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" : "border-amber-500/25 text-amber-300")}>
            <span className={"h-1.5 w-1.5 rounded-full " + (connected ? "bg-emerald-400" : "bg-amber-400")} />
            {connected ? "Operator connected" : connection === "checking" ? "Checking connection" : "Operator unavailable"}
          </span>
          <button type="button" aria-label="Refresh connection" onClick={() => { loadConversations(); loadTasks(); }} className="p-2.5 hover:bg-white/10 rounded-xl" title="Refresh real backend state"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </header>
      <div className="flex flex-1 min-h-[620px]">
        {sidebar && (
          <aside className="w-[220px] xl:w-[250px] shrink-0 bg-[#15161b] border-r border-white/10 p-3 hidden md:flex flex-col">
            <button type="button" onClick={createSession} className="rounded-xl bg-[#272932] hover:bg-[#34363f] border border-white/10 text-sm font-medium py-3 flex gap-2 items-center justify-center">
              <Plus className="w-4 h-4" /> New task
            </button>
            <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 font-semibold px-3 pt-8 pb-3">Recent sessions</p>
            <div className="flex-1 overflow-y-auto space-y-1">
              {conversations.length === 0 && <p className="px-3 text-xs text-zinc-500">No saved sessions found.</p>}
              {conversations.map((conv) => (
                <button type="button" key={conv.id} onClick={() => { setActive(conv); setTab("chat"); }}
                  className={"w-full flex gap-2 items-center rounded-lg py-2.5 px-3 text-left text-xs " + (active?.id === conv.id ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white")}>
                  <MessageCircle className="w-4 h-4 shrink-0" /><span className="truncate">{conv.metadata?.name || "Agent session"}</span>
                </button>
              ))}
            </div>
            <div className="border-t border-white/10 pt-3 space-y-1">
              <Link to="/admin/operator" className="flex items-center gap-2 px-3 py-2.5 text-xs text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg"><Bot className="w-4 h-4"/> Full Operator</Link>
              <Link to="/admin/swarm" className="flex items-center gap-2 px-3 py-2.5 text-xs text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg"><Network className="w-4 h-4"/> Swarm tasks</Link>
            </div>
          </aside>
        )}
        <main className="flex-1 min-w-0 flex flex-col">
          <div className="md:hidden border-b border-white/10 px-4 py-2">
            <label className="text-[10px] text-zinc-500" htmlFor="agent-workspace-session">Session</label>
            <select id="agent-workspace-session" aria-label="Choose recent session" value={active?.id || ""} onChange={(e) => setActive(conversations.find((c) => c.id === e.target.value) || null)} className="mt-1 w-full rounded-lg bg-[#252730] border border-white/10 text-white text-xs p-2">
              {!active && <option value="">New task</option>}
              {conversations.map((conv) => <option key={conv.id} value={conv.id}>{conv.metadata?.name || "Agent session"}</option>)}
            </select>
          </div>
          <div className="h-12 px-4 border-b border-white/10 flex items-center gap-2 justify-between shrink-0">
            <div className="flex items-center gap-1">
              <button type="button" aria-label="Toggle sessions" onClick={() => setSidebar((s) => !s)} className="hidden md:flex p-2 rounded-lg hover:bg-white/10 text-zinc-400">{sidebar ? <PanelLeftClose className="h-4 w-4"/> : <PanelLeftOpen className="h-4 w-4"/>}</button>
              {["chat", "activity", "tools"].map((name) => <button type="button" key={name} onClick={() => setTab(name)} className={"capitalize text-xs px-3 py-2 rounded-lg " + (tab === name ? "bg-white/10 text-white" : "text-zinc-500 hover:text-white")}>{name}</button>)}
            </div>
            <span className="hidden lg:block text-xs text-zinc-500">Approval-first · Existing operator runtime</span>
            <button type="button" onClick={createSession} className="md:hidden text-zinc-300 p-2" aria-label="New task"><Plus className="w-4 h-4"/></button>
          </div>
          {error && <div role="alert" className="mx-4 mt-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-200 flex gap-2"><CircleAlert className="h-4 w-4 shrink-0"/>{error}</div>}
          {tab === "chat" && <>
            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
              {messages.length === 0 ? <div className="max-w-2xl mx-auto mt-8 md:mt-14 text-center">
                <span className="inline-flex items-center justify-center rounded-3xl h-16 w-16 bg-white/5 border border-white/10 mb-5"><Sparkles className="h-8 w-8 text-amber-300"/></span>
                <p className="text-xs uppercase tracking-[0.2em] text-amber-300/80 mb-3">Your autonomous command desk</p>
                <h2 className="text-3xl md:text-4xl font-semibold tracking-tight leading-tight">What are we building today?</h2>
                <p className="mt-4 text-sm text-zinc-400 leading-6 max-w-md mx-auto">Research markets. Design websites. Plan automations. Coordinate existing agents. One request, with source truth and review built in.</p>
                <div className="grid grid-cols-2 gap-3 mt-8">
                  {MODES.map((item) => <button type="button" key={item.id} onClick={() => { setMode(item.id); setDraft(item.label === "Research" ? "Research the strongest opportunities for our next website fleet." : item.label === "Build" ? "Design a high-converting website with a working lead capture funnel." : item.label === "Automate" ? "Plan a durable workflow that connects our existing systems." : "Audit our existing system and propose safe repairs."); }}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-[#1b1d24] border border-white/10 text-left hover:border-amber-400/40 hover:bg-[#22242c] transition"><item.icon className="h-5 w-5 text-amber-300"/><span className="text-xs sm:text-sm">{item.label}</span><ArrowRight className="h-3 w-3 text-zinc-500 ml-auto"/></button>)}
                </div>
              </div> : <div className="max-w-3xl mx-auto space-y-5">
                {messages.map((message, i) => <div key={message.id || i} className={"flex gap-3 " + (message.role === "user" ? "justify-end" : "justify-start")}>
                  {message.role !== "user" && <span className="h-8 w-8 shrink-0 rounded-xl bg-amber-400/15 flex items-center justify-center"><Bot className="h-4 w-4 text-amber-300"/></span>}
                  <div className={"max-w-[88%] text-sm leading-7 rounded-2xl px-4 py-3 whitespace-pre-wrap break-words " + (message.role === "user" ? "bg-[#30323b] text-white" : "bg-[#191b22] border border-white/10 text-zinc-200")}>
                    {message.role === "user" && message.content?.includes("USER REQUEST:") ? message.content.split("USER REQUEST:\n").pop() : message.content || (message.tool_calls?.length ? "Agent tool activity recorded. Open Full Operator for detailed traces." : "")}
                    {message.local_pending && <span className="block text-[10px] text-zinc-400">Submitting…</span>}
                  </div>
                </div>)}
                {sending && <span className="inline-flex gap-2 items-center text-xs text-zinc-400"><Loader2 className="w-4 h-4 animate-spin" /> Sending to operator…</span>}
                <div ref={endRef} />
              </div>}
            </div>
            <form onSubmit={submit} className="px-4 md:px-8 pb-5 pt-3">
              <div className="max-w-3xl mx-auto">
                <div className="flex gap-2 flex-wrap mb-2">
                  {MODES.map((item) => <button key={item.id} type="button" onClick={() => setMode(item.id)}
                    aria-pressed={mode === item.id} className={"rounded-full px-3 py-1.5 text-[11px] inline-flex items-center gap-1.5 border " + (mode === item.id ? "border-amber-300/50 text-amber-200 bg-amber-300/10" : "border-white/10 text-zinc-500 hover:text-white")}>
                    <item.icon className="h-3 w-3"/>{item.label}</button>)}
                </div>
                <div className="bg-[#24262e] border border-white/15 rounded-2xl p-3 focus-within:border-amber-300/50 transition">
                  <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Describe your mission…" rows={2}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(e); } }}
                    className="block w-full resize-none bg-transparent outline-none text-sm text-white placeholder:text-zinc-500" aria-label="Agent task prompt" />
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-300/90"><ShieldCheck className="h-3 w-3"/> Draft / read-only request</span>
                    <button disabled={!draft.trim() || sending || connection === "unavailable"} type="submit"
                      className="flex items-center justify-center h-9 w-9 rounded-xl bg-amber-300 text-[#191919] hover:bg-amber-200 disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Send task to operator">
                      {sending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-zinc-500 text-center">Agent responses may require review. Production, payments, secrets, publishing, and external messages need separate approval.</p>
              </div>
            </form>
          </>}
          {tab === "activity" && <div className="p-5 md:p-8 overflow-y-auto flex-1">
            <div className="max-w-3xl mx-auto">
              <div className="flex justify-between gap-3 items-center mb-6"><div><h2 className="text-xl font-semibold">Agent task activity</h2><p className="text-xs text-zinc-500 mt-1">Read-only view of real SwarmTask records</p></div><button onClick={loadTasks} className="p-2.5 bg-white/5 rounded-xl" aria-label="Refresh tasks"><RefreshCw className="w-4 h-4"/></button></div>
              {taskStatus === "unavailable" && <p role="alert" className="text-amber-300 text-sm">Task feed unavailable. No statistics are being inferred.</p>}
              {taskStatus === "connected" && <div className="mb-5 text-xs text-zinc-400 flex gap-2"><Clock3 className="w-4 h-4"/> Recent records: {tasks.length} · Active in loaded records: {underway.length}</div>}
              <div className="space-y-3">{tasks.map((task) => <div key={task.id} className="rounded-xl bg-[#1c1e25] border border-white/10 px-4 py-3 flex items-start gap-3"><div className="p-2 rounded-xl bg-white/5"><FileText className="w-4 h-4 text-amber-300"/></div><div className="flex-1 min-w-0"><div className="text-sm font-semibold truncate">{task.title || task.task_type || "Untitled task"}</div><p className="text-[11px] text-zinc-500 mt-1">{task.assigned_agent || "Unassigned"} · {stamp(task.created_date)}</p><p className="text-xs text-zinc-400 mt-2 line-clamp-2">{task.description}</p></div><span className="text-[10px] border border-white/15 text-zinc-300 px-2 py-1 rounded-full">{task.status || "unknown"}</span></div>)}</div>
              {!tasks.length && taskStatus === "connected" && <p className="text-sm text-zinc-500">No task records returned.</p>}
            </div>
          </div>}
          {tab === "tools" && <div className="p-5 md:p-8 overflow-y-auto flex-1">
            <div className="max-w-3xl mx-auto"><h2 className="text-xl font-semibold mb-1">Connected system surfaces</h2><p className="text-xs text-zinc-500 mb-6">Links to existing Admin modules. The presence of a link does not prove service health.</p>
              <div className="grid sm:grid-cols-2 gap-3">{QUICK_LINKS.map((item) => <Link to={item.to} key={item.to} className="rounded-xl border border-white/10 bg-[#1c1e25] hover:border-amber-300/40 p-4 flex items-start gap-3"><span className="p-2 rounded-xl bg-amber-300/10"><item.icon className="h-5 w-5 text-amber-300"/></span><span className="flex-1"><span className="text-sm font-semibold block">{item.label}</span><span className="text-[11px] text-zinc-500">{item.detail}</span></span><ArrowRight className="w-4 h-4 text-zinc-500" /></Link>)}</div>
            </div>
          </div>}
        </main>
        <aside className="hidden 2xl:flex w-[232px] bg-[#15161b] border-l border-white/10 flex-col p-4 gap-5">
          <div><div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-4">Mission control</div><div className="space-y-3 text-xs">
            <div className="flex justify-between text-zinc-400"><span>Agent API</span><span className={connected ? "text-emerald-300" : "text-amber-300"}>{connection}</span></div>
            <div className="flex justify-between text-zinc-400"><span>Task feed</span><span className={taskStatus === "connected" ? "text-emerald-300" : "text-amber-300"}>{taskStatus}</span></div>
            <div className="flex justify-between text-zinc-400"><span>Mode</span><span className="text-amber-200">Plan only</span></div>
          </div></div>
          <div className="h-px bg-white/10"/><p className="text-xs leading-6 text-zinc-500">Live execution and external account actions remain in existing approved control planes. This preview does not invent a sandbox or silently activate workflows.</p>
          <Link to="/admin/swarm" className="text-xs text-amber-300 inline-flex items-center gap-2 mt-auto">Open swarm ledger <ArrowRight className="w-3 h-3"/></Link>
        </aside>
      </div>
    </div>
  );
}
