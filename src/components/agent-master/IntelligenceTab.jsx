import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Upload, Plus, Trash2, Loader2, Share2, FileText, Search, Brain } from "lucide-react";

const INTEL_CATEGORIES = ["market_research","competitor_analysis","industry_trends","customer_insights","product_knowledge","sales_playbook","technical_docs","company_policy","brand_guidelines","seo_strategy","domain_strategy","operational_data","training_material","custom"];

export default function IntelligenceTab({ agent, agents }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    title: "",
    category: "custom",
    content: "",
    file_url: "",
    file_type: "",
    source: "operator_upload",
    access_level: "all_agents",
    assigned_agents: [],
    tags: [],
    importance: "medium",
  });

  const { data: intel, isLoading } = useQuery({
    queryKey: ["agent-intelligence"],
    queryFn: () => base44.entities.AgentIntelligence.filter({ active: true }, "-created_date", 100),
  });

  const filtered = (intel || []).filter(i => {
    if (search && !i.title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleCreate = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    try {
      const intelId = `intel-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      await base44.entities.AgentIntelligence.create({
        ...form,
        intelligence_id: intelId,
        assigned_agents: form.access_level === "assigned_only" ? [agent.id] : form.assigned_agents,
        created_at: new Date().toISOString(),
      });
      setForm({ title: "", category: "custom", content: "", file_url: "", file_type: "", source: "operator_upload", access_level: "all_agents", assigned_agents: [], tags: [], importance: "medium" });
      setShowForm(false);
      queryClient.invalidateQueries(["agent-intelligence"]);
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.AgentIntelligence.delete(id);
      queryClient.invalidateQueries(["agent-intelligence"]);
    } catch (e) { console.error(e); }
  };

  const handleFileUpload = async (file) => {
    try {
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      setForm(prev => ({ ...prev, file_url: res.file_url, file_type: file.name.split(".").pop(), source: "operator_upload" }));
    } catch (e) { console.error(e); }
  };

  const toggleAgentAssign = (agentId) => {
    setForm(prev => ({
      ...prev,
      assigned_agents: prev.assigned_agents.includes(agentId)
        ? prev.assigned_agents.filter(a => a !== agentId)
        : [...prev.assigned_agents, agentId],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-amber-600" />
          <h3 className="text-sm font-bold text-stone-900">Intelligence System</h3>
          <span className="text-xs text-stone-400">— upload, categorize, share with agents</span>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 text-stone-950 text-sm font-bold hover:bg-amber-400">
          <Plus className="h-4 w-4" /> {showForm ? "Cancel" : "Add Intelligence"}
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Title</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Intelligence document name..."
                className="w-full h-10 px-3 border border-stone-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full h-10 px-3 border border-stone-200 rounded-lg text-sm focus:border-amber-500 outline-none">
                {INTEL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Access Level</label>
              <select value={form.access_level} onChange={e => setForm({ ...form, access_level: e.target.value })}
                className="w-full h-10 px-3 border border-stone-200 rounded-lg text-sm focus:border-amber-500 outline-none">
                {["all_agents","category_only","assigned_only","owner_only"].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
            rows={4} placeholder="Intelligence content (or upload a file below)..."
            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:border-amber-500 outline-none resize-y" />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm text-stone-600 cursor-pointer hover:border-amber-400">
              <Upload className="h-4 w-4" />
              <span>{form.file_url ? "File uploaded ✓" : "Upload file"}</span>
              <input type="file" className="hidden" onChange={e => e.target.files[0] && handleFileUpload(e.target.files[0])} />
            </label>
            {form.file_url && <span className="text-xs text-stone-400 truncate">{form.file_url}</span>}
          </div>
          {form.access_level === "assigned_only" && (
            <div>
              <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1.5">Assign to specific agents</label>
              <div className="flex flex-wrap gap-2">
                {agents.map(a => (
                  <button key={a.id} onClick={() => toggleAgentAssign(a.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                      form.assigned_agents.includes(a.id) ? "bg-amber-500 text-stone-950 border-amber-500" : "bg-white text-stone-600 border-stone-200"
                    }`}>
                    {a.short_name || a.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button onClick={handleCreate} disabled={!form.title.trim() || !form.content.trim()}
            className="px-4 py-2 rounded-lg bg-amber-500 text-stone-950 text-sm font-bold hover:bg-amber-400 disabled:opacity-50">
            Save Intelligence
          </button>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search intelligence..."
          className="w-full h-10 pl-9 pr-3 border border-stone-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Brain className="h-8 w-8 text-stone-300 mb-2" />
          <p className="text-sm text-stone-400">No intelligence uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(i => (
            <div key={i.id} className="rounded-xl border border-stone-200 bg-white p-4 hover:border-amber-300 transition">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-stone-800 truncate">{i.title}</div>
                  <div className="text-xs text-stone-500 line-clamp-2 mt-0.5">{i.content}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-stone-100 text-stone-600">{i.category}</span>
                    <span className="text-[10px] text-stone-400">{i.access_level}</span>
                    {i.file_url && <FileText className="h-3 w-3 text-blue-500" />}
                  </div>
                </div>
                <button onClick={() => handleDelete(i.id)}
                  className="p-1.5 rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-500 shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}