import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  ArrowRight, ArrowLeft, Send, Loader2, CheckCircle2, AlertCircle,
  Copy, Trash2, Download, RefreshCw, Code2, Radio, Zap,
} from "lucide-react";

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
    <div className="wle-content">
      {/* Hero */}
      <div className="wle-hero">
        <div>
          <div className="wle-eyebrow">BI-DIRECTIONAL · JSON SYNC</div>
          <h1>JSON GPT Sync</h1>
          <p>Raw JSON payload editor for the bi-directional GPT sync engine. Compose requests, send to GPT, see JSON responses flow back.</p>
        </div>
        <div className="wle-hero-badge">◈ SYNC ENGINE</div>
      </div>

      {/* Stats */}
      <div className="wle-stats">
        <div className="wle-stat"><small>Endpoint</small><strong style={{ fontSize: "11px" }}>gptSyncEngine</strong></div>
        <div className="wle-stat"><small>Actions</small><strong>9</strong></div>
        <div className="wle-stat"><small>Direction</small><strong>Bi-directional</strong></div>
        <div className="wle-stat"><small>Status</small><strong style={{ color: "var(--launch-admin-accent-green)" }}>● LIVE</strong></div>
      </div>

      {/* Bi-directional flow indicator */}
      <div className="wle-panels">
        <section className="wle-panel" style={{ gridColumn: "1 / -1" }}>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-[var(--launch-admin-primary)]/20 bg-[var(--launch-admin-primary)]/5 p-3 flex items-center gap-3">
              <ArrowRight className="h-5 w-5 shrink-0" style={{ color: "var(--launch-admin-primary)" }} />
              <div>
                <p className="text-xs font-bold" style={{ color: "var(--launch-admin-primary)" }}>ADMIN → GPT</p>
                <p className="text-[10px]" style={{ color: "var(--launch-admin-muted)" }}>State changes, snapshots, events sent to GPT</p>
              </div>
            </div>
            <div className="rounded-lg border border-[var(--launch-admin-accent-green)]/20 bg-[var(--launch-admin-accent-green)]/5 p-3 flex items-center gap-3">
              <ArrowLeft className="h-5 w-5 shrink-0" style={{ color: "var(--launch-admin-accent-green)" }} />
              <div>
                <p className="text-xs font-bold" style={{ color: "var(--launch-admin-accent-green)" }}>GPT → ADMIN</p>
                <p className="text-[10px]" style={{ color: "var(--launch-admin-muted)" }}>Commands, takeovers, tool executions flow back</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Action selector */}
      <div className="wle-panels">
        <section className="wle-panel" style={{ gridColumn: "1 / -1" }}>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4" style={{ color: "var(--launch-admin-primary)" }} />
            <h3 className="text-sm font-bold" style={{ color: "var(--launch-admin-heading)" }}>Sync Action</h3>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
            {ACTIONS.map((a) => (
              <button
                key={a.value}
                onClick={() => handleActionChange(a.value)}
                className={`px-2 py-2 rounded-lg text-[11px] font-bold font-mono transition ${
                  action === a.value
                    ? "text-white shadow-sm"
                    : "border bg-white text-[var(--launch-admin-muted)] hover:border-[var(--launch-admin-primary)]/40"
                }`}
                style={action === a.value ? { background: "var(--launch-admin-primary)", borderColor: "var(--launch-admin-primary)" } : { borderColor: "var(--launch-admin-border)" }}
              >
                {a.label}
              </button>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--launch-admin-muted)" }}>
            <span className="font-mono" style={{ color: "var(--launch-admin-primary)" }}>{action}</span> — {currentAction?.desc}
          </p>
        </section>
      </div>

      {/* JSON Editor + Response */}
      <div className="wle-panels">
        {/* Request editor */}
        <section className="wle-panel">
          <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: "var(--launch-admin-border)", background: "var(--launch-admin-canvas)" }}>
            <div className="flex items-center gap-2">
              <ArrowRight className="h-3.5 w-3.5" style={{ color: "var(--launch-admin-primary)" }} />
              <span className="text-xs font-bold" style={{ color: "var(--launch-admin-heading)" }}>REQUEST JSON</span>
              <span className="text-[10px] font-mono" style={{ color: "var(--launch-admin-muted)" }}>action: {action}</span>
            </div>
            <button
              onClick={() => copy(jsonInput, "request")}
              className="flex items-center gap-1 text-[10px] transition"
              style={{ color: "var(--launch-admin-muted)" }}
            >
              {copiedField === "request" ? <CheckCircle2 className="h-3 w-3" style={{ color: "var(--launch-admin-accent-green)" }} /> : <Copy className="h-3 w-3" />}
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
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "var(--launch-admin-border)", background: "var(--launch-admin-canvas)" }}>
            <button
              onClick={() => setJsonInput(JSON.stringify(TEMPLATES[action], null, 2))}
              className="flex items-center gap-1.5 text-[11px] transition"
              style={{ color: "var(--launch-admin-muted)" }}
            >
              <RefreshCw className="h-3 w-3" /> Reset template
            </button>
            <button
              onClick={send}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50 transition shadow-sm"
              style={{ background: "var(--launch-admin-primary)" }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send to GPT
            </button>
          </div>
        </section>

        {/* Response viewer */}
        <section className="wle-panel">
          <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: "var(--launch-admin-border)", background: "var(--launch-admin-canvas)" }}>
            <div className="flex items-center gap-2">
              <ArrowLeft className="h-3.5 w-3.5" style={{ color: "var(--launch-admin-accent-green)" }} />
              <span className="text-xs font-bold" style={{ color: "var(--launch-admin-heading)" }}>RESPONSE JSON</span>
              {response && <span className="text-[10px] font-bold" style={{ color: "var(--launch-admin-accent-green)" }}>● OK</span>}
              {error && <span className="text-[10px] font-bold text-red-500">● ERROR</span>}
            </div>
            {response && (
              <button
                onClick={() => copy(response, "response")}
                className="flex items-center gap-1 text-[10px] transition"
                style={{ color: "var(--launch-admin-muted)" }}
              >
                {copiedField === "response" ? <CheckCircle2 className="h-3 w-3" style={{ color: "var(--launch-admin-accent-green)" }} /> : <Copy className="h-3 w-3" />}
                {copiedField === "response" ? "Copied" : "Copy"}
              </button>
            )}
          </div>
          <div className="min-h-[300px] max-h-[500px] overflow-auto p-4" style={{ background: "#0d1525" }}>
            {loading ? (
              <div className="flex items-center justify-center h-[280px]">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--launch-admin-primary)" }} />
              </div>
            ) : error ? (
              <div className="flex items-start gap-2 text-red-400 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <pre className="font-mono whitespace-pre-wrap break-words">{error}</pre>
              </div>
            ) : response ? (
              <pre className="font-mono text-xs whitespace-pre-wrap break-words leading-relaxed" style={{ color: "#6cc6ff" }}>
                {JSON.stringify(response, null, 2)}
              </pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-[280px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                <Code2 className="h-8 w-8 mb-2" />
                <p className="text-xs">Response will appear here</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Exchange history */}
      <div className="wle-panels">
        <section className="wle-panel" style={{ gridColumn: "1 / -1" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--launch-admin-border)" }}>
            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--launch-admin-heading)" }}>
              <Radio className="h-4 w-4" style={{ color: "var(--launch-admin-primary)" }} /> Exchange History
              <span className="text-xs" style={{ color: "var(--launch-admin-muted)" }}>({history.length})</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={downloadHistory}
                disabled={history.length === 0}
                className="flex items-center gap-1 text-[11px] transition disabled:opacity-30"
                style={{ color: "var(--launch-admin-muted)" }}
              >
                <Download className="h-3 w-3" /> Export
              </button>
              <button
                onClick={clearHistory}
                disabled={history.length === 0}
                className="flex items-center gap-1 text-[11px] transition disabled:opacity-30 hover:text-red-500"
                style={{ color: "var(--launch-admin-muted)" }}
              >
                <Trash2 className="h-3 w-3" /> Clear
              </button>
            </div>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {history.length === 0 ? (
              <div className="text-center py-8 text-sm" style={{ color: "var(--launch-admin-muted)" }}>
                No exchanges yet. Send a JSON payload to GPT.
              </div>
            ) : (
              history.map((h) => (
                <div key={h.id} className="border-b px-4 py-3" style={{ borderColor: "var(--launch-admin-border)" }}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`h-2 w-2 rounded-full ${h.success ? "" : "bg-red-500"}`} style={h.success ? { background: "var(--launch-admin-accent-green)" } : {}} />
                    <span className="text-xs font-mono font-bold" style={{ color: "var(--launch-admin-heading)" }}>{h.action}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{
                      background: h.direction === "to_gpt" ? "rgba(18,111,200,0.1)" : h.direction === "from_gpt" ? "rgba(34,197,94,0.1)" : "rgba(0,0,0,0.05)",
                      color: h.direction === "to_gpt" ? "var(--launch-admin-primary)" : h.direction === "from_gpt" ? "var(--launch-admin-accent-green)" : "var(--launch-admin-muted)"
                    }}>{h.direction}</span>
                    <span className="text-[10px]" style={{ color: "var(--launch-admin-muted)" }}>{new Date(h.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="grid lg:grid-cols-2 gap-2 mt-2">
                    <div>
                      <p className="text-[9px] font-bold uppercase mb-1" style={{ color: "var(--launch-admin-muted)" }}>Request</p>
                      <pre className="text-[10px] font-mono whitespace-pre-wrap break-words max-h-24 overflow-auto" style={{ color: "var(--launch-admin-primary)" }}>
                        {JSON.stringify(h.request, null, 1)}
                      </pre>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase mb-1" style={{ color: "var(--launch-admin-muted)" }}>{h.success ? "Response" : "Error"}</p>
                      <pre className="text-[10px] font-mono whitespace-pre-wrap break-words max-h-24 overflow-auto" style={{ color: h.success ? "var(--launch-admin-accent-green)" : "#ef4444" }}>
                        {h.success ? JSON.stringify(h.response, null, 1) : h.error}
                      </pre>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* External GPT connection info */}
      <div className="wle-panels">
        <section className="wle-panel" style={{ gridColumn: "1 / -1" }}>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4" style={{ color: "var(--launch-admin-accent-green)" }} />
            <h3 className="text-sm font-bold" style={{ color: "var(--launch-admin-heading)" }}>External GPT Connection</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border p-3" style={{ borderColor: "var(--launch-admin-border)", background: "var(--launch-admin-canvas)" }}>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "var(--launch-admin-muted)" }}>Endpoint</p>
              <code className="font-mono break-all text-[11px]" style={{ color: "var(--launch-admin-accent-green)" }}>
                https://unlimitedwebsites.base44.app/functions/gptSyncEngine
              </code>
            </div>
            <div className="rounded-lg border p-3" style={{ borderColor: "var(--launch-admin-border)", background: "var(--launch-admin-canvas)" }}>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "var(--launch-admin-muted)" }}>Auth Header</p>
              <code className="font-mono break-all text-[11px]" style={{ color: "var(--launch-admin-accent-green)" }}>
                Authorization: Bearer &lt;GPT_SYNC_API_KEY&gt;
              </code>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}