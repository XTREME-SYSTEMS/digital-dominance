import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';
import { Target, Zap, TrendingUp, Search, CheckCircle2, AlertTriangle, Loader2, Rocket, Brain, Globe, DollarSign, Gauge, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';

const CATEGORY_META = {
  template_quality: { icon: Gauge, label: 'Template Quality', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  market_strategy: { icon: TrendingUp, label: 'Market Strategy', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  google_dominance: { icon: Globe, label: 'Google Dominance', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  technology_edge: { icon: Zap, label: 'Technology Edge', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  cost_optimization: { icon: DollarSign, label: 'Cost Optimization', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  customer_reach: { icon: Rocket, label: 'Customer Reach', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  competitive_intelligence: { icon: Search, label: 'Competitive Intel', color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/30' },
  system_sync: { icon: RefreshCw, label: 'System Sync', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' },
};

const PRIORITY_COLORS = {
  critical: 'bg-red-500/20 text-red-300 border-red-500/40',
  high: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  low: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
};

export default function StrategicCommander() {
  const [initiatives, setInitiatives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [activeTab, setActiveTab] = useState('initiatives');
  const [research, setResearch] = useState(null);
  const [error, setError] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    loadInitiatives();
    loadSyncStatus();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadInitiatives = async () => {
    try {
      const res = await base44.entities.StrategicInitiative.filter({}, { sort: '-roi_score', limit: 50 });
      setInitiatives(res.items || []);
    } catch (e) {
      setError(e.message);
    }
  };

  const loadSyncStatus = async () => {
    try {
      const res = await base44.functions.invoke('strategicCommanderEngine', { mode: 'sync_check' });
      setSyncStatus(res.data?.data || res.data);
    } catch (e) {
      console.error('Sync check failed:', e);
    }
  };

  const runAnalysis = async (focusArea = 'all') => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('strategicCommanderEngine', { mode: 'analyze', focus_area: focusArea });
      await loadInitiatives();
      setActiveTab('initiatives');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const runResearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('strategicCommanderEngine', { mode: 'research', topic: 'programmatic SEO for contractor niches 2025 - best practices, Google features, conversion optimization, and cost-efficient scaling' });
      setResearch(res.data?.data || res.data);
      setActiveTab('research');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const runFullStrategy = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('strategicCommanderEngine', { mode: 'full_strategy' });
      await loadInitiatives();
      setResearch(res.data?.data?.research || null);
      setActiveTab('initiatives');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const updateInitiativeStatus = async (id, status) => {
    try {
      await base44.entities.StrategicInitiative.update(id, { status });
      await loadInitiatives();
    } catch (e) {
      setError(e.message);
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatLoading(true);
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    try {
      const conv = base44.agents.createConversation({ agent_name: 'strategic_commander', metadata: { name: 'Strategy Session' } });
      const conversation = await conv;
      await base44.agents.addMessage(conversation, { role: 'user', content: userMsg });
      const updated = await base44.agents.getConversation(conversation.id);
      setChatMessages(prev => [...prev, ...(updated.messages?.slice(prev.length) || [])]);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  const sortedInitiatives = [...initiatives].sort((a, b) => (b.roi_score || 0) - (a.roi_score || 0));
  const stats = {
    total: initiatives.length,
    critical: initiatives.filter(i => i.priority === 'critical').length,
    executing: initiatives.filter(i => i.status === 'executing').length,
    completed: initiatives.filter(i => i.status === 'completed').length,
    avgImpact: initiatives.length ? Math.round(initiatives.reduce((s, i) => s + (i.impact_score || 0), 0) / initiatives.length) : 0,
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#00a2ff] to-[#0066cc] shadow-lg shadow-blue-500/20">
              <Brain className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Strategic Commander</h1>
              <p className="text-sm text-white/50">AI strategist that analyzes, researches, and executes to make everything 10/10</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => runAnalysis('all')} disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-[#00a2ff] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0090e0] disabled:opacity-50 transition">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
            Analyze & Identify
          </button>
          <button onClick={runResearch} disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-bold hover:bg-white/10 disabled:opacity-50 transition">
            <Search className="h-4 w-4" /> Research Market
          </button>
          <button onClick={runFullStrategy} disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-[#00a2ff]/40 bg-[#00a2ff]/10 px-4 py-2.5 text-sm font-bold text-[#00a2ff] hover:bg-[#00a2ff]/20 disabled:opacity-50 transition">
            <Zap className="h-4 w-4" /> Full Strategy Run
          </button>
        </div>
      </div>

      {/* Sync Status Bar */}
      {syncStatus && (
        <div className={`mb-4 flex items-center gap-3 rounded-xl border p-3 ${syncStatus.syncStatus === 'all_synced' ? 'border-green-500/30 bg-green-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
          {syncStatus.syncStatus === 'all_synced' ? <CheckCircle2 className="h-5 w-5 text-green-400" /> : <AlertTriangle className="h-5 w-5 text-amber-400" />}
          <div className="flex-1">
            <span className="text-sm font-bold">{syncStatus.syncStatus === 'all_synced' ? 'System Fully Synced' : `${syncStatus.issues?.length || 0} Issues Need Attention`}</span>
            {syncStatus.issues?.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-2">
                {syncStatus.issues.slice(0, 4).map((issue, i) => (
                  <span key={i} className={`text-xs px-2 py-0.5 rounded ${issue.severity === 'critical' ? 'bg-red-500/15 text-red-300' : issue.severity === 'high' ? 'bg-orange-500/15 text-orange-300' : 'bg-yellow-500/15 text-yellow-300'}`}>
                    {issue.area}: {issue.issue}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button onClick={loadSyncStatus} className="text-white/40 hover:text-white"><RefreshCw className="h-4 w-4" /></button>
        </div>
      )}

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Initiatives', value: stats.total, icon: Target, color: 'text-white' },
          { label: 'Critical Priority', value: stats.critical, icon: AlertTriangle, color: 'text-red-400' },
          { label: 'In Execution', value: stats.executing, icon: Zap, color: 'text-orange-400' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-green-400' },
          { label: 'Avg Impact Score', value: `${stats.avgImpact}/100`, icon: Gauge, color: 'text-blue-400' },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50">{s.label}</span>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="mt-1 text-2xl font-extrabold">{s.value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-white/10">
        {['initiatives', 'research', 'command'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-bold capitalize transition ${activeTab === tab ? 'text-[#00a2ff] border-b-2 border-[#00a2ff]' : 'text-white/40 hover:text-white/70'}`}>
            {tab === 'command' ? 'Command Chat' : tab}
          </button>
        ))}
      </div>

      {/* Initiatives Tab */}
      {activeTab === 'initiatives' && (
        <div className="space-y-3">
          {sortedInitiatives.length === 0 && !loading && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
              <Brain className="mx-auto h-12 w-12 text-white/20" />
              <p className="mt-4 text-white/50">No strategic initiatives yet. Click "Analyze & Identify" to let the Strategic Commander analyze your platform and generate the highest-impact action plan.</p>
            </div>
          )}
          {sortedInitiatives.map((init) => {
            const meta = CATEGORY_META[init.category] || CATEGORY_META.template_quality;
            const Icon = meta.icon;
            const isExpanded = expandedId === init.id;
            return (
              <div key={init.id} className={`rounded-xl border bg-white/5 transition ${isExpanded ? 'border-[#00a2ff]/40' : 'border-white/10'}`}>
                <button onClick={() => setExpandedId(isExpanded ? null : init.id)}
                  className="flex w-full items-center gap-3 p-4 text-left">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${meta.bg} ${meta.border} border`}>
                    <Icon className={`h-5 w-5 ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm truncate">{init.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded border ${PRIORITY_COLORS[init.priority] || PRIORITY_COLORS.medium}`}>{init.priority}</span>
                    </div>
                    <p className="text-xs text-white/40 mt-0.5">{meta.label} · ROI: {init.roi_score || 0}/100 · Impact: {init.impact_score || 0} · Effort: {init.effort_score || 0}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${init.status === 'completed' ? 'bg-green-500/15 text-green-300' : init.status === 'executing' ? 'bg-orange-500/15 text-orange-300' : 'bg-white/10 text-white/50'}`}>{init.status}</span>
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-white/40" /> : <ChevronRight className="h-4 w-4 text-white/40" />}
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-white/10 p-4 space-y-4">
                    <p className="text-sm text-white/70">{init.description}</p>
                    {init.expected_outcome && (
                      <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-3">
                        <p className="text-xs font-bold text-green-400 mb-1">Expected Outcome</p>
                        <p className="text-sm text-white/70">{init.expected_outcome}</p>
                      </div>
                    )}
                    {init.action_steps?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-white/50 mb-2">Action Steps</p>
                        <div className="space-y-1.5">
                          {init.action_steps.map((step, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm">
                              <span className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded text-xs ${step.done ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}`}>{step.done ? '✓' : i + 1}</span>
                              <span className={step.done ? 'text-white/40 line-through' : 'text-white/80'}>{step.step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {init.google_features?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {init.google_features.map((g, i) => (
                          <span key={i} className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-red-500/10 text-red-300 border border-red-500/20">
                            <Globe className="h-3 w-3" /> {g}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${init.cost_estimate === 'free' ? 'bg-green-500/15 text-green-300' : init.cost_estimate === 'low' ? 'bg-blue-500/15 text-blue-300' : 'bg-amber-500/15 text-amber-300'}`}>Cost: {init.cost_estimate}</span>
                      <div className="flex-1" />
                      {init.status === 'identified' && (
                        <button onClick={() => updateInitiativeStatus(init.id, 'executing')} className="text-xs font-bold px-3 py-1.5 rounded bg-[#00a2ff] text-white hover:bg-[#0090e0]">Start Executing</button>
                      )}
                      {init.status === 'executing' && (
                        <button onClick={() => updateInitiativeStatus(init.id, 'completed')} className="text-xs font-bold px-3 py-1.5 rounded bg-green-500/20 text-green-300 hover:bg-green-500/30">Mark Complete</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Research Tab */}
      {activeTab === 'research' && (
        <div className="space-y-4">
          {!research && !loading && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
              <Search className="mx-auto h-12 w-12 text-white/20" />
              <p className="mt-4 text-white/50">Click "Research Market" to get a deep competitive intelligence briefing.</p>
            </div>
          )}
          {research?.key_findings && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2"><Brain className="h-5 w-5 text-[#00a2ff]" /> Key Findings</h3>
              <div className="space-y-3">
                {research.key_findings.map((f, i) => (
                  <div key={i} className="rounded-lg bg-white/5 p-3">
                    <p className="text-sm font-bold text-white/90">{f.finding}</p>
                    {f.evidence && <p className="text-xs text-white/50 mt-1">{f.evidence}</p>}
                    {f.action && <p className="text-xs text-[#00a2ff] mt-1 font-bold">→ {f.action}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {research?.competitor_analysis && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2"><Search className="h-5 w-5 text-pink-400" /> Competitor Analysis</h3>
              <div className="space-y-3">
                {research.competitor_analysis.map((c, i) => (
                  <div key={i} className="rounded-lg bg-white/5 p-3">
                    <p className="text-sm font-bold">{c.name} {c.url && <a href={c.url} target="_blank" rel="noopener" className="text-xs text-[#00a2ff]">↗</a>}</p>
                    <p className="text-xs text-white/50 mt-1"><span className="text-green-400 font-bold">Strengths:</span> {c.strengths}</p>
                    <p className="text-xs text-white/50"><span className="text-red-400 font-bold">Gaps:</span> {c.gaps}</p>
                    <p className="text-xs text-white/50"><span className="text-[#00a2ff] font-bold">Our Edge:</span> {c.our_advantage}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {research?.google_opportunities && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2"><Globe className="h-5 w-5 text-red-400" /> Google Opportunities</h3>
              <div className="space-y-3">
                {research.google_opportunities.map((g, i) => (
                  <div key={i} className="rounded-lg bg-red-500/5 border border-red-500/20 p-3">
                    <p className="text-sm font-bold text-red-300">{g.feature}</p>
                    <p className="text-xs text-white/70 mt-1">{g.how_to_leverage}</p>
                    <p className="text-xs text-green-400 mt-1 font-bold">Impact: {g.expected_impact}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(research?.quick_wins?.length > 0 || research?.long_term_plays?.length > 0 || research?.cost_saving_ideas?.length > 0) && (
            <div className="grid md:grid-cols-3 gap-4">
              {research.quick_wins?.length > 0 && (
                <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                  <h4 className="text-sm font-bold text-green-400 mb-2">Quick Wins</h4>
                  <ul className="space-y-1.5 text-xs text-white/70">
                    {research.quick_wins.map((w, i) => <li key={i} className="flex gap-1.5"><span className="text-green-400">→</span> {w}</li>)}
                  </ul>
                </div>
              )}
              {research.long_term_plays?.length > 0 && (
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                  <h4 className="text-sm font-bold text-blue-400 mb-2">Long-Term Plays</h4>
                  <ul className="space-y-1.5 text-xs text-white/70">
                    {research.long_term_plays.map((w, i) => <li key={i} className="flex gap-1.5"><span className="text-blue-400">→</span> {w}</li>)}
                  </ul>
                </div>
              )}
              {research.cost_saving_ideas?.length > 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <h4 className="text-sm font-bold text-amber-400 mb-2">Cost Savings</h4>
                  <ul className="space-y-1.5 text-xs text-white/70">
                    {research.cost_saving_ideas.map((w, i) => <li key={i} className="flex gap-1.5"><span className="text-amber-400">→</span> {w}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Command Chat Tab */}
      {activeTab === 'command' && (
        <div className="rounded-xl border border-white/10 bg-white/5 flex flex-col" style={{ height: '600px' }}>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 && (
              <div className="text-center py-12">
                <Brain className="mx-auto h-10 w-10 text-white/20" />
                <p className="mt-3 text-sm text-white/50">Ask the Strategic Commander anything. It can analyze your platform, research the market, identify initiatives, and execute actions.</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {['Analyze my templates and make them 10/10', 'How do I launch nationwide cheaply?', 'What Google features should I use?', 'How do I get customers clicking and calling?'].map(s => (
                    <button key={s} onClick={() => setChatInput(s)} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10">{s}</button>
                  ))}
                </div>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div className={`max-w-[80%] rounded-xl p-3 ${msg.role === 'user' ? 'bg-[#00a2ff] text-white' : 'bg-white/10 text-white/90'}`}>
                  <ReactMarkdown className="text-sm prose prose-sm prose-invert max-w-none">{msg.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            {chatLoading && <div className="flex justify-start"><div className="bg-white/10 rounded-xl p-3"><Loader2 className="h-4 w-4 animate-spin text-white/50" /></div></div>}
            <div ref={chatEndRef} />
          </div>
          <div className="border-t border-white/10 p-3 flex gap-2">
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat()}
              placeholder="Command the Strategic Commander..."
              className="flex-1 rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#00a2ff]/50"
            />
            <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()}
              className="rounded-lg bg-[#00a2ff] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0090e0] disabled:opacity-50">
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}