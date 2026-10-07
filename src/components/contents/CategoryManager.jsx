import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Plus, Trash2, Pencil, GripVertical, X, Check, RefreshCw,
  FolderTree, LayoutGrid,
} from "lucide-react";

export const ICON_MAP = {
  Sparkles, Shield, Layers, Boxes, Package, Zap, Globe, Crown, Wand2,
  Bot, Network, Gauge, Rocket, Wrench, Brain, Building2, Cpu, Compass,
  Eye, EyeOff, Workflow, BookOpen, Users, KanbanSquare, Mail, Star,
  Radar, MapPin, MessageSquare, Smartphone, PhoneCall, Share2, BarChart3,
  Activity, KeyRound, Factory, Layout, ListOrdered, Code2, TrendingUp,
  Heart, ScrollText, Database, Target, Settings, UserCircle, Menu,
  Grid3x3, FolderTree, Bookmark, Flag, Tag, Hash, FolderPlus,
};

export const COLOR_OPTIONS = [
  { label: "Amber", class: "border-amber-300 bg-amber-50/50" },
  { label: "Blue", class: "border-blue-300 bg-blue-50/50" },
  { label: "Purple", class: "border-purple-300 bg-purple-50/50" },
  { label: "Emerald", class: "border-emerald-300 bg-emerald-50/50" },
  { label: "Cyan", class: "border-cyan-300 bg-cyan-50/50" },
  { label: "Orange", class: "border-orange-300 bg-orange-50/50" },
  { label: "Pink", class: "border-pink-300 bg-pink-50/50" },
  { label: "Indigo", class: "border-indigo-300 bg-indigo-50/50" },
  { label: "Stone", class: "border-stone-300 bg-stone-50/50" },
  { label: "Red", class: "border-red-300 bg-red-50/50" },
  { label: "Green", class: "border-green-300 bg-green-50/50" },
  { label: "Slate", class: "border-slate-300 bg-slate-50/50" },
];

export default function CategoryManager({ categories, onSave, onDelete, onReorder, onClose }) {
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const sorted = [...categories].sort((a, b) => (a.order || 0) - (b.order || 0));

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const reordered = [...sorted];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    await onReorder(reordered.map((c, i) => ({ id: c.id, order: i })));
  };

  const handleDelete = (cat) => {
    if (!confirm(`Delete category "${cat.name}"? Items in it will become Uncategorized.`)) return;
    onDelete(cat.id);
  };

  return (
    <div className="rounded-2xl border-2 border-stone-300 bg-stone-50 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-stone-900 flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-amber-500" /> Manage Categories
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Add, rename, recolor, reorder, or delete categories. Renaming updates all items in that category.
          </p>
        </div>
        <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      {showForm ? (
        <CategoryForm
          editing={editing}
          onSave={async (data) => {
            await onSave(data, editing?.id);
            setShowForm(false);
            setEditing(null);
          }}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      ) : (
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="h-9 px-3 rounded-lg bg-amber-500 text-stone-950 text-sm font-bold flex items-center gap-2 hover:bg-amber-400"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="category-list">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
              {sorted.map((cat, idx) => {
                const Ico = ICON_MAP[cat.icon] || FolderTree;
                return (
                  <Draggable key={cat.id} draggableId={cat.id} index={idx}>
                    {(prov, snap) => (
                      <div
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        className={`flex items-center gap-3 bg-white rounded-lg border p-3 transition ${snap.isDragging ? "shadow-lg ring-2 ring-amber-400" : "border-stone-200"}`}
                      >
                        <div {...prov.dragHandleProps} className="cursor-grab active:cursor-grabbing text-stone-300 hover:text-stone-500">
                          <GripVertical className="h-4 w-4" />
                        </div>
                        <div className={`shrink-0 w-8 h-8 rounded-lg grid place-items-center border ${cat.color_class || "border-stone-200 bg-stone-50"}`}>
                          <Ico className="h-4 w-4 text-stone-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-stone-900 text-sm truncate">{cat.name}</span>
                            {!cat.active && <span className="text-[10px] text-red-500 font-bold">HIDDEN</span>}
                          </div>
                          {cat.description && (
                            <p className="text-xs text-stone-400 truncate">{cat.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => { setEditing(cat); setShowForm(true); }}
                          className="h-8 w-8 grid place-items-center rounded-lg border border-stone-200 text-stone-400 hover:text-amber-600 hover:border-amber-400"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          className="h-8 w-8 grid place-items-center rounded-lg border border-stone-200 text-stone-400 hover:text-red-600 hover:border-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {sorted.length === 0 && (
        <p className="text-center text-sm text-stone-400 py-4">
          No categories yet. Click "Add Category" to create your first one.
        </p>
      )}
    </div>
  );
}

function CategoryForm({ editing, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: editing?.name || "",
    description: editing?.description || "",
    icon: editing?.icon || "FolderTree",
    color_class: editing?.color_class || COLOR_OPTIONS[0].class,
    active: editing?.active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert("Category name is required.");
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
    <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-stone-900 text-sm">{editing ? "Edit Category" : "Add Category"}</h4>
        <button onClick={onCancel} className="text-stone-400 hover:text-stone-600"><X className="h-4 w-4" /></button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-stone-500 mb-1 block">Name *</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. AI & Agents"
            className="w-full h-10 px-3 rounded-lg border border-stone-200 text-sm focus:border-amber-500 outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-stone-500 mb-1 block">Icon</label>
          <select
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            className="w-full h-10 px-3 rounded-lg border border-stone-200 text-sm bg-white focus:border-amber-500 outline-none"
          >
            {Object.keys(ICON_MAP).sort().map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-stone-500 mb-1 block">Description</label>
        <input
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="What does this category cover?"
          className="w-full h-10 px-3 rounded-lg border border-stone-200 text-sm focus:border-amber-500 outline-none"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-stone-500 mb-2 block">Color</label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c.label}
              onClick={() => setForm({ ...form, color_class: c.class })}
              className={`h-9 px-3 rounded-lg border-2 text-xs font-bold flex items-center gap-1.5 transition ${c.class} ${form.color_class === c.class ? "ring-2 ring-amber-400 border-stone-900" : "border-stone-200"}`}
            >
              {c.label}
            </button>
          ))}
        </div>
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
          {editing ? "Update" : "Add"} Category
        </button>
        <button onClick={onCancel} className="h-10 px-4 rounded-lg border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50">
          Cancel
        </button>
      </div>
    </div>
  );
}