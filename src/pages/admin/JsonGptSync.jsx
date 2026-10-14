import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  ArrowRight, ArrowLeft, Send, Loader2, CheckCircle2, AlertCircle,
  Copy, Trash2, Download, RefreshCw, Code2, Radio, Zap,
} from "lucide-react";

const ACTIONS = [
  { value: "getConfig", label: "getConfig", desc: "Full sync config JSON for external GPT", dir: "to_gpt" },
  { value: "getPending", label: "getPending", desc: "Read pending admin events", dir: "to_gpt" },
  { value: "snapshot", label: "snapshot", desc: "Capture current admin state", dir: "to_gpt" },
  { value: "sync", label: "sync", desc: "Bi-directional sync cycle (events → GPT → commands)", dir: "both" },
  { value: "takeOver", label: "takeOver", desc: "GPT takes over with full context + operator loop", dir: "from_gpt" },
  { value: "execute", label: "execute", desc: "Execute a hosted tool (get_capabilities, read_entities, etc.)", dir: "from_gpt" },
  { value: "logEvent", label: "logEvent", desc: "Log an admin state change", dir: "to_gpt" },
  { value: "stats", label: "stats", desc: "Sync statistics", dir: "both" },
  { value: "listEvents", label: "listEvents", desc: "List recent sync events", dir: "both" },
];

const TEMPLATES = {
  getConfig: {},
  getPending: {},
  snapshot: {},
  stats: {},
  listEvents: { limit: 50, status: "", direction: "" },
  sync: { command: "" },
  takeOver: { command: "Review all pending leads and summarize their status" },
  execute: { tool: "get_capabilities", args: {} },
  logEvent: {
    event_type: "entity_update",
    entity_name: "Lead",
    data_summary: "Lead status changed to contacted",
    direction: "to_gpt",
  },
};

export default function JsonGptSync() {
  const [action, setAction] = useState("getConfig");
  const [jsonInput, setJsonInput] = useState(JSON.stringify(TEMPLATES["getConfig"], null, 2));
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [copiedField, setCopiedField] = useState(null);

  const currentAction = ACTIONS.find((a) => a.value === action);

  const handleActionChange = (newAction) => {
    setAction(newAction);
    setJsonInput(JSON.stringify(TEMPLATES[newAction], null, 2));
    setResponse(null);
    setError(null);
  };

  const send = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    let payload;
    try {
      payload = JSON.parse(jsonInput);
    } catch (e) {
      setError(`Invalid JSON: ${e.message}`);
      setLoading(false);
      return;
    }

    const fullPayload = { action, ...payload };
    const entry = {
      id: Date.now(),
      action,
      direction: currentAction?.dir || "both",
      timestamp: new Date().toISOString(),
      request: fullPayload,
    };

    try {
      const res = await base44.functions.invoke("gptSyncEngine", fullPayload);
      const data = res.data;
      entry.response = data;
      entry.success = true;
      setResponse(data);
    } catch (e) {
      const errMsg = e.response?.data?.error || e.message || "Request failed";
      entry.error = errMsg;
      entry.success = false;
      setError(errMsg);
    } finally {
      setHistory((prev) => [entry, ...prev].slice(0, 20));
      setLoading(false);
    }
  };

  const copy = async (text, field) => {
    await navigator.clipboard.writeText(typeof text === "string" ? text : JSON.stringify(text, null, 2));
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const downloadHistory = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gpt-sync-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearHistory = () => setHistory([]);

  return (
    <div className="flex flex-col gap-4 pb-12 min-h-[calc(100vh-82px)] text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#00a2ff] to-[#0066cc]">
              <Code2 className="h-4 w-4 text-white" />
            </div>
            JSON Bi-Directional GPT Sync
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Raw JSON payload editor. Compose requests, send to GPT sync engine, see JSON responses flow back.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs font-bold text-green-400">
            <Radio className="h-3.5 w-3.5" /> ENGINE LIVE
          </span>
        </div>
      </div>

      {/* Bi-directional flow indicator */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[#00a2ff]/20 bg-[#00a2ff]/5 p-3 flex items-center gap-3">
          <ArrowRight className="h-5 w-5 text-[#00a2ff] shrink-0" />
          <div>
            <p className="text-xs font-bold text-[#00a2ff]">ADMIN → GPT</p>
            <p className="text-[10px] text-white/40">State changes, snapshots, events sent to GPT</p>
          </div>
        </div>
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3 flex items-center gap-3">
          <ArrowLeft className="h-5 w-5 text-green-400 shrink-0" />
          <div>
            <p className="text-xs font-bold text-green-400">GPT → ADMIN</p>
            <p className="text-[10px] text-white/40">Commands, takeovers, tool executions flow back</p>
          </div>
        </div>
      </div>

      {/* Action selector */}
      <div className="rounded-2xl border border-white/10 bg-[#0d1525] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-[#00a2ff]" />
          <h3 className="text-sm font-bold text-white">Sync Action</h3>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
          {ACTIONS.map((a) => (
            <button
              key={a.value}
              onClick={() => handleActionChange(a.value)}
              className={`px-2 py-2 rounded-lg text-[11px] font-bold font-mono transition ${
                action === a.value
                  ? "bg-[#00a2ff] text-white shadow-[0_0_12px_rgba(0,162,255,0.4)]"
                  : "bg-[#0a0f1a] border border-white/10 text-white/50 hover:border-[#00a2ff]/40 hover:text-white/80"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-white/40 mt-2">
          <span className="font-mono text-[#00a2ff]">{action}</span> — {currentAction?.desc}
        </p>
      </div>

      {/* JSON Editor + Response — side by side */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Request editor */}
        <div className="rounded-2xl border border-white/10 bg-[#0d1525] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-[#0a0f1a]">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-3.5 w-3.5 text-[#00a2ff]" />
              <span className="text-xs font-bold text-white">REQUEST JSON</span>
              <span className="text-[10px] text-white/30 font-mono">action: {action}</span>
            </div>
            <button
              onClick={() => copy(jsonInput, "request")}
              className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white/70 transition"
            >
              {copiedField === "request" ? <CheckCircle2 className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
              {copiedField === "request" ? "Copied" : "Copy"}
            </button>
          </div>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            spellCheck={false}
            className="flex-1 min-h-[300px] max-h-[500px] bg-[#0a0f1a] text-green-400 font-mono text-xs p-4 outline-none resize-none whitespace-pre-wrap break-all leading-relaxed"
            placeholder="Enter JSON payload..."
          />
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-[#0a0f1a]">
            <button
              onClick={() => setJsonInput(JSON.stringify(TEMPLATES[action], null, 2))}
              className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/70 transition"
            >
              <RefreshCw className="h-3 w-3" /> Reset template
            </button>
            <button
              onClick={send}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-[#00a2ff] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50 hover:bg-[#0090e0] transition shadow-[0_0_20px_rgba(0,162,255,0.3)]"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send to GPT
            </button>
          </div>
        </div>

        {/* Response viewer */}
        <div className="rounded-2xl border border-white/10 bg-[#0d1525] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-[#0a0f1a]">
            <div className="flex items-center gap-2">
              <ArrowLeft className="h-3.5 w-3.5 text-green-400" />
              <span className="text-xs font-bold text-white">RESPONSE JSON</span>
              {response && <span className="text-[10px] text-green-400 font-bold">● OK</span>}
              {error && <span className="text-[10px] text-red-400 font-bold">● ERROR</span>}
            </div>
            {response && (
              <button
                onClick={() => copy(response, "response")}
                className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white/70 transition"
              >
                {copiedField === "response" ? <CheckCircle2 className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                {copiedField === "response" ? "Copied" : "Copy"}
              </button>
            )}
          </div>
          <div className="flex-1 min-h-[300px] max-h-[500px] overflow-auto p-4 bg-[#0a0f1a]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-[#00a2ff]" />
              </div>
            ) : error ? (
              <div className="flex items-start gap-2 text-red-400 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <pre className="font-mono whitespace-pre-wrap break-words">{error}</pre>
              </div>
            ) : response ? (
              <pre className="text-green-400/90 font-mono text-xs whitespace-pre-wrap break-words leading-relaxed">
                {JSON.stringify(response, null, 2)}
              </pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-white/20">
                <Code2 className="h-8 w-8 mb-2" />
                <p className="text-xs">Response will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Exchange history */}
      <div className="rounded-2xl border border-white/10 bg-[#0d1525] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Radio className="h-4 w-4 text-[#00a2ff]" /> Exchange History
            <span className="text-xs text-white/40">({history.length})</span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadHistory}
              disabled={history.length === 0}
              className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white/70 transition disabled:opacity-30"
            >
              <Download className="h-3 w-3" /> Export
            </button>
            <button
              onClick={clearHistory}
              disabled={history.length === 0}
              className="flex items-center gap-1 text-[11px] text-white/40 hover:text-red-400 transition disabled:opacity-30"
            >
              <Trash2 className="h-3 w-3" /> Clear
            </button>
          </div>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {history.length === 0 ? (
            <div className="text-center py-8 text-sm text-white/30">
              No exchanges yet. Send a JSON payload to GPT.
            </div>
          ) : (
            history.map((h) => (
              <div key={h.id} className="border-b border-white/5 px-4 py-3 hover:bg-white/[0.02]">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`h-2 w-2 rounded-full ${h.success ? "bg-green-400" : "bg-red-400"}`} />
                  <span className="text-xs font-mono font-bold text-white">{h.action}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    h.direction === "to_gpt" ? "bg-[#00a2ff]/20 text-[#00a2ff]" :
                    h.direction === "from_gpt" ? "bg-green-500/20 text-green-400" :
                    "bg-white/10 text-white/50"
                  }`}>{h.direction}</span>
                  <span className="text-[10px] text-white/30">{new Date(h.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="grid lg:grid-cols-2 gap-2 mt-2">
                  <div>
                    <p className="text-[9px] font-bold uppercase text-white/30 mb-1">Request</p>
                    <pre className="text-[10px] font-mono text-[#00a2ff]/70 whitespace-pre-wrap break-words max-h-24 overflow-auto">
                      {JSON.stringify(h.request, null, 1)}
                    </pre>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase text-white/30 mb-1">{h.success ? "Response" : "Error"}</p>
                    <pre className={`text-[10px] font-mono whitespace-pre-wrap break-words max-h-24 overflow-auto ${
                      h.success ? "text-green-400/70" : "text-red-400/70"
                    }`}>
                      {h.success ? JSON.stringify(h.response, null, 1) : h.error}
                    </pre>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* External GPT connection info */}
      <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          <h3 className="text-sm font-bold text-white">External GPT Connection</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg bg-[#0a0f1a] border border-white/10 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-white/40 mb-1">Endpoint</p>
            <code className="text-green-400 font-mono break-all text-[11px]">
              https://unlimitedwebsites.base44.app/functions/gptSyncEngine
            </code>
          </div>
          <div className="rounded-lg bg-[#0a0f1a] border border-white/10 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-white/40 mb-1">Auth Header</p>
            <code className="text-green-400 font-mono break-all text-[11px]">
              Authorization: Bearer &lt;GPT_SYNC_API_KEY&gt;
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}