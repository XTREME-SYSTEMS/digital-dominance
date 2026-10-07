import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Boxes, Loader2, CheckCircle2, AlertTriangle, XCircle, Activity,
  Database, FunctionSquare, Bot, FileCode, Layers, Shield,
  Sparkles, Wand2, Globe, Cloud, MessageSquare, Brain, Zap,
  ChevronDown, ChevronUp, Search, RefreshCw, AlertOctagon
} from "lucide-react";

const CATEGORY_META = {
  visualizer: { icon: Wand2, color: "#D4AF37", label: "Visualizer" },
  website_builder: { icon: Boxes, color: "#3B82F6", label: "Website Builder" },
  seo_generator: { icon: Globe, color: "#10B981", label: "SEO Generator" },
  swarm: { icon: Activity, color: "#8B5CF6", label: "Swarm" },
  cloud_browser: { icon: Cloud, color: "#06B6D4", label: "Cloud Browser" },
  prompt_system: { icon: FileCode, color: "#F59E0B", label: "Prompt System" },
  super_agents: { icon: Bot, color: "#EF4444", label: "Super Agents" },
  ai_hub: { icon: Brain, color: "#EC4899", label: "AI Hub" },
  communications: { icon: MessageSquare, color: "#14B8A6", label: "Communications" },
  digital_dominance: { icon: Sparkles, color: "#D4AF37", label: "Digital Dominance" },
  template_studio: { icon: Layers, color: "#A855F7", label: "Template Studio" },
  provisioning: { icon: Zap, color: "#F97316", label: "Provisioning" },
  other: { icon: Boxes, color: "#6B7280", label: "Other" },
};

const STATUS_META = {
  analyzed: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100", label: "Analyzed" },
  integrating: { icon: Loader2, color: "text-amber-600", bg: "bg-amber-100", label: "Integrating" },
  integrated: { icon: CheckCircle2, color: "text-green-700", bg: "bg-green-200", label: "Integrated" },
  partial: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-100", label: "Partial" },
  failed_download: { icon: XCircle, color: "text-red-600", bg: "bg-red-100", label: "Download Failed" },
  pending: { icon: AlertOctagon, color: "text-stone-500", bg: "bg-stone-100", label: "Pending" },
};

export default function SystemLibrary() {
  const [systems, setSystems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const page = await base44.entities.SystemLibraryEntry.filter({}, { sort: "name", limit: 100 });
      setSystems(page.items || []);
    } catch (e) {
      console.error("SystemLibrary load failed:", e.message);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = systems.filter(s => {
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.name?.toLowerCase().includes(q) ||
        s.system_id?.toLowerCase().includes(q) ||
        s.capabilities?.some(c => c.toLowerCase().includes(q));
    }
    return true;
  });

  const stats = {
    total: systems.length,
    analyzed: systems.filter(s => s.status === "analyzed").length,
    integrated: systems.filter(s => s.status === "integrated").length,
    failed: systems.filter(s => s.status === "failed_download").length,
    avgHealth: systems.length > 0 ? Math.round(systems.reduce((a, s) => a + (s.health_score || 0), 0) / systems.length) : 0,
    totalEntities: systems.reduce((a, s) => a + (s.entity_count || 0), 0),
    totalFunctions: systems.reduce((a, s) => a + (s.function_count || 0), 0),
    totalAgents: systems.reduce((a, s) => a + (s.agent_count || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-stone-900 to-stone-800 p-6 text-white">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 grid place-items-center">
              <Boxes className="h-8 w-8 text-stone-950" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">System Library</h1>
              <p className="text-sm text-stone-400 mt-1">Forensic audit catalog of all uploaded systems — visual library for AI integration and reference</p>
            </div>
          </div>
          <button onClick={load} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-bold flex items-center gap-2 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mt-6">
          <StatBox label="Systems" value={stats.total} icon={Boxes} />
          <StatBox label="Analyzed" value={stats.analyzed} icon={CheckCircle2} color="text-green-400" />
          <StatBox label="Integrated" value={stats.integrated} icon={Shield} color="text-amber-400" />
          <StatBox label="Failed" value={stats.failed} icon={XCircle} color="text-red-400" />
          <StatBox label="Avg Health" value={`${stats.avgHealth}%`} icon={Activity} color="text-blue-400" />
          <StatBox label="Entities" value={stats.totalEntities} icon={Database} color="text-purple-400" />
          <StatBox label="Functions" value={stats.totalFunctions} icon={FunctionSquare} color="text-cyan-400" />
          <StatBox label="Agents" value={stats.totalAgents} icon={Bot} color="text-pink-400" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search systems, capabilities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm font-medium focus:border-amber-400 outline-none"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm font-bold focus:border-amber-400 outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="analyzed">Analyzed</option>
          <option value="integrating">Integrating</option>
          <option value="integrated">Integrated</option>
          <option value="partial">Partial</option>
          <option value="failed_download">Download Failed</option>
        </select>
      </div>

      {/* System Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-stone-200 rounded-2xl">
          <Boxes className="h-12 w-12 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500 font-medium">No systems found. Upload system packages to populate the library.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(sys => (
            <SystemCard
              key={sys.id}
              sys={sys}
              expanded={expanded === sys.id}
              onToggle={() => setExpanded(expanded === sys.id ? null : sys.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, icon: Icon, color = "text-white" }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-3">
      <Icon className={`w-4 h-4 ${color} mb-1`} />
      <div className="text-xl font-black text-white">{value}</div>
      <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wide">{label}</div>
    </div>
  );
}

function SystemCard({ sys, expanded, onToggle }) {
  const cat = CATEGORY_META[sys.category] || CATEGORY_META.other;
  const CatIcon = cat.icon;
  const status = STATUS_META[sys.status] || STATUS_META.pending;
  const StatusIcon = status.icon;

  const healthColor = sys.health_score >= 80 ? "text-green-600" : sys.health_score >= 50 ? "text-amber-600" : "text-red-600";
  const healthBg = sys.health_score >= 80 ? "bg-green-500" : sys.health_score >= 50 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className={`rounded-2xl border-2 bg-white overflow-hidden transition-all ${expanded ? "border-amber-400 shadow-lg" : "border-stone-200 hover:border-stone-300"}`}>
      {/* Card Header */}
      <div className="p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-12 w-12 rounded-xl grid place-items-center shrink-0" style={{ background: `${cat.color}15`, border: `1px solid ${cat.color}40` }}>
              <CatIcon className="h-6 w-6" style={{ color: cat.color }} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-black text-stone-900 truncate">{sys.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.bg} ${status.color} flex items-center gap-1`}>
                  <StatusIcon className="w-3 h-3" /> {status.label}
                </span>
                <span className="text-[10px] font-bold text-stone-500 uppercase">{cat.label}</span>
                {sys.priority === "critical" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">CRITICAL</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className={`text-2xl font-black ${healthColor}`}>{sys.health_score || 0}%</div>
            <div className="w-20 h-1.5 rounded-full bg-stone-100 overflow-hidden">
              <div className={`h-full ${healthBg}`} style={{ width: `${sys.health_score || 0}%` }} />
            </div>
          </div>
        </div>

        {/* Quick counts */}
        <div className="flex items-center gap-4 mt-3 text-xs text-stone-500 font-medium">
          <span className="flex items-center gap-1"><Database className="w-3.5 h-3.5" /> {sys.entity_count || 0} entities</span>
          <span className="flex items-center gap-1"><FunctionSquare className="w-3.5 h-3.5" /> {sys.function_count || 0} functions</span>
          <span className="flex items-center gap-1"><Bot className="w-3.5 h-3.5" /> {sys.agent_count || 0} agents</span>
          <span className="flex items-center gap-1"><FileCode className="w-3.5 h-3.5" /> {sys.page_count || 0} pages</span>
          {expanded ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-stone-100 p-4 space-y-4 bg-stone-50">
          {/* Capabilities */}
          {sys.capabilities?.length > 0 && (
            <div>
              <h4 className="text-xs font-black text-stone-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Capabilities
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {sys.capabilities.map((c, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-medium">{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Gaps */}
          {sys.gaps?.length > 0 && (
            <div>
              <h4 className="text-xs font-black text-stone-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Identified Gaps
              </h4>
              <div className="space-y-1">
                {sys.gaps.map((g, i) => (
                  <div key={i} className="text-xs text-stone-600 flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">▸</span> {g}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Integration Points */}
          {sys.integration_points?.length > 0 && (
            <div>
              <h4 className="text-xs font-black text-stone-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-blue-500" /> Integration Points
              </h4>
              <div className="space-y-1">
                {sys.integration_points.map((ip, i) => (
                  <div key={i} className="text-xs text-stone-600 flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">▸</span> {ip}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Agents */}
          {sys.key_agents?.length > 0 && (
            <div>
              <h4 className="text-xs font-black text-stone-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Bot className="w-3.5 h-3.5 text-pink-500" /> Key Agents
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {sys.key_agents.map((a, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-pink-50 border border-pink-200 text-pink-800 font-medium">{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Key Entities */}
          {sys.key_entities?.length > 0 && (
            <div>
              <h4 className="text-xs font-black text-stone-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-purple-500" /> Key Entities
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {sys.key_entities.slice(0, 15).map((e, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-800 font-medium">{e}</span>
                ))}
                {sys.key_entities.length > 15 && (
                  <span className="text-xs px-2.5 py-1 text-stone-500 font-medium">+{sys.key_entities.length - 15} more</span>
                )}
              </div>
            </div>
          )}

          {/* Audit Notes */}
          {sys.audit_notes && (
            <div>
              <h4 className="text-xs font-black text-stone-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                <FileCode className="w-3.5 h-3.5 text-stone-500" /> Audit Notes
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed bg-white rounded-lg p-3 border border-stone-200">{sys.audit_notes}</p>
            </div>
          )}

          {/* Source */}
          {sys.source_zip && (
            <div className="text-[10px] text-stone-400 font-mono">Source: {sys.source_zip}</div>
          )}
        </div>
      )}
    </div>
  );
}