import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import {
  Shield, Database, Zap, Bot, Workflow, Globe, Key, FileCode, Boxes,
  Check, X, AlertTriangle, Loader2, Search, ChevronDown, ChevronRight,
  Layers, Cpu, Cloud, Lock, ArrowRight, Wrench,
} from "lucide-react";
import {
  ENTITY_CATEGORIES, FUNCTION_CATEGORIES, AGENTS, WORKFLOWS,
  CONNECTORS_AVAILABLE, PAGE_CATEGORIES, SECRET_CATEGORIES,
  CORE_INTEGRATIONS, INDEPENDENT_ROUTES, SYSTEM_GAPS,
} from "@/data/systemAuditInventory";

const STATUS_STYLES = {
  active: "bg-green-100 text-green-700 border-green-300",
  partial: "bg-amber-100 text-amber-700 border-amber-300",
  blocked: "bg-red-100 text-red-700 border-red-300",
  missing: "bg-stone-100 text-stone-500 border-stone-300",
  'needs-integration': "bg-blue-100 text-blue-700 border-blue-300",
};

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.missing;
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style} inline-flex items-center gap-1 whitespace-nowrap`}>
      {status === 'active' && <Check className="w-2.5 h-2.5" />}
      {status === 'blocked' && <X className="w-2.5 h-2.5" />}
      {status === 'partial' && <AlertTriangle className="w-2.5 h-2.5" />}
      {status === 'needs-integration' && <ArrowRight className="w-2.5 h-2.5" />}
      {status}
    </span>
  );
}

function CountCard({ icon: Icon, label, count, sub, color }) {
  return (
    <div className="rounded-2xl border-2 border-stone-200 bg-white p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-black text-stone-900 leading-none">{count}</div>
        <div className="text-xs font-bold text-stone-500 mt-0.5">{label}</div>
        {sub && <div className="text-[10px] text-stone-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function CategorySection({ title, items, collapsible = true }) {
  const [open, setOpen] = useState(!collapsible);
  return (
    <div className="rounded-2xl border-2 border-stone-200 bg-white overflow-hidden">
      <button
        onClick={() => collapsible && setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-3 ${collapsible ? 'hover:bg-stone-50 cursor-pointer' : ''}`}
      >
        <div className="flex items-center gap-2">
          {collapsible && (open ? <ChevronDown className="w-4 h-4 text-stone-400" /> : <ChevronRight className="w-4 h-4 text-stone-400" />)}
          <h3 className="text-sm font-bold text-stone-900">{title}</h3>
        </div>
        <span className="text-xs font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">{items.length}</span>
      </button>
      {open && (
        <div className="border-t border-stone-100 p-3 flex flex-wrap gap-1.5">
          {items.map((item, i) => (
            <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-stone-50 border border-stone-200 text-stone-700 font-medium">
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SystemAudit() {
  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [secretData, setSecretData] = useState(null);
  const [loadingSecrets, setLoadingSecrets] = useState(true);

  useEffect(() => {
    base44.functions.invoke('systemAuditInventory', {})
      .then(res => setSecretData(res.data))
      .catch(() => setSecretData(null))
      .finally(() => setLoadingSecrets(false));
  }, []);

  // Flatten all inventory for search
  const allItems = useMemo(() => {
    const items = [];
    Object.entries(ENTITY_CATEGORIES).forEach(([cat, list]) => list.forEach(e => items.push({ name: e, type: 'Entity', category: cat })));
    Object.entries(FUNCTION_CATEGORIES).forEach(([cat, list]) => list.forEach(f => items.push({ name: f, type: 'Function', category: cat })));
    AGENTS.forEach(a => items.push({ name: a.name, type: 'Agent', category: a.role }));
    WORKFLOWS.forEach(w => items.push({ name: w, type: 'Workflow', category: 'Automation' }));
    Object.entries(PAGE_CATEGORIES).forEach(([cat, list]) => list.forEach(p => items.push({ name: p, type: 'Page', category: cat })));
    CONNECTORS_AVAILABLE.forEach(c => items.push({ name: c.name, type: 'Connector', category: c.authorized ? 'Authorized' : 'Available' }));
    return items;
  }, []);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return allItems.filter(i => i.name.toLowerCase().includes(q) || i.type.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
  }, [search, allItems]);

  // Calculate counts
  const entityCount = Object.values(ENTITY_CATEGORIES).flat().length;
  const functionCount = Object.values(FUNCTION_CATEGORIES).flat().length;
  const pageCount = Object.values(PAGE_CATEGORIES).flat().length;
  const connectorAuthorized = CONNECTORS_AVAILABLE.filter(c => c.authorized).length;
  const connectorAvailable = CONNECTORS_AVAILABLE.length;
  const secretTotal = secretData?.secrets?.total || 0;
  const secretConfigured = secretData?.secrets?.configured || 0;
  const secretMissing = secretData?.secrets?.missing || [];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'have', label: 'What We Have', icon: Check },
    { id: 'dont', label: "What We Don't Have", icon: X },
    { id: 'needs', label: 'Integration Needs', icon: ArrowRight },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-stone-900 flex items-center justify-center shrink-0">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-stone-900">Full System Audit</h1>
          <p className="text-sm text-stone-500">Every entity, function, agent, workflow, connector, page, and secret — categorized with live status.</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search all 400+ system components..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-stone-200 bg-white text-sm font-medium text-stone-700 focus:border-stone-900 outline-none"
        />
        {searchResults.length > 0 && (
          <div className="mt-2 rounded-xl border-2 border-stone-200 bg-white p-3 max-h-64 overflow-y-auto">
            <div className="text-xs font-bold text-stone-400 mb-2">{searchResults.length} results</div>
            <div className="space-y-1">
              {searchResults.slice(0, 50).map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-xs py-1 px-2 rounded hover:bg-stone-50">
                  <span className="font-bold text-stone-400 w-20 shrink-0">{r.type}</span>
                  <span className="font-mono text-stone-800 font-semibold">{r.name}</span>
                  <span className="text-stone-400 ml-auto truncate">{r.category}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b-2 border-stone-200">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 -mb-0.5 transition ${
              tab === t.id ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {/* Count cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <CountCard icon={Database} label="Entities" count={entityCount} color="bg-blue-50 text-blue-600" />
            <CountCard icon={Zap} label="Functions" count={functionCount} color="bg-amber-50 text-amber-600" />
            <CountCard icon={Bot} label="Agents" count={AGENTS.length} color="bg-purple-50 text-purple-600" />
            <CountCard icon={Workflow} label="Workflows" count={WORKFLOWS.length} color="bg-green-50 text-green-600" />
            <CountCard icon={Globe} label="Connectors" count={`${connectorAuthorized}/${connectorAvailable}`} sub="authorized/available" color="bg-indigo-50 text-indigo-600" />
            <CountCard icon={FileCode} label="Pages" count={pageCount} color="bg-pink-50 text-pink-600" />
            <CountCard icon={Key} label="Secrets" count={`${secretConfigured}/${secretTotal}`} sub={loadingSecrets ? 'checking...' : `${secretMissing.length} missing`} color="bg-red-50 text-red-600" />
            <CountCard icon={Boxes} label="Components" count={377} color="bg-cyan-50 text-cyan-600" />
            <CountCard icon={Cloud} label="Indep. Routes" count={INDEPENDENT_ROUTES.filter(r => r.status === 'active').length} sub={`of ${INDEPENDENT_ROUTES.length}`} color="bg-emerald-50 text-emerald-600" />
            <CountCard icon={AlertTriangle} label="System Gaps" count={SYSTEM_GAPS.length} color="bg-orange-50 text-orange-600" />
          </div>

          {/* Integration health */}
          <div className="rounded-2xl border-2 border-stone-200 bg-white p-5">
            <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-stone-400" /> Integration Health
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Core integrations */}
              <div className="rounded-xl border border-stone-200 p-3">
                <div className="text-xs font-bold text-red-600 mb-2 flex items-center gap-1.5">
                  <X className="w-3.5 h-3.5" /> Blocked Core Integrations ({CORE_INTEGRATIONS.filter(c => c.status === 'blocked').length})
                </div>
                <div className="space-y-1">
                  {CORE_INTEGRATIONS.map(c => (
                    <div key={c.name} className="flex items-center gap-2 text-xs">
                      <X className="w-3 h-3 text-red-500 shrink-0" />
                      <span className="font-mono text-stone-700 font-semibold">{c.name}</span>
                      {c.replacement && (
                        <span className="text-stone-400 ml-auto text-[10px]">→ {c.replacement}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Independent routes */}
              <div className="rounded-xl border border-stone-200 p-3">
                <div className="text-xs font-bold text-green-600 mb-2 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Independent Replacements ({INDEPENDENT_ROUTES.filter(r => r.status === 'active').length} active)
                </div>
                <div className="space-y-1">
                  {INDEPENDENT_ROUTES.map(r => (
                    <div key={r.name} className="flex items-center gap-2 text-xs">
                      <StatusBadge status={r.status} />
                      <span className="font-semibold text-stone-700">{r.name}</span>
                      <span className="text-stone-400 ml-auto text-[10px] truncate">{r.replaces}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Secret status summary */}
          <div className="rounded-2xl border-2 border-stone-200 bg-white p-5">
            <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
              <Key className="w-4 h-4 text-stone-400" /> Secret Configuration Status
              {loadingSecrets && <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-400" />}
            </h3>
            {secretData ? (
              <div className="space-y-2">
                {Object.entries(SECRET_CATEGORIES).map(([cat, secrets]) => {
                  const configured = secrets.filter(s => secretData.secrets.all.find(sd => sd.name === s.name && sd.set)).length;
                  const total = secrets.length;
                  const pct = total > 0 ? (configured / total) * 100 : 0;
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-stone-600 w-40 shrink-0">{cat}</span>
                      <div className="flex-1 h-2 rounded-full bg-stone-100 overflow-hidden">
                        <div className={`h-full rounded-full ${pct === 100 ? 'bg-green-500' : pct > 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-bold text-stone-500 w-12 text-right">{configured}/{total}</span>
                    </div>
                  );
                })}
                {secretMissing.length > 0 && (
                  <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200">
                    <div className="text-xs font-bold text-red-600 mb-1.5">Missing Secrets ({secretMissing.length}):</div>
                    <div className="flex flex-wrap gap-1.5">
                      {secretMissing.map(s => (
                        <span key={s} className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-stone-400">{loadingSecrets ? 'Checking secrets...' : 'Unable to load secret status'}</div>
            )}
          </div>
        </div>
      )}

      {/* ── WHAT WE HAVE TAB ── */}
      {tab === 'have' && (
        <div className="space-y-4">
          {/* Entities */}
          <div>
            <h2 className="text-base font-black text-stone-900 mb-2 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-500" /> Data Layer — {entityCount} Entities
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(ENTITY_CATEGORIES).map(([cat, list]) => (
                <CategorySection key={cat} title={cat} items={list} />
              ))}
            </div>
          </div>

          {/* Functions */}
          <div>
            <h2 className="text-base font-black text-stone-900 mb-2 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" /> Backend Functions — {functionCount}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(FUNCTION_CATEGORIES).map(([cat, list]) => (
                <CategorySection key={cat} title={cat} items={list} />
              ))}
            </div>
          </div>

          {/* Agents */}
          <div>
            <h2 className="text-base font-black text-stone-900 mb-2 flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-500" /> AI Agents — {AGENTS.length}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {AGENTS.map(a => (
                <div key={a.name} className="rounded-xl border-2 border-stone-200 bg-white p-3">
                  <div className="text-xs font-mono font-bold text-stone-800 truncate">{a.name}</div>
                  <div className="text-[10px] text-stone-400 mt-0.5">{a.role}</div>
                  <div className="mt-1.5"><StatusBadge status={a.status} /></div>
                </div>
              ))}
            </div>
          </div>

          {/* Workflows */}
          <div>
            <h2 className="text-base font-black text-stone-900 mb-2 flex items-center gap-2">
              <Workflow className="w-5 h-5 text-green-500" /> Workflows — {WORKFLOWS.length}
            </h2>
            <div className="rounded-2xl border-2 border-stone-200 bg-white p-3 flex flex-wrap gap-1.5">
              {WORKFLOWS.map(w => (
                <span key={w} className="text-xs px-2.5 py-1 rounded-lg bg-green-50 border border-green-200 text-green-700 font-medium flex items-center gap-1.5">
                  <Workflow className="w-3 h-3" /> {w}
                </span>
              ))}
            </div>
          </div>

          {/* Pages */}
          <div>
            <h2 className="text-base font-black text-stone-900 mb-2 flex items-center gap-2">
              <FileCode className="w-5 h-5 text-pink-500" /> Pages & Routes — {pageCount}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(PAGE_CATEGORIES).map(([cat, list]) => (
                <CategorySection key={cat} title={cat} items={list} />
              ))}
            </div>
          </div>

          {/* Authorized Connectors */}
          <div>
            <h2 className="text-base font-black text-stone-900 mb-2 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-500" /> Connected Integrations — {connectorAuthorized}
            </h2>
            <div className="rounded-2xl border-2 border-green-200 bg-green-50/30 p-3 flex flex-wrap gap-1.5">
              {CONNECTORS_AVAILABLE.filter(c => c.authorized).map(c => (
                <span key={c.type} className="text-xs px-2.5 py-1 rounded-lg bg-green-100 border border-green-300 text-green-700 font-bold flex items-center gap-1.5">
                  <Check className="w-3 h-3" /> {c.name}
                </span>
              ))}
            </div>
          </div>

          {/* Configured Secrets */}
          <div>
            <h2 className="text-base font-black text-stone-900 mb-2 flex items-center gap-2">
              <Key className="w-5 h-5 text-red-500" /> Configured Secrets — {secretConfigured} of {secretTotal}
            </h2>
            <div className="space-y-2">
              {Object.entries(SECRET_CATEGORIES).map(([cat, secrets]) => (
                <div key={cat} className="rounded-xl border border-stone-200 bg-white p-3">
                  <div className="text-xs font-bold text-stone-600 mb-2">{cat}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {secrets.map(s => {
                      const isSet = secretData?.secrets?.all?.find(sd => sd.name === s.name && sd.set);
                      return (
                        <span key={s.name} className={`text-[10px] font-mono px-2 py-1 rounded-lg border flex items-center gap-1 ${
                          isSet ? 'bg-green-50 border-green-200 text-green-700' : 'bg-stone-50 border-stone-200 text-stone-400'
                        }`} title={s.purpose}>
                          {isSet ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                          {s.name}
                          {s.critical && <span className="text-red-500 font-bold">★</span>}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── WHAT WE DON'T HAVE TAB ── */}
      {tab === 'dont' && (
        <div className="space-y-4">
          {/* Blocked Core Integrations */}
          <div className="rounded-2xl border-2 border-red-200 bg-red-50/30 p-5">
            <h2 className="text-base font-black text-red-700 mb-3 flex items-center gap-2">
              <X className="w-5 h-5" /> Blocked Core Integrations (Credits Exhausted)
            </h2>
            <p className="text-xs text-stone-500 mb-3">
              These Base44 Core integrations are blocked because the workspace is out of integration credits. Credits reset 2026-10-12. Most have independent replacements already active.
            </p>
            <div className="space-y-2">
              {CORE_INTEGRATIONS.map(c => (
                <div key={c.name} className="flex items-center gap-3 rounded-xl border border-red-200 bg-white p-3">
                  <X className="w-4 h-4 text-red-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-mono font-bold text-stone-800">{c.name}</div>
                    <div className="text-xs text-stone-400">{c.note}</div>
                  </div>
                  {c.replacement ? (
                    <span className="text-xs font-bold text-green-600 flex items-center gap-1 shrink-0">
                      <Check className="w-3 h-3" /> → {c.replacement}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-red-600 flex items-center gap-1 shrink-0">
                      <AlertTriangle className="w-3 h-3" /> No replacement
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Available but not connected connectors */}
          <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/30 p-5">
            <h2 className="text-base font-black text-blue-700 mb-3 flex items-center gap-2">
              <Globe className="w-5 h-5" /> Available Connectors Not Connected — {CONNECTORS_AVAILABLE.filter(c => !c.authorized).length}
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {CONNECTORS_AVAILABLE.filter(c => !c.authorized).map(c => (
                <span key={c.type} className="text-xs px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-stone-500 font-medium">
                  {c.name}
                </span>
              ))}
            </div>
          </div>

          {/* Missing secrets */}
          {secretData && secretMissing.length > 0 && (
            <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/30 p-5">
              <h2 className="text-base font-black text-amber-700 mb-3 flex items-center gap-2">
                <Key className="w-5 h-5" /> Missing Secrets — {secretMissing.length}
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {secretMissing.map(s => (
                  <span key={s} className="text-xs font-mono px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-700 font-bold">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* System gaps */}
          <div className="rounded-2xl border-2 border-orange-200 bg-orange-50/30 p-5">
            <h2 className="text-base font-black text-orange-700 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> System Gaps — {SYSTEM_GAPS.length}
            </h2>
            <div className="space-y-2">
              {SYSTEM_GAPS.map((g, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-orange-200 bg-white p-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${g.severity === 'high' ? 'bg-red-500' : g.severity === 'medium' ? 'bg-amber-500' : 'bg-stone-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-stone-800">{g.gap}</div>
                    <div className="text-xs text-stone-500 mt-0.5">{g.action}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    g.severity === 'high' ? 'bg-red-100 text-red-700' : g.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-500'
                  }`}>{g.severity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── INTEGRATION NEEDS TAB ── */}
      {tab === 'needs' && (
        <div className="space-y-4">
          {/* Action items */}
          <div className="rounded-2xl border-2 border-stone-900 bg-white p-5">
            <h2 className="text-base font-black text-stone-900 mb-3 flex items-center gap-2">
              <Wrench className="w-5 h-5" /> Integration Action Items
            </h2>
            <div className="space-y-3">
              {/* 1. Connect more connectors */}
              <div className="rounded-xl border-2 border-blue-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center"><Globe className="w-4 h-4 text-blue-600" /></div>
                  <h3 className="text-sm font-bold text-stone-900">Connect More Integrations</h3>
                  <span className="ml-auto text-xs font-bold text-blue-600">{CONNECTORS_AVAILABLE.filter(c => !c.authorized).length} available</span>
                </div>
                <p className="text-xs text-stone-500 mb-2">High-value connectors not yet connected: Slack, Notion, Jira, Linear, Airtable, Salesforce, HubSpot (workspace), Microsoft Teams, Calendly, Mailchimp, Meta Ads, Facebook Pages, X (Twitter), WordPress, Contentful.</p>
                <div className="text-xs text-stone-400">→ Go to <span className="font-bold">Settings → Integrations</span> to connect</div>
              </div>

              {/* 2. Complete Google Workspace */}
              <div className="rounded-xl border-2 border-amber-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center"><Globe className="w-4 h-4 text-amber-600" /></div>
                  <h3 className="text-sm font-bold text-stone-900">Complete Google Workspace Suite</h3>
                  <span className="ml-auto text-xs font-bold text-amber-600">5 missing</span>
                </div>
                <p className="text-xs text-stone-500">Connected: Calendar, Search Console, Analytics, Drive, Sheets, Docs, Tasks. Missing: Google Meet, Forms, Contacts, Photos, BigQuery, Classroom.</p>
              </div>

              {/* 3. Missing secrets */}
              {secretData && secretMissing.length > 0 && (
                <div className="rounded-xl border-2 border-red-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center"><Key className="w-4 h-4 text-red-600" /></div>
                    <h3 className="text-sm font-bold text-stone-900">Set Missing Secrets</h3>
                    <span className="ml-auto text-xs font-bold text-red-600">{secretMissing.length} missing</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {secretMissing.map(s => (
                      <span key={s} className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">{s}</span>
                    ))}
                  </div>
                  <div className="text-xs text-stone-400 mt-2">→ Go to <span className="font-bold">Settings → Secrets</span> to set them</div>
                </div>
              )}

              {/* 4. Video generation gap */}
              <div className="rounded-xl border-2 border-orange-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-orange-600" /></div>
                  <h3 className="text-sm font-bold text-stone-900">Video Generation Has No Independent Replacement</h3>
                  <span className="ml-auto"><StatusBadge status="blocked" /></span>
                </div>
                <p className="text-xs text-stone-500">GenerateVideo is blocked by credits and has no independent route. Route through Vercel AI Gateway or external video provider.</p>
              </div>

              {/* 5. Database migration */}
              <div className="rounded-xl border-2 border-purple-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center"><Database className="w-4 h-4 text-purple-600" /></div>
                  <h3 className="text-sm font-bold text-stone-900">Complete Database Migration</h3>
                  <span className="ml-auto"><StatusBadge status="partial" /></span>
                </div>
                <p className="text-xs text-stone-500">SMAI portal is on Supabase. Main app still uses Base44 entities. Complete migration to Supabase PostgreSQL for full independence.</p>
              </div>

              {/* 6. Railway workers */}
              <div className="rounded-xl border-2 border-stone-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center"><Cpu className="w-4 h-4 text-stone-600" /></div>
                  <h3 className="text-sm font-bold text-stone-900">Deploy Railway Workers</h3>
                  <span className="ml-auto"><StatusBadge status="missing" /></span>
                </div>
                <p className="text-xs text-stone-500">Background job workers not deployed. Needed for autonomous workflows, scheduled tasks, and credit-independent automation.</p>
              </div>

              {/* 7. Admin consolidation */}
              <div className="rounded-xl border-2 border-stone-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center"><Layers className="w-4 h-4 text-stone-600" /></div>
                  <h3 className="text-sm font-bold text-stone-900">Consolidate Admin Pages</h3>
                  <span className="ml-auto text-xs font-bold text-stone-500">95 pages</span>
                </div>
                <p className="text-xs text-stone-500">95 admin pages is too many. Per radical subtraction mandate, consolidate redundant pages to ~12 core pages.</p>
              </div>
            </div>
          </div>

          {/* Independent routes status */}
          <div className="rounded-2xl border-2 border-stone-200 bg-white p-5">
            <h2 className="text-base font-black text-stone-900 mb-3 flex items-center gap-2">
              <Cloud className="w-5 h-5 text-emerald-500" /> Independent Route Status
            </h2>
            <div className="space-y-2">
              {INDEPENDENT_ROUTES.map(r => (
                <div key={r.name} className="flex items-center gap-3 rounded-xl border border-stone-200 p-3">
                  <StatusBadge status={r.status} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-stone-800">{r.name}</div>
                    <div className="text-xs text-stone-400">Replaces: {r.replaces}</div>
                  </div>
                  <span className="text-xs font-mono text-stone-400 shrink-0">→ {r.function}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}