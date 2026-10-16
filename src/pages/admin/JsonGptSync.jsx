import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  ArrowRight, ArrowLeft, Send, Loader2, CheckCircle2, AlertCircle,
  Copy, Trash2, Download, RefreshCw, Code2, Radio, Zap,
} from "lucide-react";
import AdminSystemPage from "@/components/launch-engine-admin/AdminSystemPage";

const ACTIONS = [
  { value: "getConfig", label: "getConfig", desc: "Full sync config JSON for external GPT", dir: "to_gpt" },
  { value: "getPending", label: "getPending", desc: "Read pending admin events", dir: "to_gpt" },
  { value: "snapshot", label: "snapshot", desc: "Capture current admin state", dir: "to_gpt" },
  { value: "sync", label: "sync", desc: "Bi-directional sync cycle", dir: "both" },
  { value: "takeOver", label: "takeOver", desc: "GPT takes over with full context", dir: "from_gpt" },
  { value: "execute", label: "execute", desc: "Execute a hosted tool", dir: "from_gpt" },
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
      entry.response = res.data;
      entry.success = true;
      setResponse(res.data);
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
    <AdminSystemPage
      eyebrow="BI-DIRECTIONAL · JSON SYNC"
      title="JSON GPT Sync"
      description="Raw JSON payload editor for the bi-directional GPT sync engine. Compose requests, send to GPT, see JSON responses flow back."
      badge="◈ SYNC ENGINE"
      stats={[
        ["Endpoint", "gptSyncEngine"],
        ["Actions", "9"],
        ["Direction", "Bi-directional"],
        ["Status", "● LIVE"],
      ]}
    >
      {/* Bi-directional flow indicator */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg border border-[#126fc8]/20 bg-[#126fc8]/5 p-3 flex items-center gap-3">
          <ArrowRight className="h-5 w-5 shrink-0 text-[#126fc8]" />
          <div>
            <p className="text-xs font-bold text-[#126fc8]">ADMIN → GPT</p>
            <p className="text-[10px] text-[#5b7288]">State changes, snapshots, events sent to GPT</p>
          </div>
        </div>
        <div className="rounded-lg border border-[#22c55e]/20 bg-[#22c55e]/5 p-3 flex items-center gap-3">
          <ArrowLeft className="h-5 w-5 shrink-0 text-[#22c55e]" />
          <div>
            <p className="text-xs font-bold text-[#22c55e]">GPT → ADMIN</p>
            <p className="text-[10px] text-[#5b7288]">Commands, takeovers, tool executions flow back</p>
          </div>
        </div>
      </div>

      {/* Action selector */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-4 w-4 text-[#126fc8]" />
          <h3 className="text-sm font-bold text-[#06213b]">Sync Action</h3>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
          {ACTIONS.map((a) => (
            <button
              key={a.value}
              onClick={() => handleActionChange(a.value)}
              className={`px-2 py-2 rounded-lg text-[11px] font-bold font-mono transition ${
                action === a.value
                  ? "bg-[#126fc8] text-white border border-[#126fc8] shadow-sm"
                  : "border border-[#dce6f1] bg-white text-[#5b7288] hover:border-[#126fc8]/40"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
        <p className="text-xs mt-2 text-[#5b7288]">
          <span className="font-mono text-[#126fc8]">{action}</span> — {currentAction?.desc}
        </p>
      </div>

      {/* JSON Editor + Response */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        {/* Request editor */}
        <div className="rounded-lg border border-[#dce6f1] bg-white overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#dce6f1] bg-[#f4f8fd]">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-3.5 w-3.5 text-[#126fc8]" />
              <span className="text-xs font-bold text-[#06213b]">REQUEST JSON</span>
              <span className="text-[10px] font-mono text-[#5b7288]">action: {action}</span>
            </div>
            <button
              onClick={() => copy(jsonInput, "request")}
              className="flex items-center gap-1 text-[10px] text-[#5b7288] hover:text-[#126fc8] transition"
            >
              {copiedField === "request" ? <CheckCircle2 className="h-3 w-3 text-[#22c55e]" /> : <Copy className="h-3 w-3" />}
              {copiedField === "request" ? "Copied" : "Copy"}
            </button>
          </div>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            spellCheck={false}
            className="w-full min-h-[300px] max-h-[500px] font-mono text-xs p-4 outline-none resize-none whitespace-pre-wrap break-all leading-relaxed"
            style={{ background: "#0d1525", color: "#22c55e", border: "none" }}
            placeholder="Enter JSON payload..."
          />
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#dce6f1] bg-[#f4f8fd]">
            <button
              onClick={() => setJsonInput(JSON.stringify(TEMPLATES[action], null, 2))}
              className="flex items-center gap-1.5 text-[11px] text-[#5b7288] hover:text-[#126fc8] transition"
            >
              <RefreshCw className="h-3 w-3" /> Reset template
            </button>
            <button
              onClick={send}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-white bg-[#126fc8] hover:bg-[#0d58a8] disabled:opacity-50 transition shadow-sm"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send to GPT
            </button>
          </div>
        </div>

        {/* Response viewer */}
        <div className="rounded-lg border border-[#dce6f1] bg-white overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#dce6f1] bg-[#f4f8fd]">
            <div className="flex items-center gap-2">
              <ArrowLeft className="h-3.5 w-3.5 text-[#22c55e]" />
              <span className="text-xs font-bold text-[#06213b]">RESPONSE JSON</span>
              {response && <span className="text-[10px] font-bold text-[#22c55e]">● OK</span>}
              {error && <span className="text-[10px] font-bold text-red-500">● ERROR</span>}
            </div>
            {response && (
              <button
                onClick={() => copy(response, "response")}
                className="flex items-center gap-1 text-[10px] text-[#5b7288] hover:text-[#126fc8] transition"
              >
                {copiedField === "response" ? <CheckCircle2 className="h-3 w-3 text-[#22c55e]" /> : <Copy className="h-3 w-3" />}
                {copiedField === "response" ? "Copied" : "Copy"}
              </button>
            )}
          </div>
          <div className="min-h-[300px] max-h-[500px] overflow-auto p-4" style={{ background: "#0d1525" }}>
            {loading ? (
              <div className="flex items-center justify-center h-[280px]">
                <Loader2 className="h-6 w-6 animate-spin text-[#126fc8]" />
              </div>
            ) : error ? (
              <div className="flex items-start gap-2 text-red-400 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <pre className="font-mono whitespace-pre-wrap break-words">{error}</pre>
              </div>
            ) : response ? (
              <pre className="font-mono text-xs whitespace-pre-wrap break-words leading-relaxed text-[#6cc6ff]">
                {JSON.stringify(response, null, 2)}
              </pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-[280px] text-white/20">
                <Code2 className="h-8 w-8 mb-2" />
                <p className="text-xs">Response will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Exchange history */}
      <div className="rounded-lg border border-[#dce6f1] bg-white overflow-hidden mb-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#dce6f1]">
          <h3 className="text-sm font-bold flex items-center gap-2 text-[#06213b]">
            <Radio className="h-4 w-4 text-[#126fc8]" /> Exchange History
            <span className="text-xs text-[#5b7288]">({history.length})</span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadHistory}
              disabled={history.length === 0}
              className="flex items-center gap-1 text-[11px] text-[#5b7288] hover:text-[#126fc8] transition disabled:opacity-30"
            >
              <Download className="h-3 w-3" /> Export
            </button>
            <button
              onClick={clearHistory}
              disabled={history.length === 0}
              className="flex items-center gap-1 text-[11px] text-[#5b7288] hover:text-red-500 transition disabled:opacity-30"
            >
              <Trash2 className="h-3 w-3" /> Clear
            </button>
          </div>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {history.length === 0 ? (
            <div className="text-center py-8 text-sm text-[#5b7288]">
              No exchanges yet. Send a JSON payload to GPT.
            </div>
          ) : (
            history.map((h) => (
              <div key={h.id} className="border-b border-[#dce6f1] px-4 py-3">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`h-2 w-2 rounded-full ${h.success ? "bg-[#22c55e]" : "bg-red-500"}`} />
                  <span className="text-xs font-mono font-bold text-[#06213b]">{h.action}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{
                    background: h.direction === "to_gpt" ? "rgba(18,111,200,0.1)" : h.direction === "from_gpt" ? "rgba(34,197,94,0.1)" : "rgba(0,0,0,0.05)",
                    color: h.direction === "to_gpt" ? "#126fc8" : h.direction === "from_gpt" ? "#22c55e" : "#5b7288"
                  }}>{h.direction}</span>
                  <span className="text-[10px] text-[#5b7288]">{new Date(h.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="grid lg:grid-cols-2 gap-2 mt-2">
                  <div>
                    <p className="text-[9px] font-bold uppercase mb-1 text-[#5b7288]">Request</p>
                    <pre className="text-[10px] font-mono whitespace-pre-wrap break-words max-h-24 overflow-auto text-[#126fc8]">
                      {JSON.stringify(h.request, null, 1)}
                    </pre>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase mb-1 text-[#5b7288]">{h.success ? "Response" : "Error"}</p>
                    <pre className="text-[10px] font-mono whitespace-pre-wrap break-words max-h-24 overflow-auto" style={{ color: h.success ? "#22c55e" : "#ef4444" }}>
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
      <div className="rounded-lg border border-[#dce6f1] bg-[#f4f8fd] p-4">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />
          <h3 className="text-sm font-bold text-[#06213b]">External GPT Connection</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg border border-[#dce6f1] bg-white p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide mb-1 text-[#5b7288]">Endpoint</p>
            <code className="font-mono break-all text-[11px] text-[#22c55e]">
              https://unlimitedwebsites.base44.app/functions/gptSyncEngine
            </code>
          </div>
          <div className="rounded-lg border border-[#dce6f1] bg-white p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide mb-1 text-[#5b7288]">Auth Header</p>
            <code className="font-mono break-all text-[11px] text-[#22c55e]">
              Authorization: Bearer &lt;GPT_SYNC_API_KEY&gt;
            </code>
          </div>
        </div>
      </div>
    </AdminSystemPage>
  );
}