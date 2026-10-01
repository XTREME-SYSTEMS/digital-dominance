import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Globe, Loader2, AlertCircle, RefreshCw, Plus, Zap, Search, TrendingUp,
  Activity, Users, Eye, MousePointer, Heart, Shield, Server, Award,
  ChevronDown, ChevronRight, ExternalLink, Trash2, Bot, Sparkles
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function DomainOperations() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [domains, setDomains] = useState([]);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [newDomain, setNewDomain] = useState('');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [conversation, setConversation] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, listRes] = await Promise.all([
        base44.functions.invoke('domainOperationsAgent', { action: 'getStatus' }),
        base44.functions.invoke('domainOperationsAgent', { action: 'listDomains' }),
      ]);
      setStatus(statusRes.data);
      setDomains(listRes.data?.domains || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const addDomain = async () => {
    if (!newDomain.trim()) return;
    setAdding(true);
    setError(null);
    try {
      await base44.functions.invoke('domainOperationsAgent', { action: 'addDomain', domain: newDomain.trim() });
      setNewDomain('');
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
    setAdding(false);
  };

  const processDomain = async (domainId) => {
    setProcessing(true);
    try {
      await base44.functions.invoke('domainOperationsAgent', { action: 'processDomain', domainId });
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
    setProcessing(false);
  };

  const processAll = async () => {
    setProcessing(true);
    try {
      await base44.functions.invoke('domainOperationsAgent', { action: 'processBatch', batchSize: 10 });
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
    setProcessing(false);
  };

  const deleteDomain = async (domainId) => {
    try {
      await base44.functions.invoke('domainOperationsAgent', { action: 'deleteDomain', domainId });
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const toggleRow = (id) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Agent chat
  const startConversation = async () => {
    if (conversation) return conversation;
    const conv = base44.agents.createConversation({
      agent_name: 'domain_operations',
      metadata: { name: 'Strategic Insights', description: 'Domain Operations Agent' },
    });
    setConversation(conv);
    return conv;
  };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: msg }]);
    setChatLoading(true);
    try {
      const conv = await startConversation();
      base44.agents.addMessage(conv, { role: 'user', content: msg });
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    }
    setChatLoading(false);
  };

  useEffect(() => {
    if (!conversation) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setChatMessages(data.messages || []);
    });
    return () => unsubscribe();
  }, [conversation]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 text-amber-500 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-stone-900 flex items-center gap-3">
            <Bot className="h-7 w-7 text-amber-600" />
            Strategic Insights — Domain Operations Agent
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Autonomous agent: add a domain and it handles Search Console, Analytics, sitemaps, competitors, and site health end-to-end.
          </p>
        </div>
        <button
          onClick={processAll}
          disabled={processing || domains.length === 0}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2 text-sm font-bold text-stone-950 hover:bg-amber-400 transition disabled:opacity-50"
        >
          {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          {processing ? 'Processing...' : 'Process All Domains'}
        </button>
      </div>

      {/* Connection status */}
      {status && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard icon={Globe} label="Total Domains" value={status.total} color="text-stone-700" />
          <StatCard icon={Award} label="Active" value={status.active} color="text-green-600" />
          <StatCard icon={Loader2} label="Onboarding" value={status.onboarding} color="text-amber-600" />
          <StatCard icon={Shield} label="GSC Connected" value={status.gscConnected ? '✓' : '✗'} color={status.gscConnected ? 'text-green-600' : 'text-red-600'} />
          <StatCard icon={TrendingUp} label="GA Connected" value={status.gaConnected ? '✓' : '✗'} color={status.gaConnected ? 'text-green-600' : 'text-red-600'} />
        </div>
      )}

      {/* Add domain */}
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-amber-600" />
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addDomain()}
            placeholder="Enter a domain (e.g. benearme.com)"
            className="flex-1 px-4 py-2 rounded-lg border border-stone-300 text-sm focus:border-amber-500 focus:outline-none"
          />
          <button
            onClick={addDomain}
            disabled={adding || !newDomain.trim()}
            className="flex items-center gap-2 rounded-lg bg-stone-900 px-5 py-2 text-sm font-bold text-white hover:bg-stone-800 transition disabled:opacity-50"
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add Domain
          </button>
        </div>
        <p className="text-xs text-stone-400 mt-2">The agent will register the domain, add it to Search Console, submit sitemaps, pull analytics, scan competitors, and check site health — all automatically.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Domain list */}
      <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
        {domains.length === 0 ? (
          <div className="p-12 text-center">
            <Globe className="h-10 w-10 text-stone-300 mx-auto mb-3" />
            <p className="text-sm text-stone-500 mb-2">No domains registered yet.</p>
            <p className="text-xs text-stone-400">Add a domain above and the agent will handle everything end-to-end.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {domains.map((d) => {
              const expanded = expandedRows.has(d.id);
              const topQueries = (() => { try { return JSON.parse(d.gsc_top_queries || '[]'); } catch { return []; } })();
              const health = (() => { try { return JSON.parse(d.site_health || '{}'); } catch { return {}; } })();
              return (
                <div key={d.id} className="hover:bg-stone-50">
                  <div className="w-full flex items-center gap-3 px-4 py-3">
                    <button onClick={() => toggleRow(d.id)} className="shrink-0">
                      {expanded ? <ChevronDown className="h-4 w-4 text-stone-400" /> : <ChevronRight className="h-4 w-4 text-stone-400" />}
                    </button>
                    <span className="font-mono text-sm font-bold text-stone-800 flex-1 truncate">{d.domain}</span>
                    {d.health_score > 0 && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${d.health_score >= 70 ? 'bg-green-50 text-green-700' : d.health_score >= 40 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                        Health: {d.health_score}
                      </span>
                    )}
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      d.status === 'active' ? 'bg-green-50 text-green-700' :
                      d.status === 'onboarding' ? 'bg-amber-50 text-amber-700' :
                      d.status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-stone-100 text-stone-500'
                    }`}>{d.status}</span>
                    <button onClick={() => processDomain(d.id)} disabled={processing} className="text-xs text-amber-600 hover:text-amber-700 font-semibold disabled:opacity-50">
                      Process
                    </button>
                    <button onClick={() => deleteDomain(d.id)} className="text-stone-300 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {expanded && (
                    <div className="px-4 pb-4 space-y-4 bg-stone-50/50">
                      {/* Quick stats */}
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                        <MiniStat icon={MousePointer} label="GSC Clicks" value={d.gsc_clicks || 0} color="text-green-600" />
                        <MiniStat icon={Eye} label="GSC Impressions" value={d.gsc_impressions || 0} color="text-blue-600" />
                        <MiniStat icon={Activity} label="GA Sessions" value={d.ga_sessions || 0} color="text-purple-600" />
                        <MiniStat icon={Users} label="GA Users" value={d.ga_users || 0} color="text-amber-600" />
                        <MiniStat icon={Globe} label="Competitors" value={d.competitors?.length || 0} color="text-stone-600" />
                        <MiniStat icon={Server} label="Sitemap URLs" value={d.sitemap_url_count || 0} color="text-stone-600" />
                      </div>

                      {/* AI Insights */}
                      {d.ai_insights && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                          <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5" /> Agent Insights — What To Do Next
                          </p>
                          <ReactMarkdown className="text-sm text-stone-700 prose prose-sm max-w-none">{d.ai_insights}</ReactMarkdown>
                        </div>
                      )}

                      {/* Site health */}
                      <div>
                        <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Site Health</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <HealthItem label="HTTP Status" value={health.httpStatus || 'unknown'} ok={health.httpStatus === 200} />
                          <HealthItem label="SSL" value={health.ssl ? 'Yes' : 'No'} ok={health.ssl} />
                          <HealthItem label="Sitemap" value={health.sitemap ? `${health.sitemapUrlCount || 0} URLs` : 'Missing'} ok={health.sitemap} />
                          <HealthItem label="Robots.txt" value={health.robots ? 'Found' : 'Missing'} ok={health.robots} />
                        </div>
                      </div>

                      {/* Top queries */}
                      {topQueries.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Top Search Queries (30d)</p>
                          <div className="flex flex-wrap gap-1.5">
                            {topQueries.slice(0, 10).map((q, i) => (
                              <span key={i} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded">
                                {q.query} <span className="text-blue-400">· {q.clicks}c / {q.impressions}i</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Competitors */}
                      {d.competitors?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Competitors Found</p>
                          <div className="flex flex-wrap gap-1.5">
                            {d.competitors.map((c, i) => (
                              <a key={i} href={`https://${c}`} target="_blank" rel="noopener noreferrer" className="text-xs font-mono bg-stone-100 text-stone-600 px-2 py-1 rounded hover:bg-stone-200 flex items-center gap-1">
                                {c}<ExternalLink className="h-3 w-3" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Issues */}
                      {d.issues?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-red-500 uppercase tracking-wide mb-2">Issues</p>
                          <div className="space-y-1">
                            {d.issues.map((issue, i) => (
                              <p key={i} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">{issue}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions taken */}
                      {d.actions_taken?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Actions Taken ({d.actions_taken.length})</p>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {d.actions_taken.slice(-10).map((a, i) => (
                              <p key={i} className="text-xs text-stone-500 font-mono">{a}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      {d.last_analyzed_at && (
                        <p className="text-xs text-stone-400">Last analyzed: {new Date(d.last_analyzed_at).toLocaleString()}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Agent Chat */}
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-bold text-stone-800 flex items-center gap-2 mb-3">
          <Bot className="h-4 w-4 text-amber-600" />
          Chat with Strategic Insights Agent
        </h2>
        <div className="space-y-2 max-h-64 overflow-y-auto mb-3">
          {chatMessages.length === 0 ? (
            <p className="text-xs text-stone-400 text-center py-4">Ask the agent to add a domain, check performance, or scan competitors. Example: "Add domain benearme.com and process it"</p>
          ) : (
            chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-amber-500 text-stone-950' : 'bg-stone-100 text-stone-700'}`}>
                  {msg.role === 'assistant' ? <ReactMarkdown className="prose prose-sm max-w-none">{msg.content}</ReactMarkdown> : msg.content}
                </div>
              </div>
            ))
          )}
          {chatLoading && <div className="flex justify-start"><div className="bg-stone-100 rounded-lg px-3 py-2"><Loader2 className="h-4 w-4 text-stone-400 animate-spin" /></div></div>}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendChat()}
            placeholder="Ask the agent..."
            className="flex-1 px-3 py-2 rounded-lg border border-stone-300 text-sm focus:border-amber-500 focus:outline-none"
          />
          <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-bold text-white hover:bg-stone-800 disabled:opacity-50">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-xs text-stone-400 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-xl font-black text-stone-900">{value}</p>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-stone-100">
      <Icon className={`h-3.5 w-3.5 ${color}`} />
      <div>
        <p className="text-xs font-bold text-stone-900">{value}</p>
        <p className="text-[10px] text-stone-400">{label}</p>
      </div>
    </div>
  );
}

function HealthItem({ label, value, ok }) {
  return (
    <div className="flex items-center justify-between p-2 rounded bg-white border border-stone-100">
      <span className="text-stone-500">{label}</span>
      <span className={`font-bold ${ok ? 'text-green-600' : 'text-red-500'}`}>{value}</span>
    </div>
  );
}