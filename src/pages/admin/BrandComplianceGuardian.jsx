import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, RefreshCw, Zap, Eye, EyeOff, CheckCircle2, AlertTriangle, Loader2, Sparkles, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function BrandComplianceGuardian() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [enforcing, setEnforcing] = useState(false);
  const [simplifying, setSimplifying] = useState(false);
  const [error, setError] = useState(null);

  // Agent conversation state
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [agentRunning, setAgentRunning] = useState(false);
  const [conversations, setConversations] = useState([]);
  const messagesEndRef = useRef(null);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("brandComplianceScanner", { action: "status" });
      setStatus(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async () => {
    try {
      const list = await base44.agents.listConversations({ agent_name: "brand_compliance_guardian" });
      setConversations(list || []);
    } catch {
      setConversations([]);
    }
  };

  useEffect(() => {
    loadStatus();
    loadConversations();
  }, []);

  useEffect(() => {
    if (conversation) {
      const unsub = base44.agents.subscribeToConversation(conversation.id, (data) => {
        setMessages(data.messages || []);
        setAgentRunning(data.status === "running");
      });
      return () => unsub();
    }
  }, [conversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleEnforce = async () => {
    setEnforcing(true); setError(null);
    try {
      await base44.functions.invoke("brandComplianceScanner", { action: "enforce" });
      await loadStatus();
    } catch (e) { setError(e.message); }
    finally { setEnforcing(false); }
  };

  const handleScan = async () => {
    setScanning(true); setError(null);
    try {
      await base44.functions.invoke("brandComplianceScanner", { action: "scan" });
      await loadStatus();
    } catch (e) { setError(e.message); }
    finally { setScanning(false); }
  };

  const handleSimplify = async () => {
    setSimplifying(true); setError(null);
    try {
      await base44.functions.invoke("brandComplianceScanner", { action: "simplify" });
      await loadStatus();
    } catch (e) { setError(e.message); }
    finally { setSimplifying(false); }
  };

  const startConversation = async () => {
    const conv = await base44.agents.createConversation({
      agent_name: "brand_compliance_guardian",
      metadata: { name: "Brand Compliance Session" },
    });
    setConversation(conv);
    setMessages([]);
  };

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || agentRunning) return;
    if (!conversation) { await startConversation(); return; }
    setInput("");
    await base44.agents.addMessage(conversation, { role: "user", content: msg });
  };

  const score = status?.compliance_score ?? 100;
  const scoreColor = score >= 90 ? "text-green-600" : score >= 70 ? "text-amber-600" : "text-red-600";
  const scoreBg = score >= 90 ? "bg-green-100" : score >= 70 ? "bg-amber-100" : "bg-red-100";

  return (
    <div className="wle-content" style={{ background: "var(--launch-admin-canvas)" }}>
      {/* Hero */}
      <div className="wle-hero">
        <div>
          <div className="wle-eyebrow">AUTONOMOUS GUARDIAN</div>
          <h1>Brand Compliance Guardian</h1>
          <p>Continuously enforces the mandatory admin branding, keeps every page up to date, and hides over-complicated systems into the background.</p>
        </div>
        <div className="wle-hero-badge">
          <Shield className="h-5 w-5" style={{ color: "var(--launch-admin-primary)" }} />
          <span className="ml-2 text-sm font-bold" style={{ color: "var(--launch-admin-text)" }}>Guardian Active</span>
        </div>
      </div>

      {/* Stats */}
      <div className="wle-stats">
        <div className="wle-stat">
          <small>Compliance Score</small>
          <strong className={scoreColor}>{score}/100</strong>
        </div>
        <div className="wle-stat">
          <small>Deviations</small>
          <strong>{status?.deviations?.length || 0}</strong>
        </div>
        <div className="wle-stat">
          <small>Systems Hidden</small>
          <strong>{status?.hidden_systems?.length || 0}</strong>
        </div>
        <div className="wle-stat">
          <small>Last Audit</small>
          <strong style={{ fontSize: "13px" }}>{status?.last_audited_at ? new Date(status.last_audited_at).toLocaleDateString() : "—"}</strong>
        </div>
      </div>

      {/* Action buttons */}
      <div className="wle-panels">
        <section className="wle-panel" style={{ gridColumn: "1 / -1" }}>
          <div className="flex flex-wrap gap-3 mb-4">
            <button onClick={handleEnforce} disabled={enforcing}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 transition"
              style={{ background: "var(--launch-admin-primary)" }}>
              {enforcing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Enforce Branding
            </button>
            <button onClick={handleScan} disabled={scanning}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold disabled:opacity-50 transition border"
              style={{ borderColor: "var(--launch-admin-border)", color: "var(--launch-admin-text)" }}>
              {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              Scan for Deviations
            </button>
            <button onClick={handleSimplify} disabled={simplifying}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold disabled:opacity-50 transition border"
              style={{ borderColor: "var(--launch-admin-border)", color: "var(--launch-admin-text)" }}>
              {simplifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <EyeOff className="h-4 w-4" />}
              Simplify &amp; Hide Over-Complicated
            </button>
            <button onClick={loadStatus}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition border ml-auto"
              style={{ borderColor: "var(--launch-admin-border)", color: "var(--launch-admin-muted)" }}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>

          {error && (
            <div className="rounded-lg border p-3 text-sm mb-4" style={{ borderColor: "#fca5a5", background: "#fef2f2", color: "#dc2626" }}>
              {error}
            </div>
          )}

          {/* Deviations */}
          {status?.deviations?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold mb-3" style={{ color: "var(--launch-admin-heading)" }}>
                <AlertTriangle className="h-4 w-4 inline mr-1" /> Branding Deviations ({status.deviations.length})
              </h3>
              <div className="space-y-2">
                {status.deviations.map((d, i) => (
                  <div key={i} className="rounded-lg border p-3 text-sm" style={{ borderColor: "var(--launch-admin-border)", background: "var(--launch-admin-surface)" }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${d.severity === "high" ? "bg-red-100 text-red-700" : d.severity === "medium" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                        {d.severity?.toUpperCase()}
                      </span>
                      <span className="font-bold" style={{ color: "var(--launch-admin-text)" }}>{d.page}</span>
                    </div>
                    <p className="text-xs" style={{ color: "var(--launch-admin-muted)" }}>{d.issue}</p>
                    {d.recommended_fix && <p className="text-xs mt-1 italic" style={{ color: "var(--launch-admin-muted)" }}>→ {d.recommended_fix}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hidden systems */}
          {status?.hidden_systems?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold mb-3" style={{ color: "var(--launch-admin-heading)" }}>
                <EyeOff className="h-4 w-4 inline mr-1" /> Hidden Systems (moved to background)
              </h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {status.hidden_systems.map((s, i) => (
                  <div key={i} className="rounded-lg border p-3 text-sm" style={{ borderColor: "var(--launch-admin-border)", background: "var(--launch-admin-surface)", opacity: 0.7 }}>
                    <div className="flex items-center gap-2 mb-1">
                      <EyeOff className="h-3.5 w-3.5" style={{ color: "var(--launch-admin-muted)" }} />
                      <span className="font-bold text-xs" style={{ color: "var(--launch-admin-text)" }}>{s.name}</span>
                    </div>
                    <p className="text-[11px]" style={{ color: "var(--launch-admin-muted)" }}>{s.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit notes */}
          {status?.audit_notes && (
            <div className="rounded-lg border p-4" style={{ borderColor: "var(--launch-admin-border)", background: "var(--launch-admin-surface)" }}>
              <h3 className="text-sm font-bold mb-2" style={{ color: "var(--launch-admin-heading)" }}>
                <CheckCircle2 className="h-4 w-4 inline mr-1" style={{ color: "var(--launch-admin-accent-green)" }} /> Last Audit Notes
              </h3>
              <p className="text-sm" style={{ color: "var(--launch-admin-muted)" }}>{status.audit_notes}</p>
            </div>
          )}
        </section>
      </div>

      {/* Agent conversation */}
      <div className="wle-panels">
        <section className="wle-panel" style={{ gridColumn: "1 / -1" }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5" style={{ color: "var(--launch-admin-primary)" }} />
            <h2 className="text-lg font-bold" style={{ color: "var(--launch-admin-heading)" }}>Talk to the Guardian</h2>
          </div>

          {!conversation ? (
            <div className="text-center py-8">
              <p className="text-sm mb-4" style={{ color: "var(--launch-admin-muted)" }}>
                Start a conversation with the Brand Compliance Guardian to audit, enforce, or simplify your admin.
              </p>
              <button onClick={startConversation}
                className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-white transition"
                style={{ background: "var(--launch-admin-primary)" }}>
                <Sparkles className="h-4 w-4" /> Start Conversation
              </button>
            </div>
          ) : (
            <>
              <div className="rounded-lg border p-4 max-h-[400px] overflow-y-auto mb-3" style={{ borderColor: "var(--launch-admin-border)", background: "var(--launch-admin-surface)" }}>
                {messages.length === 0 && (
                  <p className="text-sm text-center py-4" style={{ color: "var(--launch-admin-muted)" }}>
                    Ask the guardian to audit branding, enforce the config, or simplify the admin.
                  </p>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} mb-3`}>
                    <div className={`max-w-[80%] rounded-lg p-3 text-sm ${m.role === "user" ? "text-white" : ""}`}
                      style={m.role === "user" ? { background: "var(--launch-admin-primary)" } : { background: "var(--launch-admin-canvas)", border: "1px solid var(--launch-admin-border)" }}>
                      {m.role === "user" ? m.content : <ReactMarkdown>{m.content}</ReactMarkdown>}
                    </div>
                  </div>
                ))}
                {agentRunning && (
                  <div className="flex justify-start mb-3">
                    <div className="rounded-lg p-3" style={{ background: "var(--launch-admin-canvas)", border: "1px solid var(--launch-admin-border)" }}>
                      <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--launch-admin-primary)" }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="flex gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="e.g. 'Audit all admin pages for branding compliance'"
                  className="flex-1 rounded-lg border px-4 py-2.5 text-sm outline-none"
                  style={{ borderColor: "var(--launch-admin-border)", background: "var(--launch-admin-surface)", color: "var(--launch-admin-text)" }}
                  disabled={agentRunning}
                />
                <button onClick={() => sendMessage()} disabled={agentRunning || !input.trim()}
                  className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: "var(--launch-admin-primary)" }}>
                  Send
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}