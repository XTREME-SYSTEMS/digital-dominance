import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { base44 } from "@/api/base44Client";
import {
  Plus, Trash2, Pencil, GripVertical, X, Check,
  RefreshCw, Search, LayoutGrid, ArrowRight, Eye, EyeOff,
  Sparkles, Shield, Layers, Boxes, Package, Zap, Globe, Crown, Wand2,
  Bot, Network, Gauge, Rocket, Wrench, Brain, Building2, Cpu, Compass,
  Workflow, BookOpen, Users, KanbanSquare, Mail, Star,
  Radar, MapPin, MessageSquare, Smartphone, PhoneCall, Share2, BarChart3,
  Activity, KeyRound, Factory, Layout, ListOrdered, Code2, TrendingUp,
  Heart, ScrollText, Database, Target, Settings, UserCircle, Menu,
  Grid3x3, FolderTree, Bookmark, Flag, Tag, Hash, Server, CreditCard,
  CheckCircle2, FolderPlus, SlidersHorizontal,
} from "lucide-react";
import CategoryManager, { ICON_MAP, COLOR_OPTIONS } from "@/components/contents/CategoryManager";

const ALL_ICONS = {
  ...ICON_MAP,
  Server, CreditCard, CheckCircle2,
};

// === Researched categories for developers, software engineers, and AI consultants ===
const DEFAULT_CATEGORIES = [
  { name: "Command & Control", icon: "Crown", color_class: "border-amber-300 bg-amber-50/50", description: "Dashboards, command centers, and system-wide overview tools" },
  { name: "Architecture & Design", icon: "Compass", color_class: "border-stone-300 bg-stone-50/50", description: "System architecture, blueprints, design patterns, and technical specs" },
  { name: "Development & Code", icon: "Code2", color_class: "border-slate-300 bg-slate-50/50", description: "Code editors, repositories, build tools, and code generation" },
  { name: "AI & Agents", icon: "Bot", color_class: "border-blue-300 bg-blue-50/50", description: "LLM models, agent builders, prompt engineering, and multi-agent swarms" },
  { name: "Data & Storage", icon: "Database", color_class: "border-orange-300 bg-orange-50/50", description: "Databases, migrations, schemas, file storage, and vector DBs" },
  { name: "Infrastructure & DevOps", icon: "Server", color_class: "border-emerald-300 bg-emerald-50/50", description: "Hosting, deployment, CI/CD, servers, containers, and environments" },
  { name: "APIs & Integrations", icon: "KeyRound", color_class: "border-cyan-300 bg-cyan-50/50", description: "API keys, connectors, webhooks, third-party services, and OAuth" },
  { name: "Security & Access", icon: "Shield", color_class: "border-red-300 bg-red-50/50", description: "Auth, secrets, vaults, permissions, compliance, and RLS" },
  { name: "Testing & QA", icon: "CheckCircle2", color_class: "border-green-300 bg-green-50/50", description: "Test suites, regression, validation, benchmarking, and health checks" },
  { name: "Documentation & Knowledge", icon: "BookOpen", color_class: "border-indigo-300 bg-indigo-50/50", description: "Docs, wikis, SOPs, playbooks, system library, and RAG" },
  { name: "Monitoring & Analytics", icon: "Activity", color_class: "border-purple-300 bg-purple-50/50", description: "Logs, metrics, dashboards, observability, and traffic analytics" },
  { name: "Automation & Workflows", icon: "Workflow", color_class: "border-pink-300 bg-pink-50/50", description: "Scheduled tasks, pipelines, orchestration, and cron jobs" },
  { name: "Content & SEO", icon: "Globe", color_class: "border-cyan-300 bg-cyan-50/50", description: "Content generation, SEO optimization, templates, and landing pages" },
  { name: "Communications", icon: "MessageSquare", color_class: "border-pink-300 bg-pink-50/50", description: "Email, SMS, voice, notifications, and social media" },
  { name: "CRM & Leads", icon: "Users", color_class: "border-orange-300 bg-orange-50/50", description: "Lead management, pipeline, customers, and contacts" },
  { name: "Marketing & Growth", icon: "TrendingUp", color_class: "border-purple-300 bg-purple-50/50", description: "Campaigns, ads, analytics, and growth experiments" },
  { name: "Billing & Payments", icon: "CreditCard", color_class: "border-emerald-300 bg-emerald-50/50", description: "Subscriptions, checkout, invoices, and commerce" },
];

const DEFAULT_ITEMS = [
  { name: "Concrete Opportunities", path: "/admin", icon: "Sparkles", category: "Command & Control", description: "Opportunity intelligence dashboard" },
  { name: "Master Pipeline", path: "/admin/master-pipeline", icon: "ListOrdered", category: "Command & Control", description: "Master pipeline view" },
  { name: "Command Center", path: "/admin/command-center", icon: "Crown", category: "Command & Control", description: "Central command hub" },
  { name: "Settings", path: "/admin/settings", icon: "Settings", category: "Command & Control", description: "Admin settings" },
  { name: "Provider Vault", path: "/admin/provider-vault", icon: "Shield", category: "Security & Access", description: "Provider credentials vault" },
  { name: "System Vault", path: "/admin/vault", icon: "Shield", category: "Security & Access", description: "System secrets vault" },
  { name: "API Keys", path: "/admin/api-keys", icon: "KeyRound", category: "APIs & Integrations", description: "API key manager" },
  { name: "System Independence", path: "/admin/independence", icon: "Shield", category: "Infrastructure & DevOps", description: "Independence status" },
  { name: "Website Factory", path: "/admin/website-factory", icon: "Factory", category: "Infrastructure & DevOps", description: "Website factory" },
  { name: "App Factory", path: "/admin/app-factory", icon: "Smartphone", category: "Infrastructure & DevOps", description: "App factory" },
  { name: "Templates", path: "/admin/templates", icon: "Layout", category: "Infrastructure & DevOps", description: "Template manager" },
  { name: "Vision Studio", path: "/admin/vision-studio", icon: "Wand2", category: "AI & Agents", description: "Vision to ship pipeline" },
  { name: "Agent Builder", path: "/admin/agent-builder", icon: "Bot", category: "AI & Agents", description: "Build AI agents" },
  { name: "Agent Master", path: "/admin/agent-master", icon: "Bot", category: "AI & Agents", description: "Manage AI agents" },
  { name: "Swarm Command", path: "/admin/swarm", icon: "Network", category: "AI & Agents", description: "Agent swarm control" },
  { name: "Convergence Engine", path: "/admin/convergence", icon: "Shield", category: "AI & Agents", description: "Convergence monitoring" },
  { name: "Meta Agent", path: "/admin/meta-agent", icon: "Brain", category: "AI & Agents", description: "Meta agent" },
  { name: "Vision Cortex V2", path: "/admin/vision-cortex-v2", icon: "Sparkles", category: "AI & Agents", description: "Vision cortex v2" },
  { name: "System Health", path: "/admin/system-health", icon: "Gauge", category: "Monitoring & Analytics", description: "System health monitor" },
  { name: "Analytics", path: "/admin/analytics", icon: "Activity", category: "Monitoring & Analytics", description: "GA traffic analytics" },
  { name: "Intelligence", path: "/admin/intelligence", icon: "Brain", category: "Monitoring & Analytics", description: "Intelligence hub" },
  { name: "Competitors", path: "/admin/competitors", icon: "Radar", category: "Monitoring & Analytics", description: "Competitor tracking" },
  { name: "Crystal Ball", path: "/admin/crystal-ball", icon: "Sparkles", category: "Monitoring & Analytics", description: "Predictive insights" },
  { name: "Digital Dominance", path: "/admin/digital-dominance", icon: "Crown", category: "Marketing & Growth", description: "Digital dominance tools" },
  { name: "Autonomous Dominance", path: "/admin/autonomous-dominance", icon: "Crown", category: "Marketing & Growth", description: "Autonomous dominance system" },
  { name: "Dominance Sandbox", path: "/admin/dominance-sandbox", icon: "Rocket", category: "Marketing & Growth", description: "Dominance sandbox" },
  { name: "Builder Library", path: "/admin/builder-library", icon: "Sparkles", category: "Development & Code", description: "Builder library" },
  { name: "X1 Company", path: "/admin/x1-company", icon: "Building2", category: "Development & Code", description: "X1 company builder" },
  { name: "GPT Pack Sync", path: "/admin/pack-sync", icon: "Package", category: "Development & Code", description: "Pack sync" },
  { name: "Code Studio", path: "/admin/code-studio", icon: "Code2", category: "Development & Code", description: "Code studio" },
  { name: "Template Studio", path: "/admin/template-studio", icon: "Layers", category: "Content & SEO", description: "Universal template studio" },
  { name: "God Mode Lab", path: "/admin/god-mode-lab", icon: "Cpu", category: "Command & Control", description: "Monte Carlo simulation + portfolio strategy" },
  { name: "Google SEO", path: "/admin/google", icon: "Globe", category: "Content & SEO", description: "Google SEO tools" },
  { name: "SEO Generator", path: "/admin/seo-generator", icon: "TrendingUp", category: "Content & SEO", description: "SEO content generator" },
  { name: "SEO Dominance", path: "/admin/seo-dominance", icon: "Rocket", category: "Content & SEO", description: "SEO dominance" },
  { name: "System Library", path: "/admin/system-library", icon: "Boxes", category: "Documentation & Knowledge", description: "System library catalog" },
  { name: "Leads", path: "/admin/leads", icon: "Users", category: "CRM & Leads", description: "Lead management" },
  { name: "Pipeline", path: "/admin/pipeline", icon: "KanbanSquare", category: "CRM & Leads", description: "Pipeline kanban" },
  { name: "Lead Scraper", path: "/admin/lead-scraper", icon: "Radar", category: "CRM & Leads", description: "Lead scraper" },
  { name: "Skip Trace", path: "/admin/skip-trace", icon: "Radar", category: "CRM & Leads", description: "Skip trace system" },
  { name: "Emails", path: "/admin/emails", icon: "Mail", category: "Communications", description: "Email management" },
  { name: "Xtreme Comms", path: "/admin/xtreme-comms", icon: "MessageSquare", category: "Communications", description: "Xtreme comms gateway" },
  { name: "Telnyx Manager", path: "/admin/telnyx", icon: "Smartphone", category: "Communications", description: "Telnyx SMS/voice" },
  { name: "AI Voice", path: "/admin/voice-assistant", icon: "PhoneCall", category: "Communications", description: "AI voice assistant" },
  { name: "Social Studio", path: "/admin/social-studio", icon: "Share2", category: "Communications", description: "Social media studio" },
];

export default function Contents() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [seedingCats, setSeedingCats] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["content-menu-items"],
    queryFn: () => base44.entities.ContentMenuItem.list("order", 500),
  });

  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ["content-menu-categories"],
    queryFn: () => base44.entities.ContentMenuCategory.list("order", 100),
  });

  const categoryMap = useMemo(() => {
    const m = {};
    for (const c of categories) m[c.name] = c;
    return m;
  }, [categories]);

  const grouped = useMemo(() => {
    const filtered = items.filter((it) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return it.name?.toLowerCase().includes(s) || it.description?.toLowerCase().includes(s) || it.category?.toLowerCase().includes(s);
    });
    const map = {};
    for (const cat of categories) {
      map[cat.name] = [];
    }
    const uncategorized = [];
    for (const it of filtered) {
      if (map[it.category] !== undefined) {
        map[it.category].push(it);
      } else {
        uncategorized.push(it);
      }
    }
    for (const cat of Object.keys(map)) {
      map[cat].sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    uncategorized.sort((a, b) => (a.order || 0) - (b.order || 0));
    if (uncategorized.length > 0) {
      map["Uncategorized"] = uncategorized;
    }
    return map;
  }, [items, categories, search]);

  const categoryOrder = useMemo(() => {
    const ordered = [...categories].sort((a, b) => (a.order || 0) - (b.order || 0)).map((c) => c.name);
    if (grouped["Uncategorized"]) ordered.push("Uncategorized");
    return ordered;
  }, [categories, grouped]);

  const seedCategories = async () => {
    setSeedingCats(true);
    try {
      const records = DEFAULT_CATEGORIES.map((c, i) => ({ ...c, order: i, active: true }));
      await base44.entities.ContentMenuCategory.bulkCreate(records);
      queryClient.invalidateQueries({ queryKey: ["content-menu-categories"] });
    } catch (e) {
      alert("Failed to seed categories: " + e.message);
    } finally {
      setSeedingCats(false);
    }
  };

  const seedDefaults = async () => {
    setSeeding(true);
    try {
      if (categories.length === 0) {
        const catRecords = DEFAULT_CATEGORIES.map((c, i) => ({ ...c, order: i, active: true }));
        await base44.entities.ContentMenuCategory.bulkCreate(catRecords);
      }
      const itemRecords = DEFAULT_ITEMS.map((d, i) => ({ ...d, order: i, active: true }));
      await base44.entities.ContentMenuItem.bulkCreate(itemRecords);
      queryClient.invalidateQueries({ queryKey: ["content-menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["content-menu-categories"] });
    } catch (e) {
      alert("Failed to seed: " + e.message);
    } finally {
      setSeeding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this menu item?")) return;
    await base44.entities.ContentMenuItem.delete(id);
    queryClient.invalidateQueries({ queryKey: ["content-menu-items"] });
  };

  const toggleActive = async (item) => {
    await base44.entities.ContentMenuItem.update(item.id, { active: !item.active });
    queryClient.invalidateQueries({ queryKey: ["content-menu-items"] });
  };

  const saveCategory = async (data, id) => {
    if (id) {
      const existing = categories.find((c) => c.id === id);
      const oldName = existing?.name;
      const newName = data.name;
      await base44.entities.ContentMenuCategory.update(id, data);
      if (oldName && newName && oldName !== newName) {
        const itemsToUpdate = items.filter((it) => it.category === oldName);
        if (itemsToUpdate.length > 0) {
          await base44.entities.ContentMenuItem.bulkUpdate(
            itemsToUpdate.map((it) => ({ id: it.id, category: newName }))
          );
        }
      }
    } else {
      await base44.entities.ContentMenuCategory.create({ ...data, order: categories.length, active: true });
    }
    queryClient.invalidateQueries({ queryKey: ["content-menu-categories"] });
    queryClient.invalidateQueries({ queryKey: ["content-menu-items"] });
  };

  const deleteCategory = async (id) => {
    await base44.entities.ContentMenuCategory.delete(id);
    queryClient.invalidateQueries({ queryKey: ["content-menu-categories"] });
  };

  const reorderCategories = async (updates) => {
    await base44.entities.ContentMenuCategory.bulkUpdate(updates);
    queryClient.invalidateQueries({ queryKey: ["content-menu-categories"] });
  };

  const onDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceCat = source.droppableId;
    const destCat = destination.droppableId;
    const sourceItems = [...(grouped[sourceCat] || [])];
    const [moved] = sourceItems.splice(source.index, 1);

    let newCat = sourceCat;
    let reordered;
    if (sourceCat === destCat) {
      sourceItems.splice(destination.index, 0, moved);
      reordered = sourceItems;
    } else {
      newCat = destCat;
      const destItems = [...(grouped[destCat] || [])];
      destItems.splice(destination.index, 0, { ...moved, category: destCat });
      reordered = destItems;
    }

    const updates = reordered.map((it, idx) => ({
      id: it.id,
      order: idx,
      category: newCat === "Uncategorized" ? it.category : newCat,
    }));
    try {
      await base44.entities.ContentMenuItem.bulkUpdate(updates);
      queryClient.invalidateQueries({ queryKey: ["content-menu-items"] });
    } catch (e) {
      alert("Reorder failed: " + e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <LayoutGrid className="h-7 w-7 text-amber-500" /> Contents Menu
          </h1>
          <p className="text-stone-500 mt-1">
            Categorized quick-access launcher for every admin tool. Manage categories, add items, and drag to reorder.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {categories.length === 0 && !catsLoading && (
            <button
              onClick={seedCategories}
              disabled={seedingCats}
              className="h-10 px-4 rounded-lg border border-stone-300 text-stone-700 text-sm font-bold flex items-center gap-2 hover:bg-stone-100"
            >
              {seedingCats ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />}
              Seed Categories
            </button>
          )}
          {items.length === 0 && !isLoading && (
            <button
              onClick={seedDefaults}
              disabled={seeding}
              className="h-10 px-4 rounded-lg border border-stone-300 text-stone-700 text-sm font-bold flex items-center gap-2 hover:bg-stone-100"
            >
              {seeding ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Seed Items
            </button>
          )}
          <button
            onClick={() => setShowCategoryManager(!showCategoryManager)}
            className="h-10 px-4 rounded-lg border border-stone-300 text-stone-700 text-sm font-bold flex items-center gap-2 hover:bg-stone-100"
          >
            <SlidersHorizontal className="h-4 w-4" /> Manage Categories
          </button>
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="h-10 px-4 rounded-lg bg-amber-500 text-stone-950 text-sm font-bold flex items-center gap-2 hover:bg-amber-400"
          >
            <Plus className="h-4 w-4" /> Add Item
          </button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <input
          placeholder="Search menu items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-9 pr-3 rounded-lg border border-stone-200 text-sm focus:border-amber-500 outline-none"
        />
      </div>

      {showCategoryManager && (
        <CategoryManager
          categories={categories}
          onSave={saveCategory}
          onDelete={deleteCategory}
          onReorder={reorderCategories}
          onClose={() => setShowCategoryManager(false)}
        />
      )}

      {showForm && (
        <ItemForm
          editing={editing}
          existingCategories={categories.map((c) => c.name)}
          onSave={async (data) => {
            if (editing?.id) {
              await base44.entities.ContentMenuItem.update(editing.id, data);
            } else {
              await base44.entities.ContentMenuItem.create({ ...data, order: items.length, active: true });
            }
            queryClient.invalidateQueries({ queryKey: ["content-menu-items"] });
            setShowForm(false);
            setEditing(null);
          }}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {isLoading || catsLoading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-6 w-6 animate-spin text-stone-400" />
        </div>
      ) : categories.length === 0 && items.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <LayoutGrid className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="mb-1">No categories or items yet.</p>
          <p className="text-sm">Click "Seed Categories" to load the researched defaults, then "Seed Items" to add all admin pages.</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="space-y-6">
            {categoryOrder.map((catName) => {
              const cat = categoryMap[catName];
              const colorClass = cat?.color_class || (catName === "Uncategorized" ? "border-stone-300 bg-stone-50/50" : "border-stone-200 bg-white");
              const CatIcon = cat?.icon ? (ALL_ICONS[cat.icon] || FolderTree) : FolderTree;
              const catItems = grouped[catName] || [];
              return (
                <div key={catName} className={`rounded-2xl border-2 p-4 ${colorClass}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <CatIcon className="h-4 w-4 text-stone-500" />
                    <h2 className="text-sm font-bold text-stone-700 uppercase tracking-wide">{catName}</h2>
                    <span className="text-xs text-stone-400">({catItems.length})</span>
                    {cat && (
                      <span className="ml-auto text-xs text-stone-400 hidden sm:block truncate max-w-xs">{cat.description}</span>
                    )}
                  </div>
                  <Droppable droppableId={catName} direction="horizontal">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex flex-wrap gap-3 min-h-[80px] rounded-xl p-2 transition ${snapshot.isDraggingOver ? "bg-white/60" : ""}`}
                      >
                        {catItems.map((item, idx) => (
                          <Draggable key={item.id} draggableId={item.id} index={idx}>
                            {(prov, snap) => (
                              <div
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                className={`group relative w-44 rounded-xl border bg-white p-3 shadow-sm hover:shadow-md transition ${snap.isDragging ? "shadow-lg ring-2 ring-amber-400" : ""} ${item.active ? "border-stone-200" : "border-stone-200 opacity-50"}`}
                              >
                                <div className="flex items-start gap-2">
                                  <div className="shrink-0 w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 grid place-items-center text-amber-600">
                                    {(() => {
                                      const Ico = ALL_ICONS[item.icon] || LayoutGrid;
                                      return <Ico className="h-4 w-4" />;
                                    })()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <Link to={item.path} className="block text-sm font-bold text-stone-900 hover:text-amber-600 truncate">
                                      {item.name}
                                    </Link>
                                    {item.description && (
                                      <p className="text-[11px] text-stone-400 line-clamp-2 mt-0.5">{item.description}</p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 mt-2 pt-2 border-t border-stone-100">
                                  <Link
                                    to={item.path}
                                    className="flex-1 h-7 rounded-lg bg-stone-900 text-white text-xs font-bold flex items-center justify-center gap-1 hover:bg-amber-500 hover:text-stone-950 transition"
                                  >
                                    Open <ArrowRight className="h-3 w-3" />
                                  </Link>
                                  <button
                                    onClick={() => toggleActive(item)}
                                    className="h-7 w-7 grid place-items-center rounded-lg border border-stone-200 text-stone-400 hover:text-stone-700"
                                    title={item.active ? "Hide" : "Show"}
                                  >
                                    {item.active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                  </button>
                                  <button
                                    onClick={() => { setEditing(item); setShowForm(true); }}
                                    className="h-7 w-7 grid place-items-center rounded-lg border border-stone-200 text-stone-400 hover:text-amber-600 hover:border-amber-400"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item.id)}
                                    className="h-7 w-7 grid place-items-center rounded-lg border border-stone-200 text-stone-400 hover:text-red-600 hover:border-red-400"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>

                                <div
                                  {...prov.dragHandleProps}
                                  className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition cursor-grab active:cursor-grabbing text-stone-300 hover:text-stone-500"
                                  title="Drag to move"
                                >
                                  <GripVertical className="h-4 w-4" />
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {catItems.length === 0 && (
                          <p className="text-xs text-stone-400 italic py-4 px-2">No items in this category yet.</p>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      <p className="text-xs text-stone-400 text-center pt-4">
        Tip: Drag any card to reorder within a category or move it to another. Click "Manage Categories" to add, rename, recolor, or delete categories.
      </p>
    </div>
  );
}

function ItemForm({ editing, existingCategories, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: editing?.name || "",
    path: editing?.path || "/admin/",
    icon: editing?.icon || "Sparkles",
    category: editing?.category || (existingCategories[0] || "Command & Control"),
    description: editing?.description || "",
    active: editing?.active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim() || !form.path.trim() || !form.category.trim()) {
      alert("Name, path, and category are required.");
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
    } catch (e) {
      alert("Failed to save: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-stone-900">{editing ? "Edit Menu Item" : "Add Menu Item"}</h3>
        <button onClick={onCancel} className="text-stone-400 hover:text-stone-600"><X className="h-4 w-4" /></button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-stone-500 mb-1 block">Name *</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Lead Manager"
            className="w-full h-10 px-3 rounded-lg border border-stone-200 text-sm focus:border-amber-500 outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-stone-500 mb-1 block">Path *</label>
          <input
            value={form.path}
            onChange={(e) => setForm({ ...form, path: e.target.value })}
            placeholder="/admin/leads"
            className="w-full h-10 px-3 rounded-lg border border-stone-200 text-sm font-mono focus:border-amber-500 outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-stone-500 mb-1 block">Category *</label>
          <input
            list="cat-options"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="Command & Control"
            className="w-full h-10 px-3 rounded-lg border border-stone-200 text-sm focus:border-amber-500 outline-none"
          />
          <datalist id="cat-options">
            {existingCategories.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>
        <div>
          <label className="text-xs font-semibold text-stone-500 mb-1 block">Icon</label>
          <select
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            className="w-full h-10 px-3 rounded-lg border border-stone-200 text-sm bg-white focus:border-amber-500 outline-none"
          >
            {Object.keys(ALL_ICONS).sort().map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-stone-500 mb-1 block">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
          placeholder="What does this tool do?"
          className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:border-amber-500 outline-none"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => setForm({ ...form, active: e.target.checked })}
          className="rounded"
        />
        Active (visible in menu)
      </label>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-10 px-5 rounded-lg bg-amber-500 text-stone-950 text-sm font-bold flex items-center gap-2 hover:bg-amber-400 disabled:opacity-50"
        >
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {editing ? "Update" : "Add"} Item
        </button>
        <button onClick={onCancel} className="h-10 px-4 rounded-lg border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50">
          Cancel
        </button>
      </div>
    </div>
  );
}