import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Send, Zap, Activity, ArrowRight, ArrowLeft, Radio, Loader2, CheckCircle2, AlertCircle, Code2, Copy, ChevronDown, ChevronUp } from "lucide-react";

export default function GptSyncConsole() {
  const queryClient = useQueryClient();
  const [command, setCommand] = useState("");
  const [running, setRunning] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [autoSync, setAutoSync] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [configJson, setConfigJson] = useState(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: statsData } = useQuery({
    queryKey: ["sync-stats"],
    queryFn: async () => (await base44.functions.invoke("gptSyncEngine", { action: "stats" })).data,
    refetchInterval: autoSync ? 5000 : false,
  });

  const { data: eventsData } = useQuery({
    queryKey: ["sync-events"],
    queryFn: async () => (await base44.functions.invoke("gptSyncEngine", { action: "listEvents", limit: 50 })).data,
    refetchInterval: autoSync ? 5000 : false,
  });

  const { data: pendingData } = useQuery({
    queryKey: ["sync-pending"],
    queryFn: async () => (await base44.functions.invoke("gptSyncEngine", { action: "getPending" })).data,
    refetchInterval: autoSync ? 3000 : false,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["sync-stats"] });
    queryClient.invalidateQueries({ queryKey: ["sync-events"] });
    queryClient.invalidateQueries({ queryKey: ["sync-pending"] });
  };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("gptSyncEngine", { action: "sync" });
      setResult(res.data);
      refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleTakeOver = async () => {
    const msg = command.trim();
    if (!msg) return;
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke("gptSyncEngine", { action: "takeOver", command: msg });
      setResult(res.data);
      setCommand("");
      refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  };

  const stats = statsData?.stats || {};
  const events = eventsData?.events || [];
  const pending = pendingData?.events || [];

  const loadConfig = async () => {
    setConfigLoading(true);
    try {
      const res = await base44.functions.invoke("gptSyncEngine", { action: "getConfig" });
      setConfigJson(res.data?.config || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setConfigLoading(false);
    }
  };

  const toggleConfig = async () => {
    if (!configJson && !configLoading) await loadConfig();
    setShowConfig(!showConfig);
  };

  const copyConfig = async () => {
    if (!configJson) return;
    await navigator.clipboard.writeText(JSON.stringify(configJson, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4 pb-12 min-h-[calc(100vh-82px)] text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#00a2ff] to-[#0066cc]">
              <Radio className="h-4 w-4 text-white" />
            </div>
            GPT Bi-Directional Sync
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Admin state syncs to GPT for context. GPT commands sync back to the admin. Full takeover mode.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoSync(!autoSync)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
              autoSync
                ? "bg-[#00a2ff]/20 border-[#00a2ff] text-[#00a2ff]"
                : "bg-[#0d1525] border-white/10 text-white/60 hover:border-[#00a2ff]/50"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${autoSync ? "bg-[#00a2ff] animate-pulse" : "bg-white/30"}`} />
            {autoSync ? "AUTO SYNC ON" : "AUTO SYNC OFF"}
          </button>
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#0d1525] px-3 py-1.5 text-xs font-bold text-white/60 hover:border-[#00a2ff]/50"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Pending Events" value={stats.pending || 0} icon={AlertCircle} color="text-amber-400" />
        <StatCard label="Synced Events" value={stats.synced || 0} icon={CheckCircle2} color="text-green-400" />
        <StatCard label="Total Events" value={stats.total || 0} icon={Activity} color="text-[#00a2ff]" />
        <StatCard label="Last Sync" value={stats.last_sync ? new Date(stats.last_sync).toLocaleTimeString() : "Never"} icon={Radio} color="text-white/60" small />
      </div>

      {/* Bi-directional flow diagram */}
      <div className="rounded-2xl border border-white/10 bg-[#0d1525] p-4">
        <div className="flex items-center justify-between gap-4 text-center">
          <div className="flex-1">
            <div className="flex items-center gap-2 justify-center mb-1">
              <ArrowRight className="h-4 w-4 text-[#00a2ff]" />
              <span className="text-xs font-bold text-[#00a2ff]">ADMIN → GPT</span>
            </div>
            <p className="text-[10px] text-white/40">State changes logged as events</p>
            <p className="text-sm font-bold text-white mt-1">{pending.length} pending</p>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 justify-center mb-1">
              <ArrowLeft className="h-4 w-4 text-green-400" />
              <span className="text-xs font-bold text-green-400">GPT → ADMIN</span>
            </div>
            <p className="text-[10px] text-white/40">Commands execute via operator loop</p>
            <p className="text-sm font-bold text-white mt-1">{events.filter(e => e.direction === "from_gpt").length} executed</p>
          </div>
          <div className="flex-1">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 rounded-xl bg-[#00a2ff] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 hover:bg-[#0090e0] transition w-full justify-center"
            >
              {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Sync Now
            </button>
          </div>
        </div>
      </div>

      {/* GPT Takeover command */}
      <div className="rounded-2xl border-2 border-[#00a2ff]/30 bg-[#0d1525] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-[#00a2ff]" />
          <h3 className="text-sm font-bold text-white">GPT Takeover — Command Interface</h3>
        </div>
        <p className="text-xs text-white/40 mb-3">
          Type a command. GPT gets the full admin state snapshot + all pending events as context, then executes via the operator loop.
        </p>
        <div className="flex gap-2">
          <input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleTakeOver(); } }}
            placeholder="e.g. 'Review all pending leads and send follow-up emails to the qualified ones'"
            className="flex-1 rounded-xl border border-white/10 bg-[#0a0f1a] px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#00a2ff]/50"
          />
          <button
            onClick={handleTakeOver}
            disabled={running || !command.trim()}
            className="flex items-center gap-2 rounded-xl bg-[#00a2ff] px-5 py-3 text-sm font-bold text-white disabled:opacity-50 hover:bg-[#0090e0] transition shadow-[0_0_20px_rgba(0,162,255,0.3)]"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Take Over
          </button>
        </div>
      </div>

      {/* GPT Sync Config JSON — for external GPT integration */}
      <div className="rounded-2xl border border-[#00a2ff]/20 bg-[#0d1525] overflow-hidden">
        <button
          onClick={toggleConfig}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition"
        >
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-[#00a2ff]" />
            <h3 className="text-sm font-bold text-white">GPT Sync Config JSON</h3>
            <span className="text-[10px] text-white/40 font-mono bg-white/5 px-2 py-0.5 rounded">for external GPT</span>
          </div>
          {showConfig ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
        </button>
        {showConfig && (
          <div className="border-t border-white/10">
            <div className="px-4 py-2.5 flex items-center justify-between bg-[#0a0f1a] border-b border-white/5">
              <p className="text-xs text-white/50">
                Paste this JSON into your external GPT's system prompt or custom GPT config. It contains the full operator instructions, entity catalog, function catalog, and tool schemas.
              </p>
              <button
                onClick={copyConfig}
                disabled={!configJson || configLoading}
                className="flex items-center gap-1.5 rounded-lg bg-[#00a2ff] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50 hover:bg-[#0090e0] transition shrink-0 ml-3"
              >
                {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy JSON"}
              </button>
            </div>
            <div className="max-h-[500px] overflow-auto p-4">
              {configLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-[#00a2ff]" />
                </div>
              ) : configJson ? (
                <pre className="text-[11px] font-mono text-green-400/90 whitespace-pre-wrap break-words leading-relaxed">
                  {JSON.stringify(configJson, null, 2)}
                </pre>
              ) : (
                <p className="text-sm text-white/30 text-center py-8">Failed to load config.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* GPT Result */}
      {result?.result && (
        <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <h3 className="text-sm font-bold text-green-400">GPT Response</h3>
          </div>
          <p className="text-sm text-white/80 whitespace-pre-wrap">{result.result.text}</p>
          {result.result.receipts?.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-xs font-bold text-white/40 uppercase">Tool Receipts</p>
              {result.result.receipts.map((r, i) => (
                <div key={i} className="text-xs text-white/60 flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${r.status === "completed" ? "bg-green-400" : "bg-red-400"}`} />
                  <span className="font-mono">{r.tool}</span>
                  <span className="text-white/40">→ {r.detail?.slice(0, 100)}</span>
                </div>
              ))}
            </div>
          )}
          {result.events_processed > 0 && (
            <p className="mt-2 text-xs text-white/40">{result.events_processed} admin events synced to GPT context</p>
          )}
        </div>
      )}

      {/* Event feed */}
      <div className="rounded-2xl border border-white/10 bg-[#0d1525] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#00a2ff]" /> Sync Event Feed
          </h3>
          <span className="text-xs text-white/40">{events.length} events</span>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {events.length === 0 ? (
            <div className="text-center py-8 text-sm text-white/30">No sync events yet. Use "Sync Now" or send a command.</div>
          ) : (
            events.map((e) => (
              <div key={e.id} className="flex items-start gap-3 px-4 py-2.5 border-b border-white/5 hover:bg-white/[0.02]">
                <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                  e.direction === "to_gpt" ? "bg-[#00a2ff]" :
                  e.direction === "from_gpt" ? "bg-green-400" : "bg-white/30"
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{e.event_type}</span>
                    {e.entity_name && <span className="text-xs text-white/40">· {e.entity_name}</span>}
                    {e.action && <span className="text-xs text-white/40">· {e.action}</span>}
                  </div>
                  {e.data_summary && <p className="text-xs text-white/50 mt-0.5 truncate">{e.data_summary}</p>}
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-white/30">{new Date(e.created_date).toLocaleString()}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      e.status === "pending" ? "bg-amber-500/20 text-amber-400" :
                      e.status === "synced" ? "bg-green-500/20 text-green-400" :
                      e.status === "processed" ? "bg-blue-500/20 text-blue-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>{e.status}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, small }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1525] p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-[10px] font-bold uppercase tracking-wide text-white/40">{label}</span>
      </div>
      <p className={`font-black ${small ? "text-sm" : "text-2xl"} ${color}`}>{value}</p>
    </div>
  );
}